import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Bold, Italic, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon,
  Code as CodeIcon, List, ListOrdered, Quote, Minus, Table as TableIcon,
  Download, Copy, FileDown, Trash2, Eye, Split, Pencil,
} from 'lucide-react';

const STORAGE_KEY = 'markdown-editor-doc';
const TITLE_KEY = 'markdown-editor-title';

const SAMPLE = `# مرحباً بك في محرر Markdown

اكتب هنا نصّك باستخدام صيغة **Markdown** وشاهد المعاينة الحيّة على اليمين.

## الميزات
- معاينة حيّة
- شريط أدوات سريع
- حفظ تلقائي في المتصفح
- تصدير \`.md\` و \`.html\`

> اقتباس أنيق للمثال.

\`\`\`ts
const hello = (name: string) => \`Hello, \${name}!\`;
\`\`\`

| العمود ١ | العمود ٢ |
|----------|----------|
| قيمة     | قيمة     |
`;

marked.setOptions({ gfm: true, breaks: true });

export default function MarkdownEditor() {
  const { language, isRTL } = useLanguage();
  const [title, setTitle] = useState<string>(() => localStorage.getItem(TITLE_KEY) || '');
  const [text, setText] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? SAMPLE);
  const [view, setView] = useState<'split' | 'edit' | 'preview'>('split');

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, text), 300);
    return () => clearTimeout(id);
  }, [text]);
  useEffect(() => { localStorage.setItem(TITLE_KEY, title); }, [title]);

  const html = useMemo(() => {
    const raw = marked.parse(text) as string;
    return DOMPurify.sanitize(raw);
  }, [text]);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const mins = Math.max(1, Math.round(words / 200));
    return { words, chars, mins };
  }, [text]);

  const wrap = (before: string, after = before, placeholder = '') => {
    const ta = document.getElementById('md-textarea') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = text.slice(start, end) || placeholder;
    const next = text.slice(0, start) + before + sel + after + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + sel.length;
      ta.setSelectionRange(pos, pos);
    });
  };
  const prefixLine = (prefix: string) => {
    const ta = document.getElementById('md-textarea') as HTMLTextAreaElement | null;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    setText(text.slice(0, lineStart) + prefix + text.slice(lineStart));
  };

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };
  const exportMd = () => download(`${title || 'document'}.md`, text, 'text/markdown');
  const exportHtml = () => {
    const full = `<!doctype html><html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}"><head><meta charset="utf-8"><title>${title || 'Document'}</title><style>body{max-width:780px;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.7}pre{background:#0b1020;color:#e6edf3;padding:1rem;border-radius:8px;overflow:auto}code{background:#0b1020;color:#e6edf3;padding:.15rem .35rem;border-radius:4px}blockquote{border-inline-start:4px solid #64748b;padding-inline-start:1rem;color:#475569}table{border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:.4rem .6rem}</style></head><body>${html}</body></html>`;
    download(`${title || 'document'}.html`, full, 'text/html');
  };
  const copyMd = async () => {
    await navigator.clipboard.writeText(text);
    toast.success(language === 'ar' ? 'تم النسخ' : 'Copied');
  };
  const clearAll = () => {
    if (!confirm(language === 'ar' ? 'مسح كل المحتوى؟' : 'Clear all content?')) return;
    setText('');
  };

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const toolbar = [
    { icon: Heading1, label: 'H1', act: () => prefixLine('# ') },
    { icon: Heading2, label: 'H2', act: () => prefixLine('## ') },
    { icon: Heading3, label: 'H3', act: () => prefixLine('### ') },
    { icon: Bold, label: 'Bold', act: () => wrap('**', '**', t('نص عريض', 'bold text')) },
    { icon: Italic, label: 'Italic', act: () => wrap('*', '*', t('نص مائل', 'italic')) },
    { icon: LinkIcon, label: 'Link', act: () => wrap('[', '](https://)', t('نص الرابط', 'link text')) },
    { icon: ImageIcon, label: 'Image', act: () => wrap('![', '](https://)', 'alt') },
    { icon: CodeIcon, label: 'Code', act: () => wrap('`', '`', 'code') },
    { icon: Quote, label: 'Quote', act: () => prefixLine('> ') },
    { icon: List, label: 'UL', act: () => prefixLine('- ') },
    { icon: ListOrdered, label: 'OL', act: () => prefixLine('1. ') },
    { icon: Minus, label: 'HR', act: () => setText(text + '\n\n---\n\n') },
    { icon: TableIcon, label: 'Table', act: () => setText(text + '\n\n| A | B |\n|---|---|\n|   |   |\n') },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('محرر Markdown', 'Markdown Editor')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('اكتب، عاين، وصدّر مستنداتك بصيغة Markdown', 'Write, preview and export Markdown documents')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyMd}><Copy className="w-4 h-4 me-1" />{t('نسخ', 'Copy')}</Button>
          <Button variant="outline" size="sm" onClick={exportMd}><Download className="w-4 h-4 me-1" />.md</Button>
          <Button variant="outline" size="sm" onClick={exportHtml}><FileDown className="w-4 h-4 me-1" />.html</Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="text-destructive"><Trash2 className="w-4 h-4 me-1" />{t('مسح', 'Clear')}</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('عنوان المستند...', 'Document title...')}
          className="md:max-w-md"
        />
        <div className="flex-1" />
        <Tabs value={view} onValueChange={(v) => setView(v as 'split' | 'edit' | 'preview')}>
          <TabsList>
            <TabsTrigger value="edit"><Pencil className="w-4 h-4 me-1" />{t('تحرير', 'Edit')}</TabsTrigger>
            <TabsTrigger value="split"><Split className="w-4 h-4 me-1" />{t('مقسّم', 'Split')}</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="w-4 h-4 me-1" />{t('معاينة', 'Preview')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-2 flex flex-wrap gap-1">
        {toolbar.map((b, i) => (
          <Button key={i} variant="ghost" size="sm" onClick={b.act} title={b.label} className="h-8 w-8 p-0">
            <b.icon className="w-4 h-4" />
          </Button>
        ))}
        <div className="ms-auto text-xs text-muted-foreground px-2 self-center">
          {stats.words} {t('كلمة', 'words')} · {stats.chars} {t('حرف', 'chars')} · ~{stats.mins} {t('د قراءة', 'min read')}
        </div>
      </Card>

      <div className={`grid gap-4 ${view === 'split' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {(view === 'edit' || view === 'split') && (
          <Card className="p-0 overflow-hidden">
            <Textarea
              id="md-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[70vh] font-mono text-sm resize-none border-0 focus-visible:ring-0 rounded-none"
              dir="auto"
              placeholder={t('ابدأ الكتابة بصيغة Markdown...', 'Start writing Markdown...')}
            />
          </Card>
        )}
        {(view === 'preview' || view === 'split') && (
          <Card className="p-6 min-h-[70vh] overflow-auto">
            <article
              className="prose prose-invert max-w-none dark:prose-invert
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-3
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2
                [&_p]:my-2 [&_p]:leading-7
                [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:my-2
                [&_li]:my-1
                [&_a]:text-primary [&_a]:underline
                [&_blockquote]:border-s-4 [&_blockquote]:border-primary/50 [&_blockquote]:ps-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
                [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0
                [&_hr]:my-6 [&_hr]:border-border
                [&_table]:w-full [&_table]:my-4 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:bg-muted [&_td]:border [&_td]:border-border [&_td]:p-2
                [&_img]:rounded-lg [&_img]:my-3"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
