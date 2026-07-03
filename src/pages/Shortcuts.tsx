import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Keyboard, Search } from 'lucide-react';
import { loadShortcuts, saveShortcuts, normalizeCombo, CustomShortcut } from '@/lib/shortcutsRegistry';

// Built-in navigation targets for custom shortcuts
const NAV_TARGETS: { path: string; ar: string; en: string }[] = [
  { path: '/', ar: 'الرئيسية', en: 'Home' },
  { path: '/dashboard', ar: 'لوحة التحكم', en: 'Dashboard' },
  { path: '/posts', ar: 'المواضيع', en: 'Posts' },
  { path: '/posts/new', ar: 'موضوع جديد', en: 'New post' },
  { path: '/reports', ar: 'التقارير', en: 'Reports' },
  { path: '/reports/new', ar: 'تقرير جديد', en: 'New report' },
  { path: '/todo', ar: 'المهام', en: 'Todo' },
  { path: '/kanban', ar: 'كانبان', en: 'Kanban' },
  { path: '/pomodoro', ar: 'مؤقّت التركيز', en: 'Pomodoro' },
  { path: '/mindmap', ar: 'خريطة ذهنية', en: 'Mind Map' },
  { path: '/markdown', ar: 'محرر Markdown', en: 'Markdown' },
  { path: '/voice-notes', ar: 'ملاحظات صوتية', en: 'Voice Notes' },
  { path: '/flashcards', ar: 'البطاقات التعليمية', en: 'Flashcards' },
  { path: '/habits', ar: 'العادات', en: 'Habits' },
  { path: '/converters', ar: 'المحوّلات', en: 'Converters' },
  { path: '/settings', ar: 'الإعدادات', en: 'Settings' },
];

// Built-in shortcuts (documented; app registers most of these already)
const BUILTIN = [
  { category: 'nav', keys: 'Ctrl+K', ar: 'البحث العام', en: 'Global search' },
  { category: 'nav', keys: 'G then H', ar: 'الذهاب للرئيسية', en: 'Go to home' },
  { category: 'nav', keys: 'G then P', ar: 'المواضيع', en: 'Posts' },
  { category: 'nav', keys: 'G then R', ar: 'التقارير', en: 'Reports' },
  { category: 'nav', keys: 'G then D', ar: 'لوحة التحكم', en: 'Dashboard' },
  { category: 'action', keys: 'N', ar: 'إنشاء جديد', en: 'Create new' },
  { category: 'action', keys: '?', ar: 'قائمة الاختزالات', en: 'Shortcuts help' },
  { category: 'edit', keys: 'Ctrl+S', ar: 'حفظ', en: 'Save' },
  { category: 'edit', keys: 'Ctrl+Z', ar: 'تراجع', en: 'Undo' },
  { category: 'edit', keys: 'Ctrl+Shift+Z', ar: 'إعادة', en: 'Redo' },
];

