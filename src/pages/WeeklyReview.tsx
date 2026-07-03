import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck, FileText, CheckCircle2, Clock, AlertTriangle,
  Sparkles, TrendingUp, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // make Monday first
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function WeeklyReview() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { posts } = useBlogStore();

  const weekStart = useMemo(() => startOfWeek(), []);
  const weekEnd = useMemo(() => {
    const e = new Date(weekStart); e.setDate(e.getDate() + 7); return e;
  }, [weekStart]);

  const todos = useMemo<TodoItem[]>(() => {
    try {
      const raw = localStorage.getItem('app-todo-items');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);

  const publishedThisWeek = useMemo(
    () => posts.filter(p => p.status === 'published' &&
      new Date(p.updatedAt) >= weekStart && new Date(p.updatedAt) < weekEnd),
    [posts, weekStart, weekEnd],
  );
  const draftedThisWeek = useMemo(
    () => posts.filter(p => p.status !== 'published' &&
      new Date(p.createdAt) >= weekStart && new Date(p.createdAt) < weekEnd),
    [posts, weekStart, weekEnd],
  );

  const todosThisWeek = useMemo(
    () => todos.filter(t => t.createdAt && new Date(t.createdAt) >= weekStart),
    [todos, weekStart],
  );
  const completedTodos = todosThisWeek.filter(t => t.completed);
  const pendingTodos = todos.filter(t => !t.completed);
  const overdueTodos = pendingTodos.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  const highlights: string[] = [];
  if (publishedThisWeek.length >= 3) {
    highlights.push(isAr
      ? `أسبوع نشر رائع! ${publishedThisWeek.length} مقالات منشورة.`
      : `Great publishing week! ${publishedThisWeek.length} posts shipped.`);
  }
  if (completedTodos.length >= 5) {
    highlights.push(isAr
      ? `إنجازك في المهام قوي: أكملت ${completedTodos.length} مهمة.`
      : `Strong task momentum: ${completedTodos.length} tasks done.`);
  }
  if (overdueTodos.length > 0) {
    highlights.push(isAr
      ? `⚠️ ${overdueTodos.length} مهام متأخرة تحتاج انتباهك.`
      : `⚠️ ${overdueTodos.length} overdue tasks need attention.`);
  }
  if (draftedThisWeek.length > publishedThisWeek.length + 2) {
    highlights.push(isAr
      ? `لديك ${draftedThisWeek.length} مسودات هذا الأسبوع — فكّر بإكمال إحداها.`
      : `${draftedThisWeek.length} drafts this week — consider shipping one.`);
  }
  if (highlights.length === 0) {
    highlights.push(isAr
      ? 'أسبوع هادئ — ضع هدفاً واحداً واضحاً للأسبوع القادم.'
      : 'A quiet week — set one clear goal for next week.');
  }

  const dateFmt = (d: Date) => d.toLocaleDateString(isAr ? 'ar' : 'en', { day: 'numeric', month: 'short' });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-primary" />
            {isAr ? 'مراجعة الأسبوع' : 'Weekly Review'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateFmt(weekStart)} — {dateFmt(new Date(weekEnd.getTime() - 1))}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label={isAr ? 'مقالات منشورة' : 'Published'}
                  value={publishedThisWeek.length} tone="text-emerald-500" />
        <StatCard icon={Clock} label={isAr ? 'مسودات جديدة' : 'New drafts'}
                  value={draftedThisWeek.length} tone="text-blue-500" />
        <StatCard icon={CheckCircle2} label={isAr ? 'مهام مكتملة' : 'Tasks done'}
                  value={completedTodos.length} tone="text-primary" />
        <StatCard icon={AlertTriangle} label={isAr ? 'مهام متأخرة' : 'Overdue'}
                  value={overdueTodos.length} tone={overdueTodos.length ? 'text-destructive' : 'text-muted-foreground'} />
      </div>

      {/* Highlights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isAr ? 'أبرز ما في الأسبوع' : 'Highlights'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-4">
        <SectionList
          title={isAr ? 'منشور هذا الأسبوع' : 'Published this week'}
          empty={isAr ? 'لا مقالات منشورة.' : 'No posts published.'}
          items={publishedThisWeek.map(p => ({
            id: p.id, title: p.title, href: `/posts/${p.id}`,
            meta: new Date(p.updatedAt).toLocaleDateString(isAr ? 'ar' : 'en'),
          }))}
        />
        <SectionList
          title={isAr ? 'مسودات جديدة' : 'New drafts'}
          empty={isAr ? 'لا مسودات جديدة.' : 'No new drafts.'}
          items={draftedThisWeek.map(p => ({
            id: p.id, title: p.title, href: `/posts/${p.id}/edit`,
            meta: p.status,
          }))}
        />
        <SectionList
          title={isAr ? 'مهام متأخرة' : 'Overdue tasks'}
          empty={isAr ? 'رائع! لا شيء متأخر.' : 'Nothing overdue. Nice!'}
          items={overdueTodos.slice(0, 8).map(t => ({
            id: t.id, title: t.text, href: '/todo',
            meta: t.dueDate ? new Date(t.dueDate).toLocaleDateString(isAr ? 'ar' : 'en') : undefined,
            badge: t.priority,
          }))}
        />
        <SectionList
          title={isAr ? 'مقترحات للأسبوع القادم' : 'Suggestions for next week'}
          empty=""
          items={buildSuggestions({ pendingTodos, draftedThisWeek, publishedThisWeek, isAr })}
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className={`w-6 h-6 ${tone}`} />
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ListEntry { id: string; title: string; href?: string; meta?: string; badge?: string; }
function SectionList({ title, empty, items }: { title: string; empty: string; items: ListEntry[]; }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">{empty}</p>
        ) : items.map(i => (
          i.href ? (
            <Link key={i.id} to={i.href}
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/60 text-sm">
              <span className="flex-1 truncate">{i.title}</span>
              {i.badge && <Badge variant="outline" className="text-[10px] h-5">{i.badge}</Badge>}
              {i.meta && <span className="text-xs text-muted-foreground">{i.meta}</span>}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          ) : (
            <div key={i.id} className="flex items-center gap-2 py-1.5 px-2 text-sm">
              <span className="flex-1">{i.title}</span>
              {i.meta && <span className="text-xs text-muted-foreground">{i.meta}</span>}
            </div>
          )
        ))}
      </CardContent>
    </Card>
  );
}

function buildSuggestions({ pendingTodos, draftedThisWeek, publishedThisWeek, isAr }: {
  pendingTodos: TodoItem[]; draftedThisWeek: unknown[]; publishedThisWeek: unknown[]; isAr: boolean;
}): ListEntry[] {
  const out: ListEntry[] = [];
  const highPriority = pendingTodos.filter(t => t.priority === 'high').slice(0, 3);
  highPriority.forEach(t => out.push({
    id: 's-' + t.id,
    title: (isAr ? 'ابدأ بمهمة عالية الأولوية: ' : 'Start with a high-priority task: ') + t.text,
    href: '/todo',
  }));
  if (draftedThisWeek.length > 0 && publishedThisWeek.length === 0) {
    out.push({
      id: 's-publish',
      title: isAr ? 'انشر مسودة واحدة على الأقل الأسبوع القادم.' : 'Ship at least one draft next week.',
      href: '/posts',
    });
  }
  if (out.length === 0) {
    out.push({
      id: 's-plan',
      title: isAr ? 'خطط لهدف واحد ملموس (SMART) للأسبوع.' : 'Plan one concrete (SMART) goal for the week.',
      href: '/todo',
    });
  }
  return out;
}
