import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Flame, Check, Award, TrendingUp } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  completions: string[]; // YYYY-MM-DD
}

const KEY = 'habits-v1';
const COLORS = ['#14b8a6', '#f43f5e', '#8b5cf6', '#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#06b6d4'];
const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
const load = (): Habit[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function computeStreaks(dates: Set<string>): { current: number; longest: number } {
  const today = new Date();
  let current = 0;
  const cur = new Date(today);
  // if today not done, streak might still be yesterday-based
  if (!dates.has(ymd(cur))) cur.setDate(cur.getDate() - 1);
  while (dates.has(ymd(cur))) { current++; cur.setDate(cur.getDate() - 1); }

  const sorted = Array.from(dates).sort();
  let longest = 0, run = 0, prev: Date | null = null;
  for (const s of sorted) {
    const d = new Date(s);
    if (prev && (d.getTime() - prev.getTime()) === 86400000) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest };
}

export default function Habits() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [habits, setHabits] = useState<Habit[]>(load);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(habits)); }, [habits]);

  const today = ymd(new Date());
  const days = useMemo(() => {
    // 12 weeks = 84 days, ending today, grid columns = weeks, rows = day of week
    const arr: Date[] = [];
    const end = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      arr.push(d);
    }
    return arr;
  }, []);

  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits((p) => [{ id: uid(), name: newName.trim(), color: newColor, createdAt: Date.now(), completions: [] }, ...p]);
    setNewName(''); setNewOpen(false);
  };
  const toggleDay = (id: string, date: string) => {
    setHabits((p) => p.map((h) => h.id === id
      ? { ...h, completions: h.completions.includes(date) ? h.completions.filter((d) => d !== date) : [...h.completions, date] }
      : h));
  };
  const deleteHabit = (id: string) => {
    if (!confirm(t('حذف هذه العادة؟', 'Delete this habit?'))) return;
    setHabits((p) => p.filter((h) => h.id !== id));
  };

  const totals = useMemo(() => {
    const totalCompletions = habits.reduce((s, h) => s + h.completions.length, 0);
    const doneToday = habits.filter((h) => h.completions.includes(today)).length;
    return { totalHabits: habits.length, totalCompletions, doneToday };
  }, [habits, today]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('متتبع العادات', 'Habit Tracker')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('بناء عادات يومية مع خريطة حرارية وسلاسل متتابعة', 'Build daily habits with heatmap and streaks')}
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 me-1" />{t('عادة جديدة', 'New Habit')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('إضافة عادة', 'Add habit')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder={t('اسم العادة (مثال: قراءة 15 دقيقة)', 'Habit name (e.g. Read 15 min)')} />
              <div>
                <div className="text-xs text-muted-foreground mb-2">{t('اللون', 'Color')}</div>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${newColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={addHabit} className="w-full">{t('إضافة', 'Add')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t('العادات', 'Habits')}</div><div className="text-2xl font-bold">{totals.totalHabits}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t('أُنجزت اليوم', 'Done today')}</div><div className="text-2xl font-bold text-primary">{totals.doneToday}/{totals.totalHabits}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t('إجمالي الأيام', 'Total days')}</div><div className="text-2xl font-bold">{totals.totalCompletions}</div></Card>
      </div>

      {habits.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          {t('لا عادات بعد. أضف أول عادة!', 'No habits yet. Add your first!')}
        </Card>
      )}

      <div className="space-y-3">
        {habits.map((h) => {
          const set = new Set(h.completions);
          const { current, longest } = computeStreaks(set);
          const doneToday = set.has(today);
          const monthly = h.completions.filter((d) => {
            const dt = new Date(d);
            return (Date.now() - dt.getTime()) < 30 * 86400000;
          }).length;
          return (
            <Card key={h.id} className="p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-3 h-3 rounded-full" style={{ background: h.color }} />
                <div className="font-medium flex-1">{h.name}</div>
                <Badge variant="secondary" className="gap-1"><Flame className="w-3 h-3" />{current} {t('يوم', 'day')}</Badge>
                <Badge variant="outline" className="gap-1"><Award className="w-3 h-3" />{t('أطول', 'best')}: {longest}</Badge>
                <Badge variant="outline" className="gap-1"><TrendingUp className="w-3 h-3" />30{t('ي', 'd')}: {monthly}</Badge>
                <Button size="sm" variant={doneToday ? 'default' : 'outline'}
                  onClick={() => toggleDay(h.id, today)}
                  style={doneToday ? { background: h.color, borderColor: h.color } : {}}>
                  <Check className="w-4 h-4 me-1" />{doneToday ? t('أُنجز اليوم', 'Done today') : t('أنجز الآن', 'Mark today')}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteHabit(h.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Heatmap: 12 weeks x 7 days */}
              <div className="overflow-x-auto">
                <div className="inline-grid grid-flow-col grid-rows-7 gap-1" dir="ltr">
                  {days.map((d) => {
                    const dateStr = ymd(d);
                    const done = set.has(dateStr);
                    const isToday = dateStr === today;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleDay(h.id, dateStr)}
                        title={`${dateStr}${done ? ' ✓' : ''}`}
                        className={`w-4 h-4 rounded-sm transition ${isToday ? 'ring-1 ring-foreground/60' : ''}`}
                        style={{
                          background: done ? h.color : 'hsl(var(--muted))',
                          opacity: done ? 1 : 0.5,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
