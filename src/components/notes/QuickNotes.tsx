import { useState, useEffect } from 'react';
import { StickyNote, X, Plus, Trash2, Save, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickNote {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'quick-notes-storage';

const QuickNotes = () => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        })));
      } catch (e) {
        console.error('Failed to parse quick notes:', e);
      }
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  }, [selectedNoteId]);

  const createNote = () => {
    const newNote: QuickNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: language === 'ar' ? 'ملاحظة جديدة' : 'New Note',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setEditTitle(newNote.title);
    setEditContent('');
  };

  const saveNote = () => {
    if (!selectedNoteId) return;
    setNotes(prev => prev.map(n => 
      n.id === selectedNoteId 
        ? { ...n, title: editTitle, content: editContent, updatedAt: new Date() }
        : n
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
      setEditTitle('');
      setEditContent('');
    }
  };

  // Keyboard shortcut Alt+N to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-50 rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
        title={language === 'ar' ? 'ملاحظات سريعة (Alt+N)' : 'Quick Notes (Alt+N)'}
      >
        <StickyNote className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-50 bg-background border rounded-lg shadow-2xl transition-all duration-200",
        isMinimized 
          ? "bottom-20 left-4 w-64 h-12" 
          : "bottom-20 left-4 w-80 md:w-96 h-[450px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">
            {language === 'ar' ? 'ملاحظات سريعة' : 'Quick Notes'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(prev => !prev)}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex h-[calc(100%-40px)]">
          {/* Notes List */}
          <div className="w-1/3 border-e flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={createNote}
              className="m-2 gap-1"
            >
              <Plus className="w-3 h-3" />
              {language === 'ar' ? 'جديد' : 'New'}
            </Button>
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-1 pb-2">
                {notes.map(note => (
                  <div
                    key={note.id}
                    className={cn(
                      "p-2 rounded-md cursor-pointer text-sm transition-colors group relative",
                      selectedNoteId === note.id 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => setSelectedNoteId(note.id)}
                  >
                    <p className="font-medium truncate pe-6">{note.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {note.content.substring(0, 30) || '...'}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 end-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                {notes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {language === 'ar' ? 'لا توجد ملاحظات' : 'No notes yet'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Note Editor */}
          <div className="w-2/3 flex flex-col p-2">
            {selectedNoteId ? (
              <>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mb-2 font-medium"
                  placeholder={language === 'ar' ? 'العنوان' : 'Title'}
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 resize-none text-sm"
                  placeholder={language === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}
                />
                <Button
                  size="sm"
                  onClick={saveNote}
                  className="mt-2 gap-1"
                >
                  <Save className="w-3 h-3" />
                  {language === 'ar' ? 'حفظ' : 'Save'}
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                {language === 'ar' ? 'اختر ملاحظة أو أنشئ واحدة جديدة' : 'Select or create a note'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickNotes;
