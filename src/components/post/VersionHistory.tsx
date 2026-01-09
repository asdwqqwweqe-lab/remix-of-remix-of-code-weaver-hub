import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { History, RotateCcw, Eye, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { PostVersion } from '@/types/blog';

interface VersionHistoryProps {
  postId: string;
}

const VersionHistory = ({ postId }: VersionHistoryProps) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { getPostVersions, restoreVersion, getPostById } = useBlogStore();
  
  const versions = getPostVersions(postId);
  const post = getPostById(postId);
  
  const [previewVersion, setPreviewVersion] = useState<PostVersion | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const handleRestore = (versionId: string, versionNumber: number) => {
    restoreVersion(versionId);
    toast.success(
      language === 'ar' 
        ? `تم استعادة الإصدار ${versionNumber}` 
        : `Version ${versionNumber} restored`
    );
  };

  const handlePreview = (version: PostVersion) => {
    setPreviewVersion(version);
    setPreviewDialogOpen(true);
  };

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5" />
            {language === 'ar' ? 'تاريخ الإصدارات' : 'Version History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {language === 'ar' ? 'لا توجد إصدارات سابقة' : 'No previous versions'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          {language === 'ar' ? 'تاريخ الإصدارات' : 'Version History'}
          <Badge variant="secondary">{versions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {versions.map((version) => (
            <AccordionItem key={version.id} value={version.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-start">
                  <Badge variant="outline">
                    {language === 'ar' ? `إصدار ${version.versionNumber}` : `v${version.versionNumber}`}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(version.createdAt), 'PPp', { 
                      locale: language === 'ar' ? ar : enUS 
                    })}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'العنوان:' : 'Title:'}
                    </p>
                    <p className="text-sm text-muted-foreground">{version.titleSnapshot}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? 'الملخص:' : 'Summary:'}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{version.summarySnapshot}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handlePreview(version)}
                    >
                      <Eye className="w-4 h-4" />
                      {language === 'ar' ? 'معاينة' : 'Preview'}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleRestore(version.id, version.versionNumber)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      {language === 'ar' ? 'استعادة' : 'Restore'}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {language === 'ar' 
                ? `معاينة الإصدار ${previewVersion?.versionNumber}` 
                : `Preview Version ${previewVersion?.versionNumber}`
              }
            </DialogTitle>
          </DialogHeader>
          
          {previewVersion && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'العنوان' : 'Title'}
                </h3>
                <h2 className="text-2xl font-bold">{previewVersion.titleSnapshot}</h2>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'الملخص' : 'Summary'}
                </h3>
                <p className="text-muted-foreground">{previewVersion.summarySnapshot}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">
                  {language === 'ar' ? 'المحتوى' : 'Content'}
                </h3>
                <div 
                  className="prose dark:prose-invert max-w-none border rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: previewVersion.contentSnapshot }}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    handleRestore(previewVersion.id, previewVersion.versionNumber);
                    setPreviewDialogOpen(false);
                  }}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  {language === 'ar' ? 'استعادة هذا الإصدار' : 'Restore this version'}
                </Button>
                <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default VersionHistory;
