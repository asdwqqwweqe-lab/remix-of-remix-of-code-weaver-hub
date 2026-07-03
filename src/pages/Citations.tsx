import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BookMarked, Plus, Trash2, Edit3, Download, Search, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCitations, fetchFromDOI, exportBibtex, toBibtex,
  CITATION_TYPES, type Citation, type CitationInsert,
} from '@/hooks/useCitations';

const empty: CitationInsert = {
  title: '', authors: '', year: null, journal: '', publisher: '',
  doi: '', url: '', note: '', citation_type: 'article', tags: [],
};

export default function CitationsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { items, loading, add, update, remove } = useCitations();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Citation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CitationInsert>(empty);
  const [doi, setDoi] = useState('');
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(c =>
      (typeFilter === 'all' || c.citation_type === typeFilter) &&
      (!q ||
        c.title.toLowerCase().includes(q) ||
        (c.authors ?? '').toLowerCase().includes(q) ||
        (c.doi ?? '').toLowerCase().includes(q))
    );
  }, [items, search, typeFilter]);

  const openNew = () => { setEditing(null); setForm(empty); setDoi(''); setDialogOpen(true); };
  const openEdit = (c: Citation) => {
    setEditing(c);
    setForm({
      title: c.title, authors: c.authors ?? '', year: c.year,
      journal: c.journal ?? '', publisher: c.publisher ?? '',
      doi: c.doi ?? '', url: c.url ?? '', note: c.note ?? '',
      citation_type: c.citation_type, tags: c.tags ?? [],
    });
    setDialogOpen(true);
  };

  const handleImportDOI = async () => {
    if (!doi.trim()) return;
    setImporting(true);
    try {
      const meta = await fetchFromDOI(doi);
      setForm(f => ({ ...f, ...meta }));
      toast.success(isAr ? 'تم جلب بيانات المرجع' : 'Fetched');
    } catch (e: any) {
      toast.error(e.message);
    } finally { setImporting(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error(isAr ? 'العنوان مطلوب' : 'Title required'); return; }
    try {
      if (editing) {
        await update(editing.id, form);
        toast.success(isAr ? 'تم التحديث' : 'Updated');
      } else {
        await add(form);
        toast.success(isAr ? 'تمت الإضافة' : 'Added');
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'حذف هذا المرجع؟' : 'Delete this citation?')) return;
    await remove(id);
    toast.success(isAr ? 'تم الحذف' : 'Deleted');
  };

  const handleExportAll = () => {
    const bib = exportBibtex(filtered);
    const blob = new Blob([bib], { type: 'text/x-bibtex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'citations.bib'; a.click();
    URL.revokeObjectURL(url);
    toast.success(isAr ? 'تم التصدير' : 'Exported');
  };

  const copyBibtex = async (c: Citation) => {
    await navigator.clipboard.writeText(toBibtex(c));
    toast.success('BibTeX copied');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookMarked className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{isAr ? 'مدير المراجع' : 'Citations Manager'}</h1>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAll} disabled={!filtered.length}>
            <Download className="w-4 h-4 mr-2" />BibTeX
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />{isAr ? 'مرجع جديد' : 'New'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
          <Input
            className="ps-9"
            placeholder={isAr ? 'ابحث بالعنوان، المؤلف، DOI…' : 'Search title, author, DOI…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? 'كل الأنواع' : 'All types'}</SelectItem>
            {CITATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin w-6 h-6" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          {isAr ? 'لا توجد مراجع بعد. أضف الأول!' : 'No citations yet.'}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-2">
                      {c.authors && <span>{c.authors}</span>}
                      {c.year && <span>· {c.year}</span>}
                      {c.journal && <span>· <em>{c.journal}</em></span>}
                      <Badge variant="outline" className="ml-1">{c.citation_type}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={c.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => copyBibtex(c)} title="Copy BibTeX">
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(c.note || c.doi) && (
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  {c.doi && <div>DOI: <code>{c.doi}</code></div>}
                  {c.note && <div className="mt-1">{c.note}</div>}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? (isAr ? 'تعديل مرجع' : 'Edit') : (isAr ? 'مرجع جديد' : 'New citation')}</DialogTitle>
          </DialogHeader>

          {!editing && (
            <div className="p-3 border rounded-md bg-muted/30 space-y-2">
              <Label className="text-xs">{isAr ? 'استيراد سريع من DOI' : 'Quick import from DOI'}</Label>
              <div className="flex gap-2">
                <Input placeholder="10.1000/xyz123" value={doi} onChange={e => setDoi(e.target.value)} />
                <Button onClick={handleImportDOI} disabled={importing || !doi.trim()}>
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? 'جلب' : 'Fetch')}
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 space-y-1">
              <Label>{isAr ? 'العنوان *' : 'Title *'}</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'المؤلفون' : 'Authors'} <span className="text-xs text-muted-foreground">(A and B)</span></Label>
              <Input value={form.authors ?? ''} onChange={e => setForm({ ...form, authors: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'السنة' : 'Year'}</Label>
              <Input type="number" value={form.year ?? ''} onChange={e => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'النوع' : 'Type'}</Label>
              <Select value={form.citation_type ?? 'article'} onValueChange={v => setForm({ ...form, citation_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'الدورية / الكتاب' : 'Journal / Book'}</Label>
              <Input value={form.journal ?? ''} onChange={e => setForm({ ...form, journal: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'الناشر' : 'Publisher'}</Label>
              <Input value={form.publisher ?? ''} onChange={e => setForm({ ...form, publisher: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>DOI</Label>
              <Input value={form.doi ?? ''} onChange={e => setForm({ ...form, doi: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>URL</Label>
              <Input value={form.url ?? ''} onChange={e => setForm({ ...form, url: e.target.value })} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label>{isAr ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea rows={3} value={form.note ?? ''} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleSave}>{isAr ? 'حفظ' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
