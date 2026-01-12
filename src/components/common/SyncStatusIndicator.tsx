import { useSyncStatus } from '@/components/settings/FirebaseAutoSyncProvider';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function SyncStatusIndicator() {
  const { autoSyncEnabled, lastSyncTime, isSyncing } = useSyncStatus();
  const { language } = useLanguage();

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tooltipText = !autoSyncEnabled
    ? (language === 'ar' ? 'المزامنة التلقائية معطلة' : 'Auto-sync disabled')
    : isSyncing
      ? (language === 'ar' ? 'جاري المزامنة...' : 'Syncing...')
      : lastSyncTime
        ? (language === 'ar' ? `آخر مزامنة: ${formatTime(lastSyncTime)}` : `Last sync: ${formatTime(lastSyncTime)}`)
        : (language === 'ar' ? 'لم تتم المزامنة بعد' : 'Not synced yet');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-sm">
            {!autoSyncEnabled ? (
              <CloudOff className="w-4 h-4 text-gray-400" />
            ) : isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : lastSyncTime ? (
              <Cloud className="w-4 h-4 text-green-500" />
            ) : (
              <CloudOff className="w-4 h-4" />
            )}
            {lastSyncTime && !isSyncing && autoSyncEnabled && (
              <span className="hidden sm:inline text-xs">
                {formatTime(lastSyncTime)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
