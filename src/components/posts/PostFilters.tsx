import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Tag, X } from 'lucide-react';

interface PostFiltersProps {
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  onPageReset: () => void;
}

export default function PostFilters({ showFilters, setShowFilters, onPageReset }: PostFiltersProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const {
    categories, tags, programmingLanguages,
    searchQuery, setSearchQuery,
    selectedCategoryId, setSelectedCategoryId,
    selectedTagIds, setSelectedTagIds,
    selectedLanguageIds, setSelectedLanguageIds,
    selectedStatus, setSelectedStatus,
    sortBy, setSortBy, clearFilters,
  } = useBlogStore();

  const hasActiveFilters = searchQuery || selectedCategoryId || selectedTagIds.length > 0 ||
    selectedLanguageIds.length > 0 || selectedStatus;

  const handleSearchChange = (value: string) => { setSearchQuery(value); onPageReset(); };
  const handleClearFilters = () => { clearFilters(); onPageReset(); };

  const toggleTagFilter = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    else setSelectedTagIds([...selectedTagIds, tagId]);
    onPageReset();
  };

  const toggleLanguageFilter = (langId: string) => {
    if (selectedLanguageIds.includes(langId)) setSelectedLanguageIds(selectedLanguageIds.filter(id => id !== langId));
    else setSelectedLanguageIds([...selectedLanguageIds, langId]);
    onPageReset();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="ps-10" />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="w-4 h-4" />{t('common.filter')}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters} className="gap-2">
            <X className="w-4 h-4" />{t('common.clearFilters')}
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="animate-slide-up">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('posts.category')}</label>
                <Select value={selectedCategoryId || 'all'} onValueChange={(v) => { setSelectedCategoryId(v === 'all' ? null : v); onPageReset(); }}>
                  <SelectTrigger><SelectValue placeholder={t('common.all')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    {categories.filter(cat => cat.id).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{language === 'ar' ? cat.nameAr : cat.nameEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('posts.status')}</label>
                <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? null : v); onPageReset(); }}>
                  <SelectTrigger><SelectValue placeholder={t('common.all')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="published">{t('posts.statusPublished')}</SelectItem>
                    <SelectItem value="draft">{t('posts.statusDraft')}</SelectItem>
                    <SelectItem value="archived">{t('posts.statusArchived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.sortBy')}</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('common.newest')}</SelectItem>
                    <SelectItem value="oldest">{t('common.oldest')}</SelectItem>
                    <SelectItem value="mostViewed">{t('common.mostViewed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('posts.tags')}</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleTagFilter(tag.id)}>
                    <Tag className="w-3 h-3 me-1" />{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('programmingLanguages.title')}</label>
              <div className="flex flex-wrap gap-2">
                {programmingLanguages.map((lang) => (
                  <Badge key={lang.id} variant={selectedLanguageIds.includes(lang.id) ? 'default' : 'outline'} className="cursor-pointer"
                    style={{ borderColor: lang.color, backgroundColor: selectedLanguageIds.includes(lang.id) ? lang.color : 'transparent', color: selectedLanguageIds.includes(lang.id) ? '#fff' : 'inherit' }}
                    onClick={() => toggleLanguageFilter(lang.id)}>
                    {lang.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
