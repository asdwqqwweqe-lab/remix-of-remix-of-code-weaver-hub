import { useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Image,
  Upload,
  Search,
  Plus,
  Trash2,
  Edit,
  Code,
  Tag,
  X,
  Clipboard,
  ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '@/components/common/Pagination';
import hljs from 'highlight.js';

const ITEMS_PER_PAGE = 12;

const Gallery = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { 
    galleryImages, 
    programmingLanguages,
    addGalleryImage, 
    updateGalleryImage, 
    deleteGalleryImage 
  } = useBlogStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    dataUrl: '',
    caption: '',
    description: '',
    code: '',
    codeLanguage: '',
    tags: [] as string[],
    newTag: '',
  });

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    galleryImages.forEach(img => img.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [galleryImages]);

  // Filter images
  const filteredImages = useMemo(() => {
    let filtered = [...galleryImages];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.caption?.toLowerCase().includes(query) ||
        img.description?.toLowerCase().includes(query) ||
        img.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(img => img.tags.includes(selectedTag));
    }
    
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [galleryImages, searchQuery, selectedTag]);

  // Pagination
  const totalPages = Math.ceil(filteredImages.length / ITEMS_PER_PAGE);
  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredImages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredImages, currentPage]);

  // Reset page when filters change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm(prev => ({ ...prev, dataUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent | ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setForm(prev => ({ ...prev, dataUrl: event.target?.result as string }));
            if (!dialogOpen) {
              setDialogOpen(true);
            }
          };
          reader.readAsDataURL(file);
        }
        e.preventDefault();
        break;
      }
    }
  }, [dialogOpen]);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setForm(prev => ({ ...prev, dataUrl: event.target?.result as string }));
        if (!dialogOpen) {
          setDialogOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [dialogOpen]);

  // Add tag
  const handleAddTag = () => {
    if (form.newTag.trim() && !form.tags.includes(form.newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: '',
      }));
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Submit form
  const handleSubmit = () => {
    if (!form.dataUrl) {
      toast.error(language === 'ar' ? 'يرجى اختيار صورة' : 'Please select an image');
      return;
    }

    if (editingId) {
      updateGalleryImage(editingId, {
        dataUrl: form.dataUrl,
        caption: form.caption,
        description: form.description,
        code: form.code,
        codeLanguage: form.codeLanguage,
        tags: form.tags,
      });
      toast.success(language === 'ar' ? 'تم تحديث الصورة بنجاح' : 'Image updated successfully');
    } else {
      addGalleryImage({
        dataUrl: form.dataUrl,
        caption: form.caption,
        description: form.description,
        code: form.code,
        codeLanguage: form.codeLanguage,
        tags: form.tags,
      });
      toast.success(language === 'ar' ? 'تم إضافة الصورة بنجاح' : 'Image added successfully');
    }

    resetForm();
  };

  const resetForm = () => {
    setForm({
      dataUrl: '',
      caption: '',
      description: '',
      code: '',
      codeLanguage: '',
      tags: [],
      newTag: '',
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (image: typeof galleryImages[0]) => {
    setEditingId(image.id);
    setForm({
      dataUrl: image.dataUrl,
      caption: image.caption || '',
      description: image.description || '',
      code: image.code || '',
      codeLanguage: image.codeLanguage || '',
      tags: image.tags,
      newTag: '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteGalleryImage(id);
    toast.success(language === 'ar' ? 'تم حذف الصورة' : 'Image deleted');
  };

  const handleView = (image: typeof galleryImages[0]) => {
    setSelectedImage(image);
    setViewDialogOpen(true);
  };

  return (
    <div 
      className="space-y-6"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Image className="w-8 h-8 text-primary" />
            {language === 'ar' ? 'معرض الصور' : 'Image Gallery'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {galleryImages.length} {language === 'ar' ? 'صورة' : 'images'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة صورة' : 'Add Image'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId 
                  ? (language === 'ar' ? 'تعديل الصورة' : 'Edit Image')
                  : (language === 'ar' ? 'إضافة صورة جديدة' : 'Add New Image')
                }
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image Upload Area */}
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.dataUrl ? (
                  <div className="relative">
                    <img 
                      src={form.dataUrl} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm(prev => ({ ...prev, dataUrl: '' }));
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {language === 'ar' 
                        ? 'اضغط للرفع أو الصق (Ctrl+V) أو اسحب وأفلت'
                        : 'Click to upload, paste (Ctrl+V), or drag and drop'
                      }
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'العنوان' : 'Caption'}</Label>
                <Input
                  value={form.caption}
                  onChange={(e) => setForm(prev => ({ ...prev, caption: e.target.value }))}
                  placeholder={language === 'ar' ? 'عنوان الصورة...' : 'Image caption...'}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={language === 'ar' ? 'وصف تفصيلي...' : 'Detailed description...'}
                  rows={3}
                />
              </div>

              {/* Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'الكود' : 'Code'}</Label>
                  <Select
                    value={form.codeLanguage}
                    onValueChange={(value) => setForm(prev => ({ ...prev, codeLanguage: value }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={language === 'ar' ? 'اللغة' : 'Language'} />
                    </SelectTrigger>
                    <SelectContent>
                      {programmingLanguages.map(lang => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder={language === 'ar' ? 'أضف كود هنا...' : 'Add code here...'}
                  rows={5}
                  className="font-mono text-sm"
                  dir="ltr"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الوسوم' : 'Tags'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.newTag}
                    onChange={(e) => setForm(prev => ({ ...prev, newTag: e.target.value }))}
                    placeholder={language === 'ar' ? 'أضف وسم...' : 'Add tag...'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={handleAddTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
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

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={language === 'ar' ? 'بحث في الصور...' : 'Search images...'}
            className="ps-9"
          />
        </div>
        
        <Select
          value={selectedTag || 'all'}
          onValueChange={(value) => handleTagFilter(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <Tag className="w-4 h-4 me-2" />
            <SelectValue placeholder={language === 'ar' ? 'كل الوسوم' : 'All Tags'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{language === 'ar' ? 'كل الوسوم' : 'All Tags'}</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Paste instruction */}
      <div className="bg-muted/50 rounded-lg p-4 text-center text-sm text-muted-foreground">
        <Clipboard className="w-5 h-5 inline-block me-2" />
        {language === 'ar' 
          ? 'يمكنك لصق الصور مباشرة (Ctrl+V) أو سحبها وإفلاتها في أي مكان'
          : 'You can paste images directly (Ctrl+V) or drag and drop anywhere'
        }
      </div>

      {/* Images Grid */}
      {paginatedImages.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedImages.map((image) => (
              <Card 
                key={image.id} 
                className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleView(image)}
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img
                    src={image.dataUrl}
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(image);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  {image.caption && (
                    <p className="font-medium line-clamp-1">{image.caption}</p>
                  )}
                  {image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {image.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{image.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  {image.code && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="gap-1">
                        <Code className="w-3 h-3" />
                        {language === 'ar' ? 'يحتوي كود' : 'Has code'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredImages.length}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {language === 'ar' ? 'لا توجد صور' : 'No images'}
          </h3>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'ابدأ بإضافة صور أو لصقها مباشرة'
              : 'Start by adding images or paste them directly'
            }
          </p>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.dataUrl}
                alt={selectedImage.caption || 'Gallery image'}
                className="w-full rounded-lg"
              />
              
              {selectedImage.caption && (
                <h2 className="text-xl font-bold">{selectedImage.caption}</h2>
              )}
              
              {selectedImage.description && (
                <p className="text-muted-foreground">{selectedImage.description}</p>
              )}
              
              {selectedImage.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedImage.tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
              
              {selectedImage.code && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    {language === 'ar' ? 'الكود' : 'Code'}
                  </Label>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <code 
                      className={`language-${programmingLanguages.find(l => l.id === selectedImage.codeLanguage)?.slug || 'plaintext'}`}
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          const langSlug = programmingLanguages.find(l => l.id === selectedImage.codeLanguage)?.slug || 'plaintext';
                          // Map non-standard language names to highlight.js supported ones
                          const langMap: Record<string, string> = {
                            'react': 'javascript',
                            'nodejs': 'javascript',
                            'node': 'javascript',
                            'vue': 'javascript',
                            'vuejs': 'javascript',
                            'laravel': 'php',
                          };
                          const hlLang = langMap[langSlug] || langSlug;
                          try {
                            return hljs.highlight(selectedImage.code, { language: hlLang }).value;
                          } catch {
                            return selectedImage.code;
                          }
                        })()
                      }}
                    />
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
