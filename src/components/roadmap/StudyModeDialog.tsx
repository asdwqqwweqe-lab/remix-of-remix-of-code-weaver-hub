import { useState, useMemo, useRef, useEffect } from 'react';
import { NumberBadge, getColorByIndex } from './NumberBadge';
import { BookOpen, Copy, Check, Sparkles, Loader2, Send, Award, Trophy, Star, Zap, Target, Medal, Save, History, FileQuestion, CheckCircle2, XCircle, Settings, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RoadmapSection } from '@/types/blog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StudyModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sections: RoadmapSection[];
  roadmapTitle: string;
  languageName: string;
  roadmapProgress?: { completed: number; total: number; percentage: number };
}

interface StudyStats {
  totalStudySessions: number;
  topicsStudied: number;
  lastStudyDate: string | null;
  streak: number;
}

interface SavedExplanation {
  id: string;
  roadmap_title: string;
  language_name: string;
  topics: string;
  explanation: string;
  created_at: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ACHIEVEMENTS = [
  { id: 'first_study', name: 'البداية', description: 'أول جلسة دراسة', icon: Star, minSessions: 1, color: 'text-yellow-500' },
  { id: 'five_sessions', name: 'مثابر', description: '5 جلسات دراسة', icon: Zap, minSessions: 5, color: 'text-blue-500' },
  { id: 'ten_sessions', name: 'متفاني', description: '10 جلسات دراسة', icon: Target, minSessions: 10, color: 'text-purple-500' },
  { id: 'twenty_sessions', name: 'خبير', description: '20 جلسة دراسة', icon: Medal, minSessions: 20, color: 'text-orange-500' },
  { id: 'fifty_sessions', name: 'محترف', description: '50 جلسة دراسة', icon: Trophy, minSessions: 50, color: 'text-amber-500' },
  { id: 'ten_topics', name: 'متعلم', description: '10 مواضيع مدروسة', icon: Award, minTopics: 10, color: 'text-green-500' },
  { id: 'thirty_topics', name: 'باحث', description: '30 موضوع مدروس', icon: Award, minTopics: 30, color: 'text-teal-500' },
];

const defaultProgress = { completed: 0, total: 0, percentage: 0 };

const getStorageKey = (roadmapTitle: string) => `study-stats-${roadmapTitle}`;

const loadStudyStats = (roadmapTitle: string): StudyStats => {
  try {
    const saved = localStorage.getItem(getStorageKey(roadmapTitle));
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading study stats:', e);
  }
  return { totalStudySessions: 0, topicsStudied: 0, lastStudyDate: null, streak: 0 };
};

const saveStudyStats = (roadmapTitle: string, stats: StudyStats) => {
  localStorage.setItem(getStorageKey(roadmapTitle), JSON.stringify(stats));
};

const StudyModeDialog = ({ isOpen, onClose, sections, roadmapTitle, languageName, roadmapProgress = defaultProgress }: StudyModeDialogProps) => {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [activeTab, setActiveTab] = useState('select');
  const [studyStats, setStudyStats] = useState<StudyStats>(() => loadStudyStats(roadmapTitle));
  const [savedExplanations, setSavedExplanations] = useState<SavedExplanation[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quiz state
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  // Prompt Templates
  const PROMPT_TEMPLATES = {
    beginner: "أنت معلم برمجة خبير ومتخصص في {{languageName}}. أريد منك شرح المواضيع التالية من خريطة الطريق \"{{roadmapTitle}}\" بطريقة مبسطة جداً مناسبة للمبتدئين.\n\n**المواضيع المطلوب شرحها:**\n{{topics}}\n\n**متطلبات الشرح للمبتدئين:**\n1. ابدأ بشرح المفاهيم الأساسية من الصفر\n2. استخدم لغة بسيطة جداً وتجنب المصطلحات المعقدة\n3. أضف أمثلة كود بسيطة وواضحة مع شرح تفصيلي لكل سطر\n4. اشرح الأخطاء الشائعة وكيفية تجنبها\n5. قدم تمارين سهلة وتدريجية\n6. أضف رسوم توضيحية نصية عند الحاجة\n7. اربط المفاهيم الجديدة بأمثلة من الحياة اليومية\n8. اختم بملخص مبسط وخطوات عملية\n\n**ملاحظة:** الشرح يجب أن يكون باللغة العربية مع الحفاظ على المصطلحات التقنية بالإنجليزية.",
    
    intermediate: "أنت معلم برمجة خبير ومتخصص في {{languageName}}. أريد منك شرح المواضيع التالية من خريطة الطريق \"{{roadmapTitle}}\" بطريقة متوسطة لمن لديه خلفية أساسية.\n\n**المواضيع المطلوب شرحها:**\n{{topics}}\n\n**متطلبات الشرح للمستوى المتوسط:**\n1. ابدأ بمراجعة سريعة للمفاهيم الأساسية\n2. اشرح المفاهيم المتقدمة بتفصيل أكثر\n3. قدم أمثلة كود واقعية ومتنوعة\n4. اشرح أفضل الممارسات والأنماط الشائعة\n5. ناقش حالات الاستخدام المختلفة\n6. قارن بين الطرق المختلفة لحل نفس المشكلة\n7. أضف تمارين متوسطة الصعوبة\n8. ناقش الأداء والتحسينات\n9. أضف نصائح للمشاريع الواقعية\n10. اختم بتوجيهات للتطوير المستمر\n\n**ملاحظة:** الشرح يجب أن يكون باللغة العربية مع الحفاظ على المصطلحات التقنية بالإنجليزية.",
    
    advanced: "أنت معلم برمجة خبير ومتخصص في {{languageName}}. أريد منك شرح المواضيع التالية من خريطة الطريق \"{{roadmapTitle}}\" بمستوى احترافي متقدم.\n\n**المواضيع المطلوب شرحها:**\n{{topics}}\n\n**متطلبات الشرح للمستوى المحترف:**\n1. ركز على التفاصيل التقنية الدقيقة والمتقدمة\n2. اشرح الآليات الداخلية وكيفية عمل الأشياء من الداخل\n3. قدم أمثلة كود معقدة ومتقدمة من مشاريع حقيقية\n4. ناقش الأنماط المعمارية والتصميمية المتقدمة\n5. اشرح تحسين الأداء والتحليل العميق\n6. قارن بين المكتبات والأدوات المختلفة\n7. ناقش المشاكل المعقدة وحلولها\n8. أضف أمثلة من الكود المصدري للمكتبات الشهيرة\n9. ناقش أحدث التقنيات والممارسات في المجال\n10. قدم تحديات وتمارين متقدمة\n\n**ملاحظة:** الشرح يجب أن يكون باللغة العربية مع الحفاظ على المصطلحات التقنية بالإنجليزية.",
  };

  // Custom prompt state
  const defaultPromptTemplate = PROMPT_TEMPLATES.intermediate;

  const getStoredPrompt = () => {
    try {
      // Try to get roadmap-specific prompt template first
      const roadmapSpecific = localStorage.getItem(`study-prompt-template-${roadmapTitle}`);
      if (roadmapSpecific) return roadmapSpecific;
      
      // Fallback to global template
      return localStorage.getItem('study-prompt-template') || defaultPromptTemplate;
    } catch {
      return defaultPromptTemplate;
    }
  };

  const getStoredPromptLevel = (): 'beginner' | 'intermediate' | 'advanced' | 'custom' => {
    try {
      const stored = localStorage.getItem(`study-prompt-level-${roadmapTitle}`);
      if (stored && ['beginner', 'intermediate', 'advanced', 'custom'].includes(stored)) {
        return stored as 'beginner' | 'intermediate' | 'advanced' | 'custom';
      }
      return 'intermediate';
    } catch {
      return 'intermediate';
    }
  };

  const [customPromptTemplate, setCustomPromptTemplate] = useState(getStoredPrompt);
  const [promptLevel, setPromptLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'custom'>(getStoredPromptLevel);

  useEffect(() => {
    setStudyStats(loadStudyStats(roadmapTitle));
  }, [roadmapTitle]);

  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedExplanations();
    }
  }, [activeTab, roadmapTitle]);

