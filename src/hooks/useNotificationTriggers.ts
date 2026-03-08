import { useEffect, useRef } from 'react';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useNotificationStore } from '@/components/notifications/NotificationBell';

/**
 * Hook that watches store changes and fires notifications.
 * Should be mounted once in the app (e.g. MainLayout).
 */
export function useNotificationTriggers() {
  const { addNotification } = useNotificationStore();

  // Track previous counts to detect new additions
  const prevCommentCount = useRef<number | null>(null);
  const prevPostCount = useRef<number | null>(null);
  const prevRoadmapProgress = useRef<Map<string, number>>(new Map());
  const prevMilestones = useRef<Set<string>>(new Set());

  const comments = useBlogStore((s) => s.comments);
  const posts = useBlogStore((s) => s.posts);
  const roadmaps = useRoadmapStore((s) => s.roadmaps);
  const roadmapSections = useRoadmapStore((s) => s.roadmapSections);

  // --- Comment notifications ---
  useEffect(() => {
    if (prevCommentCount.current === null) {
      prevCommentCount.current = comments.length;
      return;
    }
    if (comments.length > prevCommentCount.current) {
      const newComments = comments.length - prevCommentCount.current;
      const latest = comments[comments.length - 1];
      addNotification({
        type: 'comment',
        title: newComments > 1 ? `${newComments} تعليقات جديدة` : 'تعليق جديد',
        message: latest
          ? `${latest.authorName}: ${latest.content.slice(0, 80)}${latest.content.length > 80 ? '...' : ''}`
          : 'تم إضافة تعليق جديد على مقالتك',
      });
    }
    prevCommentCount.current = comments.length;
  }, [comments.length]);

  // --- Post milestone achievements ---
  useEffect(() => {
    if (prevPostCount.current === null) {
      prevPostCount.current = posts.length;
      // Initialize milestones already reached
      const milestones = [5, 10, 25, 50, 100];
      milestones.forEach((m) => {
        if (posts.length >= m) prevMilestones.current.add(`posts-${m}`);
      });
      return;
    }

    const milestones = [5, 10, 25, 50, 100];
    for (const milestone of milestones) {
      const key = `posts-${milestone}`;
      if (posts.length >= milestone && !prevMilestones.current.has(key)) {
        prevMilestones.current.add(key);
        addNotification({
          type: 'achievement',
          title: `🎉 إنجاز: ${milestone} مقال!`,
          message: `تهانينا! لقد وصلت إلى ${milestone} مقال. استمر في العمل الرائع!`,
        });
      }
    }

    // Notify on first published post
    if (posts.length > prevPostCount.current) {
      const newPost = posts[posts.length - 1];
      if (newPost?.status === 'published' && !prevMilestones.current.has('first-publish')) {
        const publishedCount = posts.filter((p) => p.status === 'published').length;
        if (publishedCount === 1) {
          prevMilestones.current.add('first-publish');
          addNotification({
            type: 'achievement',
            title: '🚀 أول مقال منشور!',
            message: `تم نشر مقالك الأول "${newPost.title}" بنجاح!`,
          });
        }
      }
    }

    prevPostCount.current = posts.length;
  }, [posts.length]);

  // --- Roadmap progress notifications ---
  useEffect(() => {
    if (roadmaps.length === 0) return;

    for (const roadmap of roadmaps) {
      const sections = roadmapSections.filter((s) => s.roadmapId === roadmap.id);
      const totalTopics = sections.reduce((sum, s) => sum + s.topics.length, 0);
      if (totalTopics === 0) continue;

      const completedTopics = sections.reduce(
        (sum, s) => sum + s.topics.filter((t) => t.completed).length,
        0
      );
      const percentage = Math.round((completedTopics / totalTopics) * 100);
      const prevPct = prevRoadmapProgress.current.get(roadmap.id);

      if (prevPct === undefined) {
        prevRoadmapProgress.current.set(roadmap.id, percentage);
        continue;
      }

      // Check milestones: 25%, 50%, 75%, 100%
      const progressMilestones = [25, 50, 75, 100];
      for (const ms of progressMilestones) {
        const key = `roadmap-${roadmap.id}-${ms}`;
        if (percentage >= ms && prevPct < ms && !prevMilestones.current.has(key)) {
          prevMilestones.current.add(key);

          if (ms === 100) {
            addNotification({
              type: 'roadmap',
              title: `🏆 اكتملت خريطة الطريق!`,
              message: `تهانينا! أكملت جميع مواضيع "${roadmap.title}"`,
            });
          } else {
            addNotification({
              type: 'roadmap',
              title: `📈 تقدم: ${ms}% في ${roadmap.title}`,
              message: `أحسنت! أكملت ${completedTopics} من ${totalTopics} موضوع.`,
            });
          }
        }
      }

      prevRoadmapProgress.current.set(roadmap.id, percentage);
    }
  }, [roadmaps, roadmapSections]);

  // --- Views milestone ---
  useEffect(() => {
    const totalViews = posts.reduce((sum, p) => sum + p.viewsCount, 0);
    const viewMilestones = [100, 500, 1000, 5000];

    for (const ms of viewMilestones) {
      const key = `views-${ms}`;
      if (totalViews >= ms && !prevMilestones.current.has(key)) {
        prevMilestones.current.add(key);
        addNotification({
          type: 'achievement',
          title: `👁️ ${ms.toLocaleString()} مشاهدة!`,
          message: `وصل إجمالي مشاهدات مقالاتك إلى ${totalViews.toLocaleString()} مشاهدة.`,
        });
      }
    }
  }, [posts]);
}
