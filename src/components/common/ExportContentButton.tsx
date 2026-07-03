import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileCode } from 'lucide-react';
import { toast } from 'sonner';

interface ExportContentButtonProps {
  title: string;
  content: string;
  type: 'post' | 'report';
}

function htmlToMarkdown(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  md = md.replace(/<pre[^>]*><code[^>]*class="language-(\w+)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```$1\n$2\n```\n\n');
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n');
  md = md.replace(/<hr[^>]*\/?>/gi, '---\n\n');
  md = md.replace(/<[^>]+>/g, '');
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  md = md.replace(/\n{3,}/g, '\n\n').trim();
  return md;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAsMarkdown(title: string, content: string, isReport: boolean) {
  const md = isReport ? content : `# ${title}\n\n${htmlToMarkdown(content)}`;
  const filename = `${title.replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-')}.md`;
  downloadFile(md, filename, 'text/markdown');
}

async function exportAsPDF(title: string, content: string, isReport: boolean) {
  const { exportHtmlToPdf, markdownToHtml } = await import('@/lib/pdfExporter');
  const html = isReport ? markdownToHtml(content) : content;
  await exportHtmlToPdf({ title, html, direction: 'rtl' });
}

export default function ExportContentButton({ title, content, type }: ExportContentButtonProps) {
  const { language } = useLanguage();
  const isReport = type === 'report';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Download className="w-4 h-4" />
          {language === 'ar' ? 'تصدير' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => {
          exportAsMarkdown(title, content, isReport);
          toast.success(language === 'ar' ? 'تم التصدير كـ Markdown' : 'Exported as Markdown');
        }}>
          <FileCode className="w-4 h-4 me-2" />
          Markdown (.md)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={async () => {
          const id = toast.loading(language === 'ar' ? 'جاري إنشاء PDF...' : 'Generating PDF...');
          try {
            await exportAsPDF(title, content, isReport);
            toast.success(language === 'ar' ? 'تم تصدير PDF' : 'PDF exported', { id });
          } catch (e) {
            toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed', { id });
          }
        }}>
          <FileText className="w-4 h-4 me-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
