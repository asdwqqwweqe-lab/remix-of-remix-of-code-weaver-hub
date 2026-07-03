import { useRef, useState, useEffect } from 'react';
import {
  Download, Upload, FileJson, CalendarDays, FileText, AlertTriangle, ShieldCheck, Camera, RotateCcw, Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import {
  exportAllJson, importAllJson, exportTodosIcs, exportPostsMarkdown,
} from '@/lib/dataPortability';

const TODO_KEY = 'app-todo-items';
const SNAPSHOTS_KEY = 'quick-backups-v1';
const MAX_SNAPSHOTS = 5;

interface Snapshot { id: string; createdAt: number; label: string; data: string; }

const readSnapshots = (): Snapshot[] => {
  try { return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '[]'); } catch { return []; }
};
const writeSnapshots = (s: Snapshot[]) => localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(s));

const collectLocalData = (): string => {
  const dump: Record<string, unknown> = { format: 'devtale-backup', createdAt: Date.now(), data: {} };
  const data = dump.data as Record<string, unknown>;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || key === SNAPSHOTS_KEY) continue;
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
  }
  return JSON.stringify(dump);
};

export default function DataPortability() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { posts } = useBlogStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(readSnapshots);

  useEffect(() => { writeSnapshots(snapshots); }, [snapshots]);

  const takeSnapshot = () => {
    const snap: Snapshot = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      label: new Date().toLocaleString(isAr ? 'ar' : 'en'),
      data: collectLocalData(),
    };
    setSnapshots((prev) => [snap, ...prev].slice(0, MAX_SNAPSHOTS));
    toast.success(isAr ? 'أُخذت نسخة سريعة' : 'Snapshot captured');
  };
  const restoreSnapshot = (s: Snapshot) => {
    if (!confirm(isAr ? 'استعادة هذه النسخة؟ سيتم استبدال البيانات الحالية.' : 'Restore this snapshot? Current data will be replaced.')) return;
    setPendingImport(s.data);
  };
  const deleteSnapshot = (id: string) => setSnapshots((prev) => prev.filter((s) => s.id !== id));

  const readTodos = () => {
    try {
      const raw = localStorage.getItem(TODO_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const onPickFile = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try {
      const text = await f.text();
      // validate lightly first
      const parsed = JSON.parse(text);
      if (parsed?.format !== 'devtale-backup') {
        toast.error(isAr ? 'ملف غير صالح' : 'Invalid backup file');
        return;
      }
      setPendingImport(text);
    } catch {
      toast.error(isAr ? 'تعذّر قراءة الملف' : 'Failed to read file');
    }
  };

  const doImport = (mode: 'merge' | 'replace') => {
    if (!pendingImport) return;
    try {
      const n = importAllJson(pendingImport, mode);
      toast.success(isAr ? `استُوردت ${n} مفتاح — سيُعاد التحميل` : `Imported ${n} keys — reloading`);
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingImport(null);
    }
  };

  const todos = readTodos();
  const todosWithDue = todos.filter((t: { dueDate?: string }) => !!t.dueDate).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Download className="w-7 h-7 text-primary" />
          {isAr ? 'تصدير واستيراد البيانات' : 'Export & Import Data'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? 'انقل بياناتك بحرية بين الأجهزة أو احفظ نسخة احتياطية محلية.'
            : 'Move your data freely between devices or keep a local backup.'}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              {isAr ? 'نسخة كاملة (JSON)' : 'Full Backup (JSON)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'كل بياناتك: مقالات، مهام، ملاحظات، إعدادات، معرض... في ملف واحد.'
                : 'Everything: posts, todos, notes, settings, gallery… in one file.'}
            </p>
            <Button onClick={exportAllJson} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {isAr ? 'تصدير الكل' : 'Export all'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {isAr ? 'المهام كتقويم (iCal)' : 'Todos as Calendar (iCal)'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `مهامك ذات التواريخ (${todosWithDue}) قابلة للاستيراد في Google/Apple Calendar.`
                : `Your dated todos (${todosWithDue}) — importable into Google/Apple Calendar.`}
            </p>
            <Button onClick={() => {
              if (todosWithDue === 0) {
                toast.error(isAr ? 'لا توجد مهام بتواريخ' : 'No todos with due dates');
                return;
              }
              exportTodosIcs(todos);
            }} className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {isAr ? 'تصدير .ics' : 'Export .ics'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {isAr ? 'المقالات كـ Markdown' : 'Posts as Markdown'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `${posts.length} مقالاً بصيغة Markdown مع frontmatter — جاهز للنقل لأي منصة.`
                : `${posts.length} posts as Markdown with frontmatter — portable to any platform.`}
            </p>
            <Button onClick={() => {
              if (posts.length === 0) {
                toast.error(isAr ? 'لا مقالات' : 'No posts');
                return;
              }
              exportPostsMarkdown(posts);
            }} className="w-full" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {isAr ? 'تصدير .md' : 'Export .md'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              {isAr ? 'استيراد نسخة JSON' : 'Import JSON backup'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isAr
                ? 'يستعيد بياناتك من ملف .json مُصدَّر مسبقاً.'
                : 'Restore your data from a previously exported .json file.'}
            </p>
            <input
              ref={inputRef} type="file" accept="application/json,.json"
              className="hidden" onChange={onFile}
            />
            <Button onClick={onPickFile} className="w-full" variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              {isAr ? 'اختيار ملف' : 'Choose file'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground flex items-start gap-2 p-3 rounded border border-border/50 bg-muted/30">
        <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
        <span>
          {isAr
            ? 'كل شيء يجري في متصفحك — لا تُرفع بياناتك إلى أي خادم. احتفظ بالنسخة في مكان آمن.'
            : 'Everything runs locally in your browser — no data is uploaded. Keep the file safe.'}
        </span>
      </div>

      <AlertDialog open={!!pendingImport} onOpenChange={o => !o && setPendingImport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isAr ? 'كيف تريد الاستيراد؟' : 'How should we import?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? 'الدمج يضيف/يحدّث المفاتيح فقط. الاستبدال يمسح كل شيء ثم يستعيد النسخة.'
                : 'Merge updates keys in place. Replace wipes everything, then restores the file.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <Button variant="outline" onClick={() => doImport('merge')}>
              {isAr ? 'دمج' : 'Merge'}
            </Button>
            <AlertDialogAction onClick={() => doImport('replace')}
                               className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? 'استبدال كامل' : 'Replace all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
