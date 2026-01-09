import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Link as LinkIcon,
  Tag,
  Globe,
  FileEdit,
  FileText,
} from 'lucide-react';
import { Post, PostLink, ContentLanguage, PostStatus } from '@/types/blog';
import RichTextEditor from '@/components/editor/RichTextEditor';
import MarkdownEditor from '@/components/reports/MarkdownEditor';
import AIGenerateButton from '@/components/common/AIGenerateButton';
import AIAutoFillButton from '@/components/common/AIAutoFillButton';
import PostTemplates from '@/components/posts/PostTemplates';
import LivePostPreview from '@/components/posts/LivePostPreview';
import { toast } from 'sonner';
import { 
  PanelLeftClose,
  PanelLeft,
  Eye,
  EyeOff,
} from 'lucide-react';

// Quick Add Collection Component
const QuickAddCollection = ({ onAdd }: { onAdd: (id: string) => void }) => {
  const { t } = useTranslation();
  const { addCollection, collections } = useBlogStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error(t('collections.titleRequired'));
      return;
    }
    const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    addCollection({ title, slug, description, posts: [] });
    toast.success(t('collections.created'));
    // Get the new collection
    setTimeout(() => {
      const newCollections = useBlogStore.getState().collections;
      const newCol = newCollections.find(c => c.title === title && c.slug === slug);
      if (newCol) onAdd(newCol.id);
    }, 100);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('collections.name')} *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t('collections.description')}</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button onClick={handleAdd} className="w-full">{t('common.add')}</Button>
    </div>
  );
};

const PostEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const {
    categories,
    tags,
    collections,
    programmingLanguages,
    addPost,
    updatePost,
    createVersion,
    getPostById,
    addCategory,
    addTag,
    addPostToCollection,
    addCollection,
    addProgrammingLanguage,
  } = useBlogStore();

  const isEditing = !!id;
  const existingPost = isEditing ? getPostById(id) : null;

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    summary: string;
    content: string;
    mainLanguage: ContentLanguage;
    status: PostStatus;
    categoryId: string;
    collectionId: string;
    isFavorite: boolean;
    commentsEnabled: boolean;
    selectedTags: string[];
    selectedLanguages: string[];
    links: PostLink[];
  }>({
    title: '',
    slug: '',
    summary: '',
    content: '',
    mainLanguage: 'ar',
    status: 'draft',
    categoryId: '',
    collectionId: '',
    isFavorite: false,
    commentsEnabled: true,
    selectedTags: [],
    selectedLanguages: [],
    links: [],
  });

  const [newLink, setNewLink] = useState({ label: '', url: '', type: 'other' as const });
  const [newCategoryName, setNewCategoryName] = useState({ ar: '', en: '' });
  const [newTagName, setNewTagName] = useState('');
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (existingPost) {
      setFormData({
        title: existingPost.title,
        slug: existingPost.slug,
        summary: existingPost.summary,
        content: existingPost.content,
        mainLanguage: existingPost.mainLanguage,
        status: existingPost.status,
        categoryId: existingPost.categoryId || '',
        collectionId: existingPost.collectionId || '',
        isFavorite: existingPost.isFavorite,
        commentsEnabled: existingPost.commentsEnabled,
        selectedTags: existingPost.tags,
        selectedLanguages: existingPost.programmingLanguages,
        links: existingPost.links,
      });
    }
  }, [existingPost]);

  const generateSlug = (title: string) => {
    // Convert Arabic/Unicode to transliteration or use as-is
    const slug = title
      .toLowerCase()
      .trim()
      // Replace Arabic characters with their romanized equivalents
      .replace(/[\u0600-\u06FF]+/g, (match) => {
        return match.split('').map((char) => {
          const arabicToLatin: Record<string, string> = {
            'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
            'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
            'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
            'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
            'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
            'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
            'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
            'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
            'ة': 'h', 'ء': '', 'ئ': 'y', 'ؤ': 'w',
          };
          return arabicToLatin[char] || char;
        }).join('');
      })
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return slug || `post-${Date.now()}`;
  };

  const handleTitleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value,
      slug: prev.slug || generateSlug(value),
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  const toggleLanguage = (langId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLanguages: prev.selectedLanguages.includes(langId)
        ? prev.selectedLanguages.filter(id => id !== langId)
        : [...prev.selectedLanguages, langId],
    }));
  };

  const addLink = () => {
    if (newLink.label && newLink.url) {
      setFormData(prev => ({
        ...prev,
        links: [...prev.links, { ...newLink, id: Math.random().toString(36).substr(2, 9) }],
      }));
      setNewLink({ label: '', url: '', type: 'other' });
    }
  };

  const removeLink = (linkId: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(l => l.id !== linkId),
    }));
  };

  const handleAddCategory = () => {
    if (newCategoryName.ar.trim() || newCategoryName.en.trim()) {
      addCategory({
        nameAr: newCategoryName.ar || newCategoryName.en,
        nameEn: newCategoryName.en || newCategoryName.ar,
        slug: generateSlug(newCategoryName.en || newCategoryName.ar),
      });
      setNewCategoryName({ ar: '', en: '' });
      setShowCategoryDialog(false);
      toast.success(t('categories.created'));
    }
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      addTag({
        name: newTagName,
        slug: generateSlug(newTagName),
      });
      setNewTagName('');
      setShowTagDialog(false);
      toast.success(t('tags.created'));
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error(t('posts.titleRequired'));
      return;
    }

    const postData = {
      title: formData.title,
      slug: formData.slug || generateSlug(formData.title),
      summary: formData.summary,
      content: formData.content,
      mainLanguage: formData.mainLanguage,
      status: formData.status,
      categoryId: formData.categoryId || undefined,
      collectionId: formData.collectionId || undefined,
      isFavorite: formData.isFavorite,
      commentsEnabled: formData.commentsEnabled,
      tags: formData.selectedTags,
      programmingLanguages: formData.selectedLanguages,
      links: formData.links,
      attachments: existingPost?.attachments || [],
      viewsCount: existingPost?.viewsCount || 0,
    };

    if (isEditing && existingPost) {
      createVersion(existingPost.id);
      updatePost(existingPost.id, postData);
      // Update collection if changed
      if (formData.collectionId && formData.collectionId !== existingPost.collectionId) {
        addPostToCollection(formData.collectionId, existingPost.id);
      }
      toast.success(t('posts.updated'));
      navigate('/posts');
    } else {
      // Create new post and add to collection
      const newPostId = Math.random().toString(36).substr(2, 9);
      addPost({ ...postData, id: newPostId } as any);
      
      // Add to collection after creating the post
      if (formData.collectionId) {
        // Need to get the latest posts to find the new post
        setTimeout(() => {
          const posts = useBlogStore.getState().posts;
          const newPost = posts.find(p => p.title === postData.title && p.slug === postData.slug);
          if (newPost && formData.collectionId) {
            addPostToCollection(formData.collectionId, newPost.id);
          }
        }, 100);
      }
      
      toast.success(t('posts.created'));
      navigate('/posts');
    }
  };

  const handleSelectTemplate = (content: string) => {
    if (formData.content && content) {
      if (!confirm(language === 'ar' ? 'هل تريد استبدال المحتوى الحالي؟' : 'Replace current content?')) {
        return;
      }
    }
    setFormData(prev => ({ ...prev, content }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t('common.back')}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(!showPreview)} title={showPreview ? 'Hide preview' : 'Show preview'}>
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        <Button onClick={handleSubmit} className="gap-2">
          <Save className="w-4 h-4" />
          {isEditing ? t('common.save') : t('common.create')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sidebar with Templates */}
        {showSidebar && (
          <div className="space-y-4 order-2 lg:order-1">
            <PostTemplates onSelectTemplate={handleSelectTemplate} />
          </div>
        )}

        {/* Main Editor */}
        <div className={`space-y-6 order-1 lg:order-2 ${showSidebar && showPreview ? 'lg:col-span-2' : showSidebar || showPreview ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>{t('posts.title')} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={t('posts.titlePlaceholder')}
                  dir={formData.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                  className="text-xl font-semibold"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label>{t('posts.slug')}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                  dir="ltr"
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('posts.summary')}</Label>
                  <AIGenerateButton
                    context={formData.title}
                    field="summary"
                    onGenerate={(summary) => setFormData(prev => ({ ...prev, summary }))}
                  />
                </div>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder={t('posts.summaryPlaceholder')}
                  dir={formData.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                  rows={3}
                />
              </div>

              {/* Content Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('posts.content')}</Label>
                  <div className="flex items-center gap-2">
                    <AIAutoFillButton
                      content={formData.content}
                      type="post"
                      existingCategories={categories.map(c => ({ id: c.id, nameAr: c.nameAr, nameEn: c.nameEn }))}
                      existingCollections={collections.map(c => ({ id: c.id, title: c.title }))}
                      existingTags={tags.map(t => ({ id: t.id, name: t.name }))}
                      existingLanguages={programmingLanguages.map(l => ({ id: l.id, name: l.name }))}
                      onAutoFillPost={(result) => {
                        // Generate slug from title
                        const generateSlugLocal = (title: string) => {
                          return title
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-')
                            .trim();
                        };

                        // Find or create category
                        let categoryId = '';
                        if (result.categoryName) {
                          const existingCat = categories.find(c => 
                            c.nameAr.includes(result.categoryName) || 
                            c.nameEn.toLowerCase().includes(result.categoryName.toLowerCase())
                          );
                          if (existingCat) {
                            categoryId = existingCat.id;
                          } else {
                            addCategory({
                              nameAr: result.categoryName,
                              nameEn: result.categoryName,
                              slug: generateSlugLocal(result.categoryName),
                            });
                            setTimeout(() => {
                              const newCats = useBlogStore.getState().categories;
                              const newCat = newCats.find(c => c.nameAr === result.categoryName);
                              if (newCat) {
                                setFormData(prev => ({ ...prev, categoryId: newCat.id }));
                              }
                            }, 100);
                          }
                        }

                        // Find or create collection
                        let collectionId = '';
                        if (result.collectionName) {
                          const existingCol = collections.find(c => 
                            c.title.includes(result.collectionName)
                          );
                          if (existingCol) {
                            collectionId = existingCol.id;
                          } else {
                            addCollection({
                              title: result.collectionName,
                              slug: generateSlugLocal(result.collectionName),
                              description: '',
                              posts: [],
                            });
                            setTimeout(() => {
                              const newCols = useBlogStore.getState().collections;
                              const newCol = newCols.find(c => c.title === result.collectionName);
                              if (newCol) {
                                setFormData(prev => ({ ...prev, collectionId: newCol.id }));
                              }
                            }, 100);
                          }
                        }

                        // Find or create tags
                        const selectedTagIds: string[] = [];
                        result.tags.forEach(tagName => {
                          const existingTag = tags.find(t => 
                            t.name.toLowerCase() === tagName.toLowerCase()
                          );
                          if (existingTag) {
                            selectedTagIds.push(existingTag.id);
                          } else {
                            addTag({
                              name: tagName,
                              slug: generateSlugLocal(tagName),
                            });
                          }
                        });

                        // Find or create languages
                        const selectedLangIds: string[] = [];
                        result.languages.forEach(langName => {
                          const existingLang = programmingLanguages.find(l => 
                            l.name.toLowerCase() === langName.toLowerCase()
                          );
                          if (existingLang) {
                            selectedLangIds.push(existingLang.id);
                          } else {
                            addProgrammingLanguage({
                              name: langName,
                              slug: generateSlugLocal(langName),
                              color: '#' + Math.floor(Math.random()*16777215).toString(16),
                            });
                          }
                        });

                        // Update form data
                        setFormData(prev => ({
                          ...prev,
                          title: result.title,
                          slug: result.slug,
                          summary: result.summary,
                          categoryId: categoryId || prev.categoryId,
                          collectionId: collectionId || prev.collectionId,
                          selectedTags: [...new Set([...prev.selectedTags, ...selectedTagIds])],
                          selectedLanguages: [...new Set([...prev.selectedLanguages, ...selectedLangIds])],
                        }));

                        // Refresh tags and languages after creation
                        setTimeout(() => {
                          const currentTags = useBlogStore.getState().tags;
                          const currentLangs = useBlogStore.getState().programmingLanguages;
                          
                          const newTagIds = result.tags
                            .map(tagName => currentTags.find(t => t.name.toLowerCase() === tagName.toLowerCase())?.id)
                            .filter(Boolean) as string[];
                          
                          const newLangIds = result.languages
                            .map(langName => currentLangs.find(l => l.name.toLowerCase() === langName.toLowerCase())?.id)
                            .filter(Boolean) as string[];

                          setFormData(prev => ({
                            ...prev,
                            selectedTags: [...new Set([...prev.selectedTags, ...newTagIds])],
                            selectedLanguages: [...new Set([...prev.selectedLanguages, ...newLangIds])],
                          }));
                        }, 200);
                      }}
                    />
                    <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as 'wysiwyg' | 'markdown')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="wysiwyg" className="text-xs gap-1 h-7 px-2">
                          <FileEdit className="w-3 h-3" />
                          WYSIWYG
                        </TabsTrigger>
                        <TabsTrigger value="markdown" className="text-xs gap-1 h-7 px-2">
                          <FileText className="w-3 h-3" />
                          Markdown
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                {editorMode === 'wysiwyg' ? (
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    language={formData.mainLanguage}
                  />
                ) : (
                  <MarkdownEditor
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    placeholder={t('posts.contentPlaceholder')}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="w-5 h-5" />
                {t('posts.links')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.links.length > 0 && (
                <div className="space-y-2">
                  {formData.links.map((link) => (
                    <div key={link.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Badge variant="outline">{link.type}</Badge>
                      <span className="flex-1 truncate">{link.label}</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate max-w-[200px]">
                        {link.url}
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => removeLink(link.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder={t('posts.linkLabel')}
                  value={newLink.label}
                  onChange={(e) => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder="https://..."
                  value={newLink.url}
                  onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                  className="flex-1"
                  dir="ltr"
                />
                <Select value={newLink.type} onValueChange={(v: any) => setNewLink(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="docs">Docs</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="other">{t('common.other')}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addLink} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="order-3 lg:order-3">
            <LivePostPreview 
              content={formData.content} 
              title={formData.title}
              className="sticky top-4"
            />
          </div>
        )}

        {/* Settings Sidebar */}
        <div className={`space-y-6 order-4 ${showPreview ? '' : 'lg:col-span-1'}`}>
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('posts.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('posts.language')}
                </Label>
                <Select 
                  value={formData.mainLanguage} 
                  onValueChange={(v: ContentLanguage) => setFormData(prev => ({ ...prev, mainLanguage: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>{t('posts.status')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: PostStatus) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('posts.statusDraft')}</SelectItem>
                    <SelectItem value="published">{t('posts.statusPublished')}</SelectItem>
                    <SelectItem value="archived">{t('posts.statusArchived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>{t('posts.category')}</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.categoryId || "none"} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('posts.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none')}</SelectItem>
                      {categories.filter(cat => cat.id).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {language === 'ar' ? cat.nameAr : cat.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('categories.add')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t('categories.nameAr')}</Label>
                          <Input
                            value={newCategoryName.ar}
                            onChange={(e) => setNewCategoryName(prev => ({ ...prev, ar: e.target.value }))}
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('categories.nameEn')}</Label>
                          <Input
                            value={newCategoryName.en}
                            onChange={(e) => setNewCategoryName(prev => ({ ...prev, en: e.target.value }))}
                            dir="ltr"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                            {t('common.cancel')}
                          </Button>
                          <Button onClick={handleAddCategory}>
                            {t('common.add')}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Collection */}
              <div className="space-y-2">
                <Label>{t('collections.title')}</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.collectionId || "none"} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, collectionId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('collections.selectCollection')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none')}</SelectItem>
                      {collections.filter(col => col.id).map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('collections.add')}</DialogTitle>
                      </DialogHeader>
                      <QuickAddCollection onAdd={(id) => setFormData(prev => ({ ...prev, collectionId: id }))} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{t('posts.favorite')}</Label>
                  <Switch
                    checked={formData.isFavorite}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isFavorite: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t('posts.enableComments')}</Label>
                  <Switch
                    checked={formData.commentsEnabled}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, commentsEnabled: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Programming Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('programmingLanguages.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {programmingLanguages.map((lang) => (
                  <Badge
                    key={lang.id}
                    variant={formData.selectedLanguages.includes(lang.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    style={{ 
                      borderColor: lang.color,
                      backgroundColor: formData.selectedLanguages.includes(lang.id) ? lang.color : 'transparent',
                      color: formData.selectedLanguages.includes(lang.id) ? '#fff' : 'inherit'
                    }}
                    onClick={() => toggleLanguage(lang.id)}
                  >
                    {lang.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  {t('posts.tags')}
                </span>
                <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('tags.add')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t('tags.name')}</Label>
                        <Input
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowTagDialog(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={handleAddTag}>
                          {t('common.add')}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={formData.selectedTags.includes(tag.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
