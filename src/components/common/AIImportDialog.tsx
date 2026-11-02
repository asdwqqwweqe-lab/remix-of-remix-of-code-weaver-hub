import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Copy, ExternalLink, ClipboardPaste, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useReportStore } from '@/store/reportStore';
import { buildPrompt, parseAiResponse, ImportKind } from '@/lib/aiImport';
import { generateSlug } from '@/lib/slug-utils';

const STYLES = {
  ar: ['تقرير تقني شامل', 'ملخص تنفيذي', 'دليل خطوة بخطوة', 'مقارنة جدولية', 'شرح للمبتدئين'],
  en: ['Comprehensive technical report', 'Executive summary', 'Step-by-step guide', 'Comparison with tables', 'Beginner explanation'],
};

export default function AIImportDialog({ kind }: { kind: ImportKind }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const navigate = useNavigate();
  const addPost = useBlogStore((s) => s.addPost);
  const addReport = useReportStore((s) => s.addReport);

  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState(STYLES[ar ? 'ar' : 'en'][0]);
  const [outLang, setOutLang] = useState<'ar' | 'en'>(ar ? 'ar' : 'en');
  const [raw, setRaw] = useState('');
  const [title, setTitle] = useState('');

  const prompt = useMemo(() => buildPrompt({ topic, kind, lang: outLang, style }), [topic, kind, outLang, style]);
  const parsed = useMemo(() => parseAiResponse(raw), [raw]);
  const finalTitle = title || parsed?.title || '';

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    toast.success(ar ? 'تم نسخ البرومبت' : 'Prompt copied');
  };

  // يفتح ChatGPT مباشرة بالبرومبت عبر معامل ?q= (يُعبّئ صندوق الكتابة تلقائياً)
  // مع نسخة احتياطية في الحافظة في حال طال البرومبت عن حدّ الرابط.
  const openChatGPT = async () => {
    try { await navigator.clipboard.writeText(prompt); } catch { /* ignore */ }
    const MAX_URL = 7000;
    if (prompt.length <= MAX_URL) {
      window.open(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`, '_blank', 'noopener');
      toast.success(ar ? 'تم نسخ البرومبت وفتح ChatGPT — إن لم يُرسل تلقائياً اضغط لصق ثم Enter' : 'Prompt copied & ChatGPT opened — if not auto-sent, paste then press Enter');
    } else {
      window.open('https://chatgpt.com/', '_blank', 'noopener');
      toast.info(ar ? 'البرومبت طويل: انسخه من الحافظة والصقه في ChatGPT' : 'Prompt is long: paste it from the clipboard into ChatGPT');
    }
  };

  const pasteClip = async () => {
    try { setRaw(await navigator.clipboard.readText()); } catch { toast.error(ar ? 'الصق يدوياً (Ctrl+V)' : 'Paste manually (Ctrl+V)'); }
  };

  const save = () => {
    if (!parsed || !finalTitle) return toast.error(ar ? 'لا يوجد محتوى صالح' : 'No valid content');
    if (kind === 'report') {
      addReport({ title: finalTitle, content: parsed.html, tags: parsed.tags });
      const id = useReportStore.getState().reports[0]?.id;
      toast.success(ar ? 'تم إنشاء التقرير' : 'Report created');
      setOpen(false); setRaw(''); setTitle('');
      navigate(id ? `/reports/${id}` : '/reports');
    } else {
      addPost({
        title: finalTitle, slug: generateSlug(finalTitle), summary: parsed.summary, content: parsed.html,
        mainLanguage: outLang, status: 'draft', isFavorite: false, viewsCount: 0, commentsEnabled: true,
        tags: parsed.tags, programmingLanguages: [], links: [], attachments: [],
      });
      const posts = useBlogStore.getState().posts;
      const id = posts[posts.length - 1]?.id;
      toast.success(ar ? 'تم إنشاء الموضوع كمسودة' : 'Topic created as draft');
      setOpen(false); setRaw(''); setTitle('');
      navigate(id ? `/posts/${id}/edit` : '/posts');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Sparkles className="w-4 h-4" />{ar ? 'استيراد من AI' : 'Import from AI'}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ar ? (kind === 'report' ? 'تقرير جديد من ChatGPT' : 'موضوع جديد من ChatGPT') : 'Create from ChatGPT / any AI'}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="prompt">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="prompt">1. {ar ? 'انسخ البرومبت' : 'Copy prompt'}</TabsTrigger>
            <TabsTrigger value="paste">2. {ar ? 'الصق الرد' : 'Paste response'}</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3 space-y-1">
                <Label>{ar ? 'الموضوع' : 'Topic'}</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={ar ? 'مثال: مقارنة بين React و Vue' : 'e.g. React vs Vue'} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>{ar ? 'الشكل' : 'Style'}</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STYLES[ar ? 'ar' : 'en'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{ar ? 'لغة الناتج' : 'Output language'}</Label>
                <Select value={outLang} onValueChange={(v) => setOutLang(v as 'ar' | 'en')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="en">English</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <Textarea readOnly value={prompt} dir="ltr" className="font-mono text-xs min-h-[220px]" />
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyPrompt} className="gap-2"><Copy className="w-4 h-4" />{ar ? 'نسخ البرومبت' : 'Copy prompt'}</Button>
              <Button variant="outline" asChild className="gap-2">
                <a href="https://chatgpt.com/" target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />ChatGPT</a>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={pasteClip} className="gap-2"><ClipboardPaste className="w-4 h-4" />{ar ? 'لصق من الحافظة' : 'Paste from clipboard'}</Button>
              {parsed && <Badge variant="secondary">{parsed.format === 'json' ? 'JSON' : 'Markdown'}</Badge>}
            </div>
            <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} dir="auto" className="font-mono text-xs min-h-[160px]"
              placeholder={ar ? 'الصق رد ChatGPT هنا (JSON أو Markdown)...' : 'Paste the AI response here (JSON or Markdown)...'} />
            {parsed && (
              <div className="space-y-3 border rounded-lg p-4">
                <div className="space-y-1">
                  <Label>{ar ? 'العنوان' : 'Title'}</Label>
                  <Input value={finalTitle} onChange={(e) => setTitle(e.target.value)} />
                </div>
                {parsed.tags.length > 0 && <div className="flex flex-wrap gap-1">{parsed.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}</div>}
                <div dir="auto" className="prose prose-sm dark:prose-invert max-w-none max-h-[320px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: parsed.html }} />
              </div>
            )}
            <Button onClick={save} disabled={!parsed || !finalTitle} className="gap-2 w-full">
              <Save className="w-4 h-4" />{ar ? (kind === 'report' ? 'إنشاء التقرير' : 'إنشاء الموضوع') : 'Create'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
