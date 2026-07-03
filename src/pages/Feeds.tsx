import { useMemo, useState } from 'react';
import { Rss, Download, Copy, Check, FileCode2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  filterPostsForFeed, postsToFeed, downloadFeed, type FeedFilters,
} from '@/lib/rssBuilder';

const ALL = '__all__';

export default function Feeds() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { posts, categories, programmingLanguages, tags } = useBlogStore();

  const [filters, setFilters] = useState<FeedFilters>({
    categoryId: null, languageId: null, contentLanguage: null, tag: null,
  });
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';

  const filtered = useMemo(() => filterPostsForFeed(posts, filters), [posts, filters]);

  const feedMeta = useMemo(() => {
    const parts: string[] = [];
    if (filters.categoryId) {
      const c = categories.find(x => x.id === filters.categoryId);
      if (c) parts.push(isAr ? c.nameAr : c.nameEn);
    }
    if (filters.languageId) {
      const l = programmingLanguages.find(x => x.id === filters.languageId);
      if (l) parts.push(l.name);
    }
    if (filters.contentLanguage) parts.push(filters.contentLanguage.toUpperCase());
    if (filters.tag) parts.push('#' + filters.tag);
    const suffix = parts.length ? ' — ' + parts.join(' · ') : '';
    return {
      title: (isAr ? 'خلاصة DevTaleCraft' : 'DevTaleCraft Feed') + suffix,
      description: isAr
        ? `آخر المقالات المنشورة${suffix}`
        : `Latest published posts${suffix}`,
      filename: 'feed' + parts.map(p => '-' + p.replace(/[^a-z0-9]+/gi, '').toLowerCase()).join('') + '.xml',
    };
  }, [filters, categories, programmingLanguages, isAr]);

  const xml = useMemo(
    () => postsToFeed(filtered, {
      title: feedMeta.title,
      link: baseUrl,
      description: feedMeta.description,
      language: filters.contentLanguage ?? undefined,
    }, categories, programmingLanguages),
    [filtered, feedMeta, baseUrl, filters.contentLanguage, categories, programmingLanguages]
  );

  const copyXml = async () => {
    try {
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      toast.success(isAr ? 'تم نسخ الخلاصة' : 'Feed copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(isAr ? 'فشل النسخ' : 'Copy failed');
    }
  };

  const resetFilters = () =>
    setFilters({ categoryId: null, languageId: null, contentLanguage: null, tag: null });

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Rss className="w-7 h-7 text-orange-500" />
          {isAr ? 'خلاصات RSS' : 'RSS Feeds'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? 'أنشئ خلاصات RSS مخصصة حسب التصنيف واللغة والوسم.'
            : 'Generate custom RSS feeds filtered by category, language, and tag.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {isAr ? 'الفلاتر' : 'Filters'}
              {activeCount > 0 && <Badge variant="secondary" className="ms-auto">{activeCount}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{isAr ? 'التصنيف' : 'Category'}</Label>
              <Select
                value={filters.categoryId ?? ALL}
                onValueChange={(v) => setFilters(f => ({ ...f, categoryId: v === ALL ? null : v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{isAr ? 'كل التصنيفات' : 'All categories'}</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{isAr ? c.nameAr : c.nameEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? 'لغة البرمجة' : 'Programming Language'}</Label>
              <Select
                value={filters.languageId ?? ALL}
                onValueChange={(v) => setFilters(f => ({ ...f, languageId: v === ALL ? null : v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{isAr ? 'كل اللغات' : 'All languages'}</SelectItem>
                  {programmingLanguages.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? 'لغة المحتوى' : 'Content Language'}</Label>
              <Select
                value={filters.contentLanguage ?? ALL}
                onValueChange={(v) => setFilters(f => ({ ...f, contentLanguage: v === ALL ? null : (v as 'ar' | 'en') }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{isAr ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{isAr ? 'الوسم' : 'Tag'}</Label>
              <Select
                value={filters.tag ?? ALL}
                onValueChange={(v) => setFilters(f => ({ ...f, tag: v === ALL ? null : v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{isAr ? 'كل الوسوم' : 'All tags'}</SelectItem>
                  {tags.slice(0, 100).map(t => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" className="w-full" onClick={resetFilters} disabled={activeCount === 0}>
              {isAr ? 'مسح الفلاتر' : 'Clear filters'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">{feedMeta.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{feedMeta.description}</p>
                </div>
                <Badge variant="secondary">
                  {filtered.length} {isAr ? 'مقالاً' : 'items'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => downloadFeed(xml, feedMeta.filename)} disabled={filtered.length === 0}>
                  <Download className="w-4 h-4 me-1" />
                  {isAr ? 'تحميل XML' : 'Download XML'}
                </Button>
                <Button size="sm" variant="outline" onClick={copyXml} disabled={filtered.length === 0}>
                  {copied ? <Check className="w-4 h-4 me-1 text-emerald-500" /> : <Copy className="w-4 h-4 me-1" />}
                  {isAr ? 'نسخ XML' : 'Copy XML'}
                </Button>
              </div>

              {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-6 border rounded-md">
                  {isAr ? 'لا توجد مقالات منشورة تطابق الفلاتر.' : 'No published posts match these filters.'}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[240px] overflow-y-auto pe-1">
                  {filtered.slice(0, 20).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-sm p-2 rounded border hover:bg-accent/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      <span className="truncate flex-1">{p.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(p.createdAt).toLocaleDateString(isAr ? 'ar' : 'en')}
                      </span>
                    </div>
                  ))}
                  {filtered.length > 20 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{filtered.length - 20} {isAr ? 'أخرى' : 'more'}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode2 className="w-4 h-4" />
                {isAr ? 'معاينة XML' : 'XML Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={xml}
                className="font-mono text-xs h-[320px]"
                dir="ltr"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
