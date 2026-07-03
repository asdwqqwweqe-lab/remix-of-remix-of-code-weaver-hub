import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Flame, TrendingUp } from 'lucide-react';

/**
 * Writing heatmap: 52 weeks x 7 days grid of post creation activity,
 * GitHub-contribution style. Also shows top categories/tags this month.
 */
export default function WritingInsights() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const posts = useBlogStore((s) => s.posts);
  const categories = useBlogStore((s) => s.categories);
  const tags = useBlogStore((s) => s.tags);

  const { grid, max, total } = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      const d = new Date((p as any).createdAt ?? Date.now());
      const key = d.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    }
    const weeks: { key: string; count: number; date: Date }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Start from Sunday 52 weeks back
    const start = new Date(today);
    start.setDate(start.getDate() - (51 * 7 + today.getDay()));
    let cursor = new Date(start);
    for (let w = 0; w < 52; w++) {
      const wk: { key: string; count: number; date: Date }[] = [];
      for (let d = 0; d < 7; d++) {
        const key = cursor.toISOString().slice(0, 10);
        wk.push({ key, count: map.get(key) || 0, date: new Date(cursor) });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(wk);
    }
    const values = Array.from(map.values());
    return { grid: weeks, max: Math.max(1, ...values), total: posts.length };
  }, [posts]);

  const topCategories = useMemo(() => {
    const monthAgo = Date.now() - 30 * 86400000;
    const recent = posts.filter((p) => new Date((p as any).createdAt ?? 0).getTime() >= monthAgo);
    const counts = new Map<string, number>();
    for (const p of recent) if (p.categoryId) counts.set(p.categoryId, (counts.get(p.categoryId) || 0) + 1);
    return Array.from(counts.entries())
      .map(([id, c]) => ({ name: categories.find((x) => x.id === id)?.[isAr ? 'nameAr' : 'nameEn'] ?? '—', count: c }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }, [posts, categories, isAr]);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      const arr: string[] = (p as any).selectedTags ?? [];
      for (const t of arr) counts.set(t, (counts.get(t) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, c]) => ({ name: tags.find((x) => x.id === id)?.name ?? id, count: c }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [posts, tags]);

  const intensity = (n: number) => {
    if (n === 0) return 'bg-muted/40';
    const r = n / max;
    if (r > 0.75) return 'bg-primary';
    if (r > 0.5) return 'bg-primary/70';
    if (r > 0.25) return 'bg-primary/50';
    return 'bg-primary/25';
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            {isAr ? 'خريطة الكتابة — 52 أسبوعاً' : 'Writing heatmap — 52 weeks'}
          </h3>
          <span className="text-xs text-muted-foreground">
            {total} {isAr ? 'مقالة إجمالاً' : 'posts total'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="inline-flex gap-[3px]">
            {grid.map((wk, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {wk.map((cell) => (
                  <div
                    key={cell.key}
                    title={`${cell.key} — ${cell.count} ${isAr ? 'مقالة' : 'posts'}`}
                    className={`w-3 h-3 rounded-sm ${intensity(cell.count)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{isAr ? 'أقل' : 'less'}</span>
          <div className="w-3 h-3 rounded-sm bg-muted/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/25" />
          <div className="w-3 h-3 rounded-sm bg-primary/50" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>{isAr ? 'أكثر' : 'more'}</span>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          {isAr ? 'اتجاهات المواضيع' : 'Topic trends'}
        </h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {isAr ? 'أعلى التصنيفات (30 يوماً)' : 'Top categories (30d)'}
            </div>
            {topCategories.length === 0 ? (
              <div className="text-xs text-muted-foreground">—</div>
            ) : topCategories.map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-xs mb-1">
                <div className="flex-1 truncate">{c.name}</div>
                <div className="h-1.5 bg-primary rounded" style={{ width: `${(c.count / topCategories[0].count) * 60}px` }} />
                <div className="w-6 text-end tabular-nums">{c.count}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {isAr ? 'أكثر الوسوم استخداماً' : 'Most used tags'}
            </div>
            <div className="flex flex-wrap gap-1">
              {topTags.length === 0
                ? <span className="text-xs text-muted-foreground">—</span>
                : topTags.map((t) => (
                  <span key={t.name} className="text-xs bg-muted rounded px-2 py-0.5">
                    {t.name} <span className="text-muted-foreground">·{t.count}</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
