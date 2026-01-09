import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Heading1, Heading2, Heading3, Link as LinkIcon,
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Maximize2, Minimize2, Eye, Copy, Scissors,
  ClipboardPaste, FileCode, Type, AlignJustify, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  language?: 'ar' | 'en';
}

const RichTextEditor = ({ content, onChange, language = 'ar' }: RichTextEditorProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: language === 'ar' ? 'ابدأ الكتابة...' : 'Start writing...' }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Handle paste for images
  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              editor.chain().focus().setImage({ src: base64 }).run();
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    const editorElement = editorRef.current;
    editorElement?.addEventListener('paste', handlePaste);
    return () => editorElement?.removeEventListener('paste', handlePaste);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  if (!editor) return null;

  const ToolButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8', active && 'bg-muted text-accent')}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  const editorContent = (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={editorRef}>
          <EditorContent 
            editor={editor} 
            className={cn(
              "prose dark:prose-invert max-w-none p-4 focus:outline-none",
              isExpanded ? "min-h-[60vh]" : "min-h-[300px]"
            )}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => document.execCommand('copy')}>
          <Copy className="w-4 h-4 me-2" />
          {t('common.copy')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => document.execCommand('cut')}>
          <Scissors className="w-4 h-4 me-2" />
          {t('editor.cut')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => document.execCommand('paste')}>
          <ClipboardPaste className="w-4 h-4 me-2" />
          {t('editor.paste')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Type className="w-4 h-4 me-2" />
            {t('editor.formatting')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="w-4 h-4 me-2" />
              {t('editor.bold')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="w-4 h-4 me-2" />
              {t('editor.italic')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="w-4 h-4 me-2" />
              {t('editor.strikethrough')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
              <Code className="w-4 h-4 me-2" />
              {t('editor.inlineCode')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Heading1 className="w-4 h-4 me-2" />
            {t('editor.headings')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 className="w-4 h-4 me-2" />
              {t('editor.heading1')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="w-4 h-4 me-2" />
              {t('editor.heading2')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              <Heading3 className="w-4 h-4 me-2" />
              {t('editor.heading3')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <List className="w-4 h-4 me-2" />
            {t('editor.lists')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="w-4 h-4 me-2" />
              {t('editor.bulletList')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="w-4 h-4 me-2" />
              {t('editor.orderedList')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4 me-2" />
          {t('editor.blockquote')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <FileCode className="w-4 h-4 me-2" />
          {t('editor.codeBlock')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <AlignJustify className="w-4 h-4 me-2" />
            {t('editor.alignment')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>
              <AlignLeft className="w-4 h-4 me-2" />
              {t('editor.alignLeft')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>
              <AlignCenter className="w-4 h-4 me-2" />
              {t('editor.alignCenter')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>
              <AlignRight className="w-4 h-4 me-2" />
              {t('editor.alignRight')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => setLinkDialogOpen(true)}>
          <LinkIcon className="w-4 h-4 me-2" />
          {t('editor.insertLink')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {
          const url = prompt(t('editor.imageUrl'));
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}>
          <ImageIcon className="w-4 h-4 me-2" />
          {t('editor.insertImage')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4 me-2" />
          {t('editor.undo')}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => editor.chain().focus().redo().run()}>
          <RotateCcw className="w-4 h-4 me-2" />
          {t('editor.redo')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );

  return (
    <>
      <div className={cn(
        "border rounded-lg overflow-hidden transition-all duration-300",
        isExpanded && "fixed inset-4 z-50 bg-background shadow-2xl"
      )}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
          <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title={t('editor.bold')}>
            <Bold className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title={t('editor.italic')}>
            <Italic className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title={t('editor.strikethrough')}>
            <Strikethrough className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title={t('editor.inlineCode')}>
            <Code className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-8 bg-border mx-1" />
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title={t('editor.heading1')}>
            <Heading1 className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title={t('editor.heading2')}>
            <Heading2 className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title={t('editor.heading3')}>
            <Heading3 className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-8 bg-border mx-1" />
          <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title={t('editor.bulletList')}>
            <List className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title={t('editor.orderedList')}>
            <ListOrdered className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title={t('editor.blockquote')}>
            <Quote className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title={t('editor.codeBlock')}>
            <FileCode className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-8 bg-border mx-1" />
          <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title={t('editor.alignLeft')}>
            <AlignLeft className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title={t('editor.alignCenter')}>
            <AlignCenter className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title={t('editor.alignRight')}>
            <AlignRight className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-8 bg-border mx-1" />
          <ToolButton onClick={() => setLinkDialogOpen(true)} active={editor.isActive('link')} title={t('editor.link')}>
            <LinkIcon className="w-4 h-4" />
          </ToolButton>
          <ToolButton 
            onClick={() => {
              const url = prompt(t('editor.imageUrl'));
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }} 
            title={t('editor.image')}
          >
            <ImageIcon className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-8 bg-border mx-1" />
          <ToolButton onClick={() => editor.chain().focus().undo().run()} title={t('editor.undo')}>
            <Undo className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => editor.chain().focus().redo().run()} title={t('editor.redo')}>
            <Redo className="w-4 h-4" />
          </ToolButton>
          
          <div className="flex-1" />
          
          <ToolButton onClick={() => setShowPreview(!showPreview)} active={showPreview} title={t('editor.preview')}>
            <Eye className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? t('editor.minimize') : t('editor.maximize')}>
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ToolButton>
        </div>

        {/* Editor / Preview */}
        <div className={cn("overflow-auto", isExpanded ? "h-[calc(100%-52px)]" : "")}>
          {showPreview ? (
            <div className="grid grid-cols-2 divide-x">
              <div>{editorContent}</div>
              <div 
                className="prose dark:prose-invert max-w-none p-4"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            </div>
          ) : (
            editorContent
          )}
        </div>
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
            <DialogTitle>{t('editor.insertLink')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('editor.linkUrl')}</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div className="flex gap-2 justify-end">
              {editor.isActive('link') && (
                <Button variant="destructive" onClick={removeLink}>
                  {t('editor.removeLink')}
                </Button>
              )}
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={insertLink}>
                {t('common.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RichTextEditor;
