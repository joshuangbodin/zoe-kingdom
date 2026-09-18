// Mounted once in _layout: registers the notification handler, prompts for
// permission, re-syncs OS daily reminders from local habits, and deep-links
// to the habit screen when a reminder is tapped.
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect } from "react";

import {
  HABIT_REMINDER_MARKER,
  ensureNotificationPermission,
  installNotificationHandler,
  rescheduleAllHabitReminders,
} from "@/libs/reminders/scheduleHabitNotifications";
import { getHabits } from "@/libs/sqlite/habits";

export default function HabitNotificationBootstrap() {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    installNotificationHandler();
    ensureNotificationPermission();

    (async () => {
      try {
        const habits = await getHabits();
        await rescheduleAllHabitReminders(habits);
      } catch (err) {
        console.warn("habit reminder reschedule failed:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    const data = response.notification?.request?.content?.data ?? {};
    if (!data?.[HABIT_REMINDER_MARKER]) return;

    const habitId = data?.habitId;
    if (habitId) {
      router.replace({
        pathname: "/(habit)/completehabit",
        params: { id: String(habitId) },
      });
    } else {
      router.replace("/(tabs)/habits");
    }
    Notifications.clearLastNotificationResponseAsync().catch(() => {});
  }, [response]);

  return null;
}
