import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Code, 
  Eye, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2,
  FolderOpen,
  GripVertical,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import Pagination from '@/components/common/Pagination';
import TextImage from '@/components/common/TextImage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ITEMS_PER_PAGE = 9;

interface SortablePostItemProps {
  id: string;
  post: { id: string; title: string };
  onRemove: () => void;
}

const SortablePostItem = ({ id, post, onRemove }: SortablePostItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="w-4 h-4" />
      </button>
      <TextImage text={post.title} size="sm" variant="solid" />
      <Link to={`/posts/${post.id}`} className="flex-1 hover:text-accent">
        {post.title}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

interface SortableSectionItemProps {
  section: {
    id: string;
    title: string;
    description?: string;
    posts: { postId: string; sortOrder: number }[];
    targetPostsCount?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
  onAddPost: () => void;
  onRemovePost: (postId: string) => void;
  onReorderPosts: (postIds: string[]) => void;
  getPostById: (id: string) => { id: string; title: string } | undefined;
  languagePosts: { id: string; title: string }[];
  t: (key: string) => string;
}

const SortableSectionItem = ({
  section,
  onEdit,
  onDelete,
  onAddPost,
  onRemovePost,
  onReorderPosts,
  getPostById,
  languagePosts,
  t,
}: SortableSectionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const targetCount = section.targetPostsCount || 10;
  const progress = Math.min((section.posts.length / targetCount) * 100, 100);
  const sortedPosts = [...section.posts].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedPosts.findIndex((p) => p.postId === active.id);
      const newIndex = sortedPosts.findIndex((p) => p.postId === over.id);
      const newOrder = arrayMove(sortedPosts.map(p => p.postId), oldIndex, newIndex);
      onReorderPosts(newOrder);
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={section.id} className="border rounded-lg px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 flex-1">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
              <GripVertical className="w-4 h-4" />
            </button>
            <span className="font-medium">{section.title}</span>
            <Badge variant="secondary">{section.posts.length}</Badge>
            <div className="flex-1 mx-4 max-w-32">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 pb-2">
            {section.description && (
              <p className="text-sm text-muted-foreground">{section.description}</p>
            )}
            
            {/* Section Posts with drag and drop */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedPosts.map(p => p.postId)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedPosts.map((sp) => {
                    const post = getPostById(sp.postId);
                    if (!post) return null;
                    return (
                      <SortablePostItem
                        key={sp.postId}
                        id={sp.postId}
                        post={post}
                        onRemove={() => onRemovePost(sp.postId)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {/* Section Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="gap-1" onClick={onAddPost}>
                <Plus className="w-4 h-4" />
                {t('sections.addPost')}
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  );
};

const LanguageDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { 
    programmingLanguages, 
    posts, 
    categories, 
    tags,
    languageSections,
    addLanguageSection,
    updateLanguageSection,
    deleteLanguageSection,
    addPostToSection,
    removePostFromSection,
    getSectionsByLanguage,
    reorderSectionPosts,
    reorderSections
  } = useBlogStore();

  const programmingLanguage = programmingLanguages.find(l => l.slug === slug);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addPostDialogOpen, setAddPostDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    slug: '',
    description: '',
    targetPostsCount: 10,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!programmingLanguage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Code className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('common.notFound')}</h1>
        <p className="text-muted-foreground mb-6">{t('programmingLanguages.notFound')}</p>
        <Link to="/languages">
          <Button variant="outline" className="gap-2">
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t('programmingLanguages.backToLanguages')}
          </Button>
        </Link>
      </div>
    );
  }

  const sections = getSectionsByLanguage(programmingLanguage.id);
  
  const languagePosts = posts.filter(p => 
    p.programmingLanguages.includes(programmingLanguage.id) && p.status === 'published'
  );

  // Get posts not in any section
  const postsInSections = new Set(sections.flatMap(s => s.posts.map(p => p.postId)));
  const unassignedPosts = languagePosts.filter(p => !postsInSections.has(p.id));

  // Pagination for unassigned posts
  const totalPages = Math.ceil(unassignedPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return unassignedPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [unassignedPosts, currentPage]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return language === 'ar' ? category?.nameAr : category?.nameEn;
  };

  const getTagName = (tagId: string) => {
    return tags.find(t => t.id === tagId)?.name || '';
  };

  const getTagColor = (tagId: string) => {
    return tags.find(t => t.id === tagId)?.color || '#888';
  };

  const handleSectionSubmit = () => {
    if (!sectionForm.title.trim()) {
      toast.error(t('common.requiredField'));
      return;
    }

    if (editingSectionId) {
      updateLanguageSection(editingSectionId, {
        ...sectionForm,
        targetPostsCount: sectionForm.targetPostsCount,
      });
      toast.success(t('common.updated'));
    } else {
      addLanguageSection({
        languageId: programmingLanguage.id,
        title: sectionForm.title,
        slug: sectionForm.slug || sectionForm.title.toLowerCase().replace(/\s+/g, '-'),
        description: sectionForm.description,
        sortOrder: sections.length + 1,
        targetPostsCount: sectionForm.targetPostsCount,
        posts: [],
      });
      toast.success(t('common.created'));
    }

    resetSectionForm();
  };

  const handleEditSection = (section: typeof sections[0]) => {
    setEditingSectionId(section.id);
    setSectionForm({
      title: section.title,
      slug: section.slug,
      description: section.description || '',
      targetPostsCount: section.targetPostsCount || 10,
    });
    setSectionDialogOpen(true);
  };

  const handleDeleteSection = (id: string) => {
    deleteLanguageSection(id);
    toast.success(t('common.deleted'));
  };

  const handleAddPostToSection = (postId: string) => {
    if (selectedSectionId) {
      addPostToSection(selectedSectionId, postId);
      toast.success(t('common.added'));
      setAddPostDialogOpen(false);
    }
  };

  const handleRemovePostFromSection = (sectionId: string, postId: string) => {
    removePostFromSection(sectionId, postId);
    toast.success(t('common.removed'));
  };

  const resetSectionForm = () => {
    setSectionForm({ title: '', slug: '', description: '', targetPostsCount: 10 });
    setEditingSectionId(null);
    setSectionDialogOpen(false);
  };

  const getPostById = (postId: string) => posts.find(p => p.id === postId);

  const handleSectionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(sections.map(s => s.id), oldIndex, newIndex);
      reorderSections(programmingLanguage.id, newOrder);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/languages" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('programmingLanguages.backToLanguages')}
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${programmingLanguage.color}20` }}
            >
              <Code className="w-8 h-8" style={{ color: programmingLanguage.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{programmingLanguage.name}</h1>
              <p className="text-muted-foreground mt-1">
                {languagePosts.length} {t('programmingLanguages.postsCount')}
              </p>
            </div>
          </div>

          {/* Add Section Button */}
          <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => resetSectionForm()}>
                <Plus className="w-4 h-4" />
                {t('sections.add')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSectionId ? t('sections.edit') : t('sections.add')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('sections.sectionTitle')} *</Label>
                  <Input
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('sections.slug')}</Label>
                  <Input
                    value={sectionForm.slug}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="section-slug"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('sections.description')}</Label>
                  <Textarea
                    value={sectionForm.description}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {t('sections.targetCount')}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={sectionForm.targetPostsCount}
                    onChange={(e) => setSectionForm(prev => ({ ...prev, targetPostsCount: parseInt(e.target.value) || 10 }))}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetSectionForm}>
                    {t('common.cancel')}
                  </Button>
                  <Button onClick={handleSectionSubmit}>
                    {editingSectionId ? t('common.save') : t('common.create')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Add Post Dialog */}
      <Dialog open={addPostDialogOpen} onOpenChange={setAddPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sections.addPost')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {selectedSectionId && languagePosts.filter(p => 
              !sections.find(s => s.id === selectedSectionId)?.posts.some(sp => sp.postId === p.id)
            ).map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted cursor-pointer"
                onClick={() => handleAddPostToSection(post.id)}
              >
                <TextImage text={post.title} size="sm" variant="gradient" />
                <span>{post.title}</span>
              </div>
            ))}
            {selectedSectionId && languagePosts.filter(p => 
              !sections.find(s => s.id === selectedSectionId)?.posts.some(sp => sp.postId === p.id)
            ).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {t('sections.noPostsToAdd')}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sections with drag and drop */}
      {sections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {t('sections.title')}
          </h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionsDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <Accordion type="multiple" className="space-y-2">
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    onEdit={() => handleEditSection(section)}
                    onDelete={() => handleDeleteSection(section.id)}
                    onAddPost={() => {
                      setSelectedSectionId(section.id);
                      setAddPostDialogOpen(true);
                    }}
                    onRemovePost={(postId) => handleRemovePostFromSection(section.id, postId)}
                    onReorderPosts={(postIds) => reorderSectionPosts(section.id, postIds)}
                    getPostById={getPostById}
                    languagePosts={languagePosts}
                    t={t}
                  />
                ))}
              </Accordion>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Unassigned Posts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {sections.length > 0 ? t('sections.unassignedPosts') : t('programmingLanguages.posts')}
        </h2>
        
        {paginatedPosts.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPosts.map((post) => (
                <Link key={post.id} to={`/posts/${post.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow card-hover">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <TextImage text={post.title} size="sm" variant="gradient" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                          {post.categoryId && (
                            <Badge variant="secondary" className="w-fit mt-1">
                              {getCategoryName(post.categoryId)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-muted-foreground text-sm line-clamp-2">{post.summary}</p>
                      
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map(tagId => (
                            <Badge 
                              key={tagId} 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: getTagColor(tagId), color: getTagColor(tagId) }}
                            >
                              {getTagName(tagId)}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{post.viewsCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(post.createdAt), 'PP', { locale: language === 'ar' ? ar : enUS })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={unassignedPosts.length}
            />
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Code className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {sections.length > 0 ? t('sections.allPostsAssigned') : t('programmingLanguages.noPosts')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LanguageDetails;
