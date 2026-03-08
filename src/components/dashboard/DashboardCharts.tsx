import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Target } from 'lucide-react';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(var(--accent))',
];

export function PostsByCategoryChart() {
  const { language } = useLanguage();
  const { posts, categories } = useBlogStore();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    posts.forEach((p) => {
      const cat = categories.find((c) => c.id === p.categoryId);
      const name = cat
        ? language === 'ar'
          ? cat.nameAr
          : cat.nameEn
        : language === 'ar'
          ? 'غير مصنف'
          : 'Uncategorized';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count
    );
  }, [posts, categories, language]);

  const config: ChartConfig = {
    count: {
      label: language === 'ar' ? 'المقالات' : 'Posts',
      color: 'hsl(var(--primary))',
    },
  };

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" />
          {language === 'ar' ? 'المقالات حسب التصنيف' : 'Posts by Category'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[250px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function PostStatusChart() {
  const { language } = useLanguage();
  const { posts } = useBlogStore();

  const data = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published').length;
    const draft = posts.filter((p) => p.status === 'draft').length;
    const archived = posts.filter((p) => p.status === 'archived').length;
    return [
      {
        name: language === 'ar' ? 'منشور' : 'Published',
        value: published,
        fill: 'hsl(var(--chart-2, 160 60% 45%))',
      },
      {
        name: language === 'ar' ? 'مسودة' : 'Draft',
        value: draft,
        fill: 'hsl(var(--chart-3, 30 80% 55%))',
      },
      {
        name: language === 'ar' ? 'مؤرشف' : 'Archived',
        value: archived,
        fill: 'hsl(var(--chart-4, 280 65% 60%))',
      },
    ].filter((d) => d.value > 0);
  }, [posts, language]);

  const config: ChartConfig = {
    value: { label: language === 'ar' ? 'العدد' : 'Count' },
  };

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-4 w-4 text-primary" />
          {language === 'ar' ? 'حالة المقالات' : 'Post Status'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[250px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              nameKey="name"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ViewsDistributionChart() {
  const { language } = useLanguage();
  const { posts } = useBlogStore();

  const data = useMemo(() => {
    return [...posts]
      .filter((p) => p.viewsCount > 0)
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 8)
      .map((p) => ({
        name: p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title,
        views: p.viewsCount,
      }));
  }, [posts]);

  const config: ChartConfig = {
    views: {
      label: language === 'ar' ? 'المشاهدات' : 'Views',
      color: 'hsl(var(--primary))',
    },
  };

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          {language === 'ar' ? 'توزيع المشاهدات' : 'Views Distribution'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[250px] w-full">
          <AreaChart data={data} margin={{ left: 10, right: 10 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="views"
              stroke="hsl(var(--primary))"
              fill="url(#viewsGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function RoadmapProgressChart() {
  const { language } = useLanguage();
  const { roadmaps, roadmapSections } = useRoadmapStore();

  const data = useMemo(() => {
    return roadmaps.slice(0, 5).map((roadmap, i) => {
      const sects = roadmapSections.filter((s) => s.roadmapId === roadmap.id);
      const total = sects.reduce((s, sec) => s + sec.topics.length, 0);
      const completed = sects.reduce(
        (s, sec) => s + sec.topics.filter((t) => t.completed).length,
        0
      );
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        name: roadmap.title.length > 18 ? roadmap.title.slice(0, 18) + '…' : roadmap.title,
        progress: pct,
        fill: COLORS[i % COLORS.length],
      };
    });
  }, [roadmaps, roadmapSections]);

  const config: ChartConfig = {
    progress: {
      label: language === 'ar' ? 'التقدم %' : 'Progress %',
    },
  };

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          {language === 'ar' ? 'تقدم خرائط الطريق' : 'Roadmap Progress'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[250px] w-full">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="progress"
              background
              cornerRadius={6}
              label={{ position: 'insideStart', fill: 'hsl(var(--foreground))', fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend
              iconSize={8}
              layout="horizontal"
              verticalAlign="bottom"
              payload={data.map((d) => ({
                value: d.name,
                type: 'circle' as const,
                color: d.fill,
              }))}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
