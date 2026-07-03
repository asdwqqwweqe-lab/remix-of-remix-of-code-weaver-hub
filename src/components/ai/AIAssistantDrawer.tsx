import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, Trash2, X, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'ai-assistant-messages';
const CONTEXT_KEY = 'ai-assistant-context';

interface Msg { id: string; role: 'user' | 'assistant'; content: string; }

// Global helper — pages can seed context (e.g. current post text)
export function setAIContext(text: string | null) {
  if (text) sessionStorage.setItem(CONTEXT_KEY, text);
  else sessionStorage.removeItem(CONTEXT_KEY);
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const load = (): Msg[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};

export default function AIAssistantDrawer({ open, onOpenChange }: Props) {
  const { language, isRTL } = useLanguage();
  const location = useLocation();
  const [messages, setMessages] = useState<Msg[]>(load);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); }, [messages]);

  useEffect(() => {
    if (open) {
      const c = sessionStorage.getItem(CONTEXT_KEY);
      setContext(c);
    }
  }, [open, location.pathname]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (userText: string, mode: 'chat' | 'summarize' | 'improve' | 'quiz' = 'chat') => {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const assistantMsg: Msg = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: context || undefined,
          mode,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'AI error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, content: acc } : m));
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e) {
      const err = e as Error;
      if (err.name === 'AbortError') return;
      setMessages((prev) => prev.map((m) =>
        m.id === assistantMsg.id ? { ...m, content: `⚠️ ${err.message}` } : m
      ));
      toast.error(err.message);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stop = () => { abortRef.current?.abort(); setLoading(false); };
  const clear = () => { setMessages([]); toast.success(t('مُسحت المحادثة', 'Chat cleared')); };
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success(t('نُسخ', 'Copied')); };

  const quickActions = [
    { label: t('لخّص السياق', 'Summarize'), mode: 'summarize' as const, prompt: t('لخّص السياق المرفق', 'Summarize the context') },
    { label: t('اقترح تحسينات', 'Improve'), mode: 'improve' as const, prompt: t('اقترح تحسينات على السياق', 'Suggest improvements') },
    { label: t('أنشئ اختبار', 'Quiz'), mode: 'quiz' as const, prompt: t('أنشئ اختباراً من السياق', 'Create a quiz from the context') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isRTL ? 'left' : 'right'} className="w-full sm:max-w-lg flex flex-col p-0 gap-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('مساعد الذكاء الاصطناعي', 'AI Assistant')}
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={clear} title={t('مسح', 'Clear')}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </SheetTitle>
          {context && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/40 border border-border/60">
              <FileText className="w-3 h-3" />
              <span className="flex-1 truncate">
                {t('السياق نشط', 'Context active')}: {context.slice(0, 80)}…
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setContext(null); setAIContext(null); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          {context && (
            <div className="flex flex-wrap gap-1">
              {quickActions.map((a) => (
                <Button key={a.mode} variant="outline" size="sm" className="h-7 text-xs" onClick={() => send(a.prompt, a.mode)} disabled={loading}>
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" viewportRef={scrollRef as never}>
          <div ref={scrollRef} className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                {t('اسأل عن أي شيء — يمكنني تلخيص المقالات، توليد الأفكار، وشرح الكود.',
                   'Ask anything — I can summarize posts, brainstorm ideas, and explain code.')}
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`group max-w-[90%] rounded-lg px-3 py-2 text-sm relative ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {m.role === 'assistant' ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_pre]:my-2 [&_code]:text-xs"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(m.content || (loading ? '…' : '')) as string) }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  )}
                  {m.role === 'assistant' && m.content && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copy(m.content)}
                      className="absolute -top-2 -end-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background border"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('اكتب رسالتك... (Enter للإرسال، Shift+Enter لسطر جديد)', 'Type your message... (Enter to send)')}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Gemini 3 Flash</Badge>
            <div className="flex-1" />
            {loading ? (
              <Button size="sm" variant="destructive" onClick={stop}>
                <X className="w-4 h-4 me-1" />{t('إيقاف', 'Stop')}
              </Button>
            ) : (
              <Button size="sm" onClick={() => send(input)} disabled={!input.trim()}>
                <Send className="w-4 h-4 me-1" />{t('إرسال', 'Send')}
              </Button>
            )}
            {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
