import { useEffect, useRef, useCallback, useState } from 'react';
import { useBlogStore } from '@/store/blogStore';
import { useReportStore } from '@/store/reportStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useSettingsStore } from '@/store/settingsStore';
import { isFirebaseConfigured, syncToFirebase, getLastSyncTime } from '@/lib/firebase-service';
import { toast } from '@/hooks/use-toast';

// Debounce delay in milliseconds
const SYNC_DELAY = 3000;

// Play notification sound
function playSyncSound(success: boolean) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = success ? 800 : 300;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + (success ? 0.15 : 0.3));
  } catch (e) {
    // Audio not supported
  }
}

/**
 * Hook to automatically sync data to Firebase when changes occur
 */
export function useFirebaseAutoSync() {
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncHashRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const firebaseAutoSync = useSettingsStore((state) => state.settings.firebaseAutoSync);
  const syncNotifications = useSettingsStore((state) => state.settings.syncNotifications);
  const autoSyncEnabled = firebaseAutoSync === true && isFirebaseConfigured();

  // Subscribe to store changes using simple counters/lengths to minimize re-renders
  const postsCount = useBlogStore((state) => state.posts.length);
  const categoriesCount = useBlogStore((state) => state.categories.length);
  const tagsCount = useBlogStore((state) => state.tags.length);
  const snippetsCount = useBlogStore((state) => state.snippets.length);
  const reportsCount = useReportStore((state) => state.reports.length);
  const roadmapsCount = useRoadmapStore((state) => state.roadmaps.length);
  
  // Create a simple version number based on counts
  const dataVersion = `${postsCount}-${categoriesCount}-${tagsCount}-${snippetsCount}-${reportsCount}-${roadmapsCount}`;

  // Load last sync time on mount
  useEffect(() => {
    if (autoSyncEnabled) {
      getLastSyncTime().then(time => {
        if (time) setLastSyncTime(time);
      });
    }
  }, [autoSyncEnabled]);

  const performSync = useCallback(async () => {
    if (!autoSyncEnabled || isSyncing) return;
    
    // Skip if version hasn't changed
    if (dataVersion === lastSyncHashRef.current) return;
    lastSyncHashRef.current = dataVersion;
    
    setIsSyncing(true);
    console.log('[Firebase AutoSync] Syncing data...');
    
    try {
      const result = await syncToFirebase();
      
      if (result.success) {
        console.log('[Firebase AutoSync] Sync completed successfully');
        setLastSyncTime(new Date().toISOString());
        
        if (syncNotifications) {
          playSyncSound(true);
          toast({
            title: '✓ تمت المزامنة',
            description: 'تم حفظ البيانات بنجاح',
            duration: 2000,
          });
        }
      } else {
        console.error('[Firebase AutoSync] Sync failed:', result.message);
        
        if (syncNotifications) {
          playSyncSound(false);
          toast({
            title: '✗ فشل المزامنة',
            description: result.message,
            variant: 'destructive',
            duration: 4000,
          });
        }
      }
    } finally {
      setIsSyncing(false);
    }
  }, [autoSyncEnabled, dataVersion, isSyncing, syncNotifications]);

  useEffect(() => {
    // Skip initial mount to avoid syncing on page load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastSyncHashRef.current = dataVersion;
      return;
    }

    if (!autoSyncEnabled) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new debounced sync
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
    }, SYNC_DELAY);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [dataVersion, autoSyncEnabled, performSync]);

  return { autoSyncEnabled, lastSyncTime, isSyncing };
}

/**
 * Export all data as JSON
 */
export function exportDataAsJson(): string {
  const blogData = localStorage.getItem('blog-storage');
  const reportsData = localStorage.getItem('reports-storage');
  const roadmapData = localStorage.getItem('roadmap-storage');
  const settingsData = localStorage.getItem('blog-settings-storage');

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      blog: blogData ? JSON.parse(blogData) : null,
      reports: reportsData ? JSON.parse(reportsData) : null,
      roadmap: roadmapData ? JSON.parse(roadmapData) : null,
      settings: settingsData ? JSON.parse(settingsData) : null,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import data from JSON
 */
export function importDataFromJson(jsonString: string): { success: boolean; message: string } {
  try {
    const importData = JSON.parse(jsonString);
    
    if (!importData.version || !importData.data) {
      return { success: false, message: 'تنسيق الملف غير صحيح' };
    }

    const { blog, reports, roadmap, settings } = importData.data;

    if (blog) {
      localStorage.setItem('blog-storage', JSON.stringify(blog));
    }
    if (reports) {
      localStorage.setItem('reports-storage', JSON.stringify(reports));
    }
    if (roadmap) {
      localStorage.setItem('roadmap-storage', JSON.stringify(roadmap));
    }
    // Don't import settings to preserve current Firebase config and API keys

    return { success: true, message: 'تم استيراد البيانات بنجاح - أعد تحميل الصفحة' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'خطأ في قراءة الملف' 
    };
  }
}

/**
 * Download data as JSON file
 */
export function downloadDataAsFile() {
  const jsonData = exportDataAsJson();
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `blog-backup-${date}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
