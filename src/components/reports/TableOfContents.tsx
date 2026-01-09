import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  content: string;
  className?: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const TableOfContents = ({ content, className }: TableOfContentsProps) => {
  const { language } = useLanguage();

  const tocItems = useMemo(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].replace(/\{#[\w-]+\}/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      items.push({ id, text, level });
    }

    return items;
  }, [content]);

  const scrollToHeading = (id: string) => {
    // This is for preview mode - find the heading in the preview
    const preview = document.querySelector('[data-preview-content]');
    if (preview) {
      const headings = preview.querySelectorAll('h1, h2, h3');
      headings.forEach((heading) => {
        const headingId = heading.textContent
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        if (headingId === id) {
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <Card className={cn("sticky top-4", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <List className="h-4 w-4" />
          {language === 'ar' ? 'المحتويات' : 'Contents'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[300px]">
          <nav className="space-y-1">
            {tocItems.map((item, index) => (
              <button
                key={index}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "block w-full text-start text-sm py-1.5 px-2 rounded-md transition-colors hover:bg-muted",
                  "text-muted-foreground hover:text-foreground",
                  item.level === 1 && "font-medium text-foreground",
                  item.level === 2 && "ps-4",
                  item.level === 3 && "ps-6 text-xs"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {item.level > 1 && (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                  {item.text}
                </span>
              </button>
            ))}
          </nav>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TableOfContents;
