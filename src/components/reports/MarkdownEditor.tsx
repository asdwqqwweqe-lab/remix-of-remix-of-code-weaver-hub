import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Minus,
  Eye,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SimpleCodeBlock from '@/components/common/SimpleCodeBlock';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MarkdownEditor = ({ value, onChange, placeholder, className }: MarkdownEditorProps) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const toolbarButtons = [
    { icon: Bold, action: () => insertText('**', '**', 'bold'), title: 'Bold' },
    { icon: Italic, action: () => insertText('*', '*', 'italic'), title: 'Italic' },
    { icon: Code, action: () => insertText('`', '`', 'code'), title: 'Inline Code' },
    { type: 'separator' },
    { icon: Heading1, action: () => insertText('\n# ', '\n', 'Heading 1'), title: 'Heading 1' },
    { icon: Heading2, action: () => insertText('\n## ', '\n', 'Heading 2'), title: 'Heading 2' },
    { icon: Heading3, action: () => insertText('\n### ', '\n', 'Heading 3'), title: 'Heading 3' },
    { type: 'separator' },
    { icon: List, action: () => insertText('\n- ', '', 'item'), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('\n1. ', '', 'item'), title: 'Numbered List' },
    { icon: Quote, action: () => insertText('\n> ', '', 'quote'), title: 'Quote' },
    { type: 'separator' },
    { icon: Link, action: () => insertText('[', '](url)', 'link text'), title: 'Link' },
    { icon: Image, action: () => insertText('![', '](image-url)', 'alt text'), title: 'Image' },
    { icon: Minus, action: () => insertText('\n---\n', '', ''), title: 'Horizontal Rule' },
  ];

  const insertCodeBlock = (lang: string = '') => {
    insertText(`\n\`\`\`${lang}\n`, '\n```\n', 'code here');
  };

  const codeLanguages = ['javascript', 'typescript', 'python', 'php', 'html', 'css', 'bash', 'json', 'sql'];

  const renderMarkdown = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
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
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
        <div className="flex items-center justify-between border-b bg-muted/50 px-2">
          {/* Toolbar */}
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            {toolbarButtons.map((btn, index) => 
              btn.type === 'separator' ? (
                <div key={index} className="w-px h-6 bg-border mx-1" />
              ) : (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={btn.action}
                  title={btn.title}
                  type="button"
                >
                  {btn.icon && <btn.icon className="w-4 h-4" />}
                </Button>
              )
            )}
            <div className="w-px h-6 bg-border mx-1" />
            {/* Code block dropdown */}
            <div className="relative group">
              <Button variant="ghost" size="sm" className="h-8 gap-1" type="button">
                <Code className="w-4 h-4" />
                <span className="text-xs">Code Block</span>
              </Button>
              <div className="absolute top-full start-0 hidden group-hover:block bg-popover border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                {codeLanguages.map((lang) => (
                  <button
                    key={lang}
                    className="block w-full text-start px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => insertCodeBlock(lang)}
                    type="button"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <TabsList className="h-9">
            <TabsTrigger value="edit" className="gap-1.5">
              <Edit className="w-3.5 h-3.5" />
              {language === 'ar' ? 'تحرير' : 'Edit'}
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {language === 'ar' ? 'معاينة' : 'Preview'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="m-0">
          <Textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] rounded-none border-0 font-mono text-sm resize-y focus-visible:ring-0"
            dir="auto"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[400px] p-4 overflow-auto" dir="auto">
            {value ? (
              renderMarkdown(value)
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {language === 'ar' ? 'لا يوجد محتوى للمعاينة' : 'No content to preview'}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarkdownEditor;
