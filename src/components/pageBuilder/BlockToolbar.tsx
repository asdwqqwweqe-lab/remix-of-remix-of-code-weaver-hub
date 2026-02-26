import { BlockType, BLOCK_TYPE_LABELS } from '@/types/pageBuilder';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Type, CreditCard, Table, Square, Minus, Image, Play,
  MousePointer, ChevronDown, Columns, Code, Quote, AlertCircle,
  List, MoveVertical,
} from 'lucide-react';

const ICON_MAP: Record<BlockType, any> = {
  text: Type, 'icon-card': CreditCard, table: Table, card: Square,
  divider: Minus, image: Image, video: Play, button: MousePointer,
  accordion: ChevronDown, tabs: Columns, code: Code, quote: Quote,
  alert: AlertCircle, list: List, spacer: MoveVertical,
};

interface BlockToolbarProps {
  onAdd: (type: BlockType) => void;
}

export default function BlockToolbar({ onAdd }: BlockToolbarProps) {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';

  return (
    <div className="sticky bottom-0 z-20 glass border-t border-border p-3">
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-1">
          {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => {
            const Icon = ICON_MAP[type];
            const label = BLOCK_TYPE_LABELS[type][lang];
            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 h-9"
                    onClick={() => onAdd(type)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">{label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