  const loadSavedExplanations = async () => {
    setLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from('saved_explanations')
        .select('*')
        .eq('roadmap_title', roadmapTitle)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedExplanations(data || []);
    } catch (error) {
      console.error('Error loading saved explanations:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newSelected = new Set(selectedSections);
    const section = sections.find(s => s.id === sectionId);
    
    if (newSelected.has(sectionId)) {
      newSelected.delete(sectionId);
      if (section) {
        const newTopics = new Set(selectedTopics);
        section.topics.forEach(t => newTopics.delete(t.id));
        setSelectedTopics(newTopics);
      }
    } else {
      newSelected.add(sectionId);
      if (section) {
        const newTopics = new Set(selectedTopics);
        section.topics.forEach(t => newTopics.add(t.id));
        setSelectedTopics(newTopics);
      }
    }
    setSelectedSections(newSelected);
  };

  const toggleTopic = (topicId: string, sectionId: string) => {
    const newTopics = new Set(selectedTopics);
    if (newTopics.has(topicId)) {
      newTopics.delete(topicId);
    } else {
      newTopics.add(topicId);
    }
    setSelectedTopics(newTopics);

    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const allTopicsSelected = section.topics.every(t => newTopics.has(t.id));
      const someTopicsSelected = section.topics.some(t => newTopics.has(t.id));
      
      const newSections = new Set(selectedSections);
      if (allTopicsSelected) {
        newSections.add(sectionId);
      } else if (!someTopicsSelected) {
        newSections.delete(sectionId);
      }
      setSelectedSections(newSections);
    }
  };

