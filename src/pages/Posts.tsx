import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Tag,
  Eye,
  Star,
  Calendar,
  Plus,
  X,
  LayoutGrid,
  List as ListIcon,
  LayoutList,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Pagination from '@/components/common/Pagination';
import TextImage from '@/components/common/TextImage';

type ViewMode = 'list' | 'grid' | 'compact';

const ITEMS_PER_PAGE = 12;

const Posts = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const {
    posts,
    categories,
    tags,
    programmingLanguages,
    searchQuery,
    setSearchQuery,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedTagIds,
    setSelectedTagIds,
    selectedLanguageIds,
    setSelectedLanguageIds,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    getFilteredPosts,
    getCategoryById,
    getTagById,
    getLanguageById,
    toggleFavorite,
    clearFilters,
  } = useBlogStore();

  const filteredPosts = getFilteredPosts();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    clearFilters();
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategoryId || selectedTagIds.length > 0 || 
    selectedLanguageIds.length > 0 || selectedStatus;

  const toggleTagFilter = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
    setCurrentPage(1);
  };

  const toggleLanguageFilter = (langId: string) => {
    if (selectedLanguageIds.includes(langId)) {
      setSelectedLanguageIds(selectedLanguageIds.filter(id => id !== langId));
    } else {
      setSelectedLanguageIds([...selectedLanguageIds, langId]);
    }
    setCurrentPage(1);
  };

  const renderPostCard = (post: typeof filteredPosts[0]) => {
    const category = getCategoryById(post.categoryId || '');
    const postTags = post.tags.map(id => getTagById(id)).filter(Boolean);
    const postLangs = post.programmingLanguages.map(id => getLanguageById(id)).filter(Boolean);

    if (viewMode === 'compact') {
      return (
        <Card key={post.id} className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <TextImage text={post.title} size="sm" variant="gradient" />
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs shrink-0",
                    post.status === 'published' ? 'status-published' : post.status === 'draft' ? 'status-draft' : 'status-archived'
                  )}
                >
                  {t(`posts.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`)}
                </Badge>
                <Link to={`/posts/${post.id}`} className="flex-1 min-w-0">
                  <h3 
                    className="font-medium hover:text-accent transition-colors truncate"
                    dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {post.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <Eye className="w-4 h-4" />
                  {post.viewsCount}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => toggleFavorite(post.id)}
              >
                <Star className={`w-4 h-4 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (viewMode === 'grid') {
      return (
        <Card key={post.id} className="card-hover h-full">
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <TextImage text={post.title} size="md" variant="gradient" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleFavorite(post.id)}
              >
                <Star className={`w-4 h-4 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {language === 'ar' ? category.nameAr : category.nameEn}
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  post.status === 'published' ? 'status-published' : post.status === 'draft' ? 'status-draft' : 'status-archived'
                )}
              >
                {t(`posts.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`)}
              </Badge>
            </div>

            <Link to={`/posts/${post.id}`}>
              <h3 
                className="text-lg font-semibold hover:text-accent transition-colors line-clamp-2 mb-2"
                dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
              >
                {post.title}
              </h3>
            </Link>

            <p 
              className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1"
              dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              {post.summary}
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {postLangs.slice(0, 2).map((lang) => lang && (
                <Badge 
                  key={lang.id}
                  variant="outline" 
                  className="text-xs"
                  style={{ borderColor: lang.color, color: lang.color }}
                >
                  {lang.name}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.viewsCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(post.createdAt), 'PP', { locale: language === 'ar' ? ar : enUS })}
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Default list view
    return (
      <Card key={post.id} className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 flex-1 min-w-0">
              <TextImage text={post.title} size="md" variant="gradient" className="hidden sm:flex" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {category && (
                    <Badge variant="secondary">
                      {language === 'ar' ? category.nameAr : category.nameEn}
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={post.status === 'published' ? 'status-published' : post.status === 'draft' ? 'status-draft' : 'status-archived'}
                  >
                    {t(`posts.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {post.mainLanguage === 'ar' ? 'عربي' : 'EN'}
                  </Badge>
                </div>

                <Link to={`/posts/${post.id}`}>
                  <h3 
                    className="text-xl font-semibold hover:text-accent transition-colors line-clamp-1"
                    dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {post.title}
                  </h3>
                </Link>

                <p 
                  className="text-muted-foreground mt-1 line-clamp-2"
                  dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                >
                  {post.summary}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {postLangs.map((lang) => lang && (
                    <Link key={lang.id} to={`/languages/${lang.slug}`}>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: lang.color, color: lang.color }}
                      >
                        {lang.name}
                      </Badge>
                    </Link>
                  ))}
                  {postTags.slice(0, 3).map((tag) => tag && (
                    <Link key={tag.id} to={`/tags/${tag.slug}`}>
                      <Badge variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 me-1" />
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {post.viewsCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.createdAt), 'PPP', { locale: language === 'ar' ? ar : enUS })}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(post.id)}
            >
              <Star className={`w-5 h-5 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('posts.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {filteredPosts.length} {t('posts.total')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              title={t('posts.listView')}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              title={t('posts.gridView')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('compact')}
              title={t('posts.compactView')}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
          <Link to="/posts/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t('nav.newPost')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="ps-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('common.filter')}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={handleClearFilters} className="gap-2">
              <X className="w-4 h-4" />
              {t('common.clearFilters')}
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="animate-slide-up">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('posts.category')}</label>
                  <Select value={selectedCategoryId || 'all'} onValueChange={(v) => { setSelectedCategoryId(v === 'all' ? null : v); setCurrentPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      {categories.filter(cat => cat.id).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {language === 'ar' ? cat.nameAr : cat.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('posts.status')}</label>
                  <Select value={selectedStatus || 'all'} onValueChange={(v) => { setSelectedStatus(v === 'all' ? null : v); setCurrentPage(1); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="published">{t('posts.statusPublished')}</SelectItem>
                      <SelectItem value="draft">{t('posts.statusDraft')}</SelectItem>
                      <SelectItem value="archived">{t('posts.statusArchived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('common.sortBy')}</label>
                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">{t('common.newest')}</SelectItem>
                      <SelectItem value="oldest">{t('common.oldest')}</SelectItem>
                      <SelectItem value="mostViewed">{t('common.mostViewed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('posts.tags')}</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTagFilter(tag.id)}
                    >
                      <Tag className="w-3 h-3 me-1" />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Programming Languages */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('programmingLanguages.title')}</label>
                <div className="flex flex-wrap gap-2">
                  {programmingLanguages.map((lang) => (
                    <Badge
                      key={lang.id}
                      variant={selectedLanguageIds.includes(lang.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={{ 
                        borderColor: lang.color,
                        backgroundColor: selectedLanguageIds.includes(lang.id) ? lang.color : 'transparent',
                        color: selectedLanguageIds.includes(lang.id) ? '#fff' : 'inherit'
                      }}
                      onClick={() => toggleLanguageFilter(lang.id)}
                    >
                      {lang.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Posts List */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
      )}>
        {paginatedPosts.length === 0 ? (
          <Card className={viewMode === 'grid' ? 'col-span-full' : ''}>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">{t('posts.noPosts')}</p>
              <Link to="/posts/new">
                <Button className="mt-4 gap-2">
                  <Plus className="w-4 h-4" />
                  {t('nav.newPost')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          paginatedPosts.map(renderPostCard)
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={filteredPosts.length}
      />
    </div>
  );
};

export default Posts;