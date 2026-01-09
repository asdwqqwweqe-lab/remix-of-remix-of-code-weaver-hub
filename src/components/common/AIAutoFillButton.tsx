import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Eye } from 'lucide-react';
import { callAI } from '@/lib/ai-service';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from 'sonner';
import AIPreviewDialog, { ReportPreviewData, PostPreviewData } from './AIPreviewDialog';

interface ReportAutoFillResult {
  title: string;
  tags: string[];
}

interface PostAutoFillResult {
  title: string;
  slug: string;
  summary: string;
  categoryName: string;
  collectionName: string;
  tags: string[];
  languages: string[];
}

interface AIAutoFillButtonProps {
  content: string;
  type: 'report' | 'post';
  existingCategories?: { id: string; nameAr: string; nameEn: string }[];
  existingCollections?: { id: string; title: string }[];
  existingTags?: { id: string; name: string }[];
  existingLanguages?: { id: string; name: string }[];
  onAutoFillReport?: (result: ReportAutoFillResult) => void;
  onAutoFillPost?: (result: PostAutoFillResult) => void;
  disabled?: boolean;
}

// Sound effects
const playSuccessSound = () => {
  const settings = useSettingsStore.getState().settings;
  if (!settings.soundNotificationsEnabled) return;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialDecayTo?.(0.01, audioContext.currentTime + 0.3) || 
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const playErrorSound = () => {
  const settings = useSettingsStore.getState().settings;
  if (!settings.soundNotificationsEnabled) return;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const AIAutoFillButton = ({
  content,
  type,
  existingCategories = [],
  existingCollections = [],
  existingTags = [],
  existingLanguages = [],
  onAutoFillReport,
  onAutoFillPost,
  disabled = false,
}: AIAutoFillButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [reportPreviewData, setReportPreviewData] = useState<ReportPreviewData | null>(null);
  const [postPreviewData, setPostPreviewData] = useState<PostPreviewData | null>(null);

  const generateSlug = (title: string) => {
    // Convert Arabic/Unicode to transliteration or use as-is
    const slug = title
      .toLowerCase()
      .trim()
      // Replace Arabic characters with their romanized equivalents
      .replace(/[\u0600-\u06FF]+/g, (match) => {
        // Simple transliteration for common Arabic words
        return match.split('').map((char) => {
          const arabicToLatin: Record<string, string> = {
            'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a',
            'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
            'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
            'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
            'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
            'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
            'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
            'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a',
            'ة': 'h', 'ء': '', 'ئ': 'y', 'ؤ': 'w',
          };
          return arabicToLatin[char] || char;
        }).join('');
      })
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return slug || `post-${Date.now()}`;
  };

  const handleAutoFill = async () => {
    if (!content.trim()) {
      toast.error('يرجى إدخال المحتوى أولاً');
      return;
    }

    setIsLoading(true);
    setRetryCount(0);

    try {
      if (type === 'report') {
        const prompt = `بناءً على المحتوى التالي، قم بإنشاء:
1. عنوان مناسب للتقرير (قصير ومعبر)
2. قائمة بـ 3-5 وسوم مناسبة

المحتوى:
${content.substring(0, 2000)}

أجب بتنسيق JSON فقط بهذا الشكل:
{
  "title": "عنوان التقرير",
  "tags": ["وسم1", "وسم2", "وسم3"]
}`;

        const result = await callAI(prompt, 'أنت مساعد ذكي متخصص في تحليل المحتوى وإنشاء عناوين ووسوم مناسبة. أجب بـ JSON فقط.');
        
        if (result.success && result.content) {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as ReportAutoFillResult;
            setReportPreviewData(parsed);
            setShowPreview(true);
            playSuccessSound();
          }
        } else {
          throw new Error(result.error || 'فشل في التوليد');
        }
      } else if (type === 'post') {
        const categoriesText = existingCategories.map(c => `${c.nameAr} (${c.nameEn})`).join(', ');
        const collectionsText = existingCollections.map(c => c.title).join(', ');
        const tagsText = existingTags.map(t => t.name).join(', ');
        const languagesText = existingLanguages.map(l => l.name).join(', ');

        const prompt = `بناءً على المحتوى التالي، قم بإنشاء:
1. عنوان مناسب للمقال (قصير ومعبر)
2. ملخص قصير (2-3 جمل)
3. اسم تصنيف مناسب (اختر من الموجودة إن أمكن: ${categoriesText || 'لا يوجد'})
4. اسم مجموعة مناسبة (اختر من الموجودة إن أمكن: ${collectionsText || 'لا يوجد'})
5. قائمة بـ 3-5 وسوم مناسبة (اختر من الموجودة إن أمكن: ${tagsText || 'لا يوجد'})
6. قائمة بلغات البرمجة المستخدمة إن وجدت (اختر من الموجودة إن أمكن: ${languagesText || 'لا يوجد'})

المحتوى:
${content.substring(0, 3000)}

أجب بتنسيق JSON فقط بهذا الشكل:
{
  "title": "عنوان المقال",
  "summary": "ملخص المقال",
  "categoryName": "اسم التصنيف",
  "collectionName": "اسم المجموعة",
  "tags": ["وسم1", "وسم2"],
  "languages": ["JavaScript", "Python"]
}

ملاحظة: إذا لم تجد تصنيف أو مجموعة مناسبة من الموجودة، اقترح اسم جديد.`;

        const result = await callAI(prompt, 'أنت مساعد ذكي متخصص في تحليل المحتوى التقني وتصنيفه. أجب بـ JSON فقط.');
        
        if (result.success && result.content) {
          const jsonMatch = result.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as Omit<PostAutoFillResult, 'slug'>;
            setPostPreviewData({
              ...parsed,
              slug: generateSlug(parsed.title),
            });
            setShowPreview(true);
            playSuccessSound();
          }
        } else {
          throw new Error(result.error || 'فشل في التوليد');
        }
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      playErrorSound();
      
      if (error instanceof Error && error.message.includes('429')) {
        setRetryCount(prev => prev + 1);
        toast.error('تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً');
      } else {
        toast.error('حدث خطأ أثناء التوليد');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewConfirm = (data: ReportPreviewData | PostPreviewData) => {
    if (type === 'report') {
      onAutoFillReport?.(data as ReportAutoFillResult);
      toast.success('تم تطبيق الحقول بنجاح');
    } else {
      onAutoFillPost?.(data as PostAutoFillResult);
      toast.success('تم تطبيق الحقول بنجاح');
    }
    setShowPreview(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAutoFill}
        disabled={disabled || isLoading || !content.trim()}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <div className="relative">
              <Loader2 className="w-4 h-4 animate-spin" />
              {retryCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-orange-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
                  {retryCount}
                </span>
              )}
            </div>
            جاري التوليد...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            توليد تلقائي بالذكاء الاصطناعي
          </>
        )}
      </Button>

      <AIPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        type={type}
        reportData={reportPreviewData || undefined}
        postData={postPreviewData || undefined}
        onConfirm={handlePreviewConfirm}
      />
    </>
  );
};

export default AIAutoFillButton;
