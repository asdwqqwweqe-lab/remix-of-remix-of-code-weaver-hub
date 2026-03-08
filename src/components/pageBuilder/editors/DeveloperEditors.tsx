import { v4 as uuidv4 } from 'uuid';
import { ApiMethod, FileTreeItem, DiffLine, ChecklistItem, KanbanColumn } from '@/types/pageBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { Field } from './EditorField';

interface EditorProps {
  formData: any;
  update: (key: string, value: any) => void;
  isRTL: boolean;
}

export const TerminalEditor = ({ formData, update, isRTL }: EditorProps) => (
  <>
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <Field label={isRTL ? 'رمز الطرفية' : 'Prompt Symbol'} value={formData.prompt} onChange={(v) => update('prompt', v)} placeholder="$" />
    <div className="space-y-2">
      <Label>{isRTL ? 'الأوامر (سطر لكل أمر)' : 'Commands (one per line)'}</Label>
      <Textarea value={(formData.commands || []).join('\n')} onChange={(e) => update('commands', e.target.value.split('\n'))} rows={6} className="font-mono text-sm" dir="ltr" />
    </div>
  </>
);

export const ApiEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <Field label={isRTL ? 'الرابط الأساسي' : 'Base URL'} value={formData.baseUrl} onChange={(v) => update('baseUrl', v)} />
    <Label>{isRTL ? 'نقاط النهاية' : 'Endpoints'}</Label>
    {(formData.methods || []).map((m: ApiMethod, i: number) => (
      <div key={m.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">#{i + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('methods', formData.methods.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
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

export const FileTreeEditor = ({ formData, update, isRTL }: EditorProps) => (
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
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), name: '', type: 'file', indent: 0 }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة عنصر' : 'Add Item'}
    </Button>
  </div>
);

export const DiffEditor = ({ formData, update, isRTL }: EditorProps) => (
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
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('lines', formData.lines.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('lines', [...(formData.lines || []), { id: uuidv4(), type: 'unchanged', content: '' }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة سطر' : 'Add Line'}
    </Button>
  </div>
);

export const ChecklistEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <Label>{isRTL ? 'المهام' : 'Tasks'}</Label>
    {(formData.items || []).map((item: ChecklistItem, i: number) => (
      <div key={item.id} className="flex items-center gap-2">
        <Switch checked={item.checked} onCheckedChange={(v) => { const items = [...formData.items]; items[i] = { ...items[i], checked: v }; update('items', items); }} />
        <Input className="flex-1" value={item.text} onChange={(e) => { const items = [...formData.items]; items[i] = { ...items[i], text: e.target.value }; update('items', items); }} />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => update('items', formData.items.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('items', [...(formData.items || []), { id: uuidv4(), text: '', checked: false }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة مهمة' : 'Add Task'}
    </Button>
  </div>
);

export const CitationEditor = ({ formData, update, isRTL }: EditorProps) => (
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

export const MathEditor = ({ formData, update, isRTL }: EditorProps) => (
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

export const KanbanEditor = ({ formData, update, isRTL }: EditorProps) => (
  <div className="space-y-3">
    <Field label={isRTL ? 'العنوان' : 'Title'} value={formData.title} onChange={(v) => update('title', v)} />
    <Label>{isRTL ? 'الأعمدة' : 'Columns'}</Label>
    {(formData.columns || []).map((col: KanbanColumn, i: number) => (
      <div key={col.id} className="space-y-2 p-3 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <Input className="font-semibold border-none bg-transparent shadow-none p-0 h-auto" value={col.title} onChange={(e) => { const columns = [...formData.columns]; columns[i] = { ...columns[i], title: e.target.value }; update('columns', columns); }} />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => update('columns', formData.columns.filter((_: any, idx: number) => idx !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
        <Textarea placeholder={isRTL ? 'العناصر (سطر لكل عنصر)' : 'Items (one per line)'} value={col.items.join('\n')} rows={3} onChange={(e) => { const columns = [...formData.columns]; columns[i] = { ...columns[i], items: e.target.value.split('\n') }; update('columns', columns); }} />
      </div>
    ))}
    <Button variant="outline" size="sm" className="w-full" onClick={() => update('columns', [...(formData.columns || []), { id: uuidv4(), title: '', items: [''] }])}>
      <Plus className="w-4 h-4 me-1" /> {isRTL ? 'إضافة عمود' : 'Add Column'}
    </Button>
  </div>
);
