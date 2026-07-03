import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Ref { title: string; url?: string; note: string; }
interface Result { summary: string; keyPoints: string[]; references: Ref[]; }

export default function WebResearchDialog({ onInsert }: { onInsert?: (text: string) => void }) {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  const run = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setRes(null);
    try {
      const { data, error } = await supabase.functions.invoke('web-research', { body: { query: q, language } });
      if (error) throw error;
      setRes(data as Result);
    } catch (e: any) {
      toast.error((isAr ? 'فشل البحث: ' : 'Search failed: ') + (e?.message ?? String(e)));
    } finally { setLoading(false); }
  };

  const buildMarkdown = () => {
    if (!res) return '';
    let md = `## ${q}\n\n${res.summary}\n\n`;
    if (res.keyPoints?.length) md += `### ${isAr ? 'نقاط رئيسية' : 'Key Points'}\n` + res.keyPoints.map(p => `- ${p}`).join('\n') + '\n\n';
    if (res.references?.length) md += `### ${isAr ? 'مراجع' : 'References'}\n` + res.references.map(r => `- ${r.url ? `[${r.title}](${r.url})` : r.title} — ${r.note}`).join('\n') + '\n';
    return md;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Search className="w-4 h-4 me-2" />{isAr ? 'بحث ويب' : 'Web Research'}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader><DialogTitle>{isAr ? 'مساعد بحث الويب' : 'Web Research Assistant'}</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder={isAr ? 'اسأل عن أي موضوع...' : 'Ask about any topic...'}
                 onKeyDown={(e) => e.key === 'Enter' && run()} />
          <Button onClick={run} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {res && (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-2">
              <div>
                <h3 className="font-semibold mb-1">{isAr ? 'ملخص' : 'Summary'}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{res.summary}</p>
              </div>
              {res.keyPoints?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">{isAr ? 'نقاط رئيسية' : 'Key Points'}</h3>
                  <ul className="list-disc ps-5 space-y-1 text-sm">
                    {res.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {res.references?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-1">{isAr ? 'مراجع' : 'References'}</h3>
                  <ul className="space-y-2 text-sm">
                    {res.references.map((r, i) => (
                      <li key={i} className="border rounded p-2">
                        <div className="font-medium flex items-center gap-2">
                          {r.title}
                          {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="w-3 h-3" /></a>}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.note}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(buildMarkdown()); toast.success(isAr ? 'نُسخ' : 'Copied'); }}>
                  <Copy className="w-4 h-4 me-2" />{isAr ? 'نسخ Markdown' : 'Copy Markdown'}
                </Button>
                {onInsert && (
                  <Button size="sm" onClick={() => { onInsert(buildMarkdown()); setOpen(false); }}>
                    {isAr ? 'إدراج في المحرر' : 'Insert into Editor'}
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
