import { v4 as uuidv4 } from 'uuid';
import { AccordionItem, TabItem, GalleryItem, StatItem, TimelineItem, PricingFeature } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import { Field } from './EditorField';

interface EditorProps {
  formData: any;
  update: (key: string, value: any) => void;
  isRTL: boolean;
}

export const AccordionEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Label>{isRTL ? 'العناصر' : 'Items'}</Label>
    {(formData.items || []).map((item: AccordionItem, i: number) => (
      <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">#{i + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
        <Input placeholder={isRTL ? 'السؤال' : 'Question'} value={item.question} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], question: e.target.value }; update('items', items); }} />
        <Textarea placeholder={isRTL ? 'الإجابة' : 'Answer'} value={item.answer} rows={2} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], answer: e.target.value }; update('items', items); }} />
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), question: '', answer: '' }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة عنصر' : 'Add Item'}
    </Button>
  </div>
);

export const TabsEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Label>{isRTL ? 'التبويبات' : 'Tabs'}</Label>
    {(formData.items || []).map((item: TabItem, i: number) => (
      <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">#{i + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
        <Input placeholder={isRTL ? 'العنوان' : 'Label'} value={item.label} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], label: e.target.value }; update('items', items); }} />
        <Textarea placeholder={isRTL ? 'المحتوى' : 'Content'} value={item.content} rows={2} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], content: e.target.value }; update('items', items); }} />
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), label: '', content: '' }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة تبويب' : 'Add Tab'}
    </Button>
  </div>
);

export const HeroEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <div className="space-y-2">
      <Label>{isRTL ? 'العنوان الفرعي' : 'Subtitle'}</Label>
      <Textarea value={formData.subtitle || ''} onChange={(e) => update('subtitle', e.target.value)} rows={2} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label={isRTL ? 'نص الزر' : 'Button Text'} value={formData.buttonText} onChange={(v) => update('buttonText', v)} />
      <Field label={isRTL ? 'رابط الزر' : 'Button URL'} value={formData.buttonUrl} onChange={(v) => update('buttonUrl', v)} />
    </div>
    <div className="space-y-2">
      <Label>{isRTL ? 'النمط' : 'Variant'}</Label>
      <Select value={formData.variant || 'default'} onValueChange={(v) => update('variant', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">{isRTL ? 'افتراضي' : 'Default'}</SelectItem>
          <SelectItem value="gradient">{isRTL ? 'متدرج' : 'Gradient'}</SelectItem>
          <SelectItem value="image">{isRTL ? 'صورة خلفية' : 'Background Image'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    {formData.variant === 'image' && (
      <Field label={isRTL ? 'رابط صورة الخلفية' : 'Background Image URL'} value={formData.backgroundImage} onChange={(v) => update('backgroundImage', v)} />
    )}
  </>
);

export const GalleryEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <div className="space-y-2">
      <Label>{isRTL ? 'عدد الأعمدة' : 'Columns'}</Label>
      <Select value={String(formData.columns || 3)} onValueChange={(v) => update('columns', Number(v))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="3">3</SelectItem>
          <SelectItem value="4">4</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Label>{isRTL ? 'الصور' : 'Images'}</Label>
    {(formData.items || []).map((item: GalleryItem, i: number) => (
      <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">#{i + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
        <Input placeholder={isRTL ? 'رابط الصورة' : 'Image URL'} value={item.src} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], src: e.target.value }; update('items', items); }} />
        <Input placeholder={isRTL ? 'النص البديل' : 'Alt'} value={item.alt} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], alt: e.target.value }; update('items', items); }} />
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), src: '', alt: '' }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة صورة' : 'Add Image'}
    </Button>
  </div>
);

export const ProgressEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'التسمية' : 'Label'} value={formData.label} onChange={(v) => update('label', v)} />
    <div className="space-y-2">
      <Label>{isRTL ? 'القيمة' : 'Value'}: {formData.value || 0}</Label>
      <Slider value={[formData.value || 0]} max={formData.max || 100} step={1} onValueChange={([v]) => update('value', v)} />
    </div>
    <Field label={isRTL ? 'الحد الأقصى' : 'Max'} value={String(formData.max || 100)} onChange={(v) => update('max', Number(v))} />
    <div className="space-y-2">
      <Label>{isRTL ? 'اللون' : 'Color'}</Label>
      <Select value={formData.variant || 'primary'} onValueChange={(v) => update('variant', v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">{isRTL ? 'افتراضي' : 'Default'}</SelectItem>
          <SelectItem value="primary">{isRTL ? 'رئيسي' : 'Primary'}</SelectItem>
          <SelectItem value="success">{isRTL ? 'نجاح' : 'Success'}</SelectItem>
          <SelectItem value="warning">{isRTL ? 'تحذير' : 'Warning'}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </>
);

export const StatsEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Label>{isRTL ? 'الإحصائيات' : 'Stats'}</Label>
    {(formData.items || []).map((item: StatItem, i: number) => (
      <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">#{i + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder={isRTL ? 'القيمة' : 'Value'} value={item.value} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], value: e.target.value }; update('items', items); }} />
          <Input placeholder={isRTL ? 'التسمية' : 'Label'} value={item.label} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], label: e.target.value }; update('items', items); }} />
        </div>
        <Input placeholder={isRTL ? 'الأيقونة' : 'Icon (e.g. Users, Star)'} value={item.icon || ''} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], icon: e.target.value }; update('items', items); }} />
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), value: '', label: '', icon: 'Hash' }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة إحصائية' : 'Add Stat'}
    </Button>
  </div>
);

