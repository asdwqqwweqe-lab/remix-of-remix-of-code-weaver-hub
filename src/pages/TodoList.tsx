import { useState, useEffect, useMemo } from 'react';
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
  Link as LinkIcon,
  Calendar,
  FileText,
  Map,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  linkedPostId?: string;
  linkedRoadmapId?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
}

const STORAGE_KEY = 'app-todo-items';

function TodoForm({ onAdd, language, posts, roadmaps }: {
  onAdd: (item: Omit<TodoItem, 'id' | 'completed' | 'createdAt'>) => void;
  language: string;
  posts: { id: string; title: string }[];
  roadmaps: { id: string; title: string }[];
}) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [linkedPostId, setLinkedPostId] = useState<string>();
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<string>();
  const [dueDate, setDueDate] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({
      text: text.trim(),
      priority,
      linkedPostId: linkedPostId || undefined,
      linkedRoadmapId: linkedRoadmapId || undefined,
      dueDate: dueDate || undefined,
    });
    setText('');
    setLinkedPostId(undefined);
    setLinkedRoadmapId(undefined);
    setDueDate('');
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder={language === 'ar' ? 'أضف مهمة جديدة...' : 'Add a new task...'}
            className="flex-1"
          />
          <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
              <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
              <SelectItem value="high">{language === 'ar' ? 'عالي' : 'High'}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} className="gap-1">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Link to Post */}
          <Select value={linkedPostId || '_none'} onValueChange={v => setLinkedPostId(v === '_none' ? undefined : v)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <FileText className="w-3 h-3 me-1 shrink-0" />
              <SelectValue placeholder={language === 'ar' ? 'ربط بمقال' : 'Link to post'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{language === 'ar' ? 'بدون ربط' : 'No link'}</SelectItem>
              {posts.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title.slice(0, 30)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Link to Roadmap */}
          <Select value={linkedRoadmapId || '_none'} onValueChange={v => setLinkedRoadmapId(v === '_none' ? undefined : v)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <Map className="w-3 h-3 me-1 shrink-0" />
              <SelectValue placeholder={language === 'ar' ? 'ربط بخريطة' : 'Link to roadmap'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">{language === 'ar' ? 'بدون ربط' : 'No link'}</SelectItem>
              {roadmaps.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.title.slice(0, 30)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Due Date */}
          <Input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-[160px] h-8 text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function TodoItemRow({ todo, language, posts, roadmaps, onToggle, onDelete }: {
  todo: TodoItem;
  language: string;
  posts: { id: string; title: string }[];
  roadmaps: { id: string; title: string }[];
  onToggle: () => void;
  onDelete: () => void;
}) {
  const linkedPost = posts.find(p => p.id === todo.linkedPostId);
  const linkedRoadmap = roadmaps.find(r => r.id === todo.linkedRoadmapId);
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString());

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      todo.completed ? 'bg-muted/30 border-border/30' : 'bg-card border-border hover:border-primary/30',
      isOverdue && 'border-destructive/50 bg-destructive/5'
    )}>
      <Checkbox checked={todo.completed} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", todo.completed && 'line-through text-muted-foreground')}>
          {todo.text}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className={cn("text-xs font-medium",
            todo.priority === 'high' ? 'text-destructive' :
            todo.priority === 'medium' ? 'text-chart-3' : 'text-muted-foreground'
          )}>
            {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'}
            {' '}
            {todo.priority === 'high' ? (language === 'ar' ? 'عالي' : 'High') :
             todo.priority === 'medium' ? (language === 'ar' ? 'متوسط' : 'Medium') :
             (language === 'ar' ? 'منخفض' : 'Low')}
          </span>
          {linkedPost && (
            <Badge variant="outline" className="text-xs gap-1 h-5">
              <FileText className="w-3 h-3" />
              {linkedPost.title.slice(0, 20)}
            </Badge>
          )}
          {linkedRoadmap && (
            <Badge variant="outline" className="text-xs gap-1 h-5">
              <Map className="w-3 h-3" />
              {linkedRoadmap.title.slice(0, 20)}
            </Badge>
          )}
          {todo.dueDate && (
            <Badge variant={isOverdue ? 'destructive' : 'secondary'} className="text-xs gap-1 h-5">
              <Calendar className="w-3 h-3" />
              {new Date(todo.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
            </Badge>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function TodoPanel() {
  const { language } = useLanguage();
  const { posts } = useBlogStore();
  const { roadmaps } = useRoadmapStore();
  const { addNotification } = useNotificationStore();

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = (item: Omit<TodoItem, 'id' | 'completed' | 'createdAt'>) => {
    setTodos(prev => [{
      ...item,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    }, ...prev]);
  };

  const toggleTodo = (id: string) => {
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
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    });
  }, [todos, filter]);

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
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'قائمة المهام' : 'Todo List'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تتبع مهامك اليومية وربطها بالمقالات وخرائط الطريق' : 'Track your daily tasks linked to posts & roadmaps'}
          </p>
        </div>
      </div>

      {/* Progress + Stats */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{language === 'ar' ? 'التقدم الإجمالي' : 'Overall Progress'}</span>
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
      <TodoForm onAdd={addTodo} language={language} posts={postsList} roadmaps={roadmapsList} />

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
            {f === 'all' ? (language === 'ar' ? 'الكل' : 'All') :
             f === 'active' ? (language === 'ar' ? 'نشط' : 'Active') :
             (language === 'ar' ? 'مكتمل' : 'Completed')}
          </Button>
        ))}
      </div>

      {/* Todo List */}
      <ScrollArea className="max-h-[500px]">
        <div className="space-y-2">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد مهام' : 'No tasks yet'}</p>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <TodoItemRow
                key={todo.id}
                todo={todo}
                language={language}
                posts={postsList}
                roadmaps={roadmapsList}
                onToggle={() => toggleTodo(todo.id)}
                onDelete={() => deleteTodo(todo.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
