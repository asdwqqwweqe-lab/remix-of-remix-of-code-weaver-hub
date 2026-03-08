import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotificationStore } from '@/components/notifications/NotificationBell';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ListTodo,
  Plus,
  Trash2,
  Link as LinkIcon,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  linkedPostId?: string;
  linkedRoadmapId?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

const STORAGE_KEY = 'app-todo-items';

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

  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newText.trim()) return;
    setTodos(prev => [{
      id: crypto.randomUUID(),
      text: newText.trim(),
      completed: false,
      priority: newPriority,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setNewText('');
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

        // Check all-done milestone
        const allActive = updated.filter(t => !t.completed);
        if (allActive.length === 0 && updated.length > 0) {
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

  const priorityColor = (p: string) => {
    if (p === 'high') return 'text-destructive';
    if (p === 'medium') return 'text-chart-3';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ListTodo className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'قائمة المهام' : 'Todo List'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تتبع مهامك اليومية' : 'Track your daily tasks'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الكل' : 'Total'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'نشط' : 'Active'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-chart-2">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مكتمل' : 'Done'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Todo */}
      <Card>
        <CardContent className="pt-4">
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
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
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
              <div
                key={todo.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  todo.completed ? 'bg-muted/30 border-border/30' : 'bg-card border-border hover:border-primary/30'
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium",
                    todo.completed && 'line-through text-muted-foreground'
                  )}>
                    {todo.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs font-medium", priorityColor(todo.priority))}>
                      {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'}
                      {' '}
                      {todo.priority === 'high' ? (language === 'ar' ? 'عالي' : 'High') :
                       todo.priority === 'medium' ? (language === 'ar' ? 'متوسط' : 'Medium') :
                       (language === 'ar' ? 'منخفض' : 'Low')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTodo(todo.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