  const selectedCount = useMemo(() => selectedTopics.size, [selectedTopics]);

  const generateTopicsText = () => {
    const selectedItems: string[] = [];
    
    const processTopics = (topics: typeof sections[0]['topics'], prefix: string = '') => {
      topics.forEach(topic => {
        if (selectedTopics.has(topic.id)) {
          selectedItems.push(`${prefix}- ${topic.title}`);
          // Add subtopics if they exist
          if (topic.subTopics && topic.subTopics.length > 0) {
            topic.subTopics.forEach(subTopic => {
              selectedItems.push(`${prefix}  - ${subTopic.title}`);
            });
          }
        }
      });
    };
    
    sections.forEach(section => {
      const sectionTopics = section.topics.filter(t => selectedTopics.has(t.id));
      if (sectionTopics.length > 0) {
        selectedItems.push(`\n## ${section.title}`);
        processTopics(section.topics);
      }
    });
    return selectedItems.join('\n');
  };

  const generateStudyPrompt = () => {
    const template = promptLevel === 'custom' ? customPromptTemplate : PROMPT_TEMPLATES[promptLevel];
    return template
      .replace(/\{\{languageName\}\}/g, languageName)
      .replace(/\{\{roadmapTitle\}\}/g, roadmapTitle)
      .replace(/\{\{topics\}\}/g, generateTopicsText());
  };

  const handlePromptLevelChange = (level: 'beginner' | 'intermediate' | 'advanced' | 'custom') => {
    setPromptLevel(level);
    if (level !== 'custom') {
      setCustomPromptTemplate(PROMPT_TEMPLATES[level]);
    }
    // Save the selected level for this specific roadmap
    localStorage.setItem(`study-prompt-level-${roadmapTitle}`, level);
  };

  const handleSavePromptTemplate = () => {
    // Save the custom template for this specific roadmap
    localStorage.setItem(`study-prompt-template-${roadmapTitle}`, customPromptTemplate);
    localStorage.setItem(`study-prompt-level-${roadmapTitle}`, promptLevel);
    toast.success('تم حفظ قالب البرومبت لهذه الخريطة');
  };

  const handleResetPromptTemplate = () => {
    setPromptLevel('intermediate');
    setCustomPromptTemplate(PROMPT_TEMPLATES.intermediate);
    localStorage.removeItem(`study-prompt-template-${roadmapTitle}`);
    localStorage.removeItem(`study-prompt-level-${roadmapTitle}`);
    toast.success('تم إعادة ضبط البرومبت للافتراضي');
  };

