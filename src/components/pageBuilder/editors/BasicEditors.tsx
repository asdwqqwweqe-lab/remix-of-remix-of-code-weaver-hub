import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Field } from './EditorField';

interface EditorProps {
  formData: any;
  update: (key: string, value: any) => void;
  isRTL: boolean;
}

export const TextEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="space-y-2">
      <Label>{isRTL ? 'المستوى' : 'Level'}</Label>
      <Select value={formData.level || 'p'} onValueChange={(v) => update('level', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="h1">H1</SelectItem>
          <SelectItem value="h2">H2</SelectItem>
          <SelectItem value="h3">H3</SelectItem>
          <SelectItem value="h4">H4</SelectItem>
          <SelectItem value="p">{isRTL ? 'فقرة' : 'Paragraph'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'المحتوى' : 'Content'}</Label>
      <Textarea value={formData.content || ''} onChange={(e) => update('content', e.target.value)} rows={3} />
    </div>
  </>
);

export const IconCardEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'الأيقونة' : 'Icon'} value={formData.icon} onChange={(v) => update('icon', v)} placeholder="Star, Rocket, Shield..." />
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <div className="space-y-2">
      <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
      <Textarea value={formData.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} />
    </div>
  </>
);

export const TableEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="space-y-2">
      <Label>{isRTL ? 'الأعمدة (مفصولة بفاصلة)' : 'Headers (comma-separated)'}</Label>
      <Input value={(formData.headers || []).join(', ')} onChange={(e) => update('headers', e.target.value.split(',').map((s: string) => s.trim()))} />
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'الصفوف (سطر لكل صف، الأعمدة مفصولة بـ |)' : 'Rows (one per line, columns separated by |)'}</Label>
      <Textarea
        value={(formData.rows || []).map((r: string[]) => r.join(' | ')).join('\n')}
        onChange={(e) => update('rows', e.target.value.split('\n').map((line: string) => line.split('|').map((s: string) => s.trim())))}
        rows={5}
      />
    </div>
  </>
);

