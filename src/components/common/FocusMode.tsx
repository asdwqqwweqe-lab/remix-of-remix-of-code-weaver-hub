import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusModeProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title?: string;
}

export default function FocusMode({ children, isOpen, onClose, onSave, title }: FocusModeProps) {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSave]);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-background flex flex-col animate-in fade-in duration-200"
    >
      {/* Minimal toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <Minimize2 className="w-4 h-4" />
            {language === 'ar' ? 'خروج' : 'Exit'}
          </Button>
          {title && (
            <span className="text-sm text-muted-foreground truncate max-w-[300px]">
              {title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button variant="outline" size="sm" onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          )}
          <span className="text-xs text-muted-foreground hidden md:inline">
            Esc {language === 'ar' ? 'للخروج' : 'to exit'} · Ctrl+S {language === 'ar' ? 'للحفظ' : 'to save'}
          </span>
        </div>
      </div>

      {/* Content area - maximized */}
      <div className="flex-1 overflow-auto p-6 md:p-12 lg:px-[15%]">
        {children}
      </div>
    </div>
  );
}
