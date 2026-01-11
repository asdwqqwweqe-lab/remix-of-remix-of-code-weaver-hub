import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Settings2, 
  Type, 
  AlignJustify,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Moon,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DisplaySettingsProps {
  onSettingsChange: (settings: DisplaySettingsValues) => void;
  className?: string;
}

export interface DisplaySettingsValues {
  fontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
  nightMode: boolean;
  codeFontSize: number;
  codeLineHeight: number;
}

const DEFAULT_SETTINGS: DisplaySettingsValues = {
  fontSize: 16,
  lineHeight: 1.75,
  paragraphSpacing: 1.5,
  nightMode: false,
  codeFontSize: 14,
  codeLineHeight: 1.5,
};

const STORAGE_KEY = 'report-display-settings';

const DisplaySettings = ({ onSettingsChange, className }: DisplaySettingsProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [settings, setSettings] = useState<DisplaySettingsValues>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    onSettingsChange(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof DisplaySettingsValues>(
    key: K, 
    value: DisplaySettingsValues[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const adjustSetting = (
    key: 'fontSize' | 'lineHeight' | 'paragraphSpacing' | 'codeFontSize' | 'codeLineHeight',
    delta: number
  ) => {
    setSettings(prev => {
      const current = prev[key] as number;
      let newValue: number;
      if (key === 'fontSize' || key === 'codeFontSize') {
        newValue = Math.min(48, Math.max(10, current + delta));
      } else if (key === 'lineHeight' || key === 'codeLineHeight') {
        newValue = Math.min(4, Math.max(1, current + delta));
      } else {
        newValue = Math.min(5, Math.max(0.5, current + delta));
      }
      return { ...prev, [key]: newValue };
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <Card className={cn("", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 rounded-t-lg transition-colors">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                {language === 'ar' ? 'إعدادات العرض' : 'Display Settings'}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-5 pt-0">
            {/* Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Type className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('fontSize', -2)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', Math.min(48, Math.max(10, Number(e.target.value))))}
                    className="w-16 h-6 text-center text-xs px-1"
                    min={10}
                    max={48}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('fontSize', 2)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting('fontSize', value)}
                min={10}
                max={48}
                step={1}
                className="w-full"
              />
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <AlignJustify className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'ارتفاع السطر' : 'Line Height'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('lineHeight', -0.1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={settings.lineHeight.toFixed(2)}
                    onChange={(e) => updateSetting('lineHeight', Math.min(4, Math.max(1, Number(e.target.value))))}
                    className="w-16 h-6 text-center text-xs px-1"
                    min={1}
                    max={4}
                    step={0.1}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('lineHeight', 0.1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={([value]) => updateSetting('lineHeight', value)}
                min={1}
                max={4}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Paragraph Spacing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  {language === 'ar' ? 'المسافة بين الفقرات' : 'Paragraph Spacing'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('paragraphSpacing', -0.25)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={settings.paragraphSpacing.toFixed(1)}
                    onChange={(e) => updateSetting('paragraphSpacing', Math.min(5, Math.max(0.5, Number(e.target.value))))}
                    className="w-16 h-6 text-center text-xs px-1"
                    min={0.5}
                    max={5}
                    step={0.25}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('paragraphSpacing', 0.25)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[settings.paragraphSpacing]}
                onValueChange={([value]) => updateSetting('paragraphSpacing', value)}
                min={0.5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Code Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <Code className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'حجم خط الكود' : 'Code Font Size'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('codeFontSize', -2)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={settings.codeFontSize}
                    onChange={(e) => updateSetting('codeFontSize', Math.min(48, Math.max(10, Number(e.target.value))))}
                    className="w-16 h-6 text-center text-xs px-1"
                    min={10}
                    max={48}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('codeFontSize', 2)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[settings.codeFontSize]}
                onValueChange={([value]) => updateSetting('codeFontSize', value)}
                min={10}
                max={48}
                step={1}
                className="w-full"
              />
            </div>

            {/* Code Line Height */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <AlignJustify className="h-3.5 w-3.5" />
                  {language === 'ar' ? 'ارتفاع سطر الكود' : 'Code Line Height'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('codeLineHeight', -0.1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={settings.codeLineHeight.toFixed(2)}
                    onChange={(e) => updateSetting('codeLineHeight', Math.min(4, Math.max(1, Number(e.target.value))))}
                    className="w-16 h-6 text-center text-xs px-1"
                    min={1}
                    max={4}
                    step={0.1}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustSetting('codeLineHeight', 0.1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[settings.codeLineHeight]}
                onValueChange={([value]) => updateSetting('codeLineHeight', value)}
                min={1}
                max={4}
                step={0.05}
                className="w-full"
              />
            </div>

            {/* Night Reading Mode */}
            <div className="flex items-center justify-between py-2">
              <Label className="flex items-center gap-2 text-sm">
                <Moon className="h-3.5 w-3.5" />
                {language === 'ar' ? 'وضع القراءة الليلية' : 'Night Reading Mode'}
              </Label>
              <Switch
                checked={settings.nightMode}
                onCheckedChange={(checked) => updateSetting('nightMode', checked)}
              />
            </div>

            {/* Reset Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSettings}
              className="w-full gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {language === 'ar' ? 'إعادة التعيين' : 'Reset to Default'}
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DisplaySettings;
