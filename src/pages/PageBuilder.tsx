import { useState, useCallback, useEffect, useRef } from 'react';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Block, BlockType } from '@/types/pageBuilder';
import PageSidebar from '@/components/pageBuilder/PageSidebar';
import BlockRenderer from '@/components/pageBuilder/BlockRenderer';
import BlockEditor from '@/components/pageBuilder/BlockEditor';
import BlockToolbar from '@/components/pageBuilder/BlockToolbar';
import BlockContextMenu from '@/components/pageBuilder/BlockContextMenu';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Eye, GripVertical, Pencil, LayoutTemplate, Undo2, Redo2, Share2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateSlug } from '@/lib/slug-utils';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBlock({ block, onEdit, onDuplicate, onDelete, onMove, onAddBlock }: {
  block: Block;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down' | 'top' | 'bottom') => void;
  onAddBlock: (type: BlockType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <BlockContextMenu onDuplicate={onDuplicate} onDelete={onDelete} onMove={onMove} onAddBlock={onAddBlock}>
      <div ref={setNodeRef} style={style} className={cn('group relative rounded-lg border border-transparent hover:border-primary/30 transition-all p-4', isDragging && 'z-50 shadow-lg')}>
        <div className="absolute top-2 end-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 touch-none">
            <GripVertical className="w-4 h-4" />
          </button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div onClick={onEdit} className="cursor-pointer">
          <BlockRenderer block={block} />
        </div>
      </div>
    </BlockContextMenu>
  );
}

function getDefaultBlockData(type: BlockType): Omit<Block, 'id' | 'order'> {
  const defaults: Record<BlockType, any> = {
    text: { type: 'text', content: '', level: 'p' },
    'icon-card': { type: 'icon-card', icon: 'Star', title: '', description: '' },
    table: { type: 'table', headers: ['Column 1', 'Column 2'], rows: [['', '']] },
    card: { type: 'card', title: '', content: '', variant: 'default' },
    divider: { type: 'divider', style: 'solid' },
    image: { type: 'image', src: '', alt: '' },
    video: { type: 'video', url: '', provider: 'youtube' },
    button: { type: 'button', text: '', url: '#', variant: 'primary', size: 'md' },
    accordion: { type: 'accordion', items: [{ id: uuidv4(), question: '', answer: '' }] },
    tabs: { type: 'tabs', items: [{ id: uuidv4(), label: 'Tab 1', content: '' }] },
    code: { type: 'code', code: '', language: 'javascript' },
    quote: { type: 'quote', text: '' },
    alert: { type: 'alert', message: '', alertType: 'info' },
    list: { type: 'list', items: [''], ordered: false },
    spacer: { type: 'spacer', size: 'md' },
    hero: { type: 'hero', title: '', subtitle: '', variant: 'default' },
    gallery: { type: 'gallery', items: [{ id: uuidv4(), src: '', alt: '' }], columns: 3 },
    progress: { type: 'progress', label: '', value: 50, max: 100, variant: 'primary' },
    stats: { type: 'stats', items: [{ id: uuidv4(), value: '0', label: '', icon: 'Hash' }] },
    embed: { type: 'embed', url: '', height: 400 },
    timeline: { type: 'timeline', items: [{ id: uuidv4(), title: '', description: '' }] },
    pricing: { type: 'pricing', title: '', price: '', features: [{ id: uuidv4(), text: '', included: true }], highlighted: false },
    testimonial: { type: 'testimonial', text: '', author: '', rating: 5 },
    terminal: { type: 'terminal', commands: ['$ '], title: 'Terminal', prompt: '$' },
    api: { type: 'api', title: 'API Reference', baseUrl: 'https://api.example.com', methods: [{ id: uuidv4(), method: 'GET', endpoint: '/endpoint', description: '', params: '', response: '' }] },
    'file-tree': { type: 'file-tree', title: 'Project Structure', items: [{ id: uuidv4(), name: 'src', type: 'folder', indent: 0 }, { id: uuidv4(), name: 'index.ts', type: 'file', indent: 1 }] },
    diff: { type: 'diff', title: '', filename: '', lines: [{ id: uuidv4(), type: 'unchanged', content: '' }] },
    checklist: { type: 'checklist', title: '', items: [{ id: uuidv4(), text: '', checked: false }] },
    citation: { type: 'citation', authors: '', title: '', source: '', year: '', url: '', doi: '' },
    math: { type: 'math', expression: 'E = mc²', label: '', displayMode: true },
    kanban: { type: 'kanban', title: '', columns: [{ id: uuidv4(), title: 'To Do', items: [''] }, { id: uuidv4(), title: 'In Progress', items: [''] }, { id: uuidv4(), title: 'Done', items: [''] }] },
  };
  return defaults[type];
}

export default function PageBuilder() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { pages, activePageId, updatePage, addBlock, updateBlock, deleteBlock, duplicateBlock, moveBlock, reorderBlocks } = usePageBuilderStore();
  const activePage = pages.find((p) => p.id === activePageId);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const prevBlocksRef = useRef<string>('');

  // Undo/Redo - restore blocks for the active page
  const handleRestore = useCallback((blocks: Block[]) => {
    if (!activePageId) return;
    updatePage(activePageId, { blocks });
  }, [activePageId, updatePage]);

  const { undo, redo, canUndo, canRedo, pushState, historyLength, futureLength } = useUndoRedo(
    activePageId,
    activePage?.blocks || [],
    handleRestore
  );

  // Track block changes and push to undo stack
  useEffect(() => {
    if (!activePage) return;
    const serialized = JSON.stringify(activePage.blocks);
    if (prevBlocksRef.current && prevBlocksRef.current !== serialized) {
      // Push the PREVIOUS state before this change
      pushState(JSON.parse(prevBlocksRef.current));
    }
    prevBlocksRef.current = serialized;
  }, [activePage?.blocks, pushState]);

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleAddBlock = useCallback((type: BlockType, atIndex?: number) => {
    if (!activePageId) return;
    addBlock(activePageId, getDefaultBlockData(type), atIndex);
  }, [activePageId, addBlock]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activePage) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = activePage.blocks.map((b) => b.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    const newIds = [...ids];
    newIds.splice(oldIdx, 1);
    newIds.splice(newIdx, 0, active.id as string);
    reorderBlocks(activePage.id, newIds);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-6 lg:-m-8">
      <PageSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {activePage ? (
          <>
            {/* Page header */}
            <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
              <Input
                value={activePage.title}
                onChange={(e) => {
                  updatePage(activePage.id, { title: e.target.value, slug: generateSlug(e.target.value) || activePage.slug });
                }}
                className="text-lg font-bold border-none bg-transparent shadow-none focus-visible:ring-0 max-w-xs"
                placeholder={isRTL ? 'عنوان الصفحة' : 'Page Title'}
              />
              <span className="text-xs text-muted-foreground font-mono">/{activePage.slug}</span>
              <div className="flex-1" />

              {/* Undo/Redo buttons */}
              <div className="flex items-center gap-1 border border-border rounded-lg px-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo}>
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isRTL ? `تراجع (${historyLength})` : `Undo (${historyLength})`} — Ctrl+Z</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo}>
                      <Redo2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isRTL ? `إعادة (${futureLength})` : `Redo (${futureLength})`} — Ctrl+Shift+Z</TooltipContent>
                </Tooltip>
              </div>

              <Select value={activePage.direction} onValueChange={(v: 'rtl' | 'ltr') => updatePage(activePage.id, { direction: v })}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rtl">RTL</SelectItem>
                  <SelectItem value="ltr">LTR</SelectItem>
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const url = `${window.location.origin}/p/${activePage.slug}`;
                      navigator.clipboard.writeText(url);
                      toast.success(isRTL ? 'تم نسخ الرابط!' : 'Link copied!');
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                    {isRTL ? 'رابط خاص' : 'Share Link'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isRTL ? 'نسخ رابط المشاركة العام' : 'Copy public share link'}</TooltipContent>
              </Tooltip>
              <Link to={`/preview/${activePage.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="w-4 h-4" />
                  {isRTL ? 'معاينة' : 'Preview'}
                </Button>
              </Link>
            </div>

            {/* Blocks editor area */}
            <ScrollArea className="flex-1">
              <div className={cn('max-w-4xl mx-auto p-6 space-y-2')} dir={activePage.direction}>
                {activePage.blocks.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <LayoutTemplate className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg">{isRTL ? 'ابدأ بإضافة بلوكات من الشريط أدناه' : 'Start by adding blocks from the toolbar below'}</p>
                  </div>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={activePage.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {activePage.blocks.map((block, idx) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        onEdit={() => setEditingBlock(block)}
                        onDuplicate={() => duplicateBlock(activePage.id, block.id)}
                        onDelete={() => deleteBlock(activePage.id, block.id)}
                        onMove={(dir) => moveBlock(activePage.id, block.id, dir)}
                        onAddBlock={(type) => handleAddBlock(type, idx + 1)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </ScrollArea>

            {/* Bottom toolbar */}
            <BlockToolbar onAdd={handleAddBlock} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <LayoutTemplate className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-medium">{isRTL ? 'اختر صفحة أو أنشئ واحدة جديدة' : 'Select a page or create a new one'}</p>
            </div>
          </div>
        )}
      </div>

      <BlockEditor
        block={editingBlock}
        open={!!editingBlock}
        onClose={() => setEditingBlock(null)}
        onSave={(data) => {
          if (editingBlock && activePageId) {
            updateBlock(activePageId, editingBlock.id, data);
          }
        }}
      />
    </div>
  );
}
