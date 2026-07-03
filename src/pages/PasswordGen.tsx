import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { KeyRound, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?';
const SIMILAR = /[0O1lI]/g;

const WORDLIST = [
  'apple','brave','cloud','delta','ember','flock','grove','honey','ivory','jolly',
  'kite','lemon','mango','noble','ocean','pearl','quartz','river','stone','tiger',
  'urban','vivid','whale','xenon','yield','zebra','amber','bloom','coral','dune',
  'echo','frost','glide','harbor','ice','jade','kayak','lunar','maple','nest',
  'orbit','plum','quest','rose','silk','trail','uplift','vault','wisp','yarn',
];

const STORAGE = 'password-history-v1';

const loadHistory = (): string[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
};

function pickRandom<T>(arr: readonly T[] | string, count = 1): T[] {
  const src = typeof arr === 'string' ? (arr as unknown as T[]) : arr;
  const out: T[] = [];
  const rand = new Uint32Array(count);
  crypto.getRandomValues(rand);
  for (let i = 0; i < count; i++) out.push(src[rand[i] % src.length]);
  return out;
}

function generatePassword(length: number, opts: { upper: boolean; lower: boolean; digits: boolean; symbols: boolean; excludeSimilar: boolean }) {
  let pool = '';
  if (opts.upper) pool += UPPER;
  if (opts.lower) pool += LOWER;
  if (opts.digits) pool += DIGITS;
  if (opts.symbols) pool += SYMBOLS;
  if (opts.excludeSimilar) pool = pool.replace(SIMILAR, '');
  if (!pool) return '';
  return pickRandom(pool, length).join('');
}

function generatePassphrase(wordCount: number) {
  const words = pickRandom(WORDLIST, wordCount);
  const digits = pickRandom(DIGITS, 2).join('');
  return words.join('-') + '-' + digits;
}

function poolSize(opts: { upper: boolean; lower: boolean; digits: boolean; symbols: boolean; excludeSimilar: boolean }) {
  let s = 0;
  if (opts.upper) s += UPPER.length;
  if (opts.lower) s += LOWER.length;
  if (opts.digits) s += DIGITS.length;
  if (opts.symbols) s += SYMBOLS.length;
  if (opts.excludeSimilar) s -= 5;
  return Math.max(1, s);
}

function strengthLabel(entropy: number, lang: string) {
  const ar = ['ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'قوية', 'ممتازة'];
  const en = ['Very weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
  const i = entropy < 28 ? 0 : entropy < 40 ? 1 : entropy < 60 ? 2 : entropy < 90 ? 3 : 4;
  return { label: (lang === 'ar' ? ar : en)[i], index: i };
}

export default function PasswordGen() {
  const { language, isRTL } = useLanguage();
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [current, setCurrent] = useState('');
  const [history, setHistory] = useState<string[]>(loadHistory);

  const opts = { upper, lower, digits, symbols, excludeSimilar };

  const regen = () => {
    const pwd = generatePassword(length, opts);
    setCurrent(pwd);
    if (pwd) {
      setHistory((h) => {
        const next = [pwd, ...h.filter((x) => x !== pwd)].slice(0, 10);
        localStorage.setItem(STORAGE, JSON.stringify(next));
        return next;
      });
    }
  };

  const regenPhrase = () => {
    const p = generatePassphrase(5);
    setCurrent(p);
    setHistory((h) => {
      const next = [p, ...h.filter((x) => x !== p)].slice(0, 10);
      localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => { regen(); /* eslint-disable-next-line */ }, []);

  const entropy = useMemo(() => Math.log2(poolSize(opts)) * (current.length || length), [current, length, opts]);
  const strength = strengthLabel(entropy, language);
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-400'];

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success(language === 'ar' ? 'تم النسخ' : 'Copied');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE);
    toast.success(language === 'ar' ? 'تم مسح السجل' : 'History cleared');
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <KeyRound className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{language === 'ar' ? 'مولّد كلمات المرور' : 'Password Generator'}</h1>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input value={current} readOnly className="font-mono text-lg" />
          <Button variant="outline" size="icon" onClick={() => copy(current)}><Copy className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={regen}><RefreshCw className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{language === 'ar' ? 'القوة' : 'Strength'}</span>
            <span className="font-semibold">{strength.label} · {Math.round(entropy)} bits</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full transition-all ${strengthColors[strength.index]}`} style={{ width: `${(strength.index + 1) * 20}%` }} />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div className="space-y-2">
          <Label>{language === 'ar' ? `الطول: ${length}` : `Length: ${length}`}</Label>
          <Slider min={8} max={64} step={1} value={[length]} onValueChange={([v]) => setLength(v)} />
        </div>

        {[
          { key: 'upper', label: language === 'ar' ? 'أحرف كبيرة (A-Z)' : 'Uppercase (A-Z)', val: upper, set: setUpper },
          { key: 'lower', label: language === 'ar' ? 'أحرف صغيرة (a-z)' : 'Lowercase (a-z)', val: lower, set: setLower },
          { key: 'digits', label: language === 'ar' ? 'أرقام (0-9)' : 'Digits (0-9)', val: digits, set: setDigits },
          { key: 'symbols', label: language === 'ar' ? 'رموز (!@#...)' : 'Symbols (!@#...)', val: symbols, set: setSymbols },
          { key: 'similar', label: language === 'ar' ? 'استبعاد المتشابهة (0O1lI)' : 'Exclude similar (0O1lI)', val: excludeSimilar, set: setExcludeSimilar },
        ].map((o) => (
          <div key={o.key} className="flex items-center justify-between">
            <Label>{o.label}</Label>
            <Switch checked={o.val} onCheckedChange={o.set} />
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button onClick={regen} className="flex-1"><RefreshCw className="w-4 h-4 me-2" />{language === 'ar' ? 'توليد كلمة مرور' : 'Generate password'}</Button>
          <Button onClick={regenPhrase} variant="outline" className="flex-1">{language === 'ar' ? 'عبارة مرور' : 'Passphrase'}</Button>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{language === 'ar' ? 'السجل (آخر 10)' : 'History (last 10)'}</h2>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory}><Trash2 className="w-4 h-4 me-2" />{language === 'ar' ? 'مسح' : 'Clear'}</Button>
          )}
        </div>
        {history.length === 0 && <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا يوجد شيء بعد' : 'Nothing yet'}</p>}
        {history.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm bg-muted p-2 rounded truncate">{p}</code>
            <Button variant="ghost" size="icon" onClick={() => copy(p)}><Copy className="w-4 h-4" /></Button>
          </div>
        ))}
      </Card>
    </div>
  );
}
