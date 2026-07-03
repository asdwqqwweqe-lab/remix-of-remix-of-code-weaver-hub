import { useEffect, useMemo, useState, useCallback } from 'react';
import { Users2, Search, Heart, Copy, Trash2, Code2, Sparkles, RefreshCcw, Loader2, Share2, User as UserIcon, Image as ImageIcon, MessageCircle } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import {
  listSharedSnippets, listMyPublications, toggleLike, unpublishSnippet,
  listSharedGallery, listMyGalleryPublications, toggleGalleryLike, unpublishGalleryItem,
  type SharedSnippet, type SharedGalleryItem,
} from '@/lib/sharedLibraryService';
import { countComments } from '@/lib/sharedCommentsService';
import CommentsDialog from '@/components/library/CommentsDialog';

function Highlighted({ code, language }: { code: string; language?: string | null }) {
  const html = useMemo(() => {
    try {
      if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language }).value;
      }
      return hljs.highlightAuto(code).value;
    } catch {
      return code;
    }
  }, [code, language]);
  return (
    <pre className="text-xs bg-muted/60 rounded-md p-3 overflow-x-auto max-h-64" dir="ltr">
      <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  );
}

function AuthorLine({ name, date, extra }: { name: string; date: string; extra?: React.ReactNode }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  return (
    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
      <UserIcon className="w-3 h-3" />
      <span className="truncate">{name || (isAr ? 'مستخدم' : 'user')}</span>
      <span>·</span>
      <span>{new Date(date).toLocaleDateString(isAr ? 'ar' : 'en')}</span>
      {extra}
    </div>
  );
}

