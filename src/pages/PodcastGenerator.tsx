import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Headphones, Play, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts-podcast`;

export default function PodcastGenerator() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const { posts } = useBlogStore();
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [instructions, setInstructions] = useState(isAr ? 'اقرأ بنبرة هادئة واضحة كمذيع بودكاست' : 'Read in a calm clear podcast narrator tone');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  const stop = () => {
    abortRef.current?.abort();
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    setPlaying(false);
    setLoading(false);
  };

  const speak = async () => {
    if (!text.trim()) { toast.error(isAr ? 'أدخل نصاً' : 'Enter text'); return; }
    stop();
    setLoading(true);

    const ctx = new AudioContext({ sampleRate: 24000 });
    if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
    ctxRef.current = ctx;
    let playhead = 0;
    let pending = new Uint8Array(0);

    const playChunk = (incoming: Uint8Array) => {
      const bytes = new Uint8Array(pending.length + incoming.length);
      bytes.set(pending);
      bytes.set(incoming, pending.length);
      const usable = bytes.length - (bytes.length % 2);
      pending = bytes.slice(usable);
      if (usable === 0) return;
      const samples = new Int16Array(bytes.buffer.slice(0, usable));
      const floats = Float32Array.from(samples, (s) => s / 32768);
      const buffer = ctx.createBuffer(1, floats.length, 24000);
      buffer.copyToChannel(floats, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      if (playhead === 0) playhead = ctx.currentTime + 0.05;
      else playhead = Math.max(playhead, ctx.currentTime);
      source.start(playhead);
      playhead += buffer.duration;
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, instructions }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      setLoading(false);
      setPlaying(true);

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let sseBuf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        sseBuf += value ?? '';
        const parts = sseBuf.split('\n\n');
        sseBuf = parts.pop() ?? '';
        for (const evt of parts) {
          const line = evt.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          const dataStr = line.slice(5).trim();
          if (!dataStr || dataStr === '[DONE]') continue;
          try {
            const payload = JSON.parse(dataStr);
            if (payload.type === 'speech.audio.delta' && payload.audio) {
              const bin = atob(payload.audio);
              const bytes = new Uint8Array(bin.length);
              for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
              playChunk(bytes);
            }
          } catch { /* ignore */ }
        }
      }
      setTimeout(() => setPlaying(false), Math.max(0, (playhead - ctx.currentTime) * 1000));
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        toast.error((isAr ? 'فشل التوليد: ' : 'Failed: ') + (e?.message ?? String(e)));
      }
      setLoading(false);
      setPlaying(false);
    }
  };

  const loadPost = (id: string) => {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    const stripped = (p.content ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    setText(`${p.title}. ${stripped}`.slice(0, 6000));
  };

  return (
    <div className="container mx-auto py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Headphones className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{isAr ? 'مولّد البودكاست الصوتي' : 'Podcast Generator'}</h1>
        <Badge variant="outline">{isAr ? 'ذكاء اصطناعي' : 'AI'}</Badge>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select onValueChange={loadPost}>
            <SelectTrigger><SelectValue placeholder={isAr ? 'اختر مقالاً...' : 'Load a post...'} /></SelectTrigger>
            <SelectContent>
              {posts.slice(0, 50).map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={instructions} onChange={(e) => setInstructions(e.target.value)}
                 placeholder={isAr ? 'إرشادات النبرة' : 'Voice instructions'} />
        </div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}
                  placeholder={isAr ? 'الصق النص هنا أو اختر مقالاً...' : 'Paste text or pick a post...'} />
        <div className="flex gap-2">
          {!playing && !loading && (
            <Button onClick={speak}><Play className="w-4 h-4 me-2" />{isAr ? 'تشغيل' : 'Generate & Play'}</Button>
          )}
          {loading && (
            <Button disabled><Loader2 className="w-4 h-4 me-2 animate-spin" />{isAr ? 'جاري التوليد...' : 'Generating...'}</Button>
          )}
          {playing && (
            <Button variant="destructive" onClick={stop}><Square className="w-4 h-4 me-2" />{isAr ? 'إيقاف' : 'Stop'}</Button>
          )}
          <span className="text-xs text-muted-foreground self-center">
            {text.length} {isAr ? 'حرف' : 'chars'} • max 8000
          </span>
        </div>
      </Card>
    </div>
  );
}
