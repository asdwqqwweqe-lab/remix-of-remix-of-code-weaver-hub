import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Timer, Coffee, Brain, Settings2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { recordActivity } from '@/lib/streakService';

type Phase = 'focus' | 'short' | 'long';
interface Config { focus: number; short: number; long: number; longEvery: number; autoStart: boolean }
interface Session { date: string; phase: Phase; minutes: number; endedAt: number }

const CFG_KEY = 'pomodoro-config-v1';
const SESSIONS_KEY = 'pomodoro-sessions-v1';
const DEFAULT_CFG: Config = { focus: 25, short: 5, long: 15, longEvery: 4, autoStart: false };

function loadCfg(): Config {
  try { return { ...DEFAULT_CFG, ...JSON.parse(localStorage.getItem(CFG_KEY) ?? '{}') }; }
  catch { return DEFAULT_CFG; }
}
function loadSessions(): Session[] {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]'); } catch { return []; }
}
function saveSessions(s: Session[]) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s.slice(-500))); }

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 660;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.85);
  } catch {}
}

export default function Pomodoro() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [cfg, setCfg] = useState<Config>(loadCfg);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [phase, setPhase] = useState<Phase>('focus');
  const [remaining, setRemaining] = useState<number>(loadCfg().focus * 60);
  const [running, setRunning] = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const tick = useRef<number | null>(null);

  useEffect(() => { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }, [cfg]);

  const phaseMinutes = (p: Phase) => p === 'focus' ? cfg.focus : p === 'short' ? cfg.short : cfg.long;

  // Reset remaining when phase or its config value changes and timer is not running
  useEffect(() => {
    if (!running) setRemaining(phaseMinutes(phase) * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cfg.focus, cfg.short, cfg.long]);

  const finishPhase = () => {
    beep();
    const done: Session = {
      date: new Date().toISOString().slice(0, 10),
      phase, minutes: phaseMinutes(phase), endedAt: Date.now(),
    };
    const next = [...sessions, done];
    setSessions(next); saveSessions(next);

    if (phase === 'focus') {
      recordActivity();
      const nc = focusCount + 1;
      setFocusCount(nc);
      const nextPhase: Phase = nc % cfg.longEvery === 0 ? 'long' : 'short';
      setPhase(nextPhase);
      setRemaining(phaseMinutes(nextPhase) * 60);
      toast.success(isAr ? '🎉 جلسة تركيز مكتملة' : '🎉 Focus session done');
    } else {
      setPhase('focus');
      setRemaining(cfg.focus * 60);
      toast(isAr ? 'انتهت الاستراحة — للعمل!' : 'Break over — back to work!');
    }
    setRunning(cfg.autoStart);
  };

  useEffect(() => {
    if (!running) { if (tick.current) window.clearInterval(tick.current); return; }
    tick.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { window.clearInterval(tick.current!); finishPhase(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => { if (tick.current) window.clearInterval(tick.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    document.title = running
      ? `${fmt(remaining)} · ${label(phase, isAr)}`
      : (isAr ? 'مؤقّت التركيز' : 'Focus Timer');
    return () => { document.title = isAr ? 'المدوّنة' : 'Blog'; };
  }, [remaining, running, phase, isAr]);

  const total = phaseMinutes(phase) * 60;
  const progress = 1 - remaining / total;

  const today = new Date().toISOString().slice(0, 10);
  const todayFocus = sessions.filter(s => s.date === today && s.phase === 'focus');
  const totalMin = todayFocus.reduce((a, s) => a + s.minutes, 0);

  const weekChart = useMemo(() => {
    const arr: { day: string; min: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const min = sessions.filter(s => s.date === key && s.phase === 'focus')
        .reduce((a, s) => a + s.minutes, 0);
      arr.push({ day: d.toLocaleDateString(isAr ? 'ar' : 'en', { weekday: 'short' }), min });
    }
    return arr;
  }, [sessions, isAr]);
  const weekMax = Math.max(30, ...weekChart.map(x => x.min));

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Timer className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? 'مؤقّت التركيز' : 'Focus Timer'}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'تقنية Pomodoro لجلسات تعلم منتظمة' : 'Pomodoro technique for consistent study sessions'}
            </p>
          </div>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Settings2 className="w-4 h-4" />{isAr ? 'إعدادات' : 'Settings'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3" align="end">
            {(['focus', 'short', 'long'] as const).map(k => (
              <div key={k} className="space-y-1">
                <Label className="text-xs">
                  {k === 'focus' ? (isAr ? 'تركيز (د)' : 'Focus (min)')
                    : k === 'short' ? (isAr ? 'استراحة قصيرة (د)' : 'Short break (min)')
                    : (isAr ? 'استراحة طويلة (د)' : 'Long break (min)')}
                </Label>
                <Input type="number" min={1} max={120} value={cfg[k]}
                       onChange={e => setCfg({ ...cfg, [k]: Math.max(1, +e.target.value || 1) })} />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? 'استراحة طويلة كل' : 'Long break every'}</Label>
              <Input type="number" min={2} max={10} value={cfg.longEvery}
                     onChange={e => setCfg({ ...cfg, longEvery: Math.max(2, +e.target.value || 4) })} />
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={cfg.autoStart}
                     onChange={e => setCfg({ ...cfg, autoStart: e.target.checked })} />
              {isAr ? 'بدء المرحلة التالية تلقائيًا' : 'Auto-start next phase'}
            </label>
          </PopoverContent>
        </Popover>
      </header>

      {/* Timer */}
      <Card>
        <CardContent className="py-8 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {(['focus', 'short', 'long'] as const).map(p => (
              <Button key={p} size="sm"
                      variant={phase === p ? 'default' : 'outline'}
                      onClick={() => { setPhase(p); setRunning(false); }}
                      className="gap-1.5">
                {p === 'focus' ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                {label(p, isAr)}
              </Button>
            ))}
          </div>

          <div className="relative w-64 h-64">
            <svg className="w-full h-full -rotate-90">
              <circle cx="128" cy="128" r="112" strokeWidth="12" className="stroke-muted fill-none" />
              <circle cx="128" cy="128" r="112" strokeWidth="12" strokeLinecap="round"
                      className="stroke-primary fill-none transition-all duration-500"
                      strokeDasharray={2 * Math.PI * 112}
                      strokeDashoffset={2 * Math.PI * 112 * (1 - progress)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold tabular-nums">{fmt(remaining)}</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                {label(phase, isAr)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="lg" onClick={() => setRunning(r => !r)} className="gap-2 min-w-[120px]">
              {running ? <><Pause className="w-4 h-4" />{isAr ? 'إيقاف' : 'Pause'}</>
                       : <><Play className="w-4 h-4" />{isAr ? 'ابدأ' : 'Start'}</>}
            </Button>
            <Button size="lg" variant="outline"
                    onClick={() => { setRunning(false); setRemaining(phaseMinutes(phase) * 60); }}
                    className="gap-2">
              <RotateCcw className="w-4 h-4" />{isAr ? 'صفّر' : 'Reset'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{isAr ? 'جلسات اليوم' : 'Sessions today'}</div>
            <div className="text-3xl font-bold mt-1">{todayFocus.length}</div>
            <Badge variant="secondary" className="mt-2 text-[10px]">{totalMin} min</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{isAr ? 'إجمالي الجلسات' : 'Total sessions'}</div>
            <div className="text-3xl font-bold mt-1">
              {sessions.filter(s => s.phase === 'focus').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{isAr ? 'الدورة الحالية' : 'Current cycle'}</div>
            <div className="text-3xl font-bold mt-1">{focusCount % cfg.longEvery} / {cfg.longEvery}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            {isAr ? 'آخر 7 أيام' : 'Last 7 days'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {weekChart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-muted-foreground tabular-nums">{d.min || ''}</div>
                <div className="w-full bg-muted rounded-t-sm relative overflow-hidden"
                     style={{ height: '100%' }}>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary transition-all"
                       style={{ height: `${(d.min / weekMax) * 100}%` }} />
                </div>
                <div className="text-[10px] text-muted-foreground">{d.day}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function label(p: Phase, isAr: boolean) {
  if (isAr) return p === 'focus' ? 'تركيز' : p === 'short' ? 'استراحة قصيرة' : 'استراحة طويلة';
  return p === 'focus' ? 'Focus' : p === 'short' ? 'Short break' : 'Long break';
}