export const CardEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <div className="space-y-2">
      <Label>{isRTL ? 'المحتوى' : 'Content'}</Label>
      <Textarea value={formData.content || ''} onChange={(e) => update('content', e.target.value)} rows={3} />
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'النمط' : 'Variant'}</Label>
      <Select value={formData.variant || 'default'} onValueChange={(v) => update('variant', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">{isRTL ? 'افتراضي' : 'Default'}</SelectItem>
          <SelectItem value="primary">{isRTL ? 'رئيسي' : 'Primary'}</SelectItem>
          <SelectItem value="accent">{isRTL ? 'مميز' : 'Accent'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

export const DividerEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-2">
    <Label>{isRTL ? 'النمط' : 'Style'}</Label>
    <Select value={formData.style || 'solid'} onValueChange={(v) => update('style', v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="solid">{isRTL ? 'متصل' : 'Solid'}</SelectItem>
        <SelectItem value="dashed">{isRTL ? 'متقطع' : 'Dashed'}</SelectItem>
        <SelectItem value="gradient">{isRTL ? 'متدرج' : 'Gradient'}</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export const ImageEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'رابط الصورة' : 'Image URL'} value={formData.src} onChange={(v) => update('src', v)} />
    <Field label={isRTL ? 'النص البديل' : 'Alt Text'} value={formData.alt} onChange={(v) => update('alt', v)} />
    <Field label={isRTL ? 'التعليق' : 'Caption'} value={formData.caption} onChange={(v) => update('caption', v)} />
  </>
);

export const VideoEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'رابط الفيديو' : 'Video URL'} value={formData.url} onChange={(v) => update('url', v)} />
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <div className="space-y-2">
      <Label>{isRTL ? 'المزود' : 'Provider'}</Label>
      <Select value={formData.provider || 'youtube'} onValueChange={(v) => update('provider', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="youtube">YouTube</SelectItem>
          <SelectItem value="vimeo">Vimeo</SelectItem>
          <SelectItem value="direct">{isRTL ? 'مباشر' : 'Direct'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

export const ButtonEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'النص' : 'Text'} value={formData.text} onChange={(v) => update('text', v)} />
    <Field label={isRTL ? 'الرابط' : 'URL'} value={formData.url} onChange={(v) => update('url', v)} />
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label>{isRTL ? 'النمط' : 'Variant'}</Label>
        <Select value={formData.variant || 'default'} onValueChange={(v) => update('variant', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{isRTL ? 'افتراضي' : 'Default'}</SelectItem>
            <SelectItem value="primary">{isRTL ? 'رئيسي' : 'Primary'}</SelectItem>
            <SelectItem value="outline">{isRTL ? 'حدود' : 'Outline'}</SelectItem>
            <SelectItem value="gradient">{isRTL ? 'متدرج' : 'Gradient'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{isRTL ? 'الحجم' : 'Size'}</Label>
        <Select value={formData.size || 'md'} onValueChange={(v) => update('size', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">{isRTL ? 'صغير' : 'Small'}</SelectItem>
            <SelectItem value="md">{isRTL ? 'متوسط' : 'Medium'}</SelectItem>
            <SelectItem value="lg">{isRTL ? 'كبير' : 'Large'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </>
);

export const QuoteEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="space-y-2">
      <Label>{isRTL ? 'الاقتباس' : 'Quote'}</Label>
      <Textarea value={formData.text || ''} onChange={(e) => update('text', e.target.value)} rows={3} />
    </div>
    <Field label={isRTL ? 'المؤلف' : 'Author'} value={formData.author} onChange={(v) => update('author', v)} />
  </>
);

export const AlertEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="space-y-2">
      <Label>{isRTL ? 'النوع' : 'Type'}</Label>
      <Select value={formData.alertType || 'info'} onValueChange={(v) => update('alertType', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="info">{isRTL ? 'معلومات' : 'Info'}</SelectItem>
          <SelectItem value="success">{isRTL ? 'نجاح' : 'Success'}</SelectItem>
          <SelectItem value="warning">{isRTL ? 'تحذير' : 'Warning'}</SelectItem>
          <SelectItem value="error">{isRTL ? 'خطأ' : 'Error'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'الرسالة' : 'Message'}</Label>
      <Textarea value={formData.message || ''} onChange={(e) => update('message', e.target.value)} rows={2} />
    </div>
  </>
);

export const ListEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="flex items-center gap-2">
      <Switch checked={formData.ordered || false} onCheckedChange={(v) => update('ordered', v)} />
      <Label>{isRTL ? 'قائمة مرتبة' : 'Ordered List'}</Label>
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'العناصر (سطر لكل عنصر)' : 'Items (one per line)'}</Label>
      <Textarea
        value={(formData.items || []).join('\n')}
        onChange={(e) => update('items', e.target.value.split('\n'))}
        rows={5}
      />
    </div>
  </>
);

export const SpacerEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-2">
    <Label>{isRTL ? 'الحجم' : 'Size'}</Label>
    <Select value={formData.size || 'md'} onValueChange={(v) => update('size', v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="sm">{isRTL ? 'صغير' : 'Small'}</SelectItem>
        <SelectItem value="md">{isRTL ? 'متوسط' : 'Medium'}</SelectItem>
        <SelectItem value="lg">{isRTL ? 'كبير' : 'Large'}</SelectItem>
        <SelectItem value="xl">{isRTL ? 'كبير جداً' : 'Extra Large'}</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export const CodeEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="grid grid-cols-2 gap-3">
      <Field label={isRTL ? 'اللغة' : 'Language'} value={formData.language} onChange={(v) => update('language', v)} placeholder="javascript, python..." />
      <Field label={isRTL ? 'اسم الملف' : 'Filename'} value={formData.filename} onChange={(v) => update('filename', v)} placeholder="index.js" />
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'الكود' : 'Code'}</Label>
      <Textarea value={formData.code || ''} onChange={(e) => update('code', e.target.value)} rows={8} className="font-mono text-sm" dir="ltr" />
    </div>
  </>
);
