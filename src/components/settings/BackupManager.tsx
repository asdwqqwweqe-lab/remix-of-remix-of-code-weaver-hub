import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Download, RotateCcw, Trash2, Cloud } from 'lucide-react';
import { createBackup, listBackups, restoreBackup, deleteBackup } from '@/lib/backupService';
import { format } from 'date-fns';

interface Row {
  id: string;
  label: string;
  size_bytes: number;
  is_auto: boolean;
  created_at: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setRows((await listBackups()) as Row[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await createBackup('Manual Backup', false);
      toast.success('تم إنشاء النسخة الاحتياطية');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشل الإنشاء');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row: Row) => {
    if (!confirm(`استعادة "${row.label}"؟ سيتم استبدال البيانات الحالية.`)) return;
    setBusyId(row.id);
    try {
      await restoreBackup(row.id);
      toast.success('تمت الاستعادة — سيتم تحديث الصفحة');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'فشلت الاستعادة');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row: Row) => {
    if (!confirm(`حذف "${row.label}"؟`)) return;
    setBusyId(row.id);
    try {
      await deleteBackup(row.id);
      toast.success('تم الحذف');
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          النسخ الاحتياطية بإصدارات
        </CardTitle>
        <Button size="sm" onClick={handleCreate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 me-1" />}
          نسخة يدوية
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          يُنشأ backup تلقائي أسبوعياً. نحتفظ بآخر 10 نسخ فقط.
        </p>
        {rows.length === 0 && !loading && (
          <div className="text-center text-sm text-muted-foreground py-6">
            لا توجد نسخ احتياطية بعد
          </div>
        )}
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-lg border bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{row.label}</span>
                  {row.is_auto && <Badge variant="secondary" className="text-[10px]">تلقائي</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm')} · {formatSize(row.size_bytes)}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRestore(row)}
                disabled={busyId === row.id}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(row)}
                disabled={busyId === row.id}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
