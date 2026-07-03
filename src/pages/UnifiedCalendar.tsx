import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, FileText, CheckSquare, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';

interface Task { id: string; title: string; dueDate?: string; completed: boolean; priority: string; }
interface FocusSession { startedAt: number; durationSec: number; }

function loadJSON<T>(k: string, fb: T): T {
  try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fb; } catch { return fb; }
}

export default function UnifiedCalendar() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const locale = isAr ? arLocale : enUS;
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date>(new Date());

  const posts = useBlogStore((s) => s.posts);
  const tasks = loadJSON<Task[]>('tasks-v1', []);
  const sessions = loadJSON<FocusSession[]>('focus-sessions', []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: isAr ? 6 : 0 });
    const end = endOfWeek(endOfMonth(current), { weekStartsOn: isAr ? 6 : 0 });
    return eachDayOfInterval({ start, end });
  }, [current, isAr]);

  const eventsFor = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayPosts = posts.filter((p: any) => {
      const d = new Date(p.createdAt ?? p.publishedAt ?? 0);
      return isSameDay(d, day);
    });
    const dayTasks = tasks.filter((t) => t.dueDate === key);
    const daySessions = sessions.filter((s) => isSameDay(new Date(s.startedAt), day));
    return { posts: dayPosts, tasks: dayTasks, sessions: daySessions };
  };

  const monthLabel = format(current, 'MMMM yyyy', { locale });

  const selectedEvents = eventsFor(selected);

  return (
    <div className="container mx-auto py-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <CalendarDays className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">{isAr ? 'التقويم الموحّد' : 'Unified Calendar'}</h1>
        <div className="ms-auto flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrent((c) => subMonths(c, 1))}>
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <div className="min-w-[160px] text-center font-semibold capitalize">{monthLabel}</div>
          <Button variant="outline" size="icon" onClick={() => setCurrent((c) => addMonths(c, 1))}>
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setCurrent(new Date()); setSelected(new Date()); }}>
            {isAr ? 'اليوم' : 'Today'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-3">
          <div className="grid grid-cols-7 text-xs text-muted-foreground mb-2">
            {(isAr ? ['س','ج','خ','ر','ث','ن','ح'] : ['S','M','T','W','T','F','S']).map((d, i) => (
              <div key={i} className="text-center py-1 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const ev = eventsFor(day);
              const total = ev.posts.length + ev.tasks.length + ev.sessions.length;
              const inMonth = isSameMonth(day, current);
              const today = isToday(day);
              const isSel = isSameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  className={`min-h-[74px] rounded-md border p-1.5 flex flex-col text-start transition-colors
                    ${isSel ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}
                    ${!inMonth ? 'opacity-40' : ''}`}
                >
                  <div className={`text-xs font-medium mb-1 ${today ? 'text-primary' : ''}`}>
                    {format(day, 'd', { locale })}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {ev.posts.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="posts" />}
                    {ev.tasks.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="tasks" />}
                    {ev.sessions.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="focus" />}
                    {total > 3 && <span className="text-[10px] text-muted-foreground">+{total}</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {isAr ? 'مقالات' : 'Posts'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {isAr ? 'مهام' : 'Tasks'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> {isAr ? 'جلسات تركيز' : 'Focus sessions'}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">{isAr ? 'اليوم المحدد' : 'Selected day'}</div>
            <div className="text-lg font-semibold">{format(selected, 'EEEE, d MMM yyyy', { locale })}</div>
          </div>

          <section>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 mb-2">
              <FileText className="w-3.5 h-3.5" /> {isAr ? 'المقالات' : 'Posts'} ({selectedEvents.posts.length})
            </div>
            {selectedEvents.posts.length === 0 ? (
              <div className="text-xs text-muted-foreground">—</div>
            ) : (
              <div className="space-y-1">
                {selectedEvents.posts.map((p: any) => (
                  <Link key={p.id} to={`/posts/${p.id}`} className="block text-sm hover:text-primary truncate">
                    {p.title || '—'}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-2">
              <CheckSquare className="w-3.5 h-3.5" /> {isAr ? 'المهام' : 'Tasks'} ({selectedEvents.tasks.length})
            </div>
            {selectedEvents.tasks.length === 0 ? (
              <div className="text-xs text-muted-foreground">—</div>
            ) : (
              <div className="space-y-1">
                {selectedEvents.tasks.map((t) => (
                  <div key={t.id} className="text-sm flex items-center gap-2">
                    <span className={t.completed ? 'line-through text-muted-foreground' : ''}>{t.title}</span>
                    <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-500 mb-2">
              <Timer className="w-3.5 h-3.5" /> {isAr ? 'جلسات التركيز' : 'Focus sessions'} ({selectedEvents.sessions.length})
            </div>
            {selectedEvents.sessions.length === 0 ? (
              <div className="text-xs text-muted-foreground">—</div>
            ) : (
              <div className="text-sm space-y-1">
                {selectedEvents.sessions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>{format(new Date(s.startedAt), 'HH:mm')}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {Math.round(s.durationSec / 60)} {isAr ? 'دقيقة' : 'min'}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  {isAr ? 'الإجمالي: ' : 'Total: '}
                  <span className="font-semibold">
                    {Math.round(selectedEvents.sessions.reduce((s, x) => s + x.durationSec, 0) / 60)}{' '}
                    {isAr ? 'دقيقة' : 'min'}
                  </span>
                </div>
              </div>
            )}
          </section>
        </Card>
      </div>
    </div>
  );
}
