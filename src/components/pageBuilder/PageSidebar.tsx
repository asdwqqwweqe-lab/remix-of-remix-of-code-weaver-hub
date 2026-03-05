import { useState } from 'react';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { PAGE_TEMPLATES, createBlocksFromTemplate, PageTemplate } from './templates';
import { generateSlug } from '@/lib/slug-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, FileText, Eye, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortablePageItem({ page, isActive, onSelect, onDelete }: any) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className={cn('group flex items-center gap-1 rounded-lg p-2 cursor-pointer transition-colors', isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50')}>
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5 touch-none">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <p className="text-sm font-medium truncate">{page.title}</p>
        <p className="text-xs text-muted-foreground truncate">/{page.slug}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/preview/${page.slug}`} onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="w-3 h-3" /></Button>
        </Link>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function PageSidebar() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { pages, activePageId, addPage, deletePage, setActivePage, reorderPages } = usePageBuilderStore();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState('blank');
  const lang = isRTL ? 'ar' : 'en';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const handleCreate = () => {
    const template = PAGE_TEMPLATES.find((t) => t.id === templateId) || PAGE_TEMPLATES[0];
    const slug = generateSlug(title) || `page-${Date.now()}`;
    const blocks = createBlocksFromTemplate(template);
    addPage({ title, slug, direction: template.direction, order: pages.length, blocks });
    setTitle('');
    setTemplateId('blank');
    setShowCreate(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = pages.map((p) => p.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    const newIds = [...ids];
    newIds.splice(oldIdx, 1);
    newIds.splice(newIdx, 0, active.id as string);
    reorderPages(newIds);
  };

  return (
    <div className="w-64 border-e border-border bg-card/50 flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">{isRTL ? 'الصفحات' : 'Pages'}</h2>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {pages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              {isRTL ? 'لا توجد صفحات بعد' : 'No pages yet'}
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {pages.map((page) => (
                <SortablePageItem
                  key={page.id}
                  page={page}
                  isActive={page.id === activePageId}
                  onSelect={() => setActivePage(page.id)}
                  onDelete={() => deletePage(page.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إنشاء صفحة جديدة' : 'Create New Page'}</DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'عنوان الصفحة' : 'Page Title'}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isRTL ? 'أدخل عنوان الصفحة' : 'Enter page title'} />
              {title && <p className="text-xs text-muted-foreground">Slug: /{generateSlug(title)}</p>}
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'القالب' : 'Template'}</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['general', 'dev', 'research'] as const).map((cat) => {
                    const catLabels = { general: { ar: '📄 عام', en: '📄 General' }, dev: { ar: '💻 مطورين', en: '💻 Developer' }, research: { ar: '🔬 باحثين', en: '🔬 Research' } };
                    const catTemplates = PAGE_TEMPLATES.filter(t => t.category === cat);
                    if (catTemplates.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{catLabels[cat][lang]}</div>
                        {catTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <span>{t.name[lang]}</span>
                              <span className="text-xs text-muted-foreground">— {t.description[lang]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleCreate} disabled={!title.trim()}>{isRTL ? 'إنشاء' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
