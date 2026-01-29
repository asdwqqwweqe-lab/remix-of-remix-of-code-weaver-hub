import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Sparkles } from 'lucide-react';
import StreamingText from './StreamingText';
import { streamAI, getAIProviderName } from '@/lib/ai-service';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from 'sonner';

interface AIStreamingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  systemPrompt?: string;
  title?: string;
  onAccept?: (content: string) => void;
  onReject?: () => void;
}

// Sound effects
const playSuccessSound = () => {
  const settings = useSettingsStore.getState().settings;
  if (!settings.soundNotificationsEnabled) return;
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Audio not supported
  }
};

const AIStreamingDialog = ({
  open,
  onOpenChange,
  prompt,
  systemPrompt = 'أنت مساعد ذكي مفيد. أجب بوضوح واختصار.',
  title = 'توليد بالذكاء الاصطناعي',
  onAccept,
  onReject,
}: AIStreamingDialogProps) => {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const providerName = getAIProviderName();

  const startStreaming = useCallback(async () => {
    setStreamedText('');
    setIsStreaming(true);
    setIsComplete(false);
    setIsError(false);
    setErrorMessage('');

    try {
      await streamAI(
        prompt,
        systemPrompt,
        (chunk) => {
          setStreamedText((prev) => prev + chunk);
        },
        () => {
          setIsStreaming(false);
          setIsComplete(true);
          playSuccessSound();
        }
      );
    } catch (error) {
      setIsStreaming(false);
      setIsError(true);
      setErrorMessage(
        error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      );
      toast.error('فشل التوليد');
    }
  }, [prompt, systemPrompt]);

  // Start streaming when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isStreaming && !isComplete) {
      startStreaming();
    }
    if (!newOpen) {
      // Reset state when closing
      setStreamedText('');
      setIsStreaming(false);
      setIsComplete(false);
      setIsError(false);
    }
    onOpenChange(newOpen);
  };

  const handleAccept = () => {
    if (streamedText && onAccept) {
      onAccept(streamedText);
      toast.success('تم تطبيق المحتوى');
    }
    onOpenChange(false);
  };

  const handleReject = () => {
    onReject?.();
    onOpenChange(false);
  };

  const handleRetry = () => {
    startStreaming();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <StreamingText
          text={streamedText}
          isStreaming={isStreaming}
          isComplete={isComplete}
          isError={isError}
          errorMessage={errorMessage}
          providerName={providerName}
          className="my-4"
        />

        <DialogFooter className="gap-2 sm:gap-0">
          {isError && (
            <Button variant="outline" onClick={handleRetry} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isStreaming}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            إلغاء
          </Button>
          
          <Button
            onClick={handleAccept}
            disabled={isStreaming || !streamedText || isError}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            قبول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIStreamingDialog;
