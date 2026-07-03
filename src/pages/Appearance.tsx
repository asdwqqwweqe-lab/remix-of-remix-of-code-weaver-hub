import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, Monitor, Palette, Type, Sparkles, RotateCcw, Languages, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface UIPrefs {
  accent: string;         // HSL "H S% L%"
  radius: number;         // rem × 0.25
  fontScale: number;      // percent
  density: 'compact' | 'comfortable' | 'spacious';
  reducedMotion: boolean;
  highContrast: boolean;
  sidebarDefault: 'expanded' | 'collapsed';
}

const PREFS_KEY = 'ui-prefs-v1';

const ACCENT_PRESETS: { name: string; hsl: string; hex: string }[] = [
  { name: 'Teal',    hsl: '173 80% 40%', hex: '#14b8a6' },
  { name: 'Coral',   hsl: '11 92% 65%',  hex: '#f87171' },
  { name: 'Violet',  hsl: '262 83% 58%', hex: '#8b5cf6' },
  { name: 'Amber',   hsl: '38 92% 50%',  hex: '#f59e0b' },
  { name: 'Blue',    hsl: '217 91% 60%', hex: '#3b82f6' },
  { name: 'Emerald', hsl: '158 64% 42%', hex: '#10b981' },
  { name: 'Pink',    hsl: '330 81% 60%', hex: '#ec4899' },
  { name: 'Slate',   hsl: '215 20% 40%', hex: '#64748b' },
];

const DEFAULT_PREFS: UIPrefs = {
  accent: '173 80% 40%',
  radius: 8,
  fontScale: 100,
  density: 'comfortable',
  reducedMotion: false,
  highContrast: false,
  sidebarDefault: 'expanded',
};

function loadPrefs(): UIPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function applyUIPrefs(p: UIPrefs) {
  const root = document.documentElement;
  root.style.setProperty('--primary', p.accent);
  root.style.setProperty('--ring', p.accent);
  root.style.setProperty('--radius', `${p.radius / 16}rem`);
  root.style.fontSize = `${p.fontScale}%`;
  root.dataset.density = p.density;
  root.dataset.motion = p.reducedMotion ? 'reduced' : 'full';
  root.dataset.contrast = p.highContrast ? 'high' : 'normal';
}

// Apply on module load (before component mounts) so preferences persist across routes.
applyUIPrefs(loadPrefs());

