import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'reading_session_id';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now().toString(36)}`;
  }
}

interface Options {
  postId: string;
  language?: string;
  enabled?: boolean;
}

/**
 * Tracks scroll depth, time on page, and active section for a post view.
 * Sends one aggregated record on unmount / page hide.
 */
export function useReadingAnalytics({ postId, language, enabled = true }: Options) {
  const startTime = useRef<number>(Date.now());
  const maxScroll = useRef<number>(0);
  const activeSection = useRef<string | null>(null);
  const sent = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !postId) return;

    startTime.current = Date.now();
    maxScroll.current = 0;
    activeSection.current = null;
    sent.current = false;
    const sessionId = getSessionId();

    const computeScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        (document.documentElement.scrollHeight || document.body.scrollHeight) -
        window.innerHeight;
      if (docHeight <= 0) return 100;
      return Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100)));
    };

    const onScroll = () => {
      const d = computeScroll();
      if (d > maxScroll.current) maxScroll.current = d;

      // Track active section (nearest H2/H3 above viewport top)
      const headings = document.querySelectorAll<HTMLElement>(
        '.post-content h1, .post-content h2, .post-content h3'
      );
      let current: string | null = null;
      const offset = 120;
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          current = h.id || h.textContent?.slice(0, 80) || null;
        }
      });
      if (current) activeSection.current = current;
    };

    const send = () => {
      if (sent.current) return;
      const elapsed = Math.round((Date.now() - startTime.current) / 1000);
      if (elapsed < 2) return; // filter accidental hits
      sent.current = true;

      const payload = {
        post_id: postId,
        session_id: sessionId,
        scroll_depth: maxScroll.current,
        time_on_page: elapsed,
        section_id: activeSection.current,
        language: language || null,
      };

      // Fire-and-forget
      supabase.from('reading_analytics').insert(payload).then(() => {}, () => {});
    };

    const onHide = () => {
      if (document.visibilityState === 'hidden') send();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', send);
    window.addEventListener('beforeunload', send);

    // Initial calc
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', send);
      window.removeEventListener('beforeunload', send);
      send();
    };
  }, [postId, enabled, language]);
}
