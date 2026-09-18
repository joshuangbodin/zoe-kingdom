import * as Notifications from "expo-notifications";
import type { Habit } from "@/libs/sqlite/habits";

// OS-level daily reminders for habits. Schedules live in the OS so they fire
// even when the app is closed / killed. Best-effort; never throws.
export const HABIT_REMINDER_MARKER = "zoe.habitReminder";

type ScheduledLike = { identifier: string; content?: { data?: Record<string, unknown> } };

export const reminderSubtitle = (habit: Habit): string => {
  if (habit.frequency === "twice_daily") {
    const hour = Number(String(habit.remindAt ?? "0:00").split(":")[0] ?? 0);
    return hour < 12 ? "morning" : "evening";
  }
  return habit.frequency.replace("_", " ");
};

export const isHabitReminderRequest = (
  request: ScheduledLike | undefined,
): boolean => Boolean(request?.content?.data?.[HABIT_REMINDER_MARKER]);

export const installNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
    handleError: (id, err) => console.warn("notification handling failed:", id, err),
  });
};

export const ensureNotificationPermission = async (): Promise<void> => {
  try {
    const perms = await Notifications.getPermissionsAsync();
    const granted =
      perms.granted || perms.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (granted) return;
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true, allowProvisional: true },
    });
  } catch (err) {
    console.warn("notifications permission prompt failed:", err);
  }
};

export const scheduleReminderForHabit = async (habit: Habit): Promise<void> => {
  if (!habit.remindEnabled || !habit.remindAt) return;
  const [h, m] = habit.remindAt.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return;
  const when = reminderSubtitle(habit);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: habit.title,
      body: `Time for your ${when} habit`,
      data: { [HABIT_REMINDER_MARKER]: true, habitId: habit.id, remindAt: habit.remindAt },
      sound: "default",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      color: habit.color,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
  });
};

export const cancelAllHabitReminders = async (): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      if (!isHabitReminderRequest(request)) continue;
      try {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      } catch (err) { console.warn("cancel reminder failed:", err); }
    }
  } catch (err) { console.warn("list scheduled reminders failed:", err); }
};

export const rescheduleAllHabitReminders = async (habits: Habit[]): Promise<void> => {
  cancelAllHabitReminders();
  for (const habit of habits) {
    if (!habit.remindEnabled || !habit.remindAt) continue;
    try { await scheduleReminderForHabit(habit); }
    catch (err) { console.warn("schedule reminder failed:", err); }
  }
};