export default function Appearance() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const [prefs, setPrefs] = useState<UIPrefs>(loadPrefs);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    applyUIPrefs(prefs);
  }, [prefs]);

  const update = <K extends keyof UIPrefs>(k: K, v: UIPrefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  const reset = () => {
    setPrefs(DEFAULT_PREFS);
    toast.success(language === 'ar' ? 'أُعيدت الإعدادات' : 'Preferences reset');
  };

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Sparkles className="w-7 h-7 text-primary" />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('المظهر والتفضيلات', 'Appearance & Preferences')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('خصّص الثيم والألوان وسلوك الواجهة', 'Customize theme, colors, and interface behavior')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="w-4 h-4 me-2" />{t('إعادة تعيين', 'Reset')}
        </Button>
      </div>

      {/* Theme mode */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <h2 className="text-lg font-semibold">{t('وضع الثيم', 'Theme mode')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'light',  icon: Sun,     label: t('فاتح', 'Light') },
            { key: 'dark',   icon: Moon,    label: t('مظلم', 'Dark') },
            { key: 'system', icon: Monitor, label: t('النظام', 'System') },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                ${theme === key ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Accent color */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <h2 className="text-lg font-semibold">{t('اللون الرئيسي', 'Accent color')}</h2>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c.hsl}
              onClick={() => update('accent', c.hsl)}
              className={`aspect-square rounded-lg border-2 transition-all relative
                ${prefs.accent === c.hsl ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ background: c.hex }}
              title={c.name}
              aria-label={c.name}
            >
              {prefs.accent === c.hsl && (
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">✓</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button className="flex-1">{t('زر تجريبي', 'Sample button')}</Button>
          <Button variant="outline" className="flex-1">{t('زر ثانوي', 'Outline')}</Button>
        </div>
      </Card>

      {/* Typography */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5" />
          <h2 className="text-lg font-semibold">{t('حجم الخط', 'Text size')}</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t('مقياس الخط', 'Font scale')}</span>
            <span className="font-mono">{prefs.fontScale}%</span>
          </div>
          <Slider
            min={80}
            max={140}
            step={5}
            value={[prefs.fontScale]}
            onValueChange={([v]) => update('fontScale', v)}
          />
        </div>
      </Card>

      {/* Layout */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('التخطيط والكثافة', 'Layout & density')}</h2>

        <div className="space-y-2">
          <Label>{t('كثافة العناصر', 'Element density')}</Label>
          <Select value={prefs.density} onValueChange={(v) => update('density', v as UIPrefs['density'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">{t('مضغوطة', 'Compact')}</SelectItem>
              <SelectItem value="comfortable">{t('مريحة', 'Comfortable')}</SelectItem>
              <SelectItem value="spacious">{t('واسعة', 'Spacious')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('انحناء الحواف', 'Corner roundness')}</Label>
          <div className="flex items-center gap-3">
            <Slider
              min={0}
              max={20}
              step={1}
              value={[prefs.radius]}
              onValueChange={([v]) => update('radius', v)}
              className="flex-1"
            />
            <span className="font-mono text-sm w-12 text-end">{prefs.radius}px</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('الشريط الجانبي افتراضياً', 'Sidebar default state')}</Label>
          <Select
            value={prefs.sidebarDefault}
            onValueChange={(v) => update('sidebarDefault', v as UIPrefs['sidebarDefault'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expanded">{t('موسّع', 'Expanded')}</SelectItem>
              <SelectItem value="collapsed">{t('مطوي', 'Collapsed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Language */}
      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          <h2 className="text-lg font-semibold">{t('اللغة', 'Language')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage('ar')}
            className={`p-4 rounded-lg border-2 transition-all
              ${language === 'ar' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}
          >
            <div className="text-2xl">🇸🇦</div>
            <div className="text-sm font-medium mt-1">العربية</div>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-lg border-2 transition-all
              ${language === 'en' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}
          >
            <div className="text-2xl">🇬🇧</div>
            <div className="text-sm font-medium mt-1">English</div>
          </button>
        </div>
      </Card>

      {/* Accessibility */}
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t('إمكانية الوصول', 'Accessibility')}</h2>

        <div className="flex items-center justify-between">
          <div>
            <Label>{t('تقليل الحركة', 'Reduce motion')}</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {t('يعطّل الرسوم المتحركة والانتقالات', 'Disables animations and transitions')}
            </p>
          </div>
          <Switch checked={prefs.reducedMotion} onCheckedChange={(v) => update('reducedMotion', v)} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>{t('تباين عالٍ', 'High contrast')}</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {t('يزيد التباين لسهولة القراءة', 'Boosts contrast for readability')}
            </p>
          </div>
          <Switch checked={prefs.highContrast} onCheckedChange={(v) => update('highContrast', v)} />
        </div>
      </Card>

      {/* Notifications */}
      <NotificationsCard t={t} />
    </div>
  );
}

function NotificationsCard({ t }: { t: (ar: string, en: string) => string }) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('notifications-enabled') !== 'false');
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const toggle = async (v: boolean) => {
    setEnabled(v);
    localStorage.setItem('notifications-enabled', String(v));
    if (v && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        const p = await Notification.requestPermission();
        setPermission(p);
        if (p === 'granted') toast.success(t('تم تفعيل الإشعارات', 'Notifications enabled'));
      } catch { /* noop */ }
    }
  };

  const requestPerm = async () => {
    try { const p = await Notification.requestPermission(); setPermission(p); } catch { /* noop */ }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5" />
        <h2 className="text-lg font-semibold">{t('الإشعارات والتذكيرات', 'Notifications & reminders')}</h2>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>{t('تفعيل التذكيرات', 'Enable reminders')}</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {t('تنبيهات للمهام ذات المواعيد وجلسات التركيز', 'Alerts for due tasks and focus sessions')}
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} />
      </div>
      {enabled && permission !== 'granted' && (
        <div className="flex items-center justify-between text-sm p-3 rounded bg-muted/40 border border-border/60">
          <span>
            {permission === 'denied'
              ? t('الأذونات مرفوضة — سنستخدم تنبيهات داخل التطبيق', 'Permission denied — using in-app toasts')
              : t('اسمح للإشعارات في المتصفح', 'Allow browser notifications')}
          </span>
          {permission === 'default' && (
            <Button size="sm" variant="outline" onClick={requestPerm}>
              {t('طلب الإذن', 'Request')}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

