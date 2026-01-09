import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Code,
  BookOpen,
  Lightbulb,
  Bug,
  Rocket,
  ScrollText,
  Terminal,
  Layers
} from 'lucide-react';

interface PostTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

const PostTemplates = ({ onSelectTemplate }: PostTemplatesProps) => {
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
      id: 'tutorial',
      icon: BookOpen,
      name: language === 'ar' ? 'درس تعليمي' : 'Tutorial',
      description: language === 'ar' ? 'شرح خطوة بخطوة' : 'Step-by-step guide',
      content: `# ${language === 'ar' ? 'عنوان الدرس' : 'Tutorial Title'}

## ${language === 'ar' ? 'المقدمة' : 'Introduction'}

${language === 'ar' ? 'في هذا الدرس سنتعلم...' : 'In this tutorial, we will learn...'}

## ${language === 'ar' ? 'المتطلبات' : 'Prerequisites'}

- ${language === 'ar' ? 'المتطلب الأول' : 'Prerequisite 1'}
- ${language === 'ar' ? 'المتطلب الثاني' : 'Prerequisite 2'}

## ${language === 'ar' ? 'الخطوة 1: البداية' : 'Step 1: Getting Started'}

${language === 'ar' ? 'شرح الخطوة الأولى...' : 'Explanation of step 1...'}

\`\`\`javascript
// ${language === 'ar' ? 'الكود هنا' : 'Code here'}
console.log('Hello World');
\`\`\`

## ${language === 'ar' ? 'الخطوة 2: التطبيق' : 'Step 2: Implementation'}

${language === 'ar' ? 'شرح الخطوة الثانية...' : 'Explanation of step 2...'}

\`\`\`javascript
// ${language === 'ar' ? 'الكود هنا' : 'Code here'}
function example() {
  return 'Hello';
}
\`\`\`

## ${language === 'ar' ? 'الخطوة 3: النتيجة' : 'Step 3: Result'}

${language === 'ar' ? 'النتيجة النهائية...' : 'Final result...'}

## ${language === 'ar' ? 'الخلاصة' : 'Conclusion'}

${language === 'ar' ? 'ملخص ما تعلمناه...' : 'Summary of what we learned...'}

## ${language === 'ar' ? 'مصادر إضافية' : 'Additional Resources'}

- [${language === 'ar' ? 'رابط 1' : 'Link 1'}](https://example.com)
- [${language === 'ar' ? 'رابط 2' : 'Link 2'}](https://example.com)
`,
      badge: language === 'ar' ? 'مميز' : 'Featured'
    },
    {
      id: 'code-snippet',
      icon: Code,
      name: language === 'ar' ? 'مقتطف كود' : 'Code Snippet',
      description: language === 'ar' ? 'مشاركة كود مع شرح' : 'Share code with explanation',
      content: `# ${language === 'ar' ? 'عنوان المقتطف' : 'Snippet Title'}

## ${language === 'ar' ? 'الوصف' : 'Description'}

${language === 'ar' ? 'وصف قصير لما يفعله هذا الكود...' : 'Brief description of what this code does...'}

## ${language === 'ar' ? 'الكود' : 'Code'}

\`\`\`javascript
// ${language === 'ar' ? 'الكود الرئيسي' : 'Main code'}
function functionName(param1, param2) {
  // ${language === 'ar' ? 'التنفيذ' : 'Implementation'}
  return result;
}

// ${language === 'ar' ? 'مثال على الاستخدام' : 'Usage example'}
const result = functionName('value1', 'value2');
console.log(result);
\`\`\`

## ${language === 'ar' ? 'الشرح' : 'Explanation'}

| ${language === 'ar' ? 'الجزء' : 'Part'} | ${language === 'ar' ? 'الشرح' : 'Explanation'} |
|------|-------------|
| \`param1\` | ${language === 'ar' ? 'شرح المعامل الأول' : 'First parameter explanation'} |
| \`param2\` | ${language === 'ar' ? 'شرح المعامل الثاني' : 'Second parameter explanation'} |

## ${language === 'ar' ? 'ملاحظات' : 'Notes'}

> ${language === 'ar' ? 'ملاحظات مهمة حول استخدام هذا الكود...' : 'Important notes about using this code...'}
`,
      badge: null
    },
    {
      id: 'problem-solution',
      icon: Lightbulb,
      name: language === 'ar' ? 'مشكلة وحل' : 'Problem & Solution',
      description: language === 'ar' ? 'شرح مشكلة وكيفية حلها' : 'Explain a problem and its solution',
      content: `# ${language === 'ar' ? 'عنوان المشكلة' : 'Problem Title'}

## ${language === 'ar' ? 'المشكلة' : 'The Problem'}

${language === 'ar' ? 'وصف المشكلة التي واجهتها...' : 'Description of the problem I encountered...'}

### ${language === 'ar' ? 'رسالة الخطأ' : 'Error Message'}

\`\`\`
Error: ${language === 'ar' ? 'رسالة الخطأ هنا' : 'Error message here'}
\`\`\`

## ${language === 'ar' ? 'السبب' : 'The Cause'}

${language === 'ar' ? 'سبب حدوث هذه المشكلة...' : 'Why this problem occurs...'}

## ${language === 'ar' ? 'الحل' : 'The Solution'}

### ${language === 'ar' ? 'الحل 1' : 'Solution 1'}

\`\`\`javascript
// ${language === 'ar' ? 'الكود المصحح' : 'Corrected code'}
\`\`\`

### ${language === 'ar' ? 'الحل 2 (بديل)' : 'Solution 2 (Alternative)'}

\`\`\`javascript
// ${language === 'ar' ? 'كود بديل' : 'Alternative code'}
\`\`\`

## ${language === 'ar' ? 'الوقاية' : 'Prevention'}

${language === 'ar' ? 'كيفية تجنب هذه المشكلة مستقبلاً...' : 'How to avoid this problem in the future...'}
`,
      badge: language === 'ar' ? 'جديد' : 'New'
    },
    {
      id: 'bug-fix',
      icon: Bug,
      name: language === 'ar' ? 'إصلاح خطأ' : 'Bug Fix',
      description: language === 'ar' ? 'توثيق إصلاح خطأ' : 'Document a bug fix',
      content: `# ${language === 'ar' ? 'إصلاح:' : 'Fix:'} [${language === 'ar' ? 'وصف الخطأ' : 'Bug Description'}]

## ${language === 'ar' ? 'الخطأ' : 'The Bug'}

**${language === 'ar' ? 'الوصف:' : 'Description:'}** ${language === 'ar' ? 'وصف الخطأ...' : 'Bug description...'}

**${language === 'ar' ? 'خطوات إعادة الإنتاج:' : 'Steps to Reproduce:'}**

1. ${language === 'ar' ? 'الخطوة 1' : 'Step 1'}
2. ${language === 'ar' ? 'الخطوة 2' : 'Step 2'}
3. ${language === 'ar' ? 'الخطوة 3' : 'Step 3'}

**${language === 'ar' ? 'السلوك المتوقع:' : 'Expected Behavior:'}** ${language === 'ar' ? 'ما كان يجب أن يحدث' : 'What should have happened'}

**${language === 'ar' ? 'السلوك الفعلي:' : 'Actual Behavior:'}** ${language === 'ar' ? 'ما حدث فعلياً' : 'What actually happened'}

## ${language === 'ar' ? 'الكود قبل الإصلاح' : 'Code Before Fix'}

\`\`\`javascript
// ${language === 'ar' ? 'الكود الذي به المشكلة' : 'Problematic code'}
\`\`\`

## ${language === 'ar' ? 'الكود بعد الإصلاح' : 'Code After Fix'}

\`\`\`javascript
// ${language === 'ar' ? 'الكود المصحح' : 'Fixed code'}
\`\`\`

## ${language === 'ar' ? 'التغييرات' : 'Changes Made'}

- ${language === 'ar' ? 'التغيير 1' : 'Change 1'}
- ${language === 'ar' ? 'التغيير 2' : 'Change 2'}

## ${language === 'ar' ? 'الاختبار' : 'Testing'}

${language === 'ar' ? 'كيف تم اختبار الإصلاح...' : 'How the fix was tested...'}
`,
      badge: null
    },
    {
      id: 'project-setup',
      icon: Rocket,
      name: language === 'ar' ? 'إعداد مشروع' : 'Project Setup',
      description: language === 'ar' ? 'دليل إعداد مشروع جديد' : 'New project setup guide',
      content: `# ${language === 'ar' ? 'إعداد مشروع' : 'Project Setup'}: [${language === 'ar' ? 'اسم المشروع' : 'Project Name'}]

## ${language === 'ar' ? 'نظرة عامة' : 'Overview'}

${language === 'ar' ? 'وصف المشروع وأهدافه...' : 'Project description and goals...'}

## ${language === 'ar' ? 'المتطلبات' : 'Requirements'}

- Node.js >= 18
- npm / yarn / pnpm
- ${language === 'ar' ? 'متطلبات أخرى' : 'Other requirements'}

## ${language === 'ar' ? 'التثبيت' : 'Installation'}

\`\`\`bash
# ${language === 'ar' ? 'استنساخ المشروع' : 'Clone the project'}
git clone https://github.com/username/project.git

# ${language === 'ar' ? 'الانتقال للمجلد' : 'Navigate to folder'}
cd project

# ${language === 'ar' ? 'تثبيت الاعتماديات' : 'Install dependencies'}
npm install
\`\`\`

## ${language === 'ar' ? 'الإعدادات' : 'Configuration'}

\`\`\`bash
# ${language === 'ar' ? 'نسخ ملف البيئة' : 'Copy environment file'}
cp .env.example .env
\`\`\`

### ${language === 'ar' ? 'متغيرات البيئة' : 'Environment Variables'}

| ${language === 'ar' ? 'المتغير' : 'Variable'} | ${language === 'ar' ? 'الوصف' : 'Description'} | ${language === 'ar' ? 'مثال' : 'Example'} |
|----------|-------------|---------|
| \`API_KEY\` | ${language === 'ar' ? 'مفتاح API' : 'API key'} | \`xxx-xxx\` |

## ${language === 'ar' ? 'التشغيل' : 'Running'}

\`\`\`bash
# ${language === 'ar' ? 'وضع التطوير' : 'Development mode'}
npm run dev

# ${language === 'ar' ? 'وضع الإنتاج' : 'Production mode'}
npm run build
npm start
\`\`\`

## ${language === 'ar' ? 'هيكل المشروع' : 'Project Structure'}

\`\`\`
project/
├── src/
│   ├── components/
│   ├── pages/
│   └── utils/
├── public/
└── package.json
\`\`\`
`,
      badge: null
    },
    {
      id: 'api-docs',
      icon: Terminal,
      name: language === 'ar' ? 'توثيق API' : 'API Documentation',
      description: language === 'ar' ? 'توثيق نقاط النهاية' : 'Endpoint documentation',
      content: `# ${language === 'ar' ? 'توثيق' : 'Documentation'}: API

## ${language === 'ar' ? 'نظرة عامة' : 'Overview'}

${language === 'ar' ? 'وصف API...' : 'API description...'}

**Base URL:** \`https://api.example.com/v1\`

## ${language === 'ar' ? 'المصادقة' : 'Authentication'}

\`\`\`bash
Authorization: Bearer <token>
\`\`\`

## ${language === 'ar' ? 'نقاط النهاية' : 'Endpoints'}

### GET /users

${language === 'ar' ? 'جلب قائمة المستخدمين' : 'Fetch list of users'}

**${language === 'ar' ? 'المعاملات:' : 'Parameters:'}**

| ${language === 'ar' ? 'المعامل' : 'Parameter'} | ${language === 'ar' ? 'النوع' : 'Type'} | ${language === 'ar' ? 'مطلوب' : 'Required'} | ${language === 'ar' ? 'الوصف' : 'Description'} |
|-------|------|----------|-------------|
| \`page\` | number | ${language === 'ar' ? 'لا' : 'No'} | ${language === 'ar' ? 'رقم الصفحة' : 'Page number'} |
| \`limit\` | number | ${language === 'ar' ? 'لا' : 'No'} | ${language === 'ar' ? 'عدد النتائج' : 'Results limit'} |

**${language === 'ar' ? 'مثال على الطلب:' : 'Request Example:'}**

\`\`\`bash
curl -X GET "https://api.example.com/v1/users?page=1&limit=10" \\
  -H "Authorization: Bearer <token>"
\`\`\`

**${language === 'ar' ? 'مثال على الاستجابة:' : 'Response Example:'}**

\`\`\`json
{
  "data": [
    { "id": 1, "name": "User 1" }
  ],
  "total": 100,
  "page": 1
}
\`\`\`

### POST /users

${language === 'ar' ? 'إنشاء مستخدم جديد' : 'Create a new user'}

**${language === 'ar' ? 'الجسم:' : 'Body:'}**

\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com"
}
\`\`\`
`,
      badge: null
    },
    {
      id: 'comparison',
      icon: Layers,
      name: language === 'ar' ? 'مقارنة' : 'Comparison',
      description: language === 'ar' ? 'مقارنة بين تقنيات أو أدوات' : 'Compare technologies or tools',
      content: `# ${language === 'ar' ? 'مقارنة:' : 'Comparison:'} [${language === 'ar' ? 'الخيار 1' : 'Option 1'}] vs [${language === 'ar' ? 'الخيار 2' : 'Option 2'}]

## ${language === 'ar' ? 'نظرة عامة' : 'Overview'}

${language === 'ar' ? 'مقدمة عن المقارنة...' : 'Introduction to the comparison...'}

## ${language === 'ar' ? 'جدول المقارنة' : 'Comparison Table'}

| ${language === 'ar' ? 'المعيار' : 'Criteria'} | ${language === 'ar' ? 'الخيار 1' : 'Option 1'} | ${language === 'ar' ? 'الخيار 2' : 'Option 2'} |
|----------|----------|----------|
| ${language === 'ar' ? 'الأداء' : 'Performance'} | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| ${language === 'ar' ? 'سهولة الاستخدام' : 'Ease of Use'} | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| ${language === 'ar' ? 'المجتمع' : 'Community'} | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| ${language === 'ar' ? 'التوثيق' : 'Documentation'} | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## ${language === 'ar' ? 'الخيار 1' : 'Option 1'}

### ${language === 'ar' ? 'المميزات' : 'Pros'}

- ${language === 'ar' ? 'ميزة 1' : 'Pro 1'}
- ${language === 'ar' ? 'ميزة 2' : 'Pro 2'}

### ${language === 'ar' ? 'العيوب' : 'Cons'}

- ${language === 'ar' ? 'عيب 1' : 'Con 1'}
- ${language === 'ar' ? 'عيب 2' : 'Con 2'}

## ${language === 'ar' ? 'الخيار 2' : 'Option 2'}

### ${language === 'ar' ? 'المميزات' : 'Pros'}

- ${language === 'ar' ? 'ميزة 1' : 'Pro 1'}
- ${language === 'ar' ? 'ميزة 2' : 'Pro 2'}

### ${language === 'ar' ? 'العيوب' : 'Cons'}

- ${language === 'ar' ? 'عيب 1' : 'Con 1'}
- ${language === 'ar' ? 'عيب 2' : 'Con 2'}

## ${language === 'ar' ? 'الخلاصة' : 'Conclusion'}

${language === 'ar' ? 'التوصية النهائية...' : 'Final recommendation...'}

- ${language === 'ar' ? 'استخدم الخيار 1 إذا...' : 'Use Option 1 if...'}
- ${language === 'ar' ? 'استخدم الخيار 2 إذا...' : 'Use Option 2 if...'}
`,
      badge: null
    },
    {
      id: 'notes',
      icon: ScrollText,
      name: language === 'ar' ? 'ملاحظات' : 'Notes',
      description: language === 'ar' ? 'ملاحظات سريعة ومنظمة' : 'Quick organized notes',
      content: `# ${language === 'ar' ? 'ملاحظات:' : 'Notes:'} [${language === 'ar' ? 'الموضوع' : 'Topic'}]

## ${language === 'ar' ? 'النقاط الرئيسية' : 'Key Points'}

- ${language === 'ar' ? 'نقطة 1' : 'Point 1'}
- ${language === 'ar' ? 'نقطة 2' : 'Point 2'}
- ${language === 'ar' ? 'نقطة 3' : 'Point 3'}

## ${language === 'ar' ? 'التفاصيل' : 'Details'}

### ${language === 'ar' ? 'القسم 1' : 'Section 1'}

${language === 'ar' ? 'ملاحظات القسم الأول...' : 'Section 1 notes...'}

### ${language === 'ar' ? 'القسم 2' : 'Section 2'}

${language === 'ar' ? 'ملاحظات القسم الثاني...' : 'Section 2 notes...'}

## ${language === 'ar' ? 'أوامر مفيدة' : 'Useful Commands'}

\`\`\`bash
# ${language === 'ar' ? 'أمر 1' : 'Command 1'}
command --flag

# ${language === 'ar' ? 'أمر 2' : 'Command 2'}
another-command
\`\`\`

## ${language === 'ar' ? 'روابط مهمة' : 'Important Links'}

- [${language === 'ar' ? 'رابط 1' : 'Link 1'}](https://example.com)
- [${language === 'ar' ? 'رابط 2' : 'Link 2'}](https://example.com)

## ${language === 'ar' ? 'للمراجعة لاحقاً' : 'To Review Later'}

- [ ] ${language === 'ar' ? 'موضوع 1' : 'Topic 1'}
- [ ] ${language === 'ar' ? 'موضوع 2' : 'Topic 2'}
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

export default PostTemplates;
