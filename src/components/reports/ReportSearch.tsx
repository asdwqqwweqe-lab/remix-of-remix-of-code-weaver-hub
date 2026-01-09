import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportSearchProps {
  content: string;
  className?: string;
}

interface SearchResult {
  text: string;
  index: number;
  context: string;
}

const ReportSearch = ({ content, className }: ReportSearchProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const searchContent = useCallback((searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const lowerContent = content.toLowerCase();
    const foundResults: SearchResult[] = [];
    let startIndex = 0;

    while (startIndex < lowerContent.length) {
      const index = lowerContent.indexOf(lowerQuery, startIndex);
      if (index === -1) break;

      // Get context around the match
      const contextStart = Math.max(0, index - 30);
      const contextEnd = Math.min(content.length, index + searchQuery.length + 30);
      const context = (contextStart > 0 ? '...' : '') + 
        content.substring(contextStart, contextEnd) + 
        (contextEnd < content.length ? '...' : '');

      foundResults.push({
        text: content.substring(index, index + searchQuery.length),
        index,
        context,
      });

      startIndex = index + 1;
    }

    setResults(foundResults);
    setCurrentResultIndex(0);

    // Highlight in content
    if (foundResults.length > 0) {
      highlightResult(0, foundResults);
    }
  }, [content]);

  const highlightResult = (resultIndex: number, searchResults: SearchResult[] = results) => {
    // Remove existing highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.classList.remove('search-highlight', 'search-highlight-active');
    });

    if (searchResults.length === 0) return;

    // Find the text in the rendered content
    const contentElement = document.querySelector('.report-content');
    if (!contentElement) return;

    const treeWalker = document.createTreeWalker(
      contentElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    const targetResult = searchResults[resultIndex];
    if (!targetResult) return;

    let node: Node | null;
    let foundCount = 0;

    while ((node = treeWalker.nextNode())) {
      const text = node.textContent || '';
      const lowerText = text.toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (lowerText.includes(queryLower)) {
        if (foundCount === resultIndex) {
          // Create highlight span
          const parent = node.parentElement;
          if (parent && !parent.classList.contains('search-highlight')) {
            const range = document.createRange();
            const startIndex = lowerText.indexOf(queryLower);
            range.setStart(node, startIndex);
            range.setEnd(node, startIndex + query.length);

            const highlightSpan = document.createElement('mark');
            highlightSpan.className = 'search-highlight search-highlight-active bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded';
            
            try {
              range.surroundContents(highlightSpan);
              highlightSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) {
              // If surroundContents fails, try alternative approach
              console.log('Could not highlight', e);
            }
          }
          break;
        }
        foundCount++;
      }
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchContent(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchContent]);

  const goToResult = (direction: 'prev' | 'next') => {
    if (results.length === 0) return;

    let newIndex: number;
    if (direction === 'next') {
      newIndex = currentResultIndex < results.length - 1 ? currentResultIndex + 1 : 0;
    } else {
      newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : results.length - 1;
    }

    setCurrentResultIndex(newIndex);
    highlightResult(newIndex);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    document.querySelectorAll('.search-highlight').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <Search className="w-4 h-4" />
        {language === 'ar' ? 'بحث' : 'Search'}
      </Button>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={language === 'ar' ? 'ابحث في التقرير...' : 'Search in report...'}
              className="ps-9 pe-9 h-9"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={clearSearch}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          
          {results.length > 0 && (
            <>
              <Badge variant="secondary" className="shrink-0">
                {currentResultIndex + 1}/{results.length}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToResult('prev')}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToResult('next')}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {query && results.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportSearch;
