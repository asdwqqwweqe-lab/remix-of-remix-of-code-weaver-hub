import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Plus, Edit, Trash2, Code, FileText, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Languages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { programmingLanguages, posts, addProgrammingLanguage, updateProgrammingLanguage, deleteProgrammingLanguage } = useBlogStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#3178c6',
    icon: '',
  });

  const getPostCount = (langId: string) => {
    return posts.filter(p => p.programmingLanguages.includes(langId)).length;
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error(t('programmingLanguages.nameRequired'));
      return;
    }

    if (editingId) {
      updateProgrammingLanguage(editingId, formData);
      toast.success(t('programmingLanguages.updated'));
    } else {
      addProgrammingLanguage({
        ...formData,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      });
      toast.success(t('programmingLanguages.created'));
    }

    resetForm();
  };

  const handleEdit = (lang: typeof programmingLanguages[0]) => {
    setEditingId(lang.id);
    setFormData({
      name: lang.name,
      slug: lang.slug,
      color: lang.color,
      icon: lang.icon || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProgrammingLanguage(id);
    toast.success(t('programmingLanguages.deleted'));
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', color: '#3178c6', icon: '' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleAddPost = (langId: string) => {
    navigate(`/posts/new?languageId=${langId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('programmingLanguages.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {programmingLanguages.length} {t('programmingLanguages.total')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              {t('programmingLanguages.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('programmingLanguages.edit') : t('programmingLanguages.add')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('programmingLanguages.name')} *</Label>
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
                <Label>{t('programmingLanguages.slug')} ({language === 'ar' ? 'يُنشأ تلقائياً' : 'Auto-generated'})</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="language-slug"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('programmingLanguages.color')}</Label>
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {programmingLanguages.map((lang) => {
          const postCount = getPostCount(lang.id);
          return (
            <Card key={lang.id} className="card-hover group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${lang.color}20` }}
                    >
                      <Code className="w-5 h-5" style={{ color: lang.color }} />
                    </div>
                    <CardTitle className="text-lg">{lang.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {postCount} {t('posts.total')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Link to={`/languages/${lang.slug}`}>
                    <Button variant="outline" size="sm">
                      {t('common.viewPosts')}
                    </Button>
                  </Link>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAddPost(lang.id)} title={t('nav.newPost')}>
                      <FilePlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(lang)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(lang.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Languages;
