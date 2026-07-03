import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Send, Crown, Mail, X, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

interface Room {
  id: string; owner_id: string; name: string; description: string | null;
  member_emails: string[]; created_at: string;
}
interface Note {
  id: string; room_id: string; author_id: string; author_name: string | null;
  title: string | null; content: string; created_at: string;
}

export default function Collaborate() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [active, setActive] = useState<Room | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', emails: '' });
  const [newNote, setNewNote] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMe({ id: user.id, email: user.email ?? '' });
      await loadRooms();
    })();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collab_rooms').select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setRooms(data ?? []);
    setLoading(false);
  };

  const openRoom = async (room: Room) => {
    setActive(room);
    const { data, error } = await supabase
      .from('collab_room_notes').select('*')
      .eq('room_id', room.id).order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setNotes(data ?? []);
  };

  const createRoom = async () => {
    if (!me || !form.name.trim()) return;
    const emails = form.emails.split(/[\s,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean);
    const { error } = await supabase.from('collab_rooms').insert({
      owner_id: me.id, name: form.name.trim(),
      description: form.description.trim() || null,
      member_emails: emails,
    });
    if (error) return toast.error(error.message);
    toast.success(isAr ? 'أُنشئت الغرفة' : 'Room created');
    setCreating(false); setForm({ name: '', description: '', emails: '' });
    loadRooms();
  };

  const deleteRoom = async (room: Room) => {
    if (!confirm(isAr ? 'حذف الغرفة نهائيًا؟' : 'Delete room permanently?')) return;
    const { error } = await supabase.from('collab_rooms').delete().eq('id', room.id);
    if (error) return toast.error(error.message);
    setActive(null); loadRooms();
  };

  const addMember = async (room: Room, email: string) => {
    const e = email.trim().toLowerCase();
    if (!e || room.member_emails.includes(e)) return;
    const next = [...room.member_emails, e];
    const { error } = await supabase.from('collab_rooms')
      .update({ member_emails: next }).eq('id', room.id);
    if (error) return toast.error(error.message);
    setActive({ ...room, member_emails: next });
    loadRooms();
  };
  const removeMember = async (room: Room, email: string) => {
    const next = room.member_emails.filter(x => x !== email);
    const { error } = await supabase.from('collab_rooms')
      .update({ member_emails: next }).eq('id', room.id);
    if (error) return toast.error(error.message);
    setActive({ ...room, member_emails: next });
    loadRooms();
  };

  const postNote = async () => {
    if (!me || !active || !newNote.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('collab_room_notes').insert({
      room_id: active.id, author_id: me.id,
      author_name: me.email.split('@')[0], content: newNote.trim(),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setNewNote(''); openRoom(active);
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('collab_room_notes').delete().eq('id', id);
    if (error) return toast.error(error.message);
    if (active) openRoom(active);
  };

  const [inviteInput, setInviteInput] = useState('');

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary"><Users className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">{isAr ? 'المشاركة التعاونية' : 'Collaboration'}</h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? 'غرف مشتركة لتبادل الملاحظات مع الزملاء' : 'Shared rooms to swap notes with teammates'}
            </p>
          </div>
        </div>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button className="gap-1"><Plus className="w-4 h-4" />{isAr ? 'غرفة جديدة' : 'New room'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isAr ? 'إنشاء غرفة' : 'Create room'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder={isAr ? 'اسم الغرفة' : 'Room name'}
                     value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder={isAr ? 'وصف مختصر (اختياري)' : 'Short description (optional)'}
                        value={form.description} rows={2}
                        onChange={e => setForm({ ...form, description: e.target.value })} />
              <Textarea placeholder={isAr ? 'بريد الأعضاء (مفصول بفاصلة أو مسافة)' : 'Member emails (comma or space separated)'}
                        value={form.emails} rows={2}
                        onChange={e => setForm({ ...form, emails: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={createRoom}>{isAr ? 'إنشاء' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Rooms list */}
        <div className="space-y-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />}
          {!loading && rooms.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isAr ? 'لا غرف بعد.' : 'No rooms yet.'}
            </p>
          )}
          {rooms.map(r => {
            const owned = r.owner_id === me?.id;
            return (
              <button key={r.id} onClick={() => openRoom(r)}
                      className={`w-full text-start p-3 rounded-lg border transition-colors ${
                        active?.id === r.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate flex-1">{r.name}</span>
                  {owned && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                  <span>{r.member_emails.length + 1} {isAr ? 'أعضاء' : 'members'}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Room detail */}
        <div>
          {!active ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                {isAr ? 'اختر غرفة من اليمين أو أنشئ واحدة' : 'Select a room or create a new one'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {active.name}
                        {active.owner_id === me?.id && <Badge variant="outline" className="text-[10px]">{isAr ? 'مالك' : 'Owner'}</Badge>}
                      </CardTitle>
                      {active.description && (
                        <p className="text-xs text-muted-foreground mt-1">{active.description}</p>
                      )}
                    </div>
                    {active.owner_id === me?.id && (
                      <Button size="sm" variant="ghost" className="text-destructive"
                              onClick={() => deleteRoom(active)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />{isAr ? 'الأعضاء' : 'Members'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {active.member_emails.map(e => (
                      <Badge key={e} variant="secondary" className="gap-1 text-xs">
                        {e}
                        {active.owner_id === me?.id && (
                          <button onClick={() => removeMember(active, e)}
                                  className="hover:text-destructive"><X className="w-3 h-3" /></button>
                        )}
                      </Badge>
                    ))}
                    {active.member_emails.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        {isAr ? 'لا أعضاء بعد.' : 'No members yet.'}
                      </span>
                    )}
                  </div>
                  {active.owner_id === me?.id && (
                    <div className="flex gap-2 pt-1">
                      <Input placeholder={isAr ? 'بريد إلكتروني' : 'email@example.com'}
                             value={inviteInput}
                             onChange={e => setInviteInput(e.target.value)}
                             onKeyDown={e => {
                               if (e.key === 'Enter') { addMember(active, inviteInput); setInviteInput(''); }
                             }} className="h-8 text-sm" />
                      <Button size="sm" variant="outline"
                              onClick={() => { addMember(active, inviteInput); setInviteInput(''); }}>
                        {isAr ? 'دعوة' : 'Invite'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Post note */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <Textarea placeholder={isAr ? 'اكتب ملاحظة للفريق…' : 'Write a note for the room…'}
                            value={newNote} rows={3}
                            onChange={e => setNewNote(e.target.value)} />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={postNote} disabled={posting || !newNote.trim()} className="gap-1">
                      {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {isAr ? 'نشر' : 'Post'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notes feed */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {notes.length} {isAr ? 'ملاحظة' : 'notes'}
                </div>
                {notes.map(n => (
                  <Card key={n.id}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-muted-foreground mb-1">
                            <span className="font-medium text-foreground">{n.author_name ?? '—'}</span>
                            {' · '}{new Date(n.created_at).toLocaleString()}
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">{n.content}</div>
                        </div>
                        {(n.author_id === me?.id || active.owner_id === me?.id) && (
                          <button onClick={() => deleteNote(n.id)}
                                  className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {notes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {isAr ? 'لا ملاحظات بعد. ابدأ الأولى.' : 'No notes yet. Post the first one.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
