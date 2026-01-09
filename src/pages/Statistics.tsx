import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Eye,
  MessageSquare,
  Star,
  Code,
  Tag,
  TrendingUp,
  BarChart3,
  Map,
  CheckCircle2,
  Circle,
} from 'lucide-react';

const Statistics = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const {
    posts,
    categories,
    tags,
    programmingLanguages,
    snippets,
    collections,
    comments,
    getCategoryById,
    getLanguageById,
    getTagById,
  } = useBlogStore();

  const { roadmaps, roadmapSections, getRoadmapProgress } = useRoadmapStore();

  // Calculate statistics
  const totalViews = posts.reduce((sum, p) => sum + p.viewsCount, 0);
  const favoritesCount = posts.filter(p => p.isFavorite).length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  // Posts by programming language
  const postsByLanguage = programmingLanguages.map(lang => ({
    ...lang,
    count: posts.filter(p => p.programmingLanguages.includes(lang.id)).length,
  })).sort((a, b) => b.count - a.count);

  // Top tags
  const tagCounts = tags.map(tag => ({
    ...tag,
    count: posts.filter(p => p.tags.includes(tag.id)).length,
  })).sort((a, b) => b.count - a.count);

  // Most viewed posts
  const mostViewed = [...posts].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5);

  // Posts by category
  const postsByCategory = categories.map(cat => ({
    ...cat,
    count: posts.filter(p => p.categoryId === cat.id).length,
  })).sort((a, b) => b.count - a.count);

  // Roadmap statistics
  const roadmapStats = roadmaps.map(roadmap => {
    const progress = getRoadmapProgress(roadmap.id);
    const lang = programmingLanguages.find(l => l.id === roadmap.languageId);
    return {
      ...roadmap,
      progress,
      languageName: lang?.name || 'غير محدد',
      languageColor: lang?.color || '#6b7280',
    };
  }).sort((a, b) => b.progress.percentage - a.progress.percentage);

  // Total roadmap progress
  const totalTopics = roadmapSections.reduce((sum, s) => sum + s.topics.length, 0);
  const completedTopics = roadmapSections.reduce((sum, s) => sum + s.topics.filter(t => t.completed).length, 0);
  const overallRoadmapProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const stats = [
    { label: t('statistics.totalPosts'), value: posts.length, icon: FileText, color: 'text-blue-500' },
    { label: t('statistics.totalViews'), value: totalViews.toLocaleString(), icon: Eye, color: 'text-green-500' },
    { label: t('statistics.totalComments'), value: comments.length, icon: MessageSquare, color: 'text-purple-500' },
    { label: t('nav.favorites'), value: favoritesCount, icon: Star, color: 'text-yellow-500' },
    { label: t('nav.snippets'), value: snippets.length, icon: Code, color: 'text-orange-500' },
    { label: t('nav.collections'), value: collections.length, icon: TrendingUp, color: 'text-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('statistics.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('statistics.subtitle')}</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Roadmap Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-accent" />
            {language === 'ar' ? 'تقدم خرائط الطريق' : 'Roadmap Progress'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-medium">
                    {language === 'ar' ? 'التقدم الإجمالي' : 'Overall Progress'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {completedTopics}/{totalTopics} {language === 'ar' ? 'موضوع' : 'topics'}
                  </span>
                  <Badge variant={overallRoadmapProgress >= 75 ? 'default' : overallRoadmapProgress >= 50 ? 'secondary' : 'outline'}>
                    {overallRoadmapProgress}%
                  </Badge>
                </div>
              </div>
              <Progress value={overallRoadmapProgress} className="h-3" />
            </div>

            {/* Individual Roadmaps */}
            {roadmapStats.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {roadmapStats.map((roadmap) => (
                  <div key={roadmap.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: roadmap.languageColor }}
                      />
                      <span className="font-medium truncate">{roadmap.title}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {roadmap.languageName}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {roadmap.progress.percentage === 100 ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground">
                            {roadmap.progress.completed}/{roadmap.progress.total}
                          </span>
                        </div>
                        <span className={`font-medium ${
                          roadmap.progress.percentage >= 75 ? 'text-green-500' :
                          roadmap.progress.percentage >= 50 ? 'text-yellow-500' :
                          'text-muted-foreground'
                        }`}>
                          {roadmap.progress.percentage}%
                        </span>
                      </div>
                      <Progress 
                        value={roadmap.progress.percentage} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {language === 'ar' ? 'لا توجد خرائط طريق بعد' : 'No roadmaps yet'}
              </p>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{roadmaps.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'خرائط الطريق' : 'Roadmaps'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{roadmapSections.length}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'الأقسام' : 'Sections'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{completedTopics}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مكتمل' : 'Completed'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              {t('statistics.postStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  {t('posts.statusPublished')}
                </span>
                <span className="font-bold">{publishedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  {t('posts.statusDraft')}
                </span>
                <span className="font-bold">{draftCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  {t('posts.statusArchived')}
                </span>
                <span className="font-bold">{posts.length - publishedCount - draftCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Viewed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              {t('statistics.mostViewed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostViewed.map((post, i) => (
                <div key={post.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-muted-foreground text-sm">{i + 1}.</span>
                    <span className="truncate text-sm">{post.title}</span>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <Eye className="w-3 h-3 me-1" />
                    {post.viewsCount}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts by Programming Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-accent" />
            {t('statistics.postsByLanguage')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {postsByLanguage.filter(l => l.count > 0).map((lang) => (
              <div 
                key={lang.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: lang.color }}
                  />
                  <span className="font-medium">{lang.name}</span>
                </div>
                <Badge variant="secondary">{lang.count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            {t('statistics.topTags')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {tagCounts.filter(t => t.count > 0).map((tag) => (
              <Badge 
                key={tag.id} 
                variant="outline" 
                className="text-sm py-1.5 px-3"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
                <span className="ms-2 opacity-70">({tag.count})</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Posts by Category */}
      <Card>
        <CardHeader>
          <CardTitle>{t('statistics.postsByCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {postsByCategory.map((cat) => {
              const percentage = posts.length > 0 ? (cat.count / posts.length) * 100 : 0;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{language === 'ar' ? cat.nameAr : cat.nameEn}</span>
                    <span className="text-muted-foreground">{cat.count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;
