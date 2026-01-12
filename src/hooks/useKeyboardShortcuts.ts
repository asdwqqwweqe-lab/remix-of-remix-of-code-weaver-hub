import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const showShortcutsHelp = useCallback(() => {
    toast({
      title: '⌨️ اختصارات لوحة المفاتيح',
      description: 'Ctrl+K: بحث | Ctrl+N: جديد | Ctrl+S: حفظ | Ctrl+P: معاينة | ← →: تنقل',
      duration: 5000,
    });
  }, [toast]);

  const shortcuts: ShortcutConfig[] = [
    // Navigation
    { key: 'k', ctrl: true, action: () => {
      const searchDialog = document.querySelector('[data-global-search-trigger]') as HTMLButtonElement;
      if (searchDialog) searchDialog.click();
    }, description: 'فتح البحث' },
    { key: 'n', ctrl: true, action: () => navigate('/posts/new'), description: 'موضوع جديد' },
    { key: 'h', ctrl: true, action: () => navigate('/'), description: 'الرئيسية' },
    
    // Editor shortcuts (will be caught by specific pages)
    { key: 's', ctrl: true, action: () => {
      const saveBtn = document.querySelector('[data-save-button]') as HTMLButtonElement;
      if (saveBtn) {
        saveBtn.click();
        toast({ title: '✓ جاري الحفظ...', duration: 1500 });
      }
    }, description: 'حفظ' },
    { key: 'p', ctrl: true, shift: true, action: () => {
      const previewBtn = document.querySelector('[data-preview-toggle]') as HTMLButtonElement;
      if (previewBtn) previewBtn.click();
    }, description: 'تبديل المعاينة' },
    
    // Post navigation (on post details page)
    { key: 'ArrowLeft', alt: true, action: () => {
      const prevBtn = document.querySelector('[data-prev-post]') as HTMLButtonElement;
      if (prevBtn) prevBtn.click();
    }, description: 'الموضوع السابق' },
    { key: 'ArrowRight', alt: true, action: () => {
      const nextBtn = document.querySelector('[data-next-post]') as HTMLButtonElement;
      if (nextBtn) nextBtn.click();
    }, description: 'الموضوع التالي' },
    
    // Quick actions
    { key: 'e', ctrl: true, action: () => {
      const editBtn = document.querySelector('[data-edit-button]') as HTMLButtonElement;
      if (editBtn) editBtn.click();
    }, description: 'تعديل' },
    
    // Help
    { key: '/', ctrl: true, action: showShortcutsHelp, description: 'مساعدة الاختصارات' },
    { key: '?', shift: true, action: showShortcutsHelp, description: 'مساعدة الاختصارات' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape and Ctrl+S in inputs
        if (e.key !== 'Escape' && !(e.ctrlKey && e.key === 's')) {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey || shortcut.key === '?';
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        
        if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, navigate, location]);

  return { shortcuts, showShortcutsHelp };
}
