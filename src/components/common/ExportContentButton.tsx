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

function exportAsPDF(title: string, content: string, isReport: boolean) {
  const htmlContent = isReport
    ? content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\n/g, '<br/>')
    : content;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error('Please allow popups to export as PDF');
    return;
  }
  printWindow.document.write(`<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; line-height: 1.8; color: #1a1a1a; direction: rtl; }
    h1 { font-size: 28px; margin-bottom: 16px; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
    h2 { font-size: 22px; margin: 24px 0 12px; }
    h3 { font-size: 18px; margin: 20px 0 10px; }
    p { margin-bottom: 12px; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
    pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; }
    pre code { background: none; padding: 0; }
    blockquote { border-right: 4px solid #3b82f6; padding-right: 16px; margin: 12px 0; color: #6b7280; }
    img { max-width: 100%; border-radius: 8px; }
    li { margin-bottom: 4px; margin-right: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${htmlContent}
</body>
</html>`);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
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
        <DropdownMenuItem onClick={() => {
          exportAsPDF(title, content, isReport);
          toast.success(language === 'ar' ? 'جاري فتح نافذة الطباعة...' : 'Opening print dialog...');
        }}>
          <FileText className="w-4 h-4 me-2" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
