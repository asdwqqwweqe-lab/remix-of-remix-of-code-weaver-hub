import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Timer, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'focus' | 'short' | 'long';
interface Session { date: string; duration: number; mode: Mode; ts: number; }

const STORAGE = 'focus-sessions-v1';
const GOAL_KEY = 'focus-goal-v1';
const DURATIONS_KEY = 'focus-durations-v1';

const loadSessions = (): Session[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
};

const beep = () => {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; gain.gain.value = 0.15;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, 400);
  } catch {}
};

export default function FocusTimer() {
  const { language, isRTL } = useLanguage();
  const [durations, setDurations] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DURATIONS_KEY) || '{"focus":25,"short":5,"long":15}'); }
    catch { return { focus: 25, short: 5, long: 15 }; }
  });
  const [mode, setMode] = useState<Mode>('focus');
  const [remaining, setRemaining] = useState(durations.focus * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [goal, setGoal] = useState<number>(() => Number(localStorage.getItem(GOAL_KEY) || 120));
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => { localStorage.setItem(DURATIONS_KEY, JSON.stringify(durations)); }, [durations]);
  useEffect(() => { localStorage.setItem(GOAL_KEY, String(goal)); }, [goal]);
  useEffect(() => { setRemaining(durations[mode] * 60); }, [mode, durations]);

  useEffect(() => {
    if (!running) return;
    lastTickRef.current = performance.now();
    const tick = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setRemaining((r) => {
        const next = r - delta;
        if (next <= 0) {
          finishSession();
          return 0;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line
  }, [running]);

  const finishSession = () => {
    setRunning(false);
    beep();
    const s: Session = { date: new Date().toISOString().slice(0, 10), duration: durations[mode], mode, ts: Date.now() };
    setSessions((prev) => {
      const next = [s, ...prev];
      localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
    if (mode === 'focus') {
      const c = cycles + 1;
      setCycles(c);
      const nextMode: Mode = c % 4 === 0 ? 'long' : 'short';
      setMode(nextMode);
      toast.success(language === 'ar' ? 'انتهت جلسة التركيز — استراحة!' : 'Focus done — take a break!');
    } else {
      setMode('focus');
      toast.success(language === 'ar' ? 'انتهت الاستراحة — لنعد للعمل' : 'Break done — back to work');
    }
  };

  const reset = () => { setRunning(false); setRemaining(durations[mode] * 60); };
  const skip = () => finishSession();

  const total = durations[mode] * 60;
  const percent = ((total - remaining) / total) * 100;
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const todayMin = sessions.filter((s) => s.date === today && s.mode === 'focus').reduce((a, s) => a + s.duration, 0);
  const weekMin = sessions.filter((s) => s.date >= weekAgo && s.mode === 'focus').reduce((a, s) => a + s.duration, 0);
  const totalCount = sessions.filter((s) => s.mode === 'focus').length;

  const streak = useMemo(() => {
    const days = new Set(sessions.filter((s) => s.mode === 'focus').map((s) => s.date));
    let n = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      if (days.has(d)) n++;
      else if (i > 0) break;
    }
    return n;
  }, [sessions]);

  const radius = 130;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - percent / 100);
  const modeColor = mode === 'focus' ? 'hsl(var(--primary))' : mode === 'short' ? '#f97316' : '#a855f7';
  const modeLabel = language === 'ar'
    ? { focus: 'تركيز', short: 'استراحة قصيرة', long: 'استراحة طويلة' }[mode]
    : { focus: 'Focus', short: 'Short break', long: 'Long break' }[mode];

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Timer className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{language === 'ar' ? 'مؤقّت التركيز المتقدم' : 'Advanced Focus Timer'}</h1>
      </div>

      <Card className="p-8 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {(['focus', 'short', 'long'] as Mode[]).map((m) => (
            <Button key={m} variant={mode === m ? 'default' : 'outline'} size="sm" onClick={() => { setMode(m); setRunning(false); }}>
              {language === 'ar' ? { focus: 'تركيز', short: 'قصيرة', long: 'طويلة' }[m] : m}
            </Button>
          ))}
        </div>

        <div className="relative">
          <svg width="300" height="300" className="-rotate-90">
            <circle cx="150" cy="150" r={radius} stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
            <circle cx="150" cy="150" r={radius} stroke={modeColor} strokeWidth="12" fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl font-mono font-bold tabular-nums">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="text-sm text-muted-foreground mt-2">{modeLabel}</div>
            <div className="text-xs text-muted-foreground">{language === 'ar' ? `دورة #${cycles + 1}` : `Cycle #${cycles + 1}`}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="lg" onClick={() => setRunning(!running)}>
            {running ? <><Pause className="w-5 h-5 me-2" />{language === 'ar' ? 'إيقاف' : 'Pause'}</> : <><Play className="w-5 h-5 me-2" />{language === 'ar' ? 'ابدأ' : 'Start'}</>}
          </Button>
          <Button size="lg" variant="outline" onClick={reset}><RotateCcw className="w-5 h-5" /></Button>
          <Button size="lg" variant="outline" onClick={skip}><SkipForward className="w-5 h-5" /></Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{language === 'ar' ? 'اليوم' : 'Today'}</div>
          <div className="text-2xl font-bold">{todayMin} <span className="text-sm font-normal">min</span></div>
          <Progress className="mt-2" value={Math.min(100, (todayMin / goal) * 100)} />
          <div className="text-xs text-muted-foreground mt-1">{language === 'ar' ? `الهدف: ${goal} دقيقة` : `Goal: ${goal} min`}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{language === 'ar' ? 'الأسبوع' : 'This week'}</div>
          <div className="text-2xl font-bold">{weekMin} <span className="text-sm font-normal">min</span></div>
          <div className="text-xs text-muted-foreground mt-1">{language === 'ar' ? `${totalCount} جلسة إجمالاً` : `${totalCount} sessions total`}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{language === 'ar' ? 'أطول سلسلة' : 'Streak'}</div>
          <div className="text-2xl font-bold">{streak} <span className="text-sm font-normal">{language === 'ar' ? 'يوم' : 'days'}</span></div>
        </Card>
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">{language === 'ar' ? 'التخصيص' : 'Customize'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>{language === 'ar' ? 'تركيز (د)' : 'Focus (min)'}</Label>
            <Input type="number" min={1} max={180} value={durations.focus} onChange={(e) => setDurations({ ...durations, focus: Number(e.target.value) || 25 })} />
          </div>
          <div>
            <Label>{language === 'ar' ? 'قصيرة (د)' : 'Short (min)'}</Label>
            <Input type="number" min={1} max={60} value={durations.short} onChange={(e) => setDurations({ ...durations, short: Number(e.target.value) || 5 })} />
          </div>
          <div>
            <Label>{language === 'ar' ? 'طويلة (د)' : 'Long (min)'}</Label>
            <Input type="number" min={1} max={90} value={durations.long} onChange={(e) => setDurations({ ...durations, long: Number(e.target.value) || 15 })} />
          </div>
          <div>
            <Label>{language === 'ar' ? 'الهدف اليومي' : 'Daily goal'}</Label>
            <Input type="number" min={10} max={720} value={goal} onChange={(e) => setGoal(Number(e.target.value) || 120)} />
          </div>
        </div>
      </Card>
    </div>
  );
}
