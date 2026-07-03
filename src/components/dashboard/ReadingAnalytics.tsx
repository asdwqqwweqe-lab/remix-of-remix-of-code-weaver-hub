import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, LineChart as LineChartIcon, Timer, MousePointerClick } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface Row {
  id: string;
  post_id: string;
  session_id: string;
  scroll_depth: number;
  time_on_page: number;
  section_id: string | null;
  created_at: string;
}

const chartConfig = {
  views: { label: 'Views', color: 'hsl(var(--primary))' },
  time: { label: 'Avg Time', color: 'hsl(var(--accent))' },
  scroll: { label: 'Scroll %', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export default function ReadingAnalytics() {
  const { language } = useLanguage();
  const { posts } = useBlogStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('reading_analytics')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (mounted) {
        setRows((data as Row[]) || []);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    if (rows.length === 0) {
      return { total: 0, avgTime: 0, avgScroll: 0, uniqueSessions: 0 };
    }
    const totalTime = rows.reduce((s, r) => s + r.time_on_page, 0);
    const totalScroll = rows.reduce((s, r) => s + r.scroll_depth, 0);
    const sessions = new Set(rows.map((r) => r.session_id));
    return {
      total: rows.length,
      avgTime: Math.round(totalTime / rows.length),
      avgScroll: Math.round(totalScroll / rows.length),
      uniqueSessions: sessions.size,
    };
  }, [rows]);

  // Daily views (last 14 days)
  const dailySeries = useMemo(() => {
    const days: Record<string, { date: string; views: number; time: number; count: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key.slice(5), views: 0, time: 0, count: 0 };
    }
    rows.forEach((r) => {
      const key = r.created_at.slice(0, 10);
      if (days[key]) {
        days[key].views += 1;
        days[key].time += r.time_on_page;
        days[key].count += 1;
      }
    });
    return Object.values(days).map((d) => ({
      date: d.date,
      views: d.views,
      time: d.count > 0 ? Math.round(d.time / d.count) : 0,
    }));
  }, [rows]);

  // Heatmap: sections engagement (top 10)
  const sectionHeatmap = useMemo(() => {
    const map = new Map<string, { name: string; views: number; totalScroll: number }>();
    rows.forEach((r) => {
      if (!r.section_id) return;
      const key = r.section_id.slice(0, 60);
      const existing = map.get(key) || { name: key, views: 0, totalScroll: 0 };
      existing.views += 1;
      existing.totalScroll += r.scroll_depth;
      map.set(key, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map((s) => ({
        name: s.name,
        views: s.views,
        scroll: Math.round(s.totalScroll / s.views),
      }));
  }, [rows]);

  // Top posts
  const topPosts = useMemo(() => {
    const map = new Map<string, { id: string; views: number; totalTime: number; totalScroll: number }>();
    rows.forEach((r) => {
      const e = map.get(r.post_id) || { id: r.post_id, views: 0, totalTime: 0, totalScroll: 0 };
      e.views += 1;
      e.totalTime += r.time_on_page;
      e.totalScroll += r.scroll_depth;
      map.set(r.post_id, e);
    });
    return Array.from(map.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((p) => {
        const post = posts.find((x) => x.id === p.id);
        return {
          title: post?.title || (language === 'ar' ? 'مقال محذوف' : 'Deleted post'),
          views: p.views,
          avgTime: Math.round(p.totalTime / p.views),
          avgScroll: Math.round(p.totalScroll / p.views),
        };
      });
  }, [rows, posts, language]);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-primary" />
            {t('تحليلات القراءة', 'Reading Analytics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{t('جاري التحميل...', 'Loading...')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <LineChartIcon className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">{t('تحليلات القراءة', 'Reading Analytics')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('آخر 30 يومًا من سلوك القراء', 'Last 30 days of reader behavior')}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('جلسات القراءة', 'Reading Sessions')}</CardTitle>
            <MousePointerClick className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">
              {summary.uniqueSessions} {t('زائر فريد', 'unique')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('متوسط الوقت', 'Avg Time')}</CardTitle>
            <Timer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.avgTime}s
            </div>
            <p className="text-xs text-muted-foreground">{t('على الصفحة', 'on page')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('عمق التمرير', 'Scroll Depth')}</CardTitle>
            <Flame className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgScroll}%</div>
            <p className="text-xs text-muted-foreground">{t('متوسط', 'average')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('معدل الإكمال', 'Completion')}</CardTitle>
            <Flame className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.length > 0
                ? Math.round((rows.filter((r) => r.scroll_depth >= 80).length / rows.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">{t('قرأوا 80%+', 'read 80%+')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily performance line chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('الأداء عبر الوقت', 'Performance Over Time')}</CardTitle>
            <CardDescription>{t('المشاهدات اليومية آخر 14 يومًا', 'Daily views – last 14 days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Section heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>{t('خريطة حرارية للأقسام', 'Section Heatmap')}</CardTitle>
            <CardDescription>
              {t('الأقسام الأكثر قراءة', 'Most engaged sections')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sectionHeatmap.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                {t('لا توجد بيانات بعد', 'No data yet')}
              </div>
            ) : (
              <div className="space-y-2">
                {sectionHeatmap.map((s, i) => {
                  const intensity = Math.min(100, (s.views / sectionHeatmap[0].views) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="truncate flex-1 me-2" title={s.name}>{s.name}</span>
                        <span className="text-muted-foreground shrink-0">
                          {s.views} · {s.scroll}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${intensity}%`,
                            background: `hsl(var(--primary) / ${0.4 + intensity / 200})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top posts */}
      <Card>
        <CardHeader>
          <CardTitle>{t('أفضل المقالات أداءً', 'Top Performing Posts')}</CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {t('لا توجد بيانات بعد', 'No data yet')}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={topPosts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={140}
                  fontSize={11}
                  tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 20) + '…' : v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
