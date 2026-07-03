import { useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Kanban, Plus, GripVertical, Calendar as CalendarIcon, Flag,
  Circle, PlayCircle, CheckCircle2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'app-todo-items';
type Status = 'todo' | 'doing' | 'done';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  labels?: string[];
  createdAt?: string;
  kanbanStatus?: Status;
  kanbanOrder?: number;
}

const priColor: Record<NonNullable<TodoItem['priority']>, string> = {
  high: 'text-red-500', medium: 'text-amber-500', low: 'text-blue-400',
};

function load(): TodoItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function save(items: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function statusOf(t: TodoItem): Status {
  if (t.completed) return 'done';
  return t.kanbanStatus === 'doing' ? 'doing' : 'todo';
}

function TaskCard({ item, onDelete }: { item: TodoItem; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <Card ref={setNodeRef} style={style}
          className="p-3 group bg-card hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners}
                className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm break-words', item.completed && 'line-through text-muted-foreground')}>
            {item.text}
          </p>
          <div className="flex items-center flex-wrap gap-1.5 mt-2">
            {item.priority && (
              <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5">
                <Flag className={cn('w-2.5 h-2.5', priColor[item.priority])} />
                {item.priority}
              </Badge>
            )}
            {item.dueDate && (
              <Badge variant="outline" className="h-5 text-[10px] gap-1 px-1.5">
                <CalendarIcon className="w-2.5 h-2.5" />
                {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Badge>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
}

function Column({
  status, title, icon, items, tint, onDelete, onQuickAdd, isAr,
}: {
  status: Status; title: string; icon: React.ReactNode; items: TodoItem[];
  tint: string; onDelete: (id: string) => void; onQuickAdd: (status: Status, text: string) => void; isAr: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'col:' + status });
  const [text, setText] = useState('');
  return (
    <div ref={setNodeRef}
         className={cn('flex flex-col rounded-lg border bg-muted/30 min-h-[400px] transition-colors',
                       isOver && 'border-primary bg-primary/5')}>
      <div className={cn('flex items-center justify-between px-3 py-2 border-b', tint)}>
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}{title}
          <Badge variant="secondary" className="h-5 text-[10px]">{items.length}</Badge>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(i => <TaskCard key={i.id} item={i} onDelete={onDelete} />)}
        </SortableContext>
        {items.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-6">
            {isAr ? 'أفلت مهمة هنا' : 'Drop tasks here'}
          </div>
        )}
      </div>
      <form onSubmit={e => {
              e.preventDefault();
              if (text.trim()) { onQuickAdd(status, text.trim()); setText(''); }
            }}
            className="p-2 border-t flex gap-1">
        <Input value={text} onChange={e => setText(e.target.value)}
               placeholder={isAr ? '+ مهمة سريعة' : '+ Quick task'}
               className="h-8 text-xs" />
        <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default function KanbanBoard() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [items, setItems] = useState<TodoItem[]>(load);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // sync across tabs / pages
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) setItems(load()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => { save(items); }, [items]);

  const grouped = useMemo(() => {
    const g: Record<Status, TodoItem[]> = { todo: [], doing: [], done: [] };
    for (const i of items) g[statusOf(i)].push(i);
    for (const s of Object.keys(g) as Status[]) {
      g[s].sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
    }
    return g;
  }, [items]);

  const active = activeId ? items.find(i => i.id === activeId) : null;

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const activeItem = items.find(i => i.id === active.id);
    if (!activeItem) return;

    const overId = String(over.id);
    let newStatus: Status;
    let overItem: TodoItem | undefined;

    if (overId.startsWith('col:')) {
      newStatus = overId.slice(4) as Status;
    } else {
      overItem = items.find(i => i.id === overId);
      if (!overItem) return;
      newStatus = statusOf(overItem);
    }

    const currentStatus = statusOf(activeItem);
    let next = [...items];

    // Update status flags
    next = next.map(i => {
      if (i.id !== activeItem.id) return i;
      return {
        ...i,
        completed: newStatus === 'done',
        kanbanStatus: newStatus === 'done' ? undefined : newStatus,
      };
    });

    // Reorder within destination column
    if (overItem && currentStatus === newStatus) {
      const colIds = grouped[newStatus].map(i => i.id);
      const from = colIds.indexOf(active.id as string);
      const to = colIds.indexOf(overId);
      if (from !== -1 && to !== -1 && from !== to) {
        const reordered = arrayMove(colIds, from, to);
        reordered.forEach((id, idx) => {
          const k = next.findIndex(i => i.id === id);
          if (k !== -1) next[k] = { ...next[k], kanbanOrder: idx };
        });
      }
    } else {
      // give it a fresh order at end of new column
      const colCount = next.filter(i => statusOf(i) === newStatus).length;
      const k = next.findIndex(i => i.id === activeItem.id);
      if (k !== -1) next[k] = { ...next[k], kanbanOrder: colCount };
    }
    setItems(next);
  };

  const quickAdd = (status: Status, text: string) => {
    const newItem: TodoItem = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text, completed: status === 'done',
      kanbanStatus: status === 'done' ? undefined : status,
      priority: 'medium', labels: [], createdAt: new Date().toISOString(),
      kanbanOrder: items.filter(i => statusOf(i) === status).length,
    };
    setItems([...items, newItem]);
  };

  const remove = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    toast(isAr ? 'تم الحذف' : 'Deleted');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Kanban className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? 'لوحة كانبان' : 'Kanban Board'}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'اسحب مهامك بين الأعمدة — مزامنة مع قائمة المهام' :
                'Drag your tasks between columns — synced with your Todo list'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">{items.length} {isAr ? 'مهمة' : 'total'}</Badge>
      </header>

      <DndContext sensors={sensors}
                  onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
                  onDragEnd={handleDragEnd}
                  onDragCancel={() => setActiveId(null)}>
        <div className="grid gap-3 md:grid-cols-3">
          <Column status="todo"
                  title={isAr ? 'للعمل' : 'To do'}
                  icon={<Circle className="w-4 h-4 text-slate-400" />}
                  items={grouped.todo}
                  tint="bg-slate-500/5"
                  onDelete={remove} onQuickAdd={quickAdd} isAr={isAr} />
          <Column status="doing"
                  title={isAr ? 'قيد التنفيذ' : 'In progress'}
                  icon={<PlayCircle className="w-4 h-4 text-blue-500" />}
                  items={grouped.doing}
                  tint="bg-blue-500/5"
                  onDelete={remove} onQuickAdd={quickAdd} isAr={isAr} />
          <Column status="done"
                  title={isAr ? 'منجز' : 'Done'}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  items={grouped.done}
                  tint="bg-emerald-500/5"
                  onDelete={remove} onQuickAdd={quickAdd} isAr={isAr} />
        </div>
        <DragOverlay>
          {active && (
            <Card className="p-3 shadow-lg border-primary">
              <p className="text-sm">{active.text}</p>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
