import { useMemo, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ar as arLocale, enUS } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, FileText, X, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Post } from '@/types/blog';

const statusColor = (s: Post['status']) =>
  s === 'published' ? 'bg-emerald-500' :
  s === 'draft'     ? 'bg-amber-500'   :
  'bg-muted-foreground';

function DraggablePostPill({ post, compact = false }: { post: Post; compact?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    data: { postId: post.id },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group flex items-center gap-1.5 px-2 py-1 rounded-md border bg-card cursor-grab active:cursor-grabbing text-xs hover:bg-accent/40 transition-colors ${isDragging ? 'opacity-40' : ''} ${compact ? '' : 'mb-1'}`}
      title={post.title}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor(post.status)}`} />
      <span className="truncate flex-1">{post.title || '—'}</span>
    </div>
  );
}

function DayCell({
  day, currentMonth, posts, isAr, onRemove,
}: {
  day: Date; currentMonth: Date; posts: Post[]; isAr: boolean;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${format(day, 'yyyy-MM-dd')}`,
    data: { date: format(day, 'yyyy-MM-dd') },
  });
  const inMonth = isSameMonth(day, currentMonth);
  const today = isToday(day);

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[110px] border border-border/60 rounded-md p-1.5 flex flex-col gap-1 transition-colors ${
        inMonth ? 'bg-card' : 'bg-muted/20 text-muted-foreground'
      } ${isOver ? 'ring-2 ring-primary bg-accent/30' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${today ? 'text-primary' : ''}`}>
          {format(day, 'd')}
        </span>
        {today && <Badge variant="outline" className="h-4 text-[10px] px-1">{isAr ? 'اليوم' : 'Today'}</Badge>}
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {posts.slice(0, 4).map(p => (
          <div key={p.id} className="relative group">
            <DraggablePostPill post={p} compact />
            <button
              className="absolute top-0.5 end-0.5 opacity-0 group-hover:opacity-100 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground p-0.5 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
              title={isAr ? 'إزالة من التقويم' : 'Remove from calendar'}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        {posts.length > 4 && (
          <div className="text-[10px] text-muted-foreground px-1">
            +{posts.length - 4} {isAr ? 'أخرى' : 'more'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentCalendar() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const locale = isAr ? arLocale : enUS;
  const { posts, updatePost } = useBlogStore();

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [activePost, setActivePost] = useState<Post | null>(null);

  const weekStartsOn = isAr ? 6 : 0; // Sat for AR, Sun for EN
  const gridStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn });
  const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const weekdayLabels = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => format(new Date(start.getTime() + i * 86400000), 'EEE', { locale }));
  }, [weekStartsOn, locale]);

  const scheduledByDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      if (!p.scheduledAt) continue;
      const key = p.scheduledAt.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const unscheduled = useMemo(
    () => posts.filter(p => !p.scheduledAt && p.status !== 'archived'),
    [posts]
  );

  const scheduledCount = useMemo(
    () => posts.filter(p => !!p.scheduledAt).length,
    [posts]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragStart = (e: DragStartEvent) => {
    const p = posts.find(x => x.id === e.active.id);
    setActivePost(p || null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActivePost(null);
    const overId = e.over?.id;
    if (!overId || typeof overId !== 'string' || !overId.startsWith('day-')) return;
    const date = overId.slice(4); // yyyy-MM-dd
    const postId = e.active.id as string;
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    if (p.scheduledAt?.slice(0, 10) === date) return;
    updatePost(postId, { scheduledAt: `${date}T09:00:00` });
    toast.success(isAr ? `تم جدولة "${p.title}"` : `Scheduled "${p.title}"`);
  };

  const removeFromCalendar = (id: string) => {
    updatePost(id, { scheduledAt: undefined });
    toast.success(isAr ? 'أُزيلت من التقويم' : 'Removed from calendar');
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            {isAr ? 'تقويم المحتوى' : 'Content Calendar'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'اسحب المقالات من القائمة الجانبية إلى الأيام لجدولة نشرها.'
              : 'Drag posts from the sidebar onto days to plan publishing.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{isAr ? 'المجدوَل' : 'Scheduled'}: {scheduledCount}</Badge>
          <Badge variant="outline">{isAr ? 'غير مجدوَل' : 'Unscheduled'}: {unscheduled.length}</Badge>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">
                  {format(currentMonth, 'LLLL yyyy', { locale })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>
                    {isAr ? 'اليوم' : 'Today'}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdayLabels.map((d, i) => (
                  <div key={i} className="text-xs font-semibold text-center text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const list = scheduledByDay.get(key) ?? [];
                  return (
                    <DayCell
                      key={key}
                      day={day}
                      currentMonth={currentMonth}
                      posts={list}
                      isAr={isAr}
                      onRemove={removeFromCalendar}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" /> {isAr ? 'منشور' : 'Published'}</span>
                <span className="flex items-center gap-1.5"><Circle className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {isAr ? 'مسودة' : 'Draft'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {isAr ? 'مقالات بدون جدولة' : 'Unscheduled Posts'}
                <Badge variant="secondary" className="ms-auto">{unscheduled.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pe-2">
                {unscheduled.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    {isAr ? 'كل المقالات مجدوَلة 🎉' : 'All posts are scheduled 🎉'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {unscheduled.map(p => (
                      <DraggablePostPill key={p.id} post={p} />
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="mt-3 pt-3 border-t">
                <Link to="/posts/new">
                  <Button variant="outline" size="sm" className="w-full">
                    + {isAr ? 'مقال جديد' : 'New Post'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <DragOverlay>
          {activePost ? (
            <div className="px-2 py-1 rounded-md border bg-card text-xs shadow-lg flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${statusColor(activePost.status)}`} />
              <span className="truncate max-w-[200px]">{activePost.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
