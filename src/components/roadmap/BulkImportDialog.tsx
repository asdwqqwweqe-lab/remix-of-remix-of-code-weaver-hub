import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileJson, Copy, Check, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportData) => void;
  programmingLanguages: Array<{ id: string; name: string; color: string }>;
}

interface ImportSection {
  title: string;
  description?: string;
  topics: Array<{
    title: string;
    completed?: boolean;
  }>;
}

interface ImportRoadmap {
  languageId: string;
  title: string;
  description?: string;
  sections: ImportSection[];
}

interface ImportData {
  roadmaps?: ImportRoadmap[];
  sections?: ImportSection[];
  topics?: Array<{ title: string; completed?: boolean }>;
}

const sampleTemplate = {
  roadmaps: [
    {
      languageId: "LANGUAGE_ID_HERE",
      title: "عنوان خريطة الطريق",
      description: "وصف الخريطة",
      sections: [
        {
          title: "القسم الأول",
          description: "وصف القسم",
          topics: [
            { title: "الموضوع الأول", completed: false },
            { title: "الموضوع الثاني", completed: false }
          ]
        },
        {
          title: "القسم الثاني",
          topics: [
            { title: "موضوع آخر", completed: false }
          ]
        }
      ]
    }
  ]
};

const sectionsTemplate = {
  sections: [
    {
      title: "قسم جديد",
      description: "وصف القسم",
      topics: [
        { title: "موضوع 1", completed: false },
        { title: "موضوع 2", completed: false }
      ]
    }
  ]
};

const topicsTemplate = {
  topics: [
    { title: "موضوع جديد 1", completed: false },
    { title: "موضوع جديد 2", completed: false },
    { title: "موضوع جديد 3", completed: false }
  ]
};

const BulkImportDialog = ({ isOpen, onClose, onImport, programmingLanguages }: BulkImportDialogProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('roadmaps');

  const handleCopy = (template: object, type: string) => {
    const templateWithIds = type === 'roadmaps' 
      ? {
          ...template,
          _availableLanguageIds: programmingLanguages.map(l => ({ id: l.id, name: l.name }))
        }
      : template;
    
    navigator.clipboard.writeText(JSON.stringify(templateWithIds, null, 2));
    setCopied(type);
    toast.success('تم نسخ القالب');
    setTimeout(() => setCopied(null), 2000);
  };

  const validateAndImport = () => {
    setError(null);
    
    if (!jsonInput.trim()) {
      setError('يرجى إدخال بيانات JSON');
      return;
    }

    try {
      const data = JSON.parse(jsonInput) as ImportData;
      
      // Remove helper fields
      delete (data as any)._availableLanguageIds;
      
      // Validate structure
      if (!data.roadmaps && !data.sections && !data.topics) {
        setError('يجب أن يحتوي JSON على roadmaps أو sections أو topics');
        return;
      }

      // Validate roadmaps
      if (data.roadmaps) {
        for (const roadmap of data.roadmaps) {
          if (!roadmap.title || !roadmap.languageId) {
            setError('كل خريطة طريق يجب أن تحتوي على title و languageId');
            return;
          }
          const validLang = programmingLanguages.find(l => l.id === roadmap.languageId);
          if (!validLang) {
            setError(`معرف اللغة "${roadmap.languageId}" غير موجود. المعرفات المتاحة: ${programmingLanguages.map(l => l.id).join(', ')}`);
            return;
          }
        }
      }

      // Validate sections
      if (data.sections) {
        for (const section of data.sections) {
          if (!section.title) {
            setError('كل قسم يجب أن يحتوي على title');
            return;
          }
        }
      }

      // Validate topics
      if (data.topics) {
        for (const topic of data.topics) {
          if (!topic.title) {
            setError('كل موضوع يجب أن يحتوي على title');
            return;
          }
        }
      }

      onImport(data);
      setJsonInput('');
      onClose();
      toast.success('تم الاستيراد بنجاح');
    } catch (e) {
      setError('خطأ في تنسيق JSON. تأكد من صحة البيانات.');
    }
  };

  const getTemplate = () => {
    switch (activeTab) {
      case 'roadmaps':
        return sampleTemplate;
      case 'sections':
        return sectionsTemplate;
      case 'topics':
        return topicsTemplate;
      default:
        return sampleTemplate;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            استيراد بيانات JSON
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roadmaps">خرائط كاملة</TabsTrigger>
            <TabsTrigger value="sections">أقسام</TabsTrigger>
            <TabsTrigger value="topics">مواضيع</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            {/* Template Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">قالب {activeTab === 'roadmaps' ? 'خريطة طريق' : activeTab === 'sections' ? 'أقسام' : 'مواضيع'}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(getTemplate(), activeTab)}
                  className="gap-1.5"
                >
                  {copied === activeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      نسخ القالب
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-40 border">
                {JSON.stringify(getTemplate(), null, 2)}
              </pre>
            </div>

            {/* Available Languages */}
            {activeTab === 'roadmaps' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">معرفات اللغات المتاحة</Label>
                <div className="flex flex-wrap gap-2">
                  {programmingLanguages.map(lang => (
                    <div
                      key={lang.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-xs"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: lang.color }}
                      />
                      <span className="font-mono">{lang.id}</span>
                      <span className="text-muted-foreground">({lang.name})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">أدخل بيانات JSON</Label>
              <Textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setError(null);
                }}
                placeholder="الصق بيانات JSON هنا..."
                className="min-h-[200px] font-mono text-sm"
                dir="ltr"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* AI Tip */}
            <Alert>
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>نصيحة:</strong> يمكنك استخدام الذكاء الاصطناعي (ChatGPT/Claude) لتوليد خريطة طريق شاملة.
                انسخ القالب واطلب منه إنشاء محتوى كامل لأي موضوع تريد تعلمه!
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={validateAndImport}>
            <FileJson className="w-4 h-4 me-2" />
            استيراد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
