import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Block, BlockType, AccordionItem, TabItem, GalleryItem, StatItem, TimelineItem, PricingFeature, ApiMethod, FileTreeItem, DiffLine, ChecklistItem, KanbanColumn } from '@/types/pageBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BlockEditorProps {
  block: Block | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
}

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

  const renderFields = () => {
    switch (block.type) {
      case 'text':
        return (
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

      case 'icon-card':
        return (
          <>
            <Field label={isRTL ? 'الأيقونة' : 'Icon'} value={formData.icon} onChange={(v) => update('icon', v)} placeholder="Star, Rocket, Shield..." />
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <div className="space-y-2">
              <Label>{isRTL ? 'الوصف' : 'Description'}</Label>
              <Textarea value={formData.description || ''} onChange={(e) => update('description', e.target.value)} rows={2} />
            </div>
          </>
        );

      case 'table':
        return (
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

      case 'card':
        return (
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

      case 'divider':
        return (
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

      case 'image':
        return (
          <>
            <Field label={isRTL ? 'رابط الصورة' : 'Image URL'} value={formData.src} onChange={(v) => update('src', v)} />
            <Field label={isRTL ? 'النص البديل' : 'Alt Text'} value={formData.alt} onChange={(v) => update('alt', v)} />
            <Field label={isRTL ? 'التعليق' : 'Caption'} value={formData.caption} onChange={(v) => update('caption', v)} />
          </>
        );

      case 'video':
        return (
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

      case 'button':
        return (
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

      case 'accordion':
        return (
          <div className="space-y-3">
            <Label>{isRTL ? 'العناصر' : 'Items'}</Label>
            {(formData.items || []).map((item: AccordionItem, i: number) => (
              <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input placeholder={isRTL ? 'السؤال' : 'Question'} value={item.question} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], question: e.target.value };
                  update('items', items);
                }} />
                <Textarea placeholder={isRTL ? 'الإجابة' : 'Answer'} value={item.answer} rows={2} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], answer: e.target.value };
                  update('items', items);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), question: '', answer: '' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة عنصر' : 'Add Item'}
            </Button>
          </div>
        );

      case 'tabs':
        return (
          <div className="space-y-3">
            <Label>{isRTL ? 'التبويبات' : 'Tabs'}</Label>
            {(formData.items || []).map((item: TabItem, i: number) => (
              <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input placeholder={isRTL ? 'العنوان' : 'Label'} value={item.label} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], label: e.target.value };
                  update('items', items);
                }} />
                <Textarea placeholder={isRTL ? 'المحتوى' : 'Content'} value={item.content} rows={2} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], content: e.target.value };
                  update('items', items);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), label: '', content: '' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة تبويب' : 'Add Tab'}
            </Button>
          </div>
        );

      case 'code':
        return (
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

      case 'quote':
        return (
          <>
            <div className="space-y-2">
              <Label>{isRTL ? 'الاقتباس' : 'Quote'}</Label>
              <Textarea value={formData.text || ''} onChange={(e) => update('text', e.target.value)} rows={3} />
            </div>
            <Field label={isRTL ? 'المؤلف' : 'Author'} value={formData.author} onChange={(v) => update('author', v)} />
          </>
        );

      case 'alert':
        return (
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

      case 'list':
        return (
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

      case 'spacer':
        return (
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

      // ===== NEW BLOCK EDITORS =====

      case 'hero':
        return (
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

      case 'gallery':
        return (
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
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input placeholder={isRTL ? 'رابط الصورة' : 'Image URL'} value={item.src} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], src: e.target.value };
                  update('items', items);
                }} />
                <Input placeholder={isRTL ? 'النص البديل' : 'Alt'} value={item.alt} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], alt: e.target.value };
                  update('items', items);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), src: '', alt: '' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة صورة' : 'Add Image'}
            </Button>
          </div>
        );

      case 'progress':
        return (
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

      case 'stats':
        return (
          <div className="space-y-3">
            <Label>{isRTL ? 'الإحصائيات' : 'Stats'}</Label>
            {(formData.items || []).map((item: StatItem, i: number) => (
              <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder={isRTL ? 'القيمة' : 'Value'} value={item.value} onChange={(e) => {
                    const items = [...formData.items];
                    items[i] = { ...items[i], value: e.target.value };
                    update('items', items);
                  }} />
                  <Input placeholder={isRTL ? 'التسمية' : 'Label'} value={item.label} onChange={(e) => {
                    const items = [...formData.items];
                    items[i] = { ...items[i], label: e.target.value };
                    update('items', items);
                  }} />
                </div>
                <Input placeholder={isRTL ? 'الأيقونة' : 'Icon (e.g. Users, Star)'} value={item.icon || ''} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], icon: e.target.value };
                  update('items', items);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), value: '', label: '', icon: 'Hash' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة إحصائية' : 'Add Stat'}
            </Button>
          </div>
        );

      case 'embed':
        return (
          <>
            <Field label={isRTL ? 'رابط التضمين' : 'Embed URL'} value={formData.url} onChange={(v) => update('url', v)} placeholder="https://..." />
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Field label={isRTL ? 'الارتفاع (بكسل)' : 'Height (px)'} value={String(formData.height || 400)} onChange={(v) => update('height', Number(v))} />
          </>
        );

      case 'timeline':
        return (
          <div className="space-y-3">
            <Label>{isRTL ? 'الأحداث' : 'Events'}</Label>
            {(formData.items || []).map((item: TimelineItem, i: number) => (
              <div key={item.id} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Input placeholder={isRTL ? 'التاريخ' : 'Date'} value={item.date || ''} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], date: e.target.value };
                  update('items', items);
                }} />
                <Input placeholder={isRTL ? 'العنوان' : 'Title'} value={item.title} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], title: e.target.value };
                  update('items', items);
                }} />
                <Textarea placeholder={isRTL ? 'الوصف' : 'Description'} value={item.description} rows={2} onChange={(e) => {
                  const items = [...formData.items];
                  items[i] = { ...items[i], description: e.target.value };
                  update('items', items);
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), title: '', description: '' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة حدث' : 'Add Event'}
            </Button>
          </div>
        );

      case 'pricing':
        return (
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
                  <Switch checked={f.included} onCheckedChange={(v) => {
                    const features = [...formData.features];
                    features[i] = { ...features[i], included: v };
                    update('features', features);
                  }} />
                  <Input value={f.text} className="flex-1" placeholder={isRTL ? 'الميزة' : 'Feature'} onChange={(e) => {
                    const features = [...formData.features];
                    features[i] = { ...features[i], text: e.target.value };
                    update('features', features);
                  }} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('features', formData.features.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => update('features', [...(formData.features || []), { id: uuidv4(), text: '', included: true }])}>
                <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة ميزة' : 'Add Feature'}
              </Button>
            </div>
          </>
        );

      case 'testimonial':
        return (
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

      case 'terminal':
        return (
          <>
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Field label={isRTL ? 'رمز الطرفية' : 'Prompt Symbol'} value={formData.prompt} onChange={(v) => update('prompt', v)} placeholder="$" />
            <div className="space-y-2">
              <Label>{isRTL ? 'الأوامر (سطر لكل أمر)' : 'Commands (one per line)'}</Label>
              <Textarea value={(formData.commands || []).join('\n')} onChange={(e) => update('commands', e.target.value.split('\n'))} rows={6} className="font-mono text-sm" dir="ltr" />
            </div>
          </>
        );

      case 'api':
        return (
          <div className="space-y-3">
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Field label={isRTL ? 'الرابط الأساسي' : 'Base URL'} value={formData.baseUrl} onChange={(v) => update('baseUrl', v)} />
            <Label>{isRTL ? 'نقاط النهاية' : 'Endpoints'}</Label>
            {(formData.methods || []).map((m: ApiMethod, i: number) => (
              <div key={m.id} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">#{i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('methods', formData.methods.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={m.method} onValueChange={(v) => { const methods = [...formData.methods]; methods[i] = { ...methods[i], method: v }; update('methods', methods); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input className="col-span-2 font-mono text-sm" placeholder="/endpoint" value={m.endpoint} onChange={(e) => { const methods = [...formData.methods]; methods[i] = { ...methods[i], endpoint: e.target.value }; update('methods', methods); }} />
                </div>
                <Input placeholder={isRTL ? 'الوصف' : 'Description'} value={m.description} onChange={(e) => { const methods = [...formData.methods]; methods[i] = { ...methods[i], description: e.target.value }; update('methods', methods); }} />
                <Textarea placeholder={isRTL ? 'المعاملات (JSON)' : 'Params'} value={m.params || ''} rows={2} className="font-mono text-xs" onChange={(e) => { const methods = [...formData.methods]; methods[i] = { ...methods[i], params: e.target.value }; update('methods', methods); }} />
                <Textarea placeholder={isRTL ? 'الاستجابة (JSON)' : 'Response'} value={m.response || ''} rows={2} className="font-mono text-xs" onChange={(e) => { const methods = [...formData.methods]; methods[i] = { ...methods[i], response: e.target.value }; update('methods', methods); }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('methods', [...(formData.methods || []), { id: uuidv4(), method: 'GET', endpoint: '', description: '', params: '', response: '' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة نقطة نهاية' : 'Add Endpoint'}
            </Button>
          </div>
        );

      case 'file-tree':
        return (
          <div className="space-y-3">
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Label>{isRTL ? 'الملفات والمجلدات' : 'Files & Folders'}</Label>
            {(formData.items || []).map((item: FileTreeItem, i: number) => (
              <div key={item.id} className="flex items-center gap-2">
                <Select value={item.type} onValueChange={(v) => { const items = [...formData.items]; items[i] = { ...items[i], type: v }; update('items', items); }}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">{isRTL ? 'مجلد' : 'Folder'}</SelectItem>
                    <SelectItem value="file">{isRTL ? 'ملف' : 'File'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="flex-1 font-mono text-sm" value={item.name} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], name: e.target.value }; update('items', items); }} />
                <Input className="w-16" type="number" min={0} max={10} value={item.indent} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], indent: Number(e.target.value) }; update('items', items); }} />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), name: '', type: 'file', indent: 0 }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة عنصر' : 'Add Item'}
            </Button>
          </div>
        );

      case 'diff':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
              <Field label={isRTL ? 'اسم الملف' : 'Filename'} value={formData.filename} onChange={(v) => update('filename', v)} />
            </div>
            <Label>{isRTL ? 'سطور الكود' : 'Diff Lines'}</Label>
            {(formData.lines || []).map((line: DiffLine, i: number) => (
              <div key={line.id} className="flex items-center gap-2">
                <Select value={line.type} onValueChange={(v) => { const lines = [...formData.lines]; lines[i] = { ...lines[i], type: v }; update('lines', lines); }}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unchanged">{isRTL ? 'بدون تغيير' : 'Unchanged'}</SelectItem>
                    <SelectItem value="added">{isRTL ? 'مضاف' : 'Added'}</SelectItem>
                    <SelectItem value="removed">{isRTL ? 'محذوف' : 'Removed'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="flex-1 font-mono text-sm" value={line.content} onChange={(e) => { const lines = [...formData.lines]; lines[i] = { ...lines[i], content: e.target.value }; update('lines', lines); }} />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('lines', formData.lines.filter((_: any, idx: number) => idx !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('lines', [...(formData.lines || []), { id: uuidv4(), type: 'unchanged', content: '' }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة سطر' : 'Add Line'}
            </Button>
          </div>
        );

      case 'checklist':
        return (
          <div className="space-y-3">
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Label>{isRTL ? 'المهام' : 'Tasks'}</Label>
            {(formData.items || []).map((item: ChecklistItem, i: number) => (
              <div key={item.id} className="flex items-center gap-2">
                <Switch checked={item.checked} onCheckedChange={(v) => { const items = [...formData.items]; items[i] = { ...items[i], checked: v }; update('items', items); }} />
                <Input className="flex-1" value={item.text} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], text: e.target.value }; update('items', items); }} />
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), text: '', checked: false }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة مهمة' : 'Add Task'}
            </Button>
          </div>
        );

      case 'citation':
        return (
          <>
            <Field label={isRTL ? 'عنوان البحث' : 'Paper Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Field label={isRTL ? 'المؤلفون' : 'Authors'} value={formData.authors} onChange={(v) => update('authors', v)} placeholder="John Doe, Jane Smith" />
            <div className="grid grid-cols-2 gap-3">
              <Field label={isRTL ? 'المصدر / المجلة' : 'Source / Journal'} value={formData.source} onChange={(v) => update('source', v)} />
              <Field label={isRTL ? 'السنة' : 'Year'} value={formData.year} onChange={(v) => update('year', v)} />
            </div>
            <Field label="DOI" value={formData.doi} onChange={(v) => update('doi', v)} placeholder="10.xxxx/xxxxx" />
            <Field label={isRTL ? 'رابط' : 'URL'} value={formData.url} onChange={(v) => update('url', v)} />
          </>
        );

      case 'math':
        return (
          <>
            <div className="space-y-2">
              <Label>{isRTL ? 'المعادلة' : 'Expression'}</Label>
              <Textarea value={formData.expression || ''} onChange={(e) => update('expression', e.target.value)} rows={3} className="font-mono" dir="ltr" />
            </div>
            <Field label={isRTL ? 'التسمية' : 'Label'} value={formData.label} onChange={(v) => update('label', v)} />
            <div className="flex items-center gap-2">
              <Switch checked={formData.displayMode ?? true} onCheckedChange={(v) => update('displayMode', v)} />
              <Label>{isRTL ? 'عرض كبير (وسط الصفحة)' : 'Display Mode (centered)'}</Label>
            </div>
          </>
        );

      case 'kanban':
        return (
          <div className="space-y-3">
            <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
            <Label>{isRTL ? 'الأعمدة' : 'Columns'}</Label>
            {(formData.columns || []).map((col: KanbanColumn, i: number) => (
              <div key={col.id} className="space-y-2 p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Input className="font-semibold border-none bg-transparent shadow-none p-0 h-auto" value={col.title} onChange={(e) => { const columns = [...formData.columns]; columns[i] = { ...columns[i], title: e.target.value }; update('columns', columns); }} />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('columns', formData.columns.filter((_: any, idx: number) => idx !== i))}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <Textarea placeholder={isRTL ? 'العناصر (سطر لكل عنصر)' : 'Items (one per line)'} value={col.items.join('\n')} rows={3} onChange={(e) => { const columns = [...formData.columns]; columns[i] = { ...columns[i], items: e.target.value.split('\n') }; update('columns', columns); }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => update('columns', [...(formData.columns || []), { id: uuidv4(), title: '', items: [''] }])}>
              <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة عمود' : 'Add Column'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? 'تعديل البلوك' : 'Edit Block'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">{renderFields()}</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
          <Button onClick={handleSave}>{isRTL ? 'حفظ' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
