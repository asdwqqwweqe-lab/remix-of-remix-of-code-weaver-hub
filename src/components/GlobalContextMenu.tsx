import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Home,
  FileText,
  FolderOpen,
  Tag,
  Code,
  BookOpen,
  Star,
  BarChart3,
  Plus,
  Sun,
  Moon,
  Monitor,
  Languages,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface GlobalContextMenuProps {
  children: ReactNode;
}

const GlobalContextMenu = ({ children }: GlobalContextMenuProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const handleBack = () => window.history.back();
  const handleForward = () => window.history.forward();
  const handleRefresh = () => window.location.reload();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="contents">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Navigation */}
        <ContextMenuItem onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 me-2" />
          {t('common.back')}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleForward}>
          <ArrowRight className="w-4 h-4 me-2" />
          {t('common.next')}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleRefresh}>
          <RotateCcw className="w-4 h-4 me-2" />
          {t('contextMenu.refresh')}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Quick Navigation */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Home className="w-4 h-4 me-2" />
            {t('contextMenu.goTo')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => navigate('/')}>
              <Home className="w-4 h-4 me-2" />
              {t('nav.home')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/posts')}>
              <FileText className="w-4 h-4 me-2" />
              {t('nav.posts')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/categories')}>
              <FolderOpen className="w-4 h-4 me-2" />
              {t('nav.categories')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/tags')}>
              <Tag className="w-4 h-4 me-2" />
              {t('nav.tags')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/languages')}>
              <Code className="w-4 h-4 me-2" />
              {t('nav.languages')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/snippets')}>
              <Code className="w-4 h-4 me-2" />
              {t('nav.snippets')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/collections')}>
              <BookOpen className="w-4 h-4 me-2" />
              {t('nav.collections')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/favorites')}>
              <Star className="w-4 h-4 me-2" />
              {t('nav.favorites')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/statistics')}>
              <BarChart3 className="w-4 h-4 me-2" />
              {t('nav.statistics')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Quick Actions */}
        <ContextMenuItem onClick={() => navigate('/posts/new')}>
          <Plus className="w-4 h-4 me-2" />
          {t('nav.newPost')}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Theme */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 me-2" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 me-2" />
            ) : (
              <Monitor className="w-4 h-4 me-2" />
            )}
            {t('settings.theme')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuItem onClick={() => setTheme('light')}>
              <Sun className="w-4 h-4 me-2" />
              {t('settings.light')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setTheme('dark')}>
              <Moon className="w-4 h-4 me-2" />
              {t('settings.dark')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setTheme('system')}>
              <Monitor className="w-4 h-4 me-2" />
              {t('settings.system')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Language */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Languages className="w-4 h-4 me-2" />
            {t('settings.language')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            <ContextMenuItem onClick={() => setLanguage('ar')}>
              العربية
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setLanguage('en')}>
              English
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default GlobalContextMenu;
