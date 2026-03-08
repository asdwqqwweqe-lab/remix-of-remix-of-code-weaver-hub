import { useState, useMemo, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, CheckCheck, Trash2, Info, Award, MessageSquare, Map, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppNotification {
  id: string;
  type: 'info' | 'achievement' | 'comment' | 'roadmap' | 'todo';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (n) => set((state) => ({
        notifications: [{
          ...n,
          id: crypto.randomUUID(),
          read: false,
          createdAt: new Date().toISOString(),
        }, ...state.notifications].slice(0, 50),
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'app-notifications' }
  )
);

export default function NotificationBell() {
  const { language } = useLanguage();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Award className="w-4 h-4 text-chart-3" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'roadmap': return <Map className="w-4 h-4 text-chart-2" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === 'ar' ? 'الآن' : 'now';
    if (mins < 60) return `${mins}${language === 'ar' ? 'د' : 'm'}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${language === 'ar' ? 'س' : 'h'}`;
    const days = Math.floor(hours / 24);
    return `${days}${language === 'ar' ? 'ي' : 'd'}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
                <CheckCheck className="w-3 h-3 me-1" />
                {language === 'ar' ? 'قراءة الكل' : 'Read all'}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-7 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[350px]">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    "w-full text-start px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <span className="text-xs text-muted-foreground/70 mt-1">{formatTime(n.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
