import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const Categories = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { categories, posts, addCategory, updateCategory, deleteCategory } = useBlogStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    description: '',
  });

  const getPostCount = (categoryId: string) => {
    return posts.filter(p => p.categoryId === categoryId).length;
  };

  const handleSubmit = () => {
    if (!formData.nameAr.trim() || !formData.nameEn.trim()) {
      toast.error(t('categories.nameRequired'));
      return;
    }

    if (editingId) {
      updateCategory(editingId, formData);
      toast.success(t('categories.updated'));
    } else {
      addCategory({
        ...formData,
        slug: formData.slug || formData.nameEn.toLowerCase().replace(/\s+/g, '-'),
      });
      toast.success(t('categories.created'));
    }

    resetForm();
  };

  const handleEdit = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setFormData({
      nameAr: category.nameAr,
      nameEn: category.nameEn,
      slug: category.slug,
      description: category.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const postCount = getPostCount(id);
    if (postCount > 0) {
      toast.error(t('categories.hasPostsError'));
      return;
    }
    deleteCategory(id);
    toast.success(t('categories.deleted'));
  };

  const resetForm = () => {
    setFormData({ nameAr: '', nameEn: '', slug: '', description: '' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('categories.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {categories.length} {t('categories.total')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              {t('categories.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('categories.edit') : t('categories.add')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('categories.nameAr')} *</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('categories.nameEn')} *</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => {
                    const newNameEn = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      nameEn: newNameEn,
                      slug: prev.slug || newNameEn.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('categories.slug')} ({language === 'ar' ? 'يُنشأ تلقائياً' : 'Auto-generated'})</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="category-slug"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('categories.description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="card-hover">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {language === 'ar' ? category.nameAr : category.nameEn}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? category.nameEn : category.nameAr}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{getPostCount(category.id)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {category.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(category.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Categories;
