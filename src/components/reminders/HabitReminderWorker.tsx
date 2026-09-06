import { useCallback, useEffect, useRef } from "react";

import { useToast } from "@/components/Toast";
import { getDueReminderHabits } from "@/libs/reminders/habitReminders";

/**
 * Global, self-contained habit reminder poller.
 *
 * Mounted once inside ToastProvider (see `_layout`). Every 30s it looks for
 * habits whose reminder is due right now (works fully offline / guest mode).
 * Any hits are surfaced as in-app notifications. A rolled-over day/minute
 * dedup guard stops the same reminder from spamming more than once a day.
 *
 * This is the client side of "push notifications for habits". It fires an
 * always-visible in-app alert the moment a habit is due. Connecting an actual
 * OS/device push payload would run on a trusted server (the device only holds
 * data, never sends its own push), so this in-app layer is what the app can
 * guarantee offline.
 */
export default function HabitReminderWorker() {
  const { showToast } = useToast();

  // Set of "habitId|YYYY-MM-DD" keys already notified today.
  const notified = useRef(new Set<string>());

  const poll = useCallback(async () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    try {
      const due = await getDueReminderHabits(now);
      for (const habit of due) {
        const key = `${habit.id}|${today}`;
        if (notified.current.has(key)) continue;
        notified.current.add(key);

        const hour = now.getHours();
        const when = habit.frequency === "twice_daily"
          ? (hour < 12 ? "morning" : "evening")
          : habit.frequency;
        showToast(`⏰ ${habit.title} — time for your ${when} habit`, "info");
      }
    } catch (e) {
      // Reminders are best-effort; never crash the app over them.
      console.warn("Reminder poll failed:", e);
    }
  }, [showToast]);

  useEffect(() => {
    // First check shortly after mount, then every 30s.
    poll();
    const timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, [poll]);

  // Render nothing — the worker is a silent background listener.
  return null;
}