function SnippetCard({
  item, liked, liveCount, commentsCount, isMine, onLike, onClone, onUnpublish, onComments,
}: {
  item: SharedSnippet; liked: boolean; liveCount: number; commentsCount: number; isMine: boolean;
  onLike: () => void; onClone: () => void; onUnpublish?: () => void; onComments: () => void;
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
            <AuthorLine
              name={item.author_name ?? ''}
              date={item.created_at}
              extra={item.language ? (<><span>·</span><Badge variant="secondary" className="h-5 py-0 px-1.5 text-[10px]">{item.language}</Badge></>) : null}
            />
          </div>
          {isMine && <Badge variant="outline">{isAr ? 'ملكك' : 'yours'}</Badge>}
        </div>
        {item.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{item.description}</p>}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <Highlighted code={item.code} language={item.language} />
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 5).map(t => <Badge key={t} variant="outline" className="text-[10px] h-5">{t}</Badge>)}
          </div>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          <Button size="sm" variant={liked ? 'default' : 'outline'} onClick={onLike} className="gap-1">
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /><span>{liveCount}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onComments} className="gap-1">
            <MessageCircle className="w-4 h-4" /><span>{commentsCount}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onClone} className="gap-1">
            <Copy className="w-4 h-4" />{isAr ? 'استيراد' : 'Clone'}
          </Button>
          {isMine && onUnpublish && (
            <Button size="sm" variant="ghost" className="ms-auto text-destructive" onClick={onUnpublish}><Trash2 className="w-4 h-4" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GalleryCard({
  item, liked, liveCount, commentsCount, isMine, onLike, onClone, onUnpublish, onComments,
}: {
  item: SharedGalleryItem; liked: boolean; liveCount: number; commentsCount: number; isMine: boolean;
  onLike: () => void; onClone: () => void; onUnpublish?: () => void; onComments: () => void;
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative bg-muted/40 aspect-video">
        <img src={item.image_url} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
        {isMine && <Badge variant="outline" className="absolute top-2 end-2 bg-background/80 backdrop-blur">{isAr ? 'ملكك' : 'yours'}</Badge>}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
        <AuthorLine
          name={item.author_name ?? ''}
          date={item.created_at}
          extra={item.category ? (<><span>·</span><Badge variant="secondary" className="h-5 py-0 px-1.5 text-[10px]">{item.category}</Badge></>) : null}
        />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {item.description && <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 5).map(t => <Badge key={t} variant="outline" className="text-[10px] h-5">{t}</Badge>)}
          </div>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
          <Button size="sm" variant={liked ? 'default' : 'outline'} onClick={onLike} className="gap-1">
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /><span>{liveCount}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onComments} className="gap-1">
            <MessageCircle className="w-4 h-4" /><span>{commentsCount}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onClone} className="gap-1">
            <Copy className="w-4 h-4" />{isAr ? 'استيراد' : 'Clone'}
          </Button>
          {isMine && onUnpublish && (
            <Button size="sm" variant="ghost" className="ms-auto text-destructive" onClick={onUnpublish}><Trash2 className="w-4 h-4" /></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SharedLibrary() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { programmingLanguages, addSnippet, addGalleryImage } = useBlogStore();

  const [section, setSection] = useState<'snippets' | 'gallery'>('snippets');
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string>('__all__');
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // Snippets state
  const [items, setItems] = useState<SharedSnippet[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [liveCounts, setLiveCounts] = useState<Map<string, number>>(new Map());
  const [mine, setMine] = useState<SharedSnippet[]>([]);

  // Gallery state
  const [gItems, setGItems] = useState<SharedGalleryItem[]>([]);
  const [gLikedIds, setGLikedIds] = useState<Set<string>>(new Set());
  const [gLiveCounts, setGLiveCounts] = useState<Map<string, number>>(new Map());
  const [gMine, setGMine] = useState<SharedGalleryItem[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data?.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => setUid(sess?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (section === 'snippets') {
        const res = await listSharedSnippets({
          search: search.trim() || undefined,
          language: langFilter === '__all__' ? undefined : langFilter,
          sort,
        });
        setItems(res.items); setLikedIds(res.likedIds); setLiveCounts(res.liveCounts);
        if (uid) setMine(await listMyPublications());
      } else {
        const res = await listSharedGallery({
          search: search.trim() || undefined,
          sort,
        });
        setGItems(res.items); setGLikedIds(res.likedIds); setGLiveCounts(res.liveCounts);
        if (uid) setGMine(await listMyGalleryPublications());
      }
    } catch (e) {
      toast.error((e as Error).message || (isAr ? 'فشل التحميل' : 'Load failed'));
    } finally {
      setLoading(false);
    }
  }, [section, search, langFilter, sort, uid, isAr]);

  useEffect(() => { load(); }, [load]);

  // ---- Snippet handlers ----
  const handleLike = async (item: SharedSnippet) => {
    if (!uid) { toast.error(isAr ? 'سجل الدخول أولاً' : 'Sign in first'); return; }
    const wasLiked = likedIds.has(item.id);
    const nl = new Set(likedIds); const nc = new Map(liveCounts);
    if (wasLiked) { nl.delete(item.id); nc.set(item.id, Math.max(0, (nc.get(item.id) ?? 0) - 1)); }
    else { nl.add(item.id); nc.set(item.id, (nc.get(item.id) ?? 0) + 1); }
    setLikedIds(nl); setLiveCounts(nc);
    try { await toggleLike(item.id, wasLiked); } catch (e) { toast.error((e as Error).message); load(); }
  };

  const handleClone = (item: SharedSnippet) => {
    const langId = programmingLanguages.find(l => l.name.toLowerCase() === (item.language ?? '').toLowerCase())?.id
      ?? programmingLanguages[0]?.id ?? '';
    addSnippet({ title: item.title, description: item.description ?? '', code: item.code, languageId: langId });
    toast.success(isAr ? 'تمت إضافته إلى مكتبتك' : 'Added to your snippets');
  };

  const handleUnpublish = async (item: SharedSnippet) => {
    if (!confirm(isAr ? 'إلغاء نشر هذا المقطع؟' : 'Unpublish this snippet?')) return;
    try { await unpublishSnippet(item.id); toast.success(isAr ? 'تم إلغاء النشر' : 'Unpublished'); load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  // ---- Gallery handlers ----
  const handleGalleryLike = async (item: SharedGalleryItem) => {
    if (!uid) { toast.error(isAr ? 'سجل الدخول أولاً' : 'Sign in first'); return; }
    const wasLiked = gLikedIds.has(item.id);
    const nl = new Set(gLikedIds); const nc = new Map(gLiveCounts);
    if (wasLiked) { nl.delete(item.id); nc.set(item.id, Math.max(0, (nc.get(item.id) ?? 0) - 1)); }
    else { nl.add(item.id); nc.set(item.id, (nc.get(item.id) ?? 0) + 1); }
    setGLikedIds(nl); setGLiveCounts(nc);
    try { await toggleGalleryLike(item.id, wasLiked); } catch (e) { toast.error((e as Error).message); load(); }
  };

  const handleGalleryClone = (item: SharedGalleryItem) => {
    addGalleryImage({
      dataUrl: item.image_url,
      caption: item.title,
      description: item.description ?? '',
      tags: item.tags ?? [],
    });
    toast.success(isAr ? 'تمت إضافته إلى معرضك' : 'Added to your gallery');
  };

  const handleGalleryUnpublish = async (item: SharedGalleryItem) => {
    if (!confirm(isAr ? 'إلغاء نشر هذا العنصر؟' : 'Unpublish this item?')) return;
    try { await unpublishGalleryItem(item.id); toast.success(isAr ? 'تم إلغاء النشر' : 'Unpublished'); load(); }
    catch (e) { toast.error((e as Error).message); }
  };

  const displayedSnippets = tab === 'browse' ? items : mine;
  const displayedGallery = tab === 'browse' ? gItems : gMine;
  const isEmpty = section === 'snippets' ? displayedSnippets.length === 0 : displayedGallery.length === 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Users2 className="w-7 h-7 text-primary" />
            {isAr ? 'المكتبة المشتركة' : 'Shared Library'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'تصفح ما شاركه الآخرون من مقاطع وصور، وأضف أعمالك للمجتمع.' : 'Browse snippets and gallery items shared by others, contribute your own.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <RefreshCcw className="w-4 h-4 me-1" />}
          {isAr ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <Tabs value={section} onValueChange={(v) => { setSection(v as 'snippets' | 'gallery'); setSearch(''); }}>
        <TabsList>
          <TabsTrigger value="snippets" className="gap-1"><Code2 className="w-4 h-4" />{isAr ? 'مقاطع الكود' : 'Snippets'}</TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1"><ImageIcon className="w-4 h-4" />{isAr ? 'المعرض' : 'Gallery'}</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'browse' | 'mine')}>
        <TabsList>
          <TabsTrigger value="browse">{isAr ? 'تصفح' : 'Browse'}</TabsTrigger>
          <TabsTrigger value="mine" className="gap-1">
            <Share2 className="w-4 h-4" />
            {isAr ? 'منشوراتي' : 'My Publications'}
            {uid && (section === 'snippets' ? mine.length : gMine.length) > 0 && ` (${section === 'snippets' ? mine.length : gMine.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className={`grid grid-cols-1 md:grid-cols-[1fr_${section === 'snippets' ? '180px_' : ''}160px] gap-2`}>
                <div className="relative">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="ps-9"
                    placeholder={isAr ? 'ابحث بالعنوان أو الوصف…' : 'Search by title or description…'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {section === 'snippets' && (
                  <Select value={langFilter} onValueChange={setLangFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{isAr ? 'كل اللغات' : 'All languages'}</SelectItem>
                      {programmingLanguages.map(l => <SelectItem key={l.id} value={l.name.toLowerCase()}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Select value={sort} onValueChange={(v) => setSort(v as 'recent' | 'popular')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">{isAr ? 'الأحدث' : 'Recent'}</SelectItem>
                    <SelectItem value="popular">
                      <div className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />{isAr ? 'الأكثر إعجاباً' : 'Popular'}</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          {!uid && (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
              {isAr ? 'سجّل الدخول لرؤية منشوراتك.' : 'Sign in to see your publications.'}
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : isEmpty ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          {tab === 'browse'
            ? (isAr ? 'لا توجد نتائج مطابقة.' : 'No matching items.')
            : section === 'snippets'
              ? (isAr ? 'لم تنشر أي مقطع بعد. استخدم زر "مشاركة" في Snippets.' : 'You haven\'t published any snippet yet. Use the Share button in Snippets.')
              : (isAr ? 'لم تنشر أي صورة بعد. استخدم زر "مشاركة" في Gallery.' : 'You haven\'t published any image yet. Use the Share button in Gallery.')}
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {section === 'snippets'
            ? displayedSnippets.map(item => (
                <SnippetCard
                  key={item.id} item={item}
                  liked={likedIds.has(item.id)}
                  liveCount={liveCounts.get(item.id) ?? item.likes_count ?? 0}
                  isMine={uid === item.user_id}
                  onLike={() => handleLike(item)}
                  onClone={() => handleClone(item)}
                  onUnpublish={uid === item.user_id ? () => handleUnpublish(item) : undefined}
                />
              ))
            : displayedGallery.map(item => (
                <GalleryCard
                  key={item.id} item={item}
                  liked={gLikedIds.has(item.id)}
                  liveCount={gLiveCounts.get(item.id) ?? item.likes_count ?? 0}
                  isMine={uid === item.user_id}
                  onLike={() => handleGalleryLike(item)}
                  onClone={() => handleGalleryClone(item)}
                  onUnpublish={uid === item.user_id ? () => handleGalleryUnpublish(item) : undefined}
                />
              ))}
        </div>
      )}
    </div>
  );
}
