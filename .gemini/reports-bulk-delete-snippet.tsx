// إضافات مطلوبة لملف Reports.tsx

// 1. في قسم الـ imports، أضف:
import { Checkbox } from '@/components/ui/checkbox';

// 2. بعد دالة handleDelete، أضف الدوال التالية:

const handleBulkDelete = () => {
    deleteMultipleReports(selectedReports);
    setSelectedReports([]);
    setShowBulkDeleteDialog(false);
};

const toggleSelectReport = (id: string) => {
    setSelectedReports(prev =>
        prev.includes(id) ? prev.filter(reportId => reportId !== id) : [...prev, id]
    );
};

const toggleSelectAll = () => {
    if (selectedReports.length === paginatedReports.length) {
        setSelectedReports([]);
    } else {
        setSelectedReports(paginatedReports.map(r => r.id));
    }
};

// 3. بعد header وقبل Search، أضف شريط الأدوات:

{/* Bulk Actions Toolbar */ }
{
    paginatedReports.length > 0 && (
        <Card className="p-3">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Checkbox
                        checked={selectedReports.length === paginatedReports.length && paginatedReports.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="تحديد الكل"
                    />
                    <span className="text-sm text-muted-foreground">
                        {selectedReports.length > 0
                            ? `تم تحديد ${selectedReports.length} تقرير`
                            : 'تحديد الكل'}
                    </span>
                </div>
                {selectedReports.length > 0 && (
                    <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                حذف المحدد ({selectedReports.length})
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف المتعدد</AlertDialogTitle>
                                <AlertDialogDescription>
                                    هل أنت متأكد من حذف {selectedReports.length} تقرير؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                            </DialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={handleBulkDelete}
                                >
                                    حذف ({selectedReports.length})
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </Card>
    )
}

// 4. في كل Card تقرير، داخل CardHeader، قبل العنوان مباشرة، أضف:

<div className="flex items-center gap-2">
    <Checkbox
        checked={selectedReports.includes(report.id)}
        onCheckedChange={() => toggleSelectReport(report.id)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`تحديد ${report.title}`}
    />
    {/* باقي المحتوى */}
</div>
