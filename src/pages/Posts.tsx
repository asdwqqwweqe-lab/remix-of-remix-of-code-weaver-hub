import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, LayoutGrid, List as ListIcon, LayoutList } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Pagination from '@/components/common/Pagination';
import { PostCard } from '@/components/posts/PostCard';
import PostFilters from '@/components/posts/PostFilters';
import BulkActions from '@/components/posts/BulkActions';

type ViewMode = 'list' | 'grid' | 'compact';
const ITEMS_PER_PAGE = 12;

const Posts = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const {
    getFilteredPosts, getCategoryById, getTagById, getLanguageById,
    toggleFavorite, deletePost, deleteMultiplePosts,
  } = useBlogStore();

  const filteredPosts = getFilteredPosts();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  const handleBulkDelete = () => {
    deleteMultiplePosts(selectedPosts);
    toast.success(`تم حذف ${selectedPosts.length} موضوع بنجاح`);
    setSelectedPosts([]);
    setShowBulkDeleteDialog(false);
  };

  const toggleSelectPost = (postId: string) => {
    setSelectedPosts(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  const toggleSelectAll = () => {
    if (selectedPosts.length === paginatedPosts.length) setSelectedPosts([]);
    else setSelectedPosts(paginatedPosts.map(p => p.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('posts.title')}</h1>
          <p className="text-muted-foreground mt-1">{filteredPosts.length} {t('posts.total')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')} title={t('posts.listView')}>
              <ListIcon className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')} title={t('posts.gridView')}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'compact' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('compact')} title={t('posts.compactView')}>
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
          <Link to="/posts/new">
            <Button className="gap-2"><Plus className="w-4 h-4" />{t('nav.newPost')}</Button>
          </Link>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedPosts={selectedPosts}
        totalPosts={paginatedPosts.length}
        toggleSelectAll={toggleSelectAll}
        onBulkDelete={handleBulkDelete}
        showDialog={showBulkDeleteDialog}
        setShowDialog={setShowBulkDeleteDialog}
      />

      {/* Filters */}
      <PostFilters showFilters={showFilters} setShowFilters={setShowFilters} onPageReset={() => setCurrentPage(1)} />

      {/* Posts List */}
      <div className={cn(viewMode === 'grid' ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4")}>
        {paginatedPosts.length === 0 ? (
          <Card className={viewMode === 'grid' ? 'col-span-full' : ''}>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">{t('posts.noPosts')}</p>
              <Link to="/posts/new">
                <Button className="mt-4 gap-2"><Plus className="w-4 h-4" />{t('nav.newPost')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          paginatedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewMode={viewMode}
              language={language}
              selectedPosts={selectedPosts}
              t={t}
              getCategoryById={getCategoryById}
              getTagById={getTagById}
              getLanguageById={getLanguageById}
              toggleFavorite={toggleFavorite}
              deletePost={deletePost}
              toggleSelectPost={toggleSelectPost}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={ITEMS_PER_PAGE} totalItems={filteredPosts.length} />
    </div>
  );
};

export default Posts;
