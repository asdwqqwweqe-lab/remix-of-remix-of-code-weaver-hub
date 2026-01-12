import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RoadmapSection } from '@/types/blog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhanceRoadmapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapId: string;
  roadmapTitle: string;
  languageName: string;
  sections: RoadmapSection[];
  onEnhance: (newSections: any[]) => void;
}

const EnhanceRoadmapDialog = ({ 
  isOpen, 
  onClose, 
  roadmapId, 
  roadmapTitle, 
  languageName, 
  sections,
  onEnhance 
}: EnhanceRoadmapDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateEnhancedContent = async () => {
    setIsGenerating(true);
    setError(null);
    setPreview([]);

    try {
      // Prepare current roadmap structure
      const currentStructure = sections.map(section => ({
        title: section.title,
        topics: section.topics.map(t => t.title),
      }));

      // Call AI to enhance the roadmap
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            title: roadmapTitle, 
            languageName,
            enhance: true,
            currentStructure,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error('تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً');
        }
        if (response.status === 402) {
          throw new Error('الرصيد غير كافٍ');
        }
        throw new Error(errorData.error || 'حدث خطأ في التوليد');
      }

      const data = await response.json();
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('صيغة الاستجابة غير صالحة');
      }

      setPreview(data.sections);
      toast.success('تم توليد المحتوى المحسّن بنجاح!');
    } catch (error) {
      console.error('Error enhancing roadmap:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء التحسين');
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء التحسين');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyEnhancements = () => {
    if (preview.length > 0) {
      onEnhance(preview);
      toast.success('تم تطبيق التحسينات بنجاح!');
      onClose();
    }
  };

  const handleClose = () => {
    setPreview([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            تحسين خريطة الطريق بالذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription>
            سيقوم الذكاء الاصطناعي بتحليل خريطة الطريق الحالية وإضافة مواضيع فرعية وتحسينات مفيدة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Roadmap Info */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">معلومات خريطة الطريق</h4>
              <Badge variant="outline">{languageName}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{roadmapTitle}</p>
            <div className="flex gap-4 mt-2">
              <div className="text-sm">
                <span className="text-muted-foreground">الأقسام: </span>
                <span className="font-medium">{sections.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">المواضيع: </span>
                <span className="font-medium">
                  {sections.reduce((acc, s) => acc + s.topics.length, 0)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Preview Area */}
          {preview.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-green-600 dark:text-green-400">
                  ✨ المحتوى المحسّن ({preview.length} قسم جديد)
                </h4>
              </div>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-4">
                  {preview.map((section, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h5 className="font-semibold mb-2">{section.title}</h5>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {section.description}
                        </p>
                      )}
                      <div className="space-y-1">
                        {section.topics?.map((topic: any, topicIndex: number) => (
                          <div key={topicIndex} className="text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-primary">📌</span>
                              <div className="flex-1">
                                <div className="font-medium">{topic.title}</div>
                                {topic.subtopics && topic.subtopics.length > 0 && (
                                  <div className="mt-1 mr-4 space-y-1">
                                    {topic.subtopics.map((subtopic: string, subIndex: number) => (
                                      <div key={subIndex} className="flex items-start gap-2 text-muted-foreground">
                                        <span>↳</span>
                                        <span>{subtopic}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">جاري تحليل وتحسين خريطة الطريق...</p>
              <p className="text-sm text-muted-foreground">قد يستغرق هذا بضع ثوانٍ</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
              <Sparkles className="h-16 w-16 text-muted-foreground/50" />
              <p className="text-muted-foreground">اضغط على "بدء التحسين" لتوليد محتوى محسّن</p>
              <ul className="text-sm text-muted-foreground space-y-1 text-center">
                <li>✓ إضافة مواضيع فرعية تفصيلية</li>
                <li>✓ ملء الفجوات المعرفية</li>
                <li>✓ تنظيم المحتوى بشكل أفضل</li>
                <li>✓ إضافة مواضيع متقدمة</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            إلغاء
          </Button>
          {preview.length > 0 ? (
            <Button onClick={handleApplyEnhancements}>
              <Sparkles className="h-4 w-4 ml-2" />
              تطبيق التحسينات
            </Button>
          ) : (
            <Button 
              onClick={generateEnhancedContent} 
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري التحسين...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 ml-2" />
                  بدء التحسين
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnhanceRoadmapDialog;
