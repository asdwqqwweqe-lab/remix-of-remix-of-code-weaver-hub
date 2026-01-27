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
          : "bg-[#faf8f5] text-zinc-800",
        className
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b transition-colors duration-300 shadow-sm",
          isDarkMode 
            ? "bg-zinc-800/95 border-zinc-700 backdrop-blur-sm" 
            : "bg-white border-zinc-200 backdrop-blur-sm"
        )}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Title */}
          <h2 className={cn(
            "font-semibold text-lg truncate max-w-[40%]",
            isDarkMode ? "text-zinc-100" : "text-zinc-800"
          )}>
            {title || (language === 'ar' ? 'وضع القراءة' : 'Reading Mode')}
          </h2>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            <div className={cn(
              "flex items-center gap-1 rounded-lg p-1 border",
              isDarkMode 
                ? "bg-zinc-700 border-zinc-600" 
                : "bg-zinc-100 border-zinc-200"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isDarkMode 
                    ? "hover:bg-zinc-600 text-zinc-100" 
                    : "hover:bg-zinc-200 text-zinc-700"
                )}
                onClick={decreaseFontSize}
                disabled={fontSize <= 12}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className={cn(
                "text-sm w-8 text-center font-medium",
                isDarkMode ? "text-zinc-100" : "text-zinc-700"
              )}>
                {fontSize}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8",
                  isDarkMode 
                    ? "hover:bg-zinc-600 text-zinc-100" 
                    : "hover:bg-zinc-200 text-zinc-700"
                )}
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
                "h-9 w-9 rounded-lg border",
                isDarkMode 
                  ? "bg-zinc-700 border-zinc-600 hover:bg-zinc-600 text-yellow-400" 
                  : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700"
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
                "h-9 w-9 rounded-lg border",
                isDarkMode 
                  ? "bg-zinc-700 border-zinc-600 hover:bg-red-900/50 text-zinc-100" 
                  : "bg-zinc-100 border-zinc-200 hover:bg-red-100 hover:border-red-200 text-zinc-700 hover:text-red-600"
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
            isDarkMode 
              ? "prose-invert" 
              : "prose-zinc prose-headings:text-zinc-800 prose-p:text-zinc-700 prose-strong:text-zinc-800 prose-a:text-primary",
            "[&_pre]:text-left [&_pre]:dir-ltr [&_code]:text-left [&_code]:dir-ltr",
            !isDarkMode && "[&_pre]:bg-zinc-100 [&_pre]:border [&_pre]:border-zinc-200 [&_code]:bg-zinc-100 [&_code]:text-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
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
          "fixed bottom-4 left-1/2 -translate-x-1/2 text-xs px-4 py-2 rounded-full transition-colors border",
          isDarkMode 
            ? "bg-zinc-800 text-zinc-400 border-zinc-700" 
            : "bg-white text-zinc-500 border-zinc-200 shadow-md"
        )}
      >
        {language === 'ar' ? 'اضغط Esc للخروج' : 'Press Esc to exit'}
      </div>
    </div>
  );
};

export default ReadingMode;
