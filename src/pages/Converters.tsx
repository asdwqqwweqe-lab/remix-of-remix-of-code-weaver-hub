import { useMemo, useState } from 'react';
import yaml from 'js-yaml';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Download, Trash2, ArrowRightLeft } from 'lucide-react';

const copy = (text: string, msg: string) => {
  navigator.clipboard.writeText(text); toast.success(msg);
};
const dl = (name: string, text: string, type = 'text/plain') => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

// -- Simple CSV parser (handles quoted values with commas and escaped quotes)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inQuotes) {
      if (c === '"' && n === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (c === '\r') { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v !== ''));
}
function toCSV(rows: any[]): string {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const cols = Array.from(rows.reduce((s: Set<string>, r) => {
    if (r && typeof r === 'object') Object.keys(r).forEach((k) => s.add(k));
    return s;
  }, new Set<string>()));
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r?.[c as string])).join(','))].join('\n');
}

// -- Simple line diff
function diffLines(a: string, b: string) {
  const al = a.split('\n'), bl = b.split('\n');
  const max = Math.max(al.length, bl.length);
  const out: { l: string; type: 'same' | 'add' | 'del' | 'mod' }[] = [];
  for (let i = 0; i < max; i++) {
    if (al[i] === bl[i]) out.push({ l: al[i] ?? '', type: 'same' });
    else if (al[i] === undefined) out.push({ l: bl[i], type: 'add' });
    else if (bl[i] === undefined) out.push({ l: al[i], type: 'del' });
    else out.push({ l: `- ${al[i]}\n+ ${bl[i]}`, type: 'mod' });
  }
  return out;
}

function ToolShell({ input, setInput, output, error, actions, t }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">{t('الإدخال', 'Input')}</label>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setInput('')}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={16} className="font-mono text-sm" dir="ltr" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">{t('الخرج', 'Output')}</label>
          <div className="flex gap-1">{actions}</div>
        </div>
        {error ? (
          <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-mono whitespace-pre-wrap min-h-[calc(16rem+2rem)]" dir="ltr">{error}</div>
        ) : (
          <Textarea value={output} readOnly rows={16} className="font-mono text-sm bg-muted/30" dir="ltr" />
        )}
      </div>
    </div>
  );
}

