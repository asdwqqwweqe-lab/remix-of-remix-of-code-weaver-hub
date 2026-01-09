import { useMemo, useState } from 'react';
import hljs from 'highlight.js';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleCodeBlockProps {
  code: string;
  language: string;
  className?: string;
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SimpleCodeBlock = ({ code, language, className }: SimpleCodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    const lang = (language || '').trim().toLowerCase();

    try {
      if (!lang || lang === 'auto' || lang === 'plaintext' || lang === 'text') {
        const result = hljs.highlightAuto(code);
        return {
          html: result.value,
          detectedLanguage: result.language || 'auto',
          usedLanguage: 'auto',
        };
      }

      return {
        html: hljs.highlight(code, { language: lang }).value,
        detectedLanguage: lang,
        usedLanguage: lang,
      };
    } catch {
      return {
        html: escapeHtml(code),
        detectedLanguage: 'plaintext',
        usedLanguage: 'plaintext',
      };
    }
  }, [code, language]);

  const displayLang =
    !language || language.trim().toLowerCase() === 'auto' ? highlighted.detectedLanguage : language;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      <div className="flex items-center justify-between bg-muted/80 px-4 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {displayLang || 'code'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto bg-muted/50">
        <code
          className={cn(
            'hljs text-sm whitespace-pre',
            highlighted.usedLanguage !== 'auto' ? `language-${highlighted.usedLanguage}` : ''
          )}
          dir="ltr"
          dangerouslySetInnerHTML={{ __html: highlighted.html }}
        />
      </pre>
    </div>
  );
};

export default SimpleCodeBlock;
