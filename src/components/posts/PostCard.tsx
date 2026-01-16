import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Star, Eye, Calendar, Trash2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import TextImage from '@/components/common/TextImage';
import { toast } from 'sonner';

interface PostCardProps {
    post: any;
    viewMode: 'list' | 'grid' | 'compact';
    language: string;
    selectedPosts: string[];
    t: (key: string) => string;
    getCategoryById: (id: string) => any;
    getTagById: (id: string) => any;
    getLanguageById: (id: string) => any;
    toggleFavorite: (id: string) => void;
    deletePost: (id: string) => void;
    toggleSelectPost: (id: string) => void;
}

export const PostCard = ({
    post,
    viewMode,
    language,
    selectedPosts,
    t,
    getCategoryById,
    getTagById,
    getLanguageById,
    toggleFavorite,
    deletePost,
    toggleSelectPost,
}: PostCardProps) => {
    const category = getCategoryById(post.categoryId || '');
    const postTags = post.tags.map((id: string) => getTagById(id)).filter(Boolean);
    const postLangs = post.programmingLanguages.map((id: string) => getLanguageById(id)).filter(Boolean);

    const handleDeletePost = () => {
        deletePost(post.id);
        toast.success(`تم حذف الموضوع "${post.title}" بنجاح`);
    };

    if (viewMode === 'compact') {
        return (
            <Card key={post.id} className="card-hover">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Checkbox
                                checked={selectedPosts.includes(post.id)}
                                onCheckedChange={() => toggleSelectPost(post.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`تحديد ${post.title}`}
                            />
                            <TextImage text={post.title} size="sm" variant="gradient" />
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs shrink-0",
                                    post.status === 'published' ? 'status-published' : post.status === 'draft' ? 'status-draft' : 'status-archived'
                                )}
                            >
                                {t(`posts.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`)}
                            </Badge>
                            <Link to={`/posts/${post.id}`} className="flex-1 min-w-0">
                                <h3
                                    className="font-medium hover:text-accent transition-colors truncate"
                                    dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                                >
                                    {post.title}
                                </h3>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                                <Eye className="w-4 h-4" />
                                {post.viewsCount}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleFavorite(post.id)}
                            >
                                <Star className={`w-4 h-4 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد من حذف هذا الموضوع؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            سيتم حذف الموضوع "{post.title}" نهائياً ولا يمكن التراجع عن هذا الإجراء.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleDeletePost}
                                        >
                                            حذف
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (viewMode === 'grid') {
        return (
            <Card key={post.id} className="card-hover h-full">
                <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={selectedPosts.includes(post.id)}
                                onCheckedChange={() => toggleSelectPost(post.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`تحديد ${post.title}`}
                            />
                            <TextImage text={post.title} size="md" variant="gradient" />
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleFavorite(post.id)}
                            >
                                <Star className={`w-4 h-4 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد من حذف هذا الموضوع؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            سيتم حذف الموضوع "{post.title}" نهائياً ولا يمكن التراجع عن هذا الإجراء.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleDeletePost}
                                        >
                                            حذف
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                        {category && (
                            <Badge variant="secondary" className="text-xs">
                                {language === 'ar' ? category.nameAr : category.nameEn}
                            </Badge>
                        )}
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs",
                                post.status === 'published' ? 'status-published' : post.status === 'draft' ? 'status-draft' : 'status-archived'
                            )}
                        >
                            {t(`posts.status${post.status.charAt(0).toUpperCase() + post.status.slice(1)}`)}
                        </Badge>
                    </div>

                    <Link to={`/posts/${post.id}`}>
                        <h3
                            className="text-lg font-semibold hover:text-accent transition-colors line-clamp-2 mb-2"
                            dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                        >
                            {post.title}
                        </h3>
                    </Link>

                    <p
                        className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1"
                        dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}
                    >
                        {post.summary}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                        {postLangs.slice(0, 2).map((lang: any) => lang && (
                            <Badge
                                key={lang.id}
                                variant="outline"
                                className="text-xs"
                                style={{ borderColor: lang.color, color: lang.color }}
                            >
                                {lang.name}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.createdAt), 'PP', { locale: language === 'ar' ? ar : enUS })}
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Default list view
    return (
        <Card key={post.id} className="card-hover">
            <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1 min-w-0">
                        <Checkbox
                            checked={selectedPosts.includes(post.id)}
                            onCheckedChange={() => toggleSelectPost(post.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`تحديد ${post.title}`}
                            className="mt-1"
                        />
                        <TextImage text={post.title} size="md" variant="gradient" className="hidden sm:flex" />
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                {category && (
                                    <Badge variant="secondary">
                                        {language === 'ar' ? category.nameAr : category.nameEn}
                                    </Badge>
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
                                {postLangs.map((lang: any) => lang && (
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
                                {postTags.slice(0, 3).map((tag: any) => tag && (
                                    <Link key={tag.id} to={`/tags/${tag.slug}`}>
                                        <Badge variant="outline" className="text-xs">
                                            <Tag className="w-3 h-3 me-1" />
                                            {tag.name}
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
                    </div>

                    <div className="flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(post.id)}
                        >
                            <Star className={`w-5 h-5 ${post.isFavorite ? 'fill-accent text-accent' : ''}`} />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من حذف هذا الموضوع؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        سيتم حذف الموضوع "{post.title}" نهائياً ولا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        onClick={handleDeletePost}
                                    >
                                        حذف
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
