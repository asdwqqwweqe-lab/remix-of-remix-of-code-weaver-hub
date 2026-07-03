import { useEffect, useState } from 'react';
import { Check, ChevronDown, Plus, Trash2, Pencil, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useWorkspaceStore, hexToHslString, type Workspace,
} from '@/store/workspaceStore';

/**
 * Applies the active workspace accent to `--primary` at the document root.
 * Mounted once via the switcher (or independently) so route changes keep the color.
 */
function useAccentInjection() {
  const active = useWorkspaceStore(s =>
    s.workspaces.find(w => w.id === s.activeId) ?? s.workspaces[0]);
  useEffect(() => {
    if (!active) return;
    const hsl = hexToHslString(active.accent);
    const el = document.documentElement;
    const prev = el.style.getPropertyValue('--primary');
    el.style.setProperty('--primary', hsl);
    el.style.setProperty('--ring', hsl);
    return () => { el.style.setProperty('--primary', prev); };
  }, [active?.accent]);
}

export default function WorkspaceSwitcher() {
  useAccentInjection();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { workspaces, activeId, setActive, addWorkspace, updateWorkspace, removeWorkspace } =
    useWorkspaceStore();
  const active = workspaces.find(w => w.id === activeId) ?? workspaces[0];

  const [popOpen, setPopOpen] = useState(false);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', emoji: '✨', accent: '#14b8a6' });

  const openCreate = () => {
    setCreating(true); setEditing(null);
    setForm({ name: '', emoji: '✨', accent: '#14b8a6' });
    setPopOpen(false);
  };
  const openEdit = (w: Workspace) => {
    setEditing(w); setCreating(false);
    setForm({ name: isAr ? w.name.ar : w.name.en, emoji: w.emoji, accent: w.accent });
    setPopOpen(false);
  };
  const submit = () => {
    if (!form.name.trim()) return;
    if (creating) {
      addWorkspace({
        name: { ar: form.name, en: form.name },
        emoji: form.emoji, accent: form.accent,
      });
    } else if (editing) {
      updateWorkspace(editing.id, {
        name: { ...editing.name, [isAr ? 'ar' : 'en']: form.name },
        emoji: form.emoji, accent: form.accent,
      });
    }
    setCreating(false); setEditing(null);
  };

  return (
    <>
      <Popover open={popOpen} onOpenChange={setPopOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <span className="text-base leading-none">{active?.emoji ?? '🏠'}</span>
            <span className="hidden sm:inline text-sm max-w-[100px] truncate">
              {active ? (isAr ? active.name.ar : active.name.en) : '—'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            {isAr ? 'المساحات' : 'Workspaces'}
          </div>
          <div className="space-y-1">
            {workspaces.map(w => (
              <div key={w.id}
                   className={cn(
                     'group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer',
                     w.id === activeId && 'bg-muted',
                   )}
                   onClick={() => { setActive(w.id); setPopOpen(false); }}>
                <span className="text-lg leading-none">{w.emoji}</span>
                <span className="flex-1 text-sm truncate">{isAr ? w.name.ar : w.name.en}</span>
                <span className="w-3 h-3 rounded-full border" style={{ background: w.accent }} />
                {w.id === activeId && <Check className="w-3.5 h-3.5 text-primary" />}
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); openEdit(w); }}>
                  <Pencil className="w-3 h-3" />
                </button>
                {!w.builtin && (
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeWorkspace(w.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8"
                    onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              {isAr ? 'مساحة جديدة' : 'New workspace'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={creating || !!editing}
              onOpenChange={o => { if (!o) { setCreating(false); setEditing(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {creating
                ? (isAr ? 'مساحة جديدة' : 'New workspace')
                : (isAr ? 'تعديل المساحة' : 'Edit workspace')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{isAr ? 'الاسم' : 'Name'}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                     placeholder={isAr ? 'مثال: بحث' : 'e.g. Research'} />
            </div>
            <div className="flex gap-2">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">{isAr ? 'رمز تعبيري' : 'Emoji'}</Label>
                <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}
                       maxLength={4} className="text-center text-lg" />
              </div>
              <div className="space-y-1 flex-1">
                <Label className="text-xs">{isAr ? 'اللون' : 'Accent'}</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.accent}
                         onChange={e => setForm({ ...form, accent: e.target.value })}
                         className="h-10 w-12 rounded cursor-pointer bg-transparent border" />
                  <Input value={form.accent}
                         onChange={e => setForm({ ...form, accent: e.target.value })}
                         className="font-mono text-xs" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={submit}>{isAr ? 'حفظ' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
