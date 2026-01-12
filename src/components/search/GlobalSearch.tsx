import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useReportStore } from '@/store/reportStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, Map, Code, Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ContentType = 'all' | 'posts' | 'reports' | 'roadmaps' | 'snippets';
type SortOrder = 'newest' | 'oldest' | 'alphabetical';

interface SearchResult {
  id: string;
  title: string;
  type: ContentType;
  excerpt?: string;
  path: string;
  date: Date;
  tags?: string[];
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState<ContentType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  const { posts, snippets, getCategoryById } = useBlogStore();
  const { reports } = useReportStore();
  const { roadmaps } = useRoadmapStore();

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const allResults = useMemo(() => {
    const results: SearchResult[] = [];
    
    // Posts
    if (contentType === 'all' || contentType === 'posts') {
      posts.forEach((post) => {
        results.push({
          id: post.id,
          title: post.title,
          type: 'posts',
          excerpt: post.summary,
          path: `/posts/${post.id}`,
          date: new Date(post.createdAt),
          tags: post.tags,
        });
      });
    }
    
    // Reports
    if (contentType === 'all' || contentType === 'reports') {
      reports.forEach((report) => {
        results.push({
          id: report.id,
          title: report.title,
          type: 'reports',
          excerpt: report.content.substring(0, 100),
          path: `/reports/${report.id}`,
          date: new Date(report.createdAt),
          tags: report.tags,
        });
      });
    }
    
    // Roadmaps
    if (contentType === 'all' || contentType === 'roadmaps') {
      roadmaps.forEach((roadmap) => {
        results.push({
          id: roadmap.id,
          title: roadmap.title,
          type: 'roadmaps',
          excerpt: roadmap.description,
          path: `/roadmap`,
          date: new Date(roadmap.createdAt),
        });
      });
    }
    
    // Snippets
    if (contentType === 'all' || contentType === 'snippets') {
      snippets.forEach((snippet) => {
        results.push({
          id: snippet.id,
          title: snippet.title,
          type: 'snippets',
          excerpt: snippet.description,
          path: `/snippets`,
          date: new Date(snippet.createdAt),
        });
      });
    }
    
    return results;
  }, [posts, reports, roadmaps, snippets, contentType]);

  const filteredResults = useMemo(() => {
    let results = allResults;
    
    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((result) =>
        result.title.toLowerCase().includes(lowerQuery) ||
        result.excerpt?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Sort
    results.sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return b.date.getTime() - a.date.getTime();
        case 'oldest':
          return a.date.getTime() - b.date.getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return results;
  }, [allResults, query, sortOrder]);

  const groupedResults = useMemo(() => {
    const groups: Record<ContentType, SearchResult[]> = {
      all: [],
      posts: [],
      reports: [],
      roadmaps: [],
      snippets: [],
    };
    
    filteredResults.forEach((result) => {
      groups[result.type].push(result);
    });
    
    return groups;
  }, [filteredResults]);

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'posts': return FileText;
      case 'reports': return BookOpen;
      case 'roadmaps': return Map;
      case 'snippets': return Code;
      default: return Search;
    }
  };

  const getTypeLabel = (type: ContentType) => {
    switch (type) {
      case 'posts': return language === 'ar' ? 'المواضيع' : 'Posts';
      case 'reports': return language === 'ar' ? 'التقارير' : 'Reports';
      case 'roadmaps': return language === 'ar' ? 'خرائط الطريق' : 'Roadmaps';
      case 'snippets': return language === 'ar' ? 'الأكواد' : 'Snippets';
      default: return language === 'ar' ? 'الكل' : 'All';
    }
  };

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder={language === 'ar' ? 'بحث في كل المحتوى...' : 'Search all content...'}
          value={query}
          onValueChange={setQuery}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {showFilters && (
        <div className="flex gap-2 p-3 border-b bg-muted/30">
          <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="posts">{language === 'ar' ? 'المواضيع' : 'Posts'}</SelectItem>
              <SelectItem value="reports">{language === 'ar' ? 'التقارير' : 'Reports'}</SelectItem>
              <SelectItem value="roadmaps">{language === 'ar' ? 'خرائط الطريق' : 'Roadmaps'}</SelectItem>
              <SelectItem value="snippets">{language === 'ar' ? 'الأكواد' : 'Snippets'}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <span className="flex items-center gap-1">
                  <SortDesc className="h-3 w-3" />
                  {language === 'ar' ? 'الأحدث' : 'Newest'}
                </span>
              </SelectItem>
              <SelectItem value="oldest">
                <span className="flex items-center gap-1">
                  <SortAsc className="h-3 w-3" />
                  {language === 'ar' ? 'الأقدم' : 'Oldest'}
                </span>
              </SelectItem>
              <SelectItem value="alphabetical">
                {language === 'ar' ? 'أبجدي' : 'A-Z'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <CommandList>
        <CommandEmpty>
          {language === 'ar' ? 'لا توجد نتائج.' : 'No results found.'}
        </CommandEmpty>
        
        {(['posts', 'reports', 'roadmaps', 'snippets'] as ContentType[]).map((type) => {
          const items = groupedResults[type];
          if (items.length === 0) return null;
          
          const Icon = getTypeIcon(type);
          
          return (
            <CommandGroup key={type} heading={getTypeLabel(type)}>
              {items.slice(0, 5).map((result) => (
                <CommandItem
                  key={`${type}-${result.id}`}
                  value={`${result.title}-${result.id}`}
                  onSelect={() => handleSelect(result.path)}
                  className="flex items-center gap-3 py-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    {result.excerpt && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.excerpt}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {getTypeLabel(type)}
                  </Badge>
                </CommandItem>
              ))}
              {items.length > 5 && (
                <CommandItem
                  onSelect={() => {
                    navigate(`/${type === 'roadmaps' ? 'roadmap' : type}`);
                    onOpenChange(false);
                  }}
                  className="text-muted-foreground"
                >
                  {language === 'ar' ? `عرض كل ${items.length} نتيجة...` : `View all ${items.length} results...`}
                </CommandItem>
              )}
            </CommandGroup>
          );
        })}
      </CommandList>
      
      <div className="border-t p-2 text-xs text-muted-foreground flex items-center justify-between">
        <span>
          {language === 'ar' ? `${filteredResults.length} نتيجة` : `${filteredResults.length} results`}
        </span>
        <span className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
          <span>{language === 'ar' ? 'للتنقل' : 'navigate'}</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">↵</kbd>
          <span>{language === 'ar' ? 'للفتح' : 'open'}</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">esc</kbd>
          <span>{language === 'ar' ? 'للإغلاق' : 'close'}</span>
        </span>
      </div>
    </CommandDialog>
  );
}
