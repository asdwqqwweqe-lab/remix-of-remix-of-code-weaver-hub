import { useEffect, useState } from 'react';
import { Share2, Copy, ExternalLink, Trash2, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Post } from '@/types/blog';

interface Props { post: Post; }

interface ShareRow {
  id: string;
  token: string;
  view_count: number;
  revoked: boolean;
  created_at: string;
}

function makeToken(len = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

function shareUrl(token: string) {
  return `${window.location.origin}/share/post/${token}`;
}

export default function PublicShareButton({ post }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setRows([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('public_post_shares')
      .select('id, token, view_count, revoked, created_at')
      .eq('post_id', post.id)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open]);

  const createShare = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(isAr ? 'سجّل الدخول لإنشاء رابط مشاركة' : 'Sign in to create a share link');
        return;
      }
      const snapshot = {
        title: post.title,
        summary: post.summary,
        content: post.content,
        tags: post.tags,
        mainLanguage: post.mainLanguage,
        updatedAt: new Date(post.updatedAt).toISOString(),
        capturedAt: new Date().toISOString(),
      };
      const token = makeToken();
      const { error } = await supabase.from('public_post_shares').insert({
        token, post_id: post.id, snapshot, created_by: user.id,
      });
      if (error) throw error;
      await navigator.clipboard.writeText(shareUrl(token)).catch(() => {});
      toast.success(isAr ? 'أُنشئ الرابط ونُسخ' : 'Link created and copied');
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from('public_post_shares')
      .update({ revoked: true }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(isAr ? 'أُلغي الرابط' : 'Link revoked');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('public_post_shares').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(isAr ? 'حُذف' : 'Deleted');
    load();
  };

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(shareUrl(token));
    toast.success(isAr ? 'نُسخ الرابط' : 'Link copied');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Share2 className="w-4 h-4" />
          {isAr ? 'مشاركة' : 'Share'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {isAr ? 'مشاركة عامة (للقراءة فقط)' : 'Public Share (read-only)'}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? 'أنشئ رابطاً يفتحه أي شخص دون تسجيل دخول. يعرض لقطة من المقال وقت الإنشاء.'
              : 'Create a link anyone can open without signing in. It shows a snapshot from creation time.'}
          </DialogDescription>
        </DialogHeader>

        <Button onClick={createShare} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}
          {isAr ? 'إنشاء رابط جديد' : 'Create new link'}
        </Button>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {rows.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {isAr ? 'لا روابط بعد.' : 'No links yet.'}
            </p>
          )}
          {rows.map(r => (
            <div key={r.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
              <Input readOnly value={shareUrl(r.token)}
                     className={`h-8 text-xs ${r.revoked ? 'line-through opacity-50' : ''}`} />
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Eye className="w-3 h-3" /> {r.view_count}
              </span>
              <Button size="icon" variant="ghost" className="h-7 w-7"
                      disabled={r.revoked} onClick={() => copy(r.token)}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7"
                      disabled={r.revoked}
                      onClick={() => window.open(shareUrl(r.token), '_blank')}>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
              {!r.revoked ? (
                <Button size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => revoke(r.id)}>
                  {isAr ? 'إلغاء' : 'Revoke'}
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                        onClick={() => remove(r.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
