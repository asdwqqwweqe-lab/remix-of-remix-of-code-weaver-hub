import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  isError?: boolean;
  errorMessage?: string;
  showCursor?: boolean;
  className?: string;
  showCopyButton?: boolean;
  providerName?: string;
}

const StreamingText = ({
  text,
  isStreaming,
  isComplete,
  isError = false,
  errorMessage,
  showCursor = true,
  className,
  showCopyButton = true,
  providerName = 'AI',
}: StreamingTextProps) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text, isStreaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('تم النسخ');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('فشل النسخ');
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium text-primary">
                {providerName} يولّد...
              </span>
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                اكتمل التوليد
              </span>
            </>
          ) : isError ? (
            <>
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                حدث خطأ
              </span>
            </>
          ) : (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                جاري الإعداد...
              </span>
            </>
          )}
        </div>

        {/* Copy button */}
        {showCopyButton && text && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className={cn(
          'max-h-[400px] overflow-y-auto rounded-lg p-4',
          'bg-muted/30 border',
          isError && 'border-destructive/50 bg-destructive/5'
        )}
      >
        {isError && errorMessage ? (
          <p className="text-destructive text-sm">{errorMessage}</p>
        ) : text ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed m-0">
              {text}
              {showCursor && isStreaming && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span>انتظار الرد...</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {isStreaming && (
        <div className="mt-2">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-primary/70 to-primary animate-progress-indeterminate" />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {text.length} حرف
          </p>
        </div>
      )}

      {/* Stats on complete */}
      {isComplete && text && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{text.length} حرف</span>
          <span>{text.split(/\s+/).filter(Boolean).length} كلمة</span>
        </div>
      )}
    </div>
  );
};

export default StreamingText;
