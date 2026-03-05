import { ReactNode } from 'react';
import { BlockType, BLOCK_TYPE_LABELS } from '@/types/pageBuilder';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
  ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Copy, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Plus,
  Type, CreditCard, Table, Square, Minus, Image, Play,
  MousePointer, ChevronDown, Columns, Code, Quote, AlertCircle, List, MoveVertical,
  Sparkles, GalleryHorizontal, BarChart3, TrendingUp, Globe, Clock, DollarSign, MessageCircle,
  Terminal, Webhook, FolderTree, GitCompareArrows, ListChecks, BookOpen, Sigma, Kanban,
} from 'lucide-react';

const ICON_MAP: Record<BlockType, any> = {
  text: Type, 'icon-card': CreditCard, table: Table, card: Square,
  divider: Minus, image: Image, video: Play, button: MousePointer,
  accordion: ChevronDown, tabs: Columns, code: Code, quote: Quote,
  alert: AlertCircle, list: List, spacer: MoveVertical,
  hero: Sparkles, gallery: GalleryHorizontal, progress: BarChart3,
  stats: TrendingUp, embed: Globe, timeline: Clock, pricing: DollarSign,
  testimonial: MessageCircle,
  terminal: Terminal, api: Webhook, 'file-tree': FolderTree, diff: GitCompareArrows,
  checklist: ListChecks, citation: BookOpen, math: Sigma, kanban: Kanban,
};

interface BlockContextMenuProps {
  children: ReactNode;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down' | 'top' | 'bottom') => void;
  onAddBlock: (type: BlockType) => void;
}

export default function BlockContextMenu({ children, onDuplicate, onDelete, onMove, onAddBlock }: BlockContextMenuProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const lang = isRTL ? 'ar' : 'en';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 me-2" /> {isRTL ? 'نسخ البلوك' : 'Duplicate'}
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="w-4 h-4 me-2" /> {isRTL ? 'حذف البلوك' : 'Delete'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onMove('up')}>
          <ArrowUp className="w-4 h-4 me-2" /> {isRTL ? 'نقل لأعلى' : 'Move Up'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMove('down')}>
          <ArrowDown className="w-4 h-4 me-2" /> {isRTL ? 'نقل لأسفل' : 'Move Down'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMove('top')}>
          <ChevronsUp className="w-4 h-4 me-2" /> {isRTL ? 'نقل للبداية' : 'Move to Top'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMove('bottom')}>
          <ChevronsDown className="w-4 h-4 me-2" /> {isRTL ? 'نقل للنهاية' : 'Move to Bottom'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Plus className="w-4 h-4 me-2" /> {isRTL ? 'إضافة بلوك' : 'Add Block'}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => {
              const Icon = ICON_MAP[type];
              return (
                <ContextMenuItem key={type} onClick={() => onAddBlock(type)}>
                  <Icon className="w-4 h-4 me-2" /> {BLOCK_TYPE_LABELS[type][lang]}
                </ContextMenuItem>
              );
            })}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
