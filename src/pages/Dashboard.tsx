import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Eye, 
  FileText, 
  Map, 
  Clock, 
  Activity,
  BookOpen,
  Target,
  Calendar,
  ArrowRight,
  Star
} from 'lucide-react';

export default function Dashboard() {
  const { language } = useLanguage();
  const { posts, categories, tags } = useBlogStore();
  const { roadmaps, roadmapSections } = useRoadmapStore();

  // Calculate roadmap progress
  const roadmapsProgress = useMemo(() => {
    return roadmaps.map(roadmap => {
      const roadmapSects = roadmapSections.filter(s => s.roadmapId === roadmap.id);
      const totalTopics = roadmapSects.reduce((sum, s) => sum + s.topics.length, 0);
      const completedTopics = roadmapSects.reduce((sum, s) => 
        sum + s.topics.filter(t => t.completed).length, 0
      );
      const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      
      return {
        ...roadmap,
        totalTopics,
        completedTopics,
        percentage
      };
    });
  }, [roadmaps, roadmapSections]);

  // Get recent activity (last 10 posts sorted by updatedAt)
  const recentActivity = useMemo(() => {
    return [...posts]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(post => ({
        ...post,
        categoryName: categories.find(c => c.id === post.categoryId)?.[language === 'ar' ? 'nameAr' : 'nameEn'] || 'غير مصنف'
      }));
  }, [posts, categories, language]);

  // Get most viewed posts
  const mostViewed = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 10)
      .map(post => ({
        ...post,
        categoryName: categories.find(c => c.id === post.categoryId)?.[language === 'ar' ? 'nameAr' : 'nameEn'] || 'غير مصنف'
      }));
  }, [posts, categories, language]);

  // Get favorite posts
  const favoritePosts = useMemo(() => {
    return posts.filter(p => p.isFavorite).slice(0, 5);
  }, [posts]);

  // Statistics
  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const draftPosts = posts.filter(p => p.status === 'draft').length;
    const totalViews = posts.reduce((sum, p) => sum + p.viewsCount, 0);
    const avgProgress = roadmapsProgress.length > 0 
      ? Math.round(roadmapsProgress.reduce((sum, r) => sum + r.percentage, 0) / roadmapsProgress.length)
      : 0;

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalCategories: categories.length,
      totalTags: tags.length,
      totalRoadmaps: roadmaps.length,
      avgProgress
    };
  }, [posts, categories, tags, roadmaps, roadmapsProgress]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'نظرة شاملة على تقدمك ونشاطاتك' : 'Overview of your progress and activities'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي المقالات' : 'Total Posts'}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} {language === 'ar' ? 'منشور' : 'published'} · {stats.draftPosts} {language === 'ar' ? 'مسودة' : 'draft'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'عبر جميع المقالات' : 'across all posts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'خرائط الطريق' : 'Roadmaps'}
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoadmaps}</div>
            <p className="text-xs text-muted-foreground">
              {stats.avgProgress}% {language === 'ar' ? 'متوسط التقدم' : 'average progress'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'التصنيفات والوسوم' : 'Categories & Tags'}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories + stats.totalTags}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCategories} {language === 'ar' ? 'تصنيف' : 'categories'} · {stats.totalTags} {language === 'ar' ? 'وسم' : 'tags'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roadmap Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'تقدم خرائط الطريق' : 'Roadmap Progress'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'نسبة إنجازك في كل خريطة' : 'Your completion rate for each roadmap'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roadmapsProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{language === 'ar' ? 'لا توجد خرائط طريق بعد' : 'No roadmaps yet'}</p>
                <Button asChild variant="outline" className="mt-4" size="sm">
                  <Link to="/roadmap">
                    {language === 'ar' ? 'إنشاء خريطة طريق' : 'Create Roadmap'}
                  </Link>
                </Button>
              </div>
            ) : (
              roadmapsProgress.slice(0, 5).map((roadmap) => (
                <div key={roadmap.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Link 
                      to="/roadmap" 
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                    >
                      {roadmap.title}
                    </Link>
                    <Badge variant="outline">{roadmap.percentage}%</Badge>
                  </div>
                  <Progress value={roadmap.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {roadmap.completedTopics} / {roadmap.totalTopics} {language === 'ar' ? 'موضوع مكتمل' : 'topics completed'}
                  </p>
                </div>
              ))
            )}
            {roadmapsProgress.length > 5 && (
              <Button asChild variant="ghost" className="w-full" size="sm">
                <Link to="/roadmap">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ArrowRight className="h-4 w-4 mr-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'آخر النشاطات' : 'Recent Activity'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' ? 'آخر المقالات المحدثة' : 'Recently updated posts'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{language === 'ar' ? 'لا توجد مقالات بعد' : 'No posts yet'}</p>
                <Button asChild variant="outline" className="mt-4" size="sm">
                  <Link to="/posts/new">
                    {language === 'ar' ? 'إنشاء مقال' : 'Create Post'}
                  </Link>
                </Button>
              </div>
            ) : (
              recentActivity.map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {post.categoryName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.updatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Viewed Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'الأكثر مشاهدة' : 'Most Viewed'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'المقالات الأكثر مشاهدة' : 'Top viewed posts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mostViewed.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد مشاهدات بعد' : 'No views yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mostViewed.map((post, index) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{post.categoryName}</Badge>
                      {post.isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">{post.viewsCount.toLocaleString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
