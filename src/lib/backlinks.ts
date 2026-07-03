import type { Post } from '@/types/blog';

/**
 * Extract outgoing links from a post's content.
 * Supported syntax:
 *   [[Post Title]]           → matches by title (case-insensitive)
 *   [[slug:my-slug]]         → matches by slug
 *   /posts/{id}              → matches by id
 *   href="/posts/{id}"       → matches by id
 * Returns unique target post ids (excluding self).
 */
export function extractOutgoingLinks(post: Pick<Post, 'id' | 'content'>, allPosts: Post[]): string[] {
  if (!post?.content) return [];
  const content = post.content;
  const found = new Set<string>();

  // [[ ... ]] wiki-style
  const wikiRe = /\[\[([^\]]{1,200})\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = wikiRe.exec(content)) !== null) {
    const raw = m[1].trim();
    if (!raw) continue;
    if (raw.toLowerCase().startsWith('slug:')) {
      const slug = raw.slice(5).trim().toLowerCase();
      const t = allPosts.find(p => p.slug?.toLowerCase() === slug);
      if (t && t.id !== post.id) found.add(t.id);
    } else {
      const title = raw.toLowerCase();
      const t = allPosts.find(p => p.title?.toLowerCase() === title);
      if (t && t.id !== post.id) found.add(t.id);
    }
  }

  // /posts/{id}
  const idRe = /\/posts\/([a-zA-Z0-9_-]+)/g;
  while ((m = idRe.exec(content)) !== null) {
    const id = m[1];
    if (id === 'new' || id === post.id) continue;
    if (allPosts.some(p => p.id === id)) found.add(id);
  }

  return Array.from(found);
}

/**
 * Build a full backlinks index: target post id → source post ids that link to it.
 */
export function buildBacklinksIndex(posts: Post[]): Map<string, string[]> {
  const idx = new Map<string, string[]>();
  for (const src of posts) {
    const targets = extractOutgoingLinks(src, posts);
    for (const t of targets) {
      const arr = idx.get(t) ?? [];
      arr.push(src.id);
      idx.set(t, arr);
    }
  }
  return idx;
}

export interface GraphNode {
  id: string;
  title: string;
  degree: number;
}
export interface GraphEdge {
  source: string;
  target: string;
}

export function buildGraph(posts: Post[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const edges: GraphEdge[] = [];
  const degree = new Map<string, number>();
  for (const src of posts) {
    const targets = extractOutgoingLinks(src, posts);
    for (const t of targets) {
      edges.push({ source: src.id, target: t });
      degree.set(src.id, (degree.get(src.id) ?? 0) + 1);
      degree.set(t, (degree.get(t) ?? 0) + 1);
    }
  }
  const nodes: GraphNode[] = posts.map(p => ({
    id: p.id,
    title: p.title || '(untitled)',
    degree: degree.get(p.id) ?? 0,
  }));
  return { nodes, edges };
}
