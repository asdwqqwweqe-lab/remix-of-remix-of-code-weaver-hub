import { useState, useEffect } from 'react';
import { Block } from '@/types/pageBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

// Basic editors
import { TextEditor, IconCardEditor, TableEditor, CardEditor, DividerEditor, ImageEditor, VideoEditor, ButtonEditor, QuoteEditor, AlertEditor, ListEditor, SpacerEditor, CodeEditor } from './editors/BasicEditors';
// Advanced editors
import { AccordionEditor, TabsEditor, HeroEditor, GalleryEditor, ProgressEditor, StatsEditor, EmbedEditor, TimelineEditor, PricingEditor, TestimonialEditor } from './editors/AdvancedEditors';
// Developer editors
import { TerminalEditor, ApiEditor, FileTreeEditor, DiffEditor, ChecklistEditor, CitationEditor, MathEditor, KanbanEditor } from './editors/DeveloperEditors';

interface BlockEditorProps {
  block: Block | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
}

const editorMap: Record<string, React.FC<{ formData: any; update: (key: string, value: any) => void; isRTL: boolean }>> = {
  text: TextEditor,
  'icon-card': IconCardEditor,
  table: TableEditor,
  card: CardEditor,
  divider: DividerEditor,
  image: ImageEditor,
  video: VideoEditor,
  button: ButtonEditor,
  quote: QuoteEditor,
  alert: AlertEditor,
  list: ListEditor,
  spacer: SpacerEditor,
  code: CodeEditor,
  accordion: AccordionEditor,
  tabs: TabsEditor,
  hero: HeroEditor,
  gallery: GalleryEditor,
  progress: ProgressEditor,
  stats: StatsEditor,
  embed: EmbedEditor,
  timeline: TimelineEditor,
  pricing: PricingEditor,
  testimonial: TestimonialEditor,
  terminal: TerminalEditor,
  api: ApiEditor,
  'file-tree': FileTreeEditor,
  diff: DiffEditor,
  checklist: ChecklistEditor,
  citation: CitationEditor,
  math: MathEditor,
  kanban: KanbanEditor,
};

export default function BlockEditor({ block, open, onClose, onSave }: BlockEditorProps) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>({});
  const isRTL = language === 'ar';

  useEffect(() => {
    if (block) setFormData({ ...block });
  }, [block]);

  if (!block) return null;

  const update = (key: string, value: any) => setFormData((prev: any) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const EditorComponent = editorMap[block.type];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? 'تعديل البلوك' : 'Edit Block'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {EditorComponent ? <EditorComponent formData={formData} update={update} isRTL={isRTL} /> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleSave}>{isRTL ? 'حفظ' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