export default function Converters() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  // JSON <-> YAML
  const [jyIn, setJyIn] = useState('');
  const [jyMode, setJyMode] = useState<'j2y' | 'y2j'>('j2y');
  const { out: jyOut, err: jyErr } = useMemo(() => {
    if (!jyIn.trim()) return { out: '', err: '' };
    try {
      if (jyMode === 'j2y') return { out: yaml.dump(JSON.parse(jyIn), { indent: 2 }), err: '' };
      const obj = yaml.load(jyIn);
      return { out: JSON.stringify(obj, null, 2), err: '' };
    } catch (e: any) { return { out: '', err: e.message }; }
  }, [jyIn, jyMode]);

  // CSV <-> JSON
  const [cjIn, setCjIn] = useState('');
  const [cjMode, setCjMode] = useState<'c2j' | 'j2c'>('c2j');
  const { out: cjOut, err: cjErr } = useMemo(() => {
    if (!cjIn.trim()) return { out: '', err: '' };
    try {
      if (cjMode === 'c2j') {
        const rows = parseCSV(cjIn);
        if (rows.length === 0) return { out: '[]', err: '' };
        const [head, ...rest] = rows;
        const objs = rest.map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? ''])));
        return { out: JSON.stringify(objs, null, 2), err: '' };
      } else {
        const arr = JSON.parse(cjIn);
        if (!Array.isArray(arr)) throw new Error('Expect array of objects');
        return { out: toCSV(arr), err: '' };
      }
    } catch (e: any) { return { out: '', err: e.message }; }
  }, [cjIn, cjMode]);

  // Base64
  const [b64In, setB64In] = useState('');
  const [b64Mode, setB64Mode] = useState<'enc' | 'dec'>('enc');
  const { out: b64Out, err: b64Err } = useMemo(() => {
    if (!b64In) return { out: '', err: '' };
    try {
      if (b64Mode === 'enc') {
        const bytes = new TextEncoder().encode(b64In);
        let bin = ''; bytes.forEach((b) => bin += String.fromCharCode(b));
        return { out: btoa(bin), err: '' };
      } else {
        const bin = atob(b64In.trim());
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return { out: new TextDecoder().decode(bytes), err: '' };
      }
    } catch (e: any) { return { out: '', err: e.message }; }
  }, [b64In, b64Mode]);

  // URL encode/decode
  const [urlIn, setUrlIn] = useState('');
  const [urlMode, setUrlMode] = useState<'enc' | 'dec'>('enc');
  const { out: urlOut, err: urlErr } = useMemo(() => {
    if (!urlIn) return { out: '', err: '' };
    try {
      return { out: urlMode === 'enc' ? encodeURIComponent(urlIn) : decodeURIComponent(urlIn), err: '' };
    } catch (e: any) { return { out: '', err: e.message }; }
  }, [urlIn, urlMode]);

  // JSON format & diff
  const [jsonIn, setJsonIn] = useState('');
  const [jsonMinify, setJsonMinify] = useState(false);
  const { out: jsonOut, err: jsonErr } = useMemo(() => {
    if (!jsonIn.trim()) return { out: '', err: '' };
    try {
      const p = JSON.parse(jsonIn);
      return { out: jsonMinify ? JSON.stringify(p) : JSON.stringify(p, null, 2), err: '' };
    } catch (e: any) { return { out: '', err: e.message }; }
  }, [jsonIn, jsonMinify]);

  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const diff = useMemo(() => (diffA || diffB ? diffLines(diffA, diffB) : []), [diffA, diffB]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold">{t('محوّلات الصيغ', 'Format Converters')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('أدوات سريعة للتحويل بين الصيغ الشائعة', 'Quick tools to convert between common formats')}
        </p>
      </div>

      <Tabs defaultValue="jy">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="jy">JSON ↔ YAML</TabsTrigger>
          <TabsTrigger value="cj">CSV ↔ JSON</TabsTrigger>
          <TabsTrigger value="b64">Base64</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
          <TabsTrigger value="json">{t('تنسيق JSON', 'JSON Format')}</TabsTrigger>
          <TabsTrigger value="diff">{t('مقارنة', 'Diff')}</TabsTrigger>
        </TabsList>

        <TabsContent value="jy">
          <Card className="p-4 space-y-3">
            <Button size="sm" variant="outline" onClick={() => setJyMode((m) => (m === 'j2y' ? 'y2j' : 'j2y'))}>
              <ArrowRightLeft className="w-4 h-4 me-1" />{jyMode === 'j2y' ? 'JSON → YAML' : 'YAML → JSON'}
            </Button>
            <ToolShell input={jyIn} setInput={setJyIn} output={jyOut} error={jyErr} t={t}
              actions={<>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(jyOut, t('تم النسخ', 'Copied'))}><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dl(jyMode === 'j2y' ? 'out.yaml' : 'out.json', jyOut)}><Download className="w-3.5 h-3.5" /></Button>
              </>} />
          </Card>
        </TabsContent>

        <TabsContent value="cj">
          <Card className="p-4 space-y-3">
            <Button size="sm" variant="outline" onClick={() => setCjMode((m) => (m === 'c2j' ? 'j2c' : 'c2j'))}>
              <ArrowRightLeft className="w-4 h-4 me-1" />{cjMode === 'c2j' ? 'CSV → JSON' : 'JSON → CSV'}
            </Button>
            <ToolShell input={cjIn} setInput={setCjIn} output={cjOut} error={cjErr} t={t}
              actions={<>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(cjOut, t('تم النسخ', 'Copied'))}><Copy className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dl(cjMode === 'c2j' ? 'out.json' : 'out.csv', cjOut)}><Download className="w-3.5 h-3.5" /></Button>
              </>} />
          </Card>
        </TabsContent>

        <TabsContent value="b64">
          <Card className="p-4 space-y-3">
            <Button size="sm" variant="outline" onClick={() => setB64Mode((m) => (m === 'enc' ? 'dec' : 'enc'))}>
              <ArrowRightLeft className="w-4 h-4 me-1" />{b64Mode === 'enc' ? t('نص → Base64', 'Text → Base64') : t('Base64 → نص', 'Base64 → Text')}
            </Button>
            <ToolShell input={b64In} setInput={setB64In} output={b64Out} error={b64Err} t={t}
              actions={<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(b64Out, t('تم النسخ', 'Copied'))}><Copy className="w-3.5 h-3.5" /></Button>} />
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card className="p-4 space-y-3">
            <Button size="sm" variant="outline" onClick={() => setUrlMode((m) => (m === 'enc' ? 'dec' : 'enc'))}>
              <ArrowRightLeft className="w-4 h-4 me-1" />{urlMode === 'enc' ? 'Encode' : 'Decode'}
            </Button>
            <ToolShell input={urlIn} setInput={setUrlIn} output={urlOut} error={urlErr} t={t}
              actions={<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(urlOut, t('تم النسخ', 'Copied'))}><Copy className="w-3.5 h-3.5" /></Button>} />
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={jsonMinify ? 'outline' : 'default'} onClick={() => setJsonMinify(false)}>{t('تنسيق', 'Beautify')}</Button>
              <Button size="sm" variant={jsonMinify ? 'default' : 'outline'} onClick={() => setJsonMinify(true)}>{t('تصغير', 'Minify')}</Button>
            </div>
            <ToolShell input={jsonIn} setInput={setJsonIn} output={jsonOut} error={jsonErr} t={t}
              actions={<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(jsonOut, t('تم النسخ', 'Copied'))}><Copy className="w-3.5 h-3.5" /></Button>} />
          </Card>
        </TabsContent>

        <TabsContent value="diff">
          <Card className="p-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">{t('النص أ', 'Text A')}</label>
                <Textarea rows={10} value={diffA} onChange={(e) => setDiffA(e.target.value)} className="font-mono text-sm" dir="ltr" />
              </div>
              <div>
                <label className="text-xs font-medium">{t('النص ب', 'Text B')}</label>
                <Textarea rows={10} value={diffB} onChange={(e) => setDiffB(e.target.value)} className="font-mono text-sm" dir="ltr" />
              </div>
            </div>
            {diff.length > 0 && (
              <div className="border rounded p-3 font-mono text-xs space-y-0.5 max-h-[400px] overflow-auto" dir="ltr">
                {diff.map((d, i) => (
                  <div key={i} className={
                    d.type === 'add' ? 'bg-emerald-500/10 text-emerald-500' :
                    d.type === 'del' ? 'bg-destructive/10 text-destructive' :
                    d.type === 'mod' ? 'bg-amber-500/10 text-amber-500 whitespace-pre' : 'text-muted-foreground'
                  }>
                    {d.type === 'add' ? '+ ' : d.type === 'del' ? '- ' : d.type === 'mod' ? '' : '  '}{d.l}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
