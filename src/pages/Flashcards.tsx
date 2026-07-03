import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles, Play, RotateCcw, Download, Upload, Loader2, Edit3, Save, X } from 'lucide-react';
import { initialState, schedule, SchedulingState } from '@/lib/sm2';

interface Card {
  id: string;
  front: string;
  back: string;
  sched: SchedulingState;
}
interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}

const KEY = 'flashcards-decks-v1';
const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
const load = (): Deck[] => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };

export default function Flashcards() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [decks, setDecks] = useState<Deck[]>(load);
  const [selectedId, setSelectedId] = useState<string | null>(() => load()[0]?.id ?? null);
  const [studying, setStudying] = useState<Card[] | null>(null);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiLoading, setAiLoading] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(decks)); }, [decks]);

  const selected = decks.find((d) => d.id === selectedId) || null;
  const now = Date.now();
  const dueCount = selected?.cards.filter((c) => c.sched.dueDate <= now).length ?? 0;

  const createDeck = () => {
    const name = prompt(t('اسم المجموعة', 'Deck name'));
    if (!name) return;
    const d: Deck = { id: uid(), name, cards: [], createdAt: Date.now() };
    setDecks((p) => [d, ...p]);
    setSelectedId(d.id);
  };
  const deleteDeck = (id: string) => {
    if (!confirm(t('حذف المجموعة؟', 'Delete deck?'))) return;
    setDecks((p) => p.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const updateDeck = (id: string, patch: Partial<Deck>) => {
    setDecks((p) => p.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };
  const addCards = (deckId: string, cards: { front: string; back: string }[]) => {
    const newCards: Card[] = cards.map((c) => ({ id: uid(), front: c.front, back: c.back, sched: initialState() }));
    setDecks((p) => p.map((d) => (d.id === deckId ? { ...d, cards: [...d.cards, ...newCards] } : d)));
  };
  const deleteCard = (deckId: string, cardId: string) => {
    setDecks((p) => p.map((d) => (d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d)));
  };
  const updateCard = (deckId: string, card: Card) => {
    setDecks((p) => p.map((d) => (d.id === deckId ? { ...d, cards: d.cards.map((c) => (c.id === card.id ? card : c)) } : d)));
  };

  const startStudy = () => {
    if (!selected) return;
    const due = selected.cards.filter((c) => c.sched.dueDate <= now);
    if (due.length === 0) { toast.info(t('لا بطاقات مستحقة', 'No due cards')); return; }
    setStudying(due.sort(() => Math.random() - 0.5));
    setStudyIndex(0);
    setFlipped(false);
  };

  const grade = (q: 0 | 3 | 4 | 5) => {
    if (!studying || !selected) return;
    const card = studying[studyIndex];
    const next = { ...card, sched: schedule(card.sched, q) };
    updateCard(selected.id, next);
    if (studyIndex + 1 >= studying.length) {
      setStudying(null);
      toast.success(t('انتهت الجلسة', 'Session complete'));
    } else {
      setStudyIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const generateAI = async () => {
    if (!selected || aiText.trim().length < 20) {
      toast.error(t('أدخل نصاً كافياً (20+ حرف)', 'Enter at least 20 characters')); return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { text: aiText, count: aiCount, language },
      });
      if (error) throw error;
      const cards = (data as any)?.cards || [];
      if (cards.length === 0) throw new Error('no cards');
      addCards(selected.id, cards);
      toast.success(t(`تم إنشاء ${cards.length} بطاقة`, `Generated ${cards.length} cards`));
      setAiOpen(false); setAiText('');
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('402')) toast.error(t('رصيد الذكاء الاصطناعي منتهي', 'AI credits exhausted'));
      else if (msg.includes('429')) toast.error(t('تجاوز حد المعدل', 'Rate limit exceeded'));
      else toast.error(t('فشل التوليد', 'Generation failed'));
    } finally { setAiLoading(false); }
  };

  const addManual = () => {
    if (!selected || !manualFront.trim() || !manualBack.trim()) return;
    addCards(selected.id, [{ front: manualFront.trim(), back: manualBack.trim() }]);
    setManualFront(''); setManualBack('');
  };

  const exportJSON = () => {
    if (!selected) return;
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${selected.name}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = (file: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(String(fr.result));
        if (!d?.name || !Array.isArray(d.cards)) throw 0;
        const deck: Deck = {
          id: uid(),
          name: d.name,
          createdAt: Date.now(),
          cards: d.cards.map((c: any) => ({
            id: uid(),
            front: String(c.front || ''),
            back: String(c.back || ''),
            sched: c.sched && typeof c.sched.ease === 'number' ? c.sched : initialState(),
          })),
        };
        setDecks((p) => [deck, ...p]);
        setSelectedId(deck.id);
        toast.success(t('تم الاستيراد', 'Imported'));
      } catch { toast.error(t('ملف غير صالح', 'Invalid file')); }
    };
    fr.readAsText(file);
  };

  const stats = useMemo(() => {
    const totalCards = decks.reduce((s, d) => s + d.cards.length, 0);
    const dueToday = decks.reduce((s, d) => s + d.cards.filter((c) => c.sched.dueDate <= now).length, 0);
    return { totalDecks: decks.length, totalCards, dueToday };
  }, [decks, now]);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('البطاقات التعليمية', 'Flashcards')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('تعلّم بالتكرار المتباعد (SM-2) مع توليد تلقائي بالذكاء الاصطناعي', 'Spaced repetition (SM-2) with AI generation')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={createDeck}><Plus className="w-4 h-4 me-1" />{t('مجموعة', 'Deck')}</Button>
          <label>
            <Button size="sm" variant="outline" asChild>
              <span><Upload className="w-4 h-4 me-1" />{t('استيراد', 'Import')}</span>
            </Button>
            <input type="file" accept="application/json" className="hidden"
              onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t('المجموعات', 'Decks')}</div><div className="text-2xl font-bold">{stats.totalDecks}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t('البطاقات', 'Cards')}</div><div className="text-2xl font-bold">{stats.totalCards}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t('مستحقة اليوم', 'Due today')}</div><div className="text-2xl font-bold text-primary">{stats.dueToday}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <Card className="p-3 space-y-1 h-fit">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1">{t('المجموعات', 'Decks')}</div>
          {decks.length === 0 && <div className="text-sm text-muted-foreground p-3">{t('لا مجموعات بعد', 'No decks yet')}</div>}
          {decks.map((d) => {
            const due = d.cards.filter((c) => c.sched.dueDate <= now).length;
            return (
              <button key={d.id} onClick={() => setSelectedId(d.id)}
                className={`w-full flex items-center justify-between gap-2 p-2 rounded text-sm text-start transition
                  ${selectedId === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
                <span className="truncate">{d.name}</span>
                <span className="text-xs opacity-70">{due}/{d.cards.length}</span>
              </button>
            );
          })}
        </Card>

        <div className="space-y-4">
          {!selected ? (
            <Card className="p-12 text-center text-muted-foreground">
              {t('اختر أو أنشئ مجموعة', 'Select or create a deck')}
            </Card>
          ) : studying ? (
            <Card className="p-8 space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span>{studyIndex + 1} / {studying.length}</span>
                <Button size="sm" variant="ghost" onClick={() => setStudying(null)}>
                  <X className="w-4 h-4 me-1" />{t('إنهاء', 'End')}
                </Button>
              </div>
              <div onClick={() => setFlipped((f) => !f)}
                className="cursor-pointer min-h-[280px] flex items-center justify-center text-center p-8 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-xl font-medium">
                {flipped ? studying[studyIndex].back : studying[studyIndex].front}
              </div>
              {!flipped ? (
                <Button className="w-full" onClick={() => setFlipped(true)}>
                  {t('اظهر الإجابة', 'Show answer')}
                </Button>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="destructive" onClick={() => grade(0)}>{t('من جديد', 'Again')}</Button>
                  <Button variant="outline" onClick={() => grade(3)}>{t('صعب', 'Hard')}</Button>
                  <Button onClick={() => grade(4)}>{t('جيد', 'Good')}</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => grade(5)}>{t('سهل', 'Easy')}</Button>
                </div>
              )}
            </Card>
          ) : (
            <>
              <Card className="p-4 flex flex-wrap items-center gap-2">
                <Input value={selected.name} onChange={(e) => updateDeck(selected.id, { name: e.target.value })}
                  className="max-w-xs font-semibold" />
                <Badge variant="secondary">{selected.cards.length} {t('بطاقة', 'cards')}</Badge>
                <Badge className="bg-primary">{dueCount} {t('مستحقة', 'due')}</Badge>
                <div className="ms-auto flex flex-wrap gap-2">
                  <Button size="sm" onClick={startStudy} disabled={dueCount === 0}>
                    <Play className="w-4 h-4 me-1" />{t('ابدأ المراجعة', 'Study')}
                  </Button>
                  <Dialog open={aiOpen} onOpenChange={setAiOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Sparkles className="w-4 h-4 me-1" />{t('توليد بالذكاء', 'AI Generate')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>{t('توليد بطاقات من نص', 'Generate cards from text')}</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <Textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={8}
                          placeholder={t('الصق نصاً/ملخصاً/محاضرة...', 'Paste text, summary or lesson...')} />
                        <div className="flex items-center gap-2">
                          <label className="text-sm">{t('العدد', 'Count')}:</label>
                          <Input type="number" min={3} max={30} value={aiCount}
                            onChange={(e) => setAiCount(Number(e.target.value))} className="w-24" />
                          <Button className="ms-auto" onClick={generateAI} disabled={aiLoading}>
                            {aiLoading ? <Loader2 className="w-4 h-4 me-1 animate-spin" /> : <Sparkles className="w-4 h-4 me-1" />}
                            {t('توليد', 'Generate')}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" onClick={exportJSON}><Download className="w-4 h-4 me-1" />{t('تصدير', 'Export')}</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => deleteDeck(selected.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="text-sm font-medium">{t('إضافة يدوية', 'Add manually')}</div>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input value={manualFront} onChange={(e) => setManualFront(e.target.value)} placeholder={t('السؤال', 'Front')} />
                  <Input value={manualBack} onChange={(e) => setManualBack(e.target.value)} placeholder={t('الإجابة', 'Back')} />
                </div>
                <Button size="sm" onClick={addManual}><Plus className="w-4 h-4 me-1" />{t('إضافة', 'Add')}</Button>
              </Card>

              <Card className="p-4 space-y-2">
                <div className="text-sm font-medium">{t('كل البطاقات', 'All cards')} ({selected.cards.length})</div>
                {selected.cards.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">{t('لا توجد بطاقات', 'No cards')}</div>
                ) : (
                  <div className="space-y-1 max-h-[400px] overflow-auto">
                    {selected.cards.map((c) => (
                      <div key={c.id} className="p-2 rounded border flex items-center gap-2 text-sm">
                        {editing?.id === c.id ? (
                          <>
                            <Input value={editing.front} onChange={(e) => setEditing({ ...editing, front: e.target.value })} />
                            <Input value={editing.back} onChange={(e) => setEditing({ ...editing, back: e.target.value })} />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { updateCard(selected.id, editing); setEditing(null); }}><Save className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0 grid md:grid-cols-2 gap-2">
                              <div className="truncate font-medium">{c.front}</div>
                              <div className="truncate text-muted-foreground">{c.back}</div>
                            </div>
                            <Badge variant="outline" className="text-[10px]">ease {c.sched.ease.toFixed(1)}</Badge>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(c)}><Edit3 className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCard(selected.id, c.id)}><Trash2 className="w-4 h-4" /></Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
