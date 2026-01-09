import { useState, useEffect } from 'react';
import { Database, Check, AlertCircle, Wifi, WifiOff, RefreshCw, Upload, Download, Loader2, Zap, Bell, BellOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settingsStore';
import { FirebaseConfig } from '@/types/blog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  testFirebaseConnection, 
  syncToFirebase, 
  syncFromFirebase, 
  getLastSyncTime,
  isFirebaseConfigured 
} from '@/lib/firebase-service';

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

export default function FirebaseSettings() {
  const { toast } = useToast();
  const { settings, setFirebaseConfig, setFirebaseAutoSync, setSyncNotifications } = useSettingsStore();
  const [config, setConfig] = useState<FirebaseConfig>(
    settings.firebaseConfig || DEFAULT_FIREBASE_CONFIG
  );
  const [jsonInput, setJsonInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    latency?: number;
  }>({ tested: false, connected: false, message: '' });
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Load last sync time on mount
    if (isFirebaseConfigured()) {
      getLastSyncTime().then(setLastSync);
    }
  }, [settings.firebaseConfig]);

  const handleFieldChange = (field: keyof FirebaseConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setConnectionStatus({ tested: false, connected: false, message: '' });
  };

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.projectId || !config.databaseURL) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال API Key, Project ID, و Database URL',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    const result = await testFirebaseConnection(config);
    setConnectionStatus({
      tested: true,
      connected: result.success,
      message: result.message,
      latency: result.latency,
    });
    setIsTesting(false);

    toast({
      title: result.success ? 'نجاح' : 'فشل',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleSave = () => {
    if (!config.apiKey || !config.projectId) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال API Key و Project ID على الأقل',
        variant: 'destructive',
      });
      return;
    }
    setFirebaseConfig(config);
    toast({
      title: 'تم الحفظ',
      description: 'تم حفظ إعدادات Firebase بنجاح',
    });
  };

  const handleJsonPaste = () => {
    try {
      let input = jsonInput.trim();
      
      // Remove variable declaration (const/var/let firebaseConfig = ...)
      input = input.replace(/^(const|var|let)\s+\w+\s*=\s*/, '');
      // Remove trailing semicolon
      input = input.replace(/;?\s*$/, '');
      
      // Try parsing as-is first (valid JSON)
      let parsed: Record<string, string>;
      try {
        parsed = JSON.parse(input);
      } catch {
        // Convert JavaScript object notation to JSON
        // Only quote unquoted keys (word followed by colon, but not inside strings)
        // Match keys at the start of line or after { or ,
        input = input.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
        parsed = JSON.parse(input);
      }
      
      const newConfig: FirebaseConfig = {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        databaseURL: parsed.databaseURL || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
        measurementId: parsed.measurementId || '',
      };
      
      setConfig(newConfig);
      setJsonInput('');
      setConnectionStatus({ tested: false, connected: false, message: '' });
      toast({
        title: 'تم الاستيراد',
        description: 'تم استيراد الإعدادات من JSON',
      });
    } catch (error) {
      console.error('JSON parse error:', error);
      toast({
        title: 'خطأ في التحليل',
        description: 'تأكد من صحة تنسيق JSON أو لصق الكود كما هو من Firebase Console',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = () => {
    setFirebaseConfig(undefined);
    setConfig(DEFAULT_FIREBASE_CONFIG);
    setConnectionStatus({ tested: false, connected: false, message: '' });
    setLastSync(null);
    toast({
      title: 'تم الحذف',
      description: 'تم حذف إعدادات Firebase',
    });
  };

  const handleSyncToFirebase = async () => {
    setIsSyncing(true);
    const result = await syncToFirebase();
    setIsSyncing(false);
    
    if (result.success) {
      setLastSync(new Date().toISOString());
    }
    
    toast({
      title: result.success ? 'نجاح' : 'فشل',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  const handleSyncFromFirebase = async () => {
    setIsRestoring(true);
    const result = await syncFromFirebase();
    setIsRestoring(false);
    
    toast({
      title: result.success ? 'نجاح' : 'فشل',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });

    if (result.success) {
      // Reload page to apply restored data
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const isConfigured = settings.firebaseConfig?.apiKey && settings.firebaseConfig?.projectId;

  const formatLastSync = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          إعدادات Firebase Realtime Database
          {isConfigured && (
            <Badge variant="default" className="mr-2">
              <Check className="h-3 w-3 ml-1" />
              مُفعّل
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          إعدادات Firebase Realtime Database للتخزين والمزامنة السحابية
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {isConfigured && (
          <div className={`p-4 rounded-lg border ${
            connectionStatus.tested 
              ? connectionStatus.connected 
                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
              : 'bg-muted/50 border-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {connectionStatus.tested ? (
                  connectionStatus.connected ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-600" />
                  )
                ) : (
                  <Wifi className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {connectionStatus.tested 
                      ? connectionStatus.connected 
                        ? 'متصل بـ Firebase' 
                        : 'غير متصل'
                      : 'حالة الاتصال غير معروفة'
                    }
                  </p>
                  {connectionStatus.message && (
                    <p className="text-sm text-muted-foreground">{connectionStatus.message}</p>
                  )}
                  {connectionStatus.latency && (
                    <p className="text-xs text-muted-foreground">زمن الاستجابة: {connectionStatus.latency}ms</p>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="mr-2">اختبار</span>
              </Button>
            </div>

            {/* Sync Controls */}
            {connectionStatus.connected && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="font-medium text-sm">المزامنة التلقائية</p>
                      <p className="text-xs text-muted-foreground">مزامنة البيانات تلقائياً عند كل تغيير</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.firebaseAutoSync === true}
                    onCheckedChange={setFirebaseAutoSync}
                  />
                </div>

                {/* Sync Notifications Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.syncNotifications ? (
                      <Bell className="h-4 w-4 text-blue-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">إشعارات المزامنة</p>
                      <p className="text-xs text-muted-foreground">عرض إشعارات صوتية ومرئية عند المزامنة</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.syncNotifications === true}
                    onCheckedChange={setSyncNotifications}
                  />
                </div>

                {/* Manual Sync Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncToFirebase}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Upload className="h-4 w-4 ml-2" />
                    )}
                    رفع البيانات إلى Firebase
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncFromFirebase}
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Download className="h-4 w-4 ml-2" />
                    )}
                    استعادة من Firebase
                  </Button>
                  {lastSync && (
                    <span className="text-xs text-muted-foreground self-center mr-auto">
                      آخر مزامنة: {formatLastSync(lastSync)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* JSON Paste Section */}
        <div className="space-y-2">
          <Label>لصق الإعدادات من Firebase Console</Label>
          <Textarea
            placeholder={`الصق كائن firebaseConfig هنا...
{
  "apiKey": "AIza...",
  "authDomain": "...",
  "databaseURL": "https://xxx-default-rtdb.firebaseio.com",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="font-mono text-xs h-32"
            dir="ltr"
          />
          <Button onClick={handleJsonPaste} variant="outline" size="sm" disabled={!jsonInput.trim()}>
            استيراد من JSON
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">أو أدخل البيانات يدوياً</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <Input
              id="apiKey"
              value={config.apiKey}
              onChange={(e) => handleFieldChange('apiKey', e.target.value)}
              placeholder="AIzaSy..."
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID *</Label>
            <Input
              id="projectId"
              value={config.projectId}
              onChange={(e) => handleFieldChange('projectId', e.target.value)}
              placeholder="my-project"
              dir="ltr"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="databaseURL">Database URL * (مطلوب للاتصال)</Label>
            <Input
              id="databaseURL"
              value={config.databaseURL}
              onChange={(e) => handleFieldChange('databaseURL', e.target.value)}
              placeholder="https://my-project-default-rtdb.firebaseio.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authDomain">Auth Domain</Label>
            <Input
              id="authDomain"
              value={config.authDomain}
              onChange={(e) => handleFieldChange('authDomain', e.target.value)}
              placeholder="my-project.firebaseapp.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storageBucket">Storage Bucket</Label>
            <Input
              id="storageBucket"
              value={config.storageBucket}
              onChange={(e) => handleFieldChange('storageBucket', e.target.value)}
              placeholder="my-project.appspot.com"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="messagingSenderId">Messaging Sender ID</Label>
            <Input
              id="messagingSenderId"
              value={config.messagingSenderId}
              onChange={(e) => handleFieldChange('messagingSenderId', e.target.value)}
              placeholder="123456789"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appId">App ID</Label>
            <Input
              id="appId"
              value={config.appId}
              onChange={(e) => handleFieldChange('appId', e.target.value)}
              placeholder="1:123:web:abc"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave}>حفظ الإعدادات</Button>
          {!connectionStatus.tested && isConfigured && (
            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              اختبار الاتصال
            </Button>
          )}
          {isConfigured && (
            <Button variant="destructive" onClick={handleRemove}>
              حذف الإعدادات
            </Button>
          )}
        </div>

        {isConfigured && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Project: <code className="font-mono">{settings.firebaseConfig?.projectId}</code></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
