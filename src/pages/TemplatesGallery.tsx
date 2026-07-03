import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, CheckCircle2, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { TODO_TEMPLATES, type TodoTemplate } from '@/data/todoTemplates';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'app-todo-items';

interface StoredTodo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  labels: string[];
  createdAt: string;
}

export default function TemplatesGallery() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const [preview, setPreview] = useState<TodoTemplate | null>(null);

  const applyTemplate = (tpl: TodoTemplate) => {
    let existing: StoredTodo[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      existing = raw ? JSON.parse(raw) : [];
    } catch { /* noop */ }

    const now = new Date();
    const created: StoredTodo[] = tpl.tasks.map(t => {
      const due = t.dueOffsetDays != null
        ? new Date(now.getTime() + t.dueOffsetDays * 86400000).toISOString().slice(0, 10)
        : undefined;
      return {
        id: crypto.randomUUID(),
        text: t.text,
        completed: false,
        priority: t.priority,
        dueDate: due,
        labels: t.labels ?? [],
        createdAt: new Date().toISOString(),
      };
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...created, ...existing]));
    toast.success(isAr
      ? `أُضيفت ${created.length} مهمة من قالب "${tpl.name.ar}"`
      : `Added ${created.length} tasks from "${tpl.name.en}"`);
    setPreview(null);
    navigate('/todo');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <LayoutTemplate className="w-7 h-7 text-primary" />
          {isAr ? 'معرض القوالب' : 'Templates Gallery'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? 'اختر قالباً جاهزاً وطبّقه على قائمة مهامك بضغطة واحدة.'
            : 'Pick a ready-made template and apply it to your todo list in one click.'}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TODO_TEMPLATES.map(tpl => (
          <Card key={tpl.id} className={cn('border-2 flex flex-col', tpl.color)}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="text-3xl leading-none">{tpl.icon}</div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base leading-tight">
                    {isAr ? tpl.name.ar : tpl.name.en}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isAr ? tpl.description.ar : tpl.description.en}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ListChecks className="w-4 h-4" />
                <span>{tpl.tasks.length} {isAr ? 'مهمة' : 'tasks'}</span>
                {tpl.tasks.some(t => t.priority === 'high') && (
                  <Badge variant="destructive" className="text-[10px] h-5">
                    {isAr ? 'أولوية عالية' : 'high priority'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1"
                        onClick={() => setPreview(tpl)}>
                  {isAr ? 'معاينة' : 'Preview'}
                </Button>
                <Button size="sm" className="flex-1" onClick={() => applyTemplate(tpl)}>
                  {isAr ? 'تطبيق' : 'Apply'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{preview.icon}</span>
                  {isAr ? preview.name.ar : preview.name.en}
                </DialogTitle>
                <DialogDescription>
                  {isAr ? preview.description.ar : preview.description.en}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-1 my-2">
                {preview.tasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="flex-1">{t.text}</span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {t.priority}
                    </Badge>
                    {t.dueOffsetDays != null && (
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        +{t.dueOffsetDays}d
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={() => applyTemplate(preview)}>
                  {isAr ? 'تطبيق القالب' : 'Apply template'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
