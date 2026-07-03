import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Wrench, Copy, Braces, GitCompare, Regex, Lock, Fingerprint, Clock,
} from 'lucide-react';

const copy = async (v: string) => {
  await navigator.clipboard.writeText(v);
  toast.success('Copied');
};

// ---------- JSON Formatter ----------
function JsonTool() {
  const [input, setInput] = useState('{"hello":"world","count":3,"tags":["a","b"]}');
  const [indent, setIndent] = useState(2);
  const result = useMemo(() => {
    try {
      const parsed = JSON.parse(input);
      const pretty = JSON.stringify(parsed, null, indent);
      const min = JSON.stringify(parsed);
      const keys = countKeys(parsed);
      return { ok: true as const, pretty, min, keys, size: new Blob([min]).size };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [input, indent]);

  function countKeys(v: unknown): number {
    if (Array.isArray(v)) return v.reduce<number>((s, x) => s + countKeys(x), 0);
    if (v && typeof v === 'object') return Object.keys(v).length + Object.values(v).reduce<number>((s, x) => s + countKeys(x), 0);
    return 0;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Input</Label>
          <div className="flex-1" />
          <Label className="text-xs">Indent</Label>
          <Input type="number" value={indent} min={0} max={8} onChange={(e) => setIndent(+e.target.value)} className="w-16 h-8" />
        </div>
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[300px] font-mono text-sm" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Output</Label>
          {result.ok ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">valid · {result.keys} keys · {result.size}B</Badge>
          ) : (
            <Badge variant="destructive">{result.error}</Badge>
          )}
          <div className="flex-1" />
          {result.ok && <Button size="sm" variant="ghost" onClick={() => copy(result.pretty)}><Copy className="w-4 h-4" /></Button>}
          {result.ok && <Button size="sm" variant="outline" onClick={() => copy(result.min)}>Min</Button>}
        </div>
        <Textarea readOnly value={result.ok ? result.pretty : ''} className="min-h-[300px] font-mono text-sm" />
      </div>
    </div>
  );
}

// ---------- Diff ----------
function DiffTool() {
  const [left, setLeft] = useState('line one\nline two\nline three');
  const [right, setRight] = useState('line one\nline TWO changed\nline three\nline four added');

  const rows = useMemo(() => {
    const a = left.split('\n');
    const b = right.split('\n');
    const max = Math.max(a.length, b.length);
    const out: { l: string | null; r: string | null; kind: 'same' | 'diff' | 'add' | 'del' }[] = [];
    for (let i = 0; i < max; i++) {
      const l = i < a.length ? a[i] : null;
      const r = i < b.length ? b[i] : null;
      let kind: 'same' | 'diff' | 'add' | 'del';
      if (l === null) kind = 'add';
      else if (r === null) kind = 'del';
      else kind = l === r ? 'same' : 'diff';
      out.push({ l, r, kind });
    }
    return out;
  }, [left, right]);

  const stats = useMemo(() => ({
    same: rows.filter((r) => r.kind === 'same').length,
    diff: rows.filter((r) => r.kind === 'diff').length,
    add: rows.filter((r) => r.kind === 'add').length,
    del: rows.filter((r) => r.kind === 'del').length,
  }), [rows]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <Textarea value={left} onChange={(e) => setLeft(e.target.value)} className="min-h-[180px] font-mono text-sm" placeholder="Left" />
        <Textarea value={right} onChange={(e) => setRight(e.target.value)} className="min-h-[180px] font-mono text-sm" placeholder="Right" />
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">= {stats.same}</Badge>
        <Badge variant="outline" className="text-amber-500 border-amber-500/40">~ {stats.diff}</Badge>
        <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">+ {stats.add}</Badge>
        <Badge variant="outline" className="text-rose-500 border-rose-500/40">− {stats.del}</Badge>
      </div>
      <Card className="p-2 overflow-auto font-mono text-xs">
        <table className="w-full">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={
                r.kind === 'same' ? '' :
                r.kind === 'diff' ? 'bg-amber-500/10' :
                r.kind === 'add' ? 'bg-emerald-500/10' :
                'bg-rose-500/10'
              }>
                <td className="w-8 text-muted-foreground text-end px-2">{i + 1}</td>
                <td className="w-1/2 whitespace-pre-wrap px-2">{r.l ?? ''}</td>
                <td className="w-1/2 whitespace-pre-wrap px-2 border-s border-border/40">{r.r ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ---------- Regex Tester ----------
function RegexTool() {
  const [pattern, setPattern] = useState('(\\w+)@(\\w+\\.\\w+)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contact me at hello@example.com or dev@lovable.dev');

  const result = useMemo(() => {
    try {
      const re = new RegExp(pattern, flags);
      const matches = Array.from(text.matchAll(flags.includes('g') ? re : new RegExp(pattern, flags + 'g')));
      return { ok: true as const, matches };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [pattern, flags, text]);

  const highlighted = useMemo(() => {
    if (!result.ok || result.matches.length === 0) return text;
    const parts: { s: string; hit: boolean }[] = [];
    let cursor = 0;
    for (const m of result.matches) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (start > cursor) parts.push({ s: text.slice(cursor, start), hit: false });
      parts.push({ s: text.slice(start, end), hit: true });
      cursor = end;
    }
    if (cursor < text.length) parts.push({ s: text.slice(cursor), hit: false });
    return parts;
  }, [result, text]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <span className="font-mono text-muted-foreground">/</span>
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" />
        <span className="font-mono text-muted-foreground">/</span>
        <Input value={flags} onChange={(e) => setFlags(e.target.value)} className="font-mono w-20" placeholder="gim" />
        {result.ok ? (
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">{result.matches.length} matches</Badge>
        ) : (
          <Badge variant="destructive">{result.error}</Badge>
        )}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[140px] font-mono text-sm" />
      <Card className="p-3 text-sm whitespace-pre-wrap break-words">
        {typeof highlighted === 'string'
          ? highlighted
          : highlighted.map((p, i) => p.hit
              ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{p.s}</mark>
              : <span key={i}>{p.s}</span>
            )}
      </Card>
      {result.ok && result.matches.length > 0 && (
        <Card className="p-3 font-mono text-xs space-y-1 max-h-48 overflow-auto">
          {result.matches.map((m, i) => (
            <div key={i}>
              <span className="text-primary">#{i}</span> @{m.index} — <span className="text-emerald-500">{m[0]}</span>
              {m.length > 1 && <span className="text-muted-foreground"> · groups: [{m.slice(1).join(', ')}]</span>}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ---------- Encoders ----------
function EncodersTool() {
  const [b64In, setB64In] = useState('Hello, world!');
  const [b64Dec, setB64Dec] = useState('SGVsbG8sIHdvcmxkIQ==');
  const [urlIn, setUrlIn] = useState('hello world?a=1&b=2');
  const [jwt, setJwt] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiSm9obiIsImV4cCI6MTcwMDAwMDAwMH0.abc');

  const b64Encoded = useMemo(() => { try { return btoa(unescape(encodeURIComponent(b64In))); } catch { return ''; } }, [b64In]);
  const b64Decoded = useMemo(() => { try { return decodeURIComponent(escape(atob(b64Dec))); } catch { return '(invalid)'; } }, [b64Dec]);
  const urlEncoded = useMemo(() => encodeURIComponent(urlIn), [urlIn]);
  const urlDecoded = useMemo(() => { try { return decodeURIComponent(urlIn); } catch { return '(invalid)'; } }, [urlIn]);

  const jwtParts = useMemo(() => {
    const [h, p, s] = jwt.split('.');
    const dec = (part?: string) => {
      if (!part) return null;
      try {
        const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
        return JSON.parse(atob(padded.replace(/-/g, '+').replace(/_/g, '/')));
      } catch { return null; }
    };
    const header = dec(h);
    const payload = dec(p);
    let expInfo: string | null = null;
    if (payload && typeof (payload as { exp?: number }).exp === 'number') {
      const exp = (payload as { exp: number }).exp * 1000;
      const now = Date.now();
      expInfo = new Date(exp).toLocaleString() + (exp < now ? ' (expired)' : ` (in ${Math.round((exp - now) / 60000)} min)`);
    }
    return { header, payload, signature: s || null, expInfo };
  }, [jwt]);

  return (
    <Tabs defaultValue="b64" className="w-full">
      <TabsList>
        <TabsTrigger value="b64">Base64</TabsTrigger>
        <TabsTrigger value="url">URL</TabsTrigger>
        <TabsTrigger value="jwt">JWT</TabsTrigger>
      </TabsList>
      <TabsContent value="b64" className="space-y-3">
        <div className="grid gap-2">
          <Label className="text-xs">Encode</Label>
          <Textarea value={b64In} onChange={(e) => setB64In(e.target.value)} rows={2} />
          <div className="flex items-center gap-2">
            <Input readOnly value={b64Encoded} className="font-mono text-sm" />
            <Button size="sm" variant="ghost" onClick={() => copy(b64Encoded)}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">Decode</Label>
          <Textarea value={b64Dec} onChange={(e) => setB64Dec(e.target.value)} rows={2} className="font-mono text-sm" />
          <div className="flex items-center gap-2">
            <Input readOnly value={b64Decoded} className="font-mono text-sm" />
            <Button size="sm" variant="ghost" onClick={() => copy(b64Decoded)}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="url" className="space-y-3">
        <Textarea value={urlIn} onChange={(e) => setUrlIn(e.target.value)} rows={2} />
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Encoded</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={urlEncoded} className="font-mono text-sm" />
              <Button size="sm" variant="ghost" onClick={() => copy(urlEncoded)}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Decoded</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={urlDecoded} className="font-mono text-sm" />
              <Button size="sm" variant="ghost" onClick={() => copy(urlDecoded)}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="jwt" className="space-y-3">
        <Textarea value={jwt} onChange={(e) => setJwt(e.target.value)} rows={3} className="font-mono text-xs break-all" />
        <div className="grid md:grid-cols-2 gap-3">
          <Card className="p-3">
            <Label className="text-xs text-primary">Header</Label>
            <pre className="text-xs font-mono mt-1 whitespace-pre-wrap">{jwtParts.header ? JSON.stringify(jwtParts.header, null, 2) : '(invalid)'}</pre>
          </Card>
          <Card className="p-3">
            <Label className="text-xs text-primary">Payload</Label>
            <pre className="text-xs font-mono mt-1 whitespace-pre-wrap">{jwtParts.payload ? JSON.stringify(jwtParts.payload, null, 2) : '(invalid)'}</pre>
          </Card>
        </div>
        {jwtParts.expInfo && <div className="text-xs text-muted-foreground">Expires: {jwtParts.expInfo}</div>}
      </TabsContent>
    </Tabs>
  );
}

// ---------- Generators ----------
function GenTool() {
  const [uuid, setUuid] = useState(() => crypto.randomUUID());
  const [count, setCount] = useState(5);
  const [bulk, setBulk] = useState<string[]>([]);
  const genBulk = () => setBulk(Array.from({ length: count }, () => crypto.randomUUID()));

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <Label className="text-xs">UUID v4</Label>
        <div className="flex items-center gap-2">
          <Input readOnly value={uuid} className="font-mono text-sm" />
          <Button size="sm" onClick={() => setUuid(crypto.randomUUID())}>New</Button>
          <Button size="sm" variant="ghost" onClick={() => copy(uuid)}><Copy className="w-4 h-4" /></Button>
        </div>
      </Card>
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Bulk</Label>
          <Input type="number" value={count} onChange={(e) => setCount(Math.max(1, Math.min(500, +e.target.value)))} className="w-24 h-8" />
          <Button size="sm" onClick={genBulk}>Generate</Button>
          {bulk.length > 0 && <Button size="sm" variant="ghost" onClick={() => copy(bulk.join('\n'))}><Copy className="w-4 h-4 me-1" />All</Button>}
        </div>
        {bulk.length > 0 && (
          <Textarea readOnly value={bulk.join('\n')} rows={10} className="font-mono text-xs" />
        )}
      </Card>
    </div>
  );
}

// ---------- Timestamp ----------
function TimestampTool() {
  const [now, setNow] = useState(() => Date.now());
  const [input, setInput] = useState('');
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    const n = Number(input);
    if (!Number.isNaN(n)) {
      const ms = String(n).length <= 10 ? n * 1000 : n;
      return new Date(ms);
    }
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [input]);

  return (
    <div className="space-y-4">
      <Card className="p-4 grid md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Now (Unix seconds)</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={Math.floor(now / 1000)} className="font-mono" />
            <Button size="sm" variant="ghost" onClick={() => copy(String(Math.floor(now / 1000)))}><Copy className="w-4 h-4" /></Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">Now (ms)</Label>
          <Input readOnly value={now} className="font-mono" />
        </div>
        <div>
          <Label className="text-xs">ISO</Label>
          <Input readOnly value={new Date(now).toISOString()} className="font-mono text-xs" />
        </div>
      </Card>
      <Card className="p-4 space-y-2">
        <Label className="text-xs">Convert (Unix, ms, or ISO/date string)</Label>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="1700000000 or 2024-01-15T10:30:00Z" className="font-mono" />
        {parsed && (
          <div className="grid md:grid-cols-3 gap-3 text-sm pt-2">
            <div><Label className="text-xs">Unix (s)</Label><div className="font-mono">{Math.floor(parsed.getTime() / 1000)}</div></div>
            <div><Label className="text-xs">ISO</Label><div className="font-mono text-xs">{parsed.toISOString()}</div></div>
            <div><Label className="text-xs">Local</Label><div className="font-mono text-xs">{parsed.toLocaleString()}</div></div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DevTools() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Wrench className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('أدوات المطوّر', 'Developer Tools')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('مجموعة أدوات سريعة يومية للمطوّرين', 'A quick daily toolbox for developers')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="json">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="json"><Braces className="w-4 h-4 me-1" />JSON</TabsTrigger>
          <TabsTrigger value="diff"><GitCompare className="w-4 h-4 me-1" />Diff</TabsTrigger>
          <TabsTrigger value="regex"><Regex className="w-4 h-4 me-1" />Regex</TabsTrigger>
          <TabsTrigger value="enc"><Lock className="w-4 h-4 me-1" />Encoders</TabsTrigger>
          <TabsTrigger value="gen"><Fingerprint className="w-4 h-4 me-1" />UUID</TabsTrigger>
          <TabsTrigger value="ts"><Clock className="w-4 h-4 me-1" />Timestamp</TabsTrigger>
        </TabsList>
        <TabsContent value="json" className="mt-4"><JsonTool /></TabsContent>
        <TabsContent value="diff" className="mt-4"><DiffTool /></TabsContent>
        <TabsContent value="regex" className="mt-4"><RegexTool /></TabsContent>
        <TabsContent value="enc" className="mt-4"><EncodersTool /></TabsContent>
        <TabsContent value="gen" className="mt-4"><GenTool /></TabsContent>
        <TabsContent value="ts" className="mt-4"><TimestampTool /></TabsContent>
      </Tabs>
    </div>
  );
}
