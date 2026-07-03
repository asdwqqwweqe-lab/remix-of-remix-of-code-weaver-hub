import { useMemo, useState } from 'react';
import {
  Download, Upload, FileJson, FileText, Calendar as CalendarIcon,
  Database, ShieldCheck, AlertTriangle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';

const STORE_KEYS = [
  'blog-storage', 'roadmap-storage', 'settings-storage', 'report-storage',
  'app-todo-items', 'workspaces-v1', 'dashboard-widgets-v1', 'study-streak-v1',
];

interface Backup {
  version: 1;
  exportedAt: string;
  stores: Record<string, unknown>;
}

function download(name: string, mime: string, data: string) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function collectBackup(): Backup {
  const stores: Record<string, unknown> = {};
  for (const key of STORE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { stores[key] = JSON.parse(raw); } catch { stores[key] = raw; }
    }
  }
  return { version: 1, exportedAt: new Date().toISOString(), stores };
}

function icsEscape(v: string) {
  return v.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function toIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export default function DataCenter() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { posts, categories } = useBlogStore();
  const { roadmaps } = useRoadmapStore();
  const [busy, setBusy] = useState(false);
  const [confirmImport, setConfirmImport] = useState<Backup | null>(null);

  const stats = useMemo(() => {
    let bytes = 0;
    for (const key of STORE_KEYS) {
      const v = localStorage.getItem(key);
      if (v) bytes += new Blob([v]).size;
    }
    return {
      posts: posts.length,
      categories: categories.length,
      roadmaps: roadmaps.length,
      size: (bytes / 1024).toFixed(1) + ' KB',
    };
  }, [posts, categories, roadmaps]);

  const exportJson = () => {
    const b = collectBackup();
    download(`backup-${new Date().toISOString().slice(0, 10)}.json`,
             'application/json', JSON.stringify(b, null, 2));
    toast.success(isAr ? 'تم تصدير النسخة' : 'Backup exported');
  };

  const exportMarkdown = async () => {
    setBusy(true);
    try {
      const parts: string[] = [];
      for (const p of posts) {
        const cat = categories.find(c => c.id === p.categoryId);
        parts.push(
          `---`,
          `title: ${(p.title || '').replace(/\n/g, ' ')}`,
          `slug: ${p.slug ?? ''}`,
          `status: ${p.status ?? ''}`,
          `category: ${(isAr ? cat?.nameAr : cat?.nameEn) ?? ''}`,
          `date: ${new Date(p.createdAt).toISOString()}`,
          `---`,
          '',
          p.content ?? '',
          '',
          '---',
          '',
        );
      }
      download(`posts-${new Date().toISOString().slice(0, 10)}.md`,
               'text/markdown', parts.join('\n'));
      toast.success(isAr ? 'تم تصدير المقالات' : 'Markdown exported');
    } finally { setBusy(false); }
  };

  const exportIcs = () => {
    const now = toIcsDate(new Date());
    const events = posts
      .filter(p => p.createdAt)
      .map(p => {
        const start = new Date(p.createdAt);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        return [
          'BEGIN:VEVENT',
          `UID:${p.id}@lovable-blog`,
          `DTSTAMP:${now}`,
          `DTSTART:${toIcsDate(start)}`,
          `DTEND:${toIcsDate(end)}`,
          `SUMMARY:${icsEscape(p.title || 'Untitled')}`,
          `DESCRIPTION:${icsEscape(((p.content || '').replace(/\s+/g, ' ')).slice(0, 300))}`,
          'END:VEVENT',
        ].join('\r\n');
      });
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lovable//Content Calendar//EN',
      ...events, 'END:VCALENDAR',
    ].join('\r\n');
    download(`calendar-${new Date().toISOString().slice(0, 10)}.ics`,
             'text/calendar', ics);
    toast.success(isAr ? 'تم تصدير التقويم' : 'Calendar exported');
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || parsed.version !== 1 || typeof parsed.stores !== 'object') {
        toast.error(isAr ? 'ملف غير صالح' : 'Invalid backup file');
        return;
      }
      setConfirmImport(parsed as Backup);
    } catch {
      toast.error(isAr ? 'فشل قراءة الملف' : 'Failed to read file');
    }
  };

  const applyImport = () => {
    if (!confirmImport) return;
    for (const [k, v] of Object.entries(confirmImport.stores)) {
      try {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      } catch { /* quota */ }
    }
    toast.success(isAr ? 'تم الاستيراد. سيُعاد التحميل…' : 'Imported. Reloading…');
    setConfirmImport(null);
    setTimeout(() => window.location.reload(), 900);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary"><Database className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'مركز البيانات' : 'Data Center'}</h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'تصدير كامل بياناتك أو استيراد نسخة سابقة' : 'Export a full backup or restore a previous one'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'مقالات' : 'Posts', value: stats.posts },
          { label: isAr ? 'تصنيفات' : 'Categories', value: stats.categories },
          { label: isAr ? 'خرائط' : 'Roadmaps', value: stats.roadmaps },
          { label: isAr ? 'الحجم' : 'Size', value: stats.size },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="w-4 h-4 text-blue-500" />
              {isAr ? 'نسخة كاملة (JSON)' : 'Full backup (JSON)'}
              <Badge variant="secondary" className="text-[10px]">portable</Badge>
            </CardTitle>
            <CardDescription>
              {isAr ? 'كل الإعدادات، المقالات، الخرائط، المهام، والويدجت.' :
                'All settings, posts, roadmaps, todos, and widgets.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportJson} className="gap-2 w-full">
              <Download className="w-4 h-4" />{isAr ? 'تصدير JSON' : 'Export JSON'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-emerald-500" />
              {isAr ? 'المقالات (Markdown)' : 'Posts (Markdown)'}
            </CardTitle>
            <CardDescription>
              {isAr ? 'ملف واحد بصيغة Markdown مع front-matter لكل مقال.' :
                'Single Markdown file with front-matter per post.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportMarkdown} disabled={busy} variant="outline" className="gap-2 w-full">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isAr ? 'تصدير Markdown' : 'Export Markdown'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="w-4 h-4 text-purple-500" />
              {isAr ? 'التقويم (iCal)' : 'Calendar (iCal)'}
            </CardTitle>
            <CardDescription>
              {isAr ? 'حدث لكل مقال — استورده في Google/Apple Calendar.' :
                'One event per post — import into Google/Apple Calendar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportIcs} variant="outline" className="gap-2 w-full">
              <Download className="w-4 h-4" />{isAr ? 'تصدير .ics' : 'Export .ics'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-4 h-4 text-primary" />
              {isAr ? 'استيراد نسخة' : 'Import backup'}
            </CardTitle>
            <CardDescription>
              {isAr ? 'استعادة نسخة JSON سابقة — ستستبدل البيانات الحالية.' :
                'Restore a previous JSON backup — replaces current data.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="w-full">
              <input type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
              <span className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors text-sm font-medium">
                <Upload className="w-4 h-4" />{isAr ? 'اختر ملف JSON' : 'Choose JSON file'}
              </span>
            </label>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle className="text-sm">{isAr ? 'خصوصية' : 'Privacy'}</AlertTitle>
        <AlertDescription className="text-xs">
          {isAr
            ? 'التصدير يحدث بالكامل داخل المتصفح — لا يُرسل أي شيء إلى الخادم.'
            : 'Exports run entirely in your browser — nothing is sent to any server.'}
        </AlertDescription>
      </Alert>

      <Dialog open={!!confirmImport} onOpenChange={o => !o && setConfirmImport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isAr ? 'استبدال البيانات الحالية؟' : 'Replace current data?'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              {isAr
                ? 'سيتم استبدال كل ما هو محفوظ حاليًا (مقالات، خرائط، إعدادات) بمحتويات الملف.'
                : 'Everything currently stored (posts, roadmaps, settings) will be replaced.'}
            </p>
            {confirmImport && (
              <div className="text-xs bg-muted p-2 rounded font-mono">
                {isAr ? 'تاريخ التصدير:' : 'Exported:'} {new Date(confirmImport.exportedAt).toLocaleString()}
                <br />
                {isAr ? 'المخازن:' : 'Stores:'} {Object.keys(confirmImport.stores).length}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmImport(null)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button variant="destructive" onClick={applyImport}>
              {isAr ? 'استبدل واستورد' : 'Replace & import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
