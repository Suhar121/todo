import { useEffect, useRef } from 'react';
import { AppUser, Task } from '../types';
import { getLocalDateKey, taskDateKey } from './utils';

export function useTelegramReminders(user: AppUser | null, tasks: Task[]) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.telegramToken || !user?.telegramChatId) return;

    const sendTelegramMessage = async (text: string) => {
      try {
        const resp = await fetch(`https://api.telegram.org/bot${user.telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.telegramChatId,
            text,
          }),
        });

        const result = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.error('Telegram API error:', result?.description || result || 'Unknown error');
          return false;
        }

        return true;
      } catch (err) {
        console.error('Telegram network error:', err);
        return false;
      }
    };

    const checkAndSendReminders = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const todayKey = getLocalDateKey(now);

      // 1) Time-specific reminders for today
      const dueNowTasks = tasks.filter((t) => {
        const dueKey = taskDateKey(t.dueDate);
        return t.status !== 'completed' && dueKey === todayKey && t.reminderTime === timeString;
      });

      for (const task of dueNowTasks) {
        const memoKey = `telegram_notified_${task.id}_${todayKey}_${timeString}`;
        if (localStorage.getItem(memoKey)) continue;

        const message = [
          '⏰ Reminder from FocusFlow',
          '',
          `Task: ${task.title}`,
          task.description ? `Note: ${task.description}` : undefined,
        ]
          .filter(Boolean)
          .join('\n');

        const sent = await sendTelegramMessage(message);
        if (sent) {
          localStorage.setItem(memoKey, 'true');
        }
      }

      // 2) Daily summary at 12:00
      if (currentHour === 12 && currentMinute === 0) {
        const digestKey = `last_telegram_digest_date_${todayKey}`;
        if (localStorage.getItem(digestKey)) return;

        const todaysTasks = tasks.filter((t) => t.status !== 'completed' && taskDateKey(t.dueDate) === todayKey);
        if (!todaysTasks.length) return;

        const lines = todaysTasks.map((task, i) => {
          const timePart = task.reminderTime ? ` (at ${task.reminderTime})` : '';
          return `${i + 1}. ${task.title}${timePart}`;
        });

        const digestMessage = [
          '📝 Daily agenda from FocusFlow',
          '',
          `You have ${todaysTasks.length} task(s) due today:`,
          ...lines,
          '',
          "Let's get to work!",
        ].join('\n');

        const sent = await sendTelegramMessage(digestMessage);
        if (sent) {
          localStorage.setItem(digestKey, 'true');
        }
      }
    };

    // Run once immediately, then align checks to minute boundaries.
    void checkAndSendReminders();

    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    timeoutRef.current = window.setTimeout(() => {
      void checkAndSendReminders();
      intervalRef.current = window.setInterval(() => {
        void checkAndSendReminders();
      }, 60000);
    }, msToNextMinute);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, tasks]);
}
