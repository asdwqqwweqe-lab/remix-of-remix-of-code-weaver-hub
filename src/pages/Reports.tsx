import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import Pagination from '@/components/common/Pagination';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 6;

const Reports = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const {
    searchQuery,
    setSearchQuery,
    getFilteredReports,
    deleteReport,
    deleteMultipleReports
  } = useReportStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const reports = getFilteredReports();
  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const paginatedReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleOpenDelete = (id: string) => {
    setSelectedReport(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (selectedReport) {
      deleteReport(selectedReport);
      setIsDeleteOpen(false);
      setSelectedReport(null);
      toast.success(language === 'ar' ? 'تم حذف التقرير بنجاح' : 'Report deleted successfully');
    }
  };

  const handleBulkDelete = () => {
    deleteMultipleReports(selectedReports);
    toast.success(
      language === 'ar'
        ? `تم حذف ${selectedReports.length} تقرير بنجاح`
        : `${selectedReports.length} reports deleted successfully`
    );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'التقارير' : 'Reports'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'ar'
              ? `${reports.length} تقرير`
              : `${reports.length} reports`}
          </p>
        </div>
        <Button onClick={() => navigate('/reports/new')} className="gap-2">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'تقرير جديد' : 'New Report'}
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {paginatedReports.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedReports.length === paginatedReports.length && paginatedReports.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label={language === 'ar' ? 'تحديد الكل' : 'Select all'}
              />
              <span className="text-sm text-muted-foreground">
                {selectedReports.length > 0
                  ? language === 'ar'
                    ? `تم تحديد ${selectedReports.length} تقرير`
                    : `${selectedReports.length} selected`
                  : language === 'ar'
                    ? 'تحديد الكل'
                    : 'Select all'}
              </span>
            </div>
            {selectedReports.length > 0 && (
              <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    {language === 'ar'
                      ? `حذف المحدد (${selectedReports.length})`
                      : `Delete selected (${selectedReports.length})`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === 'ar' ? 'تأكيد الحذف المتعدد' : 'Confirm Bulk Delete'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'ar'
                        ? `هل أنت متأكد من حذف ${selectedReports.length} تقرير؟ لا يمكن التراجع عن هذا الإجراء.`
                        : `Are you sure you want to delete ${selectedReports.length} reports? This action cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleBulkDelete}
                    >
                      {language === 'ar'
                        ? `حذف (${selectedReports.length})`
                        : `Delete (${selectedReports.length})`}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={language === 'ar' ? 'بحث في التقارير...' : 'Search reports...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="ps-9"
        />
      </div>

      {/* Reports Grid */}
      {paginatedReports.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedReports.map((report) => (
            <Card
              key={report.id}
              className="group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/reports/${report.id}`)}
            >
              {/* Featured Image */}
              {report.featuredImage ? (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={report.featuredImage}
                    alt={report.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => toggleSelectReport(report.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`${language === 'ar' ? 'تحديد' : 'Select'} ${report.title}`}
                    />
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    <CardTitle className="text-lg line-clamp-1">{report.title}</CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/reports/${report.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/reports/edit/${report.id}`);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDelete(report.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {report.content.replace(/[#*`\[\]]/g, '').substring(0, 120)}...
                </p>

                {report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {report.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {report.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{report.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(report.updatedAt), 'PPP', {
                    locale: language === 'ar' ? ar : enUS
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'ar' ? 'لا توجد تقارير' : 'No reports yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'ar'
                ? 'أنشئ تقريرك الأول الآن'
                : 'Create your first report now'}
            </p>
            <Button onClick={() => navigate('/reports/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'تقرير جديد' : 'New Report'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={reports.length}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف التقرير' : 'Delete Report'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar'
                ? 'هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this report? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reports;