export const EmbedEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'رابط التضمين' : 'Embed URL'} value={formData.url} onChange={(v) => update('url', v)} placeholder="https://..." />
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <Field label={isRTL ? 'الارتفاع (بكسل)' : 'Height (px)'} value={String(formData.height || 400)} onChange={(v) => update('height', Number(v))} />
  </>
);

export const TimelineEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Label>{isRTL ? 'الأحداث' : 'Events'}</Label>
    {(formData.items || []).map((item: TimelineItem, i: number) => (
      <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">#{i + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
        <Input placeholder={isRTL ? 'التاريخ' : 'Date'} value={item.date || ''} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], date: e.target.value }; update('items', items); }} />
        <Input placeholder={isRTL ? 'العنوان' : 'Title'} value={item.title} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], title: e.target.value }; update('items', items); }} />
        <Textarea placeholder={isRTL ? 'الوصف' : 'Description'} value={item.description} rows={2} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], description: e.target.value }; update('items', items); }} />
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), title: '', description: '' }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة حدث' : 'Add Event'}
    </Button>
  </div>
);

export const PricingEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'اسم الخطة' : 'Plan Name'} value={formData.title} onChange={(v) => update('title', v)} />
    <div className="grid grid-cols-2 gap-3">
      <Field label={isRTL ? 'السعر' : 'Price'} value={formData.price} onChange={(v) => update('price', v)} placeholder="$29" />
      <Field label={isRTL ? 'الفترة' : 'Period'} value={formData.period} onChange={(v) => update('period', v)} placeholder={isRTL ? 'شهر' : 'month'} />
    </div>
    <div className="flex items-center gap-2">
      <Switch checked={formData.highlighted || false} onCheckedChange={(v) => update('highlighted', v)} />
      <Label>{isRTL ? 'خطة مميزة' : 'Highlighted'}</Label>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label={isRTL ? 'نص الزر' : 'Button Text'} value={formData.buttonText} onChange={(v) => update('buttonText', v)} />
      <Field label={isRTL ? 'رابط الزر' : 'Button URL'} value={formData.buttonUrl} onChange={(v) => update('buttonUrl', v)} />
    </div>
    <div className="space-y-3">
      <Label>{isRTL ? 'المميزات' : 'Features'}</Label>
      {(formData.features || []).map((f: PricingFeature, i: number) => (
        <div key={f.id} className="flex items-center gap-2">
          <Switch checked={f.included} onCheckedChange={(v) => { const features = [...formData.features]; features[i] = { ...features[i], included: v }; update('features', features); }} />
          <Input value={f.text} className="flex-1" placeholder={isRTL ? 'الميزة' : 'Feature'} onChange={(e) => { const features = [...formData.features]; features[i] = { ...features[i], text: e.target.value }; update('features', features); }} />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('features', formData.features.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={() => update('features', [...(formData.features || []), { id: uuidv4(), text: '', included: true }])}>
        <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة ميزة' : 'Add Feature'}
      </Button>
    </div>
  </>
);

export const TestimonialEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <div className="space-y-2">
      <Label>{isRTL ? 'الشهادة' : 'Testimonial'}</Label>
      <Textarea value={formData.text || ''} onChange={(e) => update('text', e.target.value)} rows={3} />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label={isRTL ? 'الاسم' : 'Author'} value={formData.author} onChange={(v) => update('author', v)} />
      <Field label={isRTL ? 'الدور' : 'Role'} value={formData.role} onChange={(v) => update('role', v)} />
    </div>
    <Field label={isRTL ? 'رابط الصورة' : 'Avatar URL'} value={formData.avatar} onChange={(v) => update('avatar', v)} />
    <div className="space-y-2">
      <Label>{isRTL ? 'التقييم' : 'Rating'}: {formData.rating || 0} ⭐</Label>
      <Slider value={[formData.rating || 0]} max={5} step={1} onValueChange={([v]) => update('rating', v)} />
    </div>
  </>
);
