import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Key, Plus, Trash2, TestTube, Check, X, Loader2, Eye, EyeOff, Sparkles, RefreshCw, Zap, Volume2, VolumeX, ExternalLink, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/store/settingsStore';
import { testOpenRouterKey } from '@/lib/openrouter';
import { testGeminiKey, GEMINI_MODELS_LIST } from '@/lib/gemini';
import CustomCssManager from '@/components/settings/CustomCssManager';
import DemoDataManager from '@/components/data/DemoDataManager';
import FirebaseSettings from '@/components/settings/FirebaseSettings';
import DataBackupManager from '@/components/settings/DataBackupManager';
import BaseSettingsManager from '@/components/settings/BaseSettingsManager';
import { AIProvider } from '@/types/blog';
import { useAuth } from '@/contexts/AuthContext';

// Free OpenRouter Models Only - https://openrouter.ai/models?pricing=free
const OPENROUTER_MODELS = [
  // Google Models
  { value: 'google/gemini-2.0-flash-exp:free', label: 'Google: Gemini 2.0 Flash (Free)', url: 'https://openrouter.ai/google/gemini-2.0-flash-exp:free', category: 'Google' },
  { value: 'google/gemma-3-27b-it:free', label: 'Google: Gemma 3 27B (Free)', url: 'https://openrouter.ai/google/gemma-3-27b-it:free', category: 'Google' },
  
  // DeepSeek Models
  { value: 'deepseek/deepseek-r1-0528:free', label: 'DeepSeek: R1 0528 (Free)', url: 'https://openrouter.ai/deepseek/deepseek-r1-0528:free', category: 'DeepSeek' },
  
  // Meta Models
  { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Meta: Llama 3.3 70B (Free)', url: 'https://openrouter.ai/meta-llama/llama-3.3-70b-instruct:free', category: 'Meta' },
  
  // Qwen Models  
  { value: 'qwen/qwen3-coder:free', label: 'Qwen: Qwen3 Coder 480B (Free)', url: 'https://openrouter.ai/qwen/qwen3-coder:free', category: 'Qwen' },
  
  // Mistral Models
  { value: 'mistralai/devstral-2512:free', label: 'Mistral: Devstral 2 2512 (Free)', url: 'https://openrouter.ai/mistralai/devstral-2512:free', category: 'Mistral' },
  
  // NVIDIA Models
  { value: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'NVIDIA: Nemotron 3 Nano (Free)', url: 'https://openrouter.ai/nvidia/nemotron-3-nano-30b-a3b:free', category: 'NVIDIA' },
  
  // OpenAI Models
  { value: 'openai/gpt-oss-120b:free', label: 'OpenAI: GPT-OSS 120B (Free)', url: 'https://openrouter.ai/openai/gpt-oss-120b:free', category: 'OpenAI' },
  { value: 'openai/gpt-oss-20b:free', label: 'OpenAI: GPT-OSS 20B (Free)', url: 'https://openrouter.ai/openai/gpt-oss-20b:free', category: 'OpenAI' },
  
  // TNG Models
  { value: 'tngtech/deepseek-r1t2-chimera:free', label: 'TNG: DeepSeek R1T2 Chimera (Free)', url: 'https://openrouter.ai/tngtech/deepseek-r1t2-chimera:free', category: 'TNG' },
  { value: 'tngtech/deepseek-r1t-chimera:free', label: 'TNG: DeepSeek R1T Chimera (Free)', url: 'https://openrouter.ai/tngtech/deepseek-r1t-chimera:free', category: 'TNG' },
  { value: 'tngtech/tng-r1t-chimera:free', label: 'TNG: R1T Chimera (Free)', url: 'https://openrouter.ai/tngtech/tng-r1t-chimera:free', category: 'TNG' },
  
  // Z.AI Models
  { value: 'z-ai/glm-4.5-air:free', label: 'Z.AI: GLM 4.5 Air (Free)', url: 'https://openrouter.ai/z-ai/glm-4.5-air:free', category: 'Z.AI' },
  
  // ByteDance Models
  { value: 'bytedance-seed/seedream-4.5', label: 'ByteDance: Seedream 4.5', url: 'https://openrouter.ai/bytedance-seed/seedream-4.5', category: 'ByteDance' },
  
  // Venice Models
  { value: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', label: 'Venice: Uncensored (Free)', url: 'https://openrouter.ai/cognitivecomputations/dolphin-mistral-24b-venice-edition:free', category: 'Venice' },
];

const AI_PROVIDERS = [
  { value: 'lovable', label: 'Lovable AI (افتراضي)', description: 'لا يحتاج مفتاح API - موصى به' },
  { value: 'gemini', label: 'Google Gemini', description: 'يحتاج مفتاح API من Google' },
  { value: 'openrouter', label: 'OpenRouter', description: 'يحتاج مفتاح API من OpenRouter' },
];

// Daily usage tracking
const DAILY_LIMIT = 100; // Example limit
const getStoredUsage = () => {
  const stored = localStorage.getItem('lovable-ai-usage');
  if (stored) {
    const { count, date } = JSON.parse(stored);
    const today = new Date().toDateString();
    if (date === today) return count;
  }
  return 0;
};

const incrementUsage = () => {
  const today = new Date().toDateString();
  const currentCount = getStoredUsage();
  localStorage.setItem('lovable-ai-usage', JSON.stringify({ count: currentCount + 1, date: today }));
};

export default function Settings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    settings,
    addOpenRouterKey,
    removeOpenRouterKey,
    toggleKeyActive,
    addGeminiKey,
    removeGeminiKey,
    toggleGeminiKeyActive,
    setDefaultModel,
    setDefaultProvider
  } = useSettingsStore();

  // OpenRouter state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Gemini state
  const [isGeminiDialogOpen, setIsGeminiDialogOpen] = useState(false);
  const [newGeminiKeyName, setNewGeminiKeyName] = useState('');
  const [newGeminiKeyValue, setNewGeminiKeyValue] = useState('');
  const [geminiTestingKeyId, setGeminiTestingKeyId] = useState<string | null>(null);
  const [geminiTestResults, setGeminiTestResults] = useState<Record<string, { success: boolean; message: string; model?: string }>>({});
  const [showGeminiKeys, setShowGeminiKeys] = useState<Record<string, boolean>>({});
  const [isAddingGemini, setIsAddingGemini] = useState(false);

  // Test all keys state
  const [isTestingAllKeys, setIsTestingAllKeys] = useState(false);
  const [isTestingAllGeminiKeys, setIsTestingAllGeminiKeys] = useState(false);

  // Lovable AI usage tracking
  const [dailyUsage, setDailyUsage] = useState(getStoredUsage());
  const usagePercentage = Math.min((dailyUsage / DAILY_LIMIT) * 100, 100);

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المفتاح وقيمته',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    const result = await testOpenRouterKey(newKeyValue.trim());

    if (result.success) {
      addOpenRouterKey(newKeyValue.trim(), newKeyName.trim());
      setNewKeyName('');
      setNewKeyValue('');
      setIsAddDialogOpen(false);
      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة المفتاح بنجاح',
      });
    } else {
      toast({
        title: 'خطأ في المفتاح',
        description: result.error || 'فشل اختبار المفتاح',
        variant: 'destructive',
      });
    }

    setIsAdding(false);
  };

  const handleAddGeminiKey = async () => {
    if (!newGeminiKeyName.trim() || !newGeminiKeyValue.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المفتاح وقيمته',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingGemini(true);

    const result = await testGeminiKey(newGeminiKeyValue.trim());

    if (result.success) {
      addGeminiKey(newGeminiKeyValue.trim(), newGeminiKeyName.trim());
      setNewGeminiKeyName('');
      setNewGeminiKeyValue('');
      setIsGeminiDialogOpen(false);
      toast({
        title: 'تم الإضافة',
        description: `تم إضافة المفتاح بنجاح - يعمل مع ${result.model}`,
      });
    } else {
      toast({
        title: 'خطأ في المفتاح',
        description: result.error || 'فشل اختبار المفتاح',
        variant: 'destructive',
      });
    }

    setIsAddingGemini(false);
  };

  const handleTestKey = async (keyId: string, keyValue: string) => {
    setTestingKeyId(keyId);
    const result = await testOpenRouterKey(keyValue);
    setTestResults((prev) => ({
      ...prev,
      [keyId]: {
        success: result.success,
        message: result.success ? 'المفتاح يعمل بشكل صحيح' : (result.error || 'فشل الاختبار'),
      },
    }));
    setTestingKeyId(null);
  };

  const handleTestGeminiKey = async (keyId: string, keyValue: string) => {
    setGeminiTestingKeyId(keyId);
    const result = await testGeminiKey(keyValue);
    setGeminiTestResults((prev) => ({
      ...prev,
      [keyId]: {
        success: result.success,
        message: result.success ? `المفتاح يعمل - ${result.model}` : (result.error || 'فشل الاختبار'),
        model: result.model,
      },
    }));
    setGeminiTestingKeyId(null);
  };

  // Test all OpenRouter keys
  const handleTestAllKeys = async () => {
    if (settings.openRouterKeys.length === 0) return;
    setIsTestingAllKeys(true);
    
    for (const keyData of settings.openRouterKeys) {
      await handleTestKey(keyData.id, keyData.key);
    }
    
    setIsTestingAllKeys(false);
    const successCount = Object.values(testResults).filter(r => r.success).length;
    toast({
      title: 'اختبار المفاتيح',
      description: `تم اختبار ${settings.openRouterKeys.length} مفتاح - ${successCount} يعمل`,
    });
  };

  // Test all Gemini keys
  const handleTestAllGeminiKeys = async () => {
    if (!settings.geminiKeys?.length) return;
    setIsTestingAllGeminiKeys(true);
    
    for (const keyData of settings.geminiKeys) {
      await handleTestGeminiKey(keyData.id, keyData.key);
    }
    
    setIsTestingAllGeminiKeys(false);
    const successCount = Object.values(geminiTestResults).filter(r => r.success).length;
    toast({
      title: 'اختبار المفاتيح',
      description: `تم اختبار ${settings.geminiKeys.length} مفتاح - ${successCount} يعمل`,
    });
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const toggleShowGeminiKey = (keyId: string) => {
    setShowGeminiKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 10) return '••••••••••';
    return key.substring(0, 10) + '••••••••••••••••••••';
  };

  const getModelsForProvider = () => {
    switch (settings.defaultProvider) {
      case 'gemini':
        return GEMINI_MODELS_LIST;
      case 'openrouter':
        return OPENROUTER_MODELS;
      default:
        return GEMINI_MODELS_LIST;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">الإعدادات</h1>
      </div>

      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            مزود الذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            اختر مزود الذكاء الاصطناعي الافتراضي للتطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AI_PROVIDERS.map((provider) => (
              <div
                key={provider.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${settings.defaultProvider === provider.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
                  }`}
                onClick={() => setDefaultProvider(provider.value as AIProvider)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${settings.defaultProvider === provider.value ? 'bg-primary' : 'bg-muted'
                    }`} />
                  <span className="font-medium">{provider.label}</span>
                  {provider.value === 'lovable' && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 ml-1" />
                      موصى به
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
              </div>
            ))}
          </div>

          {/* Lovable AI Usage Stats */}
          {settings.defaultProvider === 'lovable' && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <Label>الاستخدام اليومي</Label>
                <span className="text-sm text-muted-foreground">
                  {dailyUsage} / {DAILY_LIMIT} طلب
                </span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>يتم إعادة ضبط العداد تلقائياً عند منتصف الليل</span>
              </div>
              {usagePercentage >= 80 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ اقتربت من الحد اليومي. يمكنك إضافة مفاتيح Gemini أو OpenRouter كبديل.
                </div>
              )}

              {/* Sound Notifications Toggle */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.soundNotificationsEnabled ? (
                      <Volume2 className="h-4 w-4 text-primary" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label>الإشعارات الصوتية</Label>
                  </div>
                  <Switch
                    checked={settings.soundNotificationsEnabled ?? true}
                    onCheckedChange={(checked) => {
                      const { setSoundNotificationsEnabled } = useSettingsStore.getState();
                      setSoundNotificationsEnabled(checked);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  تشغيل صوت عند نجاح أو فشل عمليات الذكاء الاصطناعي
                </p>
              </div>
            </div>
          )}

          {/* Default Model Selection */}
          {settings.defaultProvider !== 'lovable' && (
            <div className="pt-4 border-t space-y-4">
              <div>
                <Label className="mb-2 block">النموذج الافتراضي</Label>
                <Select value={settings.defaultModel} onValueChange={setDefaultModel}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="اختر النموذج" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelsForProvider().map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Links for API Key Creation */}
              {settings.defaultProvider === 'openrouter' && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <Label className="text-sm flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    الموديلات المجانية المتاحة (اضغط للوصول السريع)
                  </Label>
                  {/* Group models by category */}
                  {['Google', 'DeepSeek', 'Meta', 'Qwen', 'Mistral', 'NVIDIA', 'OpenAI', 'TNG', 'Z.AI', 'ByteDance', 'Venice'].map((category) => {
                    const categoryModels = OPENROUTER_MODELS.filter(m => m.category === category);
                    if (categoryModels.length === 0) return null;
                    return (
                      <div key={category} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{category}</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
                          {categoryModels.map((model) => (
                            <a
                              key={model.value}
                              href={model.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs p-2 rounded-md bg-background border hover:border-primary hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{model.label.replace(`${category}: `, '')}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            مفاتيح API
          </CardTitle>
          <CardDescription>
            إدارة مفاتيح API للذكاء الاصطناعي. يتم التبديل تلقائياً للمفتاح التالي عند فشل أحدها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="gemini" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="gemini">Gemini API</TabsTrigger>
              <TabsTrigger value="openrouter">OpenRouter API</TabsTrigger>
            </TabsList>

            {/* Gemini Keys Tab */}
            <TabsContent value="gemini" className="space-y-4">
              <div className="flex justify-between items-center">
                {settings.geminiKeys?.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestAllGeminiKeys}
                    disabled={isTestingAllGeminiKeys}
                  >
                    {isTestingAllGeminiKeys ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 ml-2" />
                    )}
                    اختبار جميع المفاتيح
                  </Button>
                )}
                <Dialog open={isGeminiDialogOpen} onOpenChange={setIsGeminiDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مفتاح Gemini
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مفتاح Gemini جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="geminiKeyName">اسم المفتاح</Label>
                        <Input
                          id="geminiKeyName"
                          placeholder="مثال: المفتاح الأول"
                          value={newGeminiKeyName}
                          onChange={(e) => setNewGeminiKeyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="geminiKeyValue">قيمة المفتاح</Label>
                        <Input
                          id="geminiKeyValue"
                          type="password"
                          placeholder="AIzaSy..."
                          value={newGeminiKeyValue}
                          onChange={(e) => setNewGeminiKeyValue(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsGeminiDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleAddGeminiKey} disabled={isAddingGemini}>
                        {isAddingGemini && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                        إضافة واختبار
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {settings.geminiKeys?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لم يتم إضافة أي مفاتيح Gemini بعد. أضف مفتاحاً للبدء.
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.geminiKeys?.map((keyData, index) => (
                    <div
                      key={keyData.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={keyData.isActive}
                            onCheckedChange={() => toggleGeminiKeyActive(keyData.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{keyData.name}</span>
                            {keyData.isActive && (
                              <Badge variant="default" className="text-xs">
                                نشط
                              </Badge>
                            )}
                            {keyData.failCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                فشل {keyData.failCount} مرات
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                الافتراضي
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono">
                              {showGeminiKeys[keyData.id] ? keyData.key : maskKey(keyData.key)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleShowGeminiKey(keyData.id)}
                            >
                              {showGeminiKeys[keyData.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {geminiTestResults[keyData.id] && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${geminiTestResults[keyData.id].success ? 'text-green-500' : 'text-destructive'}`}>
                              {geminiTestResults[keyData.id].success ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {geminiTestResults[keyData.id].message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestGeminiKey(keyData.id, keyData.key)}
                          disabled={geminiTestingKeyId === keyData.id}
                        >
                          {geminiTestingKeyId === keyData.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeGeminiKey(keyData.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* OpenRouter Keys Tab */}
            <TabsContent value="openrouter" className="space-y-4">
              <div className="flex justify-between items-center">
                {settings.openRouterKeys.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestAllKeys}
                    disabled={isTestingAllKeys}
                  >
                    {isTestingAllKeys ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4 ml-2" />
                    )}
                    اختبار جميع المفاتيح
                  </Button>
                )}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة مفتاح OpenRouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة مفتاح OpenRouter جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">اسم المفتاح</Label>
                        <Input
                          id="keyName"
                          placeholder="مثال: المفتاح الأول"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="keyValue">قيمة المفتاح</Label>
                        <Input
                          id="keyValue"
                          type="password"
                          placeholder="sk-or-v1-..."
                          value={newKeyValue}
                          onChange={(e) => setNewKeyValue(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleAddKey} disabled={isAdding}>
                        {isAdding && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                        إضافة واختبار
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {settings.openRouterKeys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لم يتم إضافة أي مفاتيح OpenRouter بعد. أضف مفتاحاً للبدء.
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.openRouterKeys.map((keyData, index) => (
                    <div
                      key={keyData.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={keyData.isActive}
                            onCheckedChange={() => toggleKeyActive(keyData.id)}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{keyData.name}</span>
                            {keyData.isActive && (
                              <Badge variant="default" className="text-xs">
                                نشط
                              </Badge>
                            )}
                            {keyData.failCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                فشل {keyData.failCount} مرات
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge variant="secondary" className="text-xs">
                                الافتراضي
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono">
                              {showKeys[keyData.id] ? keyData.key : maskKey(keyData.key)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleShowKey(keyData.id)}
                            >
                              {showKeys[keyData.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {testResults[keyData.id] && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${testResults[keyData.id].success ? 'text-green-500' : 'text-destructive'}`}>
                              {testResults[keyData.id].success ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {testResults[keyData.id].message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestKey(keyData.id, keyData.key)}
                          disabled={testingKeyId === keyData.id}
                        >
                          {testingKeyId === keyData.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeOpenRouterKey(keyData.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Base Settings Manager */}
      <BaseSettingsManager />

      {/* Firebase Settings */}
      <FirebaseSettings />

      {/* Data Backup */}
      <DataBackupManager />

      {/* Custom CSS */}
      <CustomCssManager />

      {/* Demo Data Management */}
      <DemoDataManager />
    </div>
  );
}
