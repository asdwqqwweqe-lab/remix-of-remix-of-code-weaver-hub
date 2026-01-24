import { useState, useEffect } from 'react';
import { Settings, RotateCcw, Save, Copy, Check, Upload, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// Default settings structure
const DEFAULT_SETTINGS = {
  // Display settings
  fontSize: 16,
  lineHeight: 1.6,
  paragraphSpacing: 1.5,
  codeFontSize: 14,
  codeLineHeight: 1.4,
  
  // Editor settings
  autoSave: true,
  autoSaveInterval: 30, // seconds
  showWordCount: true,
  showReadingTime: true,
  spellCheck: true,
  
  // UI settings
  compactMode: false,
  showSidebar: true,
  sidebarWidth: 280,
  animationsEnabled: true,
  
  // AI settings
  aiMaxTokens: 2048,
  aiTemperature: 0.7,
  aiStreamingEnabled: true,
  
  // Notification settings
  showSuccessNotifications: true,
  showErrorNotifications: true,
  notificationDuration: 3000, // ms
};

type BaseSettings = typeof DEFAULT_SETTINGS;

const STORAGE_KEY = 'app-base-settings';
const PRESETS_STORAGE_KEY = 'app-settings-presets';

interface SettingsPreset {
  id: string;
  name: string;
  description?: string;
  settings: BaseSettings;
  createdAt: Date;
}

export default function BaseSettingsManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BaseSettings>(DEFAULT_SETTINGS);
  const [presets, setPresets] = useState<SettingsPreset[]>([]);
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }

    const storedPresets = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (storedPresets) {
      try {
        setPresets(JSON.parse(storedPresets));
      } catch (e) {
        console.error('Failed to parse presets:', e);
      }
    }
  }, []);

  // Save settings on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save presets on change
  useEffect(() => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const updateSetting = <K extends keyof BaseSettings>(key: K, value: BaseSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    toast({
      title: 'تم الاستعادة',
      description: 'تم استعادة الإعدادات الافتراضية',
    });
  };

  const saveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم للإعداد المسبق',
        variant: 'destructive',
      });
      return;
    }

    const newPreset: SettingsPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || undefined,
      settings: { ...settings },
      createdAt: new Date(),
    };

    setPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setIsPresetDialogOpen(false);
    
    toast({
      title: 'تم الحفظ',
      description: `تم حفظ الإعداد المسبق "${newPreset.name}"`,
    });
  };

  const loadPreset = (preset: SettingsPreset) => {
    setSettings({ ...DEFAULT_SETTINGS, ...preset.settings });
    toast({
      title: 'تم التحميل',
      description: `تم تحميل الإعداد المسبق "${preset.name}"`,
    });
  };

  const deletePreset = (presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
    toast({
      title: 'تم الحذف',
      description: 'تم حذف الإعداد المسبق',
    });
  };

  const exportSettings = () => {
    const data = {
      settings,
      presets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-settings-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'تم التصدير',
      description: 'تم تصدير الإعدادات بنجاح',
    });
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(prev => [...prev, ...data.presets]);
        }
        toast({
          title: 'تم الاستيراد',
          description: 'تم استيراد الإعدادات بنجاح',
        });
      } catch (e) {
        toast({
          title: 'خطأ',
          description: 'فشل في قراءة ملف الإعدادات',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const copySettingsJson = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ الإعدادات كـ JSON',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              إعدادات التطبيق الأساسية
            </CardTitle>
            <CardDescription>
              تخصيص إعدادات العرض والمحرر والذكاء الاصطناعي مع الحفاظ على الإعدادات الافتراضية
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 ml-2" />
              استعادة الافتراضي
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="display">العرض</TabsTrigger>
            <TabsTrigger value="editor">المحرر</TabsTrigger>
            <TabsTrigger value="ui">الواجهة</TabsTrigger>
            <TabsTrigger value="ai">الذكاء الاصطناعي</TabsTrigger>
            <TabsTrigger value="presets">الإعدادات المحفوظة</TabsTrigger>
          </TabsList>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>حجم الخط</Label>
                    <span className="text-sm text-muted-foreground">{settings.fontSize}px</span>
                  </div>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([v]) => updateSetting('fontSize', v)}
                    min={12}
                    max={24}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>ارتفاع السطر</Label>
                    <span className="text-sm text-muted-foreground">{settings.lineHeight}</span>
                  </div>
                  <Slider
                    value={[settings.lineHeight]}
                    onValueChange={([v]) => updateSetting('lineHeight', v)}
                    min={1}
                    max={2.5}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>المسافة بين الفقرات</Label>
                    <span className="text-sm text-muted-foreground">{settings.paragraphSpacing}rem</span>
                  </div>
                  <Slider
                    value={[settings.paragraphSpacing]}
                    onValueChange={([v]) => updateSetting('paragraphSpacing', v)}
                    min={0.5}
                    max={3}
                    step={0.25}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>حجم خط الكود</Label>
                    <span className="text-sm text-muted-foreground">{settings.codeFontSize}px</span>
                  </div>
                  <Slider
                    value={[settings.codeFontSize]}
                    onValueChange={([v]) => updateSetting('codeFontSize', v)}
                    min={10}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>ارتفاع سطر الكود</Label>
                    <span className="text-sm text-muted-foreground">{settings.codeLineHeight}</span>
                  </div>
                  <Slider
                    value={[settings.codeLineHeight]}
                    onValueChange={([v]) => updateSetting('codeLineHeight', v)}
                    min={1}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Editor Settings */}
          <TabsContent value="editor" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>الحفظ التلقائي</Label>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(v) => updateSetting('autoSave', v)}
                  />
                </div>

                {settings.autoSave && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>فترة الحفظ التلقائي</Label>
                      <span className="text-sm text-muted-foreground">{settings.autoSaveInterval} ثانية</span>
                    </div>
                    <Slider
                      value={[settings.autoSaveInterval]}
                      onValueChange={([v]) => updateSetting('autoSaveInterval', v)}
                      min={10}
                      max={120}
                      step={5}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>عرض عدد الكلمات</Label>
                  <Switch
                    checked={settings.showWordCount}
                    onCheckedChange={(v) => updateSetting('showWordCount', v)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>عرض وقت القراءة</Label>
                  <Switch
                    checked={settings.showReadingTime}
                    onCheckedChange={(v) => updateSetting('showReadingTime', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>التدقيق الإملائي</Label>
                  <Switch
                    checked={settings.spellCheck}
                    onCheckedChange={(v) => updateSetting('spellCheck', v)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* UI Settings */}
          <TabsContent value="ui" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>الوضع المضغوط</Label>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(v) => updateSetting('compactMode', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>إظهار الشريط الجانبي</Label>
                  <Switch
                    checked={settings.showSidebar}
                    onCheckedChange={(v) => updateSetting('showSidebar', v)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>عرض الشريط الجانبي</Label>
                    <span className="text-sm text-muted-foreground">{settings.sidebarWidth}px</span>
                  </div>
                  <Slider
                    value={[settings.sidebarWidth]}
                    onValueChange={([v]) => updateSetting('sidebarWidth', v)}
                    min={200}
                    max={400}
                    step={10}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>تفعيل الرسوم المتحركة</Label>
                  <Switch
                    checked={settings.animationsEnabled}
                    onCheckedChange={(v) => updateSetting('animationsEnabled', v)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>الحد الأقصى للتوكنات</Label>
                    <span className="text-sm text-muted-foreground">{settings.aiMaxTokens}</span>
                  </div>
                  <Slider
                    value={[settings.aiMaxTokens]}
                    onValueChange={([v]) => updateSetting('aiMaxTokens', v)}
                    min={256}
                    max={8192}
                    step={256}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>درجة الحرارة (الإبداعية)</Label>
                    <span className="text-sm text-muted-foreground">{settings.aiTemperature}</span>
                  </div>
                  <Slider
                    value={[settings.aiTemperature]}
                    onValueChange={([v]) => updateSetting('aiTemperature', v)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>تفعيل البث المباشر للردود</Label>
                  <Switch
                    checked={settings.aiStreamingEnabled}
                    onCheckedChange={(v) => updateSetting('aiStreamingEnabled', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>إشعارات النجاح</Label>
                  <Switch
                    checked={settings.showSuccessNotifications}
                    onCheckedChange={(v) => updateSetting('showSuccessNotifications', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>إشعارات الأخطاء</Label>
                  <Switch
                    checked={settings.showErrorNotifications}
                    onCheckedChange={(v) => updateSetting('showErrorNotifications', v)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Save className="h-4 w-4 ml-2" />
                    حفظ الإعدادات الحالية
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>حفظ إعداد مسبق جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>اسم الإعداد</Label>
                      <Input
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="مثال: إعدادات القراءة"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الوصف (اختياري)</Label>
                      <Textarea
                        value={newPresetDescription}
                        onChange={(e) => setNewPresetDescription(e.target.value)}
                        placeholder="وصف موجز للإعدادات..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={saveAsPreset}>
                      حفظ
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={exportSettings}>
                <Download className="h-4 w-4 ml-2" />
                تصدير الإعدادات
              </Button>

              <label>
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 ml-2" />
                    استيراد الإعدادات
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importSettings}
                />
              </label>

              <Button variant="outline" onClick={copySettingsJson}>
                {copiedField === 'all' ? (
                  <Check className="h-4 w-4 ml-2" />
                ) : (
                  <Copy className="h-4 w-4 ml-2" />
                )}
                نسخ كـ JSON
              </Button>
            </div>

            {presets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد إعدادات محفوظة بعد</p>
                <p className="text-sm">احفظ إعداداتك الحالية للوصول إليها لاحقاً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 border rounded-lg bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{preset.name}</h4>
                        {preset.description && (
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                        )}
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {new Date(preset.createdAt).toLocaleDateString('ar-SA')}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadPreset(preset)}
                        >
                          تحميل
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deletePreset(preset.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}