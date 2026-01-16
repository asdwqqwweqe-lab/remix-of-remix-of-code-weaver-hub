import { useEffect, useRef, useState, useMemo } from 'react';
import hljs from 'highlight.js';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, AlignVerticalSpaceAround, RotateCcw, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import SimpleCodeBlock from '@/components/common/SimpleCodeBlock';

interface CodeHighlighterProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
  showTableOfContents?: boolean;
  externalFontSize?: number;
  externalLineHeight?: number;
  externalCodeFontSize?: number;
  externalCodeLineHeight?: number;
  useExternalSettings?: boolean;
}

const FONT_SIZE_KEY = 'code-font-size';
const LINE_HEIGHT_KEY = 'code-line-height';

const CodeHighlighter = ({
  content,
  className,
  dir,
  showTableOfContents = true,
  externalFontSize,
  externalLineHeight,
  externalCodeFontSize,
  externalCodeLineHeight,
  useExternalSettings = false,
}: CodeHighlighterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalFontSize, setInternalFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? parseInt(saved) : 16;
  });
  const [internalLineHeight, setInternalLineHeight] = useState(() => {
    const saved = localStorage.getItem(LINE_HEIGHT_KEY);
    return saved ? parseFloat(saved) : 1.75;
  });

  // Use external settings if provided, otherwise use internal
  const fontSize = useExternalSettings && externalFontSize !== undefined ? externalFontSize : internalFontSize;
  const lineHeight = useExternalSettings && externalLineHeight !== undefined ? externalLineHeight : internalLineHeight;
  const setFontSize = useExternalSettings ? () => { } : setInternalFontSize;
  const setLineHeight = useExternalSettings ? () => { } : setInternalLineHeight;
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract table of contents from markdown content
  const tableOfContents = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const headings: { level: number; text: string; id: string }[] = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) continue;

      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        let text = headingMatch[2]
          .replace(/\{#[\w-]+\}/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`/g, '')
          .trim();

        const id = text
          .toLowerCase()
          .replace(/[^\w\u0600-\u06FF]+/g, '-')
          .replace(/^-|-$/g, '');

        if (text && id) {
          headings.push({ level, text, id });
        }
      }
    }
    return headings;
  }, [content]);

  // Preprocess content to handle pasted HTML content
  const preprocessContent = (rawContent: string): string => {
    let processed = rawContent || '';

    const decodeHtml = (s: string) =>
      s
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'");

    const extractLanguage = (attrs: string) => {
      const classMatch = attrs.match(/class\s*=\s*"([^"]*)"/i);
      const dataLangMatch = attrs.match(/data-language\s*=\s*"([^"]*)"/i);
      const raw = (dataLangMatch?.[1] || classMatch?.[1] || '').toLowerCase();

      const m1 = raw.match(/language-([a-z0-9_+-]+)/i);
      const m2 = raw.match(/lang-([a-z0-9_+-]+)/i);
      return (m1?.[1] || m2?.[1] || '').trim() || undefined;
    };

    const codeBlocks: Array<{ lang?: string; code: string }> = [];
    const stashCodeBlock = (lang: string | undefined, code: string) => {
      const token = `@@CODEBLOCK_${codeBlocks.length}@@`;
      codeBlocks.push({ lang, code });
      return `\n${token}\n`;
    };

    // 1) Stash <pre><code> blocks first so we don't accidentally strip tags inside code
    processed = processed.replace(
      /<pre[^>]*>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi,
      (_, attrs: string, code: string) => {
        const lang = extractLanguage(attrs);
        const decoded = decodeHtml(code)
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/?span[^>]*>/gi, '')
          .replace(/\r\n/g, '\n');
        return stashCodeBlock(lang, decoded.trimEnd());
      }
    );

    // 2) Handle standalone <code> blocks (inline vs block)
    processed = processed.replace(
      /<code([^>]*)>([\s\S]*?)<\/code>/gi,
      (_, attrs: string, code: string) => {
        const lang = extractLanguage(attrs);
        const decoded = decodeHtml(code)
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/?span[^>]*>/gi, '')
          .replace(/\r\n/g, '\n');

        const isInline = !decoded.includes('\n') && decoded.trim().length <= 120;
        if (isInline) {
          const inline = decoded.trim().replace(/`/g, '\\`');
          return `\`${inline}\``;
        }

        return stashCodeBlock(lang, decoded.trimEnd());
      }
    );

    // 3) Convert common HTML structures to markdown-like text
    processed = processed.replace(/<br\s*\/?>/gi, '\n');
    processed = processed.replace(/<\/p>/gi, '\n\n');
    processed = processed.replace(/<p[^>]*>/gi, '');
    processed = processed.replace(/<\/div>/gi, '\n');
    processed = processed.replace(/<div[^>]*>/gi, '\n');

    processed = processed.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
    processed = processed.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    processed = processed.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
    processed = processed.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
    processed = processed.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
    processed = processed.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');

    processed = processed.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
    processed = processed.replace(/<\/?[uo]l[^>]*>/gi, '\n');

    processed = processed.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

    processed = processed.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
    processed = processed.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
    processed = processed.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
    processed = processed.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');

    processed = processed.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n');

    // 4) Strip any remaining tags (safe now because code blocks are stashed)
    processed = processed.replace(/<[^>]+>/g, '');

    // 5) Restore stashed code blocks as fenced code
    processed = processed.replace(/@@CODEBLOCK_(\d+)@@/g, (_, idxStr: string) => {
      const idx = Number(idxStr);
      const item = codeBlocks[idx];
      if (!item) return '';
      const fenceLang = item.lang ? item.lang : 'auto';
      return `\n\n\
\`\`\`${fenceLang}\n${item.code}\n\`\`\`\n\n`;
    });

    // Clean up excessive newlines
    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed.trim();
  };

  // Render markdown content like ReportDetails
  const renderMarkdown = (markdownContent: string) => {
    // Preprocess to handle HTML content
    const processedContent = preprocessContent(markdownContent);
    const parts = processedContent.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      const codeMatch = part.match(/```([^\n`]*)\n?([\s\S]*?)```/);
      if (codeMatch) {
        const lang = (codeMatch[1] || 'auto').trim() || 'auto';
        const code = codeMatch[2].replace(/^\n+|\n+$/g, '');
        return (
          <div key={index} className="my-4">
            <SimpleCodeBlock
              code={code}
              language={lang}
              fontSize={useExternalSettings && externalCodeFontSize !== undefined ? externalCodeFontSize : 14}
              lineHeight={useExternalSettings && externalCodeLineHeight !== undefined ? externalCodeLineHeight : 1.5}
            />
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
          <div class="my-4 overflow-x-auto rounded-lg border border-border/50">
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

      // Remove extra blank lines
      processedPart = processedPart
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+$/gm, '')
        .trim();

      let html = processedPart
        .replace(/^###### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h6 id="${id}" class="text-sm font-semibold mt-3 mb-1 text-foreground scroll-mt-4">${text}</h6>`;
        })
        .replace(/^##### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h5 id="${id}" class="text-sm font-bold mt-3 mb-1 text-foreground scroll-mt-4">${text}</h5>`;
        })
        .replace(/^#### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h4 id="${id}" class="text-base font-bold mt-4 mb-2 text-foreground scroll-mt-4">${text}</h4>`;
        })
        .replace(/^### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h3 id="${id}" class="text-lg font-bold mt-4 mb-2 text-foreground flex items-center gap-2 scroll-mt-4"><span class="w-1 h-4 bg-primary/60 rounded-full"></span>${text}</h3>`;
        })
        .replace(/^## (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h2 id="${id}" class="text-xl font-bold mt-5 mb-2 text-foreground flex items-center gap-2 scroll-mt-4 pb-2 border-b border-border/50"><span class="w-1.5 h-5 bg-primary rounded-full"></span>${text}</h2>`;
        })
        .replace(/^# (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h1 id="${id}" class="text-2xl font-bold mt-5 mb-3 text-foreground scroll-mt-4 pb-2 border-b-2 border-primary/30">${text}</h1>`;
        })
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary border border-border/50">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline decoration-primary/30 hover:decoration-primary transition-colors inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">$1<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="my-3"><img src="$2" alt="$1" class="max-w-full rounded-lg shadow-md border border-border/50" /><figcaption class="text-center text-sm text-muted-foreground mt-1">$1</figcaption></figure>')
        .replace(/^> (.*$)/gm, '<blockquote class="border-s-4 border-primary/50 ps-3 py-1 my-2 bg-muted/30 rounded-e-lg italic text-muted-foreground">$1</blockquote>')
        .replace(/^---$/gm, '<hr class="my-4 border-t border-border/50" />')
        .replace(/^- \[x\] (.*$)/gm, '<li class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-primary/20 text-primary flex items-center justify-center text-xs">✓</span><span class="line-through text-muted-foreground">$1</span></li>')
        .replace(/^- \[ \] (.*$)/gm, '<li class="flex items-center gap-2"><span class="w-4 h-4 rounded border border-border"></span><span>$1</span></li>')
        .replace(/^- (.*$)/gm, '<li class="flex items-start gap-2 ms-1"><span class="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0"></span><span>$1</span></li>')
        .replace(/^\d+\. (.*$)/gm, '<li class="ms-4 list-decimal marker:text-primary marker:font-semibold">$1</li>');

      // Clean up spacing - preserve newlines for paragraph separation
      html = html
        .replace(/<br\s*\/?>/gi, '')
        .replace(/\n\n+/g, '</p><p class="mb-3">')
        .replace(/\n/g, ' ')
        .replace(/<p[^>]*>\s*<\/p>/g, '')
        .replace(/<p[^>]*>[\s\u00A0]*<\/p>/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      html = html.replace(/(<li class="flex.*?<\/li>)+/g, (match) => {
        return `<ul class="my-3 space-y-0.5">${match}</ul>`;
      });

      html = html.replace(/(<li class="ms-4.*?<\/li>)+/g, (match) => {
        return `<ol class="my-3 space-y-0.5">${match}</ol>`;
      });

      // Wrap content in paragraphs if not already wrapped
      if (html && !html.startsWith('<')) {
        html = `<p class="mb-3">${html}</p>`;
      }

      return (
        <div
          key={index}
          className="max-w-none post-styled-content"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  useEffect(() => {
    if (containerRef.current) {
      const codeBlocks = containerRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [content]);

  useEffect(() => {
    if (!useExternalSettings) {
      localStorage.setItem(FONT_SIZE_KEY, internalFontSize.toString());
      localStorage.setItem(LINE_HEIGHT_KEY, internalLineHeight.toString());
    }
  }, [internalFontSize, internalLineHeight, useExternalSettings]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const adjustFontSize = (delta: number) => {
    if (!useExternalSettings) {
      setInternalFontSize(prev => Math.min(32, Math.max(12, prev + delta)));
    }
  };

  const resetSettings = () => {
    if (!useExternalSettings) {
      setInternalFontSize(16);
      setInternalLineHeight(1.75);
    }
  };

  // Check if content is markdown (or HTML pasted from the web that we can safely normalize)
  const isMarkdown = (text: string): boolean => {
    if (!text) return false;
    const markdownPatterns = [
      /^#{1,6}\s/m,
      /\*\*.*?\*\*/,
      /\*.*?\*/,
      /```[\s\S]*?```/,
      /^\s*[-*+]\s/m,
      /^\s*\d+\.\s/m,
      /\[.*?\]\(.*?\)/,
      /^\s*>/m,
    ];

    if (markdownPatterns.some((pattern) => pattern.test(text))) return true;

    // If the content contains common HTML tags, we can preprocess it into markdown-like text
    return /<\s*(pre|code|p|div|h[1-6]|ul|ol|li|blockquote)\b/i.test(text);
  };

  return (
    <div className={cn(
      isFullscreen && "fixed inset-0 z-50 bg-background overflow-auto"
    )}>
      {/* Controls - only show when not using external settings */}
      {!useExternalSettings && (
        <div className={cn(
          "flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border",
          isFullscreen ? "sticky top-0 z-10 mx-6 mt-6 mb-3" : "mb-3"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustFontSize(-2)}
            title="تصغير الخط"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={12}
            max={32}
            step={1}
            className="w-20"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustFontSize(2)}
            title="تكبير الخط"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3rem]">{fontSize}px</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="المسافات">
                <AlignVerticalSpaceAround className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ارتفاع السطر</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[lineHeight]}
                      onValueChange={([v]) => setLineHeight(v)}
                      min={1.2}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8">{lineHeight.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={resetSettings}
            title="إعادة تعيين"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "إغلاق وضع التركيز" : "وضع التركيز"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        showTableOfContents && tableOfContents.length > 0 ? "lg:grid-cols-4" : ""
      )}>
        {/* Table of Contents Sidebar */}
        {showTableOfContents && tableOfContents.length > 0 && (
          <div className="order-2 lg:order-1">
            <Card className="sticky top-4">
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <List className="w-4 h-4 text-primary" />
                  فهرس المحتويات
                </h3>
                <ScrollArea className="max-h-64">
                  <nav className="space-y-1">
                    {tableOfContents.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={cn(
                          "block text-sm py-1 px-2 rounded-md hover:bg-accent transition-colors",
                          heading.level === 1 && "font-semibold text-foreground",
                          heading.level === 2 && "ms-3 text-muted-foreground",
                          heading.level === 3 && "ms-6 text-muted-foreground text-xs",
                          heading.level === 4 && "ms-8 text-muted-foreground text-xs",
                          heading.level === 5 && "ms-10 text-muted-foreground text-xs opacity-80",
                          heading.level >= 6 && "ms-12 text-muted-foreground text-xs opacity-70"
                        )}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        <article
          ref={containerRef}
          className={cn(
            className,
            isFullscreen && "px-6 pb-6",
            showTableOfContents && tableOfContents.length > 0 ? "lg:col-span-3 order-1 lg:order-2" : ""
          )}
          dir={dir}
        >
          {isMarkdown(content) ? renderMarkdown(content) : (
            <div dangerouslySetInnerHTML={{ __html: content }} style={{ fontSize: `${fontSize}px`, lineHeight }} />
          )}
        </article>
      </div>
    </div>
  );
};

export default CodeHighlighter;
