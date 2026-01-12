import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';
import SearchTrigger from '@/components/search/SearchTrigger';
import QuickNotes from '@/components/notes/QuickNotes';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  Moon,
  Sun,
  Globe,
  FileText,
  Code,
  Tag,
  FolderOpen,
  Star,
  BarChart3,
  Plus,
  Home,
  Layers,
  BookOpen,
  Menu,
  X,
  Image,
  PanelLeftClose,
  PanelLeft,
  Map,
  Settings,
  FileText as ReportIcon,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const MainLayout = ({ children }: MainLayoutProps) => {
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });
  
  // Initialize keyboard shortcuts
  const { showShortcutsHelp } = useKeyboardShortcuts();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/posts', icon: FileText, label: t('nav.posts') },
    { path: '/posts/new', icon: Plus, label: t('nav.newPost') },
    { path: '/categories', icon: FolderOpen, label: t('nav.categories') },
    { path: '/tags', icon: Tag, label: t('nav.tags') },
    { path: '/languages', icon: Code, label: t('nav.programmingLanguages') },
    { path: '/roadmap', icon: Map, label: language === 'ar' ? 'خريطة الطريق' : 'Roadmap' },
    { path: '/reports', icon: ReportIcon, label: language === 'ar' ? 'التقارير' : 'Reports' },
    { path: '/snippets', icon: Layers, label: t('nav.snippets') },
    { path: '/collections', icon: BookOpen, label: t('nav.collections') },
    { path: '/gallery', icon: Image, label: language === 'ar' ? 'المعرض' : 'Gallery' },
    { path: '/favorites', icon: Star, label: t('nav.favorites') },
    { path: '/statistics', icon: BarChart3, label: t('nav.statistics') },
    { path: '/settings', icon: Settings, label: language === 'ar' ? 'الإعدادات' : 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-sidebar border-e border-sidebar-border transition-all duration-300 lg:relative lg:translate-x-0",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full",
          isRTL ? "right-0" : "left-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shrink-0">
              <Code className="w-5 h-5 text-accent-foreground" />
            </div>
            {!sidebarCollapsed && <span className="font-bold text-lg">{t('hero.title')}</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className={cn("space-y-1", sidebarCollapsed ? "px-2" : "px-3")}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg transition-colors",
                    sidebarCollapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className={cn("flex items-center", sidebarCollapsed ? "flex-col gap-2" : "gap-2")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className={sidebarCollapsed ? "w-full" : "flex-1"}
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={sidebarCollapsed ? "w-full" : "flex-1"}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 glass border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Desktop sidebar toggle - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
            >
              {sidebarCollapsed ? (
                isRTL ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />
              ) : (
                isRTL ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <SearchTrigger />
            <SyncStatusIndicator />
            <Button
              variant="ghost"
              size="icon"
              onClick={showShortcutsHelp}
              className="hidden lg:flex"
              title={language === 'ar' ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts'}
            >
              <Keyboard className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="hidden lg:flex"
            >
              <Globe className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="hidden lg:flex"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link to="/posts/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.newPost')}</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
        
        {/* Quick Notes */}
        <QuickNotes />
      </div>
    </div>
  );
};

export default MainLayout;
