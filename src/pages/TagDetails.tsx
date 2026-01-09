import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Tag as TagIcon, Eye, Calendar, Star, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const TagDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const { posts, tags, categories, getCategoryById, getTagById, getLanguageById, toggleFavorite } = useBlogStore();

  const tag = tags.find(t => t.slug === slug);
  const tagPosts = posts.filter(p => p.tags.includes(tag?.id || ''));

  if (!tag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <TagIcon className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">{t('tags.notFound')}</h1>
        <Button onClick={() => navigate('/tags')} className="gap-2">
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('tags.backToTags')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/tags')} className="gap-2">
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          {t('common.back')}
        </Button>
      </div>

      {/* Tag Info */}
      <div className="flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${tag.color}20` }}
        >
          <TagIcon className="w-8 h-8" style={{ color: tag.color }} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{tag.name}</h1>
          <p className="text-muted-foreground">
            {tagPosts.length} {t('tags.postsCount')}
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {tagPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">{t('tags.noPosts')}</p>
            </CardContent>
          </Card>
        ) : (
          tagPosts.map((post) => {
            const category = getCategoryById(post.categoryId || '');
            const postTags = post.tags.map(id => getTagById(id)).filter(Boolean);
            const postLangs = post.programmingLanguages.map(id => getLanguageById(id)).filter(Boolean);

            return (
              <Card key={post.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {category && (
                          <Link to={`/categories/${category.slug}`}>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <FolderOpen className="w-3 h-3" />
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
                        {postTags.slice(0, 3).map((t) => t && (
                          <Link key={t.id} to={`/tags/${t.slug}`}>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                borderColor: t.id === tag.id ? tag.color : undefined,
                                backgroundColor: t.id === tag.id ? `${tag.color}20` : undefined
                              }}
                            >
                              <TagIcon className="w-3 h-3 me-1" />
                              {t.name}
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
          })
        )}
      </div>
    </div>
  );
};

export default TagDetails;
