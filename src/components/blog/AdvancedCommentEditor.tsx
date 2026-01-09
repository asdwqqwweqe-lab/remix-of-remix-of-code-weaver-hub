import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  Link, 
  Code, 
  Send,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AdvancedCommentEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

const AdvancedCommentEditor = ({ 
  value, 
  onChange, 
  onSubmit,
  placeholder 
}: AdvancedCommentEditorProps) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showLinkPopover, setShowLinkPopover] = useState(false);

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const wrapSelection = (wrapper: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      const newText = value.substring(0, start) + wrapper + selectedText + wrapper + value.substring(end);
      onChange(newText);
    } else {
      insertAtCursor(wrapper, wrapper);
    }
  };

  const handleBold = () => wrapSelection('**');
  const handleItalic = () => wrapSelection('*');
  
  const handleCode = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText.includes('\n')) {
      // Multi-line code block
      const newText = value.substring(0, start) + '```\n' + selectedText + '\n```' + value.substring(end);
      onChange(newText);
    } else {
      // Inline code
      wrapSelection('`');
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      const linkMarkdown = linkText 
        ? `[${linkText}](${linkUrl})` 
        : `[${linkUrl}](${linkUrl})`;
      insertAtCursor(linkMarkdown);
      setLinkUrl('');
      setLinkText('');
      setShowLinkPopover(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 border rounded-lg bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleBold}
          title={t('comments.bold')}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleItalic}
          title={t('comments.italic')}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCode}
          title={t('comments.code')}
        >
          <Code className="w-4 h-4" />
        </Button>
        
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={t('comments.insertLink')}
            >
              <Link className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('comments.linkText')}</label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder={t('comments.linkTextPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('comments.linkUrl')}</label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkPopover(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleInsertLink}
                  disabled={!linkUrl}
                >
                  {t('common.add')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />
        
        <span className="text-xs text-muted-foreground px-2">
          Ctrl+Enter {t('comments.toSend')}
        </span>
      </div>

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        className="resize-none font-mono text-sm"
      />

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit" className="gap-2" onClick={onSubmit}>
          <Send className="w-4 h-4" />
          {t('comments.submit')}
        </Button>
      </div>
    </div>
  );
};

export default AdvancedCommentEditor;
