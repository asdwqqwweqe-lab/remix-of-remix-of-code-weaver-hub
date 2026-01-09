import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Tag as TagIcon, FilePlus } from 'lucide-react';
import { toast } from 'sonner';

const Tags = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { tags, posts, addTag, updateTag, deleteTag } = useBlogStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3b82f6',
  });

  const getPostCount = (tagId: string) => {
    return posts.filter(p => p.tags.includes(tagId)).length;
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error(t('tags.nameRequired'));
      return;
    }

    if (editingId) {
      updateTag(editingId, formData);
      toast.success(t('tags.updated'));
    } else {
      addTag({
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      });
      toast.success(t('tags.created'));
    }

    resetForm();
  };

  const handleEdit = (tag: typeof tags[0]) => {
    setEditingId(tag.id);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      color: tag.color || '#3b82f6',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTag(id);
    toast.success(t('tags.deleted'));
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', color: '#3b82f6' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleAddPost = (tagId: string) => {
    navigate(`/posts/new?tagId=${tagId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('tags.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {tags.length} {t('tags.total')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              {t('tags.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('tags.edit') : t('tags.add')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('tags.name')} *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      name: newName,
                      slug: prev.slug || newName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tags.slug')} ({language === 'ar' ? 'يُنشأ تلقائياً' : 'Auto-generated'})</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tag-slug"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('tags.color')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1"
                    dir="ltr"
                  />
                </div>
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

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <TagIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{tag.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {getPostCount(tag.id)}
                </Badge>
                <div className="flex gap-1 ms-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAddPost(tag.id)} title={t('nav.newPost')}>
                    <FilePlus className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tag)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Tags;