export default function Shortcuts() {
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [custom, setCustom] = useState<CustomShortcut[]>(loadShortcuts);
  const [addOpen, setAddOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [combo, setCombo] = useState('');
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('/');
  const [search, setSearch] = useState('');
  const recBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveShortcuts(custom); }, [custom]);

  // Global listener for custom shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag) || (e.target as HTMLElement)?.isContentEditable) return;
      const pressed = normalizeCombo(e);
      const hit = custom.find((s) => s.enabled && s.keys === pressed);
      if (hit) {
        e.preventDefault();
        if (hit.action.type === 'navigate') navigate(hit.action.path);
        else if (hit.action.type === 'toast') toast(hit.action.message);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [custom, navigate]);

  const onRecKey = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    const c = normalizeCombo(e.nativeEvent as any);
    setCombo(c);
    setRecording(false);
  };

  const addCustom = () => {
    if (!combo || !label.trim()) { toast.error(t('أكمل الحقول', 'Fill all fields')); return; }
    if (custom.some((s) => s.keys === combo)) { toast.error(t('هذا الاختصار مستخدم', 'Combo already used')); return; }
    setCustom((p) => [{
      id: crypto.randomUUID?.() ?? Math.random().toString(36),
      keys: combo, label: label.trim(),
      action: { type: 'navigate', path: target },
      enabled: true,
    }, ...p]);
    setCombo(''); setLabel(''); setTarget('/'); setAddOpen(false);
    toast.success(t('تمت الإضافة', 'Added'));
  };

  const toggle = (id: string) => setCustom((p) => p.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  const remove = (id: string) => setCustom((p) => p.filter((s) => s.id !== id));

  const filteredBuiltin = BUILTIN.filter((b) =>
    !search || (language === 'ar' ? b.ar : b.en).toLowerCase().includes(search.toLowerCase()) || b.keys.toLowerCase().includes(search.toLowerCase()));

  const cats = [
    { id: 'nav', ar: 'التنقل', en: 'Navigation' },
    { id: 'action', ar: 'الإجراءات', en: 'Actions' },
    { id: 'edit', ar: 'التحرير', en: 'Editing' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1200px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('لوحة الاختزالات', 'Keyboard Shortcuts')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('مرجع الاختزالات المدمجة وإضافة اختصارات مخصّصة', 'Reference for built-in shortcuts and add custom ones')}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); setRecording(false); setCombo(''); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 me-1" />{t('اختصار مخصّص', 'Custom shortcut')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t('اختصار مخصّص جديد', 'New custom shortcut')}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">{t('التسمية', 'Label')}</label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('مثال: افتح المهام', 'e.g. Open Todo')} />
              </div>
              <div>
                <label className="text-xs font-medium">{t('توجه إلى', 'Go to')}</label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NAV_TARGETS.map((n) => (
                      <SelectItem key={n.path} value={n.path}>{language === 'ar' ? n.ar : n.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">{t('مجموعة المفاتيح', 'Key combination')}</label>
                <div
                  ref={recBoxRef}
                  tabIndex={0}
                  onClick={() => { setRecording(true); recBoxRef.current?.focus(); }}
                  onKeyDown={onRecKey}
                  className={`mt-1 p-4 rounded border text-center cursor-pointer transition
                    ${recording ? 'border-primary bg-primary/5 animate-pulse' : 'border-dashed'}`}
                >
                  {combo ? (
                    <kbd className="px-3 py-1 rounded bg-muted font-mono">{combo}</kbd>
                  ) : recording ? (
                    <span className="text-sm text-primary">{t('اضغط المفاتيح الآن...', 'Press keys now...')}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('انقر ثم اضغط المفاتيح', 'Click then press the keys')}</span>
                  )}
                </div>
              </div>
              <Button onClick={addCustom} className="w-full">{t('حفظ', 'Save')}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Custom shortcuts */}
      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <Keyboard className="w-4 h-4" />{t('اختصاراتي المخصّصة', 'My custom shortcuts')}
          <Badge variant="secondary">{custom.length}</Badge>
        </div>
        {custom.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            {t('لا توجد اختصارات مخصّصة بعد', 'No custom shortcuts yet')}
          </div>
        ) : (
          <div className="space-y-2">
            {custom.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded border">
                <kbd className="px-2 py-1 rounded bg-muted font-mono text-xs">{s.keys}</kbd>
                <div className="flex-1 text-sm">{s.label}</div>
                <Badge variant="outline" className="text-[10px]">→ {s.action.type === 'navigate' ? s.action.path : ''}</Badge>
                <Switch checked={s.enabled} onCheckedChange={() => toggle(s.id)} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(s.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Built-in */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium flex-1">{t('اختصارات مدمجة', 'Built-in shortcuts')}</div>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('بحث...', 'Search...')} className="ps-8 h-8 w-48" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {cats.map((c) => {
            const items = filteredBuiltin.filter((b) => b.category === c.id);
            if (items.length === 0) return null;
            return (
              <div key={c.id} className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase">{language === 'ar' ? c.ar : c.en}</div>
                {items.map((b, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm p-2 rounded hover:bg-muted/50">
                    <span>{language === 'ar' ? b.ar : b.en}</span>
                    <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">{b.keys}</kbd>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
