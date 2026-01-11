import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReportStore } from '@/store/reportStore';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight,
  Calendar, 
  Tag, 
  FileText,
  Edit,
  Trash2,
  BookOpen,
  Folder,
  Clock,
  List,
  ExternalLink,
  Presentation
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import SimpleCodeBlock from '@/components/common/SimpleCodeBlock';
import ScrollProgress from '@/components/common/ScrollProgress';
import DisplaySettings, { DisplaySettingsValues } from '@/components/reports/DisplaySettings';
import PresentationMode from '@/components/reports/PresentationMode';
import ReportSearch from '@/components/reports/ReportSearch';
import TextTranslator from '@/components/reports/TextTranslator';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useMemo, useCallback, useRef } from 'react';

const ReportDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getReportById, deleteReport } = useReportStore();
  const { posts, collections, getPostById, getCollectionById } = useBlogStore();
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettingsValues>({
    fontSize: 16,
    lineHeight: 1.75,
    paragraphSpacing: 1.5,
    nightMode: false,
    codeFontSize: 14,
    codeLineHeight: 1.5,
  });
  const contentRef = useRef<HTMLDivElement>(null);

  const report = id ? getReportById(id) : undefined;
  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const handleSettingsChange = useCallback((settings: DisplaySettingsValues) => {
    setDisplaySettings(settings);
  }, []);

  // Extract headings for table of contents - improved to capture ALL headings
  const tableOfContents = useMemo(() => {
    if (!report?.content) return [];
    const lines = report.content.split('\n');
    const headings: { level: number; text: string; id: string }[] = [];
    let inCodeBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track code blocks to skip headings inside them
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) continue;
      
      // Match headings h1-h6 with various formats
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        // Clean the text from any custom id syntax like {#id} and markdown formatting
        let text = headingMatch[2]
          .replace(/\{#[\w-]+\}/g, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/`/g, '')
          .trim();
        
        // Generate ID matching the renderMarkdown function
        const id = text
          .toLowerCase()
          .replace(/[^\w\u0600-\u06FF]+/g, '-')
          .replace(/^-|-$/g, '');
        
        if (text && id) {
          headings.push({ level, text, id });
        }
      }
    }
    return headings;
  }, [report?.content]);

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {language === 'ar' ? 'التقرير غير موجود' : 'Report not found'}
        </h2>
        <Button onClick={() => navigate('/reports')} variant="outline">
          <BackIcon className="w-4 h-4 me-2" />
          {language === 'ar' ? 'العودة للتقارير' : 'Back to Reports'}
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    deleteReport(report.id);
    navigate('/reports');
  };

  const renderMarkdown = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      const codeMatch = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (codeMatch) {
        const lang = codeMatch[1] || 'plaintext';
        const code = codeMatch[2].trim();
        return (
          <div key={index} className="my-4">
            <SimpleCodeBlock code={code} language={lang} />
          </div>
        );
      }

      // Handle tables
      const tableRegex = /\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g;
      let processedPart = part;
      let tableMatch;
      
      while ((tableMatch = tableRegex.exec(part)) !== null) {
        const headers = tableMatch[1].split('|').map(h => h.trim()).filter(Boolean);
        const rows = tableMatch[2].trim().split('\n').map(row => 
          row.split('|').map(cell => cell.trim()).filter(Boolean)
        );
        
        const tableHtml = `
          <div class="my-4 overflow-x-auto rounded-lg border border-border/50">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-muted/50 border-b border-border/50">
                  ${headers.map(h => `<th class="px-3 py-2 text-start font-semibold text-foreground">${h}</th>`).join('')}
                </tr>
              </thead>
              <tbody class="divide-y divide-border/30">
                ${rows.map((row, i) => `
                  <tr class="${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/50 transition-colors">
                    ${row.map(cell => `<td class="px-3 py-2 text-muted-foreground">${cell}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        processedPart = processedPart.replace(tableMatch[0], tableHtml);
      }

      // Remove extra blank lines - aggressive cleaning
      processedPart = processedPart
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\s+$/gm, '')
        .trim();

      let html = processedPart
        .replace(/^###### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h6 id="${id}" class="text-sm font-semibold mt-3 mb-1 text-foreground scroll-mt-4">${text}</h6>`;
        })
        .replace(/^##### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h5 id="${id}" class="text-sm font-bold mt-3 mb-1 text-foreground scroll-mt-4">${text}</h5>`;
        })
        .replace(/^#### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h4 id="${id}" class="text-base font-bold mt-4 mb-2 text-foreground scroll-mt-4">${text}</h4>`;
        })
        .replace(/^### (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h3 id="${id}" class="text-lg font-bold mt-4 mb-2 text-foreground flex items-center gap-2 scroll-mt-4"><span class="w-1 h-4 bg-primary/60 rounded-full"></span>${text}</h3>`;
        })
        .replace(/^## (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h2 id="${id}" class="text-xl font-bold mt-5 mb-2 text-foreground flex items-center gap-2 scroll-mt-4 pb-2 border-b border-border/50"><span class="w-1.5 h-5 bg-primary rounded-full"></span>${text}</h2>`;
        })
        .replace(/^# (.*$)/gm, (_, text) => {
          const id = text.toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');
          return `<h1 id="${id}" class="text-2xl font-bold mt-5 mb-3 text-foreground scroll-mt-4 pb-2 border-b-2 border-primary/30">${text}</h1>`;
        })
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary border border-border/50">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline decoration-primary/30 hover:decoration-primary transition-colors inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">$1<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure class="my-3"><img src="$2" alt="$1" class="max-w-full rounded-lg shadow-md border border-border/50" /><figcaption class="text-center text-sm text-muted-foreground mt-1">$1</figcaption></figure>')
        .replace(/^> (.*$)/gm, '<blockquote class="border-s-4 border-primary/50 ps-3 py-1 my-2 bg-muted/30 rounded-e-lg italic text-muted-foreground">$1</blockquote>')
        .replace(/^---$/gm, '<hr class="my-4 border-t border-border/50" />')
        .replace(/^- \[x\] (.*$)/gm, '<li class="flex items-center gap-2"><span class="w-4 h-4 rounded bg-primary/20 text-primary flex items-center justify-center text-xs">✓</span><span class="line-through text-muted-foreground">$1</span></li>')
        .replace(/^- \[ \] (.*$)/gm, '<li class="flex items-center gap-2"><span class="w-4 h-4 rounded border border-border"></span><span>$1</span></li>')
        .replace(/^- (.*$)/gm, '<li class="flex items-start gap-2 ms-1"><span class="w-1.5 h-1.5 rounded-full bg-primary/60 mt-2 shrink-0"></span><span>$1</span></li>')
        .replace(/^\d+\. (.*$)/gm, '<li class="ms-4 list-decimal marker:text-primary marker:font-semibold">$1</li>');
      
      // Clean up spacing - no extra tags
      html = html
        .replace(/<br\s*\/?>/gi, '')
        .replace(/\n\n+/g, '\n')
        .replace(/\n/g, ' ')
        .replace(/<p[^>]*>\s*<\/p>/g, '')
        .replace(/<p[^>]*>[\s\u00A0]*<\/p>/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      html = html.replace(/(<li class="flex.*?<\/li>)+/g, (match) => {
        return `<ul class="my-3 space-y-0.5">${match}</ul>`;
      });
      
      html = html.replace(/(<li class="ms-4.*?<\/li>)+/g, (match) => {
        return `<ol class="my-3 space-y-0.5">${match}</ol>`;
      });

      // Apply paragraph spacing directly to HTML
      const styledHtml = html
        .replace(/<p/g, `<p style="margin-bottom: ${displaySettings.paragraphSpacing}rem;"`)
        .replace(/<h([1-6])/g, `<h$1 style="margin-bottom: ${displaySettings.paragraphSpacing * 0.75}rem; margin-top: ${displaySettings.paragraphSpacing}rem;"`)
        .replace(/<ul/g, `<ul style="margin-bottom: ${displaySettings.paragraphSpacing}rem;"`)
        .replace(/<ol/g, `<ol style="margin-bottom: ${displaySettings.paragraphSpacing}rem;"`);

      return (
        <div 
          key={index} 
          className={cn(
            "max-w-none report-styled-content",
            displaySettings.nightMode && "night-reading-mode"
          )}
          style={{
            fontSize: `${displaySettings.fontSize}px`,
            lineHeight: displaySettings.lineHeight,
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ 
            __html: styledHtml
          }}
        />
      );
    });
  };

  // Get linked posts
  const linkedPosts = report.linkedPostIds?.map(postId => getPostById(postId)).filter(Boolean) || [];
  const linkedCollections = report.linkedCollectionIds?.map(colId => getCollectionById(colId)).filter(Boolean) || [];
  const quickLinks = (report as any).quickLinks || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/reports')}>
          <BackIcon className="w-4 h-4 me-2" />
          {language === 'ar' ? 'العودة للتقارير' : 'Back to Reports'}
        </Button>
        <div className="flex gap-2">
          <ReportSearch content={report.content} />
          <Button variant="outline" onClick={() => setIsPresentationOpen(true)}>
            <Presentation className="w-4 h-4 me-2" />
            {language === 'ar' ? 'عرض تقديمي' : 'Present'}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/reports/edit/${report.id}`)}>
            <Edit className="w-4 h-4 me-2" />
            {language === 'ar' ? 'تعديل' : 'Edit'}
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 me-2" />
            {language === 'ar' ? 'حذف' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="space-y-4 order-2 lg:order-1">
          {/* Display Settings */}
          <DisplaySettings 
            onSettingsChange={handleSettingsChange} 
            className="sticky top-4"
          />

          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <List className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'فهرس المحتويات' : 'Table of Contents'}
                </h3>
                <ScrollArea className="max-h-64">
                  <nav className="space-y-1">
                    {tableOfContents.map((heading, index) => (
                      <a
                        key={index}
                        href={`#${heading.id}`}
                        className={`block text-sm py-1 px-2 rounded-md hover:bg-accent transition-colors ${
                          heading.level === 1 ? 'font-semibold text-foreground' :
                          heading.level === 2 ? 'ms-3 text-muted-foreground' :
                          heading.level === 3 ? 'ms-6 text-muted-foreground text-xs' :
                          heading.level === 4 ? 'ms-8 text-muted-foreground text-xs' :
                          heading.level === 5 ? 'ms-10 text-muted-foreground text-xs opacity-80' :
                          'ms-12 text-muted-foreground text-xs opacity-70'
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                </h3>
                <div className="space-y-1">
                  {quickLinks.map((link: any) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline p-1.5 rounded-md hover:bg-accent transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Posts */}
          {linkedPosts.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'المقالات المرتبطة' : 'Linked Posts'}
                </h3>
                <div className="space-y-1">
                  {linkedPosts.map((post) => post && (
                    <Link 
                      key={post.id} 
                      to={`/posts/${post.id}`}
                      className="block text-sm p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {post.title}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Linked Collections */}
          {linkedCollections.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                  <Folder className="w-4 h-4 text-primary" />
                  {language === 'ar' ? 'المجموعات المرتبطة' : 'Linked Collections'}
                </h3>
                <div className="space-y-1">
                  {linkedCollections.map((col) => col && (
                    <Link 
                      key={col.id} 
                      to={`/collections/${col.id}`}
                      className="block text-sm p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {col.title}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
          {/* Featured Image */}
          {report.featuredImage && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted shadow-lg">
              <img 
                src={report.featuredImage} 
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Meta */}
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">{report.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4" />
                {format(new Date(report.createdAt), 'PPP', { 
                  locale: language === 'ar' ? ar : enUS 
                })}
              </div>
              {report.updatedAt !== report.createdAt && (
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تحديث:' : 'Updated:'}</span>
                  {format(new Date(report.updatedAt), 'PPP', { 
                    locale: language === 'ar' ? ar : enUS 
                  })}
                </div>
              )}
            </div>

            {/* Tags */}
            {report.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {report.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1.5 px-3 py-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <Card className="shadow-sm">
            <CardContent className="pt-8 pb-12 px-6 md:px-10" dir="auto" ref={contentRef}>
              <article className="report-content">
                {renderMarkdown(report.content)}
              </article>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Text Translator */}
      <TextTranslator containerRef={contentRef} />

      {/* Scroll Progress */}
      <ScrollProgress />

      {/* Presentation Mode */}
      <PresentationMode
        content={report.content}
        title={report.title}
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
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

export default ReportDetails;
