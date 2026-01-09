import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import SimpleCodeBlock from '@/components/common/SimpleCodeBlock';

interface LivePostPreviewProps {
  content: string;
  title?: string;
  className?: string;
}

const LivePostPreview = ({ content, title, className }: LivePostPreviewProps) => {
  const { language } = useLanguage();

  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;

    const parts = markdown.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      const codeMatch = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (codeMatch) {
        const lang = codeMatch[1] || 'plaintext';
        const code = codeMatch[2].trim();
        return (
          <div key={index} className="my-3">
            <SimpleCodeBlock code={code} language={lang} />
          </div>
        );
      }

      // Parse markdown tables first
      const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
      let html = part;
      
      html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
        const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
        const rows = bodyRows.trim().split('\n').map((row: string) => 
          row.split('|').map((cell: string) => cell.trim()).filter(Boolean)
        );
        
        return `<div class="overflow-x-auto my-3 rounded-lg border border-border"><table class="w-full border-collapse text-sm">
          <thead><tr class="bg-muted">${headers.map((h: string) => `<th class="border-b border-border px-3 py-2 text-start font-semibold text-foreground">${h}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((row: string[], i: number) => 
            `<tr class="${i % 2 === 0 ? 'bg-background' : 'bg-muted/30'} hover:bg-muted/50 transition-colors">${row.map((cell: string) => `<td class="border-b border-border/50 px-3 py-1.5">${cell}</td>`).join('')}</tr>`
          ).join('')}</tbody>
        </table></div>`;
      });

      html = html
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-3 mb-1.5 text-foreground">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2 text-foreground border-b border-border pb-1">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-5 mb-2 text-foreground">$1</h1>')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3" />')
        .replace(/^> (.*$)/gm, '<blockquote class="border-s-4 border-primary ps-4 italic my-2 text-muted-foreground bg-muted/30 py-2 rounded-e">$1</blockquote>')
        .replace(/^---$/gm, '<hr class="my-4 border-border" />')
        .replace(/^- \[x\] (.*$)/gm, '<li class="ms-4 my-0.5 flex items-center gap-2"><input type="checkbox" checked disabled class="rounded" /><span>$1</span></li>')
        .replace(/^- \[ \] (.*$)/gm, '<li class="ms-4 my-0.5 flex items-center gap-2"><input type="checkbox" disabled class="rounded" /><span>$1</span></li>')
        .replace(/^- (.*$)/gm, '<li class="ms-4 my-0.5">$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li class="ms-4 list-decimal my-0.5">$1</li>')
        .replace(/\n\n/g, '</p><p class="my-2">')
        .replace(/\n/g, '<br />');

      html = html.replace(/(<li.*?<\/li>)+/g, (match) => {
        if (match.includes('list-decimal')) {
          return `<ol class="list-decimal my-2 space-y-0.5">${match}</ol>`;
        }
        return `<ul class="list-disc my-2 space-y-0.5">${match}</ul>`;
      });

      return (
        <div 
          key={index} 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: `<p class="my-2">${html}</p>` }}
        />
      );
    });
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-y-auto" dir="auto">
          {title && (
            <div className="mb-4 pb-3 border-b">
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
          )}
          {content ? (
            renderMarkdown(content)
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Eye className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'ar' ? 'ابدأ الكتابة لرؤية المعاينة' : 'Start writing to see preview'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LivePostPreview;
