import { useEffect, useState } from 'react';
import { MessageCircle, Send, Loader2, Trash2, User as UserIcon } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  listComments, addComment, deleteComment, type SharedItemComment,
} from '@/lib/sharedCommentsService';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemType: 'snippet' | 'gallery';
  itemId: string;
  title: string;
  onCountChange?: (n: number) => void;
}

export default function CommentsDialog({
  open, onOpenChange, itemType, itemId, title, onCountChange,
}: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [comments, setComments] = useState<SharedItemComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data?.user?.id ?? null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listComments(itemType, itemId)
      .then((c) => { setComments(c); onCountChange?.(c.length); })
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, [open, itemType, itemId, onCountChange]);

  const submit = async () => {
    if (!uid) { toast.error(isAr ? 'سجّل الدخول أولاً' : 'Sign in first'); return; }
    if (!body.trim()) return;
    setSending(true);
    try {
      const c = await addComment(itemType, itemId, body);
      const next = [...comments, c];
      setComments(next);
      onCountChange?.(next.length);
      setBody('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(isAr ? 'حذف هذا التعليق؟' : 'Delete this comment?')) return;
    try {
      await deleteComment(id);
      const next = comments.filter(c => c.id !== id);
      setComments(next);
      onCountChange?.(next.length);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {isAr ? 'تعليقات' : 'Comments'}
            <span className="text-sm font-normal text-muted-foreground truncate">· {title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {isAr ? 'لا توجد تعليقات بعد. كن أول من يعلّق!' : 'No comments yet. Be the first!'}
            </div>
          ) : comments.map(c => (
            <div key={c.id} className="rounded-lg border bg-card/50 p-3">
              <div className="flex items-center justify-between gap-2 mb-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3" />
                  <span>{c.author_name || (isAr ? 'مستخدم' : 'user')}</span>
                  <span>·</span>
                  <span>{new Date(c.created_at).toLocaleString(isAr ? 'ar' : 'en')}</span>
                </div>
                {uid === c.user_id && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(c.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{c.body}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t">
          {!uid ? (
            <p className="text-xs text-muted-foreground text-center">
              {isAr ? 'سجّل الدخول لإضافة تعليق.' : 'Sign in to post a comment.'}
            </p>
          ) : (
            <>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={isAr ? 'اكتب تعليقك…' : 'Write your comment…'}
                rows={3}
                maxLength={2000}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{body.length}/2000</span>
                <Button size="sm" onClick={submit} disabled={sending || !body.trim()} className="gap-1">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isAr ? 'نشر' : 'Post'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
