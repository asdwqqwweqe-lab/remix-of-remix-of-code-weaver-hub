import { useState } from 'react';
import { BlockType, BLOCK_TYPE_LABELS } from '@/types/pageBuilder';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Type, CreditCard, Table, Square, Minus, Image, Play,
  MousePointer, ChevronDown, Columns, Code, Quote, AlertCircle,
  List, MoveVertical, Sparkles, GalleryHorizontal, BarChart3,
  TrendingUp, Globe, Clock, DollarSign, MessageCircle,
  LayoutGrid, Zap, Film,
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

type Category = 'basic' | 'advanced' | 'media';

const CATEGORIES: Record<Category, { ar: string; en: string; icon: any; types: BlockType[] }> = {
  basic: {
    ar: 'أساسي',
    en: 'Basic',
    icon: LayoutGrid,
    types: ['text', 'button', 'card', 'icon-card', 'list', 'divider', 'spacer', 'quote', 'alert'],
  },
  advanced: {
    ar: 'متقدم',
    en: 'Advanced',
    icon: Zap,
    types: ['hero', 'accordion', 'tabs', 'table', 'code', 'stats', 'progress', 'timeline', 'pricing', 'testimonial'],
  },
  media: {
    ar: 'وسائط',
    en: 'Media',
    icon: Film,
    types: ['image', 'video', 'gallery', 'embed'],
  },
};

interface BlockToolbarProps {
  onAdd: (type: BlockType) => void;
}

export default function BlockToolbar({ onAdd }: BlockToolbarProps) {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const [activeCategory, setActiveCategory] = useState<Category>('basic');

  return (
    <div className="sticky bottom-0 z-20 glass border-t border-border p-2 space-y-2">
      <div className="flex gap-1 justify-center">
        {(Object.keys(CATEGORIES) as Category[]).map((cat) => {
          const CatIcon = CATEGORIES[cat].icon;
          const isActive = activeCategory === cat;
          return (
            <Button
              key={cat}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setActiveCategory(cat)}
            >
              <CatIcon className="w-3.5 h-3.5" />
              {CATEGORIES[cat][lang]}
            </Button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {CATEGORIES[activeCategory].types.map((type) => {
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
