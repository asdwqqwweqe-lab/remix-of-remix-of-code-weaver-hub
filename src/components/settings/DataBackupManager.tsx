import { useState, useRef } from 'react';
import { Download, Upload, FileJson, Loader2, Check, Plus, Replace } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { downloadDataAsFile, importDataFromJson, mergeDataFromJson } from '@/hooks/useFirebaseSync';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ImportMode = 'replace' | 'merge';

export default function DataBackupManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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
    
    // Store file and show mode selection dialog
    setPendingFile(file);
    setShowModeDialog(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processImport = async (mode: ImportMode) => {
    if (!pendingFile) return;
    
    setShowModeDialog(false);
    setIsImporting(true);
    setImportSuccess(false);

    try {
      const text = await pendingFile.text();
      const result = mode === 'merge' 
        ? mergeDataFromJson(text) 
        : importDataFromJson(text);
      
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
      setPendingFile(null);
    }
  };

  return (
    <>
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

      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>طريقة الاستيراد</DialogTitle>
            <DialogDescription>
              اختر كيف تريد استيراد البيانات من الملف
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start gap-4"
              onClick={() => processImport('merge')}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <div className="font-medium">إضافة البيانات</div>
                <div className="text-sm text-muted-foreground">
                  إضافة العناصر الجديدة فقط دون حذف الموجودة
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto p-4 justify-start gap-4"
              onClick={() => processImport('replace')}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <Replace className="h-5 w-5 text-destructive" />
              </div>
              <div className="text-right">
                <div className="font-medium">استبدال البيانات</div>
                <div className="text-sm text-muted-foreground">
                  حذف جميع البيانات الحالية واستبدالها بالملف
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
