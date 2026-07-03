import { useEffect } from 'react';
import { toast } from 'sonner';

type Priority = 'low' | 'med' | 'high';
interface Task {
  id: string;
  title: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
}

const STORAGE = 'tasks-v1';
const NOTIFIED_KEY = 'tasks-notified-v1';
const ENABLED_KEY = 'notifications-enabled';

const loadNotified = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}'); } catch { return {}; }
};
const saveNotified = (m: Record<string, number>) => {
  // prune entries older than 24h
  const cutoff = Date.now() - 24 * 3600 * 1000;
  const pruned = Object.fromEntries(Object.entries(m).filter(([, t]) => t > cutoff));
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(pruned));
};

/**
 * Polls the advanced Tasks list (`tasks-v1`) each minute and fires a browser
 * notification (or toast fallback) when a task's due time is within 15 min or overdue.
 * Each task is notified at most once per 24h to avoid noise.
 */
export function useTaskReminders() {
  useEffect(() => {
    const enabled = localStorage.getItem(ENABLED_KEY) !== 'false';
    if (!enabled) return;

    const check = () => {
      let tasks: Task[] = [];
      try { tasks = JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return; }
      if (!Array.isArray(tasks) || tasks.length === 0) return;

      const now = Date.now();
      const notified = loadNotified();
      let changed = false;

      for (const t of tasks) {
        if (t.completed || !t.dueDate) continue;
        const due = new Date(t.dueDate).getTime();
        if (isNaN(due)) continue;
        const diffMin = (due - now) / 60000;
        // Trigger window: due within 15 min OR up to 60 min overdue
        if (diffMin > 15 || diffMin < -60) continue;
        if (notified[t.id]) continue;

        const overdue = diffMin < 0;
        const title = overdue ? 'مهمة متأخّرة' : 'تذكير مهمّة';
        const body = overdue
          ? `${t.title} — تأخّرت ${Math.abs(Math.round(diffMin))} دقيقة`
          : `${t.title} — خلال ${Math.max(1, Math.round(diffMin))} دقيقة`;

        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, tag: `task-${t.id}`, icon: '/favicon.ico' });
          } else {
            toast(title, { description: body });
          }
        } catch {
          toast(title, { description: body });
        }
        notified[t.id] = now;
        changed = true;
      }
      if (changed) saveNotified(notified);
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, []);
}
