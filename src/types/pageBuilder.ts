export type BlockType = 'text' | 'icon-card' | 'table' | 'card' | 'divider' | 'image' | 'video' | 'button' | 'accordion' | 'tabs' | 'code' | 'quote' | 'alert' | 'list' | 'spacer';
export type PageDirection = 'rtl' | 'ltr';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
  level: 'p' | 'h1' | 'h2' | 'h3' | 'h4';
}

export interface IconCardBlock extends BaseBlock {
  type: 'icon-card';
  icon: string;
  title: string;
  description: string;
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface CardBlock extends BaseBlock {
  type: 'card';
  title: string;
  content: string;
  variant: 'default' | 'primary' | 'accent';
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  style: 'solid' | 'dashed' | 'gradient';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  title?: string;
  provider: 'youtube' | 'vimeo' | 'direct';
}

export interface ButtonBlock extends BaseBlock {
  type: 'button';
  text: string;
  url: string;
  variant: 'default' | 'primary' | 'outline' | 'gradient';
  size: 'sm' | 'md' | 'lg';
}

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion';
  items: AccordionItem[];
}

export interface TabItem {
  id: string;
  label: string;
  content: string;
}

export interface TabsBlock extends BaseBlock {
  type: 'tabs';
  items: TabItem[];
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  code: string;
  language: string;
  filename?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  author?: string;
}

export interface AlertBlock extends BaseBlock {
  type: 'alert';
  message: string;
  alertType: 'info' | 'success' | 'warning' | 'error';
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  items: string[];
  ordered: boolean;
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  size: 'sm' | 'md' | 'lg' | 'xl';
}

export type Block = TextBlock | IconCardBlock | TableBlock | CardBlock | DividerBlock | ImageBlock | VideoBlock | ButtonBlock | AccordionBlock | TabsBlock | CodeBlock | QuoteBlock | AlertBlock | ListBlock | SpacerBlock;

export interface Page {
  id: string;
  title: string;
  slug: string;
  direction: PageDirection;
  order: number;
  blocks: Block[];
  createdAt: string;
  updatedAt: string;
}

export const BLOCK_TYPE_LABELS: Record<BlockType, { ar: string; en: string; icon: string }> = {
  'text': { ar: 'نص', en: 'Text', icon: 'Type' },
  'icon-card': { ar: 'بطاقة أيقونة', en: 'Icon Card', icon: 'CreditCard' },
  'table': { ar: 'جدول', en: 'Table', icon: 'Table' },
  'card': { ar: 'كارد', en: 'Card', icon: 'Square' },
  'divider': { ar: 'فاصل', en: 'Divider', icon: 'Minus' },
  'image': { ar: 'صورة', en: 'Image', icon: 'Image' },
  'video': { ar: 'فيديو', en: 'Video', icon: 'Play' },
  'button': { ar: 'زر', en: 'Button', icon: 'MousePointer' },
  'accordion': { ar: 'أكورديون', en: 'Accordion', icon: 'ChevronDown' },
  'tabs': { ar: 'تبويبات', en: 'Tabs', icon: 'Columns' },
  'code': { ar: 'كود', en: 'Code', icon: 'Code' },
  'quote': { ar: 'اقتباس', en: 'Quote', icon: 'Quote' },
  'alert': { ar: 'تنبيه', en: 'Alert', icon: 'AlertCircle' },
  'list': { ar: 'قائمة', en: 'List', icon: 'List' },
  'spacer': { ar: 'مسافة', en: 'Spacer', icon: 'MoveVertical' },
};
