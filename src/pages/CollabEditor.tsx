import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Radio, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Room { id: string; name: string; owner_id: string; }
interface Note { id: string; room_id: string; author_id: string; author_name: string | null; title: string | null; content: string; created_at: string; }

export default function CollabEditor() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [presence, setPresence] = useState<{ user: string; name: string }[]>([]);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setDisplayName(data.user?.email?.split('@')[0] ?? 'anon');
    });
  }, []);

  const loadRooms = async () => {
    const { data } = await supabase.from('collab_rooms').select('id,name,owner_id').order('created_at', { ascending: false });
    setRooms((data ?? []) as Room[]);
  };
  useEffect(() => { loadRooms(); }, []);

  const createRoom = async () => {
    if (!newRoom.trim() || !userId) return;
    const { error } = await supabase.from('collab_rooms').insert({ name: newRoom.trim(), owner_id: userId });
    if (error) { toast.error(error.message); return; }
    setNewRoom('');
    loadRooms();
  };

  useEffect(() => {
    if (!activeRoom) return;
    setNotes([]);
    supabase.from('collab_room_notes').select('*').eq('room_id', activeRoom).order('created_at', { ascending: true })
      .then(({ data }) => setNotes((data ?? []) as Note[]));

    const channel = supabase.channel(`room:${activeRoom}`, { config: { presence: { key: userId ?? 'anon' } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'collab_room_notes', filter: `room_id=eq.${activeRoom}` },
        (payload) => setNotes((prev) => [...prev, payload.new as Note]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'collab_room_notes', filter: `room_id=eq.${activeRoom}` },
        (payload) => setNotes((prev) => prev.map(n => n.id === (payload.new as Note).id ? payload.new as Note : n)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'collab_room_notes', filter: `room_id=eq.${activeRoom}` },
        (payload) => setNotes((prev) => prev.filter(n => n.id !== (payload.old as Note).id)))
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        const users = Object.entries(state).map(([user, arr]) => ({ user, name: (arr[0] as any)?.name ?? user }));
        setPresence(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: displayName, ts: Date.now() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom, userId, displayName]);

  const post = async () => {
    if (!activeRoom || !userId || !content.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('collab_room_notes').insert({
      room_id: activeRoom, author_id: userId, author_name: displayName,
      title: title.trim() || null, content: content.trim(),
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setContent(''); setTitle('');
  };

  return (
    <div className="container mx-auto py-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <Users className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-bold">{isAr ? 'المحرر التعاوني اللحظي' : 'Live Collaborative Editor'}</h1>
        <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <Card className="p-3 space-y-3">
          <div className="flex gap-2">
            <Input value={newRoom} onChange={(e) => setNewRoom(e.target.value)}
                   placeholder={isAr ? 'غرفة جديدة...' : 'New room...'}
                   onKeyDown={(e) => e.key === 'Enter' && createRoom()} />
            <Button size="icon" onClick={createRoom}><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-1">
            {rooms.map(r => (
              <button key={r.id}
                      onClick={() => setActiveRoom(r.id)}
                      className={`w-full text-start px-3 py-2 rounded text-sm ${activeRoom === r.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}>
                {r.name}
              </button>
            ))}
            {rooms.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">{isAr ? 'لا توجد غرف بعد' : 'No rooms yet'}</div>}
          </div>
        </Card>

        <Card className="p-4 space-y-4 min-h-[400px]">
          {!activeRoom ? (
            <div className="text-center text-muted-foreground py-16">{isAr ? 'اختر غرفة للبدء' : 'Select a room to start'}</div>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{isAr ? 'متصلون:' : 'Online:'}</span>
                {presence.map(p => <Badge key={p.user} variant="secondary" className="text-xs">{p.name}</Badge>)}
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {notes.map(n => (
                  <div key={n.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{n.author_name ?? 'anon'} • {new Date(n.created_at).toLocaleTimeString()}</span>
                    </div>
                    {n.title && <div className="font-medium mb-1">{n.title}</div>}
                    <div className="text-sm whitespace-pre-wrap">{n.content}</div>
                  </div>
                ))}
                {notes.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">{isAr ? 'أول ملاحظة تبدأ النقاش' : 'Post the first note'}</div>}
              </div>
              <div className="space-y-2 border-t pt-3">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isAr ? 'عنوان (اختياري)' : 'Title (optional)'} />
                <Textarea value={content} onChange={(e) => setContent(e.target.value)}
                          placeholder={isAr ? 'اكتب مساهمتك...' : 'Write your note...'} rows={3} />
                <Button onClick={post} disabled={loading || !content.trim()} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Send className="w-4 h-4 me-2" />}
                  {isAr ? 'نشر' : 'Post'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
