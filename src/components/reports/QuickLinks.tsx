import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Link as LinkIcon, 
  Plus, 
  X, 
  ExternalLink,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickLink {
  id: string;
  label: string;
  url: string;
}

interface QuickLinksProps {
  links: QuickLink[];
  onChange: (links: QuickLink[]) => void;
  readOnly?: boolean;
  className?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const QuickLinks = ({ links, onChange, readOnly = false, className }: QuickLinksProps) => {
  const { language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '' });

  const handleAdd = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    
    onChange([
      ...links,
      {
        id: generateId(),
        label: newLink.label.trim(),
        url: newLink.url.trim()
      }
    ]);
    setNewLink({ label: '', url: '' });
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(links.filter(link => link.id !== id));
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
          </CardTitle>
          {!readOnly && !isAdding && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isAdding && (
          <div className="space-y-2 mb-3 p-3 border rounded-lg bg-muted/30">
            <Input
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder={language === 'ar' ? 'عنوان الرابط' : 'Link label'}
              className="h-8 text-sm"
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
              className="h-8 text-sm"
              dir="ltr"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7" onClick={handleAdd}>
                {language === 'ar' ? 'إضافة' : 'Add'}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7"
                onClick={() => {
                  setIsAdding(false);
                  setNewLink({ label: '', url: '' });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {language === 'ar' ? 'لا توجد روابط' : 'No links added'}
          </p>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted transition-colors"
                >
                  {!readOnly && (
                    <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab" />
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </a>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(link.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickLinks;
