import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import { common, createLowlight } from 'lowlight';
import { useState, useCallback, useRef, DragEvent } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Heading1, Heading2, Heading3, Link as LinkIcon,
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Maximize2, Minimize2, Table as TableIcon,
  Minus, Trash2, Upload, FileCode, Grid3X3,
  RowsIcon, ColumnsIcon, MoveVertical, MoveHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const lowlight = createLowlight(common);

interface AdvancedWysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const AdvancedWysiwygEditor = ({ value, onChange, placeholder, className }: AdvancedWysiwygEditorProps) => {
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        codeBlock: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline cursor-pointer',
        },
      }),
      Image.configure({ 
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full mx-auto my-4 shadow-md',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ 
        placeholder: placeholder || (language === 'ar' ? 'ابدأ الكتابة هنا...' : 'Start typing here...'),
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-border',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border px-3 py-2 text-start',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border px-3 py-2 text-start font-semibold bg-muted',
        },
      }),
      Dropcursor.configure({
        color: 'hsl(var(--primary))',
        width: 2,
      }),
      Gapcursor,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Handle drag and drop for images
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || !editor) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          editor.chain().focus().setImage({ src: base64 }).run();
          toast.success(language === 'ar' ? 'تم إدراج الصورة' : 'Image inserted');
        };
        reader.readAsDataURL(file);
      }
    }
  }, [editor, language]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
        toast.success(language === 'ar' ? 'تم إدراج الصورة' : 'Image inserted');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [editor, language]);

  const insertLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageDialogOpen(false);
    }
  }, [editor, imageUrl]);

  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
      setTableDialogOpen(false);
    }
  }, [editor, tableRows, tableCols]);

  if (!editor) return null;

  const ToolButton = ({ onClick, active, children, title, disabled }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode; 
    title: string;
    disabled?: boolean;
  }) => (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8', active && 'bg-primary/20 text-primary')}
            onClick={onClick}
            disabled={disabled}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <div 
        className={cn(
          "border rounded-lg overflow-hidden transition-all duration-300 bg-background",
          isExpanded && "fixed inset-4 z-50 shadow-2xl",
          isDragging && "ring-2 ring-primary ring-offset-2",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Main Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b bg-muted/30">
          {/* Text Formatting */}
          <div className="flex items-center">
            <ToolButton 
              onClick={() => editor.chain().focus().toggleBold().run()} 
              active={editor.isActive('bold')} 
              title={language === 'ar' ? 'عريض' : 'Bold'}
            >
              <Bold className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleItalic().run()} 
              active={editor.isActive('italic')} 
              title={language === 'ar' ? 'مائل' : 'Italic'}
            >
              <Italic className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleStrike().run()} 
              active={editor.isActive('strike')} 
              title={language === 'ar' ? 'يتوسطه خط' : 'Strikethrough'}
            >
              <Strikethrough className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleCode().run()} 
              active={editor.isActive('code')} 
              title={language === 'ar' ? 'كود' : 'Code'}
            >
              <Code className="w-4 h-4" />
            </ToolButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Headings */}
          <div className="flex items-center">
            <ToolButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
              active={editor.isActive('heading', { level: 1 })} 
              title={language === 'ar' ? 'عنوان 1' : 'Heading 1'}
            >
              <Heading1 className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
              active={editor.isActive('heading', { level: 2 })} 
              title={language === 'ar' ? 'عنوان 2' : 'Heading 2'}
            >
              <Heading2 className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
              active={editor.isActive('heading', { level: 3 })} 
              title={language === 'ar' ? 'عنوان 3' : 'Heading 3'}
            >
              <Heading3 className="w-4 h-4" />
            </ToolButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists & Blocks */}
          <div className="flex items-center">
            <ToolButton 
              onClick={() => editor.chain().focus().toggleBulletList().run()} 
              active={editor.isActive('bulletList')} 
              title={language === 'ar' ? 'قائمة نقطية' : 'Bullet List'}
            >
              <List className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleOrderedList().run()} 
              active={editor.isActive('orderedList')} 
              title={language === 'ar' ? 'قائمة مرقمة' : 'Ordered List'}
            >
              <ListOrdered className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleBlockquote().run()} 
              active={editor.isActive('blockquote')} 
              title={language === 'ar' ? 'اقتباس' : 'Quote'}
            >
              <Quote className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
              active={editor.isActive('codeBlock')} 
              title={language === 'ar' ? 'كتلة كود' : 'Code Block'}
            >
              <FileCode className="w-4 h-4" />
            </ToolButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <div className="flex items-center">
            <ToolButton 
              onClick={() => editor.chain().focus().setTextAlign('left').run()} 
              active={editor.isActive({ textAlign: 'left' })} 
              title={language === 'ar' ? 'محاذاة لليسار' : 'Align Left'}
            >
              <AlignLeft className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().setTextAlign('center').run()} 
              active={editor.isActive({ textAlign: 'center' })} 
              title={language === 'ar' ? 'توسيط' : 'Center'}
            >
              <AlignCenter className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().setTextAlign('right').run()} 
              active={editor.isActive({ textAlign: 'right' })} 
              title={language === 'ar' ? 'محاذاة لليمين' : 'Align Right'}
            >
              <AlignRight className="w-4 h-4" />
            </ToolButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Insert Items */}
          <div className="flex items-center">
            <ToolButton 
              onClick={() => setLinkDialogOpen(true)} 
              active={editor.isActive('link')} 
              title={language === 'ar' ? 'رابط' : 'Link'}
            >
              <LinkIcon className="w-4 h-4" />
            </ToolButton>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'رفع صورة' : 'Upload Image'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImageDialogOpen(true)}>
                  <LinkIcon className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'من رابط' : 'From URL'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Table Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", editor.isActive('table') && "bg-primary/20 text-primary")}>
                  <TableIcon className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => setTableDialogOpen(true)}>
                  <Grid3X3 className="w-4 h-4 me-2" />
                  {language === 'ar' ? 'إدراج جدول' : 'Insert Table'}
                </DropdownMenuItem>
                {editor.isActive('table') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>
                      <ColumnsIcon className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'عمود قبل' : 'Add Column Before'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                      <ColumnsIcon className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'عمود بعد' : 'Add Column After'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                      <Minus className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'حذف عمود' : 'Delete Column'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>
                      <RowsIcon className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'صف قبل' : 'Add Row Before'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                      <RowsIcon className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'صف بعد' : 'Add Row After'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                      <Minus className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'حذف صف' : 'Delete Row'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>
                      <MoveHorizontal className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'دمج الخلايا' : 'Merge Cells'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>
                      <MoveVertical className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'تقسيم الخلية' : 'Split Cell'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => editor.chain().focus().deleteTable().run()}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 me-2" />
                      {language === 'ar' ? 'حذف الجدول' : 'Delete Table'}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Undo/Redo */}
          <div className="flex items-center">
            <ToolButton 
              onClick={() => editor.chain().focus().undo().run()} 
              title={language === 'ar' ? 'تراجع' : 'Undo'}
              disabled={!editor.can().undo()}
            >
              <Undo className="w-4 h-4" />
            </ToolButton>
            <ToolButton 
              onClick={() => editor.chain().focus().redo().run()} 
              title={language === 'ar' ? 'إعادة' : 'Redo'}
              disabled={!editor.can().redo()}
            >
              <Redo className="w-4 h-4" />
            </ToolButton>
          </div>

          <div className="flex-1" />

          {/* Expand */}
          <ToolButton 
            onClick={() => setIsExpanded(!isExpanded)} 
            title={isExpanded ? (language === 'ar' ? 'تصغير' : 'Minimize') : (language === 'ar' ? 'تكبير' : 'Maximize')}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ToolButton>
        </div>

        {/* Drop Zone Indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-background border-2 border-dashed border-primary rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-primary mb-2" />
              <p className="text-lg font-medium">
                {language === 'ar' ? 'أفلت الصورة هنا' : 'Drop image here'}
              </p>
            </div>
          </div>
        )}

        {/* Editor Content */}
        <EditorContent 
          editor={editor} 
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none p-4 focus:outline-none overflow-auto",
            "[&_table]:border-collapse [&_table]:w-full [&_table]:my-4",
            "[&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:font-semibold",
            "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
            "[&_tr:hover]:bg-muted/30",
            "[&_.ProseMirror]:min-h-[350px] [&_.ProseMirror]:outline-none",
            isExpanded ? "h-[calc(100%-52px)]" : "min-h-[400px]"
          )}
          dir="auto"
        />

        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileSelect}
        />
      </div>

      {/* Overlay when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إدراج رابط' : 'Insert Link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'عنوان الرابط' : 'Link URL'}</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            {editor.isActive('link') && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkDialogOpen(false);
                }}
              >
                {language === 'ar' ? 'إزالة الرابط' : 'Remove Link'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={insertLink}>
              {language === 'ar' ? 'إدراج' : 'Insert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image URL Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إدراج صورة من رابط' : 'Insert Image from URL'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'رابط الصورة' : 'Image URL'}</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            {imageUrl && (
              <div className="border rounded-lg p-2">
                <img src={imageUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={insertImage}>
              {language === 'ar' ? 'إدراج' : 'Insert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إدراج جدول' : 'Insert Table'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عدد الصفوف' : 'Rows'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عدد الأعمدة' : 'Columns'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/50">
              <div 
                className="grid gap-1" 
                style={{ gridTemplateColumns: `repeat(${Math.min(tableCols, 10)}, 1fr)` }}
              >
                {Array.from({ length: Math.min(tableRows, 10) * Math.min(tableCols, 10) }).map((_, i) => (
                  <div key={i} className="h-6 border border-border bg-background rounded" />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={insertTable}>
              {language === 'ar' ? 'إدراج' : 'Insert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdvancedWysiwygEditor;
