import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/components/notifications/NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';

const KEY = 'weekly-review-notified-iso-week';

function isoWeekKey(d = new Date()) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((x.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${x.getUTCFullYear()}-W${week}`;
}

/**
 * On Friday/Saturday/Sunday, drop a single "review your week" notification per ISO week.
 */
export function useWeeklyReviewReminder() {
  const { addNotification } = useNotificationStore();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const now = new Date();
    const dow = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    if (dow !== 5 && dow !== 6 && dow !== 0) return;

    const week = isoWeekKey(now);
    if (localStorage.getItem(KEY) === week) return;

    localStorage.setItem(KEY, week);
    fired.current = true;
    addNotification({
      type: 'info',
      title: isAr ? 'حان وقت مراجعة الأسبوع' : 'Time for your weekly review',
      message: isAr
        ? 'افتح صفحة "مراجعة الأسبوع" لترى ما أنجزته وما تبقى.'
        : 'Open Weekly Review to see what shipped and what remains.',
    });
  }, [addNotification, isAr]);
}
