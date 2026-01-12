import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReportStore } from '@/store/reportStore';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight,
  Plus, 
  X, 
  Save,
  ImagePlus,
  BookOpen,
  Folder,
  PanelLeftClose,
  PanelLeft,
  Eye,
  EyeOff,
  FileEdit,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import MarkdownEditor from '@/components/reports/MarkdownEditor';
import AdvancedWysiwygEditor from '@/components/reports/AdvancedWysiwygEditor';
import ReportTemplates from '@/components/reports/ReportTemplates';
import TableOfContents from '@/components/reports/TableOfContents';
import QuickLinks from '@/components/reports/QuickLinks';
import LivePreview from '@/components/reports/LivePreview';
import AIFormatButton from '@/components/reports/AIFormatButton';
import AIAutoFillButton from '@/components/common/AIAutoFillButton';
import ScrollButtons from '@/components/common/ScrollButtons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface QuickLink {
  id: string;
  label: string;
  url: string;
}

const ReportEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getReportById, addReport, updateReport } = useReportStore();
  const { posts, collections } = useBlogStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(id);
  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const [showSidebar, setShowSidebar] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [editorMode, setEditorMode] = useState<'markdown' | 'wysiwyg'>('wysiwyg');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    featuredImage: '',
    linkedPostIds: [] as string[],
    linkedCollectionIds: [] as string[],
    quickLinks: [] as QuickLink[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (id) {
      const report = getReportById(id);
      if (report) {
        setFormData({
          title: report.title,
          content: report.content,
          tags: report.tags,
          featuredImage: report.featuredImage || '',
          linkedPostIds: report.linkedPostIds || [],
          linkedCollectionIds: report.linkedCollectionIds || [],
          quickLinks: (report as any).quickLinks || [],
        });
      }
    }
  }, [id, getReportById]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, featuredImage: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePostLink = (postId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedPostIds: prev.linkedPostIds.includes(postId)
        ? prev.linkedPostIds.filter(id => id !== postId)
        : [...prev.linkedPostIds, postId]
    }));
  };

  const toggleCollectionLink = (collectionId: string) => {
    setFormData(prev => ({
      ...prev,
      linkedCollectionIds: prev.linkedCollectionIds.includes(collectionId)
        ? prev.linkedCollectionIds.filter(id => id !== collectionId)
        : [...prev.linkedCollectionIds, collectionId]
    }));
  };

  const handleSelectTemplate = (content: string) => {
    if (formData.content && content) {
      if (!confirm(language === 'ar' ? 'هل تريد استبدال المحتوى الحالي؟' : 'Replace current content?')) {
        return;
      }
    }
    setFormData(prev => ({ ...prev, content }));
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error(language === 'ar' ? 'يرجى ملء العنوان والمحتوى' : 'Please fill title and content');
      return;
    }

    if (isEditing && id) {
      updateReport(id, formData);
      toast.success(language === 'ar' ? 'تم تحديث التقرير' : 'Report updated');
    } else {
      addReport(formData);
      toast.success(language === 'ar' ? 'تم إنشاء التقرير' : 'Report created');
    }
    navigate('/reports');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/reports')}>
            <BackIcon className="w-4 h-4 me-2" />
            {language === 'ar' ? 'العودة' : 'Back'}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}>
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowPreview(!showPreview)} title={showPreview ? 'Hide preview' : 'Show preview'} data-preview-toggle>
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim()} data-save-button>
          <Save className="w-4 h-4 me-2" />
          {language === 'ar' ? 'حفظ' : 'Save'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sidebar */}
        {showSidebar && (
          <div className="space-y-4 order-2 lg:order-1">
            <ReportTemplates onSelectTemplate={handleSelectTemplate} />
            <TableOfContents content={formData.content} />
            <QuickLinks 
              links={formData.quickLinks} 
              onChange={(links) => setFormData(prev => ({ ...prev, quickLinks: links }))} 
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`space-y-6 order-1 lg:order-2 ${showSidebar && showPreview ? 'lg:col-span-2' : showSidebar || showPreview ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div>
            <Label className="mb-1.5 block">{language === 'ar' ? 'العنوان' : 'Title'}</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={language === 'ar' ? 'عنوان التقرير' : 'Report title'}
              className="text-lg"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">{language === 'ar' ? 'الصورة المميزة' : 'Featured Image'}</Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.featuredImage ? (
                <div className="relative">
                  <img src={formData.featuredImage} alt="Featured" className="max-h-32 mx-auto rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, featuredImage: '' })); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <ImagePlus className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'اضغط لرفع صورة' : 'Click to upload'}</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>{language === 'ar' ? 'المحتوى' : 'Content'}</Label>
              <div className="flex items-center gap-2">
                <AIAutoFillButton
                  content={formData.content}
                  type="report"
                  onAutoFillReport={(result) => {
                    setFormData(prev => ({
                      ...prev,
                      title: result.title,
                      tags: [...new Set([...prev.tags, ...result.tags])],
                    }));
                  }}
                />
                <AIFormatButton
                  content={formData.content}
                  onFormat={(formatted) => setFormData(prev => ({ ...prev, content: formatted }))}
                />
                <Tabs value={editorMode} onValueChange={(v) => setEditorMode(v as 'markdown' | 'wysiwyg')}>
                  <TabsList className="h-8">
                    <TabsTrigger value="wysiwyg" className="text-xs gap-1 h-7 px-2">
                      <FileEdit className="w-3 h-3" />
                      WYSIWYG
                    </TabsTrigger>
                    <TabsTrigger value="markdown" className="text-xs gap-1 h-7 px-2">
                      <FileText className="w-3 h-3" />
                      Markdown
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            {editorMode === 'wysiwyg' ? (
              <AdvancedWysiwygEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder={language === 'ar' ? 'اكتب تقريرك...' : 'Write your report...'}
              />
            ) : (
              <MarkdownEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder={language === 'ar' ? 'اكتب تقريرك...' : 'Write your report...'}
              />
            )}
          </div>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="order-3 lg:order-3">
            <LivePreview 
              content={formData.content} 
              title={formData.title}
              className="sticky top-4"
            />
          </div>
        )}

        {/* Right Sidebar */}
        <div className="space-y-4 order-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{language === 'ar' ? 'الوسوم' : 'Tags'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف وسم...' : 'Add tag...'}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {language === 'ar' ? 'ربط بمقالات' : 'Link to Posts'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {posts.length > 0 ? posts.map((post) => (
                    <div key={post.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`post-${post.id}`}
                        checked={formData.linkedPostIds.includes(post.id)}
                        onCheckedChange={() => togglePostLink(post.id)}
                      />
                      <label htmlFor={`post-${post.id}`} className="text-sm cursor-pointer line-clamp-1 flex-1">
                        {post.title}
                      </label>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد مقالات' : 'No posts'}</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Folder className="w-4 h-4" />
                {language === 'ar' ? 'ربط بمجموعات' : 'Link to Collections'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {collections.length > 0 ? collections.map((col) => (
                    <div key={col.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`col-${col.id}`}
                        checked={formData.linkedCollectionIds.includes(col.id)}
                        onCheckedChange={() => toggleCollectionLink(col.id)}
                      />
                      <label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer line-clamp-1 flex-1">
                        {col.title}
                      </label>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا توجد مجموعات' : 'No collections'}</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <ScrollButtons />
    </div>
  );
};

export default ReportEditor;
