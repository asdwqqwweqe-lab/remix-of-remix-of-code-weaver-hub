import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationStore } from '@/components/notifications/NotificationBell';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ListTodo,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Map,
  GripVertical,
  Tag,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Label System ───
interface TodoLabel {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_LABELS: TodoLabel[] = [
  { id: 'bug', name: 'Bug', color: 'hsl(0 84% 60%)' },
  { id: 'feature', name: 'Feature', color: 'hsl(142 71% 45%)' },
  { id: 'urgent', name: 'Urgent', color: 'hsl(25 95% 53%)' },
  { id: 'review', name: 'Review', color: 'hsl(221 83% 53%)' },
  { id: 'docs', name: 'Docs', color: 'hsl(262 83% 58%)' },
  { id: 'design', name: 'Design', color: 'hsl(330 81% 60%)' },
];

const LABELS_STORAGE_KEY = 'app-todo-labels';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  linkedPostId?: string;
  linkedRoadmapId?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  labels: string[];
  createdAt: string;
}

const STORAGE_KEY = 'app-todo-items';

// ─── Label Picker ───
function LabelPicker({
  labels,
  selectedIds,
  onToggle,
  language,
}: {
  labels: TodoLabel[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  language: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <Tag className="w-3 h-3" />
          {selectedIds.length > 0
            ? `${selectedIds.length} ${language === 'ar' ? 'تصنيف' : 'label(s)'}`
            : language === 'ar' ? 'تصنيفات' : 'Labels'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {labels.map(label => (
            <button
              key={label.id}
              onClick={() => onToggle(label.id)}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent',
                selectedIds.includes(label.id) && 'bg-accent'
              )}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1 text-start">{label.name}</span>
              {selectedIds.includes(label.id) && (
                <span className="text-primary text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Label Manager (for custom labels) ───
function LabelManager({
  labels,
  onAdd,
  onRemove,
  language,
}: {
  labels: TodoLabel[];
  onAdd: (label: TodoLabel) => void;
  onRemove: (id: string) => void;
  language: string;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
    });
    setName('');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
          <Plus className="w-3 h-3" />
          {language === 'ar' ? 'إدارة التصنيفات' : 'Manage Labels'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">{language === 'ar' ? 'التصنيفات' : 'Labels'}</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {labels.map(l => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
                <span className="flex-1">{l.name}</span>
                <button onClick={() => onRemove(l.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder={language === 'ar' ? 'اسم التصنيف' : 'Label name'}
              className="h-7 text-xs flex-1"
            />
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0"
            />
            <Button size="sm" className="h-7 px-2" onClick={handleAdd}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Sortable Todo Item ───
function SortableTodoItem({
  todo,
  language,
  posts,
  roadmaps,
  labels,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: TodoItem;
  language: string;
  posts: { id: string; title: string }[];
  roadmaps: { id: string; title: string }[];
  labels: TodoLabel[];
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (newText: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const linkedPost = posts.find(p => p.id === todo.linkedPostId);
  const linkedRoadmap = roadmaps.find(r => r.id === todo.linkedRoadmapId);
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString());
  const todoLabels = labels.filter(l => todo.labels?.includes(l.id));

  const commitEdit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onEdit(trimmed);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-3 rounded-lg border transition-colors',
        todo.completed ? 'bg-muted/30 border-border/30' : 'bg-card border-border hover:border-primary/30',
        isOverdue && 'border-destructive/50 bg-destructive/5',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Checkbox checked={todo.completed} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            autoFocus
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') { setEditText(todo.text); setIsEditing(false); }
            }}
            className="h-7 text-sm"
          />
        ) : (
          <p
            className={cn('font-medium text-sm cursor-pointer', todo.completed && 'line-through text-muted-foreground')}
            onDoubleClick={() => { if (!todo.completed) { setIsEditing(true); setEditText(todo.text); } }}
            title={language === 'ar' ? 'انقر مرتين للتعديل' : 'Double-click to edit'}
          >
            {todo.text}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span className={cn('text-xs font-medium',
            todo.priority === 'high' ? 'text-destructive' :
            todo.priority === 'medium' ? 'text-chart-3' : 'text-muted-foreground'
          )}>
            {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'}
          </span>
          {todoLabels.map(l => (
            <span
              key={l.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </span>
          ))}
          {linkedPost && (
            <Badge variant="outline" className="text-[10px] gap-0.5 h-4 px-1">
              <FileText className="w-2.5 h-2.5" />
              {linkedPost.title.slice(0, 15)}
            </Badge>
          )}
          {linkedRoadmap && (
            <Badge variant="outline" className="text-[10px] gap-0.5 h-4 px-1">
              <Map className="w-2.5 h-2.5" />
              {linkedRoadmap.title.slice(0, 15)}
            </Badge>
          )}
          {todo.dueDate && (
            <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-[10px] gap-0.5 h-4 px-1">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(todo.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </Badge>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// ─── Main Component ───
export default function TodoPanel() {
  const { language } = useLanguage();
  const { posts } = useBlogStore();
  const { roadmaps } = useRoadmapStore();
  const { addNotification } = useNotificationStore();

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      // Ensure labels array exists on old items
      return parsed.map((t: any) => ({ ...t, labels: t.labels || [] }));
    } catch { return []; }
  });

  const [labels, setLabels] = useState<TodoLabel[]>(() => {
    try {
      const saved = localStorage.getItem(LABELS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_LABELS;
    } catch { return DEFAULT_LABELS; }
  });

  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [linkedPostId, setLinkedPostId] = useState<string>();
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<string>();
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels));
  }, [labels]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addTodo = () => {
    if (!newText.trim()) return;
    setTodos(prev => [{
      id: crypto.randomUUID(),
      text: newText.trim(),
      completed: false,
      priority: newPriority,
      labels: newLabels,
      linkedPostId: linkedPostId || undefined,
      linkedRoadmapId: linkedRoadmapId || undefined,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setNewText('');
    setNewLabels([]);
    setLinkedPostId(undefined);
    setLinkedRoadmapId(undefined);
    setDueDate('');
  };

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      const toggled = updated.find(t => t.id === id);
      if (toggled?.completed) {
        addNotification({
          type: 'achievement',
          title: '✅ مهمة مكتملة',
          message: `أكملت: "${toggled.text}"`,
        });
        if (updated.every(t => t.completed)) {
          addNotification({
            type: 'achievement',
            title: '🎉 جميع المهام مكتملة!',
            message: `أحسنت! أنهيت جميع المهام (${updated.length} مهمة)`,
          });
        }
      }
      return updated;
    });
  }, [addNotification]);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const editTodo = useCallback((id: string, newText: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTodos(prev => {
        const oldIndex = prev.findIndex(t => t.id === active.id);
        const newIndex = prev.findIndex(t => t.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const toggleNewLabel = (id: string) => {
    setNewLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const addLabel = (label: TodoLabel) => {
    setLabels(prev => [...prev, label]);
  };

  const removeLabel = (id: string) => {
    setLabels(prev => prev.filter(l => l.id !== id));
    // Remove from all todos too
    setTodos(prev => prev.map(t => ({ ...t, labels: t.labels.filter(l => l !== id) })));
  };

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (filter === 'active' && t.completed) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (labelFilter && !t.labels?.includes(labelFilter)) return false;
      return true;
    });
  }, [todos, filter, labelFilter]);

  const stats = useMemo(() => ({
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
  }), [todos]);

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const postsList = useMemo(() => posts.map(p => ({ id: p.id, title: p.title })), [posts]);
  const roadmapsList = useMemo(() => roadmaps.map(r => ({ id: r.id, title: r.title })), [roadmaps]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ListTodo className="w-8 h-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'قائمة المهام' : 'Todo List'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {language === 'ar' ? 'تتبع مهامك اليومية وربطها بالمقالات وخرائط الطريق' : 'Track tasks linked to posts & roadmaps'}
          </p>
        </div>
        <LabelManager labels={labels} onAdd={addLabel} onRemove={removeLabel} language={language} />
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{language === 'ar' ? 'التقدم' : 'Progress'}</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الكل' : 'Total'}</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">{stats.active}</div>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'نشط' : 'Active'}</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-chart-2">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مكتمل' : 'Done'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Todo */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder={language === 'ar' ? 'أضف مهمة جديدة...' : 'Add a new task...'}
              className="flex-1"
            />
            <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
                <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                <SelectItem value="high">{language === 'ar' ? 'عالي' : 'High'}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTodo} className="gap-1">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <LabelPicker labels={labels} selectedIds={newLabels} onToggle={toggleNewLabel} language={language} />

            <Select value={linkedPostId || '_none'} onValueChange={v => setLinkedPostId(v === '_none' ? undefined : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <FileText className="w-3 h-3 me-1 shrink-0" />
                <SelectValue placeholder={language === 'ar' ? 'ربط بمقال' : 'Link to post'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{language === 'ar' ? 'بدون' : 'None'}</SelectItem>
                {postsList.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title.slice(0, 25)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={linkedRoadmapId || '_none'} onValueChange={v => setLinkedRoadmapId(v === '_none' ? undefined : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Map className="w-3 h-3 me-1 shrink-0" />
                <SelectValue placeholder={language === 'ar' ? 'ربط بخريطة' : 'Link to roadmap'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">{language === 'ar' ? 'بدون' : 'None'}</SelectItem>
                {roadmapsList.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.title.slice(0, 25)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-[140px] h-8 text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {(['all', 'active', 'completed'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? (language === 'ar' ? 'الكل' : 'All') :
             f === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
             (language === 'ar' ? 'مكتمل' : 'Completed')}
          </Button>
        ))}
        <span className="w-px h-5 bg-border mx-1" />
        <Button
          variant={labelFilter === null ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setLabelFilter(null)}
        >
          {language === 'ar' ? 'كل التصنيفات' : 'All Labels'}
        </Button>
        {labels.map(l => (
          <Button
            key={l.id}
            variant={labelFilter === l.id ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setLabelFilter(labelFilter === l.id ? null : l.id)}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: l.color }} />
            {l.name}
          </Button>
        ))}
      </div>

      {/* Todo List with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {filteredTodos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{language === 'ar' ? 'لا توجد مهام' : 'No tasks yet'}</p>
                </div>
              ) : (
                filteredTodos.map(todo => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    language={language}
                    posts={postsList}
                    roadmaps={roadmapsList}
                    labels={labels}
                    onToggle={() => toggleTodo(todo.id)}
                    onEdit={(newText) => editTodo(todo.id, newText)}
                    onDelete={() => deleteTodo(todo.id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </SortableContext>
      </DndContext>
    </div>
  );
}
