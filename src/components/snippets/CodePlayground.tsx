import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, RotateCcw, Loader2, Terminal, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type Runtime = 'js' | 'html' | 'python' | 'unsupported';

export function detectRuntime(language: string | undefined): Runtime {
  const l = (language || '').toLowerCase();
  if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx', 'node'].includes(l)) return 'js';
  if (['html', 'css', 'htm'].includes(l)) return 'html';
  if (['py', 'python'].includes(l)) return 'python';
  return 'unsupported';
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  code: string;
  language: string;
}

interface LogEntry { level: 'log' | 'warn' | 'error' | 'info'; text: string; }

const jsHarness = (code: string) => `
<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:8px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;background:#0b0b0f;color:#eaeaf0;}
</style></head><body><script>
(function(){
  const send = (level, args) => parent.postMessage({__pg:true,level,text:Array.from(args).map(a=>{
    try{return typeof a==='object'?JSON.stringify(a,null,2):String(a);}catch(e){return String(a);}
  }).join(' ')}, '*');
  ['log','info','warn','error'].forEach(k => { const o = console[k]; console[k] = function(){ send(k, arguments); o.apply(console, arguments); }; });
  window.addEventListener('error', e => send('error', [e.message + ' @ ' + (e.lineno||'?')]));
  window.addEventListener('unhandledrejection', e => send('error', ['Unhandled: ' + (e.reason && e.reason.message || e.reason)]));
  try { ${code} \n} catch(e){ send('error', [e && e.stack || String(e)]); }
  parent.postMessage({__pg:true, done:true}, '*');
})();
<\/script></body></html>`;

const htmlHarness = (code: string, language: string) => {
  const l = language.toLowerCase();
  if (l === 'css') return `<!doctype html><html><head><style>${code}</style></head><body><div style="padding:20px">CSS preview — add HTML elements to see effect.</div></body></html>`;
  return code.trim().startsWith('<!doctype') || code.trim().toLowerCase().startsWith('<html')
    ? code
    : `<!doctype html><html><head><meta charset="utf-8"></head><body>${code}</body></html>`;
};

export default function CodePlayground({ open, onOpenChange, title, code, language }: Props) {
  const { language: uiLang } = useLanguage();
  const isAr = uiLang === 'ar';
  const runtime = useMemo(() => detectRuntime(language), [language]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<'output' | 'preview'>(runtime === 'html' ? 'preview' : 'output');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pyodideRef = useRef<any>(null);

  useEffect(() => { setTab(runtime === 'html' ? 'preview' : 'output'); }, [runtime]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (!d || !d.__pg) return;
      if (d.done) { setRunning(false); return; }
      setLogs(l => [...l, { level: d.level, text: d.text }]);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const runJs = useCallback(() => {
    setLogs([]);
    setRunning(true);
    const iframe = iframeRef.current;
    if (!iframe) { setRunning(false); return; }
    iframe.srcdoc = jsHarness(code);
    setTimeout(() => setRunning(false), 5000);
  }, [code]);

  const runHtml = useCallback(() => {
    setLogs([]);
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = htmlHarness(code, language);
  }, [code, language]);

  const runPython = useCallback(async () => {
    setLogs([]);
    setRunning(true);
    try {
      if (!(window as any).loadPyodide) {
        setLogs(l => [...l, { level: 'info', text: isAr ? 'جارٍ تحميل Pyodide (قد يستغرق أول مرة)…' : 'Loading Pyodide (first run may take a moment)…' }]);
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load Pyodide'));
          document.head.appendChild(s);
        });
      }
      if (!pyodideRef.current) {
        pyodideRef.current = await (window as any).loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' });
      }
      const py = pyodideRef.current;
      py.setStdout({ batched: (s: string) => setLogs(l => [...l, { level: 'log', text: s }]) });
      py.setStderr({ batched: (s: string) => setLogs(l => [...l, { level: 'error', text: s }]) });
      await py.runPythonAsync(code);
    } catch (e: any) {
      setLogs(l => [...l, { level: 'error', text: e?.message || String(e) }]);
    } finally {
      setRunning(false);
    }
  }, [code, isAr]);

  const run = useCallback(() => {
    if (runtime === 'js') runJs();
    else if (runtime === 'html') runHtml();
    else if (runtime === 'python') runPython();
  }, [runtime, runJs, runHtml, runPython]);

  useEffect(() => {
    if (open && runtime !== 'unsupported' && runtime !== 'python') {
      // auto-run once when opened for fast runtimes
      const id = setTimeout(run, 100);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, runtime]);

  const reset = () => {
    setLogs([]);
    if (iframeRef.current) iframeRef.current.srcdoc = 'about:blank';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            <span className="truncate">{title || (isAr ? 'ملعب الكود' : 'Code Playground')}</span>
            <Badge variant="secondary" className="ms-auto">{language || 'text'}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 px-6 py-2 border-b bg-muted/30">
          {runtime === 'unsupported' ? (
            <span className="text-sm text-muted-foreground">
              {isAr
                ? 'التنفيذ غير مدعوم لهذه اللغة. المدعوم: JavaScript/TypeScript، HTML/CSS، Python.'
                : 'Execution not supported for this language. Supported: JavaScript/TypeScript, HTML/CSS, Python.'}
            </span>
          ) : (
            <>
              <Button size="sm" onClick={run} disabled={running}>
                {running ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Play className="w-4 h-4 me-1" />}
                {isAr ? 'تشغيل' : 'Run'}
              </Button>
              <Button size="sm" variant="outline" onClick={reset}>
                <RotateCcw className="w-4 h-4 me-1" />
                {isAr ? 'مسح' : 'Reset'}
              </Button>
              {runtime === 'python' && (
                <span className="text-xs text-muted-foreground ms-2">
                  {isAr ? 'مدعوم بواسطة Pyodide (WebAssembly)' : 'Powered by Pyodide (WebAssembly)'}
                </span>
              )}
            </>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-3 self-start">
            <TabsTrigger value="output"><Terminal className="w-4 h-4 me-1" />{isAr ? 'المخرجات' : 'Output'}</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="w-4 h-4 me-1" />{isAr ? 'المعاينة' : 'Preview'}</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="flex-1 min-h-0 mx-6 mb-6 mt-2">
            <div className="h-full rounded-md border bg-[#0b0b0f] text-[#eaeaf0] font-mono text-xs overflow-auto p-3" dir="ltr">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">{isAr ? '— لا توجد مخرجات بعد —' : '— no output yet —'}</div>
              ) : (
                logs.map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.level === 'error' ? 'text-red-400 whitespace-pre-wrap' :
                      l.level === 'warn'  ? 'text-yellow-300 whitespace-pre-wrap' :
                      l.level === 'info'  ? 'text-blue-300 whitespace-pre-wrap' :
                      'whitespace-pre-wrap'
                    }
                  >{l.text}</div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 mx-6 mb-6 mt-2">
            <div className="h-full rounded-md border overflow-hidden bg-white">
              <iframe
                ref={iframeRef}
                title="playground-preview"
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
