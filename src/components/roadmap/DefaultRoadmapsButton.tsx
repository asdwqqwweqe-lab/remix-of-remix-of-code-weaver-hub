import { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useBlogStore } from '@/store/blogStore';
import { toast } from 'sonner';

interface DefaultRoadmapTopic {
  title: string;
  subTopics?: string[];
}

interface DefaultRoadmap {
  id: string;
  title: string;
  languageName: string;
  description: string;
  sections: {
    title: string;
    description: string;
    topics: (string | DefaultRoadmapTopic)[];
    subSections?: {
      title: string;
      description: string;
      topics: (string | DefaultRoadmapTopic)[];
    }[];
  }[];
}

const defaultRoadmaps: DefaultRoadmap[] = [
  {
    id: 'python',
    title: 'Python Developer Roadmap',
    languageName: 'Python',
    description: 'مسار تعلم Python من المبتدئ إلى المحترف - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'البداية مع Python',
        topics: [
          { title: 'تثبيت Python', subTopics: ['تثبيت على Windows', 'تثبيت على Mac/Linux', 'إعداد VS Code'] },
          { title: 'المتغيرات وأنواع البيانات', subTopics: ['String', 'Integer', 'Float', 'Boolean', 'Type Conversion'] },
          'العمليات الحسابية',
          { title: 'المدخلات والمخرجات', subTopics: ['input()', 'print()', 'f-strings'] },
          { title: 'الجمل الشرطية', subTopics: ['if/else', 'elif', 'Nested Conditions', 'Ternary Operator'] },
          { title: 'الحلقات', subTopics: ['for Loop', 'while Loop', 'break/continue', 'Loop with else'] }
        ],
      },
      {
        title: 'المستوى المبتدئ - الدوال والبيانات',
        description: 'التعمق في الأساسيات',
        topics: [
          { title: 'الدوال Functions', subTopics: ['تعريف الدوال', 'Parameters', 'Return Values', 'Scope'] },
          { title: 'القوائم Lists', subTopics: ['الإنشاء والوصول', 'List Methods', 'List Slicing', 'List Comprehension'] },
          { title: 'القواميس Dictionaries', subTopics: ['الإنشاء والوصول', 'Dict Methods', 'Nested Dicts', 'Dict Comprehension'] },
          'المجموعات Sets',
          'Tuples'
        ],
      },
      {
        title: 'المستوى المتوسط - البرمجة الكائنية',
        description: 'مفاهيم OOP',
        topics: [
          { title: 'الفئات والكائنات', subTopics: ['Class Definition', '__init__', 'Instance Variables', 'Methods'] },
          { title: 'الوراثة Inheritance', subTopics: ['Single Inheritance', 'Multiple Inheritance', 'super()'] },
          'التغليف Encapsulation',
          'التعددية Polymorphism',
          { title: 'المفاهيم المتقدمة', subTopics: ['Abstract Classes', '@property', 'Decorators', 'Magic Methods'] }
        ],
      },
      {
        title: 'المستوى المتقدم - المكتبات والأدوات',
        description: 'أدوات Python المتقدمة',
        topics: [
          { title: 'إدارة الحزم', subTopics: ['pip', 'virtualenv', 'requirements.txt'] },
          'List/Dict Comprehension',
          'Generators و Iterators',
          { title: 'المعالجة الاستثنائية', subTopics: ['try/except', 'raise', 'Custom Exceptions'] },
          { title: 'File I/O', subTopics: ['Reading Files', 'Writing Files', 'with Statement', 'JSON/CSV'] },
          'Regular Expressions'
        ],
      },
      {
        title: 'المستوى الاحترافي - التخصص',
        description: 'مسارات التخصص',
        subSections: [
          {
            title: 'Data Science',
            description: 'علم البيانات',
            topics: ['NumPy', 'Pandas', 'Matplotlib', 'Seaborn']
          },
          {
            title: 'Web Development',
            description: 'تطوير الويب',
            topics: ['Flask', 'Django', 'FastAPI', 'REST APIs']
          },
          {
            title: 'Testing & Best Practices',
            description: 'الاختبار وأفضل الممارسات',
            topics: [
              { title: 'Testing', subTopics: ['pytest', 'unittest', 'Test Coverage'] },
              { title: 'Async Programming', subTopics: ['async/await', 'asyncio'] },
              'Type Hints',
              'PEP 8',
              'Documentation'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'django',
    title: 'Django Developer Roadmap',
    languageName: 'Python',
    description: 'مسار تعلم إطار Django من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Django',
        description: 'البداية مع Django',
        topics: ['تثبيت Django', 'إنشاء مشروع جديد', 'بنية المشروع', 'التطبيقات Apps', 'الإعدادات Settings الأساسية', 'URLs و Views البسيطة'],
      },
      {
        title: 'المستوى المبتدئ - Templates والنماذج',
        description: 'واجهات المستخدم',
        topics: ['Template Language', 'Template Tags و Filters', 'Static Files', 'Template Inheritance', 'Forms البسيطة', 'CSRF Protection'],
      },
      {
        title: 'المستوى المتوسط - قواعد البيانات',
        description: 'التعامل مع البيانات',
        topics: ['ORM Models', 'الهجرات Migrations', 'QuerySets الأساسية', 'العلاقات ForeignKey', 'Many-to-Many', 'Admin Interface'],
      },
      {
        title: 'المستوى المتقدم - المصادقة والأمان',
        description: 'الأمان والمستخدمين',
        topics: ['نظام المصادقة المدمج', 'تسجيل الدخول/الخروج', 'التسجيل والتحقق', 'Permissions', 'Groups', 'Custom User Model'],
      },
      {
        title: 'المستوى الاحترافي - APIs والنشر',
        description: 'Django REST Framework',
        topics: ['Serializers', 'APIViews و ViewSets', 'Authentication APIs', 'Pagination', 'Gunicorn/Nginx', 'Docker Deployment'],
      },
    ],
  },
  {
    id: 'laravel',
    title: 'Laravel Developer Roadmap',
    languageName: 'PHP',
    description: 'مسار تعلم إطار Laravel من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'أساسيات Laravel',
        description: 'البداية مع Laravel',
        topics: ['تثبيت Laravel', 'بنية المشروع', 'Artisan CLI', 'Routing', 'Controllers', 'Views و Blade'],
      },
      {
        title: 'قواعد البيانات',
        description: 'Eloquent ORM',
        topics: ['Migrations', 'Eloquent Models', 'Query Builder', 'العلاقات Relationships', 'Seeders و Factories', 'Soft Deletes'],
      },
      {
        title: 'المصادقة والأمان',
        description: 'حماية التطبيق',
        topics: ['Laravel Breeze/Jetstream', 'Authentication', 'Authorization & Gates', 'Policies', 'Middleware', 'CSRF & XSS'],
      },
      {
        title: 'الميزات المتقدمة',
        description: 'أدوات متقدمة',
        topics: ['Queues & Jobs', 'Events & Listeners', 'Broadcasting', 'Task Scheduling', 'Mail', 'Notifications'],
      },
      {
        title: 'API Development',
        description: 'بناء APIs',
        topics: ['API Resources', 'Sanctum/Passport', 'Rate Limiting', 'API Versioning', 'Testing APIs', 'Documentation'],
      },
    ],
  },
  {
    id: 'react',
    title: 'React.js Developer Roadmap',
    languageName: 'JavaScript',
    description: 'مسار تعلم React.js لتطوير واجهات المستخدم',
    sections: [
      {
        title: 'أساسيات React',
        description: 'البداية مع React',
        topics: ['JSX', 'Components', 'Props', 'State', 'Event Handling', 'Conditional Rendering'],
      },
      {
        title: 'React Hooks',
        description: 'استخدام Hooks',
        topics: ['useState', 'useEffect', 'useContext', 'useReducer', 'useMemo', 'useCallback', 'Custom Hooks'],
      },
      {
        title: 'إدارة الحالة',
        description: 'State Management',
        topics: ['Context API', 'Redux Toolkit', 'Zustand', 'Jotai/Recoil', 'React Query', 'SWR'],
      },
      {
        title: 'التوجيه والنماذج',
        description: 'Routing & Forms',
        topics: ['React Router', 'Protected Routes', 'React Hook Form', 'Formik', 'Yup/Zod Validation', 'File Uploads'],
      },
      {
        title: 'الأداء والاختبار',
        description: 'تحسين الأداء',
        topics: ['React.memo', 'Code Splitting', 'Lazy Loading', 'Testing with Jest', 'React Testing Library', 'E2E Testing'],
      },
    ],
  },
  {
    id: 'wordpress',
    title: 'WordPress Plugin Developer Roadmap',
    languageName: 'PHP',
    description: 'مسار تعلم تطوير إضافات WordPress',
    sections: [
      {
        title: 'أساسيات WordPress',
        description: 'فهم WordPress',
        topics: ['بنية WordPress', 'The Loop', 'Template Hierarchy', 'Hooks: Actions & Filters', 'WordPress APIs', 'Database Structure'],
      },
      {
        title: 'تطوير الإضافات',
        description: 'بناء Plugin',
        topics: ['Plugin Structure', 'Plugin Headers', 'Activation/Deactivation', 'Uninstall', 'Settings API', 'Options API'],
      },
      {
        title: 'الأمان',
        description: 'حماية الإضافة',
        topics: ['Nonces', 'Data Validation', 'Data Sanitization', 'Escaping Output', 'Capabilities', 'SQL Injection Prevention'],
      },
      {
        title: 'ميزات متقدمة',
        description: 'تطوير متقدم',
        topics: ['Custom Post Types', 'Custom Taxonomies', 'Meta Boxes', 'REST API', 'Gutenberg Blocks', 'AJAX in WordPress'],
      },
      {
        title: 'النشر والتوزيع',
        description: 'نشر الإضافة',
        topics: ['Internationalization i18n', 'Documentation', 'WordPress.org Guidelines', 'Version Control', 'Automated Testing', 'Freemius/EDD'],
      },
    ],
  },
  {
    id: 'vue',
    title: 'Vue.js Developer Roadmap',
    languageName: 'JavaScript',
    description: 'مسار تعلم Vue.js لتطوير واجهات المستخدم',
    sections: [
      {
        title: 'أساسيات Vue',
        description: 'البداية مع Vue',
        topics: ['Vue Instance', 'Template Syntax', 'Directives', 'Computed Properties', 'Watchers', 'Class & Style Bindings'],
      },
      {
        title: 'المكونات',
        description: 'Components',
        topics: ['Component Basics', 'Props', 'Events', 'Slots', 'Dynamic Components', 'Async Components'],
      },
      {
        title: 'Composition API',
        description: 'Vue 3 Composition',
        topics: ['ref و reactive', 'computed', 'watch و watchEffect', 'Lifecycle Hooks', 'Composables', 'Provide/Inject'],
      },
      {
        title: 'إدارة الحالة والتوجيه',
        description: 'State & Routing',
        topics: ['Vue Router', 'Route Guards', 'Pinia', 'Vuex (Legacy)', 'Persisted State', 'Navigation'],
      },
      {
        title: 'الأدوات والنشر',
        description: 'Tooling',
        topics: ['Vite', 'Vue DevTools', 'Testing with Vitest', 'Nuxt.js', 'SSR/SSG', 'Deployment'],
      },
    ],
  },
  {
    id: 'nestjs',
    title: 'NestJS Developer Roadmap',
    languageName: 'TypeScript',
    description: 'مسار تعلم NestJS لتطوير Backend',
    sections: [
      {
        title: 'أساسيات NestJS',
        description: 'البداية مع Nest',
        topics: ['تثبيت NestJS', 'بنية المشروع', 'Modules', 'Controllers', 'Providers/Services', 'Dependency Injection'],
      },
      {
        title: 'التعامل مع البيانات',
        description: 'Database',
        topics: ['TypeORM Integration', 'Prisma Integration', 'Entities', 'Repositories', 'Migrations', 'Transactions'],
      },
      {
        title: 'المصادقة والتفويض',
        description: 'Auth & Security',
        topics: ['Passport.js', 'JWT Strategy', 'Local Strategy', 'Guards', 'Roles & Permissions', 'Rate Limiting'],
      },
      {
        title: 'ميزات متقدمة',
        description: 'Advanced Features',
        topics: ['Middleware', 'Interceptors', 'Pipes', 'Exception Filters', 'Custom Decorators', 'Events'],
      },
      {
        title: 'Microservices & Testing',
        description: 'المتقدم',
        topics: ['GraphQL Integration', 'WebSockets', 'Microservices', 'Message Queues', 'Unit Testing', 'E2E Testing'],
      },
    ],
  },
  {
    id: 'nextjs',
    title: 'Next.js Developer Roadmap',
    languageName: 'TypeScript',
    description: 'مسار تعلم Next.js لتطوير تطبيقات React',
    sections: [
      {
        title: 'أساسيات Next.js',
        description: 'البداية مع Next',
        topics: ['إنشاء مشروع Next', 'App Router vs Pages', 'File-based Routing', 'Layouts', 'Loading & Error States', 'Linking & Navigation'],
      },
      {
        title: 'جلب البيانات',
        description: 'Data Fetching',
        topics: ['Server Components', 'Client Components', 'fetch في Server', 'Caching', 'Revalidation', 'Parallel Fetching'],
      },
      {
        title: 'Server Actions',
        description: 'الإجراءات',
        topics: ['Form Actions', 'Server Actions', 'Mutations', 'Optimistic Updates', 'Error Handling', 'Validation'],
      },
      {
        title: 'التحسين',
        description: 'Optimization',
        topics: ['Image Component', 'Font Optimization', 'Metadata API', 'Static Generation', 'Dynamic Rendering', 'Streaming'],
      },
      {
        title: 'النشر والإنتاج',
        description: 'Deployment',
        topics: ['Vercel Deployment', 'Self-hosting', 'Environment Variables', 'Edge Runtime', 'Middleware', 'Analytics'],
      },
    ],
  },
  {
    id: 'javascript',
    title: 'JavaScript Developer Roadmap',
    languageName: 'JavaScript',
    description: 'مسار تعلم JavaScript من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'أساسيات JavaScript',
        description: 'الأساسيات',
        topics: ['المتغيرات let/const/var', 'أنواع البيانات', 'العمليات', 'الشروط', 'الحلقات', 'الدوال'],
      },
      {
        title: 'البيانات والكائنات',
        description: 'Data Structures',
        topics: ['Arrays و Methods', 'Objects', 'Destructuring', 'Spread/Rest', 'Maps و Sets', 'JSON'],
      },
      {
        title: 'البرمجة المتقدمة',
        description: 'Advanced JS',
        topics: ['Closures', 'Prototypes', 'Classes', 'this Keyword', 'Call/Apply/Bind', 'Modules ES6'],
      },
      {
        title: 'البرمجة غير المتزامنة',
        description: 'Async Programming',
        topics: ['Callbacks', 'Promises', 'Async/Await', 'Event Loop', 'Fetch API', 'Error Handling'],
      },
      {
        title: 'DOM و Browser APIs',
        description: 'التعامل مع المتصفح',
        topics: ['DOM Manipulation', 'Events', 'Local Storage', 'Web APIs', 'Fetch/Axios', 'WebSockets'],
      },
    ],
  },
  {
    id: 'fastapi',
    title: 'FastAPI Developer Roadmap',
    languageName: 'Python',
    description: 'مسار تعلم FastAPI لتطوير APIs سريعة من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'البداية مع FastAPI',
        topics: ['تثبيت Python و pip', 'تثبيت FastAPI و Uvicorn', 'أول API بسيط', 'فهم المسارات Routes', 'Path Parameters', 'Query Parameters'],
      },
      {
        title: 'المستوى المتوسط - البيانات',
        description: 'التعامل مع البيانات',
        topics: ['Request Body', 'Response Models', 'Pydantic Models', 'Field Validation', 'Custom Validators', 'Nested Models'],
      },
      {
        title: 'المستوى المتقدم - قواعد البيانات',
        description: 'Database Integration',
        topics: ['SQLAlchemy', 'Async SQLAlchemy', 'Alembic Migrations', 'CRUD Operations', 'Tortoise ORM', 'MongoDB Integration'],
      },
      {
        title: 'المستوى الاحترافي - الأمان والنشر',
        description: 'Security & Deployment',
        topics: ['OAuth2 Password Flow', 'JWT Tokens', 'Password Hashing', 'Background Tasks', 'WebSockets', 'Docker Deployment'],
      },
    ],
  },
  {
    id: 'flutter',
    title: 'Flutter & Dart Developer Roadmap',
    languageName: 'Dart',
    description: 'مسار تعلم Flutter و Dart لتطوير تطبيقات الموبايل من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Dart',
        description: 'تعلم لغة Dart',
        topics: ['تثبيت Dart SDK', 'المتغيرات وأنواع البيانات', 'العمليات والتعبيرات', 'الجمل الشرطية', 'الحلقات التكرارية', 'الدوال Functions'],
      },
      {
        title: 'المستوى المبتدئ - Dart المتقدم',
        description: 'مفاهيم Dart المتقدمة',
        topics: ['Classes و Objects', 'الوراثة Inheritance', 'Abstract Classes', 'Mixins', 'Generics', 'Async/Await و Futures'],
      },
      {
        title: 'المستوى المتوسط - أساسيات Flutter',
        description: 'البداية مع Flutter',
        topics: ['تثبيت Flutter SDK', 'بنية مشروع Flutter', 'Widgets الأساسية', 'StatelessWidget vs StatefulWidget', 'Hot Reload', 'Material Design'],
      },
      {
        title: 'المستوى المتوسط - واجهات المستخدم',
        description: 'بناء الواجهات',
        topics: ['Layouts (Row, Column, Stack)', 'ListView و GridView', 'Navigation و Routing', 'Forms و Validation', 'Themes و Styling', 'Responsive Design'],
      },
      {
        title: 'المستوى المتقدم - إدارة الحالة',
        description: 'State Management',
        topics: ['setState', 'Provider', 'Riverpod', 'BLoC Pattern', 'GetX', 'Redux (اختياري)'],
      },
      {
        title: 'المستوى الاحترافي - الميزات المتقدمة',
        description: 'Advanced Features',
        topics: ['HTTP و REST APIs', 'Local Storage (Hive, SQLite)', 'Firebase Integration', 'Push Notifications', 'Maps و Location', 'Testing و CI/CD'],
      },
    ],
  },
  {
    id: 'nodejs',
    title: 'Node.js Developer Roadmap',
    languageName: 'Node.js',
    description: 'مسار تعلم Node.js لبناء تطبيقات Backend من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'فهم Node.js',
        topics: ['ما هو Node.js؟', 'تشغيل سكربت Node', 'npm و npx', 'Modules (CommonJS/ESM)', 'التعامل مع الملفات fs', 'HTTP module'],
      },
      {
        title: 'المستوى المتوسط - البرمجة غير المتزامنة',
        description: 'Async في Node',
        topics: ['Event Loop', 'Callbacks', 'Promises', 'Async/Await', 'Timers', 'Error Handling'],
      },
      {
        title: 'المستوى المتوسط - بناء خدمات',
        description: 'Building Services',
        topics: ['Environment Variables', 'Logging', 'Configuration', 'Validation', 'Testing Basics', 'Debugging'],
      },
      {
        title: 'المستوى المتقدم - الأداء',
        description: 'Performance',
        topics: ['Streams', 'Clustering', 'Memory Leaks', 'Profiling', 'Caching', 'Rate Limiting'],
      },
      {
        title: 'المستوى الاحترافي - النشر والإنتاج',
        description: 'Production',
        topics: ['Security Best Practices', 'Docker', 'CI/CD', 'Monitoring', 'Scaling', 'Deployment Strategies'],
      },
    ],
  },
  {
    id: 'express',
    title: 'Express.js API Roadmap',
    languageName: 'Node.js',
    description: 'مسار تعلم Express.js لبناء REST APIs من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - البداية',
        description: 'أساسيات Express',
        topics: ['إنشاء مشروع Express', 'Routing Basics', 'Request/Response', 'Middleware Basics', 'Static Files', 'Error Middleware'],
      },
      {
        title: 'المستوى المتوسط - بناء API حقيقية',
        description: 'API Patterns',
        topics: ['MVC Structure', 'Validation (Zod)', 'Pagination', 'Filtering & Sorting', 'File Uploads', 'CORS'],
      },
      {
        title: 'المستوى المتقدم - الأمان',
        description: 'Auth & Security',
        topics: ['JWT Auth', 'Sessions', 'RBAC', 'Helmet', 'Rate Limiting', 'Input Sanitization'],
      },
      {
        title: 'المستوى المتقدم - قواعد البيانات',
        description: 'Database',
        topics: ['MongoDB Integration', 'Mongoose', 'Transactions', 'Indexes', 'Migrations Concepts', 'Caching with Redis'],
      },
      {
        title: 'المستوى الاحترافي - الإنتاج',
        description: 'Production',
        topics: ['Testing (Jest/Supertest)', 'Logging & Observability', 'Docker', 'CI/CD', 'Deployment', 'Performance Tuning'],
      },
    ],
  },
  {
    id: 'angular',
    title: 'Angular Developer Roadmap',
    languageName: 'Angular',
    description: 'مسار تعلم Angular لتطوير تطبيقات Frontend من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'البداية مع Angular',
        topics: ['TypeScript Basics', 'Angular CLI', 'Components', 'Templates', 'Data Binding', 'Directives'],
      },
      {
        title: 'المستوى المتوسط - الهيكلة',
        description: 'Architecture',
        topics: ['Modules', 'Routing', 'Lazy Loading', 'Services', 'Dependency Injection', 'Pipes'],
      },
      {
        title: 'المستوى المتوسط - النماذج والاتصال',
        description: 'Forms & HTTP',
        topics: ['Reactive Forms', 'Form Validation', 'HttpClient', 'Interceptors', 'RxJS Basics', 'Error Handling'],
      },
      {
        title: 'المستوى المتقدم - إدارة الحالة والاختبار',
        description: 'State & Testing',
        topics: ['RxJS Advanced', 'NgRx Basics', 'Signals (حسب الإصدار)', 'Unit Testing', 'E2E Testing', 'Performance Optimization'],
      },
      {
        title: 'المستوى الاحترافي - النشر',
        description: 'Production',
        topics: ['Build Optimization', 'SSR Concepts', 'Security', 'CI/CD', 'Deployment', 'Monitoring'],
      },
    ],
  },
  {
    id: 'mongodb',
    title: 'MongoDB Roadmap',
    languageName: 'MongoDB',
    description: 'مسار تعلم MongoDB من المبتدئ إلى المحترف (الاستعلامات، التصميم، والأداء)',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'مفاهيم MongoDB',
        topics: ['Documents vs Collections', 'Mongo Shell/Compass', 'CRUD Basics', 'Data Types', 'Filtering', 'Sorting & Limiting'],
      },
      {
        title: 'المستوى المتوسط - التصميم',
        description: 'Schema Design',
        topics: ['Embedding vs Referencing', 'Relationships Patterns', 'Validation Rules', 'Aggregation Basics', 'Indexes Basics', 'Text Search'],
      },
      {
        title: 'المستوى المتقدم - Aggregation & Performance',
        description: 'Advanced Queries',
        topics: ['Aggregation Pipeline', '$lookup', 'Facets', 'Explain Plans', 'Index Optimization', 'Sharding Concepts'],
      },
      {
        title: 'المستوى الاحترافي - الإنتاج',
        description: 'Production',
        topics: ['Replication Concepts', 'Backups', 'Security (Users/Roles)', 'Monitoring', 'Migration Strategies', 'Scaling'],
      },
    ],
  },
  {
    id: 'git',
    title: 'Git Roadmap',
    languageName: 'Git',
    description: 'مسار تعلم Git وإدارة الإصدارات من المبتدئ إلى المحترف',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'الأساسيات',
        topics: ['ما هو Git؟', 'init/clone', 'add/commit', 'status/log', 'diff', 'undo basics (restore/reset)'],
      },
      {
        title: 'المستوى المتوسط - الفروع والتعاون',
        description: 'Branches',
        topics: ['branch/checkout/switch', 'merge', 'rebase basics', 'resolving conflicts', 'remote (push/pull/fetch)', 'pull requests concepts'],
      },
      {
        title: 'المستوى المتقدم - إدارة التاريخ',
        description: 'History',
        topics: ['interactive rebase', 'cherry-pick', 'reflog', 'bisect', 'tags & releases', 'submodules basics'],
      },
      {
        title: 'المستوى الاحترافي - أفضل الممارسات',
        description: 'Best Practices',
        topics: ['GitFlow vs Trunk-Based', 'Conventional Commits', 'Semantic Versioning', 'CI/CD integration concepts', 'Security scanning concepts', 'Monorepo basics'],
      },
    ],
  },
];

