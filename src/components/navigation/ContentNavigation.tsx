import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentNavigationProps {
  currentId: string;
  items: Array<{ id: string; title: string }>;
  baseUrl: string;
  className?: string;
}

const ContentNavigation = ({ currentId, items, baseUrl, className }: ContentNavigationProps) => {
  const navigate = useNavigate();
  const { isRTL, language } = useLanguage();
  
  const currentIndex = items.findIndex(item => item.id === currentId);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem = currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

  const goToPrev = useCallback(() => {
    if (prevItem) {
      navigate(`${baseUrl}/${prevItem.id}`);
    }
  }, [prevItem, navigate, baseUrl]);

  const goToNext = useCallback(() => {
    if (nextItem) {
      navigate(`${baseUrl}/${nextItem.id}`);
    }
  }, [nextItem, navigate, baseUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        isRTL ? goToNext() : goToPrev();
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        isRTL ? goToPrev() : goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext, isRTL]);

  if (!prevItem && !nextItem) return null;

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <TooltipProvider>
      <div className={`flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              disabled={!prevItem}
              className="flex items-center gap-2 min-w-0 max-w-[45%]"
            >
              <PrevIcon className="w-4 h-4 shrink-0" />
              <span className="truncate text-sm">
                {prevItem?.title || (language === 'ar' ? 'لا يوجد سابق' : 'No previous')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ar' ? 'السابق' : 'Previous'} (Alt+←)</p>
            {prevItem && <p className="text-xs text-muted-foreground">{prevItem.title}</p>}
          </TooltipContent>
        </Tooltip>

        <span className="text-xs text-muted-foreground shrink-0">
          {currentIndex + 1} / {items.length}
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={!nextItem}
              className="flex items-center gap-2 min-w-0 max-w-[45%]"
            >
              <span className="truncate text-sm">
                {nextItem?.title || (language === 'ar' ? 'لا يوجد تالي' : 'No next')}
              </span>
              <NextIcon className="w-4 h-4 shrink-0" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{language === 'ar' ? 'التالي' : 'Next'} (Alt+→)</p>
            {nextItem && <p className="text-xs text-muted-foreground">{nextItem.title}</p>}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default ContentNavigation;
