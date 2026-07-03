import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationStore } from '@/components/notifications/NotificationBell';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'shared_comments_last_check';
const POLL_MS = 60_000; // 1 min

/**
 * Polls for comments authored by other users on the current user's shared
 * snippets/gallery items and pushes a notification for each new one.
 */
export function useSharedCommentNotifications() {
  const { addNotification } = useNotificationStore();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const running = useRef(false);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const check = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) return;

        const since = localStorage.getItem(STORAGE_KEY) ?? new Date(Date.now() - 24 * 3600_000).toISOString();

        // Fetch my publication ids for both types
        const [{ data: mySnips }, { data: myGal }] = await Promise.all([
          supabase.from('shared_snippets').select('id, title').eq('user_id', uid),
          supabase.from('shared_gallery_items').select('id, title').eq('user_id', uid),
        ]);

        const snipMap = new Map((mySnips ?? []).map(r => [r.id as string, r.title as string]));
        const galMap  = new Map((myGal  ?? []).map(r => [r.id as string, r.title as string]));

        if (snipMap.size === 0 && galMap.size === 0) return;

        const ids = [...snipMap.keys(), ...galMap.keys()];
        const { data: comments } = await supabase
          .from('shared_item_comments')
          .select('*')
          .in('item_id', ids)
          .gt('created_at', since)
          .neq('user_id', uid)
          .order('created_at', { ascending: true })
          .limit(20);

        if (cancelled) return;

        for (const c of comments ?? []) {
          const isSnip = c.item_type === 'snippet';
          const title = isSnip ? snipMap.get(c.item_id) : galMap.get(c.item_id);
          if (!title) continue;
          const author = c.author_name || (isAr ? 'مستخدم' : 'someone');
          addNotification({
            type: 'comment',
            title: isAr ? 'تعليق جديد على منشورك' : 'New comment on your publication',
            message: isAr
              ? `${author} علّق على "${title}": ${String(c.body).slice(0, 80)}`
              : `${author} commented on "${title}": ${String(c.body).slice(0, 80)}`,
          });
        }

        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      } catch {
        // silent
      } finally {
        running.current = false;
      }
    };

    check();
    timer = window.setInterval(check, POLL_MS);
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [addNotification, isAr]);
}
