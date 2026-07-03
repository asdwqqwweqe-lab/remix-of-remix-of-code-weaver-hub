export interface TemplateTask {
  text: string;
  priority: 'low' | 'medium' | 'high';
  dueOffsetDays?: number; // days from today
  labels?: string[];
}

export interface TodoTemplate {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: string; // emoji
  color: string; // tailwind bg
  tasks: TemplateTask[];
}

export const TODO_TEMPLATES: TodoTemplate[] = [
  {
    id: 'scrum-sprint',
    name: { ar: 'سبرنت SCRUM (أسبوعان)', en: 'SCRUM Sprint (2 weeks)' },
    description: {
      ar: 'قالب سبرنت رشيق مع تخطيط، daily standup، مراجعة، وretro.',
      en: 'Agile sprint with planning, standups, review, and retrospective.',
    },
    icon: '🏃',
    color: 'bg-blue-500/10 border-blue-500/30',
    tasks: [
      { text: 'Sprint Planning — تحديد أهداف السبرنت', priority: 'high', dueOffsetDays: 0, labels: ['review'] },
      { text: 'Backlog Grooming — تنقية المتراكم', priority: 'medium', dueOffsetDays: 1 },
      { text: 'Daily Standup — يوم 2', priority: 'low', dueOffsetDays: 2 },
      { text: 'Daily Standup — يوم 3', priority: 'low', dueOffsetDays: 3 },
      { text: 'Daily Standup — يوم 4', priority: 'low', dueOffsetDays: 4 },
      { text: 'مراجعة منتصف السبرنت', priority: 'medium', dueOffsetDays: 7, labels: ['review'] },
      { text: 'Sprint Review — عرض المُنجز', priority: 'high', dueOffsetDays: 13, labels: ['review'] },
      { text: 'Sprint Retrospective — استخلاص الدروس', priority: 'high', dueOffsetDays: 14, labels: ['review'] },
    ],
  },
  {
    id: 'weekly-review',
    name: { ar: 'مراجعة أسبوعية', en: 'Weekly Review' },
    description: {
      ar: 'روتين نهاية الأسبوع لمراجعة الإنجازات وتخطيط القادم.',
      en: 'End-of-week routine for reviewing achievements and planning ahead.',
    },
    icon: '📅',
    color: 'bg-emerald-500/10 border-emerald-500/30',
    tasks: [
      { text: 'راجع المهام المكتملة هذا الأسبوع', priority: 'medium', dueOffsetDays: 0, labels: ['review'] },
      { text: 'راجع المسودات وأنجز واحدة', priority: 'high', dueOffsetDays: 0 },
      { text: 'أرشف الملاحظات القديمة', priority: 'low', dueOffsetDays: 1 },
      { text: 'حدّد 3 أولويات للأسبوع القادم', priority: 'high', dueOffsetDays: 1 },
      { text: 'ادعِم Roadmap: أكمل خطوة واحدة', priority: 'medium', dueOffsetDays: 2 },
    ],
  },
  {
    id: '30-day-writing',
    name: { ar: 'تحدي 30 يوم كتابة', en: '30-Day Writing Challenge' },
    description: {
      ar: 'انشر مقالاً كل ثلاثة أيام لمدة شهر.',
      en: 'Publish a post every 3 days for a month.',
    },
    icon: '✍️',
    color: 'bg-purple-500/10 border-purple-500/30',
    tasks: Array.from({ length: 10 }, (_, i) => ({
      text: `اكتب وانشر المقال ${i + 1}`,
      priority: (i < 3 ? 'high' : 'medium') as 'high' | 'medium',
      dueOffsetDays: (i + 1) * 3,
      labels: ['feature'],
    })),
  },
  {
    id: 'learning-sprint',
    name: { ar: 'سبرنت تعلّم (أسبوع)', en: 'Learning Sprint (1 week)' },
    description: {
      ar: 'تعلّم موضوعاً جديداً بشكل مركّز خلال 7 أيام.',
      en: 'Deep-dive into a new topic in 7 days.',
    },
    icon: '🎓',
    color: 'bg-amber-500/10 border-amber-500/30',
    tasks: [
      { text: 'حدّد الموضوع والهدف بوضوح', priority: 'high', dueOffsetDays: 0, labels: ['docs'] },
      { text: 'اجمع 3 مصادر رئيسية (كتب/كورسات)', priority: 'high', dueOffsetDays: 0 },
      { text: 'اليوم 1: أساسيات', priority: 'medium', dueOffsetDays: 1 },
      { text: 'اليوم 2: مثال تطبيقي', priority: 'medium', dueOffsetDays: 2 },
      { text: 'اليوم 3: تعمّق نظري', priority: 'medium', dueOffsetDays: 3 },
      { text: 'اليوم 4: مشروع صغير', priority: 'high', dueOffsetDays: 4 },
      { text: 'اليوم 5: مراجعة الأخطاء الشائعة', priority: 'medium', dueOffsetDays: 5 },
      { text: 'اليوم 6: مقال ملخّص للتعلّم', priority: 'high', dueOffsetDays: 6, labels: ['docs'] },
      { text: 'اليوم 7: تقييم وخطوة تالية', priority: 'medium', dueOffsetDays: 7, labels: ['review'] },
    ],
  },
  {
    id: 'bug-triage',
    name: { ar: 'فرز الأخطاء (Bug Triage)', en: 'Bug Triage' },
    description: {
      ar: 'دورة فرز أسبوعية للـ bugs المُبلّغ عنها.',
      en: 'Weekly triage cycle for reported bugs.',
    },
    icon: '🐛',
    color: 'bg-red-500/10 border-red-500/30',
    tasks: [
      { text: 'اجمع الأخطاء الجديدة من التقارير', priority: 'high', dueOffsetDays: 0, labels: ['bug'] },
      { text: 'صنّف حسب الأولوية والحدّة', priority: 'high', dueOffsetDays: 0, labels: ['bug'] },
      { text: 'خصّص المسؤول عن كل خطأ حرج', priority: 'high', dueOffsetDays: 1, labels: ['bug', 'urgent'] },
      { text: 'حدد Milestone/Release', priority: 'medium', dueOffsetDays: 1 },
      { text: 'راجع الحالة بعد 3 أيام', priority: 'medium', dueOffsetDays: 4, labels: ['review'] },
    ],
  },
];
