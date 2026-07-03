import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, useSortable, rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Sparkles, ListTodo, FileText, Flame, PenLine, StickyNote, Clock,
  Settings2, GripVertical, Plus, X, Timer,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';

const STORAGE_KEY = 'dashboard-widgets-v1';

type WidgetId =
  | 'today-todos' | 'recent-post' | 'streak' | 'word-count'
  | 'quick-note' | 'pomodoro-jump' | 'quote';

interface WidgetDef {
  id: WidgetId;
  icon: typeof ListTodo;
  color: string;
  labelAr: string;
  labelEn: string;
}

const WIDGETS: WidgetDef[] = [
  { id: 'today-todos', icon: ListTodo, color: 'text-emerald-500', labelAr: 'مهام اليوم', labelEn: 'Todos today' },
  { id: 'recent-post', icon: FileText, color: 'text-blue-500', labelAr: 'آخر مقال', labelEn: 'Latest post' },
  { id: 'streak', icon: Flame, color: 'text-orange-500', labelAr: 'السلسلة', labelEn: 'Streak' },
  { id: 'word-count', icon: PenLine, color: 'text-purple-500', labelAr: 'كلمات اليوم', labelEn: 'Words today' },
  { id: 'quick-note', icon: StickyNote, color: 'text-amber-500', labelAr: 'ملاحظة سريعة', labelEn: 'Quick note' },
  { id: 'pomodoro-jump', icon: Timer, color: 'text-red-500', labelAr: 'بومودورو', labelEn: 'Pomodoro' },
  { id: 'quote', icon: Sparkles, color: 'text-teal-500', labelAr: 'تلميح اليوم', labelEn: 'Daily tip' },
];

const DEFAULT_ORDER: WidgetId[] = ['today-todos', 'recent-post', 'streak', 'word-count'];

function loadOrder(): WidgetId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetId[];
      if (Array.isArray(parsed)) return parsed.filter(id => WIDGETS.some(w => w.id === id));
    }
  } catch { /* noop */ }
  return DEFAULT_ORDER;
}

// ─── Individual widget bodies ───
function useWidgetData(isAr: boolean) {
  const { posts } = useBlogStore();

  const todosToday = useMemo(() => {
    try {
      const raw = localStorage.getItem('app-todo-items');
      const items = raw ? JSON.parse(raw) : [];
      const today = new Date().toISOString().slice(0, 10);
      const due = items.filter((t: { dueDate?: string; completed: boolean }) =>
        t.dueDate === today && !t.completed).length;
      const done = items.filter((t: { completed: boolean }) => t.completed).length;
      return { due, done, total: items.length };
    } catch { return { due: 0, done: 0, total: 0 }; }
  }, []);

  const streak = useMemo(() => {
    try {
      const raw = localStorage.getItem('study-streak-v1');
      const data = raw ? JSON.parse(raw) : { current: 0 };
      return data.current ?? 0;
    } catch { return 0; }
  }, []);

  const wordsToday = useMemo(() => {
    const today = new Date().toDateString();
    return posts
      .filter(p => new Date(p.updatedAt).toDateString() === today)
      .reduce((sum, p) => sum + (p.content?.split(/\s+/).filter(Boolean).length ?? 0), 0);
  }, [posts]);

  const latestPost = useMemo(() => {
    return [...posts].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  }, [posts]);

  const tip = useMemo(() => {
    const tips = isAr ? [
      'اكتب لمدة 25 دقيقة ثم استرح 5 — بومودورو.',
      'راجع مسودة قديمة اليوم وأنجزها.',
      'استخدم Ctrl+K للوصول السريع.',
      'أضف tag واحد لكل مقال يسهّل الاكتشاف.',
    ] : [
      'Write for 25 min, rest 5 — try Pomodoro.',
      'Revisit an old draft today and ship it.',
      'Use Ctrl+K for the command palette.',
      'One good tag per post improves discovery.',
    ];
    return tips[new Date().getDate() % tips.length];
  }, [isAr]);

  return { todosToday, streak, wordsToday, latestPost, tip };
}

