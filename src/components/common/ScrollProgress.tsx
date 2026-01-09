import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollProgressProps {
  className?: string;
}

const ScrollProgress = ({ className }: ScrollProgressProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  const updateScrollProgress = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
    setShowButtons(scrollTop > 100);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress();
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, [updateScrollProgress]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* Progress Bar - Fixed at top, below header */}
      <div className="fixed top-16 left-0 right-0 z-20 h-1 bg-muted">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Scroll Buttons - Fixed at bottom right */}
      <div 
        className={cn(
          "fixed bottom-6 end-6 z-40 flex flex-col gap-2 transition-all duration-300",
          showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          className
        )}
      >
        {/* Progress Indicator */}
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-lg text-center">
          {Math.round(scrollProgress)}%
        </div>

        {/* Scroll to Top */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToTop}
          className="rounded-full shadow-lg bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          title="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </Button>

        {/* Scroll to Bottom */}
        <Button
          variant="outline"
          size="icon"
          onClick={scrollToBottom}
          className="rounded-full shadow-lg bg-card/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          title="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
};

export default ScrollProgress;
