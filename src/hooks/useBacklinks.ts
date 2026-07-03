import { useMemo } from 'react';
import { useBlogStore } from '@/store/blogStore';
import { buildBacklinksIndex, extractOutgoingLinks } from '@/lib/backlinks';
import type { Post } from '@/types/blog';

/**
 * Returns the posts that link *to* the given post id (backlinks / incoming).
 */
export function useBacklinks(postId: string | undefined): Post[] {
  const posts = useBlogStore(s => s.posts);
  return useMemo(() => {
    if (!postId) return [];
    const idx = buildBacklinksIndex(posts);
    const sourceIds = idx.get(postId) ?? [];
    return sourceIds
      .map(id => posts.find(p => p.id === id))
      .filter((p): p is Post => Boolean(p));
  }, [posts, postId]);
}

/**
 * Returns the posts that the given post links to (outgoing).
 */
export function useOutgoingLinks(postId: string | undefined): Post[] {
  const posts = useBlogStore(s => s.posts);
  return useMemo(() => {
    if (!postId) return [];
    const src = posts.find(p => p.id === postId);
    if (!src) return [];
    const ids = extractOutgoingLinks(src, posts);
    return ids
      .map(id => posts.find(p => p.id === id))
      .filter((p): p is Post => Boolean(p));
  }, [posts, postId]);
}
