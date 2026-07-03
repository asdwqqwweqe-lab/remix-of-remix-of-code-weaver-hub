import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Result { id: string; title?: string; score: number; snippet: string; }

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

export default function SemanticSearch() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const posts = useBlogStore((s) => s.posts);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const corpus = useMemo(
    () => posts
      .filter((p: any) => (p.content || '').length > 40)
      .map((p: any) => ({ id: p.id, title: p.title, text: stripHtml(p.content || '') })),
    [posts],
  );

  const run = async () => {
    if (!q.trim()) return;
    if (corpus.length === 0) { toast.error(isAr ? 'لا مقالات للبحث' : 'No posts to search'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('semantic-search', {
        body: { query: q.trim(), items: corpus.slice(0, 200), topK: 10 },
      });
      if (error) throw error;
      setResults(((data as any)?.results ?? []) as Result[]);
    } catch (e: any) {
      const m = String(e?.message || '');
      if (m.includes('402')) toast.error(isAr ? 'الرصيد نفد' : 'Credits exhausted');
      else if (m.includes('429')) toast.error(isAr ? 'حد الطلبات' : 'Rate limit');
      else toast.error(isAr ? 'فشل البحث' : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Sparkles className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'بحث دلالي في الأرشيف' : 'Semantic Archive Search'}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'اكتب بلغتك الطبيعية — يعثر على المقالات القريبة معنويًا حتى دون تطابق الكلمات.'
              : 'Search in natural language — finds semantically similar posts even without keyword match.'}
          </p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder={isAr ? 'مثال: كيف أحسّن أداء React؟' : 'e.g. how do I optimize React performance?'}
            className="flex-1"
          />
          <Button onClick={run} disabled={loading || !q.trim()}>
            {loading ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Search className="w-4 h-4 me-2" />}
            {isAr ? 'بحث' : 'Search'}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {isAr ? `القاعدة المفهرسة: ${corpus.length} مقالة` : `Indexed corpus: ${corpus.length} posts`}
        </div>
      </Card>

      <div className="space-y-2">
        {results.length === 0 && !loading && (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            {isAr ? 'لا نتائج بعد — جرّب استعلامًا.' : 'No results yet — try a query.'}
          </Card>
        )}
        {results.map((r) => (
          <Card key={r.id} className="p-4 space-y-2 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/posts/${r.id}`} className="font-semibold hover:text-primary line-clamp-2">
                {r.title || '—'}
              </Link>
              <Badge variant="outline" className="shrink-0 tabular-nums">
                {(r.score * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{r.snippet}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
