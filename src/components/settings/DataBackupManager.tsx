import { useState, useRef } from 'react';
import { Download, Upload, FileJson, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { downloadDataAsFile, importDataFromJson } from '@/hooks/useFirebaseSync';

export default function DataBackupManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    try {
      downloadDataAsFile();
      toast({
        title: 'تم التصدير',
        description: 'تم تحميل ملف النسخة الاحتياطية',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تصدير البيانات',
        variant: 'destructive',
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportSuccess(false);

    try {
      const text = await file.text();
      const result = importDataFromJson(text);
      
      if (result.success) {
        setImportSuccess(true);
        toast({
          title: 'نجاح',
          description: result.message,
        });
        // Reload after short delay
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({
          title: 'خطأ',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في قراءة الملف',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          النسخ الاحتياطي
        </CardTitle>
        <CardDescription>
          تصدير واستيراد بياناتك كملف JSON محلي
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير البيانات
          </Button>
          
          <Button 
            onClick={handleImportClick} 
            variant="outline"
            disabled={isImporting}
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : importSuccess ? (
              <Check className="h-4 w-4 ml-2 text-green-500" />
            ) : (
              <Upload className="h-4 w-4 ml-2" />
            )}
            استيراد من ملف
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          يتضمن التصدير: المنشورات، التقارير، خرائط الطريق، التصنيفات، الوسوم، والمجموعات
        </p>
      </CardContent>
    </Card>
  );
}
