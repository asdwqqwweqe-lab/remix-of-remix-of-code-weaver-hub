import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Palette, 
  Edit2, 
  Copy, 
  Check,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

const CustomCssManager = () => {
  const { language } = useLanguage();
  const { settings, addCustomCss, removeCustomCss, toggleCustomCss, updateCustomCss } = useSettingsStore();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newCss, setNewCss] = useState({
    name: '',
    code: '',
    description: ''
  });

  const handleAdd = () => {
    if (!newCss.name.trim() || !newCss.code.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال الاسم والكود' : 'Please enter name and code');
      return;
    }

    addCustomCss(newCss.name.trim(), newCss.code.trim(), newCss.description.trim());
    setNewCss({ name: '', code: '', description: '' });
    setIsAddDialogOpen(false);
    toast.success(language === 'ar' ? 'تم إضافة الستايل' : 'Style added');
  };

  const handleUpdate = () => {
    if (!editingId || !newCss.name.trim() || !newCss.code.trim()) return;
    
    updateCustomCss(editingId, {
      name: newCss.name.trim(),
      code: newCss.code.trim(),
      description: newCss.description.trim()
    });
    setNewCss({ name: '', code: '', description: '' });
    setEditingId(null);
    toast.success(language === 'ar' ? 'تم تحديث الستايل' : 'Style updated');
  };

  const handleEdit = (css: typeof settings.customCss[0]) => {
    setNewCss({
      name: css.name,
      code: css.code,
      description: css.description || ''
    });
    setEditingId(css.id);
  };

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(language === 'ar' ? 'تم نسخ الكود' : 'Code copied');
  };

  const handleDelete = (id: string, name: string) => {
    removeCustomCss(id);
    toast.success(language === 'ar' ? `تم حذف "${name}"` : `Deleted "${name}"`);
  };

  const presetStyles = [
    {
      name: language === 'ar' ? 'زوايا مستديرة ناعمة' : 'Soft Rounded Corners',
      code: `/* Soft Rounded Corners */
* {
  border-radius: 12px !important;
}
button, .btn {
  border-radius: 20px !important;
}`,
      description: language === 'ar' ? 'تطبيق زوايا مستديرة على جميع العناصر' : 'Apply rounded corners to all elements'
    },
    {
      name: language === 'ar' ? 'ظلال محسنة' : 'Enhanced Shadows',
      code: `/* Enhanced Shadows */
.card, [class*="Card"] {
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15) !important;
}
button:hover, .btn:hover {
  box-shadow: 0 5px 20px -5px rgba(0,0,0,0.2) !important;
}`,
      description: language === 'ar' ? 'إضافة ظلال أكثر وضوحاً' : 'Add more prominent shadows'
    },
    {
      name: language === 'ar' ? 'تأثيرات انتقالية' : 'Smooth Transitions',
      code: `/* Smooth Transitions */
* {
  transition: all 0.3s ease !important;
}
a:hover, button:hover {
  transform: translateY(-2px);
}`,
      description: language === 'ar' ? 'تأثيرات انتقالية سلسة' : 'Smooth transition effects'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {language === 'ar' ? 'أكواد CSS مخصصة' : 'Custom CSS Styles'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'إضافة أكواد CSS مخصصة لتنسيق التطبيق بالكامل' 
                : 'Add custom CSS to style the entire application'}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 me-2" />
                {language === 'ar' ? 'إضافة ستايل' : 'Add Style'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'إضافة كود CSS جديد' : 'Add New CSS Code'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'اسم الستايل' : 'Style Name'}</Label>
                  <Input
                    value={newCss.name}
                    onChange={(e) => setNewCss({ ...newCss, name: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: تنسيق الأزرار' : 'E.g., Button Styling'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}</Label>
                  <Input
                    value={newCss.description}
                    onChange={(e) => setNewCss({ ...newCss, description: e.target.value })}
                    placeholder={language === 'ar' ? 'وصف قصير للستايل' : 'Short description'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'كود CSS' : 'CSS Code'}</Label>
                  <Textarea
                    value={newCss.code}
                    onChange={(e) => setNewCss({ ...newCss, code: e.target.value })}
                    placeholder={`/* CSS Code */
.my-class {
  color: #333;
}`}
                    className="font-mono text-sm min-h-[200px] direction-ltr"
                    dir="ltr"
                  />
                </div>

                {/* Preset Styles */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    {language === 'ar' ? 'قوالب جاهزة' : 'Preset Templates'}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {presetStyles.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto py-2"
                        onClick={() => setNewCss({
                          name: preset.name,
                          code: preset.code,
                          description: preset.description
                        })}
                      >
                        <Code className="h-4 w-4 me-2 shrink-0" />
                        <span className="truncate">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleAdd}>
                  {language === 'ar' ? 'إضافة' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.customCss.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{language === 'ar' ? 'لم يتم إضافة أي أكواد CSS بعد' : 'No custom CSS added yet'}</p>
            <p className="text-sm mt-1">
              {language === 'ar' 
                ? 'أضف كود CSS لتخصيص مظهر التطبيق' 
                : 'Add CSS code to customize the app appearance'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {settings.customCss.map((css) => (
              <div
                key={css.id}
                className={`border rounded-lg overflow-hidden transition-all ${
                  css.isActive ? 'border-primary/50 bg-primary/5' : 'opacity-60'
                }`}
              >
                {editingId === css.id ? (
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'اسم الستايل' : 'Style Name'}</Label>
                      <Input
                        value={newCss.name}
                        onChange={(e) => setNewCss({ ...newCss, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                      <Input
                        value={newCss.description}
                        onChange={(e) => setNewCss({ ...newCss, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'ar' ? 'كود CSS' : 'CSS Code'}</Label>
                      <Textarea
                        value={newCss.code}
                        onChange={(e) => setNewCss({ ...newCss, code: e.target.value })}
                        className="font-mono text-sm min-h-[150px]"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setNewCss({ name: '', code: '', description: '' });
                        }}
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button size="sm" onClick={handleUpdate}>
                        {language === 'ar' ? 'حفظ' : 'Save'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Switch
                          checked={css.isActive}
                          onCheckedChange={() => toggleCustomCss(css.id)}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{css.name}</span>
                            {css.isActive && (
                              <Badge variant="default" className="text-xs shrink-0">
                                {language === 'ar' ? 'مفعّل' : 'Active'}
                              </Badge>
                            )}
                          </div>
                          {css.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {css.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(css.code, css.id)}
                        >
                          {copiedId === css.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(css)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(css.id, css.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="border-t bg-muted/30 p-3">
                      <pre className="text-xs font-mono overflow-x-auto max-h-24 text-muted-foreground" dir="ltr">
                        {css.code.length > 200 ? css.code.slice(0, 200) + '...' : css.code}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomCssManager;
