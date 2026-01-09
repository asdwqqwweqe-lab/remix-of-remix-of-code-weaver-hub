import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Eye, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const Favorites = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const {
    getFavoritePosts,
    getCategoryById,
    getTagById,
    getLanguageById,
    toggleFavorite,
  } = useBlogStore();

  const favoritePosts = getFavoritePosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('favorites.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {favoritePosts.length} {t('favorites.total')}
        </p>
      </div>

      {favoritePosts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('favorites.noFavorites')}</p>
            <Link to="/posts">
              <Button className="mt-4">{t('favorites.browsePosts')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {favoritePosts.map((post) => {
            const category = getCategoryById(post.categoryId || '');
            const postTags = post.tags.map(id => getTagById(id)).filter(Boolean);
            const postLangs = post.programmingLanguages.map(id => getLanguageById(id)).filter(Boolean);

            return (
              <Card key={post.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {category && (
                          <Badge variant="secondary">
                            {language === 'ar' ? category.nameAr : category.nameEn}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {post.mainLanguage === 'ar' ? 'عربي' : 'EN'}
                        </Badge>
                      </div>

                      {/* Title */}
                      <Link to={`/posts/${post.id}`}>
                        <h3 
                          className="text-xl font-semibold hover:text-accent transition-colors line-clamp-1"
                          dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {post.title}
                        </h3>
                      </Link>

                      {/* Summary */}
                      <p 
                        className="text-muted-foreground mt-1 line-clamp-2"
                        dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                      >
                        {post.summary}
                      </p>

                      {/* Tags & Languages */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {postLangs.map((lang) => lang && (
                          <Badge 
                            key={lang.id}
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: lang.color, color: lang.color }}
                          >
                            {lang.name}
                          </Badge>
                        ))}
                        {postTags.slice(0, 3).map((tag) => tag && (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 me-1" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>

                      {/* Footer */}
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

                    {/* Remove from Favorites */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(post.id)}
                    >
                      <Star className="w-5 h-5 fill-accent text-accent" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Favorites;
