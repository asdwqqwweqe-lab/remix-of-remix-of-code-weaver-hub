import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, AlertCircle, CheckCircle2, Clock, CalendarClock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Task { id: string; title: string; priority: 'low' | 'med' | 'high'; dueDate?: string; completed: boolean; }

const PREFS_KEY = 'notif-prefs-v1';
const defaultPrefs = { tasks: true, overdue: true, weeklyReview: true, focus: true };

export default function NotificationsCenter() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prefs, setPrefs] = useState(defaultPrefs);

  useEffect(() => {
    try { setTasks(JSON.parse(localStorage.getItem('tasks-v1') || '[]')); } catch {}
    try { setPrefs({ ...defaultPrefs, ...(JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')) }); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }, [prefs]);

  const today = new Date().toISOString().slice(0, 10);

  const notifications = useMemo(() => {
    const items: { id: string; icon: any; title: string; desc: string; tone: string; time?: string }[] = [];
    if (prefs.overdue) {
      tasks.filter(t => t.dueDate && t.dueDate < today && !t.completed).forEach(t => {
        items.push({
          id: 'overdue-' + t.id, icon: AlertCircle,
          title: isAr ? 'مهمة متأخرة' : 'Overdue task',
          desc: t.title, tone: 'text-rose-500', time: t.dueDate,
        });
      });
    }
    if (prefs.tasks) {
      tasks.filter(t => t.dueDate === today && !t.completed).forEach(t => {
        items.push({
          id: 'today-' + t.id, icon: Clock,
          title: isAr ? 'مستحقة اليوم' : 'Due today',
          desc: t.title, tone: 'text-amber-500', time: t.dueDate,
        });
      });
    }
    if (prefs.weeklyReview) {
      const day = new Date().getDay();
      if (day === 0 || day === 6) {
        items.push({
          id: 'weekly-review', icon: CalendarClock,
          title: isAr ? 'مراجعتك الأسبوعية' : 'Weekly review',
          desc: isAr ? 'حان وقت مراجعة أسبوعك وتحديد أهداف الأسبوع القادم.' : 'Time to review your week and set next-week goals.',
          tone: 'text-primary',
        });
      }
    }
    if (prefs.focus) {
      try {
        const sessions = JSON.parse(localStorage.getItem('focus-sessions') || '[]');
        const todaySess = sessions.filter((s: any) => (s.date || '').slice(0, 10) === today);
        if (todaySess.length === 0) {
          items.push({
            id: 'focus-nudge', icon: Clock,
            title: isAr ? 'لا تنسَ التركيز' : 'Focus reminder',
            desc: isAr ? 'لم تسجل جلسة تركيز اليوم بعد.' : "You haven't logged a focus session today.",
            tone: 'text-blue-500',
          });
        }
      } catch {}
    }
    return items;
  }, [tasks, prefs, isAr, today]);

  return (
    <div className="container mx-auto py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Bell className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{isAr ? 'مركز الإشعارات' : 'Notifications Center'}</h1>
        <Badge variant="outline">{notifications.length}</Badge>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-3">{isAr ? 'التفضيلات' : 'Preferences'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {([
            ['tasks', isAr ? 'مهام اليوم' : "Today's tasks"],
            ['overdue', isAr ? 'المهام المتأخرة' : 'Overdue tasks'],
            ['weeklyReview', isAr ? 'المراجعة الأسبوعية' : 'Weekly review'],
            ['focus', isAr ? 'تذكيرات التركيز' : 'Focus nudges'],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center justify-between border rounded p-3 cursor-pointer">
              <span className="text-sm">{label}</span>
              <Switch checked={(prefs as any)[k]} onCheckedChange={(v) => setPrefs(p => ({ ...p, [k]: v }))} />
            </label>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            {isAr ? 'لا توجد إشعارات جديدة — كل شيء على ما يرام!' : 'All clear — no new notifications.'}
          </Card>
        )}
        {notifications.map(n => {
          const Icon = n.icon;
          return (
            <Card key={n.id} className="p-3 flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 ${n.tone}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.desc}</div>
              </div>
              {n.time && <Badge variant="outline" className="text-xs">{n.time}</Badge>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
