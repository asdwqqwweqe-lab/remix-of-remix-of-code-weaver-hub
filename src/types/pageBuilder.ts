export type BlockType = 'text' | 'icon-card' | 'table' | 'card' | 'divider' | 'image' | 'video' | 'button' | 'accordion' | 'tabs' | 'code' | 'quote' | 'alert' | 'list' | 'spacer' | 'hero' | 'gallery' | 'progress' | 'stats' | 'embed' | 'timeline' | 'pricing' | 'testimonial' | 'terminal' | 'api' | 'file-tree' | 'diff' | 'checklist' | 'citation' | 'math' | 'kanban';
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

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundImage?: string;
  variant: 'default' | 'gradient' | 'image';
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  items: GalleryItem[];
  columns: 2 | 3 | 4;
}

export interface ProgressBlock extends BaseBlock {
  type: 'progress';
  label: string;
  value: number;
  max: number;
  variant: 'default' | 'primary' | 'success' | 'warning';
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  icon?: string;
}

export interface StatsBlock extends BaseBlock {
  type: 'stats';
  items: StatItem[];
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  url: string;
  height: number;
  title?: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface TimelineBlock extends BaseBlock {
  type: 'timeline';
  items: TimelineItem[];
}

export interface PricingFeature {
  id: string;
  text: string;
  included: boolean;
}

export interface PricingBlock extends BaseBlock {
  type: 'pricing';
  title: string;
  price: string;
  period?: string;
  features: PricingFeature[];
  buttonText?: string;
  buttonUrl?: string;
  highlighted: boolean;
}

export interface TestimonialBlock extends BaseBlock {
  type: 'testimonial';
  text: string;
  author: string;
  role?: string;
  avatar?: string;
  rating?: number;
}

export interface TerminalBlock extends BaseBlock {
  type: 'terminal';
  commands: string[];
  title?: string;
  prompt: string;
}

export interface ApiMethod {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
  params?: string;
  response?: string;
}

export interface ApiBlock extends BaseBlock {
  type: 'api';
  title: string;
  baseUrl: string;
  methods: ApiMethod[];
}

export interface FileTreeItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  indent: number;
}

export interface FileTreeBlock extends BaseBlock {
  type: 'file-tree';
  title?: string;
  items: FileTreeItem[];
}

export interface DiffLine {
  id: string;
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export interface DiffBlock extends BaseBlock {
  type: 'diff';
  title?: string;
  filename?: string;
  lines: DiffLine[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
}

export interface CitationBlock extends BaseBlock {
  type: 'citation';
  authors: string;
  title: string;
  source: string;
  year: string;
  url?: string;
  doi?: string;
}

export interface MathBlock extends BaseBlock {
  type: 'math';
  expression: string;
  label?: string;
  displayMode: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: string[];
}

export interface KanbanBlock extends BaseBlock {
  type: 'kanban';
  title?: string;
  columns: KanbanColumn[];
}

export type Block = TextBlock | IconCardBlock | TableBlock | CardBlock | DividerBlock | ImageBlock | VideoBlock | ButtonBlock | AccordionBlock | TabsBlock | CodeBlock | QuoteBlock | AlertBlock | ListBlock | SpacerBlock | HeroBlock | GalleryBlock | ProgressBlock | StatsBlock | EmbedBlock | TimelineBlock | PricingBlock | TestimonialBlock | TerminalBlock | ApiBlock | FileTreeBlock | DiffBlock | ChecklistBlock | CitationBlock | MathBlock | KanbanBlock;

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
  'hero': { ar: 'بطل', en: 'Hero', icon: 'Sparkles' },
  'gallery': { ar: 'معرض صور', en: 'Gallery', icon: 'GalleryHorizontal' },
  'progress': { ar: 'شريط تقدم', en: 'Progress', icon: 'BarChart3' },
  'stats': { ar: 'إحصائيات', en: 'Stats', icon: 'TrendingUp' },
  'embed': { ar: 'تضمين', en: 'Embed', icon: 'Globe' },
  'timeline': { ar: 'خط زمني', en: 'Timeline', icon: 'Clock' },
  'pricing': { ar: 'تسعير', en: 'Pricing', icon: 'DollarSign' },
  'testimonial': { ar: 'شهادة', en: 'Testimonial', icon: 'MessageCircle' },
  'terminal': { ar: 'طرفية', en: 'Terminal', icon: 'Terminal' },
  'api': { ar: 'مرجع API', en: 'API Ref', icon: 'Webhook' },
  'file-tree': { ar: 'شجرة ملفات', en: 'File Tree', icon: 'FolderTree' },
  'diff': { ar: 'مقارنة كود', en: 'Code Diff', icon: 'GitCompareArrows' },
  'checklist': { ar: 'قائمة مهام', en: 'Checklist', icon: 'ListChecks' },
  'citation': { ar: 'مرجع بحثي', en: 'Citation', icon: 'BookOpen' },
  'math': { ar: 'معادلة', en: 'Formula', icon: 'Sigma' },
  'kanban': { ar: 'لوحة كانبان', en: 'Kanban', icon: 'Kanban' },
};
