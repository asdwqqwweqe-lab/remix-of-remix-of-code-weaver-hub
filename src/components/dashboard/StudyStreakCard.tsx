import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy } from 'lucide-react';
import { getStreak, type StreakData } from '@/lib/streakService';
import { cn } from '@/lib/utils';

function last90Days(): string[] {
  const arr: string[] = [];
  const d = new Date();
  for (let i = 89; i >= 0; i--) {
    const nd = new Date(d);
    nd.setDate(d.getDate() - i);
    arr.push(nd.toISOString().slice(0, 10));
  }
  return arr;
}

export default function StudyStreakCard() {
  const [data, setData] = useState<StreakData>(() => getStreak());

  useEffect(() => {
    const handler = (e: Event) => setData((e as CustomEvent<StreakData>).detail);
    window.addEventListener('streak:changed', handler);
    return () => window.removeEventListener('streak:changed', handler);
  }, []);

  const days = last90Days();
  const activeSet = new Set(data.activeDays);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          سلسلة التعلم اليومية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-4xl font-bold text-orange-500">{data.currentStreak}</div>
            <div className="text-xs text-muted-foreground">يوم متتالي</div>
          </div>
          <div className="text-sm text-muted-foreground">
            الأطول: <span className="font-semibold text-foreground">{data.longestStreak}</span> يوم
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">آخر 90 يوماً</div>
          <div className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px]" dir="ltr">
            {days.map((d) => (
              <div
                key={d}
                title={d}
                className={cn(
                  'aspect-square rounded-[2px]',
                  activeSet.has(d) ? 'bg-orange-500' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </div>

        {data.achievements.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.achievements.map((m) => (
              <Badge key={m} variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3 text-yellow-500" /> {m} يوم
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
