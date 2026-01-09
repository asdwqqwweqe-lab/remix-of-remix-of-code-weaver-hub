import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { callAI, getAIProviderName } from '@/lib/ai-service';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from 'sonner';

interface AIGenerateButtonProps {
  context: string;
  field: 'description' | 'summary' | 'category';
  onGenerate: (result: string) => void;
  disabled?: boolean;
  className?: string;
}

// Audio notification functions
const playSuccessSound = () => {
  const { settings } = useSettingsStore.getState();
  if (settings.soundNotificationsEnabled === false) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const playErrorSound = () => {
  const { settings } = useSettingsStore.getState();
  if (settings.soundNotificationsEnabled === false) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const AIGenerateButton = ({ context, field, onGenerate, disabled, className }: AIGenerateButtonProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { settings } = useSettingsStore();
  
  const isProviderAvailable = () => {
    if (settings.defaultProvider === 'lovable') return true;
    if (settings.defaultProvider === 'gemini') {
      return settings.geminiKeys.filter(k => k.failCount < 3 && k.isActive).length > 0;
    }
    if (settings.defaultProvider === 'openrouter') {
      return settings.openRouterKeys.filter(k => k.failCount < 3).length > 0;
    }
    return true;
  };
  
  const getSystemPrompt = () => {
    return 'أنت مساعد ذكي متخصص في كتابة المحتوى التقني. قدم إجابات مختصرة ومفيدة باللغة العربية.';
  };
  
  const getPrompt = () => {
    switch (field) {
      case 'description':
        return `اكتب وصفاً مختصراً (جملة أو جملتين) لمقتطف الكود التالي:\nالعنوان: ${context}\nاكتب الوصف فقط بدون أي مقدمات.`;
      case 'summary':
        return `اكتب ملخصاً مختصراً (2-3 جمل) للموضوع التالي:\nالعنوان: ${context}\nاكتب الملخص فقط بدون أي مقدمات.`;
      case 'category':
        return `اقترح تصنيفاً مناسباً للموضوع التالي:\nالعنوان: ${context}\nاكتب اسم التصنيف فقط (كلمة أو كلمتين).`;
      default:
        return context;
    }
  };
  
  const handleGenerate = async () => {
    if (!context.trim()) {
      toast.error('يرجى إدخال العنوان أولاً');
      playErrorSound();
      return;
    }
    
    if (!isProviderAvailable()) {
      const providerName = getAIProviderName();
      toast.error(`يرجى إضافة مفتاح ${providerName} في الإعدادات`);
      playErrorSound();
      return;
    }
    
    setIsLoading(true);
    setRetryCount(0);
    
    try {
      const result = await callAI(getPrompt(), getSystemPrompt());
      
      if (result.success && result.content) {
        onGenerate(result.content.trim());
        toast.success('تم التوليد بنجاح ✨');
        playSuccessSound();
        
        // Track usage for Lovable AI
        if (settings.defaultProvider === 'lovable') {
          const stored = localStorage.getItem('lovable-ai-usage');
          const today = new Date().toDateString();
          let count = 0;
          if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) count = data.count;
          }
          localStorage.setItem('lovable-ai-usage', JSON.stringify({ count: count + 1, date: today }));
        }
      } else {
        if (result.error?.includes('429') || result.error?.includes('حد الطلبات')) {
          toast.error('تم تجاوز حد الطلبات. جرّب Lovable AI في الإعدادات.');
        } else {
          toast.error(result.error || 'فشل التوليد');
        }
        playErrorSound();
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التوليد');
      playErrorSound();
    } finally {
      setIsLoading(false);
      setRetryCount(0);
    }
  };
  
  if (!isProviderAvailable()) {
    return null;
  }
  
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`relative ${className}`}
      onClick={handleGenerate}
      disabled={disabled || isLoading || !context.trim()}
      title={`توليد بـ ${getAIProviderName()}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          {retryCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {retryCount}
            </span>
          )}
        </div>
      ) : (
        <Sparkles className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
};

export default AIGenerateButton;