export default function DefaultRoadmapsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoadmaps, setSelectedRoadmaps] = useState<Set<string>>(new Set());
  
  const { addRoadmap, addSection, addTopic, roadmaps } = useRoadmapStore();
  const { programmingLanguages, addProgrammingLanguage } = useBlogStore();

  const toggleRoadmap = (id: string) => {
    const newSet = new Set(selectedRoadmaps);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRoadmaps(newSet);
  };

  const selectAll = () => {
    setSelectedRoadmaps(new Set(defaultRoadmaps.map(r => r.id)));
  };

  const deselectAll = () => {
    setSelectedRoadmaps(new Set());
  };

  const handleAddRoadmaps = async () => {
    if (selectedRoadmaps.size === 0) {
      toast.error('اختر خريطة طريق واحدة على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      for (const roadmapId of selectedRoadmaps) {
        const roadmap = defaultRoadmaps.find(r => r.id === roadmapId);
        if (!roadmap) continue;

        // Check if roadmap already exists
        const exists = roadmaps.some(r => r.title === roadmap.title);
        if (exists) {
          toast.info(`خريطة "${roadmap.title}" موجودة بالفعل`);
          continue;
        }

        // Find or create language
        let language = programmingLanguages.find(
          l => l.name.toLowerCase() === roadmap.languageName.toLowerCase()
        );
        
        if (!language) {
          addProgrammingLanguage({
            name: roadmap.languageName,
            slug: roadmap.languageName.toLowerCase().replace(/\s+/g, '-'),
            color: getLanguageColor(roadmap.languageName),
            icon: roadmap.languageName.toLowerCase(),
          });
          // Get the newly added language
          const updatedLanguages = useBlogStore.getState().programmingLanguages;
          language = updatedLanguages.find(l => l.name === roadmap.languageName);
        }

        // Create roadmap
        const newRoadmapId = addRoadmap({
          title: roadmap.title,
          description: roadmap.description,
          languageId: language.id,
        });

        // Helper function to add topics with subtopics
        const addTopicsToSection = (sectionId: string, topics: (string | DefaultRoadmapTopic)[]) => {
          topics.forEach(topic => {
            if (typeof topic === 'string') {
              // Simple topic without subtopics
              addTopic(sectionId, {
                title: topic,
                completed: false,
                postId: undefined,
              });
            } else {
              // Topic with subtopics
              const parentTopicId = sectionId + '_' + Math.random().toString(36).substr(2, 9);
              addTopic(sectionId, {
                title: topic.title,
                completed: false,
                postId: undefined,
              });
              
              // Get the last added topic to add subtopics to it
              const section = useRoadmapStore.getState().roadmapSections.find(s => s.id === sectionId);
              if (section && topic.subTopics) {
                const lastTopicIndex = section.topics.length - 1;
                const lastTopic = section.topics[lastTopicIndex];
                if (lastTopic) {
                  topic.subTopics.forEach(subTopicTitle => {
                    addSubTopic(sectionId, lastTopic.id, {
                      title: subTopicTitle,
                      completed: false,
                      postId: undefined,
                    });
                  });
                }
              }
            }
          });
        };

        // Add sections and topics
        roadmap.sections.forEach((section, sIndex) => {
          const sectionId = addSection({
            roadmapId: newRoadmapId,
            title: section.title,
            description: section.description,
            sortOrder: sIndex + 1,
          });

          // Add topics to main section
          addTopicsToSection(sectionId, section.topics);

          // Add subsections if they exist
          if (section.subSections) {
            section.subSections.forEach((subSection, subIndex) => {
              const subSectionId = addSection({
                roadmapId: newRoadmapId,
                title: `  ↳ ${subSection.title}`,
                description: subSection.description,
                sortOrder: sIndex + 1 + (subIndex + 1) * 0.1,
              });
              
              addTopicsToSection(subSectionId, subSection.topics);
            });
          }
        });
      }

      toast.success(`تم إضافة ${selectedRoadmaps.size} خريطة طريق بنجاح!`);
      setIsOpen(false);
      setSelectedRoadmaps(new Set());
    } catch (error) {
      console.error('Error adding roadmaps:', error);
      toast.error('حدث خطأ أثناء الإضافة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="h-4 w-4" />
          خرائط افتراضية
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة خرائط طرق افتراضية</DialogTitle>
          <DialogDescription>
            اختر خرائط الطرق التي تريد إضافتها للبدء بسرعة
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">
            {selectedRoadmaps.size} من {defaultRoadmaps.length} مختار
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              تحديد الكل
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              إلغاء الكل
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {defaultRoadmaps.map((roadmap) => (
            <div
              key={roadmap.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedRoadmaps.has(roadmap.id)
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => toggleRoadmap(roadmap.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedRoadmaps.has(roadmap.id)}
                  onCheckedChange={() => toggleRoadmap(roadmap.id)}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{roadmap.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{roadmap.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {roadmap.languageName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {roadmap.sections.length} أقسام
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            إلغاء
          </Button>
          <Button onClick={handleAddRoadmaps} disabled={isLoading || selectedRoadmaps.size === 0}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الإضافة...
              </>
            ) : (
              `إضافة ${selectedRoadmaps.size} خريطة`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getLanguageColor(languageName: string): string {
  const colors: Record<string, string> = {
    'Python': '#3776AB',
    'JavaScript': '#F7DF1E',
    'TypeScript': '#3178C6',
    'PHP': '#777BB4',
    'Dart': '#0175C2',
    'Node.js': '#339933',
    'MongoDB': '#47A248',
    'Git': '#F05032',
    'Angular': '#DD0031',
  };
  return colors[languageName] || '#6366F1';
}
