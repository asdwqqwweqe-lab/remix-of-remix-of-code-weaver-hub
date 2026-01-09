import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, BookOpen, FileText, Search, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '@/components/common/Pagination';

const ITEMS_PER_PAGE = 9;

const Collections = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { collections, posts, addCollection, updateCollection, deleteCollection, getPostById } = useBlogStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    targetPostsCount: 0,
  });

  // Filter collections by search
  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    return collections.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCollections.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCollections, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error(t('collections.titleRequired'));
      return;
    }

    if (editingId) {
      updateCollection(editingId, formData);
      toast.success(t('collections.updated'));
    } else {
      addCollection({
        ...formData,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        posts: [],
      });
      toast.success(t('collections.created'));
    }

    resetForm();
  };

  const handleEdit = (collection: typeof collections[0]) => {
    setEditingId(collection.id);
    setFormData({
      title: collection.title,
      slug: collection.slug,
      description: collection.description || '',
      targetPostsCount: collection.targetPostsCount || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCollection(id);
    toast.success(t('collections.deleted'));
  };

  const resetForm = () => {
    setFormData({ title: '', slug: '', description: '', targetPostsCount: 0 });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleAddPost = (collectionId: string) => {
    navigate(`/posts/new?collectionId=${collectionId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('collections.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {collections.length} {t('collections.total')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              {t('collections.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('collections.edit') : t('collections.add')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('collections.name')} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('collections.slug')}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="collection-slug"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('collections.description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{i18n.language === 'ar' ? 'العدد المستهدف' : 'Target Posts Count'}</Label>
                <Input
                  type="number"
                  value={formData.targetPostsCount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetPostsCount: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? t('common.save') : t('common.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="ps-10"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCollections.map((collection) => {
          const progress = collection.targetPostsCount 
            ? Math.min(100, (collection.posts.length / collection.targetPostsCount) * 100)
            : 0;
          
          return (
            <Card key={collection.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{collection.title}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {collection.posts.length}{collection.targetPostsCount ? `/${collection.targetPostsCount}` : ''} {t('posts.total')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {collection.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                
                {/* Progress bar */}
                {collection.targetPostsCount && collection.targetPostsCount > 0 && (
                  <div className="mb-4 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{i18n.language === 'ar' ? 'التقدم' : 'Progress'}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                {/* Posts Preview */}
                {collection.posts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {collection.posts.slice(0, 3).map((cp, i) => {
                      const post = getPostById(cp.postId);
                      if (!post) return null;
                      return (
                        <div key={cp.postId} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{post.title}</span>
                        </div>
                      );
                    })}
                    {collection.posts.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{collection.posts.length - 3} {t('common.more')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Link to={`/collections/${collection.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      {t('common.view')}
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => handleAddPost(collection.id)}>
                    <FilePlus className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(collection)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(collection.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCollections.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('collections.noCollections')}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={filteredCollections.length}
      />
    </div>
  );
};

export default Collections;