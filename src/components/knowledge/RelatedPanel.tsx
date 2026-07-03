import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '@/store/blogStore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { findRelated } from '@/lib/knowledgeEngine';

interface Props {
  currentPostId: string;
  currentText: string;
  currentTitle: string;
}

export default function RelatedPanel({ currentPostId, currentText, currentTitle }: Props) {
  const { posts } = useBlogStore();
  const { language, isRTL } = useLanguage();

  const related = useMemo(() => {
    const docs = posts.map((p) => ({
      id: p.id,
      title: p.title,
      text: `${p.title} ${p.excerpt || ''} ${(p.content || '').slice(0, 500)}`,
    }));
    return findRelated(currentPostId, `${currentTitle} ${currentText}`, docs, 5);
  }, [currentPostId, currentTitle, currentText, posts]);

  if (related.length === 0) return null;

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{t('قد يهمّك أيضاً', 'You might also like')}</h3>
        <Badge variant="outline" className="text-xs ms-auto">{related.length}</Badge>
      </div>
      <ul className="space-y-1">
        {related.map((r) => (
          <li key={r.id}>
            <Link
              to={`/posts/${r.id}`}
              className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors text-sm group"
            >
              <ArrowRight className={`w-3 h-3 text-muted-foreground shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              <span className="flex-1 truncate group-hover:text-primary">{r.title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(r.similarity * 100)}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
