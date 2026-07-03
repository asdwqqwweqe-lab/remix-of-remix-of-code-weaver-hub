import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Copy, Trash2, Plus, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import ShareLiveButton from '@/components/sharing/ShareLiveButton';

type Priority = 'low' | 'med' | 'high';
interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: Priority;
  dueDate?: string;
  tags: string[];
  completed: boolean;
  createdAt: number;
}

const STORAGE = 'tasks-v1';

const priorityColors: Record<Priority, string> = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  med: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const load = (): Task[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || '[]');
  } catch {
    return [];
  }
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function Tasks() {
  const { language, isRTL } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>(load);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'done'>('all');
  const [sort, setSort] = useState<'priority' | 'due' | 'created'>('created');
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      notes: notes.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      tags: tagsInput.split(',').map((x) => x.trim()).filter(Boolean),
      completed: false,
      createdAt: Date.now(),
    };
    setTasks([t, ...tasks]);
    setTitle('');
    setNotes('');
    setDueDate('');
    setTagsInput('');
    setPriority('med');
    toast.success(language === 'ar' ? 'أُضيفت المهمة' : 'Task added');
  };

  const toggle = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  const remove = (id: string) => setTasks((ts) => ts.filter((t) => t.id !== id));

  const duplicate = (t: Task) =>
    setTasks((ts) => [{ ...t, id: crypto.randomUUID(), completed: false, createdAt: Date.now() }, ...ts]);

  const updateTitle = (id: string, newTitle: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));

  const allTags = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => s.add(tag)));
    return Array.from(s);
  }, [tasks]);

  const filtered = useMemo(() => {
    const today = todayStr();
    let r = tasks.filter((t) => {
      if (filter === 'today') return t.dueDate === today && !t.completed;
      if (filter === 'overdue') return t.dueDate && t.dueDate < today && !t.completed;
      if (filter === 'done') return t.completed;
      return true;
    });
    if (activeTag) r = r.filter((t) => t.tags.includes(activeTag));
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((t) => t.title.toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q));
    }
    if (sort === 'priority') {
      const order: Record<Priority, number> = { high: 0, med: 1, low: 2 };
      r = [...r].sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sort === 'due') {
      r = [...r].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    } else {
      r = [...r].sort((a, b) => b.createdAt - a.createdAt);
    }
    return r;
  }, [tasks, filter, sort, search, activeTag]);

  const doneToday = tasks.filter((t) => t.completed && new Date(t.createdAt).toISOString().slice(0, 10) === todayStr()).length;
  const totalToday = tasks.filter((t) => new Date(t.createdAt).toISOString().slice(0, 10) === todayStr()).length;
  const percent = totalToday ? Math.round((doneToday / totalToday) * 100) : 0;

  return (
    <div className="container mx-auto py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <CheckSquare className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{language === 'ar' ? 'المهام المتقدمة' : 'Advanced Tasks'}</h1>
        <div className="ms-auto">
          <ShareLiveButton
            kind="task"
            title={language === 'ar' ? 'قائمة المهام' : 'Task List'}
            getContent={() => ({ items: tasks.map(t => ({ text: t.title, done: t.completed })) })}
            liveContent={{ items: tasks.map(t => ({ text: t.title, done: t.completed })) }}
          />
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <Input
          placeholder={language === 'ar' ? 'مهمة جديدة...' : 'New task...'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
        />
        <Textarea
          placeholder={language === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{language === 'ar' ? 'عالية' : 'High'}</SelectItem>
              <SelectItem value="med">{language === 'ar' ? 'متوسطة' : 'Medium'}</SelectItem>
              <SelectItem value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input
            placeholder={language === 'ar' ? 'وسوم مفصولة بفواصل' : 'Tags, comma separated'}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
          <Button onClick={addTask}><Plus className="w-4 h-4 me-2" />{language === 'ar' ? 'إضافة' : 'Add'}</Button>
        </div>
      </Card>

      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {language === 'ar' ? `أنجزت اليوم: ${doneToday}/${totalToday}` : `Today: ${doneToday}/${totalToday}`}
          </span>
          <span className="font-semibold">{percent}%</span>
        </div>
        <Progress value={percent} />
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(['all', 'today', 'overdue', 'done'] as const).map((f) => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {language === 'ar'
                ? { all: 'الكل', today: 'اليوم', overdue: 'متأخرة', done: 'منجزة' }[f]
                : f}
            </Button>
          ))}
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-40 ms-auto"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created">{language === 'ar' ? 'الأحدث' : 'Newest'}</SelectItem>
              <SelectItem value="priority">{language === 'ar' ? 'الأولوية' : 'Priority'}</SelectItem>
              <SelectItem value="due">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due date'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input placeholder={language === 'ar' ? 'بحث...' : 'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeTag === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveTag(null)}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </Badge>
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={activeTag === tag ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            {language === 'ar' ? 'لا توجد مهام' : 'No tasks'}
          </Card>
        )}
        {filtered.map((t) => (
          <Card key={t.id} className="p-3 flex items-start gap-3">
            <Checkbox checked={t.completed} onCheckedChange={() => toggle(t.id)} className="mt-1" />
            <div className="flex-1 min-w-0">
              <Input
                value={t.title}
                onChange={(e) => updateTitle(t.id, e.target.value)}
                className={cn(
                  'border-none bg-transparent px-0 h-auto text-base font-medium focus-visible:ring-0',
                  t.completed && 'line-through text-muted-foreground'
                )}
              />
              {t.notes && <div className="text-sm text-muted-foreground mt-1">{t.notes}</div>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className={priorityColors[t.priority]}>
                  {language === 'ar'
                    ? { low: 'منخفضة', med: 'متوسطة', high: 'عالية' }[t.priority]
                    : t.priority}
                </Badge>
                {t.dueDate && (
                  <Badge variant="outline" className={t.dueDate < todayStr() && !t.completed ? 'border-rose-500/50 text-rose-400' : ''}>
                    {t.dueDate}
                  </Badge>
                )}
                {t.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => duplicate(t)}><Copy className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(' ');
}
