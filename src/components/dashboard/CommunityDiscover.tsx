import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users2, Heart, Code2, Image as ImageIcon, Sparkles, ArrowRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import {
  listSharedSnippets, listSharedGallery,
  type SharedSnippet, type SharedGalleryItem,
} from '@/lib/sharedLibraryService';

export default function CommunityDiscover() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { programmingLanguages, addSnippet, addGalleryImage } = useBlogStore();

  const [loading, setLoading] = useState(true);
  const [snippets, setSnippets] = useState<SharedSnippet[]>([]);
  const [gallery, setGallery] = useState<SharedGalleryItem[]>([]);
  const [cloningId, setCloningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [s, g] = await Promise.all([
          listSharedSnippets({ sort: 'popular', limit: 4 }),
          listSharedGallery({ sort: 'popular', limit: 4 }),
        ]);
        if (cancelled) return;
        setSnippets(s.items);
        setGallery(g.items);
      } catch {
        // silent — dashboard shouldn't block on community
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cloneSnippet = (s: SharedSnippet) => {
    setCloningId(s.id);
    const langId = programmingLanguages.find(
      l => l.name.toLowerCase() === (s.language ?? '').toLowerCase()
    )?.id ?? programmingLanguages[0]?.id ?? '';
    addSnippet({
      title: s.title,
      description: s.description ?? '',
      code: s.code,
      languageId: langId,
    });
    toast.success(isAr ? 'تمت الإضافة إلى مكتبتك' : 'Added to your snippets');
    setTimeout(() => setCloningId(null), 400);
  };

  const cloneGallery = (g: SharedGalleryItem) => {
    setCloningId(g.id);
    addGalleryImage({
      dataUrl: g.image_url,
      caption: g.title,
      description: g.description ?? '',
      tags: g.tags ?? [],
    });
    toast.success(isAr ? 'تمت الإضافة إلى معرضك' : 'Added to your gallery');
    setTimeout(() => setCloningId(null), 400);
  };

  const isEmpty = !loading && snippets.length === 0 && gallery.length === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            {isAr ? 'اكتشف من المجتمع' : 'Discover from the community'}
          </CardTitle>
          <CardDescription>
            {isAr
              ? 'أبرز ما شاركه الآخرون من مقاطع وصور — استوردها إلى مكتبتك بنقرة.'
              : 'Trending snippets and gallery items shared by others — clone with one click.'}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/library" className="gap-1">
            {isAr ? 'المكتبة' : 'Open Library'}
            <ArrowRight className={`h-4 w-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ) : isEmpty ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 opacity-60" />
            {isAr ? 'لا توجد منشورات مجتمعية بعد. كن أول من يشارك!' : 'No community publications yet. Be the first to share!'}
          </div>
        ) : (
          <>
            {snippets.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                  <Code2 className="w-4 h-4" />
                  {isAr ? 'مقاطع كود شائعة' : 'Trending snippets'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {snippets.map(s => (
                    <div key={s.id} className="rounded-lg border bg-card/50 p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm line-clamp-1">{s.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {s.author_name || (isAr ? 'مستخدم' : 'user')}
                            {s.language ? ` · ${s.language}` : ''}
                          </div>
                        </div>
                        <Badge variant="secondary" className="gap-1 shrink-0">
                          <Heart className="w-3 h-3 fill-current" />
                          {s.likes_count ?? 0}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="self-start"
                        disabled={cloningId === s.id}
                        onClick={() => cloneSnippet(s)}
                      >
                        {cloningId === s.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : (isAr ? 'استيراد' : 'Clone')}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {gallery.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  {isAr ? 'من المعرض المشترك' : 'From the shared gallery'}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gallery.map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => cloneGallery(g)}
                      disabled={cloningId === g.id}
                      className="group relative aspect-video rounded-lg overflow-hidden border bg-muted text-left disabled:opacity-70"
                      title={isAr ? 'انقر للاستيراد' : 'Click to clone'}
                    >
                      <img
                        src={g.image_url}
                        alt={g.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                        <div className="text-xs font-medium line-clamp-1">{g.title}</div>
                        <div className="text-[10px] opacity-80 flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          {g.likes_count ?? 0}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
