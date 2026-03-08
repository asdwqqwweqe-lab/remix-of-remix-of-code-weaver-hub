import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface BulkActionsProps {
  selectedPosts: string[];
  totalPosts: number;
  toggleSelectAll: () => void;
  onBulkDelete: () => void;
  showDialog: boolean;
  setShowDialog: (v: boolean) => void;
}

export default function BulkActions({ selectedPosts, totalPosts, toggleSelectAll, onBulkDelete, showDialog, setShowDialog }: BulkActionsProps) {
  if (totalPosts === 0) return null;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedPosts.length === totalPosts && totalPosts > 0}
            onCheckedChange={toggleSelectAll}
            aria-label="تحديد الكل"
          />
          <span className="text-sm text-muted-foreground">
            {selectedPosts.length > 0 ? `تم تحديد ${selectedPosts.length} موضوع` : 'تحديد الكل'}
          </span>
        </div>
        {selectedPosts.length > 0 && (
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" />
                حذف المحدد ({selectedPosts.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف المتعدد</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف {selectedPosts.length} موضوع؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onBulkDelete}>
                  حذف ({selectedPosts.length})
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Card>
  );
}
