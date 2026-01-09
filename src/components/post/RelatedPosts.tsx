import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Post } from '@/types/blog';

interface RelatedPostsProps {
  currentPost: Post;
  className?: string;
}

const RelatedPosts = ({ currentPost, className }: RelatedPostsProps) => {
  const { language } = useLanguage();
  const { posts, getCategoryById, getTagById, getLanguageById } = useBlogStore();

  // Find related posts based on category, tags, and programming languages
  const getRelatedPosts = (): Post[] => {
    const scoredPosts = posts
      .filter(post => post.id !== currentPost.id && post.status === 'published')
      .map(post => {
        let score = 0;
        
        // Same category = 3 points
        if (post.categoryId && post.categoryId === currentPost.categoryId) {
          score += 3;
        }
        
        // Shared tags = 2 points each
        const sharedTags = post.tags.filter(tagId => currentPost.tags.includes(tagId));
        score += sharedTags.length * 2;
        
        // Shared programming languages = 2 points each
        const sharedLangs = post.programmingLanguages.filter(langId => 
          currentPost.programmingLanguages.includes(langId)
        );
        score += sharedLangs.length * 2;
        
        // Same content language = 1 point
        if (post.mainLanguage === currentPost.mainLanguage) {
          score += 1;
        }
        
        return { post, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return scoredPosts.map(item => item.post);
  };

  const relatedPosts = getRelatedPosts();

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-primary" />
          {language === 'ar' ? 'مواضيع مرتبطة' : 'Related Posts'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {relatedPosts.map(post => {
            const category = getCategoryById(post.categoryId || '');
            const postLangs = post.programmingLanguages.slice(0, 2).map(id => getLanguageById(id)).filter(Boolean);
            
            return (
              <Link
                key={post.id}
                to={`/posts/${post.id}`}
                className="group block"
              >
                <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-md h-full">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {category && (
                      <Badge variant="secondary" className="text-xs">
                        {language === 'ar' ? category.nameAr : category.nameEn}
                      </Badge>
                    )}
                    {postLangs.map(lang => lang && (
                      <Badge 
                        key={lang.id}
                        className="text-xs"
                        style={{ backgroundColor: lang.color, color: '#fff' }}
                      >
                        {lang.name}
                      </Badge>
                    ))}
                  </div>
                  
                  <h3 
                    className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors"
                    dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {post.title}
                  </h3>
                  
                  <p 
                    className="text-xs text-muted-foreground line-clamp-2 mb-3"
                    dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {post.summary}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RelatedPosts;
