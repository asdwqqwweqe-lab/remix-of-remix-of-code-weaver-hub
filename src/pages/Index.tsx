import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Code, Tag, FolderOpen, Star, BarChart3, Plus, Eye } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { posts, programmingLanguages, categories, getCategoryById, getLanguageById, getTagById } = useBlogStore();

  const stats = [
    { label: t('statistics.totalPosts'), value: posts.length, icon: FileText, href: '/posts' },
    { label: t('statistics.totalViews'), value: posts.reduce((s, p) => s + p.viewsCount, 0), icon: BarChart3, href: '/statistics' },
    { label: t('nav.snippets'), value: useBlogStore.getState().snippets.length, icon: Code, href: '/snippets' },
    { label: t('nav.favorites'), value: posts.filter(p => p.isFavorite).length, icon: Star, href: '/favorites' },
  ];

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-hero text-primary-foreground rounded-2xl p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-lg opacity-90 mb-6 max-w-2xl">{t('hero.subtitle')}</p>
        <div className="flex gap-3">
          <Link to="/posts">
            <Button size="lg" variant="secondary">{t('hero.exploreButton')}</Button>
          </Link>
          <Link to="/posts/new">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              {t('hero.createButton')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={i} to={stat.href}>
            <Card className="card-hover">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{t('posts.title')}</h2>
            <Link to="/posts"><Button variant="ghost">{t('common.viewAll')}</Button></Link>
          </div>
          {recentPosts.map((post) => {
            const category = getCategoryById(post.categoryId || '');
            return (
              <Link key={post.id} to={`/posts/${post.id}`}>
                <Card className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {category && <Badge variant="secondary">{language === 'ar' ? category.nameAr : category.nameEn}</Badge>}
                      <Badge variant="outline">{post.mainLanguage === 'ar' ? 'عربي' : 'EN'}</Badge>
                    </div>
                    <h3 className="font-semibold hover:text-accent transition-colors" dir={post.mainLanguage === 'ar' ? 'rtl' : 'ltr'}>{post.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" /> {post.viewsCount}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Code className="w-5 h-5 text-accent" />{t('programmingLanguages.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {programmingLanguages.slice(0, 6).map((lang) => (
                <Link key={lang.id} to={`/languages/${lang.slug}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }} />
                    <span>{lang.name}</span>
                  </div>
                  <Badge variant="secondary">{posts.filter(p => p.programmingLanguages.includes(lang.id)).length}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FolderOpen className="w-5 h-5 text-accent" />{t('categories.title')}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/categories/${cat.slug}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default Index;
