import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, BookOpen, FileText, Eye, Calendar, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
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
import { Post } from '@/types/blog';

interface SortablePostProps {
  post: Post;
  index: number;
  language: string;
  getCategoryById: (id: string) => any;
}

const SortablePost = ({ post, index, language, getCategoryById }: SortablePostProps) => {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  const category = getCategoryById(post.categoryId || '');

  return (
    <Card ref={setNodeRef} style={style} className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground p-1"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent font-bold shrink-0">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <Link to={`/posts/${post.id}`}>
              <h3 
                className="font-semibold hover:text-accent transition-colors line-clamp-1"
                dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
              >
                {post.title}
              </h3>
            </Link>
            <p 
              className="text-sm text-muted-foreground line-clamp-1 mt-1"
              dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              {post.summary}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {category && (
                <Badge variant="outline" className="text-xs">
                  {language === 'ar' ? category.nameAr : category.nameEn}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.viewsCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(post.createdAt), 'PP', { locale: language === 'ar' ? ar : enUS })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CollectionDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { language, isRTL } = useLanguage();
  const { collections, getPostById, getCategoryById, reorderCollectionPosts } = useBlogStore();

  const collection = collections.find(c => c.slug === slug);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('collections.notFound')}</h1>
        <p className="text-muted-foreground mb-4">{t('collections.notFoundDesc')}</p>
        <Button onClick={() => navigate('/collections')} className="gap-2">
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('collections.backToCollections')}
        </Button>
      </div>
    );
  }

  const collectionPosts = collection.posts
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(cp => getPostById(cp.postId))
    .filter(Boolean) as Post[];

  const progress = collection.targetPostsCount 
    ? Math.min(100, (collection.posts.length / collection.targetPostsCount) * 100)
    : 0;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = collectionPosts.findIndex(p => p.id === active.id);
      const newIndex = collectionPosts.findIndex(p => p.id === over.id);
      const newOrder = arrayMove(collectionPosts.map(p => p.id), oldIndex, newIndex);
      reorderCollectionPosts(collection.id, newOrder);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/collections')} className="gap-2">
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('collections.backToCollections')}
        </Button>
      </div>

      {/* Collection Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-accent" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{collection.title}</CardTitle>
              {collection.description && (
                <p className="text-muted-foreground mt-1">{collection.description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {collectionPosts.length}{collection.targetPostsCount ? `/${collection.targetPostsCount}` : ''} {t('posts.total')}
            </Badge>
            {collection.targetPostsCount && collection.targetPostsCount > 0 && (
              <div className="flex-1 max-w-xs space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{i18n.language === 'ar' ? 'التقدم' : 'Progress'}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t('collections.postsInCollection')}</h2>
        
        {collectionPosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('collections.noPosts')}</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={collectionPosts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {collectionPosts.map((post, index) => (
                  <SortablePost
                    key={post.id}
                    post={post}
                    index={index}
                    language={language}
                    getCategoryById={getCategoryById}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default CollectionDetails;
