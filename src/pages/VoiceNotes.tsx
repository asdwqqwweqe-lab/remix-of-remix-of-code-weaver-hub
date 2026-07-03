import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mic, Square, Play, Pause, Trash2, Download, FileText, Loader2, Save, Search } from 'lucide-react';
import { putBlob, getBlob, deleteBlob } from '@/lib/voiceNotesDb';

interface VoiceNote {
  id: string;
  title: string;
  createdAt: number;
  duration: number; // seconds
  mime: string;
  size: number;
  transcript: string;
}

const META_KEY = 'voice-notes-meta-v1';

const loadMeta = (): VoiceNote[] => {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '[]'); } catch { return []; }
};
const saveMeta = (m: VoiceNote[]) => localStorage.setItem(META_KEY, JSON.stringify(m));

const pickMime = () => {
  const opts = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  for (const o of opts) if ((window as any).MediaRecorder?.isTypeSupported?.(o)) return o;
  return '';
};
const fmt = (s: number) => {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, '0')}`;
};
const bytes = (n: number) => n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
const uid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));

export default function VoiceNotes() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [notes, setNotes] = useState<VoiceNote[]>(() => loadMeta());
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTsRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => { saveMeta(notes); }, [notes]);
  useEffect(() => () => {
    if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    if (tickRef.current) window.clearInterval(tickRef.current);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        streamRef.current?.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
        const duration = (Date.now() - startTsRef.current) / 1000;
        setElapsed(0);
        if (blob.size < 800) { toast.error(t('التسجيل قصير جدًا', 'Recording too short')); return; }
        const id = uid();
        await putBlob(id, blob);
        const note: VoiceNote = {
          id,
          title: `${t('ملاحظة صوتية', 'Voice note')} — ${new Date().toLocaleString(language === 'ar' ? 'ar-EG' : 'en')}`,
          createdAt: Date.now(),
          duration,
          mime: blob.type,
          size: blob.size,
          transcript: '',
        };
        setNotes((p) => [note, ...p]);
        setSelectedId(id);
        toast.success(t('تم حفظ التسجيل', 'Recording saved'));
      };
      rec.start();
      recRef.current = rec;
      startTsRef.current = Date.now();
      setRecording(true);
      tickRef.current = window.setInterval(() => setElapsed((Date.now() - startTsRef.current) / 1000), 200);
    } catch (e) {
      toast.error(t('تعذر الوصول للميكروفون', 'Microphone access denied'));
    }
  };

  const stopRecording = () => {
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
    setRecording(false);
  };

  const play = async (id: string) => {
    if (playingId === id) { audioRef.current?.pause(); return; }
    const blob = await getBlob(id);
    if (!blob) { toast.error(t('لم يُعثر على الصوت', 'Audio missing')); return; }
    if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current);
    const url = URL.createObjectURL(blob);
    currentUrlRef.current = url;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.onended = () => setPlayingId(null);
    audioRef.current.onpause = () => setPlayingId((p) => (p === id ? null : p));
    audioRef.current.onplay = () => setPlayingId(id);
    await audioRef.current.play();
  };

  const remove = async (id: string) => {
    if (!confirm(t('حذف هذه الملاحظة؟', 'Delete this note?'))) return;
    await deleteBlob(id);
    setNotes((p) => p.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (playingId === id) { audioRef.current?.pause(); setPlayingId(null); }
  };

  const download = async (n: VoiceNote) => {
    const blob = await getBlob(n.id);
    if (!blob) return;
    const ext = n.mime.includes('mp4') ? 'm4a' : n.mime.includes('ogg') ? 'ogg' : n.mime.includes('wav') ? 'wav' : 'webm';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${n.title.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  const transcribe = async (n: VoiceNote) => {
    setTranscribingId(n.id);
    try {
      const blob = await getBlob(n.id);
      if (!blob) throw new Error('audio missing');
      const fd = new FormData();
      const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : blob.type.includes('wav') ? 'wav' : 'webm';
      fd.append('file', blob, `note.${ext}`);
      const { data, error } = await supabase.functions.invoke('transcribe-audio', { body: fd });
      if (error) throw error;
      const text = (data as any)?.text || '';
      setNotes((p) => p.map((x) => (x.id === n.id ? { ...x, transcript: text } : x)));
      toast.success(t('اكتمل النسخ النصي', 'Transcription complete'));
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('402')) toast.error(t('رصيد الذكاء الاصطناعي منتهي', 'AI credits exhausted'));
      else if (msg.includes('429')) toast.error(t('تجاوز حد المعدل، حاول لاحقاً', 'Rate limit — try again'));
      else toast.error(t('فشل النسخ النصي', 'Transcription failed'));
    } finally {
      setTranscribingId(null);
    }
  };

  const filtered = notes.filter((n) =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.transcript.toLowerCase().includes(search.toLowerCase())
  );
  const selected = notes.find((n) => n.id === selectedId) || null;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('الملاحظات الصوتية', 'Voice Notes')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('سجّل ملاحظاتك واحصل على نسخ نصي تلقائي', 'Record notes and get automatic transcription')}
          </p>
        </div>
      </div>

      {/* Recorder */}
      <Card className="p-6 flex flex-col md:flex-row items-center gap-4">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all
            ${recording ? 'bg-destructive text-destructive-foreground shadow-[0_0_0_8px_hsl(var(--destructive)/0.2)]' : 'bg-primary text-primary-foreground hover:scale-105'}`}
          aria-label={recording ? 'stop' : 'record'}
        >
          {recording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          {recording && <span className="absolute inset-0 rounded-full animate-ping bg-destructive/40" />}
        </button>
        <div className="flex-1 text-center md:text-start">
          <div className="text-lg font-semibold">
            {recording ? t('يسجّل الآن...', 'Recording...') : t('اضغط للتسجيل', 'Tap to record')}
          </div>
          <div className="text-3xl font-mono tabular-nums mt-1">
            {fmt(elapsed)}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
        {/* List */}
        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('ابحث في الملاحظات والنصوص...', 'Search notes and transcripts...')}
              className="ps-9"
            />
          </div>
          <div className="text-xs text-muted-foreground">{filtered.length} / {notes.length}</div>
          <div className="space-y-2 max-h-[65vh] overflow-auto">
            {filtered.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                {t('لا توجد ملاحظات بعد', 'No notes yet')}
              </div>
            )}
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                className={`p-3 rounded-lg border cursor-pointer transition
                  ${selectedId === n.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <span>{fmt(n.duration)}</span>
                      <span>·</span>
                      <span>{bytes(n.size)}</span>
                      {n.transcript && <Badge variant="secondary" className="text-[10px]">{t('منسوخ', 'Transcribed')}</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => play(n.id)}>
                      {playingId === n.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(n.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detail */}
        <Card className="p-4">
          {!selected ? (
            <div className="text-center text-sm text-muted-foreground py-16">
              {t('اختر ملاحظة لعرض تفاصيلها', 'Select a note to view details')}
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                value={selected.title}
                onChange={(e) => setNotes((p) => p.map((x) => (x.id === selected.id ? { ...x, title: e.target.value } : x)))}
                className="text-lg font-semibold"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{new Date(selected.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en')}</span>
                <span>·</span>
                <span>{fmt(selected.duration)}</span>
                <span>·</span>
                <span>{bytes(selected.size)}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => play(selected.id)}>
                  {playingId === selected.id ? <Pause className="w-4 h-4 me-1" /> : <Play className="w-4 h-4 me-1" />}
                  {playingId === selected.id ? t('إيقاف', 'Pause') : t('تشغيل', 'Play')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => download(selected)}>
                  <Download className="w-4 h-4 me-1" />{t('تحميل', 'Download')}
                </Button>
                <Button size="sm" variant="outline"
                  disabled={transcribingId === selected.id}
                  onClick={() => transcribe(selected)}>
                  {transcribingId === selected.id
                    ? <Loader2 className="w-4 h-4 me-1 animate-spin" />
                    : <FileText className="w-4 h-4 me-1" />}
                  {selected.transcript ? t('إعادة النسخ', 'Re-transcribe') : t('نسخ نصي', 'Transcribe')}
                </Button>
                {selected.transcript && (
                  <Button size="sm" variant="outline"
                    onClick={() => { navigator.clipboard.writeText(selected.transcript); toast.success(t('تم النسخ', 'Copied')); }}>
                    <Save className="w-4 h-4 me-1" />{t('نسخ النص', 'Copy text')}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-destructive ms-auto" onClick={() => remove(selected.id)}>
                  <Trash2 className="w-4 h-4 me-1" />{t('حذف', 'Delete')}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('النص المستخرج', 'Transcript')}</label>
                <Textarea
                  value={selected.transcript}
                  onChange={(e) => setNotes((p) => p.map((x) => (x.id === selected.id ? { ...x, transcript: e.target.value } : x)))}
                  placeholder={t('لم يتم النسخ بعد. اضغط "نسخ نصي" للبدء.', 'Not transcribed yet. Click "Transcribe" to start.')}
                  className="min-h-[300px]"
                  dir="auto"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
