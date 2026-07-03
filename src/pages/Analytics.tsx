import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { BarChart3, CheckSquare, StickyNote, Timer, FileText, Flame } from 'lucide-react';
import WritingInsights from '@/components/analytics/WritingInsights';

const readJSON = <T,>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};

interface Task { id: string; completed: boolean; createdAt: number; priority: 'low' | 'med' | 'high'; }
interface FocusSession { startedAt: number; durationSec: number; mode?: string; }
interface Note { createdAt?: number; }

const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

export default function Analytics() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const tasks = readJSON<Task[]>('tasks-v1', []);
  const focusSessions = readJSON<FocusSession[]>('focus-sessions', []);
  const notes = readJSON<Note[]>('quick-notes', []);
  const todos = readJSON<Task[]>('app-todo-items', []);

  const kpis = useMemo(() => {
    const doneTasks = tasks.filter((x) => x.completed).length;
    const focusMin = Math.round(focusSessions.reduce((s, x) => s + (x.durationSec || 0), 0) / 60);
    return [
      { label: t('المهام المنجزة', 'Tasks done'), value: doneTasks, icon: CheckSquare, color: 'text-emerald-500' },
      { label: t('المهام المعلّقة', 'Tasks pending'), value: tasks.length - doneTasks, icon: CheckSquare, color: 'text-amber-500' },
      { label: t('جلسات التركيز', 'Focus sessions'), value: focusSessions.length, icon: Timer, color: 'text-teal-500' },
      { label: t('دقائق التركيز', 'Focus minutes'), value: focusMin, icon: Timer, color: 'text-teal-400' },
      { label: t('الملاحظات', 'Notes'), value: notes.length, icon: StickyNote, color: 'text-blue-400' },
      { label: t('مهام To-Do', 'To-do items'), value: todos.length, icon: FileText, color: 'text-violet-400' },
    ];
  }, [tasks, focusSessions, notes, todos, language]);

  // Last 30 days activity
  const activityData = useMemo(() => {
    const days: { day: string; tasks: number; focus: number; notes: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const short = key.slice(5);
      days.push({
        day: short,
        tasks: tasks.filter((x) => x.completed && dayKey(x.createdAt) === key).length,
        focus: focusSessions.filter((x) => dayKey(x.startedAt) === key).length,
        notes: notes.filter((n) => n.createdAt && dayKey(n.createdAt) === key).length,
      });
    }
    return days;
  }, [tasks, focusSessions, notes]);

  const focusMinutesByDay = useMemo(() => activityData.map((d, i) => {
    const dayStart = new Date(); dayStart.setDate(dayStart.getDate() - (29 - i)); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + 86400000;
    const mins = Math.round(
      focusSessions.filter((s) => s.startedAt >= dayStart.getTime() && s.startedAt < dayEnd)
        .reduce((sum, s) => sum + (s.durationSec || 0), 0) / 60
    );
    return { day: d.day, mins };
  }), [activityData, focusSessions]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, med: 0, low: 0 };
    tasks.forEach((t) => { if (!t.completed) counts[t.priority]++; });
    return [
      { name: t('عالية', 'High'), value: counts.high, color: 'hsl(var(--destructive))' },
      { name: t('متوسطة', 'Medium'), value: counts.med, color: 'hsl(38 92% 50%)' },
      { name: t('منخفضة', 'Low'), value: counts.low, color: 'hsl(var(--primary))' },
    ];
  }, [tasks, language]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const active =
        tasks.some((x) => x.completed && dayKey(x.createdAt) === key) ||
        focusSessions.some((x) => dayKey(x.startedAt) === key) ||
        notes.some((n) => n.createdAt && dayKey(n.createdAt) === key);
      if (active) count++;
      else if (i > 0) break;
    }
    return count;
  }, [tasks, focusSessions, notes]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">{t('التحليلات', 'Analytics')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('لمحة بصرية عن نشاطك وإنتاجيتك', 'Visual overview of your activity and productivity')}
          </p>
        </div>
        <Card className="px-4 py-3 flex items-center gap-3">
          <Flame className="w-6 h-6 text-orange-500" />
          <div>
            <div className="text-2xl font-bold leading-none">{streak}</div>
            <div className="text-xs text-muted-foreground">{t('أيام متتالية', 'day streak')}</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <Card key={i} className="p-4 space-y-2">
            <k.icon className={`w-5 h-5 ${k.color}`} />
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t('نشاط آخر 30 يوم', 'Last 30 days activity')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="tasks" name={t('مهام', 'Tasks')} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="focus" name={t('تركيز', 'Focus')} stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="notes" name={t('ملاحظات', 'Notes')} stroke="hsl(217 91% 60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t('دقائق التركيز اليومية', 'Focus minutes per day')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={focusMinutesByDay}>
              <defs>
                <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="mins" stroke="hsl(var(--primary))" fill="url(#focusFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t('المهام حسب الأولوية', 'Tasks by priority')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">{t('توزيع الأولوية', 'Priority distribution')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={4}
                label={(e) => `${e.name}: ${e.value}`}
              >
                {priorityData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <WritingInsights />
    </div>
  );
}
