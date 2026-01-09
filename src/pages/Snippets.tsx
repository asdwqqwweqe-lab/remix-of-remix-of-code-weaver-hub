import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlogStore } from '@/store/blogStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Copy, Layers, Search } from 'lucide-react';
import { toast } from 'sonner';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import Pagination from '@/components/common/Pagination';
import AIGenerateButton from '@/components/common/AIGenerateButton';

const ITEMS_PER_PAGE = 8;

const Snippets = () => {
  const { t } = useTranslation();
  const { snippets, programmingLanguages, addSnippet, updateSnippet, deleteSnippet, getLanguageById } = useBlogStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    languageId: '',
  });

  // Filter snippets
  const filteredSnippets = useMemo(() => {
    if (!searchQuery) return snippets;
    return snippets.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [snippets, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredSnippets.length / ITEMS_PER_PAGE);
  const paginatedSnippets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSnippets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSnippets, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  useEffect(() => {
    // Highlight all code blocks after render
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [paginatedSnippets]);

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.code.trim()) {
      toast.error(t('snippets.requiredFields'));
      return;
    }

    if (editingId) {
      updateSnippet(editingId, formData);
      toast.success(t('snippets.updated'));
    } else {
      addSnippet(formData);
      toast.success(t('snippets.created'));
    }

    resetForm();
  };

  const handleEdit = (snippet: typeof snippets[0]) => {
    setEditingId(snippet.id);
    setFormData({
      title: snippet.title,
      description: snippet.description || '',
      code: snippet.code,
      languageId: snippet.languageId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteSnippet(id);
    toast.success(t('snippets.deleted'));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t('snippets.copied'));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', code: '', languageId: '' });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const getLanguageName = (langId: string) => {
    const lang = getLanguageById(langId);
    if (!lang) return 'plaintext';
    const nameMap: Record<string, string> = {
      'JavaScript': 'javascript',
      'TypeScript': 'typescript',
      'React': 'jsx',
      'PHP': 'php',
      'Laravel': 'php',
      'Python': 'python',
      'Node.js': 'javascript',
      'Vue.js': 'javascript',
      'CSS': 'css',
      'HTML': 'html',
    };
    return nameMap[lang.name] || 'plaintext';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('snippets.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {snippets.length} {t('snippets.total')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              {t('snippets.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('snippets.edit') : t('snippets.add')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('snippets.name')} *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('programmingLanguages.title')}</Label>
                    <AIGenerateButton
                      context={formData.title}
                      field="category"
                      onGenerate={(lang) => {
                        const foundLang = programmingLanguages.find(l => 
                          l.name.toLowerCase().includes(lang.toLowerCase()) ||
                          lang.toLowerCase().includes(l.name.toLowerCase())
                        );
                        if (foundLang) {
                          setFormData(prev => ({ ...prev, languageId: foundLang.id }));
                        }
                      }}
                    />
                  </div>
                  <Select 
                    value={formData.languageId || "none"} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, languageId: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('snippets.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('common.none')}</SelectItem>
                      {programmingLanguages.filter(lang => lang.id).map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: lang.color }}
                            />
                            {lang.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('snippets.description')}</Label>
                  <AIGenerateButton
                    context={formData.title}
                    field="description"
                    onGenerate={(desc) => setFormData(prev => ({ ...prev, description: desc }))}
                  />
                </div>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('snippets.code')} *</Label>
                <Textarea
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="font-mono min-h-[200px] text-left"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? t('common.save') : t('common.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="ps-10"
        />
      </div>

      {/* Snippets Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {paginatedSnippets.map((snippet) => {
          const lang = getLanguageById(snippet.languageId);
          const highlightLang = getLanguageName(snippet.languageId);
          return (
            <Card key={snippet.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{snippet.title}</CardTitle>
                      {snippet.description && (
                        <p className="text-sm text-muted-foreground">{snippet.description}</p>
                      )}
                    </div>
                  </div>
                  {lang && (
                    <Badge style={{ backgroundColor: lang.color, color: '#fff' }}>
                      {lang.name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="code-block text-sm overflow-x-auto max-h-[200px] text-left" dir="ltr">
                    <code className={`language-${highlightLang}`}>{snippet.code}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyCode(snippet.code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(snippet)}>
                    <Edit className="w-4 h-4 me-1" />
                    {t('common.edit')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(snippet.id)}
                  >
                    <Trash2 className="w-4 h-4 me-1" />
                    {t('common.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredSnippets.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('snippets.noSnippets')}</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={filteredSnippets.length}
      />
    </div>
  );
};

export default Snippets;