import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export default function InstallPrompt() {
  const { language } = useLanguage();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    // Skip inside Lovable preview iframe
    if (window.self !== window.top) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      localStorage.setItem(DISMISSED_KEY, '1');
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!evt) return;
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === 'dismissed') localStorage.setItem(DISMISSED_KEY, '1');
    } catch { /* noop */ }
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const isAr = language === 'ar';

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:end-4 md:w-96 z-[80] animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {isAr ? 'ثبّت التطبيق' : 'Install this app'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr
              ? 'أضف اختصاراً إلى شاشتك الرئيسية وشغّل التطبيق كنافذة مستقلة.'
              : 'Add a shortcut to your home screen and launch it in its own window.'}
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={install} className="flex-1">
              <Download className="w-4 h-4 me-1" />
              {isAr ? 'تثبيت' : 'Install'}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              {isAr ? 'لاحقاً' : 'Later'}
            </Button>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={dismiss} className="h-6 w-6 -mt-1 -me-1">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
