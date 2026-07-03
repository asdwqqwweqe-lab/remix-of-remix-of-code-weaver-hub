import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Save, Trash2, Play, Download, Upload, Search } from 'lucide-react';
import { toast } from 'sonner';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface Snippet {
  id: string;
  name: string;
  method: Method;
  url: string;
  headers: string;
  body: string;
  createdAt: number;
}

const STORAGE = 'api-snippets-v1';
const ENV_KEY = 'api-snippets-env-v1';

const load = (): Snippet[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
};

const loadEnv = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(ENV_KEY) || '{}'); } catch { return {}; }
};

const methodColors: Record<Method, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  POST: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  PUT: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
  PATCH: 'bg-violet-500/15 text-violet-400 border-violet-500/40',
  DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
};

function interpolate(s: string, env: Record<string, string>) {
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => env[k] ?? `{{${k}}}`);
}

export default function ApiSnippets() {
  const { language, isRTL } = useLanguage();
  const [snippets, setSnippets] = useState<Snippet[]>(load);
  const [env, setEnv] = useState<Record<string, string>>(loadEnv);
  const [envText, setEnvText] = useState(() => JSON.stringify(loadEnv(), null, 2));
  const [selected, setSelected] = useState<Snippet | null>(null);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [method, setMethod] = useState<Method>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('');

  const [response, setResponse] = useState<{ status: number; time: number; size: number; body: string; headers: Record<string, string> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(snippets)); }, [snippets]);

  const loadSnippet = (s: Snippet) => {
    setSelected(s); setName(s.name); setMethod(s.method); setUrl(s.url);
    setHeaders(s.headers); setBody(s.body); setResponse(null); setError(null);
  };

  const clearForm = () => {
    setSelected(null); setName(''); setMethod('GET'); setUrl('');
    setHeaders('{\n  "Content-Type": "application/json"\n}'); setBody('');
    setResponse(null); setError(null);
  };

  const save = () => {
    if (!name.trim() || !url.trim()) {
      toast.error(language === 'ar' ? 'الاسم والرابط مطلوبان' : 'Name and URL required');
      return;
    }
    const s: Snippet = {
      id: selected?.id ?? crypto.randomUUID(),
      name: name.trim(), method, url: url.trim(), headers, body,
      createdAt: selected?.createdAt ?? Date.now(),
    };
    setSnippets((prev) => selected ? prev.map((x) => x.id === s.id ? s : x) : [s, ...prev]);
    setSelected(s);
    toast.success(language === 'ar' ? 'تم الحفظ' : 'Saved');
  };

  const remove = (id: string) => {
    setSnippets((prev) => prev.filter((x) => x.id !== id));
    if (selected?.id === id) clearForm();
  };

  const run = async () => {
    setLoading(true); setError(null); setResponse(null);
    try {
      const finalUrl = interpolate(url, env);
      let parsedHeaders: Record<string, string> = {};
      if (headers.trim()) {
        parsedHeaders = JSON.parse(interpolate(headers, env));
      }
      const finalBody = body.trim() ? interpolate(body, env) : undefined;
      const start = performance.now();
      const res = await fetch(finalUrl, {
        method,
        headers: parsedHeaders,
        body: method === 'GET' || method === 'DELETE' ? undefined : finalBody,
      });
      const text = await res.text();
      const time = Math.round(performance.now() - start);
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { respHeaders[k] = v; });
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setResponse({ status: res.status, time, size: new Blob([text]).size, body: pretty, headers: respHeaders });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const saveEnv = () => {
    try {
      const parsed = JSON.parse(envText);
      setEnv(parsed);
      localStorage.setItem(ENV_KEY, envText);
      toast.success(language === 'ar' ? 'تم حفظ المتغيرات' : 'Env saved');
    } catch { toast.error(language === 'ar' ? 'JSON غير صالح' : 'Invalid JSON'); }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ snippets, env }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `api-snippets-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data.snippets)) setSnippets(data.snippets);
        if (data.env) { setEnv(data.env); setEnvText(JSON.stringify(data.env, null, 2)); localStorage.setItem(ENV_KEY, JSON.stringify(data.env)); }
        toast.success(language === 'ar' ? 'تم الاستيراد' : 'Imported');
      } catch { toast.error(language === 'ar' ? 'ملف غير صالح' : 'Invalid file'); }
    };
    reader.readAsText(file);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return snippets;
    const q = search.toLowerCase();
    return snippets.filter((s) => s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
  }, [snippets, search]);

  return (
    <div className="container mx-auto py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Send className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{language === 'ar' ? 'مقتطفات API' : 'API Snippets'}</h1>
        <div className="ms-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAll}><Download className="w-4 h-4 me-2" />{language === 'ar' ? 'تصدير' : 'Export'}</Button>
          <label>
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
            <Button variant="outline" size="sm" asChild><span><Upload className="w-4 h-4 me-2" />{language === 'ar' ? 'استيراد' : 'Import'}</span></Button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-3 space-y-2 h-fit lg:sticky lg:top-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute start-2 top-2.5 text-muted-foreground" />
              <Input className="ps-8" placeholder={language === 'ar' ? 'بحث' : 'Search'} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button size="sm" onClick={clearForm}>+</Button>
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground p-2">{language === 'ar' ? 'لا توجد مقتطفات' : 'No snippets'}</p>}
            {filtered.map((s) => (
              <div key={s.id} className={`p-2 rounded cursor-pointer flex items-center gap-2 hover:bg-muted ${selected?.id === s.id ? 'bg-muted' : ''}`} onClick={() => loadSnippet(s)}>
                <Badge variant="outline" className={`text-xs ${methodColors[s.method]}`}>{s.method}</Badge>
                <span className="truncate flex-1 text-sm">{s.name}</span>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); remove(s.id); }} />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <Input placeholder={language === 'ar' ? 'اسم المقتطف' : 'Snippet name'} value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-2">
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['GET','POST','PUT','PATCH','DELETE'] as Method[]).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input className="font-mono" placeholder="https://api.example.com/{{VERSION}}/users" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Button onClick={run} disabled={loading}><Play className="w-4 h-4 me-2" />{language === 'ar' ? 'تشغيل' : 'Run'}</Button>
              <Button variant="outline" onClick={save}><Save className="w-4 h-4" /></Button>
            </div>

            <Tabs defaultValue="headers">
              <TabsList>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="env">{language === 'ar' ? 'متغيرات' : 'Env'}</TabsTrigger>
              </TabsList>
              <TabsContent value="headers">
                <Textarea rows={6} className="font-mono text-sm" value={headers} onChange={(e) => setHeaders(e.target.value)} />
              </TabsContent>
              <TabsContent value="body">
                <Textarea rows={8} className="font-mono text-sm" placeholder='{"key":"value"}' value={body} onChange={(e) => setBody(e.target.value)} />
              </TabsContent>
              <TabsContent value="env" className="space-y-2">
                <Label className="text-xs text-muted-foreground">{language === 'ar' ? 'استخدم {{VAR}} في الرابط/الرأس/الجسم' : 'Use {{VAR}} in url/headers/body'}</Label>
                <Textarea rows={6} className="font-mono text-sm" value={envText} onChange={(e) => setEnvText(e.target.value)} />
                <Button size="sm" onClick={saveEnv}>{language === 'ar' ? 'حفظ المتغيرات' : 'Save env'}</Button>
              </TabsContent>
            </Tabs>
          </Card>

          {(response || error) && (
            <Card className="p-4 space-y-3">
              {error && <div className="text-destructive font-mono text-sm">{error}</div>}
              {response && (
                <>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge className={response.status < 300 ? 'bg-emerald-500' : response.status < 400 ? 'bg-amber-500' : 'bg-rose-500'}>
                      {response.status}
                    </Badge>
                    <Badge variant="outline">{response.time} ms</Badge>
                    <Badge variant="outline">{(response.size / 1024).toFixed(2)} KB</Badge>
                  </div>
                  <Tabs defaultValue="body">
                    <TabsList>
                      <TabsTrigger value="body">Body</TabsTrigger>
                      <TabsTrigger value="headers">Headers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="body">
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96 font-mono">{response.body}</pre>
                    </TabsContent>
                    <TabsContent value="headers">
                      <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-96 font-mono">
                        {Object.entries(response.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
