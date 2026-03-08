import { useState, useEffect } from 'react';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cloud, CloudUpload, CloudDownload, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Page } from '@/types/pageBuilder';

interface Backup {
  id: string;
  backup_name: string;
  pages_data: Page[];
  created_at: string;
}

export default function CloudBackupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { pages } = usePageBuilderStore();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backupName, setBackupName] = useState('');

  const fetchBackups = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('page_builder_backups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBackups((data as any as Backup[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchBackups();
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error(isRTL ? 'يجب تسجيل الدخول' : 'Login required'); setSaving(false); return; }
    const name = backupName.trim() || `Backup ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
    const { error } = await supabase.from('page_builder_backups').insert({
      user_id: user.id,
      backup_name: name,
      pages_data: pages as any,
    });
    if (error) { toast.error(error.message); } else {
      toast.success(isRTL ? 'تم حفظ النسخة الاحتياطية' : 'Backup saved');
      setBackupName('');
      fetchBackups();
    }
    setSaving(false);
  };

  const handleRestore = (backup: Backup) => {
    const store = usePageBuilderStore.getState();
    // Clear existing and add backup pages
    store.pages.forEach(p => store.deletePage(p.id));
    backup.pages_data.forEach(p => {
      const { id, createdAt, updatedAt, ...rest } = p;
      store.addPage({ ...rest });
    });
    toast.success(isRTL ? 'تم استعادة النسخة الاحتياطية' : 'Backup restored');
    onOpenChange(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('page_builder_backups').delete().eq('id', id);
    setBackups(b => b.filter(x => x.id !== id));
    toast.success(isRTL ? 'تم الحذف' : 'Deleted');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            {isRTL ? 'النسخ الاحتياطي السحابي' : 'Cloud Backup'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Save new backup */}
          <div className="flex gap-2">
            <Input
              value={backupName}
              onChange={e => setBackupName(e.target.value)}
              placeholder={isRTL ? 'اسم النسخة (اختياري)' : 'Backup name (optional)'}
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={saving || pages.length === 0} className="gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </div>

          {pages.length === 0 && (
            <p className="text-xs text-muted-foreground">{isRTL ? 'لا توجد صفحات لحفظها' : 'No pages to backup'}</p>
          )}

          {/* Backup list */}
          <div>
            <Label className="text-xs text-muted-foreground">{isRTL ? 'النسخ المحفوظة' : 'Saved Backups'}</Label>
            <ScrollArea className="max-h-60 mt-2">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : backups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{isRTL ? 'لا توجد نسخ احتياطية' : 'No backups yet'}</p>
              ) : (
                <div className="space-y-2">
                  {backups.map(b => (
                    <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.backup_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(b.created_at), 'yyyy-MM-dd HH:mm')} — {Array.isArray(b.pages_data) ? b.pages_data.length : 0} {isRTL ? 'صفحة' : 'pages'}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestore(b)}>
                        <CloudDownload className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
