import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, Plus, X } from 'lucide-react';
import { detectBacklinks } from '@/lib/knowledgeEngine';
import { useBlogStore } from '@/store/blogStore';

interface Props {
  currentId?: string;
  content: string;
  onInsert: (nextContent: string) => void;
}

/**
 * Detects post titles mentioned in the current content and offers one-click
 * wrap-with-[[wiki-link]] insertion. 100% client-side, no AI.
 */
export default function BacklinkSuggestions({ currentId, content, onInsert }: Props) {
  const posts = useBlogStore((s) => s.posts);

  const candidates = useMemo(() => {
    if (!content || content.length < 20) return [];
    const others = posts
      .filter((p) => p.id !== currentId && p.title)
      .map((p) => ({ id: p.id, title: p.title }));
    return detectBacklinks(content, others);
  }, [content, posts, currentId]);

  if (candidates.length === 0) return null;

  const acceptOne = (title: string) => {
    // Replace first plain occurrence with [[title]]
    const re = new RegExp(`(?<!\\[\\[)\\b${escapeRegExp(title)}\\b(?!\\]\\])`, 'i');
    const next = content.replace(re, `[[${title}]]`);
    onInsert(next);
  };

  const acceptAll = () => {
    let next = content;
    for (const c of candidates) {
      const re = new RegExp(`(?<!\\[\\[)\\b${escapeRegExp(c.title)}\\b(?!\\]\\])`, 'gi');
      next = next.replace(re, `[[${c.title}]]`);
    }
    onInsert(next);
  };

  return (
    <Card className="p-3 border-dashed">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="w-4 h-4 text-primary" />
          اقتراحات ربط تلقائي ({candidates.length})
        </div>
        <Button size="sm" variant="ghost" onClick={acceptAll} className="h-7 gap-1 text-xs">
          <Plus className="w-3 h-3" />
          اربط الكل
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((c) => (
          <Badge
            key={c.id}
            variant="outline"
            className="gap-1 cursor-pointer hover:bg-primary/10"
            onClick={() => acceptOne(c.title)}
            title={`إدراج [[${c.title}]]`}
          >
            <Plus className="w-3 h-3" />
            {c.title}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
