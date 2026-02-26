import { BlockType, BLOCK_TYPE_LABELS } from '@/types/pageBuilder';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Type, CreditCard, Table, Square, Minus, Image, Play,
  MousePointer, ChevronDown, Columns, Code, Quote, AlertCircle,
  List, MoveVertical, Sparkles, GalleryHorizontal, BarChart3,
  TrendingUp, Globe, Clock, DollarSign, MessageCircle,
} from 'lucide-react';

const ICON_MAP: Record<BlockType, any> = {
  text: Type, 'icon-card': CreditCard, table: Table, card: Square,
  divider: Minus, image: Image, video: Play, button: MousePointer,
  accordion: ChevronDown, tabs: Columns, code: Code, quote: Quote,
  alert: AlertCircle, list: List, spacer: MoveVertical,
  hero: Sparkles, gallery: GalleryHorizontal, progress: BarChart3,
  stats: TrendingUp, embed: Globe, timeline: Clock, pricing: DollarSign,
  testimonial: MessageCircle,
};

interface BlockToolbarProps {
  onAdd: (type: BlockType) => void;
}

export default function BlockToolbar({ onAdd }: BlockToolbarProps) {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';

  return (
    <div className="sticky bottom-0 z-20 glass border-t border-border p-3">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {(Object.keys(BLOCK_TYPE_LABELS) as BlockType[]).map((type) => {
          const Icon = ICON_MAP[type];
          const label = BLOCK_TYPE_LABELS[type][lang];
          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => onAdd(type)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
