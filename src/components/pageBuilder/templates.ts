import { v4 as uuidv4 } from 'uuid';
import { Block } from '@/types/pageBuilder';

export interface PageTemplate {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  direction: 'rtl' | 'ltr';
  blocks: Record<string, any>[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: { ar: 'صفحة فارغة', en: 'Blank Page' },
    description: { ar: 'ابدأ من الصفر', en: 'Start from scratch' },
    direction: 'rtl',
    blocks: [],
  },
  {
    id: 'landing-ar',
    name: { ar: 'صفحة هبوط عربية', en: 'Arabic Landing Page' },
    description: { ar: 'صفحة هبوط جاهزة بالعربية', en: 'Ready-made Arabic landing page' },
    direction: 'rtl',
    blocks: [
      { type: 'text', content: 'مرحباً بكم في موقعنا', level: 'h1' },
      { type: 'text', content: 'نقدم لكم أفضل الحلول التقنية المبتكرة التي تساعدكم على تحقيق أهدافكم', level: 'p' },
      { type: 'spacer', size: 'md' },
      { type: 'icon-card', icon: 'Rocket', title: 'سرعة فائقة', description: 'أداء عالي وسرعة استجابة ممتازة' },
      { type: 'icon-card', icon: 'Shield', title: 'أمان متقدم', description: 'حماية بيانات بأعلى المعايير' },
      { type: 'icon-card', icon: 'Zap', title: 'سهولة الاستخدام', description: 'واجهة بسيطة وسهلة التعلم' },
      { type: 'spacer', size: 'md' },
      { type: 'accordion', items: [
        { id: uuidv4(), question: 'ما هي الخدمات المقدمة؟', answer: 'نقدم مجموعة متنوعة من الخدمات التقنية' },
        { id: uuidv4(), question: 'كيف يمكنني البدء؟', answer: 'يمكنك التسجيل مجاناً والبدء فوراً' },
        { id: uuidv4(), question: 'هل هناك دعم فني؟', answer: 'نعم، فريق الدعم متاح على مدار الساعة' },
      ]},
      { type: 'spacer', size: 'sm' },
      { type: 'button', text: 'ابدأ الآن', url: '#', variant: 'gradient', size: 'lg' },
    ],
  },
  {
    id: 'landing-en',
    name: { ar: 'صفحة هبوط إنجليزية', en: 'English Landing Page' },
    description: { ar: 'صفحة هبوط بالإنجليزية', en: 'Ready-made English landing page' },
    direction: 'ltr',
    blocks: [
      { type: 'text', content: 'Welcome to Our Platform', level: 'h1' },
      { type: 'text', content: 'We provide innovative tech solutions to help you achieve your goals', level: 'p' },
      { type: 'spacer', size: 'md' },
      { type: 'icon-card', icon: 'Rocket', title: 'Fast Performance', description: 'High performance and excellent response time' },
      { type: 'icon-card', icon: 'Shield', title: 'Advanced Security', description: 'Data protection with the highest standards' },
      { type: 'icon-card', icon: 'Zap', title: 'Easy to Use', description: 'Simple and intuitive interface' },
      { type: 'spacer', size: 'md' },
      { type: 'button', text: 'Get Started', url: '#', variant: 'gradient', size: 'lg' },
    ],
  },
  {
    id: 'docs-ar',
    name: { ar: 'صفحة توثيق عربية', en: 'Arabic Documentation' },
    description: { ar: 'صفحة توثيق تقنية', en: 'Technical documentation page' },
    direction: 'rtl',
    blocks: [
      { type: 'text', content: 'التوثيق التقني', level: 'h1' },
      { type: 'text', content: 'دليل شامل لاستخدام المنصة', level: 'h2' },
      { type: 'alert', message: 'تأكد من قراءة التوثيق كاملاً قبل البدء', alertType: 'info' },
      { type: 'text', content: 'الخطوة الأولى هي تثبيت المكتبة عبر npm', level: 'p' },
      { type: 'code', code: 'npm install my-library\nnpm run dev', language: 'bash', filename: 'terminal' },
      { type: 'text', content: 'الإعدادات المتاحة', level: 'h3' },
      { type: 'table', headers: ['الإعداد', 'النوع', 'الافتراضي', 'الوصف'], rows: [
        ['theme', 'string', 'dark', 'سمة التطبيق'],
        ['lang', 'string', 'ar', 'لغة الواجهة'],
        ['rtl', 'boolean', 'true', 'دعم RTL'],
      ]},
      { type: 'list', items: ['تثبيت المكتبة', 'ضبط الإعدادات', 'إنشاء أول مشروع', 'نشر التطبيق'], ordered: true },
      { type: 'alert', message: 'هذه الميزة تجريبية وقد تتغير في الإصدارات القادمة', alertType: 'warning' },
    ],
  },
  {
    id: 'showcase',
    name: { ar: 'عرض جميع المكونات', en: 'All Components Showcase' },
    description: { ar: 'معرض لكل أنواع البلوكات', en: 'Gallery of all block types' },
    direction: 'rtl',
    blocks: [
      { type: 'text', content: 'معرض المكونات', level: 'h1' },
      { type: 'text', content: 'هذه الصفحة تعرض جميع أنواع البلوكات المتاحة', level: 'p' },
      { type: 'divider', style: 'gradient' },
      { type: 'icon-card', icon: 'Star', title: 'بطاقة أيقونة', description: 'مكون بطاقة مع أيقونة وعنوان ووصف' },
      { type: 'card', title: 'بطاقة عادية', content: 'هذا مثال على بطاقة بنمط افتراضي', variant: 'default' },
      { type: 'card', title: 'بطاقة رئيسية', content: 'هذا مثال على بطاقة بنمط رئيسي', variant: 'primary' },
      { type: 'card', title: 'بطاقة مميزة', content: 'هذا مثال على بطاقة بنمط مميز', variant: 'accent' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', alt: 'صورة توضيحية', caption: 'صورة توضيحية' },
      { type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'فيديو توضيحي', provider: 'youtube' },
      { type: 'button', text: 'زر عادي', url: '#', variant: 'default', size: 'md' },
      { type: 'button', text: 'زر متدرج', url: '#', variant: 'gradient', size: 'lg' },
      { type: 'code', code: 'const hello = "مرحباً";\nconsole.log(hello);', language: 'javascript', filename: 'example.js' },
      { type: 'quote', text: 'الإبداع هو الذكاء وهو يستمتع', author: 'ألبرت أينشتاين' },
      { type: 'alert', message: 'هذا تنبيه معلوماتي', alertType: 'info' },
      { type: 'alert', message: 'تمت العملية بنجاح', alertType: 'success' },
      { type: 'alert', message: 'تحذير: تأكد من الإعدادات', alertType: 'warning' },
      { type: 'alert', message: 'خطأ: فشل في الاتصال', alertType: 'error' },
      { type: 'list', items: ['العنصر الأول', 'العنصر الثاني', 'العنصر الثالث'], ordered: false },
      { type: 'list', items: ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'], ordered: true },
      { type: 'table', headers: ['الاسم', 'الدور', 'المدينة'], rows: [['أحمد', 'مطور', 'الرياض'], ['سارة', 'مصممة', 'جدة']] },
      { type: 'accordion', items: [
        { id: uuidv4(), question: 'سؤال أول', answer: 'إجابة السؤال الأول' },
        { id: uuidv4(), question: 'سؤال ثاني', answer: 'إجابة السؤال الثاني' },
      ]},
      { type: 'tabs', items: [
        { id: uuidv4(), label: 'التبويب الأول', content: 'محتوى التبويب الأول' },
        { id: uuidv4(), label: 'التبويب الثاني', content: 'محتوى التبويب الثاني' },
      ]},
      { type: 'divider', style: 'solid' },
      { type: 'divider', style: 'dashed' },
      { type: 'spacer', size: 'xl' },
    ],
  },
];

export function createBlocksFromTemplate(template: PageTemplate): Block[] {
  return template.blocks.map((b, i) => ({
    ...b,
    id: uuidv4(),
    order: i,
  })) as Block[];
}
