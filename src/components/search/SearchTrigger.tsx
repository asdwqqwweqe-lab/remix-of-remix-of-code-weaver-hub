import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-global-search-trigger
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">
          {language === 'ar' ? 'بحث...' : 'Search...'}
        </span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <GlobalSearch open={open} onOpenChange={setOpen} />
    </>
  );
}
