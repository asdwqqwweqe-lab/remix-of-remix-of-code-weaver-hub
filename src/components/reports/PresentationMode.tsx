import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2,
  Minimize2,
  Play,
  Pause,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SimpleCodeBlock from '@/components/common/SimpleCodeBlock';

interface PresentationModeProps {
  content: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Slide {
  content: string;
  type: 'title' | 'content';
}

const PresentationMode = ({ content, title, isOpen, onClose }: PresentationModeProps) => {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  // Parse content into slides based on headings
  const slides: Slide[] = (() => {
    const result: Slide[] = [{ content: title, type: 'title' }];
    
    // Split by h1 and h2 headings
    const sections = content.split(/(?=^#{1,2}\s)/gm).filter(Boolean);
    
    sections.forEach(section => {
      const trimmed = section.trim();
      if (trimmed) {
        result.push({ content: trimmed, type: 'content' });
      }
    });
    
    return result.length > 0 ? result : [{ content: title, type: 'title' }];
  })();

  const totalSlides = slides.length;

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
      setShowOverview(false);
    }
  }, [totalSlides]);

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'Escape':
          if (showOverview) {
            setShowOverview(false);
          } else {
            onClose();
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'o':
          setShowOverview(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose, showOverview]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlay || !isOpen) return;

    const interval = setInterval(() => {
      if (currentSlide < totalSlides - 1) {
        nextSlide();
      } else {
        setIsAutoPlay(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, isOpen, currentSlide, totalSlides, nextSlide]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const renderSlideContent = (slide: Slide) => {
    if (slide.type === 'title') {
      return (
        <div className="flex items-center justify-center h-full">
          <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight text-foreground">
            {slide.content}
          </h1>
        </div>
      );
    }

    // Parse markdown for content slides
    let html = slide.content;
    
    // Handle code blocks first
    const codeBlocks: { placeholder: string; code: string; lang: string }[] = [];
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ placeholder, code: code.trim(), lang: lang || 'plaintext' });
      return placeholder;
    });

    // Process headings
    html = html
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl md:text-4xl font-bold mb-5 text-foreground">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl md:text-2xl font-semibold mb-4 text-foreground">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="flex items-start gap-3 mb-3"><span class="w-2 h-2 rounded-full bg-primary mt-3 shrink-0"></span><span class="text-lg md:text-xl">$1</span></li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="list-decimal ms-6 mb-3 text-lg md:text-xl">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-lg md:text-xl leading-relaxed">')
      .replace(/\n/g, '<br />');

    // Wrap lists
    html = html.replace(/(<li class="flex.*?<\/li>)+/g, (match) => `<ul class="space-y-2">${match}</ul>`);
    html = html.replace(/(<li class="list-decimal.*?<\/li>)+/g, (match) => `<ol class="space-y-2">${match}</ol>`);

    return (
      <div className="max-w-4xl mx-auto px-8">
        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: `<div class="leading-relaxed">${html}</div>` }}
        />
        {codeBlocks.map((block, index) => (
          <div key={index} className="my-6">
            <SimpleCodeBlock code={block.code} language={block.lang} />
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Main Slide Area */}
      <div className="h-full flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-primary">
                {currentSlide + 1}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">
                {totalSlides}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1 bg-muted/50 px-3 py-1 rounded-full">
              <span className="text-xs text-muted-foreground">
                {slides[currentSlide].type === 'title' 
                  ? (language === 'ar' ? 'صفحة العنوان' : 'Title Slide')
                  : slides[currentSlide].content.split('\n')[0].replace(/^#+\s*/, '').substring(0, 40)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowOverview(!showOverview)}
              className={showOverview ? 'bg-accent' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={isAutoPlay ? 'bg-accent' : ''}
            >
              {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Slide Content */}
        {showOverview ? (
          <div className="flex-1 overflow-auto p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "aspect-video rounded-lg border-2 p-4 text-start transition-all hover:border-primary",
                    "bg-card overflow-hidden",
                    currentSlide === index ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === 'ar' ? `شريحة ${index + 1}` : `Slide ${index + 1}`}
                  </div>
                  <div className="text-sm font-medium line-clamp-3">
                    {slide.type === 'title' ? slide.content : slide.content.split('\n')[0].replace(/^#+\s*/, '')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center overflow-auto py-12">
            {renderSlideContent(slides[currentSlide])}
          </div>
        )}

        {/* Navigation */}
        {!showOverview && (
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            {/* Slide Info */}
            <div className="hidden md:flex items-center gap-2 min-w-[150px]">
              <span className="text-xs text-muted-foreground">
                {language === 'ar' ? 'الشريحة' : 'Slide'} {currentSlide + 1}
              </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={prevSlide}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 max-w-[300px] overflow-x-auto py-1">
                {slides.map((slide, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    title={slide.type === 'title' ? slide.content : slide.content.split('\n')[0].replace(/^#+\s*/, '')}
                    className={cn(
                      "shrink-0 rounded-full transition-all",
                      currentSlide === index 
                        ? "bg-primary w-6 h-2" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2 h-2"
                    )}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress percentage */}
            <div className="hidden md:flex items-center gap-2 min-w-[150px] justify-end">
              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(((currentSlide + 1) / totalSlides) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationMode;