  const handleCopy = async () => {
    if (selectedTopics.size === 0) {
      toast.error('اختر موضوعاً واحداً على الأقل');
      return;
    }
    const prompt = generateStudyPrompt();
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('تم نسخ البرومبت بنجاح! الصقه في ChatGPT أو Claude');
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate prompt for a specific section
  const generateSectionPrompt = (section: RoadmapSection) => {
    const sectionTopics = section.topics.map(topic => {
      let topicText = `- ${topic.title}`;
      if (topic.subTopics && topic.subTopics.length > 0) {
        topic.subTopics.forEach(subTopic => {
          topicText += `\n  - ${subTopic.title}`;
        });
      }
      return topicText;
    }).join('\n');

    const template = promptLevel === 'custom' ? customPromptTemplate : PROMPT_TEMPLATES[promptLevel];
    return template
      .replace(/\{\{languageName\}\}/g, languageName)
      .replace(/\{\{roadmapTitle\}\}/g, roadmapTitle)
      .replace(/\{\{topics\}\}/g, `\n## ${section.title}\n${sectionTopics}`);
  };

  // Generate prompt for a specific topic with subtopics
  const generateTopicPrompt = (section: RoadmapSection, topic: RoadmapSection['topics'][0]) => {
    let topicText = `- ${topic.title}`;
    if (topic.subTopics && topic.subTopics.length > 0) {
      topic.subTopics.forEach(subTopic => {
        topicText += `\n  - ${subTopic.title}`;
      });
    }

    const template = promptLevel === 'custom' ? customPromptTemplate : PROMPT_TEMPLATES[promptLevel];
    return template
      .replace(/\{\{languageName\}\}/g, languageName)
      .replace(/\{\{roadmapTitle\}\}/g, roadmapTitle)
      .replace(/\{\{topics\}\}/g, `\n## ${section.title}\n${topicText}`);
  };

  // Copy section prompt
  const handleCopySectionPrompt = async (section: RoadmapSection) => {
    const prompt = generateSectionPrompt(section);
    await navigator.clipboard.writeText(prompt);
    toast.success(`تم نسخ برومبت قسم "${section.title}"`);
  };

  // Copy topic prompt
  const handleCopyTopicPrompt = async (section: RoadmapSection, topic: RoadmapSection['topics'][0]) => {
    const prompt = generateTopicPrompt(section, topic);
    await navigator.clipboard.writeText(prompt);
    toast.success(`تم نسخ برومبت "${topic.title}"`);
  };

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Expand all sections
  const expandAllSections = () => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  // Collapse all sections
  const collapseAllSections = () => {
    setExpandedSections(new Set());
  };

  const handleAIGenerate = async () => {
    if (selectedTopics.size === 0) {
      toast.error('اختر موضوعاً واحداً على الأقل');
      return;
    }

    setIsGenerating(true);
    setExplanation('');
    setActiveTab('result');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          topics: generateTopicsText(),
          roadmapTitle,
          languageName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullExplanation = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullExplanation += content;
              setExplanation(fullExplanation);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Update study stats
      const today = new Date().toDateString();
      const newStats: StudyStats = {
        ...studyStats,
        totalStudySessions: studyStats.totalStudySessions + 1,
        topicsStudied: studyStats.topicsStudied + selectedTopics.size,
        lastStudyDate: today,
        streak: studyStats.lastStudyDate === new Date(Date.now() - 86400000).toDateString() 
          ? studyStats.streak + 1 
          : studyStats.lastStudyDate === today ? studyStats.streak : 1,
      };
      setStudyStats(newStats);
      saveStudyStats(roadmapTitle, newStats);
      
      toast.success('تم توليد الشرح بنجاح!');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في توليد الشرح');
      setActiveTab('select');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveExplanation = async () => {
    if (!explanation) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_explanations')
        .insert({
          roadmap_title: roadmapTitle,
          language_name: languageName,
          topics: generateTopicsText(),
          explanation,
        });
      
      if (error) throw error;
      toast.success('تم حفظ الشرح بنجاح!');
    } catch (error) {
      console.error('Error saving explanation:', error);
      toast.error('فشل حفظ الشرح');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_explanations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSavedExplanations(prev => prev.filter(e => e.id !== id));
      toast.success('تم الحذف');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('فشل الحذف');
    }
  };

  const handleGenerateQuiz = async () => {
    if (selectedTopics.size === 0) {
      toast.error('اختر موضوعاً واحداً على الأقل');
      return;
    }

    setIsGeneratingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
    setAnsweredQuestions(new Set());
    setActiveTab('quiz');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          topics: generateTopicsText(),
          roadmapTitle,
          languageName,
          questionCount: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ');
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      } else {
        throw new Error('لم يتم توليد أسئلة');
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في توليد الاختبار');
      setActiveTab('select');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (answeredQuestions.has(currentQuestionIndex)) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === quizQuestions[currentQuestionIndex].correctIndex;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    
    if (currentQuestionIndex === quizQuestions.length - 1) {
      setShowResult(true);
      // Save quiz result
      supabase.from('quiz_results').insert({
        roadmap_title: roadmapTitle,
        topics: generateTopicsText(),
        score: isCorrect ? quizScore + 1 : quizScore,
        total_questions: quizQuestions.length,
      }).then(({ error }) => {
        if (error) console.error('Error saving quiz result:', error);
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const selectAll = () => {
    const allSections = new Set(sections.map(s => s.id));
    const allTopics = new Set(sections.flatMap(s => s.topics.map(t => t.id)));
    setSelectedSections(allSections);
    setSelectedTopics(allTopics);
  };

  const clearAll = () => {
    setSelectedSections(new Set());
    setSelectedTopics(new Set());
  };

  const earnedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(a => {
      if (a.minSessions && studyStats.totalStudySessions >= a.minSessions) return true;
      if (a.minTopics && studyStats.topicsStudied >= a.minTopics) return true;
      return false;
    });
  }, [studyStats]);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const isCurrentAnswered = answeredQuestions.has(currentQuestionIndex);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            وضع الدراسة الذكي
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="select">اختيار</TabsTrigger>
            <TabsTrigger value="result" disabled={!explanation && !isGenerating}>الشرح</TabsTrigger>
            <TabsTrigger value="quiz" disabled={quizQuestions.length === 0 && !isGeneratingQuiz}>اختبار</TabsTrigger>
            <TabsTrigger value="saved">المحفوظات</TabsTrigger>
            <TabsTrigger value="stats">إحصائيات</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm text-muted-foreground">
                اختر المواضيع التي تريد دراستها
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={expandAllSections}>
                  <ChevronDown className="h-4 w-4 ml-1" />
                  فتح الكل
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAllSections}>
                  <ChevronUp className="h-4 w-4 ml-1" />
                  طي الكل
                </Button>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  تحديد الكل
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  إلغاء الكل
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-4">
                {sections.map((section, sectionIndex) => (
                  <Collapsible 
                    key={section.id} 
                    open={expandedSections.has(section.id)}
                    onOpenChange={() => toggleSectionExpansion(section.id)}
                    className="space-y-2"
                  >
                    {/* Section Header with Square Badge */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Checkbox
                        checked={selectedSections.has(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <NumberBadge
                        number={sectionIndex + 1}
                        shape="square"
                        colorClass={getColorByIndex('section', sectionIndex)}
                        size="md"
                      />
                      <span className="font-bold text-base flex-1">{section.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {section.topics.filter(t => selectedTopics.has(t.id)).length}/{section.topics.length}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySectionPrompt(section);
                        }}
                        title="نسخ برومبت القسم"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    
                    {/* Topics List */}
                    <CollapsibleContent>
                      <div className="mr-6 space-y-2">
                        {section.topics.map((topic, topicIndex) => (
                          <div key={topic.id} className="space-y-2">
                            {/* Topic with Circle Badge */}
                            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-colors border-r-2 border-primary/30 pr-3">
                              <Checkbox
                                checked={selectedTopics.has(topic.id)}
                                onCheckedChange={() => toggleTopic(topic.id, section.id)}
                              />
                              <NumberBadge
                                number={topicIndex + 1}
                                shape="circle"
                                colorClass={getColorByIndex('topic', topicIndex)}
                                size="sm"
                              />
                              <span className="text-sm font-medium flex-1">{topic.title}</span>
                              {topic.completed && (
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-600">
                                  ✓ مكتمل
                                </Badge>
                              )}
                              {topic.subTopics && topic.subTopics.length > 0 && (
                                <Badge variant="outline" className="text-xs bg-primary/10">
                                  {topic.subTopics.length} فرعي
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyTopicPrompt(section, topic);
                                }}
                                title="نسخ برومبت الموضوع"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            {/* SubTopics with Hexagon Badge */}
                            {topic.subTopics && topic.subTopics.length > 0 && (
                              <div className="mr-10 space-y-1 border-r-2 border-dashed border-muted-foreground/30 pr-3">
                                {topic.subTopics.map((subTopic, subIndex) => (
                                  <div 
                                    key={subTopic.id} 
                                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/20 transition-colors"
                                  >
                                    <NumberBadge
                                      number={subIndex + 1}
                                      shape="hexagon"
                                      colorClass={getColorByIndex('subTopic', subIndex)}
                                      size="sm"
                                    />
                                    <span className="text-xs text-muted-foreground">{subTopic.title}</span>
                                    {subTopic.completed && (
                                      <Badge variant="secondary" className="text-[10px] bg-green-500/20 text-green-600">✓</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm">{selectedCount} موضوع محدد</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-4">
            <ScrollArea className="h-[350px] border rounded-lg p-4">
              {isGenerating && !explanation && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">جاري توليد الشرح...</p>
                  </div>
                </div>
              )}
              {explanation && (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {explanation}
                </div>
              )}
            </ScrollArea>
            
            {explanation && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(explanation);
                    toast.success('تم نسخ الشرح');
                  }}
                >
                  <Copy className="h-4 w-4 ml-2" />
                  نسخ
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSaveExplanation}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  حفظ
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quiz" className="space-y-4">
            {isGeneratingQuiz && (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">جاري توليد الاختبار...</p>
                </div>
              </div>
            )}

            {showResult && (
              <div className="text-center space-y-4 py-8">
                <div className={`text-6xl mb-4 ${quizScore >= quizQuestions.length / 2 ? 'text-green-500' : 'text-orange-500'}`}>
                  {quizScore >= quizQuestions.length / 2 ? '🎉' : '💪'}
                </div>
                <h3 className="text-2xl font-bold">
                  نتيجتك: {quizScore} من {quizQuestions.length}
                </h3>
                <Progress value={(quizScore / quizQuestions.length) * 100} className="h-4" />
                <p className="text-muted-foreground">
                  {quizScore === quizQuestions.length ? 'ممتاز! إجابات صحيحة كاملة!' :
                   quizScore >= quizQuestions.length / 2 ? 'أحسنت! استمر في التعلم' :
                   'حاول مرة أخرى، المراجعة تساعد!'}
                </p>
                <Button onClick={() => {
                  setShowResult(false);
                  setQuizQuestions([]);
                  setActiveTab('select');
                }}>
                  اختبار جديد
                </Button>
              </div>
            )}

            {currentQuestion && !showResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    سؤال {currentQuestionIndex + 1} من {quizQuestions.length}
                  </Badge>
                  <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="w-32 h-2" />
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-lg mb-4">{currentQuestion.question}</h4>
                  
                  <RadioGroup value={selectedAnswer?.toString()} onValueChange={(v) => handleAnswerSelect(parseInt(v))}>
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, idx) => {
                        const isCorrect = idx === currentQuestion.correctIndex;
                        const isSelected = selectedAnswer === idx;
                        let className = "flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors";
                        
                        if (isCurrentAnswered) {
                          if (isCorrect) {
                            className += " border-green-500 bg-green-500/10";
                          } else if (isSelected && !isCorrect) {
                            className += " border-red-500 bg-red-500/10";
                          }
                        } else if (isSelected) {
                          className += " border-primary bg-primary/10";
                        }

                        return (
                          <div key={idx} className={className} onClick={() => handleAnswerSelect(idx)}>
                            <RadioGroupItem value={idx.toString()} id={`option-${idx}`} disabled={isCurrentAnswered} />
                            <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                              {option}
                            </Label>
                            {isCurrentAnswered && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            {isCurrentAnswered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>

                  {isCurrentAnswered && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm"><strong>التوضيح:</strong> {currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  {!isCurrentAnswered ? (
                    <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
                      تأكيد الإجابة
                    </Button>
                  ) : currentQuestionIndex < quizQuestions.length - 1 ? (
                    <Button onClick={handleNextQuestion}>
                      السؤال التالي
                    </Button>
                  ) : (
                    <Button onClick={() => setShowResult(true)}>
                      عرض النتيجة
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {loadingSaved ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : savedExplanations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-50" />
                <p>لا توجد شروحات محفوظة</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {savedExplanations.map(saved => (
                    <div key={saved.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{new Date(saved.created_at).toLocaleDateString('ar')}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSaved(saved.id)}>
                          حذف
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{saved.topics}</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setExplanation(saved.explanation);
                          setActiveTab('result');
                        }}
                      >
                        عرض الشرح
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">{studyStats.totalStudySessions}</div>
                <div className="text-sm text-muted-foreground">جلسات الدراسة</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">{studyStats.topicsStudied}</div>
                <div className="text-sm text-muted-foreground">مواضيع مدروسة</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-500">{studyStats.streak}</div>
                <div className="text-sm text-muted-foreground">أيام متتالية</div>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl font-bold text-green-500">{roadmapProgress.percentage}%</div>
                <div className="text-sm text-muted-foreground">تقدم خريطة الطريق</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                الشارات ({earnedAchievements.length}/{ACHIEVEMENTS.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ACHIEVEMENTS.map(achievement => {
                  const Icon = achievement.icon;
                  const earned = earnedAchievements.some(a => a.id === achievement.id);
                  return (
                    <div 
                      key={achievement.id}
                      className={`p-3 border rounded-lg flex items-center gap-3 ${
                        earned ? 'bg-muted/50' : 'opacity-50'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${earned ? achievement.color : 'text-muted-foreground'}`} />
                      <div>
                        <div className="font-medium text-sm">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">تقدم خريطة الطريق</h4>
              <Progress value={roadmapProgress.percentage} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {roadmapProgress.completed} من {roadmapProgress.total} موضوع مكتمل
              </p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              {/* Prompt Level Selection */}
              <div className="space-y-3">
                <h4 className="font-semibold">اختر مستوى الشرح</h4>
                <RadioGroup value={promptLevel} onValueChange={handlePromptLevelChange}>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400">
                          مبتدئ
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          شرح مبسط جداً مع أمثلة سهلة
                        </span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
                          متوسط
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          شرح متوازن مع أمثلة واقعية
                        </span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400">
                          محترف
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          شرح تفصيلي متقدم مع تفاصيل تقنية
                        </span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
                          مخصص
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          تخصيص البرومبت بنفسك
                        </span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="font-semibold">تخصيص قالب البرومبت</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetPromptTemplate}>
                    <RotateCcw className="h-4 w-4 ml-1" />
                    إعادة ضبط
                  </Button>
                  <Button size="sm" onClick={handleSavePromptTemplate}>
                    <Save className="h-4 w-4 ml-1" />
                    حفظ
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  استخدم المتغيرات التالية في القالب:
                </Label>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">{'{{languageName}}'}</Badge>
                  <Badge variant="secondary">{'{{roadmapTitle}}'}</Badge>
                  <Badge variant="secondary">{'{{topics}}'}</Badge>
                </div>
              </div>

              <Textarea
                value={customPromptTemplate}
                onChange={(e) => {
                  setCustomPromptTemplate(e.target.value);
                  if (promptLevel !== 'custom') {
                    setPromptLevel('custom');
                  }
                }}
                placeholder="قالب البرومبت..."
                className="min-h-[300px] font-mono text-sm"
                dir="auto"
                disabled={promptLevel !== 'custom'}
              />

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 نصيحة: القالب محفوظ لخريطة الطريق "{roadmapTitle}". كل خريطة طريق يمكن أن يكون لها قالب مختلف.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
          {activeTab === 'select' && (
            <>
              <Button variant="outline" onClick={handleCopy} disabled={selectedCount === 0}>
                {copied ? <Check className="h-4 w-4 ml-2" /> : <Copy className="h-4 w-4 ml-2" />}
                {copied ? 'تم!' : 'نسخ البرومبت'}
              </Button>
              <Button variant="outline" onClick={handleGenerateQuiz} disabled={selectedCount === 0 || isGeneratingQuiz}>
                {isGeneratingQuiz ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <FileQuestion className="h-4 w-4 ml-2" />}
                اختبار
              </Button>
              <Button onClick={handleAIGenerate} disabled={selectedCount === 0 || isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
                توليد الشرح
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudyModeDialog;
