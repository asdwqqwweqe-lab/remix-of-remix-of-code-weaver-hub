import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BookOpen, 
  Newspaper, 
  ClipboardList,
  Presentation,
  ScrollText,
  Users,
  FolderKanban,
  CalendarDays
} from 'lucide-react';

interface ReportTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const ReportTemplates = ({ onSelectTemplate }: ReportTemplatesProps) => {
  const { language } = useLanguage();

const templates = [
    {
      id: 'blank',
      icon: FileText,
      name: language === 'ar' ? 'فارغ' : 'Blank',
      description: language === 'ar' ? 'ابدأ من الصفر' : 'Start from scratch',
      content: '',
      badge: null
    },
    {
      id: 'wiki',
      icon: BookOpen,
      name: language === 'ar' ? 'ويكي' : 'Wiki',
      description: language === 'ar' ? 'توثيق شامل مع فهرس' : 'Documentation with table of contents',
      content: `# ${language === 'ar' ? 'عنوان الصفحة' : 'Page Title'}

## ${language === 'ar' ? 'نظرة عامة' : 'Overview'}

${language === 'ar' ? 'اكتب نظرة عامة هنا...' : 'Write your overview here...'}

## ${language === 'ar' ? 'التفاصيل' : 'Details'}

### ${language === 'ar' ? 'القسم الأول' : 'Section 1'}

${language === 'ar' ? 'محتوى القسم الأول...' : 'Section 1 content...'}

### ${language === 'ar' ? 'القسم الثاني' : 'Section 2'}

${language === 'ar' ? 'محتوى القسم الثاني...' : 'Section 2 content...'}

## ${language === 'ar' ? 'المراجع' : 'References'}

- [${language === 'ar' ? 'رابط 1' : 'Link 1'}](https://example.com)
- [${language === 'ar' ? 'رابط 2' : 'Link 2'}](https://example.com)

---
> ${language === 'ar' ? 'آخر تحديث:' : 'Last updated:'} ${new Date().toLocaleDateString()}
`,
      badge: language === 'ar' ? 'مميز' : 'Featured'
    },
    {
      id: 'meeting',
      icon: Users,
      name: language === 'ar' ? 'تقرير اجتماع' : 'Meeting Report',
      description: language === 'ar' ? 'محضر اجتماع منظم' : 'Organized meeting minutes',
      content: `# ${language === 'ar' ? 'محضر اجتماع' : 'Meeting Minutes'}

## ${language === 'ar' ? 'معلومات الاجتماع' : 'Meeting Information'}

| ${language === 'ar' ? 'البند' : 'Item'} | ${language === 'ar' ? 'التفاصيل' : 'Details'} |
|------|---------|
| ${language === 'ar' ? 'التاريخ' : 'Date'} | ${new Date().toLocaleDateString()} |
| ${language === 'ar' ? 'الوقت' : 'Time'} | 10:00 AM |
| ${language === 'ar' ? 'المكان' : 'Location'} | ${language === 'ar' ? 'قاعة الاجتماعات' : 'Meeting Room'} |
| ${language === 'ar' ? 'الحضور' : 'Attendees'} | ${language === 'ar' ? 'الأسماء هنا' : 'Names here'} |

## ${language === 'ar' ? 'جدول الأعمال' : 'Agenda'}

1. ${language === 'ar' ? 'البند الأول' : 'Item 1'}
2. ${language === 'ar' ? 'البند الثاني' : 'Item 2'}
3. ${language === 'ar' ? 'البند الثالث' : 'Item 3'}

## ${language === 'ar' ? 'النقاشات' : 'Discussions'}

### ${language === 'ar' ? 'البند الأول' : 'Item 1'}

${language === 'ar' ? 'ملخص النقاش...' : 'Discussion summary...'}

### ${language === 'ar' ? 'البند الثاني' : 'Item 2'}

${language === 'ar' ? 'ملخص النقاش...' : 'Discussion summary...'}

## ${language === 'ar' ? 'القرارات' : 'Decisions'}

- [ ] ${language === 'ar' ? 'القرار الأول - المسؤول: اسم الشخص' : 'Decision 1 - Owner: Person name'}
- [ ] ${language === 'ar' ? 'القرار الثاني - المسؤول: اسم الشخص' : 'Decision 2 - Owner: Person name'}

## ${language === 'ar' ? 'الإجراءات المطلوبة' : 'Action Items'}

| ${language === 'ar' ? 'الإجراء' : 'Action'} | ${language === 'ar' ? 'المسؤول' : 'Owner'} | ${language === 'ar' ? 'الموعد' : 'Due Date'} |
|--------|---------|----------|
| ${language === 'ar' ? 'إجراء 1' : 'Action 1'} | ${language === 'ar' ? 'اسم' : 'Name'} | ${language === 'ar' ? 'التاريخ' : 'Date'} |

## ${language === 'ar' ? 'الاجتماع القادم' : 'Next Meeting'}

${language === 'ar' ? 'التاريخ والوقت المقترح...' : 'Proposed date and time...'}
`,
      badge: language === 'ar' ? 'جديد' : 'New'
    },
    {
      id: 'project',
      icon: FolderKanban,
      name: language === 'ar' ? 'تقرير مشروع' : 'Project Report',
      description: language === 'ar' ? 'تقرير حالة المشروع' : 'Project status report',
      content: `# ${language === 'ar' ? 'تقرير حالة المشروع' : 'Project Status Report'}

## ${language === 'ar' ? 'ملخص تنفيذي' : 'Executive Summary'}

${language === 'ar' ? 'ملخص موجز عن حالة المشروع...' : 'Brief summary of project status...'}

## ${language === 'ar' ? 'معلومات المشروع' : 'Project Information'}

| ${language === 'ar' ? 'البند' : 'Item'} | ${language === 'ar' ? 'التفاصيل' : 'Details'} |
|------|---------|
| ${language === 'ar' ? 'اسم المشروع' : 'Project Name'} | ${language === 'ar' ? 'الاسم هنا' : 'Name here'} |
| ${language === 'ar' ? 'مدير المشروع' : 'Project Manager'} | ${language === 'ar' ? 'الاسم' : 'Name'} |
| ${language === 'ar' ? 'تاريخ البدء' : 'Start Date'} | ${language === 'ar' ? 'التاريخ' : 'Date'} |
| ${language === 'ar' ? 'تاريخ الانتهاء المتوقع' : 'Expected End Date'} | ${language === 'ar' ? 'التاريخ' : 'Date'} |
| ${language === 'ar' ? 'الحالة' : 'Status'} | 🟢 ${language === 'ar' ? 'على المسار' : 'On Track'} |

## ${language === 'ar' ? 'التقدم الحالي' : 'Current Progress'}

### ${language === 'ar' ? 'الإنجازات' : 'Achievements'}

- ${language === 'ar' ? 'إنجاز 1' : 'Achievement 1'}
- ${language === 'ar' ? 'إنجاز 2' : 'Achievement 2'}

### ${language === 'ar' ? 'المهام الجارية' : 'Ongoing Tasks'}

- [ ] ${language === 'ar' ? 'مهمة 1' : 'Task 1'}
- [ ] ${language === 'ar' ? 'مهمة 2' : 'Task 2'}

## ${language === 'ar' ? 'المخاطر والتحديات' : 'Risks & Challenges'}

| ${language === 'ar' ? 'المخاطر' : 'Risk'} | ${language === 'ar' ? 'الأثر' : 'Impact'} | ${language === 'ar' ? 'الخطة' : 'Mitigation'} |
|------|--------|------------|
| ${language === 'ar' ? 'خطر 1' : 'Risk 1'} | ${language === 'ar' ? 'عالي' : 'High'} | ${language === 'ar' ? 'الحل' : 'Solution'} |

## ${language === 'ar' ? 'الخطوات القادمة' : 'Next Steps'}

1. ${language === 'ar' ? 'الخطوة 1' : 'Step 1'}
2. ${language === 'ar' ? 'الخطوة 2' : 'Step 2'}
3. ${language === 'ar' ? 'الخطوة 3' : 'Step 3'}
`,
      badge: null
    },
    {
      id: 'weekly',
      icon: CalendarDays,
      name: language === 'ar' ? 'تقرير أسبوعي' : 'Weekly Report',
      description: language === 'ar' ? 'ملخص الأسبوع' : 'Week summary',
      content: `# ${language === 'ar' ? 'التقرير الأسبوعي' : 'Weekly Report'}

**${language === 'ar' ? 'الفترة:' : 'Period:'}** ${language === 'ar' ? 'من' : 'From'} _____ ${language === 'ar' ? 'إلى' : 'To'} _____

## ${language === 'ar' ? 'ملخص الأسبوع' : 'Week Summary'}

${language === 'ar' ? 'نظرة عامة على إنجازات الأسبوع...' : 'Overview of the week achievements...'}

## ${language === 'ar' ? 'ما تم إنجازه' : 'Completed'}

- [x] ${language === 'ar' ? 'مهمة منجزة 1' : 'Completed task 1'}
- [x] ${language === 'ar' ? 'مهمة منجزة 2' : 'Completed task 2'}
- [x] ${language === 'ar' ? 'مهمة منجزة 3' : 'Completed task 3'}

## ${language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}

- [ ] ${language === 'ar' ? 'مهمة جارية 1' : 'Ongoing task 1'}
- [ ] ${language === 'ar' ? 'مهمة جارية 2' : 'Ongoing task 2'}

## ${language === 'ar' ? 'خطة الأسبوع القادم' : 'Next Week Plan'}

1. ${language === 'ar' ? 'هدف 1' : 'Goal 1'}
2. ${language === 'ar' ? 'هدف 2' : 'Goal 2'}
3. ${language === 'ar' ? 'هدف 3' : 'Goal 3'}

## ${language === 'ar' ? 'العوائق والتحديات' : 'Blockers & Challenges'}

${language === 'ar' ? 'لا توجد عوائق حالياً' : 'No blockers currently'}

## ${language === 'ar' ? 'ملاحظات' : 'Notes'}

> ${language === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
`,
      badge: null
    },
    {
      id: 'article',
      icon: Newspaper,
      name: language === 'ar' ? 'مقال' : 'Article',
      description: language === 'ar' ? 'مقال منسق بشكل احترافي' : 'Professional formatted article',
      content: `# ${language === 'ar' ? 'عنوان المقال' : 'Article Title'}

> ${language === 'ar' ? 'ملخص قصير للمقال يظهر في بداية الصفحة.' : 'A brief summary that appears at the beginning.'}

## ${language === 'ar' ? 'المقدمة' : 'Introduction'}

${language === 'ar' ? 'اكتب مقدمتك هنا. يجب أن تجذب القارئ وتوضح موضوع المقال.' : 'Write your introduction here. It should capture the reader and clarify the topic.'}

## ${language === 'ar' ? 'المحتوى الرئيسي' : 'Main Content'}

### ${language === 'ar' ? 'النقطة الأولى' : 'First Point'}

${language === 'ar' ? 'شرح تفصيلي للنقطة الأولى...' : 'Detailed explanation of the first point...'}

### ${language === 'ar' ? 'النقطة الثانية' : 'Second Point'}

${language === 'ar' ? 'شرح تفصيلي للنقطة الثانية...' : 'Detailed explanation of the second point...'}

## ${language === 'ar' ? 'الخلاصة' : 'Conclusion'}

${language === 'ar' ? 'لخص أهم النقاط هنا...' : 'Summarize the key points here...'}

---

**${language === 'ar' ? 'الكلمات المفتاحية' : 'Keywords'}:** keyword1, keyword2, keyword3
`,
      badge: null
    },
    {
      id: 'checklist',
      icon: ClipboardList,
      name: language === 'ar' ? 'قائمة مراجعة' : 'Checklist',
      description: language === 'ar' ? 'قائمة مهام أو مراجعة' : 'Task or review checklist',
      content: `# ${language === 'ar' ? 'قائمة المراجعة' : 'Checklist'}

## ${language === 'ar' ? 'المهام الرئيسية' : 'Main Tasks'}

- [ ] ${language === 'ar' ? 'المهمة الأولى' : 'Task 1'}
- [ ] ${language === 'ar' ? 'المهمة الثانية' : 'Task 2'}
- [ ] ${language === 'ar' ? 'المهمة الثالثة' : 'Task 3'}

## ${language === 'ar' ? 'التفاصيل' : 'Details'}

### ${language === 'ar' ? 'المهمة الأولى' : 'Task 1'}

${language === 'ar' ? 'وصف المهمة والخطوات المطلوبة...' : 'Task description and required steps...'}

### ${language === 'ar' ? 'المهمة الثانية' : 'Task 2'}

${language === 'ar' ? 'وصف المهمة والخطوات المطلوبة...' : 'Task description and required steps...'}

## ${language === 'ar' ? 'ملاحظات' : 'Notes'}

> ${language === 'ar' ? 'أضف ملاحظاتك هنا...' : 'Add your notes here...'}
`,
      badge: null
    },
    {
      id: 'presentation',
      icon: Presentation,
      name: language === 'ar' ? 'عرض تقديمي' : 'Presentation',
      description: language === 'ar' ? 'محتوى منظم للعروض' : 'Content for presentations',
      content: `# ${language === 'ar' ? 'عنوان العرض' : 'Presentation Title'}

---

## ${language === 'ar' ? 'الشريحة 1: المقدمة' : 'Slide 1: Introduction'}

- ${language === 'ar' ? 'النقطة الأولى' : 'Point 1'}
- ${language === 'ar' ? 'النقطة الثانية' : 'Point 2'}
- ${language === 'ar' ? 'النقطة الثالثة' : 'Point 3'}

---

## ${language === 'ar' ? 'الشريحة 2: المشكلة' : 'Slide 2: The Problem'}

> ${language === 'ar' ? 'اذكر المشكلة بوضوح' : 'State the problem clearly'}

---

## ${language === 'ar' ? 'الشريحة 3: الحل' : 'Slide 3: The Solution'}

1. ${language === 'ar' ? 'الخطوة الأولى' : 'Step 1'}
2. ${language === 'ar' ? 'الخطوة الثانية' : 'Step 2'}
3. ${language === 'ar' ? 'الخطوة الثالثة' : 'Step 3'}

---

## ${language === 'ar' ? 'الشريحة 4: الخلاصة' : 'Slide 4: Conclusion'}

**${language === 'ar' ? 'النتائج الرئيسية:' : 'Key takeaways:'}**

- ${language === 'ar' ? 'نتيجة 1' : 'Result 1'}
- ${language === 'ar' ? 'نتيجة 2' : 'Result 2'}

---

## ${language === 'ar' ? 'أسئلة؟' : 'Questions?'}

${language === 'ar' ? 'شكراً لاستماعكم!' : 'Thank you for listening!'}
`,
      badge: null
    },
    {
      id: 'documentation',
      icon: ScrollText,
      name: language === 'ar' ? 'توثيق تقني' : 'Technical Docs',
      description: language === 'ar' ? 'توثيق كود أو API' : 'Code or API documentation',
      content: `# ${language === 'ar' ? 'اسم المشروع' : 'Project Name'}

${language === 'ar' ? 'وصف قصير للمشروع.' : 'Short project description.'}

## ${language === 'ar' ? 'التثبيت' : 'Installation'}

\`\`\`bash
npm install package-name
\`\`\`

## ${language === 'ar' ? 'الاستخدام' : 'Usage'}

\`\`\`javascript
import { function } from 'package-name';

const result = function();
\`\`\`

## API ${language === 'ar' ? 'المرجع' : 'Reference'}

### \`functionName(param1, param2)\`

${language === 'ar' ? 'وصف الدالة.' : 'Function description.'}

**${language === 'ar' ? 'المعاملات' : 'Parameters'}:**

| ${language === 'ar' ? 'الاسم' : 'Name'} | ${language === 'ar' ? 'النوع' : 'Type'} | ${language === 'ar' ? 'الوصف' : 'Description'} |
|------|------|-------------|
| param1 | string | ${language === 'ar' ? 'وصف المعامل' : 'Parameter description'} |
| param2 | number | ${language === 'ar' ? 'وصف المعامل' : 'Parameter description'} |

**${language === 'ar' ? 'القيمة المرجعة' : 'Returns'}:** \`Object\`

## ${language === 'ar' ? 'أمثلة' : 'Examples'}

\`\`\`javascript
const example1 = function('value', 123);
\`\`\`

## ${language === 'ar' ? 'الرخصة' : 'License'}

MIT
`,
      badge: null
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {language === 'ar' ? 'اختر قالب' : 'Choose Template'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto flex-col items-start p-3 gap-1 hover:border-primary transition-colors relative"
              onClick={() => onSelectTemplate(template.content)}
            >
              {template.badge && (
                <Badge 
                  variant="default" 
                  className="absolute -top-2 -end-2 text-[10px] px-1.5 py-0"
                >
                  {template.badge}
                </Badge>
              )}
              <div className="flex items-center gap-2 w-full">
                <template.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-sm">{template.name}</span>
              </div>
              <span className="text-xs text-muted-foreground text-start line-clamp-1">
                {template.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTemplates;
