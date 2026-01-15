import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Map, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  FileText,
  GripVertical,
  Pencil,
  Check,
  X,
  FileJson,
  Sparkles,
  Loader2,
  BookOpen,
  Zap,
  FolderTree,
  Download
} from 'lucide-react';
import { NumberBadge, getColorByIndex } from '@/components/roadmap/NumberBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useBlogStore } from '@/store/blogStore';
import BulkImportDialog from '@/components/roadmap/BulkImportDialog';
import StudyModeDialog from '@/components/roadmap/StudyModeDialog';
import DefaultRoadmapsButton from '@/components/roadmap/DefaultRoadmapsButton';
import EnhanceRoadmapDialog from '@/components/roadmap/EnhanceRoadmapDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RoadmapSection, RoadmapTopic } from '@/types/blog';
import { toast } from 'sonner';

// Inline Edit Component
const InlineEdit = ({ 
  value, 
  onSave, 
  className = '' 
}: { 
  value: string; 
  onSave: (newValue: string) => void;
  className?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim()) {
      onSave(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleSave}>
          <Check className="h-3 w-3 text-green-500" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleCancel}>
          <X className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center gap-1 ${className}`}>
      <span>{value}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <Pencil className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Sortable Section Component
const SortableSection = ({ 
  section, 
  sectionProgress, 
  isSectionExpanded, 
  toggleSectionExpand, 
  deleteSection, 
  setSelectedSectionId, 
  setIsAddTopicOpen,
  posts,
  getPostById,
  navigate,
  toggleTopicComplete,
  assignPostToTopic,
  deleteTopic,
  reorderTopics,
  updateSection,
  updateTopic,
  addSubTopic,
  sectionIndex,
}: {
  section: RoadmapSection;
  sectionProgress: { completed: number; total: number; percentage: number };
  isSectionExpanded: boolean;
  toggleSectionExpand: (id: string) => void;
  deleteSection: (id: string) => void;
  setSelectedSectionId: (id: string) => void;
  setIsAddTopicOpen: (open: boolean) => void;
  posts: any[];
  getPostById: (id: string) => any;
  navigate: (path: string) => void;
  toggleTopicComplete: (sectionId: string, topicId: string) => void;
  assignPostToTopic: (sectionId: string, topicId: string, postId: string | undefined) => void;
  deleteTopic: (sectionId: string, topicId: string) => void;
  reorderTopics: (sectionId: string, topicIds: string[]) => void;
  updateSection: (id: string, updates: Partial<RoadmapSection>) => void;
  updateTopic: (sectionId: string, topicId: string, updates: Partial<RoadmapTopic>) => void;
  addSubTopic: (sectionId: string, parentTopicId: string, topic: Omit<RoadmapTopic, 'id' | 'sortOrder'>) => void;
  sectionIndex: number;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTopicDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = section.topics.findIndex(t => t.id === active.id);
      const newIndex = section.topics.findIndex(t => t.id === over.id);
      const newOrder = arrayMove(section.topics.map(t => t.id), oldIndex, newIndex);
      reorderTopics(section.id, newOrder);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg overflow-hidden">
      <Collapsible open={isSectionExpanded} onOpenChange={() => toggleSectionExpand(section.id)}>
        <div className="flex items-center justify-between p-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <button {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <NumberBadge
              number={sectionIndex + 1}
              shape="square"
              colorClass={getColorByIndex('section', sectionIndex)}
              size="md"
            />
            <div className="flex items-center gap-2">
              <CollapsibleTrigger className="flex items-center gap-1 hover:opacity-80">
                {isSectionExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <InlineEdit
                value={section.title}
                onSave={(newTitle) => updateSection(section.id, { title: newTitle })}
                className="font-medium"
              />
              <Badge variant="outline" className="text-xs">
                {sectionProgress.completed}/{sectionProgress.total}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={sectionProgress.percentage} className="w-24 h-1.5" />
            <span className="text-xs text-muted-foreground">
              {sectionProgress.percentage}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSection(section.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="p-3 space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTopicDragEnd}
            >
              <SortableContext
                items={section.topics.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {section.topics.sort((a, b) => a.sortOrder - b.sortOrder).map((topic, topicIdx) => (
                  <SortableTopic
                    key={topic.id}
                    topic={topic}
                    sectionId={section.id}
                    posts={posts}
                    getPostById={getPostById}
                    navigate={navigate}
                    toggleTopicComplete={toggleTopicComplete}
                    updateTopic={updateTopic}
                    assignPostToTopic={assignPostToTopic}
                    deleteTopic={deleteTopic}
                    topicIndex={topicIdx}
                    addSubTopic={(parentTopicId) => {
                      const newSubTopic = {
                        title: 'موضوع فرعي جديد',
                        completed: false,
                      };
                      addSubTopic(section.id, parentTopicId, newSubTopic);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
            
            {/* Add topic button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full border-dashed border"
              onClick={() => {
                setSelectedSectionId(section.id);
                setIsAddTopicOpen(true);
              }}
            >
              <Plus className="h-3 w-3 ml-1" />
              إضافة موضوع
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Sortable Topic Component
const SortableTopic = ({
  topic,
  sectionId,
  posts,
  getPostById,
  navigate,
  toggleTopicComplete,
  updateTopic,
  assignPostToTopic,
  deleteTopic,
  depth = 0,
  addSubTopic,
  topicIndex = 0,
}: {
  topic: RoadmapTopic;
  sectionId: string;
  posts: any[];
  getPostById: (id: string) => any;
  navigate: (path: string) => void;
  toggleTopicComplete: (sectionId: string, topicId: string) => void;
  updateTopic: (sectionId: string, topicId: string, updates: Partial<RoadmapTopic>) => void;
  assignPostToTopic: (sectionId: string, topicId: string, postId: string | undefined) => void;
  deleteTopic: (sectionId: string, topicId: string) => void;
  depth?: number;
  addSubTopic?: (parentTopicId: string) => void;
  topicIndex?: number;
}) => {
  const [isSubTopicsExpanded, setIsSubTopicsExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const post = topic.postId ? getPostById(topic.postId) : null;
  const hasSubTopics = topic.subTopics && topic.subTopics.length > 0;
  const paddingLeft = depth * 24;

  // Determine badge shape and color based on depth
  const getBadgeConfig = () => {
    if (depth === 0) return { shape: 'circle' as const, level: 'topic' as const };
    if (depth === 1) return { shape: 'hexagon' as const, level: 'subTopic' as const };
    return { shape: 'diamond' as const, level: 'subTopic' as const };
  };
  
  const { shape, level } = getBadgeConfig();

  return (
    <div style={{ paddingLeft: `${paddingLeft}px` }} className="relative">
      {/* Tree connector lines */}
      {depth > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 border-r-2 border-dashed opacity-30"
          style={{ 
            right: `${paddingLeft - 12}px`,
            borderColor: depth === 1 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
          }}
        />
      )}
      
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 p-2 rounded-md border transition-all ${
          topic.completed 
            ? 'bg-green-500/10 border-green-500/30' 
            : depth === 0 
              ? 'bg-card hover:bg-muted/50' 
              : 'bg-muted/20 hover:bg-muted/40'
        } mb-2`}
      >
        {hasSubTopics && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsSubTopicsExpanded(!isSubTopicsExpanded)}
          >
            {isSubTopicsExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        {!hasSubTopics && <div className="w-6" />}
        
        {/* Number Badge */}
        <NumberBadge
          number={topicIndex + 1}
          shape={shape}
          colorClass={getColorByIndex(level, topicIndex)}
          size={depth === 0 ? 'md' : 'sm'}
        />
        
        <button {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <Checkbox
          checked={topic.completed}
          onCheckedChange={() => toggleTopicComplete(sectionId, topic.id)}
        />
        <InlineEdit
          value={topic.title}
          onSave={(newTitle) => updateTopic(sectionId, topic.id, { title: newTitle })}
          className={topic.completed ? 'line-through text-muted-foreground' : ''}
        />
        
        {/* Sub-topics count badge */}
        {hasSubTopics && (
          <Badge variant="outline" className="text-[10px] h-5">
            <FolderTree className="h-3 w-3 ml-1" />
            {topic.subTopics!.length}
          </Badge>
        )}
        
        {post && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            <FileText className="h-3 w-3 ml-1" />
            {post.title.substring(0, 20)}...
          </Button>
        )}
        {!post && (
          <Select
            value={topic.postId || 'none'}
            onValueChange={(v) => assignPostToTopic(sectionId, topic.id, v === 'none' ? undefined : v)}
          >
            <SelectTrigger className="h-6 w-32 text-xs">
              <SelectValue placeholder="ربط موضوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون ربط</SelectItem>
              {posts.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title.substring(0, 30)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {depth < 3 && addSubTopic && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => addSubTopic(topic.id)}
          >
            <Plus className="h-3 w-3 ml-1" />
            موضوع فرعي
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-auto"
          onClick={() => deleteTopic(sectionId, topic.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      
      {/* Render sub-topics recursively */}
      {hasSubTopics && isSubTopicsExpanded && (
        <div className="space-y-1 relative">
          {topic.subTopics!.sort((a, b) => a.sortOrder - b.sortOrder).map((subTopic, subIdx) => (
            <SortableTopic
              key={subTopic.id}
              topic={subTopic}
              sectionId={sectionId}
              posts={posts}
              getPostById={getPostById}
              navigate={navigate}
              toggleTopicComplete={toggleTopicComplete}
              updateTopic={updateTopic}
              assignPostToTopic={assignPostToTopic}
              deleteTopic={deleteTopic}
              depth={depth + 1}
              addSubTopic={addSubTopic}
              topicIndex={subIdx}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Roadmap() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { programmingLanguages, posts, getPostById } = useBlogStore();
  const { 
    roadmaps, 
    roadmapSections,
    addRoadmap, 
    deleteRoadmap,
    addSection,
    updateSection,
    deleteSection,
    addTopic,
    addSubTopic,
    updateTopic,
    deleteTopic,
    toggleTopicComplete,
    assignPostToTopic,
    getRoadmapProgress,
    getSectionProgress,
    reorderSections,
    reorderTopics,
  } = useRoadmapStore();
  
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('all');
  const [isAddRoadmapOpen, setIsAddRoadmapOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isStudyModeOpen, setIsStudyModeOpen] = useState(false);
  const [isEnhanceDialogOpen, setIsEnhanceDialogOpen] = useState(false);
  const [studyModeRoadmap, setStudyModeRoadmap] = useState<{ id: string; title: string; languageName: string } | null>(null);
  const [enhanceRoadmap, setEnhanceRoadmap] = useState<{ id: string; title: string; languageName: string } | null>(null);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [generatingRoadmapId, setGeneratingRoadmapId] = useState<string | null>(null);
  
  const [roadmapForm, setRoadmapForm] = useState({ languageId: '', titles: '', description: '' });
  const [sectionForm, setSectionForm] = useState({ titles: '', description: '' });
  const [topicForm, setTopicForm] = useState({ titles: '', postId: '' });

  const openStudyMode = (roadmapId: string, title: string, languageName: string) => {
    setStudyModeRoadmap({ id: roadmapId, title, languageName });
    setIsStudyModeOpen(true);
  };

  const openEnhanceDialog = (roadmapId: string, title: string, languageName: string) => {
    setEnhanceRoadmap({ id: roadmapId, title, languageName });
    setIsEnhanceDialogOpen(true);
  };

  const handleEnhanceRoadmap = (newSections: any[]) => {
    if (!enhanceRoadmap) return;
    
    const existingSections = roadmapSections.filter(s => s.roadmapId === enhanceRoadmap.id);
    newSections.forEach((section: any, sIndex: number) => {
      const sectionId = addSection({
        roadmapId: enhanceRoadmap.id,
        title: section.title,
        description: section.description || '',
        sortOrder: existingSections.length + sIndex + 1,
      });
      
      section.topics.forEach((topic: any) => {
        // Add main topic
        addTopic(sectionId, {
          title: `📌 ${topic.title}`,
          completed: false,
          postId: undefined,
        });
        
        // Add subtopics as separate topics with indentation marker
        if (topic.subtopics && Array.isArray(topic.subtopics)) {
          topic.subtopics.forEach((subtopic: string) => {
            addTopic(sectionId, {
              title: `   ↳ ${subtopic}`,
              completed: false,
              postId: undefined,
            });
          });
        }
      });
    });
    
    // Expand the roadmap to show new content
    setExpandedRoadmaps(prev => new Set([...prev, enhanceRoadmap.id]));
  };

  // Generate detailed roadmap with AI
  const generateDetailedRoadmap = async (roadmapId: string, title: string, languageName: string) => {
    setGeneratingRoadmapId(roadmapId);
    try {
      // Call the AI edge function to generate roadmap
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ title, languageName }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          toast.error('تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً');
          return;
        }
        if (response.status === 402) {
          toast.error('الرصيد غير كافٍ');
          return;
        }
        throw new Error(errorData.error || 'Failed to generate roadmap');
      }

      const data = await response.json();
      
      if (!data.sections || !Array.isArray(data.sections)) {
        throw new Error('Invalid response format');
      }

      // Add sections and topics with subtopics
      const existingSections = roadmapSections.filter(s => s.roadmapId === roadmapId);
      data.sections.forEach((section: any, sIndex: number) => {
        const sectionId = addSection({
          roadmapId,
          title: section.title,
          description: section.description || '',
          sortOrder: existingSections.length + sIndex + 1,
        });
        
        section.topics.forEach((topic: any) => {
          // Add main topic
          addTopic(sectionId, {
            title: `📌 ${topic.title}`,
            completed: false,
            postId: undefined,
          });
          
          // Add subtopics as separate topics with indentation marker
          if (topic.subtopics && Array.isArray(topic.subtopics)) {
            topic.subtopics.forEach((subtopic: string) => {
              addTopic(sectionId, {
                title: `   ↳ ${subtopic}`,
                completed: false,
                postId: undefined,
              });
            });
          }
        });
      });
      
      // Expand the roadmap to show new content
      setExpandedRoadmaps(prev => new Set([...prev, roadmapId]));
      toast.success('تم توليد خريطة الطريق التفصيلية بنجاح!');
    } catch (error) {
      console.error('Error generating roadmap:', error);
      toast.error('حدث خطأ أثناء التوليد');
    } finally {
      setGeneratingRoadmapId(null);
    }
  };

  // Bulk import handler
  const handleBulkImport = (data: any) => {
    try {
      if (data.roadmaps) {
        for (const roadmap of data.roadmaps) {
          const roadmapId = addRoadmap({
            languageId: roadmap.languageId,
            title: roadmap.title,
            description: roadmap.description || '',
          });
          
          if (roadmap.sections) {
            for (let i = 0; i < roadmap.sections.length; i++) {
              const section = roadmap.sections[i];
              const sectionId = addSection({
                roadmapId,
                title: section.title,
                description: section.description || '',
                sortOrder: i + 1,
              });
              
              if (section.topics) {
                for (const topic of section.topics) {
                  addTopic(sectionId, {
                    title: topic.title,
                    completed: topic.completed || false,
                    postId: undefined,
                  });
                }
              }
            }
          }
          
          // Expand the newly created roadmap
          setExpandedRoadmaps(prev => new Set([...prev, roadmapId]));
        }
      }
      
      if (data.sections && selectedRoadmapId) {
        for (let i = 0; i < data.sections.length; i++) {
          const section = data.sections[i];
          const existingSections = roadmapSections.filter(s => s.roadmapId === selectedRoadmapId);
          const sectionId = addSection({
            roadmapId: selectedRoadmapId,
            title: section.title,
            description: section.description || '',
            sortOrder: existingSections.length + i + 1,
          });
          
          if (section.topics) {
            for (const topic of section.topics) {
              addTopic(sectionId, {
                title: topic.title,
                completed: topic.completed || false,
                postId: undefined,
              });
            }
          }
        }
      }
      
      if (data.topics && selectedSectionId) {
        for (const topic of data.topics) {
          addTopic(selectedSectionId, {
            title: topic.title,
            completed: topic.completed || false,
            postId: undefined,
          });
        }
      }
      
      toast.success('تم الاستيراد بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء الاستيراد');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const filteredRoadmaps = useMemo(() => {
    if (selectedLanguageId === 'all') return roadmaps;
    return roadmaps.filter((r) => r.languageId === selectedLanguageId);
  }, [roadmaps, selectedLanguageId]);
  
  const toggleRoadmapExpand = (id: string) => {
    setExpandedRoadmaps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const toggleSectionExpand = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const handleAddRoadmap = () => {
    if (!roadmapForm.languageId || !roadmapForm.titles.trim()) return;
    const titles = roadmapForm.titles.split(/[,،\n]/).map(t => t.trim()).filter(Boolean);
    titles.forEach(title => {
      addRoadmap({
        languageId: roadmapForm.languageId,
        title,
        description: roadmapForm.description,
      });
    });
    toast.success(`تمت إضافة ${titles.length} خريطة طريق`);
    setRoadmapForm({ languageId: '', titles: '', description: '' });
    setIsAddRoadmapOpen(false);
  };
  
  const handleAddSection = () => {
    if (!selectedRoadmapId || !sectionForm.titles.trim()) return;
    const titles = sectionForm.titles.split(/[,،\n]/).map(t => t.trim()).filter(Boolean);
    const existingSections = roadmapSections.filter((s) => s.roadmapId === selectedRoadmapId);
    titles.forEach((title, i) => {
      addSection({
        roadmapId: selectedRoadmapId,
        title,
        description: sectionForm.description,
        sortOrder: existingSections.length + i + 1,
      });
    });
    toast.success(`تمت إضافة ${titles.length} قسم`);
    setSectionForm({ titles: '', description: '' });
    setIsAddSectionOpen(false);
  };
  
  const handleAddTopic = () => {
    if (!selectedSectionId || !topicForm.titles.trim()) return;
    const titles = topicForm.titles.split(/[,،\n]/).map(t => t.trim()).filter(Boolean);
    titles.forEach(title => {
      addTopic(selectedSectionId, {
        title,
        postId: topicForm.postId || undefined,
        completed: false,
      });
    });
    toast.success(`تمت إضافة ${titles.length} موضوع`);
    setTopicForm({ titles: '', postId: '' });
    setIsAddTopicOpen(false);
  };
  
  const getLanguageName = (id: string) => {
    return programmingLanguages.find((l) => l.id === id)?.name || 'غير محدد';
  };
  
  const getLanguageColor = (id: string) => {
    return programmingLanguages.find((l) => l.id === id)?.color || '#6b7280';
  };

  const handleSectionDragEnd = (roadmapId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const sections = roadmapSections.filter(s => s.roadmapId === roadmapId);
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      const newOrder = arrayMove(sections.map(s => s.id), oldIndex, newIndex);
      reorderSections(roadmapId, newOrder);
    }
  };

  // Export roadmap as JSON
  const exportRoadmap = (roadmap: typeof roadmaps[0]) => {
    const sections = roadmapSections
      .filter(s => s.roadmapId === roadmap.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(section => ({
        title: section.title,
        description: section.description,
        topics: section.topics.sort((a, b) => a.sortOrder - b.sortOrder).map(topic => ({
          title: topic.title,
          completed: topic.completed,
          subTopics: topic.subTopics?.sort((a, b) => a.sortOrder - b.sortOrder).map(sub => ({
            title: sub.title,
            completed: sub.completed,
            subTopics: sub.subTopics?.map(subSub => ({
              title: subSub.title,
              completed: subSub.completed
            }))
          }))
        }))
      }));

    const exportData = {
      title: roadmap.title,
      description: roadmap.description,
      language: getLanguageName(roadmap.languageId),
      progress: getRoadmapProgress(roadmap.id),
      exportedAt: new Date().toISOString(),
      sections
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-${roadmap.title.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير خريطة "${roadmap.title}" بنجاح`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Map className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">خريطة الطريق</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DefaultRoadmapsButton />
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <FileJson className="h-4 w-4 ml-2" />
            استيراد JSON
          </Button>
          <Dialog open={isAddRoadmapOpen} onOpenChange={setIsAddRoadmapOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة خريطة
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة خريطة طريق جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>لغة البرمجة</Label>
                <Select
                  value={roadmapForm.languageId}
                  onValueChange={(v) => setRoadmapForm((f) => ({ ...f, languageId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اللغة" />
                  </SelectTrigger>
                  <SelectContent>
                    {programmingLanguages.map((lang) => (
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
              <div className="space-y-2">
                <Label>عناوين الخرائط (افصل بفاصلة أو سطر جديد للإضافة المتعددة)</Label>
                <Textarea
                  placeholder="مثال: أساسيات React، React Hooks، React Router"
                  value={roadmapForm.titles}
                  onChange={(e) => setRoadmapForm((f) => ({ ...f, titles: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (اختياري)</Label>
                <Textarea
                  placeholder="وصف مختصر للخريطة"
                  value={roadmapForm.description}
                  onChange={(e) => setRoadmapForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoadmapOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddRoadmap}>إضافة</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
      
      {/* Filter by language */}
      <div className="flex items-center gap-4">
        <Label>تصفية حسب اللغة:</Label>
        <Select value={selectedLanguageId} onValueChange={setSelectedLanguageId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="جميع اللغات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع اللغات</SelectItem>
            {programmingLanguages.map((lang) => (
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
      
      {/* Roadmaps list */}
      <div className="space-y-4">
        {filteredRoadmaps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              لا توجد خرائط طريق بعد. أنشئ خريطة جديدة للبدء!
            </CardContent>
          </Card>
        ) : (
          filteredRoadmaps.map((roadmap, roadmapIdx) => {
            const progress = getRoadmapProgress(roadmap.id);
            const sections = roadmapSections.filter((s) => s.roadmapId === roadmap.id);
            const isExpanded = expandedRoadmaps.has(roadmap.id);
            
            return (
              <Card key={roadmap.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleRoadmapExpand(roadmap.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CollapsibleTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        {/* Roadmap Number Badge */}
                        <NumberBadge
                          number={roadmapIdx + 1}
                          shape="hexagon"
                          colorClass={getColorByIndex('roadmap', roadmapIdx)}
                          size="lg"
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getLanguageColor(roadmap.languageId) }}
                        />
                        <CardTitle className="text-xl">{roadmap.title}</CardTitle>
                        <Badge variant="secondary">{getLanguageName(roadmap.languageId)}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {sections.length} قسم
                        </Badge>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{progress.completed}/{progress.total}</span>
                          <span className="font-medium">{progress.percentage}%</span>
                        </div>
                        <Progress value={progress.percentage} className="w-32 h-2" />
                        {sections.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEnhanceDialog(roadmap.id, roadmap.title, getLanguageName(roadmap.languageId));
                            }}
                            title="تحسين الخريطة بالذكاء الاصطناعي"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateDetailedRoadmap(roadmap.id, roadmap.title, getLanguageName(roadmap.languageId));
                          }}
                          disabled={generatingRoadmapId === roadmap.id}
                          title="توليد محتوى تفصيلي"
                        >
                          {generatingRoadmapId === roadmap.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openStudyMode(roadmap.id, roadmap.title, getLanguageName(roadmap.languageId));
                          }}
                          title="وضع الدراسة"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportRoadmap(roadmap);
                          }}
                          title="تصدير الخريطة"
                          className="text-green-600 hover:text-green-700 border-green-500/50 hover:border-green-600"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRoadmap(roadmap.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {roadmap.description && (
                      <p className="text-muted-foreground text-sm mt-2 mr-8">
                        {roadmap.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      {/* Add section button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRoadmapId(roadmap.id);
                          setIsAddSectionOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة قسم
                      </Button>
                      
                      {/* Sections with drag and drop */}
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSectionDragEnd(roadmap.id)}
                      >
                        <SortableContext
                          items={sections.map(s => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3 mr-4">
                            {sections.sort((a, b) => a.sortOrder - b.sortOrder).map((section, sectionIdx) => (
                              <SortableSection
                                key={section.id}
                                section={section}
                                sectionProgress={getSectionProgress(section.id)}
                                isSectionExpanded={expandedSections.has(section.id)}
                                toggleSectionExpand={toggleSectionExpand}
                                deleteSection={deleteSection}
                                setSelectedSectionId={setSelectedSectionId}
                                setIsAddTopicOpen={setIsAddTopicOpen}
                                posts={posts}
                                getPostById={getPostById}
                                navigate={navigate}
                                toggleTopicComplete={toggleTopicComplete}
                                assignPostToTopic={assignPostToTopic}
                                deleteTopic={deleteTopic}
                                reorderTopics={reorderTopics}
                                updateSection={updateSection}
                                updateTopic={updateTopic}
                                addSubTopic={addSubTopic}
                                sectionIndex={sectionIdx}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Add Section Dialog */}
      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة قسم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>عناوين الأقسام (افصل بفاصلة أو سطر جديد للإضافة المتعددة)</Label>
              <Textarea
                placeholder="مثال: المتغيرات، الدوال، الكائنات"
                value={sectionForm.titles}
                onChange={(e) => setSectionForm((f) => ({ ...f, titles: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف (اختياري)</Label>
              <Textarea
                placeholder="وصف مختصر للقسم"
                value={sectionForm.description}
                onChange={(e) => setSectionForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSectionOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddSection}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Topic Dialog */}
      <Dialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة موضوع جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>عناوين المواضيع (افصل بفاصلة أو سطر جديد للإضافة المتعددة)</Label>
              <Textarea
                placeholder="مثال: مقدمة، التثبيت، الاستخدام الأساسي"
                value={topicForm.titles}
                onChange={(e) => setTopicForm((f) => ({ ...f, titles: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>ربط بموضوع (اختياري)</Label>
              <Select
                value={topicForm.postId || 'none'}
                onValueChange={(v) => setTopicForm((f) => ({ ...f, postId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر موضوع للربط" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون ربط</SelectItem>
                  {posts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTopicOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddTopic}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
        programmingLanguages={programmingLanguages}
      />

      {/* Study Mode Dialog */}
      {studyModeRoadmap && (
        <StudyModeDialog
          isOpen={isStudyModeOpen}
          onClose={() => {
            setIsStudyModeOpen(false);
            setStudyModeRoadmap(null);
          }}
          sections={roadmapSections.filter(s => s.roadmapId === studyModeRoadmap.id)}
          roadmapTitle={studyModeRoadmap.title}
          languageName={studyModeRoadmap.languageName}
          roadmapProgress={getRoadmapProgress(studyModeRoadmap.id)}
        />
      )}

      {/* Enhance Roadmap Dialog */}
      {enhanceRoadmap && (
        <EnhanceRoadmapDialog
          isOpen={isEnhanceDialogOpen}
          onClose={() => {
            setIsEnhanceDialogOpen(false);
            setEnhanceRoadmap(null);
          }}
          roadmapId={enhanceRoadmap.id}
          roadmapTitle={enhanceRoadmap.title}
          languageName={enhanceRoadmap.languageName}
          sections={roadmapSections.filter(s => s.roadmapId === enhanceRoadmap.id)}
          onEnhance={handleEnhanceRoadmap}
        />
      )}
    </div>
  );
}
