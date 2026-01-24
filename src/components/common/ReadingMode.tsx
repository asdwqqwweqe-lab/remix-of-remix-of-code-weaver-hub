import { useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, X, Moon, Sun, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReadingModeProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const ReadingMode = ({ children, title, className }: ReadingModeProps) => {
  const { language } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);

  // Handle escape key to exit reading mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  // Prevent body scroll when reading mode is active
  useEffect(() => {
    if (isActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isActive]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  if (!isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsActive(true)}
        className="gap-2"
      >
        <BookOpen className="w-4 h-4" />
        {language === 'ar' ? 'وضع القراءة' : 'Reading Mode'}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 overflow-auto transition-colors duration-300",
        isDarkMode 
          ? "bg-zinc-900 text-zinc-100" 
          : "bg-amber-50 text-zinc-900",
        className
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b transition-colors duration-300",
          isDarkMode 
            ? "bg-zinc-800/95 border-zinc-700 backdrop-blur-sm" 
            : "bg-white/95 border-amber-200 backdrop-blur-sm"
        )}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Title */}
          <h2 className="font-semibold text-lg truncate max-w-[40%]">
            {title || (language === 'ar' ? 'وضع القراءة' : 'Reading Mode')}
          </h2>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            <div className={cn(
              "flex items-center gap-1 rounded-lg p-1",
              isDarkMode ? "bg-zinc-700" : "bg-amber-100"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={decreaseFontSize}
                disabled={fontSize <= 12}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-sm w-8 text-center">{fontSize}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={increaseFontSize}
                disabled={fontSize >= 32}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Dark/Light Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                "h-9 w-9 rounded-lg",
                isDarkMode ? "bg-zinc-700 hover:bg-zinc-600" : "bg-amber-100 hover:bg-amber-200"
              )}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsActive(false)}
              className={cn(
                "h-9 w-9 rounded-lg",
                isDarkMode 
                  ? "bg-zinc-700 hover:bg-red-900/50 text-zinc-100" 
                  : "bg-amber-100 hover:bg-red-100 text-zinc-900"
              )}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div
          className={cn(
            "reading-content prose max-w-none",
            isDarkMode ? "prose-invert" : "",
            "[&_pre]:text-left [&_pre]:dir-ltr [&_code]:text-left [&_code]:dir-ltr"
          )}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.9,
          }}
        >
          {children}
        </div>
      </div>

      {/* Footer hint */}
      <div
        className={cn(
          "fixed bottom-4 left-1/2 -translate-x-1/2 text-xs px-3 py-1.5 rounded-full transition-colors",
          isDarkMode 
            ? "bg-zinc-800 text-zinc-400" 
            : "bg-white text-zinc-500 shadow-sm"
        )}
      >
        {language === 'ar' ? 'اضغط Esc للخروج' : 'Press Esc to exit'}
      </div>
    </div>
  );
};

export default ReadingMode;
