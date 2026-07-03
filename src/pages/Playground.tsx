import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Copy, Download, Terminal, Code2, Palette, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const STORAGE_KEY = 'code-playground-v1';

const DEFAULT_HTML = `<div id="app">
  <h1>Hello, Playground 👋</h1>
  <button id="btn">Click me</button>
  <p id="out"></p>
</div>`;

const DEFAULT_CSS = `body{font-family:system-ui;padding:24px;background:#0f172a;color:#e2e8f0}
h1{color:#14b8a6;margin:0 0 12px}
button{background:#14b8a6;border:0;color:#001;padding:8px 14px;border-radius:8px;cursor:pointer}
#out{margin-top:12px;color:#94a3b8}`;

const DEFAULT_JS = `const btn = document.getElementById('btn');
const out = document.getElementById('out');
let n = 0;
btn.addEventListener('click', () => {
  n++;
  out.textContent = 'Clicked ' + n + ' time' + (n === 1 ? '' : 's');
  console.log('click', n);
});
console.log('ready ✅');`;

interface LogEntry { level: 'log' | 'warn' | 'error' | 'info'; text: string; time: number }

function buildDoc(html: string, css: string, js: string) {
  // Bridge posts console + errors to the parent
  const bridge = `
    <script>
      (function(){
        const send = (level, args) => parent.postMessage({
          __pg: true, level,
          text: args.map(a => {
            try { return typeof a === 'string' ? a : JSON.stringify(a, null, 2); }
            catch { return String(a); }
          }).join(' ')
        }, '*');
        ['log','info','warn','error'].forEach(k => {
          const orig = console[k];
          console[k] = (...a) => { send(k, a); orig.apply(console, a); };
        });
        window.addEventListener('error', e => send('error', [e.message + ' @ ' + (e.filename||'') + ':' + e.lineno]));
        window.addEventListener('unhandledrejection', e => send('error', ['Unhandled: ' + (e.reason?.message || e.reason)]));
      })();
    </script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
    <body>${html}${bridge}<script>try{${js}}catch(e){console.error(e.message)}</script></body></html>`;
}

export default function Playground() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const initial = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { html: DEFAULT_HTML, css: DEFAULT_CSS, js: DEFAULT_JS };
  }, []);

  const [html, setHtml] = useState<string>(initial.html);
  const [css, setCss] = useState<string>(initial.css);
  const [js, setJs] = useState<string>(initial.js);
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoRun, setAutoRun] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ html, css, js }));
  }, [html, css, js]);

  useEffect(() => {
    if (!autoRun) return;
    const id = window.setTimeout(() => run(), 400);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, css, js, autoRun]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (d && d.__pg) {
        setLogs(prev => [...prev.slice(-199), { level: d.level, text: d.text, time: Date.now() }]);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const run = () => {
    setLogs([]);
    setSrcDoc(buildDoc(html, css, js));
  };

  const reset = () => {
    setHtml(DEFAULT_HTML); setCss(DEFAULT_CSS); setJs(DEFAULT_JS);
    setLogs([]);
    toast.success(isAr ? 'تمت الاستعادة' : 'Reset to defaults');
  };

  const copyAll = () => {
    const combined = `<!-- HTML -->\n${html}\n\n<!-- CSS -->\n${css}\n\n// JS\n${js}`;
    navigator.clipboard.writeText(combined);
    toast.success(isAr ? 'نُسخ' : 'Copied');
  };

  const downloadHtml = () => {
    const doc = buildDoc(html, css, js).replace(/<script>[\s\S]*?parent\.postMessage[\s\S]*?<\/script>/, '');
    const blob = new Blob([doc], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'playground.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const editorClass = 'font-mono text-xs h-[400px] resize-none';
  const levelColor: Record<LogEntry['level'], string> = {
    log: 'text-slate-300', info: 'text-blue-400',
    warn: 'text-amber-400', error: 'text-red-400',
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Code2 className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? 'ملعب الكود' : 'Code Playground'}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'جرّب HTML / CSS / JS مباشرة' : 'Live HTML / CSS / JS sandbox'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)} />
            {isAr ? 'تشغيل تلقائي' : 'Auto-run'}
          </label>
          <Button size="sm" variant="outline" onClick={run} className="gap-1">
            <Play className="w-3.5 h-3.5" />{isAr ? 'تشغيل' : 'Run'}
          </Button>
          <Button size="sm" variant="outline" onClick={copyAll} className="gap-1">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={downloadHtml} className="gap-1">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} className="gap-1 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="border rounded-lg overflow-hidden bg-card">
          <Tabs defaultValue="html">
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/40">
              <TabsTrigger value="html" className="gap-1.5"><FileCode2 className="w-3.5 h-3.5" />HTML</TabsTrigger>
              <TabsTrigger value="css" className="gap-1.5"><Palette className="w-3.5 h-3.5" />CSS</TabsTrigger>
              <TabsTrigger value="js" className="gap-1.5"><Code2 className="w-3.5 h-3.5" />JS</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="m-0">
              <Textarea value={html} onChange={e => setHtml(e.target.value)}
                        className={editorClass + ' border-0 focus-visible:ring-0'} spellCheck={false} />
            </TabsContent>
            <TabsContent value="css" className="m-0">
              <Textarea value={css} onChange={e => setCss(e.target.value)}
                        className={editorClass + ' border-0 focus-visible:ring-0'} spellCheck={false} />
            </TabsContent>
            <TabsContent value="js" className="m-0">
              <Textarea value={js} onChange={e => setJs(e.target.value)}
                        className={editorClass + ' border-0 focus-visible:ring-0'} spellCheck={false} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview + Console */}
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden bg-white h-[300px]">
            <iframe
              ref={iframeRef}
              title="playground-preview"
              sandbox="allow-scripts allow-modals"
              srcDoc={srcDoc}
              className="w-full h-full border-0"
            />
          </div>
          <div className="border rounded-lg bg-slate-950 h-[130px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" />Console</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                  {logs.length}
                </Badge>
                <button className="hover:text-slate-200" onClick={() => setLogs([])}>
                  {isAr ? 'مسح' : 'Clear'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto font-mono text-[11px] p-2 space-y-0.5">
              {logs.length === 0 && (
                <div className="text-slate-600 text-center pt-3">
                  {isAr ? 'لا مخرجات بعد.' : 'No output yet.'}
                </div>
              )}
              {logs.map((l, i) => (
                <div key={i} className={levelColor[l.level] + ' whitespace-pre-wrap break-words'}>
                  <span className="text-slate-600 mr-2">›</span>{l.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
