import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, ShieldAlert, CheckCircle2, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  line: number | null;
  title: string;
  description: string;
  suggestion: string;
}
interface Review {
  summary?: string;
  score?: number;
  issues?: Issue[];
  improvements?: string[];
  security?: string[];
  complexity?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  code: string;
  language: string;
}

const severityColor = (s: string) =>
  s === 'high' ? 'destructive' : s === 'medium' ? 'default' : 'secondary';

export default function AICodeReviewDialog({ open, onOpenChange, title, code, language }: Props) {
  const { language: uiLang } = useLanguage();
  const isAr = uiLang === 'ar';
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

  const run = async () => {
    setLoading(true);
    setReview(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-code-review', {
        body: { code, language, uiLanguage: isAr ? 'ar' : 'en' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReview(data);
    } catch (e: any) {
      toast.error(e?.message || (isAr ? 'فشل التحليل' : 'Analysis failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) setReview(null); onOpenChange(o); }}
    >
      <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {isAr ? 'مراجعة الذكاء الاصطناعي للكود' : 'AI Code Review'}
            <Badge variant="secondary" className="ms-2">{language || 'text'}</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{title}</p>
        </DialogHeader>

        {!review && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Sparkles className="w-12 h-12 text-primary/60" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {isAr
                ? 'سيقوم الذكاء الاصطناعي بتحليل الكود واكتشاف المشاكل، اقتراح التحسينات، ومراجعة الأمان.'
                : 'AI will analyze your code, detect issues, suggest improvements, and review security.'}
            </p>
            <Button onClick={run}>
              <Sparkles className="w-4 h-4 me-1" />
              {isAr ? 'ابدأ المراجعة' : 'Start Review'}
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isAr ? 'جارٍ التحليل…' : 'Analyzing…'}
            </p>
          </div>
        )}

        {review && (
          <ScrollArea className="flex-1 pe-3">
            <div className="space-y-4">
              {typeof review.score === 'number' && (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">
                      {isAr ? 'التقييم' : 'Score'}:
                    </span>
                  </div>
                  <div className="text-2xl font-bold">{review.score}/10</div>
                  {review.complexity && (
                    <Badge variant="outline" className="ms-auto">
                      <Zap className="w-3 h-3 me-1" />
                      {review.complexity}
                    </Badge>
                  )}
                </div>
              )}

              {review.summary && (
                <div className="p-3 rounded-lg border">
                  <h3 className="text-sm font-semibold mb-1">{isAr ? 'ملخص' : 'Summary'}</h3>
                  <p className="text-sm text-muted-foreground">{review.summary}</p>
                </div>
              )}

              {review.issues && review.issues.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    {isAr ? 'مشاكل' : 'Issues'} ({review.issues.length})
                  </h3>
                  <div className="space-y-2">
                    {review.issues.map((iss, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={severityColor(iss.severity) as any}>
                            {iss.severity}
                          </Badge>
                          {iss.line != null && (
                            <Badge variant="outline">{isAr ? 'سطر' : 'line'} {iss.line}</Badge>
                          )}
                          <span className="font-medium text-sm">{iss.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{iss.description}</p>
                        {iss.suggestion && (
                          <p className="text-sm">
                            <span className="font-semibold">{isAr ? 'اقتراح: ' : 'Fix: '}</span>
                            {iss.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {review.improvements && review.improvements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    {isAr ? 'تحسينات مقترحة' : 'Improvements'}
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                    {review.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              )}

              {review.security && review.security.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-destructive" />
                    {isAr ? 'ملاحظات أمنية' : 'Security'}
                  </h3>
                  <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                    {review.security.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={run} disabled={loading}>
                  <Sparkles className="w-4 h-4 me-1" />
                  {isAr ? 'أعِد المراجعة' : 'Re-analyze'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
