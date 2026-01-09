import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Languages, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TranslatorTooltipProps {
  containerRef: React.RefObject<HTMLElement>;
}

const TextTranslator = ({ containerRef }: TranslatorTooltipProps) => {
  const [selectedText, setSelectedText] = useState('');
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setIsVisible(false);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2 || text.length > 500) {
      setIsVisible(false);
      return;
    }

    // Check if selection is within our container
    if (containerRef.current && selection.anchorNode) {
      if (!containerRef.current.contains(selection.anchorNode)) {
        setIsVisible(false);
        return;
      }
    }

    // Check if text contains English characters
    const hasEnglish = /[a-zA-Z]/.test(text);
    if (!hasEnglish) {
      setIsVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedText(text);
    setTranslation('');
    setIsVisible(true);
  }, [containerRef]);

  const translateText = async () => {
    if (!selectedText || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text: selectedText, targetLang: 'ar' },
      });

      if (error) throw error;
      setTranslation(data.translation);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslation('حدث خطأ في الترجمة');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [handleSelection]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 -translate-y-full"
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[150px] max-w-[300px]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Languages className="w-3 h-3" />
            ترجمة
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        {translation ? (
          <p className="text-sm font-medium text-foreground" dir="rtl">
            {translation}
          </p>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={translateText}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 me-1 animate-spin" />
                جاري الترجمة...
              </>
            ) : (
              <>
                <Languages className="w-3 h-3 me-1" />
                ترجم إلى العربية
              </>
            )}
          </Button>
        )}

        {/* Arrow */}
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
          <div className="border-8 border-transparent border-t-popover" />
        </div>
      </div>
    </div>
  );
};

export default TextTranslator;
