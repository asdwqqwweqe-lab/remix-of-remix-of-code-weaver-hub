import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AIFormatButtonProps {
  content: string;
  onFormat: (formattedContent: string) => void;
  disabled?: boolean;
  className?: string;
}

const formatReport = (content: string): string => {
  if (!content || !content.trim()) return content;
  
  // Split content to preserve code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  const formatted = parts.map((part, index) => {
    // Don't modify code blocks - keep them exactly as they are
    if (index % 2 === 1) return part;
    
    let text = part;
    
    // Step 1: Normalize line endings
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Step 2: Remove trailing whitespace from each line (but preserve content)
    text = text.replace(/[ \t]+$/gm, '');
    
    // Step 3: Reduce multiple consecutive blank lines to maximum 2
    text = text.replace(/\n{4,}/g, '\n\n\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Step 4: Fix list formatting - normalize to single dash with single space
    text = text.replace(/^[\*\+]\s+/gm, '- ');
    text = text.replace(/^-\s{2,}/gm, '- ');
    
    // Step 5: Ensure proper spacing before headings
    text = text.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
    
    // Step 6: Remove excessive blank lines after headings (keep one line)
    text = text.replace(/^(#{1,6}\s+.+)\n{3,}/gm, '$1\n\n');
    
    // Step 7: Fix table formatting - normalize cell spacing
    text = text.replace(/\|\s{2,}/g, '| ');
    text = text.replace(/\s{2,}\|/g, ' |');
    
    // Step 8: Fix blockquote formatting
    text = text.replace(/^>\s{2,}/gm, '> ');
    
    // Step 9: Remove multiple consecutive spaces within lines (but not at start)
    text = text.replace(/([^\s])  +/g, '$1 ');
    
    return text;
  }).join('');
  
  // Final cleanup: trim and ensure single newline at end
  return formatted.trim() + '\n';
};

const AIFormatButton = ({ content, onFormat, disabled, className }: AIFormatButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFormat = async () => {
    if (!content.trim()) {
      toast.error('لا يوجد محتوى للتنسيق');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate AI processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const formattedContent = formatReport(content);
      onFormat(formattedContent);
      toast.success('تم تنسيق التقرير بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء التنسيق');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={handleFormat}
      disabled={disabled || isLoading || !content.trim()}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 me-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 me-2 text-primary" />
      )}
      تنسيق ذكي
    </Button>
  );
};

export default AIFormatButton;
