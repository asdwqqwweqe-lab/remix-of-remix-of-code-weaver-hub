import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Flame, Target, TrendingUp, Calendar } from 'lucide-react';

const WEEK_GOAL_KEY = 'writing-week-goal';

interface Session { startedAt: number; durationSec: number; }
function loadFocus(): Session[] {
  try { return JSON.parse(localStorage.getItem('focus-sessions') || '[]'); } catch { return []; }
}

export default function WritingStreaks() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const posts = useBlogStore((s) => s.posts);

  const stats = useMemo(() => {
    const dayKeys = new Set<string>();
    for (const p of posts) {
      const d = new Date((p as any).createdAt ?? 0);
      if (!isNaN(d.getTime())) dayKeys.add(d.toISOString().slice(0, 10));
    }
    // Current streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 400; i++) {
      const k = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
      if (dayKeys.has(k)) streak++;
      else if (i > 0) break;
      else break;
    }
    // Longest streak
    let longest = 0, run = 0;
    const sorted = Array.from(dayKeys).sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { run = 1; longest = 1; continue; }
      const prev = new Date(sorted[i - 1]).getTime();
      const cur = new Date(sorted[i]).getTime();
      run = (cur - prev === 86400000) ? run + 1 : 1;
      if (run > longest) longest = run;
    }
    const weekAgo = Date.now() - 7 * 86400000;
    const weekPosts = posts.filter((p: any) => new Date(p.createdAt ?? 0).getTime() >= weekAgo).length;
    const monthAgo = Date.now() - 30 * 86400000;
    const monthPosts = posts.filter((p: any) => new Date(p.createdAt ?? 0).getTime() >= monthAgo).length;
    // Focus mins this week
    const focus = loadFocus();
    const weekFocus = focus.filter((s) => s.startedAt >= weekAgo).reduce((s, x) => s + x.durationSec, 0) / 60;
    // Weekly word count from post content lengths
    const words = posts
      .filter((p: any) => new Date(p.createdAt ?? 0).getTime() >= weekAgo)
      .reduce((s, p: any) => s + ((p.content || '').replace(/<[^>]+>/g, ' ').match(/\S+/g)?.length || 0), 0);
    return { streak, longest, weekPosts, monthPosts, weekFocus, words };
  }, [posts]);

  const goal = Number(localStorage.getItem(WEEK_GOAL_KEY) || '2000');
  const goalPct = Math.min(100, Math.round((stats.words / goal) * 100));

  const Item = ({ icon: Icon, color, label, value, hint }: any) => (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </Card>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Item icon={Flame} color="text-orange-500"
              label={isAr ? 'السلسلة الحالية' : 'Current streak'}
              value={`${stats.streak} ${isAr ? 'يوم' : 'd'}`}
              hint={isAr ? `أطول سلسلة: ${stats.longest}` : `Longest: ${stats.longest}`} />
        <Item icon={TrendingUp} color="text-emerald-500"
              label={isAr ? 'الأسبوع الحالي' : 'This week'}
              value={stats.weekPosts}
              hint={isAr ? `${stats.monthPosts} مقالة/شهر` : `${stats.monthPosts} posts/mo`} />
        <Item icon={Calendar} color="text-sky-500"
              label={isAr ? 'تركيز الأسبوع' : 'Focus (7d)'}
              value={`${Math.round(stats.weekFocus)}${isAr ? 'د' : 'm'}`}
              hint={isAr ? 'بوموردو' : 'Pomodoro'} />
        <Item icon={Target} color="text-primary"
              label={isAr ? 'كلمات الأسبوع' : 'Words (7d)'}
              value={stats.words.toLocaleString(isAr ? 'ar-EG' : 'en-US')}
              hint={`${goalPct}% ${isAr ? 'من الهدف' : 'of goal'}`} />
      </div>
      <Card className="p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">
            {isAr ? `هدف أسبوعي: ${goal.toLocaleString('ar-EG')} كلمة` : `Weekly goal: ${goal.toLocaleString()} words`}
          </span>
          <span className="tabular-nums font-semibold">{goalPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-accent transition-all"
               style={{ width: `${goalPct}%` }} />
        </div>
      </Card>
    </div>
  );
}
