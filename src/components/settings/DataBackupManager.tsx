import { useState, useRef } from 'react';
import { Download, Upload, FileJson, Loader2, Check, Plus, Replace, FileText, Database, Tag, FolderOpen, BookOpen, Map, Code, Languages } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ImportMode = 'replace' | 'merge';

interface FilePreview {
  version: string;
  exportedAt: string;
  stats: {
    posts: number;
    categories: number;
    tags: number;
    snippets: number;
    collections: number;
    languages: number;
    reports: number;
    roadmaps: number;
    sections: number;
  };
  totalItems: number;
}

function parseFileForPreview(jsonString: string): FilePreview | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.data) return null;

    const { blog, reports, roadmap } = data.data;
    
    const stats = {
      posts: blog?.state?.posts?.length || 0,
      categories: blog?.state?.categories?.length || 0,
      tags: blog?.state?.tags?.length || 0,
      snippets: blog?.state?.snippets?.length || 0,
      collections: blog?.state?.collections?.length || 0,
      languages: blog?.state?.programmingLanguages?.length || 0,
      reports: reports?.state?.reports?.length || 0,
      roadmaps: roadmap?.state?.roadmaps?.length || 0,
      sections: roadmap?.state?.sections?.length || 0,
    };

    return {
      version: data.version,
      exportedAt: data.exportedAt,
      stats,
      totalItems: Object.values(stats).reduce((a, b) => a + b, 0),
    };
  } catch {
    return null;
  }
}

export default function DataBackupManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileContent, setPendingFileContent] = useState<string>('');
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

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
    
    try {
      const text = await file.text();
      const preview = parseFileForPreview(text);
      
      if (!preview) {
        toast({
          title: 'خطأ',
          description: 'تنسيق الملف غير صحيح',
          variant: 'destructive',
        });
        return;
      }
      
      setPendingFile(file);
      setPendingFileContent(text);
      setFilePreview(preview);
      setShowPreviewDialog(true);
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في قراءة الملف',
        variant: 'destructive',
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProceedToImport = () => {
    setShowPreviewDialog(false);
    setShowModeDialog(true);
  };

  const processImport = async (mode: ImportMode) => {
    if (!pendingFileContent) return;
    
    setShowModeDialog(false);
    setIsImporting(true);
    setImportSuccess(false);

    try {
      const result = mode === 'merge' 
        ? mergeDataFromJson(pendingFileContent) 
        : importDataFromJson(pendingFileContent);
      
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
    } catch {
      toast({
        title: 'خطأ',
        description: 'فشل في استيراد البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setPendingFile(null);
      setPendingFileContent('');
      setFilePreview(null);
    }
  };

  const StatItem = ({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) => (
    count > 0 ? (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>
    ) : null
  );

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

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              معاينة الملف
            </DialogTitle>
            <DialogDescription>
              محتوى ملف النسخة الاحتياطية
            </DialogDescription>
          </DialogHeader>
          
          {filePreview && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">اسم الملف:</span>
                  <span className="font-medium truncate max-w-[200px]">{pendingFile?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الإصدار:</span>
                  <span>{filePreview.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تاريخ التصدير:</span>
                  <span dir="ltr">{new Date(filePreview.exportedAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>

              {/* Stats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">محتوى الملف</h4>
                  <Badge variant="default">{filePreview.totalItems} عنصر</Badge>
                </div>
                <ScrollArea className="h-[200px] rounded-lg border p-3">
                  <div className="divide-y">
                    <StatItem icon={FileText} label="المنشورات" count={filePreview.stats.posts} />
                    <StatItem icon={FolderOpen} label="التصنيفات" count={filePreview.stats.categories} />
                    <StatItem icon={Tag} label="الوسوم" count={filePreview.stats.tags} />
                    <StatItem icon={Code} label="الأكواد" count={filePreview.stats.snippets} />
                    <StatItem icon={Database} label="المجموعات" count={filePreview.stats.collections} />
                    <StatItem icon={Languages} label="اللغات" count={filePreview.stats.languages} />
                    <StatItem icon={BookOpen} label="التقارير" count={filePreview.stats.reports} />
                    <StatItem icon={Map} label="خرائط الطريق" count={filePreview.stats.roadmaps} />
                    <StatItem icon={Map} label="الأقسام" count={filePreview.stats.sections} />
                  </div>
                </ScrollArea>
              </div>

              <Separator />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowPreviewDialog(false);
                    setPendingFile(null);
                    setPendingFileContent('');
                    setFilePreview(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleProceedToImport}
                >
                  متابعة الاستيراد
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mode Selection Dialog */}
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
