import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Timer, Target, Play, Pause, RotateCcw, Coffee, Zap, TrendingUp, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// ------- storage keys -------
const goalsKey = (d: string) => `workshop-goals-${d}`;
const reflectionsKey = 'workshop-reflections';
const FOCUS_SESSIONS = 'focus-sessions';

const today = () => new Date().toISOString().slice(0, 10);
const dayKey = (ts: number) => new Date(ts).toISOString().slice(0, 10);

interface Goal { id: string; text: string; done: boolean; }
interface Session { startedAt: number; durationSec: number; }
interface Reflection { id: string; date: string; text: string; rating: 1 | 2 | 3 | 4 | 5; }

type Phase = 'idle' | 'focus' | 'break';

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

const loadJson = <T,>(k: string, fb: T): T => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; }
};

export default function Workshop() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // Goals (max 3)
  const [goals, setGoals] = useState<Goal[]>(() => loadJson(goalsKey(today()), []));
  const [newGoal, setNewGoal] = useState('');
  useEffect(() => { localStorage.setItem(goalsKey(today()), JSON.stringify(goals)); }, [goals]);

  const addGoal = () => {
    if (!newGoal.trim()) return;
    if (goals.length >= 3) { toast.error(t('حد أقصى 3 أهداف يومياً', 'Max 3 goals per day')); return; }
    setGoals([...goals, { id: crypto.randomUUID(), text: newGoal.trim(), done: false }]);
    setNewGoal('');
  };
  const toggleGoal = (id: string) => setGoals(goals.map((g) => g.id === id ? { ...g, done: !g.done } : g));
  const removeGoal = (id: string) => setGoals(goals.filter((g) => g.id !== id));

  // Timer
  const [phase, setPhase] = useState<Phase>('idle');
  const [remaining, setRemaining] = useState(FOCUS_MIN * 60);
  const [sessions, setSessions] = useState<Session[]>(() => loadJson<Session[]>(FOCUS_SESSIONS, []));
  const [phaseStartedAt, setPhaseStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (phase === 'idle') return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          onPhaseComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 660; gain.gain.value = 0.1;
      osc.start(); setTimeout(() => { osc.stop(); ctx.close(); }, 500);
    } catch { /* noop */ }
  };

  const notify = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body }); } catch { /* noop */ }
    }
    toast(title, { description: body });
  };

  const onPhaseComplete = () => {
    beep();
    if (phase === 'focus') {
      const s: Session = { startedAt: phaseStartedAt || Date.now() - FOCUS_MIN * 60000, durationSec: FOCUS_MIN * 60 };
      const next = [...sessions, s];
      setSessions(next);
      localStorage.setItem(FOCUS_SESSIONS, JSON.stringify(next));
      notify(t('انتهت جلسة التركيز', 'Focus session ended'), t('خذ استراحة 5 دقائق', 'Take a 5-minute break'));
      setPhase('break');
      setRemaining(BREAK_MIN * 60);
      setPhaseStartedAt(Date.now());
    } else {
      notify(t('انتهت الاستراحة', 'Break ended'), t('جاهز لجلسة جديدة؟', 'Ready for another session?'));
      setPhase('idle');
      setRemaining(FOCUS_MIN * 60);
      setPhaseStartedAt(null);
    }
  };

  const startFocus = () => {
    if (Notification?.permission === 'default') Notification.requestPermission().catch(() => {});
    setPhase('focus'); setRemaining(FOCUS_MIN * 60); setPhaseStartedAt(Date.now());
  };
  const pause = () => setPhase('idle');
  const reset = () => { setPhase('idle'); setRemaining(FOCUS_MIN * 60); setPhaseStartedAt(null); };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const totalPhase = phase === 'break' ? BREAK_MIN * 60 : FOCUS_MIN * 60;
  const progress = ((totalPhase - remaining) / totalPhase) * 100;

  // Weekly heatmap (last 7 days x 24h)
  const weekGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    const now = Date.now();
    for (const s of sessions) {
      const diffDays = Math.floor((now - s.startedAt) / (86400000));
      if (diffDays < 0 || diffDays > 6) continue;
      const hour = new Date(s.startedAt).getHours();
      grid[6 - diffDays][hour] += Math.round(s.durationSec / 60);
    }
    return grid;
  }, [sessions]);

  // Productivity score
  const todayStats = useMemo(() => {
    const key = today();
    const todaysSessions = sessions.filter((s) => dayKey(s.startedAt) === key);
    const minutes = Math.round(todaysSessions.reduce((sum, s) => sum + s.durationSec / 60, 0));
    const doneGoals = goals.filter((g) => g.done).length;
    const score = Math.min(100, Math.round((minutes / 120) * 60 + (doneGoals / Math.max(1, goals.length)) * 40));
    let label = t('كسول', 'Lazy'); let color = 'text-rose-500';
    if (score >= 70) { label = t('متركّز', 'Focused'); color = 'text-emerald-500'; }
    else if (score >= 40) { label = t('منتج', 'Productive'); color = 'text-amber-500'; }
    return { minutes, sessions: todaysSessions.length, score, label, color };
  }, [sessions, goals, language]);

  // Reflections
  const [reflections, setReflections] = useState<Reflection[]>(() => loadJson<Reflection[]>(reflectionsKey, []));
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionRating, setReflectionRating] = useState<Reflection['rating']>(3);
  useEffect(() => { localStorage.setItem(reflectionsKey, JSON.stringify(reflections)); }, [reflections]);

  const addReflection = () => {
    if (!reflectionText.trim()) return;
    setReflections([{ id: crypto.randomUUID(), date: today(), text: reflectionText.trim(), rating: reflectionRating }, ...reflections].slice(0, 50));
    setReflectionText('');
    toast.success(t('حُفظت الملاحظة', 'Reflection saved'));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Zap className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('ورشة الإنتاجية', 'Productivity Workshop')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('أهدافك اليومية، جلسات التركيز، ومخطّط أسبوعك في مكان واحد.',
               'Daily goals, focus sessions, and your weekly plan — all in one place.')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timer */}
        <Card className="p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2">
            {phase === 'break' ? <Coffee className="w-5 h-5 text-amber-500" /> : <Timer className="w-5 h-5 text-primary" />}
            <h2 className="font-semibold">
              {phase === 'break' ? t('استراحة', 'Break') : t('جلسة تركيز', 'Focus session')}
            </h2>
            <Badge variant="outline" className="ms-auto">{FOCUS_MIN}/{BREAK_MIN}</Badge>
          </div>
          <div className="text-center py-4">
            <div className="text-6xl font-bold tabular-nums">{fmt(remaining)}</div>
            <Progress value={progress} className="mt-4" />
          </div>
          <div className="flex gap-2">
            {phase === 'idle' ? (
              <Button className="flex-1" onClick={startFocus}><Play className="w-4 h-4 me-1" />{t('ابدأ', 'Start')}</Button>
            ) : (
              <Button className="flex-1" variant="secondary" onClick={pause}><Pause className="w-4 h-4 me-1" />{t('إيقاف', 'Pause')}</Button>
            )}
            <Button variant="outline" size="icon" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
          </div>
        </Card>

        {/* Goals */}
        <Card className="p-6 space-y-3 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{t('أهداف اليوم', 'Today\'s goals')}</h2>
            <Badge variant="outline" className="ms-auto">{goals.filter((g) => g.done).length}/{goals.length}</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              placeholder={t('أضف هدفاً... (الحد 3)', 'Add a goal... (max 3)')}
              disabled={goals.length >= 3}
            />
            <Button onClick={addGoal} disabled={!newGoal.trim() || goals.length >= 3}>+</Button>
          </div>
          <ul className="space-y-1">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/40">
                <input type="checkbox" checked={g.done} onChange={() => toggleGoal(g.id)} className="w-4 h-4 accent-primary" />
                <span className={`flex-1 text-sm ${g.done ? 'line-through text-muted-foreground' : ''}`}>{g.text}</span>
                <Button size="icon" variant="ghost" onClick={() => removeGoal(g.id)} className="h-6 w-6 text-muted-foreground">×</Button>
              </li>
            ))}
            {goals.length === 0 && (
              <li className="text-sm text-muted-foreground text-center py-4">
                {t('حدّد 1-3 أهداف تجعل يومك ناجحاً', 'Pick 1-3 goals that make today a win')}
              </li>
            )}
          </ul>
        </Card>

        {/* Productivity score */}
        <Card className="p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{t('مؤشّر اليوم', 'Today\'s score')}</h2>
          </div>
          <div className="text-center">
            <div className={`text-5xl font-bold ${todayStats.color}`}>{todayStats.score}</div>
            <div className={`text-sm font-medium mt-1 ${todayStats.color}`}>{todayStats.label}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center pt-2 border-t">
            <div>
              <div className="text-2xl font-bold">{todayStats.minutes}</div>
              <div className="text-xs text-muted-foreground">{t('دقيقة تركيز', 'focus min')}</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{todayStats.sessions}</div>
              <div className="text-xs text-muted-foreground">{t('جلسة', 'sessions')}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly heatmap */}
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('نشاطك خلال آخر 7 أيام', 'Your last 7 days')}
        </h2>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'auto repeat(24, minmax(14px, 1fr))' }}>
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[10px] text-muted-foreground text-center">{h}</div>
            ))}
            {weekGrid.map((row, di) => {
              const d = new Date(); d.setDate(d.getDate() - (6 - di));
              return (
                <>
                  <div key={`d${di}`} className="text-xs text-muted-foreground pe-2 text-end self-center">
                    {d.toLocaleDateString(language === 'ar' ? 'ar' : 'en', { weekday: 'short' })}
                  </div>
                  {row.map((mins, h) => {
                    const intensity = Math.min(1, mins / 60);
                    return (
                      <div
                        key={`c${di}-${h}`}
                        title={`${mins} min`}
                        className="aspect-square rounded-sm border border-border/30"
                        style={{ background: mins > 0 ? `hsl(var(--primary) / ${0.15 + intensity * 0.85})` : 'hsl(var(--muted) / 0.3)' }}
                      />
                    );
                  })}
                </>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Reflection */}
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-primary" />
          {t('يوميّات الجلسة', 'Session reflection')}
        </h2>
        <Textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder={t('كيف كانت جلستك؟ ما الذي أنجزته؟', 'How was your session? What did you accomplish?')}
          className="min-h-[80px]"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t('التقييم', 'Rating')}:</span>
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setReflectionRating(r as Reflection['rating'])}
              className={`text-xl transition-transform hover:scale-110 ${r <= reflectionRating ? 'text-amber-400' : 'text-muted-foreground/30'}`}
            >
              ★
            </button>
          ))}
          <div className="flex-1" />
          <Button onClick={addReflection} disabled={!reflectionText.trim()}>{t('حفظ', 'Save')}</Button>
        </div>
        {reflections.length > 0 && (
          <ul className="space-y-2 pt-3 border-t">
            {reflections.slice(0, 5).map((r) => (
              <li key={r.id} className="text-sm p-2 rounded bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span>{r.date}</span>
                  <span className="text-amber-400">{'★'.repeat(r.rating)}</span>
                </div>
                <div className="whitespace-pre-wrap">{r.text}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