function WidgetBody({ id, data, isAr }: {
  id: WidgetId;
  data: ReturnType<typeof useWidgetData>;
  isAr: boolean;
}) {
  const def = WIDGETS.find(w => w.id === id)!;
  const Icon = def.icon;
  const label = isAr ? def.labelAr : def.labelEn;

  const wrap = (children: React.ReactNode, to?: string) => {
    const inner = (
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg bg-muted/50', def.color)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          {children}
        </div>
      </div>
    );
    return to ? <Link to={to} className="block">{inner}</Link> : inner;
  };

  switch (id) {
    case 'today-todos':
      return wrap(
        <div>
          <div className="text-xl font-bold">{data.todosToday.due}</div>
          <div className="text-[11px] text-muted-foreground">
            {isAr ? `${data.todosToday.done}/${data.todosToday.total} منجزة` :
              `${data.todosToday.done}/${data.todosToday.total} done`}
          </div>
        </div>, '/todo');
    case 'recent-post':
      return wrap(
        data.latestPost ? (
          <div>
            <div className="text-sm font-semibold truncate">{data.latestPost.title}</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(data.latestPost.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ) : <div className="text-sm text-muted-foreground">—</div>,
        data.latestPost ? `/posts/${data.latestPost.id}` : '/posts');
    case 'streak':
      return wrap(
        <div>
          <div className="text-xl font-bold">{data.streak} {isAr ? 'يوم' : 'days'}</div>
          <div className="text-[11px] text-muted-foreground">
            {isAr ? 'استمر في التعلم' : 'Keep learning'}
          </div>
        </div>);
    case 'word-count':
      return wrap(
        <div>
          <div className="text-xl font-bold">{data.wordsToday.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">{isAr ? 'كلمة اليوم' : 'words today'}</div>
        </div>, '/posts');
    case 'quick-note':
      return wrap(
        <div className="text-xs text-muted-foreground">
          {isAr ? 'اضغط لفتح الملاحظات' : 'Tap to open notes'}
        </div>, '/todo');
    case 'pomodoro-jump':
      return wrap(
        <div className="text-xs text-muted-foreground">
          {isAr ? '25 دقيقة تركيز' : '25-min focus'}
        </div>);
    case 'quote':
      return wrap(<div className="text-xs italic leading-snug">"{data.tip}"</div>);
  }
}

// ─── Sortable card wrapper ───
function SortableWidget({ id, editing, onRemove, children }: {
  id: WidgetId; editing: boolean; onRemove: () => void; children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !editing });
  const style = { transform: CSS.Transform.toString(transform), transition,
                  opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <Card className="relative group hover:border-primary/40 transition-colors">
        <CardContent className="p-3">
          {editing && (
            <>
              <button {...attributes} {...listeners}
                      className="absolute top-1 right-1 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <button onClick={onRemove}
                      className="absolute top-1 left-1 p-1 text-muted-foreground hover:text-destructive">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main ───
export default function DashboardWidgets() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [order, setOrder] = useState<WidgetId[]>(loadOrder);
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const data = useWidgetData(isAr);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const persist = (next: WidgetId[]) => {
    setOrder(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = order.indexOf(active.id as WidgetId);
    const newIdx = order.indexOf(over.id as WidgetId);
    persist(arrayMove(order, oldIdx, newIdx));
  };

  const remove = (id: WidgetId) => persist(order.filter(x => x !== id));
  const add = (id: WidgetId) => {
    if (order.includes(id)) return;
    persist([...order, id]);
    setPickerOpen(false);
  };

  const available = WIDGETS.filter(w => !order.includes(w.id));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {isAr ? 'ويدجت مثبتة' : 'Pinned widgets'}
        </h2>
        <div className="flex items-center gap-1">
          {editing && available.length > 0 && (
            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? 'إضافة' : 'Add'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'اختر ويدجت' : 'Pick a widget'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2">
                  {available.map(w => {
                    const Icon = w.icon;
                    return (
                      <button key={w.id} onClick={() => add(w.id)}
                              className="p-3 rounded border hover:border-primary hover:bg-muted/50 text-left flex items-center gap-2">
                        <Icon className={cn('w-4 h-4', w.color)} />
                        <span className="text-sm">{isAr ? w.labelAr : w.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs"
                  onClick={() => setEditing(e => !e)}>
            <Settings2 className="w-3.5 h-3.5" />
            {editing ? (isAr ? 'تم' : 'Done') : (isAr ? 'تخصيص' : 'Customize')}
          </Button>
        </div>
      </div>

      {order.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded">
          {isAr ? 'لا ويدجت. اضغط "تخصيص" لإضافة.' : 'No widgets. Click "Customize" to add.'}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {order.map(id => (
                <SortableWidget key={id} id={id} editing={editing} onRemove={() => remove(id)}>
                  <WidgetBody id={id} data={data} isAr={isAr} />
                </SortableWidget>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
