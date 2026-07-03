import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Languages, Expand, Minimize, WandSparkles } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Mode = 'rewrite' | 'translate' | 'expand' | 'summarize';

const PROMPTS: Record<Mode, string> = {
  rewrite: 'أعد صياغة النص التالي بأسلوب واضح واحترافي مع الحفاظ على المعنى واللغة. أخرج النص الجديد فقط بدون شرح.',
  translate: 'ترجم النص التالي: إن كان بالعربية فترجمه للإنجليزية، وإن كان بلغة أخرى فترجمه للعربية. أخرج الترجمة فقط.',
  expand: 'وسّع النص التالي إلى فقرة أكثر تفصيلاً مع أمثلة عملية إن أمكن، بنفس اللغة. أخرج النص الموسّع فقط.',
  summarize: 'لخّص النص التالي في جملة أو جملتين بنفس اللغة. أخرج التلخيص فقط.',
};

export default function InlineAIBubble({ editor }: { editor: Editor }) {
  const [busy, setBusy] = useState<Mode | null>(null);

  const run = async (mode: Mode) => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '\n');
    if (!text || text.trim().length < 2) {
      toast.error('اختر نصًا أولاً');
      return;
    }
    setBusy(mode);
    try {
      const res = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: `${PROMPTS[mode]}\n\n---\n${text}` }],
          mode: 'chat',
        },
      });
      if (res.error) throw res.error;
      const raw = typeof res.data === 'string' ? res.data : (res.data as any)?.toString?.() ?? '';
      let out = '';
      for (const line of raw.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const p = line.slice(5).trim();
        if (!p || p === '[DONE]') continue;
        try { out += JSON.parse(p)?.choices?.[0]?.delta?.content ?? ''; } catch { /**/ }
      }
      out = out.trim();
      if (!out) { toast.error('لم يصل ردّ'); return; }
      editor.chain().focus().insertContentAt({ from, to }, out).run();
      toast.success('تم');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('402')) toast.error('الرصيد نفد');
      else if (msg.includes('429')) toast.error('تم تجاوز حد الطلبات');
      else toast.error('فشل الطلب');
    } finally {
      setBusy(null);
    }
  };

  const Btn = ({ mode, icon: Icon, label }: { mode: Mode; icon: any; label: string }) => (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-8 gap-1 px-2 text-xs"
      disabled={busy !== null}
      onClick={() => run(mode)}
    >
      {busy === mode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </Button>
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      shouldShow={({ editor, from, to }) => {
        if (!editor.isEditable) return false;
        return to - from > 1;
      }}
    >
      <div className="flex items-center gap-1 rounded-lg border bg-popover px-1.5 py-1 shadow-lg">
        <div className="flex items-center gap-1 pe-1.5 border-e text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI
        </div>
        <Btn mode="rewrite" icon={WandSparkles} label="صياغة" />
        <Btn mode="translate" icon={Languages} label="ترجمة" />
        <Btn mode="expand" icon={Expand} label="توسيع" />
        <Btn mode="summarize" icon={Minimize} label="تلخيص" />
      </div>
    </BubbleMenu>
  );
}
