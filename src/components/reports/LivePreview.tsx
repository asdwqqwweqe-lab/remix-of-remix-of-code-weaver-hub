import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Maximize2, Minimize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import SimpleCodeBlock from '@/components/common/SimpleCodeBlock';

interface LivePreviewProps {
  content: string;
  title?: string;
  className?: string;
}

const LivePreview = ({ content, title, className }: LivePreviewProps) => {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const renderMarkdown = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    
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

      // Handle tables
      const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g;
      let processedPart = part;
      let tableMatch;
      
      while ((tableMatch = tableRegex.exec(part)) !== null) {
        const headers = tableMatch[1].split('|').map(h => h.trim()).filter(Boolean);
        const rows = tableMatch[2].trim().split('\n').map(row => 
          row.split('|').map(cell => cell.trim()).filter(Boolean)
        );
        
        const tableHtml = `
          <div class="my-3 overflow-x-auto rounded-lg border border-border/50">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 border-b border-border/50">
                  ${headers.map(h => `<th class="px-3 py-2 text-start font-semibold text-foreground">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-border/30">
                ${rows.map((row, i) => `
                  <tr class="${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors">
                    ${row.map(cell => `<td class="px-3 py-2 text-muted-foreground">${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        processedPart = processedPart.replace(tableMatch[0], tableHtml);
      }

      // Clean extra blank lines first
      let cleanedPart = processedPart
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s*\n/gm, '\n')
        .trim();

      let html = cleanedPart
        .replace(/^#### (.*$)/gm, '<h4 class="text-sm font-bold mt-3 mb-1 text-foreground">$1</h4>')
        .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1 text-foreground flex items-center gap-2"><span class="w-1 h-4 bg-primary/60 rounded-full"></span>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-1 text-foreground border-b border-border/50 pb-1 flex items-center gap-2"><span class="w-1 h-5 bg-primary rounded-full"></span>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground border-b-2 border-primary/30 pb-1">$1</h1>')
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary border border-border/50">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline decoration-primary/30 hover:decoration-primary" target="_blank">$1</a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="my-2"><img src="$2" alt="$1" class="max-w-full rounded-lg shadow-md border border-border/50" /><figcaption class="text-center text-xs text-muted-foreground mt-1">$1</figcaption></figure>')
        .replace(/^> (.*$)/gm, '<blockquote class="border-s-4 border-primary/50 ps-3 py-1 my-2 bg-muted/30 rounded-e-lg italic text-muted-foreground text-sm">$1</blockquote>')
        .replace(/^---$/gm, '<hr class="my-3 border-t border-border/50" />')
        .replace(/^- \[x\] (.*$)/gm, '<li class="flex items-center gap-2 text-sm"><span class="w-4 h-4 rounded bg-primary/20 text-primary flex items-center justify-center text-xs">✓</span><span class="line-through text-muted-foreground">$1</span></li>')
        .replace(/^- \[ \] (.*$)/gm, '<li class="flex items-center gap-2 text-sm"><span class="w-4 h-4 rounded border border-border"></span><span>$1</span></li>')
        .replace(/^- (.*$)/gm, '<li class="flex items-start gap-2 ms-2 text-sm"><span class="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0"></span><span>$1</span></li>')
        .replace(/^\d+\. (.*$)/gm, '<li class="ms-4 list-decimal marker:text-primary marker:font-semibold text-sm">$1</li>');
      
      // Handle paragraphs - reduce spacing
      html = html
        .replace(/\n\n+/g, '</p><p class="my-1.5 leading-relaxed text-muted-foreground text-sm">')
        .replace(/\n/g, ' ')
        .replace(/<p[^>]*>\s*<\/p>/g, '');

      html = html.replace(/(<li class="flex.*?<\/li>)+/g, (match) => {
        return `<ul class="my-3 space-y-0.5">${match}</ul>`;
      });
      
      html = html.replace(/(<li class="ms-4.*?<\/li>)+/g, (match) => {
        return `<ol class="my-3 space-y-0.5">${match}</ol>`;
      });

      return (
        <div 
          key={index} 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: `<div class="leading-relaxed text-sm">${html}</div>` }}
        />
      );
    });
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 end-4 z-50 gap-2 shadow-lg"
        onClick={() => setIsVisible(true)}
      >
        <Eye className="w-4 h-4" />
        {language === 'ar' ? 'إظهار المعاينة' : 'Show Preview'}
      </Button>
    );
  }

  return (
    <div className={cn(
      "transition-all duration-300",
      isFullscreen 
        ? "fixed inset-4 z-50 bg-background shadow-2xl rounded-lg border" 
        : className
    )}>
      <Card className={cn("h-full flex flex-col", isFullscreen && "border-0 rounded-lg")}>
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {title && <div className="text-lg font-semibold mt-2 text-foreground">{title}</div>}
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="min-h-[200px]" dir="auto">
            {content ? (
              <div className="space-y-1">
                {renderMarkdown(content)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {language === 'ar' ? 'ابدأ الكتابة لرؤية المعاينة' : 'Start typing to see preview'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 end-2 h-8 w-8"
          onClick={() => setIsFullscreen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default LivePreview;
