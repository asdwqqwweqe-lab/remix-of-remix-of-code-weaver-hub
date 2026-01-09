import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Check, Edit2, Tag, Folder, Globe, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ReportPreviewData {
  title: string;
  tags: string[];
}

export interface PostPreviewData {
  title: string;
  slug: string;
  summary: string;
  categoryName: string;
  collectionName: string;
  tags: string[];
  languages: string[];
}

interface AIPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'report' | 'post';
  reportData?: ReportPreviewData;
  postData?: PostPreviewData;
  onConfirm: (data: ReportPreviewData | PostPreviewData) => void;
}

const AIPreviewDialog = ({
  open,
  onOpenChange,
  type,
  reportData,
  postData,
  onConfirm,
}: AIPreviewDialogProps) => {
  const { language } = useLanguage();
  
  // Report state
  const [reportTitle, setReportTitle] = useState('');
  const [reportTags, setReportTags] = useState<string[]>([]);
  const [newReportTag, setNewReportTag] = useState('');
  
  // Post state
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postSummary, setPostSummary] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [postCollection, setPostCollection] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [postLanguages, setPostLanguages] = useState<string[]>([]);
  const [newPostTag, setNewPostTag] = useState('');
  const [newPostLang, setNewPostLang] = useState('');

  // Update state when dialog opens with new data
  useEffect(() => {
    if (open && reportData) {
      setReportTitle(reportData.title || '');
      setReportTags(reportData.tags || []);
    }
  }, [open, reportData]);

  useEffect(() => {
    if (open && postData) {
      setPostTitle(postData.title || '');
      setPostSlug(postData.slug || '');
      setPostSummary(postData.summary || '');
      setPostCategory(postData.categoryName || '');
      setPostCollection(postData.collectionName || '');
      setPostTags(postData.tags || []);
      setPostLanguages(postData.languages || []);
    }
  }, [open, postData]);

  const handleAddReportTag = () => {
    if (newReportTag.trim() && !reportTags.includes(newReportTag.trim())) {
      setReportTags([...reportTags, newReportTag.trim()]);
      setNewReportTag('');
    }
  };

  const handleRemoveReportTag = (tag: string) => {
    setReportTags(reportTags.filter(t => t !== tag));
  };

  const handleAddPostTag = () => {
    if (newPostTag.trim() && !postTags.includes(newPostTag.trim())) {
      setPostTags([...postTags, newPostTag.trim()]);
      setNewPostTag('');
    }
  };

  const handleRemovePostTag = (tag: string) => {
    setPostTags(postTags.filter(t => t !== tag));
  };

  const handleAddPostLang = () => {
    if (newPostLang.trim() && !postLanguages.includes(newPostLang.trim())) {
      setPostLanguages([...postLanguages, newPostLang.trim()]);
      setNewPostLang('');
    }
  };

  const handleRemovePostLang = (lang: string) => {
    setPostLanguages(postLanguages.filter(l => l !== lang));
  };

  const handleConfirm = () => {
    if (type === 'report') {
      onConfirm({
        title: reportTitle,
        tags: reportTags,
      });
    } else {
      onConfirm({
        title: postTitle,
        slug: postSlug,
        summary: postSummary,
        categoryName: postCategory,
        collectionName: postCollection,
        tags: postTags,
        languages: postLanguages,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="w-5 h-5" />
            {language === 'ar' ? 'معاينة وتعديل الحقول المولدة' : 'Preview & Edit Generated Fields'}
          </DialogTitle>
        </DialogHeader>

        {type === 'report' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'العنوان' : 'Title'}</Label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {language === 'ar' ? 'الوسوم' : 'Tags'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newReportTag}
                  onChange={(e) => setNewReportTag(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف وسم...' : 'Add tag...'}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddReportTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddReportTag}>
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>
              {reportTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reportTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => handleRemoveReportTag(tag)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {type === 'post' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'العنوان' : 'Title'}</Label>
                <Input
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الرابط المختصر' : 'Slug'}</Label>
                <Input
                  value={postSlug}
                  onChange={(e) => setPostSlug(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ar' ? 'الملخص' : 'Summary'}</Label>
              <Textarea
                value={postSummary}
                onChange={(e) => setPostSummary(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  {language === 'ar' ? 'التصنيف' : 'Category'}
                </Label>
                <Input
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {language === 'ar' ? 'المجموعة' : 'Collection'}
                </Label>
                <Input
                  value={postCollection}
                  onChange={(e) => setPostCollection(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {language === 'ar' ? 'الوسوم' : 'Tags'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newPostTag}
                  onChange={(e) => setNewPostTag(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف وسم...' : 'Add tag...'}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPostTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddPostTag}>
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>
              {postTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {postTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => handleRemovePostTag(tag)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {language === 'ar' ? 'لغات البرمجة' : 'Programming Languages'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newPostLang}
                  onChange={(e) => setNewPostLang(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف لغة...' : 'Add language...'}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPostLang())}
                />
                <Button type="button" variant="outline" onClick={handleAddPostLang}>
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </div>
              {postLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {postLanguages.map((lang) => (
                    <Badge key={lang} variant="outline" className="gap-1">
                      {lang}
                      <button onClick={() => handleRemovePostLang(lang)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            <Check className="w-4 h-4" />
            {language === 'ar' ? 'تطبيق' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIPreviewDialog;
