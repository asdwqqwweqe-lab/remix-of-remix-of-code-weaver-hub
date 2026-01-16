import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Edit,
  Star,
  Eye,
  Calendar,
  Tag,
  Link as LinkIcon,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import CommentSection from '@/components/blog/CommentSection';
import VersionHistory from '@/components/post/VersionHistory';
import CodeHighlighter from '@/components/post/CodeHighlighter';
import RelatedPosts from '@/components/post/RelatedPosts';
import ScrollProgress from '@/components/common/ScrollProgress';
import DisplaySettings, { DisplaySettingsValues } from '@/components/reports/DisplaySettings';
import PostSearch from '@/components/post/PostSearch';
import ContentNavigation from '@/components/navigation/ContentNavigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PostDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const {
    posts,
    getPostById,
    getCategoryById,
    getTagById,
    getLanguageById,
    toggleFavorite,
    incrementViews,
    collections,
    movePostToCollection,
  } = useBlogStore();

  // Get all posts for navigation
  const allPosts = posts.map(p => ({ id: p.id, title: p.title }));

  const [displaySettings, setDisplaySettings] = useState<DisplaySettingsValues>({
    fontSize: 16,
    lineHeight: 1.75,
    paragraphSpacing: 1.5,
    nightMode: false,
    codeFontSize: 14,
    codeLineHeight: 1.5,
  });

  const handleSettingsChange = useCallback((settings: DisplaySettingsValues) => {
    setDisplaySettings(settings);
  }, []);

  const post = getPostById(id || '');

  useEffect(() => {
    if (post) {
      incrementViews(post.id);
    }
  }, [id]);

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t('posts.notFound')}</h2>
        <Link to="/posts">
          <Button>{t('common.backToList')}</Button>
        </Link>
      </div>
    );
  }

  const category = getCategoryById(post.categoryId || '');
  const postTags = post.tags.map(id => getTagById(id)).filter(Boolean);
  const postLangs = post.programmingLanguages.map(id => getLanguageById(id)).filter(Boolean);
  const currentCollection = collections.find(c => c.posts.some(p => p.postId === post.id));

  const handleCollectionChange = (collectionId: string) => {
    if (collectionId === 'none') return;
    movePostToCollection(post.id, currentCollection?.id || null, collectionId);
    toast.success(t('common.updated'));
  };

  return (
    <div className={cn(
      "max-w-7xl mx-auto",
      displaySettings.nightMode && "night-reading-mode"
    )}>
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('common.back')}
        </Button>
        <div className="flex gap-2">
          <PostSearch content={post.content} />
          <Link to={`/posts/${post.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Edit className="w-4 h-4" />
              {t('common.edit')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="space-y-4 order-2 lg:order-1">
          {/* Display Settings */}
          <DisplaySettings
            onSettingsChange={handleSettingsChange}
            className="sticky top-4"
          />

          {/* Move to Collection */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <FolderOpen className="w-4 h-4 text-primary" />
                {t('sections.moveToCollection')}
              </h3>
              <Select value={currentCollection?.id || ''} onValueChange={handleCollectionChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('sections.moveToCollection')} />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Links */}
          {post.links.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  {t('posts.links')}
                </h3>
                <div className="space-y-1">
                  {post.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline p-1.5 rounded-md hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          <VersionHistory postId={post.id} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 order-1 lg:order-2 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <Link to={`/categories/${category.slug}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80">
                    {language === 'ar' ? category.nameAr : category.nameEn}
                  </Badge>
                </Link>
              )}
              <Badge
                variant="outline"
                className={post.status === 'published' ? 'status-published' : post.status === 'draft' ? 'status-draft' : 'status-archived'}
              >
                {t(`posts.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`)}
              </Badge>
            </div>

            <h1
              className="text-3xl md:text-4xl font-bold"
              dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              {post.title}
            </h1>

            <p
              className="text-xl text-muted-foreground"
              dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              {post.summary}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.createdAt), 'PPP', { locale: language === 'ar' ? ar : enUS })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewsCount} {t('posts.views')}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(post.id)}
                className="gap-1"
              >
                <Star className={`w-4 h-4 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
                {post.isFavorite ? t('posts.removeFromFavorites') : t('posts.addToFavorites')}
              </Button>
            </div>

            {/* Programming Languages */}
            {postLangs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {postLangs.map((lang) => lang && (
                  <Link key={lang.id} to={`/languages/${lang.slug}`}>
                    <Badge
                      className="cursor-pointer"
                      style={{ backgroundColor: lang.color, color: '#fff' }}
                    >
                      {lang.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Tags */}
            {postTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {postTags.map((tag) => tag && (
                  <Link key={tag.id} to={`/tags/${tag.slug}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                      <Tag className="w-3 h-3 me-1" />
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Content */}
          <div
            className="post-content"
            style={{
              '--paragraph-spacing': `${displaySettings.paragraphSpacing}rem`,
            } as React.CSSProperties}
          >
            <CodeHighlighter
              content={post.content}
              className={cn(
                "editor-content prose dark:prose-invert max-w-none [&_pre]:text-left [&_pre]:dir-ltr [&_code]:text-left [&_code]:dir-ltr",
                "[&_p]:mb-[var(--paragraph-spacing)] [&_h1]:mb-[var(--paragraph-spacing)] [&_h2]:mb-[var(--paragraph-spacing)] [&_h3]:mb-[var(--paragraph-spacing)] [&_ul]:mb-[var(--paragraph-spacing)] [&_ol]:mb-[var(--paragraph-spacing)] [&_blockquote]:mb-[var(--paragraph-spacing)]"
              )}
              dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
              showTableOfContents={true}
              useExternalSettings={true}
              externalFontSize={displaySettings.fontSize}
              externalLineHeight={displaySettings.lineHeight}
              externalCodeFontSize={displaySettings.codeFontSize}
              externalCodeLineHeight={displaySettings.codeLineHeight}
            />
          </div>

          {/* Comments */}
          {post.commentsEnabled && (
            <CommentSection postId={post.id} />
          )}

          {/* Related Posts */}
          <RelatedPosts currentPost={post} />

          {/* Navigation */}
          <ContentNavigation
            currentId={post.id}
            items={allPosts}
            baseUrl="/posts"
            className="mt-6"
          />
        </div>
      </div>

      {/* Scroll Progress */}
      <ScrollProgress />
    </div>
  );
};

export default PostDetails;
