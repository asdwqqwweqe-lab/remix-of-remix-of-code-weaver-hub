import { Database, Cloud } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettingsStore } from '@/store/settingsStore';
import { isFirebaseConfigured } from '@/lib/firebase-service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export default function StorageTypeIndicator() {
  const { language } = useLanguage();
  const firebaseAutoSync = useSettingsStore((state) => state.settings.firebaseAutoSync);
  
  // Determine storage type
  const isUsingFirebase = firebaseAutoSync && isFirebaseConfigured();
  const storageType = isUsingFirebase ? 'firebase' : 'local';
  
  const storageInfo = {
    firebase: {
      icon: Cloud,
      label: language === 'ar' ? 'التخزين السحابي (Firebase)' : 'Cloud Storage (Firebase)',
      description: language === 'ar' 
        ? 'البيانات محفوظة في قاعدة بيانات Firebase السحابية'
        : 'Data is stored in Firebase cloud database',
      color: 'text-blue-500',
    },
    local: {
      icon: Database,
      label: language === 'ar' ? 'التخزين المحلي' : 'Local Storage',
      description: language === 'ar'
        ? 'البيانات محفوظة محلياً في متصفحك'
        : 'Data is stored locally in your browser',
      color: 'text-green-500',
    },
  };

  const currentStorage = storageInfo[storageType];
  const StorageIcon = currentStorage.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            title={currentStorage.label}
          >
            <StorageIcon className={`w-5 h-5 ${currentStorage.color}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-center">
            <p className="font-semibold">{currentStorage.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStorage.description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
