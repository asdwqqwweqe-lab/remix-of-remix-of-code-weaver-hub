import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollButtonsProps {
  className?: string;
}

const ScrollButtons = ({ className }: ScrollButtonsProps) => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButtons(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 z-50 flex flex-col gap-2 transition-all duration-300',
        showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
      style={{ right: '1.5rem' }}
    >
      <Button
        variant="secondary"
        size="icon"
        onClick={scrollToTop}
        className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary text-primary-foreground hover:bg-primary/90"
        title="Scroll to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={scrollToBottom}
        className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-secondary text-secondary-foreground hover:bg-secondary/80"
        title="Scroll to bottom"
      >
        <ChevronDown className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ScrollButtons;
