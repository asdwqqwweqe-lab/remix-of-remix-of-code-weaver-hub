import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  FileText, Plus, Home, BarChart3, Kanban, Timer, Network, Zap,
  StickyNote, Mic, Map, Rss, Users2, Sparkles, Settings, BookOpen,
  CheckSquare, Layers, GitBranch, Search as SearchIcon, Newspaper,
} from 'lucide-react';

interface Action {
  id: string;
  label: string;
  keywords?: string;
  icon: any;
  action: () => void;
  group: 'nav' | 'create' | 'action';
}

/**
 * Global command palette. Trigger with Cmd/Ctrl+K.
 * Searches posts + navigation + quick actions in one place.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const posts = useBlogStore((s) => s.posts);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const navActions: Action[] = useMemo(() => [
    { id: 'nav-home', label: isAr ? 'الرئيسية' : 'Home', icon: Home, action: () => go('/'), group: 'nav' },
    { id: 'nav-dashboard', label: isAr ? 'لوحة التحكم' : 'Dashboard', icon: BarChart3, action: () => go('/dashboard'), group: 'nav' },
    { id: 'nav-posts', label: isAr ? 'المقالات' : 'Posts', icon: FileText, action: () => go('/posts'), group: 'nav' },
    { id: 'nav-workshop', label: isAr ? 'ورشة الإنتاجية' : 'Workshop', icon: Zap, action: () => go('/workshop'), group: 'nav' },
    { id: 'nav-kanban', label: 'Kanban', icon: Kanban, action: () => go('/kanban'), group: 'nav' },
    { id: 'nav-pomodoro', label: isAr ? 'مؤقّت التركيز' : 'Focus Timer', icon: Timer, action: () => go('/pomodoro'), group: 'nav' },
    { id: 'nav-tasks', label: isAr ? 'المهام المتقدمة' : 'Advanced Tasks', icon: CheckSquare, action: () => go('/tasks'), group: 'nav' },
    { id: 'nav-mindmap', label: isAr ? 'خريطة ذهنية' : 'Mind Map', icon: GitBranch, action: () => go('/mindmap'), group: 'nav' },
    { id: 'nav-voice', label: isAr ? 'ملاحظات صوتية' : 'Voice Notes', icon: Mic, action: () => go('/voice-notes'), group: 'nav' },
    { id: 'nav-graph', label: isAr ? 'خريطة المعرفة' : 'Knowledge Graph', icon: Network, action: () => go('/graph'), group: 'nav' },
    { id: 'nav-roadmap', label: isAr ? 'خريطة الطريق' : 'Roadmap', icon: Map, action: () => go('/roadmap'), group: 'nav' },
    { id: 'nav-reader', label: isAr ? 'قارئ RSS' : 'RSS Reader', icon: Newspaper, action: () => go('/reader'), group: 'nav' },
    { id: 'nav-feeds', label: isAr ? 'خلاصات RSS' : 'RSS Feeds', icon: Rss, action: () => go('/feeds'), group: 'nav' },
    { id: 'nav-library', label: isAr ? 'المكتبة المشتركة' : 'Shared Library', icon: Users2, action: () => go('/library'), group: 'nav' },
    { id: 'nav-collections', label: isAr ? 'المجموعات' : 'Collections', icon: BookOpen, action: () => go('/collections'), group: 'nav' },
    { id: 'nav-analytics', label: isAr ? 'التحليلات' : 'Analytics', icon: BarChart3, action: () => go('/analytics'), group: 'nav' },
    { id: 'nav-settings', label: isAr ? 'الإعدادات' : 'Settings', icon: Settings, action: () => go('/settings'), group: 'nav' },
  ], [isAr]);

  const createActions: Action[] = useMemo(() => [
    { id: 'create-post', label: isAr ? 'مقال جديد' : 'New Post', icon: Plus, action: () => go('/posts/new'), group: 'create' },
    { id: 'create-report', label: isAr ? 'تقرير جديد' : 'New Report', icon: Plus, action: () => go('/reports/new'), group: 'create' },
    { id: 'create-page', label: isAr ? 'صفحة جديدة' : 'New Page', icon: Layers, action: () => go('/page-builder'), group: 'create' },
  ], [isAr]);

  const actionActions: Action[] = useMemo(() => [
    {
      id: 'act-ai', label: isAr ? 'افتح مساعد AI' : 'Open AI Assistant',
      icon: Sparkles, group: 'action',
      action: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent('ai-assistant:open'));
      },
    },
    {
      id: 'act-quick-note', label: isAr ? 'ملاحظة سريعة' : 'Quick Note',
      icon: StickyNote, group: 'action',
      action: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent('quick-notes:open'));
      },
    },
  ], [isAr]);

  const postResults = useMemo(() => {
    if (!query.trim()) return posts.slice(0, 5);
    const q = query.toLowerCase();
    return posts
      .filter((p) => p.title?.toLowerCase().includes(q) || p.summary?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [posts, query]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={isAr ? 'ابحث أو نفّذ إجراء… (Cmd+K)' : 'Search or run an action… (Cmd+K)'}
      />
      <CommandList>
        <CommandEmpty>{isAr ? 'لا توجد نتائج' : 'No results'}</CommandEmpty>

        {postResults.length > 0 && (
          <CommandGroup heading={isAr ? 'المقالات' : 'Posts'}>
            {postResults.map((p) => (
              <CommandItem
                key={`p-${p.id}`}
                value={`post ${p.title} ${p.summary ?? ''}`}
                onSelect={() => go(`/posts/${p.id}`)}
              >
                <FileText className="me-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{p.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading={isAr ? 'إجراءات سريعة' : 'Quick Actions'}>
          {actionActions.map((a) => (
            <CommandItem key={a.id} value={a.label} onSelect={a.action}>
              <a.icon className="me-2 h-4 w-4" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading={isAr ? 'إنشاء' : 'Create'}>
          {createActions.map((a) => (
            <CommandItem key={a.id} value={a.label} onSelect={a.action}>
              <a.icon className="me-2 h-4 w-4" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading={isAr ? 'التنقّل' : 'Navigate'}>
          {navActions.map((a) => (
            <CommandItem key={a.id} value={a.label} onSelect={a.action}>
              <a.icon className="me-2 h-4 w-4" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
