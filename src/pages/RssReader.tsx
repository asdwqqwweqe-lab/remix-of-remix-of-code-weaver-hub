import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Newspaper, Loader2, Sparkles, ExternalLink, Save, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBlogStore } from '@/store/blogStore';
import { useNavigate } from 'react-router-dom';

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

const STORAGE_URLS = 'rss-reader-urls-v1';
const STORAGE_ITEMS = 'rss-reader-items-v1';
const STORAGE_SUMS = 'rss-reader-sums-v1';

const stripHtml = (s: string) =>
  s.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function fetchRss(url: string): Promise<RssItem[]> {
  // Use a public CORS proxy that returns raw XML
  const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxied);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const channel = doc.querySelector('channel > title')?.textContent ?? url;

  // RSS 2.0
  const rss = Array.from(doc.querySelectorAll('item')).map((it) => ({
    title: it.querySelector('title')?.textContent?.trim() ?? '',
    link: it.querySelector('link')?.textContent?.trim() ?? '',
    pubDate: it.querySelector('pubDate')?.textContent?.trim() ?? '',
    description: stripHtml(it.querySelector('description')?.textContent ?? ''),
    source: channel,
  }));
  if (rss.length > 0) return rss;

  // Atom fallback
  const feedTitle = doc.querySelector('feed > title')?.textContent ?? url;
  return Array.from(doc.querySelectorAll('entry')).map((it) => ({
    title: it.querySelector('title')?.textContent?.trim() ?? '',
    link: it.querySelector('link')?.getAttribute('href') ?? '',
    pubDate: it.querySelector('updated')?.textContent ?? it.querySelector('published')?.textContent ?? '',
    description: stripHtml(it.querySelector('summary')?.textContent ?? it.querySelector('content')?.textContent ?? ''),
    source: feedTitle,
  }));
}

export default function RssReader() {
  const [urls, setUrls] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_URLS) || '[]'); } catch { return []; }
  });
  const [items, setItems] = useState<RssItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_ITEMS) || '[]'); } catch { return []; }
  });
  const [sums, setSums] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_SUMS) || '{}'); } catch { return {}; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState<string | null>(null);
  const addPost = useBlogStore((s) => s.addPost);
  const navigate = useNavigate();

  useEffect(() => { localStorage.setItem(STORAGE_URLS, JSON.stringify(urls)); }, [urls]);
  useEffect(() => { localStorage.setItem(STORAGE_ITEMS, JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem(STORAGE_SUMS, JSON.stringify(sums)); }, [sums]);

  const refresh = async (list = urls) => {
    if (list.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.allSettled(list.map(fetchRss));
      const all = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
      all.sort((a, b) => (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0));
      setItems(all.slice(0, 100));
      toast.success(`تم جلب ${all.length} مقالة`);
    } catch (e: any) {
      toast.error('فشل جلب الخلاصات');
    } finally { setLoading(false); }
  };

  const addUrl = async () => {
    const u = input.trim();
    if (!u) return;
    if (urls.includes(u)) { toast.info('الرابط موجود'); return; }
    setInput('');
    const next = [...urls, u];
    setUrls(next);
    await refresh(next);
  };

  const removeUrl = (u: string) => {
    setUrls(urls.filter((x) => x !== u));
    setItems(items.filter((i) => !i.link.includes(new URL(u).hostname)));
  };

  const summarize = async (item: RssItem) => {
    const key = item.link;
    if (sums[key]) return;
    setSummarizing(key);
    try {
      const context = `${item.title}\n\n${item.description}`;
      const res = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{ role: 'user', content: 'لخّص هذه المقالة في 3 نقاط قصيرة.' }],
          context,
          mode: 'summarize',
        },
      });
      // The edge streams SSE; supabase.functions.invoke returns raw stream as text
      const raw = typeof res.data === 'string' ? res.data : (res.data as any)?.toString?.() ?? '';
      const text = parseSseText(raw) || 'تعذّر التلخيص.';
      setSums((s) => ({ ...s, [key]: text }));
    } catch (e: any) {
      toast.error('فشل التلخيص');
    } finally { setSummarizing(null); }
  };

  const saveAsPost = (item: RssItem) => {
    const content = `${item.description}\n\n---\n\n${sums[item.link] ? `**ملخّص AI:**\n${sums[item.link]}\n\n` : ''}[المصدر](${item.link})`;
    addPost({
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-').slice(0, 80),
      summary: item.description.slice(0, 200),
      content,
      mainLanguage: 'ar' as any,
      status: 'draft' as any,
      categoryId: '',
      collectionId: '',
      isFavorite: false,
      commentsEnabled: false,
      tags: ['rss', 'imported'] as any,
      selectedTags: [],
      selectedLanguages: [],
      links: [{ label: 'المصدر', url: item.link }] as any,
      coverImage: '',
      readingTime: Math.max(1, Math.ceil(item.description.length / 1000)),
    } as any);
    toast.success('تم حفظ المقالة في المسودّات');
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Newspaper className="w-8 h-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">قارئ RSS الذكي</h1>
          <p className="text-sm text-muted-foreground">اجمع المقالات من عدة مصادر، لخّصها بالذكاء، واحفظ المهم إلى قاعدة معرفتك.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading || urls.length === 0}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ms-2">تحديث</span>
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/feed.xml"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addUrl()}
          />
          <Button onClick={addUrl}>أضف مصدراً</Button>
        </div>
        {urls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {urls.map((u) => (
              <Badge key={u} variant="secondary" className="gap-1">
                {new URL(u).hostname}
                <button onClick={() => removeUrl(u)} className="ms-1 hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-3">
        {items.length === 0 && !loading && (
          <Card className="p-12 text-center text-muted-foreground">
            أضف رابط خلاصة RSS/Atom للبدء
          </Card>
        )}
        {items.map((item, i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold leading-snug line-clamp-2">{item.title}</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.source} · {item.pubDate ? new Date(item.pubDate).toLocaleDateString('ar-EG') : ''}
                </div>
              </div>
              <a href={item.link} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="icon"><ExternalLink className="w-4 h-4" /></Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
            {sums[item.link] && (
              <div className="p-3 rounded bg-primary/5 border border-primary/20 text-sm whitespace-pre-wrap">
                <div className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ملخّص AI
                </div>
                {sums[item.link]}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm" variant="outline"
                onClick={() => summarize(item)}
                disabled={summarizing === item.link || !!sums[item.link]}
              >
                {summarizing === item.link
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Sparkles className="w-3 h-3" />}
                <span className="ms-1">{sums[item.link] ? 'ملخّص جاهز' : 'لخّص'}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => saveAsPost(item)}>
                <Save className="w-3 h-3 me-1" /> احفظ كمسودّة
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Parse SSE stream text into concatenated content deltas. */
function parseSseText(raw: string): string {
  if (!raw) return '';
  let out = '';
  for (const line of raw.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const j = JSON.parse(payload);
      const d = j?.choices?.[0]?.delta?.content ?? '';
      if (d) out += d;
    } catch { /* skip */ }
  }
  return out;
}
