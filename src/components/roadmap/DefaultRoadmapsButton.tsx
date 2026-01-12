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
    description: 'مسار تعلم إطار Django من المبتدئ إلى المحترف - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Django',
        description: 'البداية مع Django',
        topics: [
          { title: 'تثبيت Django', subTopics: ['Python و pip', 'Virtual Environment', 'Django Installation', 'VS Code Setup'] },
          { title: 'إنشاء مشروع جديد', subTopics: ['django-admin startproject', 'manage.py Commands', 'Development Server'] },
          { title: 'بنية المشروع', subTopics: ['settings.py', 'urls.py', 'wsgi.py', 'asgi.py'] },
          { title: 'التطبيقات Apps', subTopics: ['startapp Command', 'App Structure', 'App Registration'] },
          { title: 'URLs و Views', subTopics: ['URL Patterns', 'Function-Based Views', 'HttpRequest/Response', 'URL Parameters'] }
        ],
      },
      {
        title: 'المستوى المبتدئ - Templates والنماذج',
        description: 'واجهات المستخدم',
        topics: [
          { title: 'Template Language', subTopics: ['Variables', 'Tags', 'Filters', 'Comments'] },
          { title: 'Static Files', subTopics: ['CSS/JS', 'Images', 'Collectstatic', 'WhiteNoise'] },
          { title: 'Template Inheritance', subTopics: ['base.html', 'blocks', 'extends', 'include'] },
          { title: 'Forms', subTopics: ['Form Class', 'Form Rendering', 'Validation', 'Form Errors'] },
          'CSRF Protection'
        ],
      },
      {
        title: 'المستوى المتوسط - قواعد البيانات و ORM',
        description: 'التعامل مع البيانات',
        topics: [
          { title: 'Models', subTopics: ['Field Types', 'Model Methods', 'Meta Options', '__str__ Method'] },
          { title: 'Migrations', subTopics: ['makemigrations', 'migrate', 'Migration Files', 'Data Migrations'] },
          { title: 'QuerySets', subTopics: ['filter()', 'exclude()', 'get()', 'all()', 'Chaining', 'Q Objects'] },
          { title: 'Relationships', subTopics: ['ForeignKey', 'OneToOne', 'ManyToMany', 'Related Names'] },
          { title: 'Admin Interface', subTopics: ['ModelAdmin', 'List Display', 'Filters', 'Search'] }
        ],
      },
      {
        title: 'المستوى المتقدم - المصادقة والأمان',
        description: 'الأمان والمستخدمين',
        topics: [
          { title: 'Authentication System', subTopics: ['User Model', 'Login/Logout', 'Password Management', 'Decorators'] },
          { title: 'Permissions & Groups', subTopics: ['Model Permissions', 'Custom Permissions', 'User Groups', 'has_perm()'] },
          { title: 'Custom User Model', subTopics: ['AbstractUser', 'AbstractBaseUser', 'UserManager'] },
          { title: 'Security', subTopics: ['CSRF', 'XSS', 'SQL Injection', 'Clickjacking', 'HTTPS'] }
        ],
      },
      {
        title: 'المستوى الاحترافي - APIs والميزات المتقدمة',
        description: 'Django REST Framework',
        subSections: [
          {
            title: 'Django REST Framework',
            description: 'بناء APIs',
            topics: [
              { title: 'Serializers', subTopics: ['ModelSerializer', 'Validation', 'Nested Serializers'] },
              { title: 'Views', subTopics: ['APIView', 'ViewSets', 'Generic Views', 'Mixins'] },
              { title: 'Authentication', subTopics: ['Token Auth', 'JWT', 'Session Auth', 'Permissions'] },
              'Pagination',
              'Filtering & Search'
            ]
          },
          {
            title: 'Advanced Features',
            description: 'ميزات متقدمة',
            topics: [
              { title: 'Class-Based Views', subTopics: ['TemplateView', 'ListView', 'DetailView', 'FormView'] },
              { title: 'Middleware', subTopics: ['Custom Middleware', 'Process Request', 'Process Response'] },
              'Signals',
              'Caching',
              'Celery Tasks'
            ]
          },
          {
            title: 'Testing & Deployment',
            description: 'الاختبار والنشر',
            topics: [
              { title: 'Testing', subTopics: ['TestCase', 'Client', 'Fixtures', 'Coverage'] },
              { title: 'Deployment', subTopics: ['Gunicorn', 'Nginx', 'PostgreSQL', 'Docker', 'CI/CD'] },
              'Monitoring & Logging'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'laravel',
    title: 'Laravel Developer Roadmap',
    languageName: 'PHP',
    description: 'مسار تعلم إطار Laravel من المبتدئ إلى المحترف - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Laravel',
        description: 'البداية مع Laravel',
        topics: [
          { title: 'التثبيت والإعداد', subTopics: ['PHP و Composer', 'Laravel Installer', 'Valet/Homestead', 'Laravel Sail'] },
          { title: 'بنية المشروع', subTopics: ['Folder Structure', '.env File', 'Config Files', 'Service Providers'] },
          { title: 'Artisan CLI', subTopics: ['Make Commands', 'Migrate', 'Serve', 'Tinker'] },
          { title: 'Routing', subTopics: ['Basic Routes', 'Route Parameters', 'Named Routes', 'Route Groups', 'Resource Routes'] },
          { title: 'Controllers', subTopics: ['Creating Controllers', 'Resource Controllers', 'Single Action', 'Dependency Injection'] },
          { title: 'Views و Blade', subTopics: ['Blade Syntax', 'Directives', 'Layouts', 'Components', 'Slots'] }
        ],
      },
      {
        title: 'المستوى المتوسط - قواعد البيانات',
        description: 'Eloquent ORM و Query Builder',
        topics: [
          { title: 'Migrations', subTopics: ['Creating Migrations', 'Schema Builder', 'Modifying Columns', 'Indexes'] },
          { title: 'Eloquent Models', subTopics: ['Model Creation', 'Mass Assignment', 'Accessors/Mutators', 'Casting'] },
          { title: 'Query Builder', subTopics: ['Select', 'Where', 'Join', 'Aggregates', 'Raw Queries'] },
          { title: 'Relationships', subTopics: ['One to One', 'One to Many', 'Many to Many', 'Polymorphic', 'Eager Loading'] },
          { title: 'Seeders & Factories', subTopics: ['Database Seeding', 'Model Factories', 'Faker'] },
          'Soft Deletes',
          'Eloquent Collections'
        ],
      },
      {
        title: 'المستوى المتقدم - المصادقة والأمان',
        description: 'حماية التطبيق',
        topics: [
          { title: 'Authentication', subTopics: ['Breeze', 'Jetstream', 'Fortify', 'UI Scaffolding'] },
          { title: 'Authorization', subTopics: ['Gates', 'Policies', 'Middleware Auth', 'Can Directive'] },
          { title: 'Security', subTopics: ['CSRF Protection', 'XSS Prevention', 'SQL Injection', 'Encryption', 'Hashing'] },
          { title: 'Middleware', subTopics: ['Creating Middleware', 'Global Middleware', 'Route Middleware', 'Middleware Groups'] }
        ],
      },
      {
        title: 'المستوى الاحترافي - الميزات المتقدمة',
        description: 'أدوات وميزات متقدمة',
        subSections: [
          {
            title: 'Async & Background Jobs',
            description: 'المهام الخلفية',
            topics: [
              { title: 'Queues', subTopics: ['Queue Configuration', 'Creating Jobs', 'Dispatching Jobs', 'Failed Jobs'] },
              { title: 'Task Scheduling', subTopics: ['Cron Jobs', 'Schedule Commands', 'Task Frequency'] },
              'Events & Listeners',
              'Broadcasting'
            ]
          },
          {
            title: 'API Development',
            description: 'بناء REST APIs',
            topics: [
              { title: 'API Resources', subTopics: ['Resource Classes', 'Resource Collections', 'Conditional Attributes'] },
              { title: 'API Authentication', subTopics: ['Sanctum', 'Passport', 'Token Management'] },
              'Rate Limiting',
              'API Versioning',
              { title: 'Testing', subTopics: ['Feature Tests', 'HTTP Tests', 'Database Testing'] }
            ]
          },
          {
            title: 'Advanced Topics',
            description: 'مواضيع متقدمة',
            topics: [
              { title: 'Service Container', subTopics: ['Binding', 'Resolving', 'Service Providers'] },
              { title: 'Packages', subTopics: ['Creating Packages', 'Package Discovery', 'Publishing Assets'] },
              'File Storage',
              { title: 'Mail & Notifications', subTopics: ['Mailable', 'Notification Channels', 'Queued Notifications'] },
              { title: 'Deployment', subTopics: ['Forge', 'Envoyer', 'Docker', 'Optimization'] }
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'react',
    title: 'React.js Developer Roadmap',
    languageName: 'JavaScript',
    description: 'مسار تعلم React.js لتطوير واجهات المستخدم - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات React',
        description: 'البداية مع React',
        topics: [
          { title: 'الإعداد والبداية', subTopics: ['Create React App', 'Vite', 'Node.js و npm', 'Dev Tools'] },
          { title: 'JSX', subTopics: ['JSX Syntax', 'Expressions', 'Attributes', 'Children', 'Fragments'] },
          { title: 'Components', subTopics: ['Function Components', 'Class Components', 'Props', 'Children Props'] },
          { title: 'State', subTopics: ['useState Hook', 'State Updates', 'Multiple States', 'State Best Practices'] },
          { title: 'Events', subTopics: ['Event Handling', 'Synthetic Events', 'Event Parameters', 'Prevent Default'] },
          { title: 'Conditional Rendering', subTopics: ['if/else', 'Ternary', '&&', 'Switch Case'] },
          { title: 'Lists & Keys', subTopics: ['map()', 'Keys', 'Index as Key', 'Fragment Keys'] }
        ],
      },
      {
        title: 'المستوى المتوسط - React Hooks',
        description: 'استخدام Hooks المتقدمة',
        topics: [
          { title: 'useState', subTopics: ['Basic Usage', 'Functional Updates', 'Lazy Initial State'] },
          { title: 'useEffect', subTopics: ['Side Effects', 'Dependencies', 'Cleanup', 'Multiple Effects'] },
          { title: 'useContext', subTopics: ['Context API', 'Provider', 'Consumer', 'Multiple Contexts'] },
          { title: 'useReducer', subTopics: ['Reducer Function', 'Actions', 'Complex State', 'vs useState'] },
          { title: 'Performance Hooks', subTopics: ['useMemo', 'useCallback', 'React.memo', 'When to Use'] },
          { title: 'useRef', subTopics: ['DOM Refs', 'Mutable Values', 'useImperativeHandle'] },
          { title: 'Custom Hooks', subTopics: ['Creating Hooks', 'Reusability', 'Hooks Patterns'] }
        ],
      },
      {
        title: 'المستوى المتقدم - إدارة الحالة',
        description: 'State Management Solutions',
        topics: [
          { title: 'Context API', subTopics: ['createContext', 'useContext', 'Context Patterns', 'Performance'] },
          { title: 'Redux Toolkit', subTopics: ['Store', 'Slices', 'Reducers', 'Actions', 'Thunks', 'RTK Query'] },
          { title: 'Zustand', subTopics: ['Store Creation', 'Selectors', 'Middleware', 'Persist'] },
          { title: 'Data Fetching', subTopics: ['React Query', 'SWR', 'Caching', 'Mutations', 'Infinite Queries'] },
          'Jotai',
          'Recoil'
        ],
      },
      {
        title: 'المستوى الاحترافي - التوجيه والنماذج',
        description: 'Routing & Forms',
        subSections: [
          {
            title: 'React Router',
            description: 'التوجيه',
            topics: [
              { title: 'React Router v6', subTopics: ['BrowserRouter', 'Routes', 'Route', 'Navigate', 'Outlet'] },
              { title: 'Navigation', subTopics: ['Link', 'NavLink', 'useNavigate', 'useParams', 'useSearchParams'] },
              'Protected Routes',
              'Nested Routes',
              'Lazy Loading Routes'
            ]
          },
          {
            title: 'Forms & Validation',
            description: 'النماذج',
            topics: [
              { title: 'React Hook Form', subTopics: ['useForm', 'register', 'handleSubmit', 'Validation'] },
              { title: 'Validation', subTopics: ['Yup', 'Zod', 'Custom Validation', 'Error Messages'] },
              'Formik',
              'File Uploads',
              'Form State'
            ]
          },
          {
            title: 'Performance & Testing',
            description: 'الأداء والاختبار',
            topics: [
              { title: 'Performance', subTopics: ['React.memo', 'useMemo', 'useCallback', 'Code Splitting', 'Lazy Loading'] },
              { title: 'Testing', subTopics: ['Jest', 'React Testing Library', 'Unit Tests', 'Integration Tests'] },
              'E2E Testing with Cypress',
              'Profiler',
              'Error Boundaries'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'wordpress',
    title: 'WordPress Plugin Developer Roadmap',
    languageName: 'PHP',
    description: 'مسار تعلم تطوير إضافات WordPress - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات WordPress',
        description: 'فهم WordPress',
        topics: [
          { title: 'بنية WordPress', subTopics: ['wp-content', 'wp-includes', 'wp-admin', 'Core Files'] },
          { title: 'The Loop', subTopics: ['WP_Query', 'have_posts()', 'the_post()', 'Loop Structure'] },
          { title: 'Template Hierarchy', subTopics: ['Template Files', 'Page Templates', 'Template Tags'] },
          { title: 'Hooks', subTopics: ['Actions vs Filters', 'add_action', 'add_filter', 'Priority', 'do_action', 'apply_filters'] },
          { title: 'WordPress APIs', subTopics: ['Options API', 'Settings API', 'Widgets API', 'Shortcode API'] },
          { title: 'Database', subTopics: ['wpdb Class', 'Table Structure', 'Custom Tables', 'Queries'] }
        ],
      },
      {
        title: 'المستوى المتوسط - تطوير الإضافات',
        description: 'بناء Plugin',
        topics: [
          { title: 'Plugin Structure', subTopics: ['Main Plugin File', 'Folder Structure', 'Naming Conventions'] },
          { title: 'Plugin Headers', subTopics: ['Plugin Name', 'Description', 'Version', 'Author', 'License'] },
          { title: 'Activation/Deactivation', subTopics: ['register_activation_hook', 'register_deactivation_hook', 'Cleanup'] },
          { title: 'Uninstall', subTopics: ['uninstall.php', 'register_uninstall_hook', 'Database Cleanup'] },
          { title: 'Settings Pages', subTopics: ['add_menu_page', 'add_submenu_page', 'Settings API', 'Options'] },
          'Admin Notices'
        ],
      },
      {
        title: 'المستوى المتقدم - الأمان',
        description: 'حماية الإضافة',
        topics: [
          { title: 'Nonces', subTopics: ['wp_nonce_field', 'wp_verify_nonce', 'check_admin_referer'] },
          { title: 'Data Validation', subTopics: ['Input Validation', 'Type Checking', 'Allowed Values'] },
          { title: 'Data Sanitization', subTopics: ['sanitize_text_field', 'sanitize_email', 'wp_kses', 'absint'] },
          { title: 'Escaping Output', subTopics: ['esc_html', 'esc_attr', 'esc_url', 'wp_kses_post'] },
          { title: 'Capabilities', subTopics: ['current_user_can', 'Role Management', 'Custom Capabilities'] },
          'SQL Injection Prevention'
        ],
      },
      {
        title: 'المستوى الاحترافي - ميزات متقدمة',
        description: 'تطوير متقدم',
        subSections: [
          {
            title: 'Custom Content',
            description: 'محتوى مخصص',
            topics: [
              { title: 'Custom Post Types', subTopics: ['register_post_type', 'Arguments', 'Labels', 'Supports'] },
              { title: 'Custom Taxonomies', subTopics: ['register_taxonomy', 'Hierarchical', 'Terms'] },
              { title: 'Meta Boxes', subTopics: ['add_meta_box', 'Meta Data', 'Custom Fields'] },
              'Custom Fields',
              'Post Meta'
            ]
          },
          {
            title: 'Modern Development',
            description: 'التطوير الحديث',
            topics: [
              { title: 'REST API', subTopics: ['register_rest_route', 'Endpoints', 'Authentication', 'Permissions'] },
              { title: 'Gutenberg Blocks', subTopics: ['Block Development', 'JSX', 'React', 'block.json'] },
              { title: 'AJAX', subTopics: ['wp_ajax_', 'admin-ajax.php', 'Nonces', 'JSON Response'] },
              'Enqueue Scripts/Styles',
              'Localization (i18n)'
            ]
          },
          {
            title: 'Distribution',
            description: 'النشر والتوزيع',
            topics: [
              { title: 'Internationalization', subTopics: ['__(), _e()', 'Text Domain', 'POT Files', 'Translations'] },
              { title: 'Documentation', subTopics: ['readme.txt', 'Code Comments', 'PHPDoc', 'User Guide'] },
              { title: 'WordPress.org', subTopics: ['Plugin Guidelines', 'SVN Repository', 'Review Process'] },
              { title: 'Testing', subTopics: ['PHPUnit', 'WP_Mock', 'Integration Tests'] },
              { title: 'Premium Plugins', subTopics: ['Licensing', 'Updates', 'Freemius', 'EDD'] }
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'vue',
    title: 'Vue.js Developer Roadmap',
    languageName: 'JavaScript',
    description: 'مسار تعلم Vue.js لتطوير واجهات المستخدم - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Vue',
        description: 'البداية مع Vue 3',
        topics: [
          { title: 'الإعداد والبداية', subTopics: ['Vue CLI', 'Vite', 'CDN Setup', 'Vue DevTools'] },
          { title: 'Vue Instance', subTopics: ['createApp', 'mount', 'App Configuration', 'Global Properties'] },
          { title: 'Template Syntax', subTopics: ['Interpolation', 'Directives', 'Expressions', 'Raw HTML'] },
          { title: 'Directives', subTopics: ['v-bind', 'v-model', 'v-if/v-else', 'v-for', 'v-show', 'v-on'] },
          { title: 'Computed Properties', subTopics: ['Getters', 'Setters', 'vs Methods', 'Caching'] },
          { title: 'Watchers', subTopics: ['watch', 'Deep Watch', 'Immediate', 'watchEffect'] },
          'Class & Style Bindings'
        ],
      },
      {
        title: 'المستوى المتوسط - المكونات',
        description: 'Components في Vue',
        topics: [
          { title: 'Component Basics', subTopics: ['Registration', 'Props', 'Events', 'v-model'] },
          { title: 'Props', subTopics: ['Props Types', 'Validation', 'Default Values', 'Required Props'] },
          { title: 'Events', subTopics: ['$emit', 'Event Arguments', 'Event Validation', 'v-model'] },
          { title: 'Slots', subTopics: ['Default Slot', 'Named Slots', 'Scoped Slots', 'Slot Props'] },
          { title: 'Component Communication', subTopics: ['Parent-Child', 'Provide/Inject', 'Event Bus', 'State Management'] },
          'Dynamic Components',
          'Async Components'
        ],
      },
      {
        title: 'المستوى المتقدم - Composition API',
        description: 'Vue 3 Composition API',
        topics: [
          { title: 'Reactivity', subTopics: ['ref', 'reactive', 'toRef', 'toRefs', 'isRef', 'unref'] },
          { title: 'Computed', subTopics: ['computed', 'Writable Computed', 'Getters/Setters'] },
          { title: 'Watchers', subTopics: ['watch', 'watchEffect', 'Deep Watch', 'Flush Timing'] },
          { title: 'Lifecycle Hooks', subTopics: ['onMounted', 'onUpdated', 'onUnmounted', 'onBeforeMount'] },
          { title: 'Composables', subTopics: ['Creating Composables', 'Reusability', 'Patterns', 'VueUse'] },
          { title: 'Provide/Inject', subTopics: ['provide', 'inject', 'Reactivity', 'Symbol Keys'] },
          'Template Refs'
        ],
      },
      {
        title: 'المستوى الاحترافي - التوجيه وإدارة الحالة',
        description: 'Router & State Management',
        subSections: [
          {
            title: 'Vue Router',
            description: 'التوجيه',
            topics: [
              { title: 'Router Basics', subTopics: ['createRouter', 'RouterView', 'RouterLink', 'Dynamic Routes'] },
              { title: 'Navigation', subTopics: ['Programmatic Navigation', 'Route Params', 'Query Params', 'Hash Mode'] },
              { title: 'Route Guards', subTopics: ['beforeEach', 'beforeEnter', 'beforeRouteEnter', 'Meta Fields'] },
              'Nested Routes',
              'Lazy Loading'
            ]
          },
          {
            title: 'State Management',
            description: 'إدارة الحالة',
            topics: [
              { title: 'Pinia', subTopics: ['Stores', 'State', 'Getters', 'Actions', 'Plugins'] },
              { title: 'Pinia Advanced', subTopics: ['Composition API Stores', 'Persisting State', 'Store Subscriptions'] },
              'Vuex (Legacy)',
              'State Patterns'
            ]
          },
          {
            title: 'Tooling & Production',
            description: 'الأدوات والنشر',
            topics: [
              { title: 'Build Tools', subTopics: ['Vite', 'Webpack', 'Build Optimization'] },
              { title: 'Testing', subTopics: ['Vitest', 'Vue Test Utils', 'Component Testing', 'E2E'] },
              { title: 'SSR/SSG', subTopics: ['Nuxt.js', 'Server Side Rendering', 'Static Generation'] },
              'TypeScript',
              'Deployment'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'nestjs',
    title: 'NestJS Developer Roadmap',
    languageName: 'TypeScript',
    description: 'مسار تعلم NestJS لتطوير Backend - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات NestJS',
        description: 'البداية مع Nest',
        topics: [
          { title: 'التثبيت والإعداد', subTopics: ['Nest CLI', '@nestjs/cli', 'TypeScript Config', 'Project Creation'] },
          { title: 'بنية المشروع', subTopics: ['src/', 'main.ts', 'app.module', 'Folder Structure'] },
          { title: 'Modules', subTopics: ['@Module Decorator', 'Feature Modules', 'Shared Modules', 'Dynamic Modules'] },
          { title: 'Controllers', subTopics: ['@Controller', 'Route Handlers', 'HTTP Methods', 'Route Parameters'] },
          { title: 'Providers', subTopics: ['@Injectable', 'Services', 'Provider Scope', 'Custom Providers'] },
          { title: 'Dependency Injection', subTopics: ['Constructor Injection', 'Property Injection', 'Injection Tokens'] }
        ],
      },
      {
        title: 'المستوى المتوسط - التعامل مع البيانات',
        description: 'Database Integration',
        topics: [
          { title: 'TypeORM', subTopics: ['Connection', 'Entities', 'Repositories', 'Relations', 'QueryBuilder'] },
          { title: 'Prisma', subTopics: ['Prisma Client', 'Schema', 'Migrations', 'Queries'] },
          { title: 'Database Operations', subTopics: ['CRUD', 'Transactions', 'Relations', 'Eager/Lazy Loading'] },
          { title: 'Migrations', subTopics: ['Creating Migrations', 'Running Migrations', 'Schema Sync'] },
          'Validation with class-validator',
          'DTO (Data Transfer Objects)'
        ],
      },
      {
        title: 'المستوى المتقدم - المصادقة والتفويض',
        description: 'Auth & Security',
        topics: [
          { title: 'Passport.js', subTopics: ['@nestjs/passport', 'Strategies', 'Authentication Guards'] },
          { title: 'JWT Strategy', subTopics: ['JWT Tokens', '@nestjs/jwt', 'Token Generation', 'Token Validation'] },
          { title: 'Local Strategy', subTopics: ['Username/Password', 'Validation', 'Session'] },
          { title: 'Guards', subTopics: ['Authentication Guards', 'Authorization Guards', 'Role-based Guards'] },
          { title: 'Roles & Permissions', subTopics: ['@Roles Decorator', 'Role Guards', 'RBAC'] },
          'Rate Limiting'
        ],
      },
      {
        title: 'المستوى المتقدم - ميزات متقدمة',
        description: 'Advanced Features',
        subSections: [
          {
            title: 'Request Processing',
            description: 'معالجة الطلبات',
            topics: [
              { title: 'Middleware', subTopics: ['Functional Middleware', 'Class Middleware', 'Global Middleware'] },
              { title: 'Interceptors', subTopics: ['Response Mapping', 'Logging', 'Caching', 'Timeout'] },
              { title: 'Pipes', subTopics: ['Validation Pipes', 'Transformation Pipes', 'Custom Pipes'] },
              { title: 'Exception Filters', subTopics: ['HTTP Exceptions', 'Custom Exceptions', 'Global Filters'] },
              'Custom Decorators'
            ]
          },
          {
            title: 'Advanced Patterns',
            description: 'أنماط متقدمة',
            topics: [
              { title: 'Events', subTopics: ['EventEmitter', '@OnEvent', 'Event Patterns'] },
              { title: 'Queues', subTopics: ['Bull', 'Job Processing', 'Queue Management'] },
              { title: 'Caching', subTopics: ['Cache Manager', 'Redis', 'Cache Strategies'] },
              { title: 'Task Scheduling', subTopics: ['@nestjs/schedule', 'Cron Jobs', 'Intervals'] },
              'File Upload'
            ]
          },
          {
            title: 'Microservices & Testing',
            description: 'المتقدم',
            topics: [
              { title: 'GraphQL', subTopics: ['@nestjs/graphql', 'Resolvers', 'Schema First', 'Code First'] },
              { title: 'WebSockets', subTopics: ['@nestjs/websockets', 'Gateways', 'Real-time'] },
              { title: 'Microservices', subTopics: ['Transport Layer', 'Message Patterns', 'gRPC'] },
              { title: 'Testing', subTopics: ['Unit Tests', 'E2E Tests', 'Test Utilities', 'Mocking'] },
              { title: 'Production', subTopics: ['Configuration', 'Logging', 'Monitoring', 'Docker', 'Deployment'] }
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'nextjs',
    title: 'Next.js Developer Roadmap',
    languageName: 'TypeScript',
    description: 'مسار تعلم Next.js لتطوير تطبيقات React - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Next.js',
        description: 'البداية مع Next.js 13+',
        topics: [
          { title: 'الإعداد', subTopics: ['create-next-app', 'TypeScript Setup', 'Project Structure'] },
          { title: 'App Router vs Pages', subTopics: ['App Directory', 'Pages Directory', 'Migration', 'Differences'] },
          { title: 'File-based Routing', subTopics: ['page.tsx', 'Dynamic Routes', 'Route Groups', 'Parallel Routes'] },
          { title: 'Layouts', subTopics: ['Root Layout', 'Nested Layouts', 'Template', 'Metadata'] },
          { title: 'Loading & Error', subTopics: ['loading.tsx', 'error.tsx', 'not-found.tsx', 'Streaming'] },
          { title: 'Navigation', subTopics: ['Link Component', 'useRouter', 'usePathname', 'useSearchParams', 'redirect'] }
        ],
      },
      {
        title: 'المستوى المتوسط - جلب البيانات',
        description: 'Data Fetching',
        topics: [
          { title: 'Server Components', subTopics: ['Default Behavior', 'async/await', 'Data Fetching', 'Performance'] },
          { title: 'Client Components', subTopics: ["'use client'", 'Interactivity', 'When to Use', 'Best Practices'] },
          { title: 'fetch API', subTopics: ['fetch in Server', 'Caching', 'Revalidation', 'Error Handling'] },
          { title: 'Data Patterns', subTopics: ['Parallel Fetching', 'Sequential Fetching', 'Preloading Data'] },
          { title: 'Caching', subTopics: ['Cache Options', 'Revalidate', 'no-store', 'force-cache'] }
        ],
      },
      {
        title: 'المستوى المتقدم - Server Actions',
        description: 'الإجراءات الخادم',
        topics: [
          { title: 'Form Actions', subTopics: ['Server Actions', 'useFormState', 'useFormStatus', 'Progressive Enhancement'] },
          { title: 'Mutations', subTopics: ['Creating Actions', 'Revalidation', 'revalidatePath', 'revalidateTag'] },
          { title: 'Validation', subTopics: ['Zod', 'Form Validation', 'Error Handling'] },
          'Optimistic Updates',
          'Error Handling'
        ],
      },
      {
        title: 'المستوى المتقدم - التحسين',
        description: 'Optimization',
        subSections: [
          {
            title: 'Performance Optimization',
            description: 'تحسين الأداء',
            topics: [
              { title: 'Image Component', subTopics: ['next/image', 'Optimization', 'Lazy Loading', 'Placeholder'] },
              { title: 'Font Optimization', subTopics: ['next/font', 'Google Fonts', 'Local Fonts', 'Variable Fonts'] },
              { title: 'Script Component', subTopics: ['next/script', 'Loading Strategy', 'Third-party Scripts'] },
              'Code Splitting',
              'Bundle Analysis'
            ]
          },
          {
            title: 'Rendering Strategies',
            description: 'استراتيجيات العرض',
            topics: [
              { title: 'Static Generation', subTopics: ['generateStaticParams', 'Static Exports', 'ISR'] },
              { title: 'Dynamic Rendering', subTopics: ['Dynamic Routes', 'Streaming', 'Suspense'] },
              { title: 'Metadata', subTopics: ['generateMetadata', 'Static Metadata', 'Dynamic Metadata', 'SEO'] },
              'Streaming SSR',
              'Partial Prerendering'
            ]
          },
          {
            title: 'Production & Deployment',
            description: 'النشر',
            topics: [
              { title: 'Deployment', subTopics: ['Vercel', 'Self-hosting', 'Docker', 'Static Export'] },
              { title: 'Environment Variables', subTopics: ['.env.local', 'NEXT_PUBLIC_', 'Runtime Config'] },
              { title: 'Middleware', subTopics: ['middleware.ts', 'Request/Response', 'Authentication', 'Redirects'] },
              { title: 'Edge Runtime', subTopics: ['Edge Functions', 'Edge Middleware', 'Limitations'] },
              { title: 'Advanced', subTopics: ['Internationalization', 'Analytics', 'Monitoring', 'Testing'] }
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'javascript',
    title: 'JavaScript Developer Roadmap',
    languageName: 'JavaScript',
    description: 'مسار تعلم JavaScript من المبتدئ إلى المحترف - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'أساسيات JavaScript',
        topics: [
          { title: 'المتغيرات', subTopics: ['let', 'const', 'var', 'Hoisting', 'Scope'] },
          { title: 'أنواع البيانات', subTopics: ['String', 'Number', 'Boolean', 'Null', 'Undefined', 'Symbol', 'BigInt'] },
          { title: 'العمليات', subTopics: ['Arithmetic', 'Comparison', 'Logical', 'Ternary', 'Nullish Coalescing'] },
          { title: 'الشروط', subTopics: ['if/else', 'else if', 'switch', 'Nested Conditions'] },
          { title: 'الحلقات', subTopics: ['for', 'while', 'do-while', 'for...of', 'for...in', 'break/continue'] },
          { title: 'الدوال', subTopics: ['Function Declaration', 'Function Expression', 'Arrow Functions', 'Parameters', 'Return'] }
        ],
      },
      {
        title: 'المستوى المتوسط - البيانات والكائنات',
        description: 'Data Structures',
        topics: [
          { title: 'Arrays', subTopics: ['Creation', 'Indexing', 'push/pop', 'shift/unshift', 'slice/splice', 'map/filter/reduce'] },
          { title: 'Objects', subTopics: ['Object Literal', 'Properties', 'Methods', 'this', 'Object Methods'] },
          { title: 'Destructuring', subTopics: ['Array Destructuring', 'Object Destructuring', 'Default Values', 'Nested'] },
          { title: 'Spread & Rest', subTopics: ['Spread Operator', 'Rest Parameters', 'Array/Object Spread'] },
          { title: 'Maps & Sets', subTopics: ['Map', 'Set', 'WeakMap', 'WeakSet'] },
          { title: 'JSON', subTopics: ['JSON.parse', 'JSON.stringify', 'Working with APIs'] }
        ],
      },
      {
        title: 'المستوى المتقدم - البرمجة المتقدمة',
        description: 'Advanced JavaScript',
        topics: [
          { title: 'Closures', subTopics: ['Lexical Scope', 'Private Variables', 'Module Pattern'] },
          { title: 'Prototypes', subTopics: ['Prototype Chain', '__proto__', 'Inheritance', 'Object.create'] },
          { title: 'Classes', subTopics: ['Class Syntax', 'Constructor', 'Methods', 'Inheritance', 'Static'] },
          { title: 'this Keyword', subTopics: ['Global Context', 'Object Method', 'Arrow Functions', 'Binding'] },
          { title: 'Call/Apply/Bind', subTopics: ['call()', 'apply()', 'bind()', 'Use Cases'] },
          { title: 'Modules', subTopics: ['ES6 Modules', 'import/export', 'Default Export', 'Named Export'] },
          { title: 'Advanced Functions', subTopics: ['Higher-Order Functions', 'Currying', 'Recursion', 'IIFE'] }
        ],
      },
      {
        title: 'المستوى الاحترافي - البرمجة غير المتزامنة',
        description: 'Async Programming',
        subSections: [
          {
            title: 'Async Fundamentals',
            description: 'الأساسيات غير المتزامنة',
            topics: [
              { title: 'Callbacks', subTopics: ['Callback Functions', 'Callback Hell', 'Error Handling'] },
              { title: 'Promises', subTopics: ['Creating Promises', 'then/catch', 'Promise.all', 'Promise.race', 'Chaining'] },
              { title: 'Async/Await', subTopics: ['async Functions', 'await', 'Error Handling', 'Promise vs Async'] },
              'Event Loop',
              'Microtasks & Macrotasks'
            ]
          },
          {
            title: 'DOM & Browser APIs',
            description: 'التعامل مع المتصفح',
            topics: [
              { title: 'DOM Manipulation', subTopics: ['querySelector', 'createElement', 'appendChild', 'setAttribute'] },
              { title: 'Events', subTopics: ['addEventListener', 'Event Object', 'Event Delegation', 'Event Bubbling'] },
              { title: 'Storage', subTopics: ['localStorage', 'sessionStorage', 'Cookies', 'IndexedDB'] },
              { title: 'Fetch API', subTopics: ['fetch()', 'Request/Response', 'Headers', 'Error Handling'] },
              'Web APIs',
              'WebSockets'
            ]
          },
          {
            title: 'Modern JavaScript',
            description: 'جافا سكريبت الحديث',
            topics: [
              { title: 'ES6+ Features', subTopics: ['Optional Chaining', 'Nullish Coalescing', 'Dynamic Import'] },
              { title: 'Error Handling', subTopics: ['try/catch', 'throw', 'Custom Errors', 'Error Types'] },
              { title: 'Performance', subTopics: ['Debouncing', 'Throttling', 'Memoization', 'Web Workers'] },
              'Regular Expressions',
              { title: 'Tools', subTopics: ['npm', 'Webpack', 'Babel', 'ESLint', 'Prettier'] }
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'fastapi',
    title: 'FastAPI Developer Roadmap',
    languageName: 'Python',
    description: 'مسار تعلم FastAPI لتطوير APIs سريعة - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'البداية مع FastAPI',
        topics: [
          { title: 'التثبيت والإعداد', subTopics: ['Python 3.7+', 'pip install fastapi', 'pip install uvicorn', 'Virtual Environment'] },
          { title: 'أول API', subTopics: ['FastAPI Instance', 'Path Operation', '@app.get', 'Running with Uvicorn'] },
          { title: 'فهم المسارات', subTopics: ['Path Parameters', 'Query Parameters', 'Request Body', 'Response Model'] },
          { title: 'Automatic Docs', subTopics: ['/docs (Swagger)', '/redoc', 'OpenAPI Schema'] },
          { title: 'HTTP Methods', subTopics: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }
        ],
      },
      {
        title: 'المستوى المتوسط - البيانات والتحقق',
        description: 'التعامل مع البيانات',
        topics: [
          { title: 'Pydantic Models', subTopics: ['BaseModel', 'Field Types', 'Type Hints', 'Model Config'] },
          { title: 'Validation', subTopics: ['Field Validation', 'Custom Validators', 'validator Decorator', 'Error Messages'] },
          { title: 'Response Models', subTopics: ['response_model', 'response_model_exclude', 'Status Codes'] },
          { title: 'Request Body', subTopics: ['JSON Body', 'Form Data', 'File Uploads', 'Multiple Bodies'] },
          { title: 'Dependencies', subTopics: ['Depends()', 'Dependency Injection', 'Sub-dependencies', 'Classes as Dependencies'] },
          'Nested Models'
        ],
      },
      {
        title: 'المستوى المتقدم - قواعد البيانات',
        description: 'Database Integration',
        topics: [
          { title: 'SQLAlchemy', subTopics: ['ORM Models', 'Session', 'Database Connection', 'Relationships'] },
          { title: 'Async SQLAlchemy', subTopics: ['AsyncSession', 'async/await', 'AsyncEngine'] },
          { title: 'Alembic', subTopics: ['Migrations', 'alembic init', 'upgrade/downgrade', 'Auto-generate'] },
          { title: 'CRUD Operations', subTopics: ['Create', 'Read', 'Update', 'Delete', 'Query Building'] },
          { title: 'Alternative ORMs', subTopics: ['Tortoise ORM', 'MongoDB with Motor', 'Beanie'] }
        ],
      },
      {
        title: 'المستوى الاحترافي - الأمان والنشر',
        description: 'Security & Deployment',
        subSections: [
          {
            title: 'Authentication & Authorization',
            description: 'المصادقة والتفويض',
            topics: [
              { title: 'OAuth2', subTopics: ['OAuth2PasswordBearer', 'OAuth2 Flows', 'Scopes'] },
              { title: 'JWT Tokens', subTopics: ['python-jose', 'Creating Tokens', 'Verifying Tokens', 'Refresh Tokens'] },
              { title: 'Password Hashing', subTopics: ['passlib', 'bcrypt', 'Hashing Strategies'] },
              'Security Dependencies',
              'CORS Middleware'
            ]
          },
          {
            title: 'Advanced Features',
            description: 'ميزات متقدمة',
            topics: [
              { title: 'Background Tasks', subTopics: ['BackgroundTasks', 'Celery Integration', 'Task Queues'] },
              { title: 'WebSockets', subTopics: ['WebSocket Endpoint', 'Real-time Communication', 'Broadcasting'] },
              { title: 'Middleware', subTopics: ['Custom Middleware', 'CORS', 'Trusted Hosts', 'GZip'] },
              { title: 'Testing', subTopics: ['TestClient', 'pytest', 'Async Tests', 'Mocking'] },
              'GraphQL with Strawberry'
            ]
          },
          {
            title: 'Production & Deployment',
            description: 'النشر والإنتاج',
            topics: [
              { title: 'Docker', subTopics: ['Dockerfile', 'docker-compose', 'Multi-stage Builds'] },
              { title: 'Production Server', subTopics: ['Gunicorn + Uvicorn', 'Nginx', 'Load Balancing'] },
              { title: 'Monitoring', subTopics: ['Logging', 'Sentry', 'Prometheus', 'Health Checks'] },
              'Environment Variables',
              'CI/CD Pipeline'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'flutter',
    title: 'Flutter & Dart Developer Roadmap',
    languageName: 'Dart',
    description: 'مسار تعلم Flutter و Dart لتطوير تطبيقات متعددة المنصات - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - أساسيات Dart',
        description: 'تعلم لغة Dart',
        topics: [
          { title: 'التثبيت والإعداد', subTopics: ['Dart SDK', 'DartPad', 'VS Code Setup', 'Android Studio'] },
          { title: 'المتغيرات والبيانات', subTopics: ['var/final/const', 'int/double/String', 'bool', 'dynamic', 'Type Inference'] },
          { title: 'العمليات', subTopics: ['Arithmetic', 'Comparison', 'Logical', 'Ternary', 'Null-aware'] },
          { title: 'التحكم', subTopics: ['if/else', 'switch', 'for', 'while', 'do-while'] },
          { title: 'الدوال', subTopics: ['Function Declaration', 'Arrow Functions', 'Optional Parameters', 'Named Parameters'] },
          { title: 'Collections', subTopics: ['List', 'Set', 'Map', 'Iterable Methods'] }
        ],
      },
      {
        title: 'المستوى المبتدئ - Dart المتقدم',
        description: 'مفاهيم Dart المتقدمة',
        topics: [
          { title: 'Classes & Objects', subTopics: ['Class Definition', 'Constructors', 'Named Constructors', 'Factory Constructors'] },
          { title: 'Inheritance', subTopics: ['extends', 'super', 'Override', '@override'] },
          { title: 'OOP Concepts', subTopics: ['Abstract Classes', 'Interfaces (implements)', 'Mixins', 'Extension Methods'] },
          { title: 'Generics', subTopics: ['Generic Classes', 'Generic Functions', 'Type Constraints'] },
          { title: 'Async Programming', subTopics: ['Future', 'async/await', 'Stream', 'Stream Controllers'] },
          'Null Safety'
        ],
      },
      {
        title: 'المستوى المتوسط - أساسيات Flutter',
        description: 'البداية مع Flutter',
        topics: [
          { title: 'التثبيت والإعداد', subTopics: ['Flutter SDK', 'flutter doctor', 'Creating Project', 'Emulator Setup'] },
          { title: 'بنية المشروع', subTopics: ['lib/', 'pubspec.yaml', 'main.dart', 'Assets'] },
          { title: 'Widgets الأساسية', subTopics: ['Text', 'Image', 'Icon', 'Container', 'Padding', 'Center'] },
          { title: 'StatelessWidget', subTopics: ['Creating Widgets', 'build Method', 'Widget Tree'] },
          { title: 'StatefulWidget', subTopics: ['State Class', 'setState', 'Lifecycle Methods', 'initState/dispose'] },
          { title: 'Hot Reload', subTopics: ['Hot Reload vs Restart', 'Development Tips'] },
          'Material Design'
        ],
      },
      {
        title: 'المستوى المتوسط - واجهات المستخدم',
        description: 'بناء الواجهات',
        topics: [
          { title: 'Layouts', subTopics: ['Row', 'Column', 'Stack', 'Expanded', 'Flexible', 'Positioned'] },
          { title: 'Lists', subTopics: ['ListView', 'ListView.builder', 'GridView', 'ListTile'] },
          { title: 'Navigation', subTopics: ['Navigator', 'Routes', 'Named Routes', 'Passing Data', 'onGenerateRoute'] },
          { title: 'Forms', subTopics: ['TextField', 'Form', 'TextEditingController', 'Validation', 'Focus'] },
          { title: 'Themes & Styling', subTopics: ['ThemeData', 'Colors', 'TextStyle', 'Custom Themes'] },
          { title: 'Responsive Design', subTopics: ['MediaQuery', 'LayoutBuilder', 'Orientation', 'Breakpoints'] }
        ],
      },
      {
        title: 'المستوى المتقدم - إدارة الحالة',
        description: 'State Management',
        subSections: [
          {
            title: 'State Management Basics',
            description: 'إدارة الحالة',
            topics: [
              { title: 'setState', subTopics: ['Local State', 'StatefulWidget State', 'Best Practices'] },
              { title: 'Provider', subTopics: ['ChangeNotifier', 'Consumer', 'Provider.of', 'MultiProvider'] },
              { title: 'Riverpod', subTopics: ['Providers', 'ConsumerWidget', 'StateNotifier', 'FutureProvider'] },
              'BLoC Pattern',
              'GetX',
              'Redux (Optional)'
            ]
          },
          {
            title: 'Advanced Features',
            description: 'ميزات متقدمة',
            topics: [
              { title: 'HTTP & APIs', subTopics: ['http Package', 'Dio', 'REST APIs', 'JSON Parsing', 'Error Handling'] },
              { title: 'Local Storage', subTopics: ['shared_preferences', 'Hive', 'sqflite', 'Sembast'] },
              { title: 'Animations', subTopics: ['AnimatedContainer', 'AnimationController', 'Tween', 'Hero'] },
              { title: 'Firebase', subTopics: ['Firebase Auth', 'Firestore', 'Storage', 'Cloud Messaging'] },
              'Push Notifications',
              { title: 'Maps & Location', subTopics: ['google_maps_flutter', 'Geolocation', 'Permissions'] }
            ]
          },
          {
            title: 'Testing & Deployment',
            description: 'الاختبار والنشر',
            topics: [
              { title: 'Testing', subTopics: ['Unit Tests', 'Widget Tests', 'Integration Tests', 'Mockito'] },
              { title: 'Performance', subTopics: ['Performance Profiling', 'Memory Management', 'Build Optimization'] },
              { title: 'Deployment', subTopics: ['Android Release', 'iOS Release', 'App Signing', 'Store Upload'] },
              'CI/CD with Codemagic',
              'Flavors & Environments'
            ]
          }
        ]
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
        topics: [
          { title: 'ما هو Node.js?', subTopics: ['V8 Engine', 'Event-Driven', 'Non-Blocking I/O', 'Use Cases'] },
          { title: 'التثبيت والبداية', subTopics: ['Installing Node', 'nvm', 'node --version', 'REPL'] },
          { title: 'تشغيل سكربت', subTopics: ['node file.js', 'console.log', 'Process Arguments'] },
          { title: 'npm & npx', subTopics: ['package.json', 'npm install', 'npm scripts', 'npx'] },
          { title: 'Modules', subTopics: ['CommonJS (require)', 'ES Modules (import)', 'Exports', 'Built-in Modules'] },
          { title: 'File System', subTopics: ['fs.readFile', 'fs.writeFile', 'Async vs Sync', 'Path Module'] },
          { title: 'HTTP Module', subTopics: ['createServer', 'Request/Response', 'Routing', 'Status Codes'] }
        ],
      },
      {
        title: 'المستوى المتوسط - البرمجة غير المتزامنة',
        description: 'Async في Node',
        topics: [
          { title: 'Event Loop', subTopics: ['Call Stack', 'Callback Queue', 'Event Loop Phases', 'setImmediate'] },
          { title: 'Callbacks', subTopics: ['Callback Pattern', 'Error-First Callbacks', 'Callback Hell'] },
          { title: 'Promises', subTopics: ['Creating Promises', 'Promise Chaining', 'Promise.all', 'util.promisify'] },
          { title: 'Async/Await', subTopics: ['async Functions', 'try/catch', 'Parallel Execution'] },
          { title: 'Timers', subTopics: ['setTimeout', 'setInterval', 'setImmediate', 'process.nextTick'] },
          'Error Handling'
        ],
      },
      {
        title: 'المستوى المتوسط - بناء خدمات',
        description: 'Building Services',
        topics: [
          { title: 'Environment Variables', subTopics: ['process.env', 'dotenv', '.env Files', 'Config Management'] },
          { title: 'Logging', subTopics: ['console', 'Winston', 'Pino', 'Log Levels'] },
          { title: 'Configuration', subTopics: ['config Package', 'Environment-based Config'] },
          { title: 'Validation', subTopics: ['Joi', 'Yup', 'Input Validation'] },
          { title: 'Testing Basics', subTopics: ['Jest', 'Mocha', 'Chai', 'Unit Tests'] },
          'Debugging'
        ],
      },
      {
        title: 'المستوى المتقدم - الأداء',
        description: 'Performance',
        subSections: [
          {
            title: 'Streams & Performance',
            description: 'الأداء والتحسين',
            topics: [
              { title: 'Streams', subTopics: ['Readable', 'Writable', 'Transform', 'Piping', 'Backpressure'] },
              { title: 'Clustering', subTopics: ['cluster Module', 'Worker Processes', 'Load Balancing'] },
              'Memory Leaks',
              'Profiling',
              { title: 'Caching', subTopics: ['Memory Cache', 'Redis', 'Cache Strategies'] },
              'Rate Limiting'
            ]
          },
          {
            title: 'Production Ready',
            description: 'الاستعداد للإنتاج',
            topics: [
              { title: 'Security', subTopics: ['Input Sanitization', 'SQL Injection', 'XSS', 'HTTPS', 'Helmet'] },
              { title: 'Process Management', subTopics: ['PM2', 'Forever', 'Graceful Shutdown'] },
              { title: 'Monitoring', subTopics: ['Health Checks', 'Metrics', 'APM Tools'] },
              'Error Tracking',
              { title: 'Deployment', subTopics: ['Docker', 'CI/CD', 'Environment Setup', 'Scaling'] }
            ]
          }
        ]
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
        topics: [
          { title: 'إنشاء مشروع', subTopics: ['npm init', 'Installing Express', 'Basic Server', 'nodemon'] },
          { title: 'Routing Basics', subTopics: ['app.get/post/put/delete', 'Route Parameters', 'Query Strings', 'Route Paths'] },
          { title: 'Request/Response', subTopics: ['req.body', 'req.params', 'req.query', 'res.json', 'res.send'] },
          { title: 'Middleware Basics', subTopics: ['app.use', 'next()', 'Middleware Order', 'Built-in Middleware'] },
          { title: 'Static Files', subTopics: ['express.static', 'Public Folder', 'Serving HTML/CSS/JS'] },
          'Error Middleware'
        ],
      },
      {
        title: 'المستوى المتوسط - بناء API حقيقية',
        description: 'API Patterns',
        topics: [
          { title: 'MVC Structure', subTopics: ['Models', 'Views', 'Controllers', 'Routes', 'Folder Structure'] },
          { title: 'Validation', subTopics: ['express-validator', 'Zod', 'Joi', 'Custom Validators'] },
          { title: 'Pagination', subTopics: ['Limit/Skip', 'Page/Size', 'Cursor Pagination'] },
          { title: 'Filtering & Sorting', subTopics: ['Query Filters', 'Sort', 'Select Fields'] },
          { title: 'File Uploads', subTopics: ['Multer', 'File Validation', 'Storage', 'Multiple Files'] },
          { title: 'CORS', subTopics: ['cors Package', 'Allowed Origins', 'Credentials'] }
        ],
      },
      {
        title: 'المستوى المتقدم - الأمان',
        description: 'Auth & Security',
        topics: [
          { title: 'JWT Auth', subTopics: ['jsonwebtoken', 'Token Generation', 'Token Verification', 'Refresh Tokens'] },
          { title: 'Sessions', subTopics: ['express-session', 'Session Store', 'Cookie Options'] },
          { title: 'RBAC', subTopics: ['Roles', 'Permissions', 'Authorization Middleware'] },
          { title: 'Security', subTopics: ['Helmet', 'express-rate-limit', 'XSS', 'CSRF'] },
          'Input Sanitization'
        ],
      },
      {
        title: 'المستوى المتقدم - قواعد البيانات',
        description: 'Database Integration',
        subSections: [
          {
            title: 'MongoDB & Mongoose',
            description: 'قواعد البيانات',
            topics: [
              { title: 'Mongoose', subTopics: ['Connection', 'Schemas', 'Models', 'Queries', 'Validation'] },
              'Transactions',
              'Indexes',
              { title: 'Relationships', subTopics: ['populate', 'Refs', 'Virtual Populate'] },
              'Migrations Concepts'
            ]
          },
          {
            title: 'Caching & Performance',
            description: 'التخزين المؤقت',
            topics: [
              { title: 'Redis', subTopics: ['Connection', 'SET/GET', 'Caching Strategies', 'TTL'] },
              'Query Optimization',
              'Compression',
              'Response Time'
            ]
          },
          {
            title: 'Production & Testing',
            description: 'الإنتاج',
            topics: [
              { title: 'Testing', subTopics: ['Jest', 'Supertest', 'Unit Tests', 'Integration Tests', 'Mocking'] },
              { title: 'Logging', subTopics: ['Morgan', 'Winston', 'Log Levels', 'Request Logging'] },
              { title: 'Deployment', subTopics: ['PM2', 'Docker', 'Environment Variables', 'Load Balancing'] },
              'CI/CD',
              'Performance Tuning'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'angular',
    title: 'Angular Developer Roadmap',
    languageName: 'Angular',
    description: 'مسار تعلم Angular لتطوير تطبيقات Frontend - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'البداية مع Angular',
        topics: [
          { title: 'TypeScript Basics', subTopics: ['Types', 'Interfaces', 'Classes', 'Decorators', 'Generics'] },
          { title: 'Angular CLI', subTopics: ['ng new', 'ng serve', 'ng generate', 'ng build', 'ng test'] },
          { title: 'Components', subTopics: ['Component Creation', 'Templates', 'Styles', 'Lifecycle Hooks'] },
          { title: 'Templates', subTopics: ['Interpolation', 'Property Binding', 'Event Binding', 'Two-way Binding'] },
          { title: 'Directives', subTopics: ['*ngIf', '*ngFor', '*ngSwitch', 'ngClass', 'ngStyle', 'Custom Directives'] },
          { title: 'Data Binding', subTopics: ['String Interpolation', 'Property Binding', 'Event Binding', 'Two-way'] }
        ],
      },
      {
        title: 'المستوى المتوسط - الهيكلة',
        description: 'Architecture',
        topics: [
          { title: 'Modules', subTopics: ['NgModule', 'Feature Modules', 'Shared Modules', 'Core Module'] },
          { title: 'Routing', subTopics: ['Router Module', 'Routes', 'RouterLink', 'RouterOutlet', 'Route Parameters'] },
          { title: 'Lazy Loading', subTopics: ['loadChildren', 'Preloading Strategies', 'Route Guards'] },
          { title: 'Services', subTopics: ['Injectable', 'Service Creation', 'Singleton Services'] },
          { title: 'Dependency Injection', subTopics: ['Providers', 'Injector', 'providedIn', 'Hierarchical DI'] },
          { title: 'Pipes', subTopics: ['Built-in Pipes', 'Custom Pipes', 'Pure/Impure Pipes', 'Async Pipe'] }
        ],
      },
      {
        title: 'المستوى المتوسط - النماذج وHTTP',
        description: 'Forms & HTTP',
        topics: [
          { title: 'Template-Driven Forms', subTopics: ['ngModel', 'FormsModule', 'Validation', 'ngForm'] },
          { title: 'Reactive Forms', subTopics: ['FormControl', 'FormGroup', 'FormBuilder', 'Validators'] },
          { title: 'Form Validation', subTopics: ['Built-in Validators', 'Custom Validators', 'Async Validators', 'Error Messages'] },
          { title: 'HttpClient', subTopics: ['GET/POST/PUT/DELETE', 'Observables', 'Response Types', 'Headers'] },
          { title: 'Interceptors', subTopics: ['HTTP Interceptors', 'Request/Response Modification', 'Error Handling'] },
          'RxJS Basics'
        ],
      },
      {
        title: 'المستوى المتقدم - RxJS والحالة',
        description: 'State & Testing',
        subSections: [
          {
            title: 'RxJS Advanced',
            description: 'متقدم',
            topics: [
              { title: 'Observables', subTopics: ['Observables', 'Subjects', 'BehaviorSubject', 'ReplaySubject'] },
              { title: 'Operators', subTopics: ['map', 'filter', 'switchMap', 'mergeMap', 'combineLatest', 'forkJoin'] },
              'Error Handling',
              'Subscription Management'
            ]
          },
          {
            title: 'State Management',
            description: 'إدارة الحالة',
            topics: [
              { title: 'NgRx', subTopics: ['Store', 'Actions', 'Reducers', 'Effects', 'Selectors'] },
              { title: 'Signals (Angular 16+)', subTopics: ['signal()', 'computed()', 'effect()', 'Reactivity'] },
              'Component Store',
              'Services as State'
            ]
          },
          {
            title: 'Testing & Production',
            description: 'الاختبار',
            topics: [
              { title: 'Unit Testing', subTopics: ['Jasmine', 'Karma', 'TestBed', 'Component Testing'] },
              { title: 'E2E Testing', subTopics: ['Protractor/Cypress', 'Page Objects', 'Test Automation'] },
              { title: 'Performance', subTopics: ['OnPush Strategy', 'TrackBy', 'Lazy Loading', 'AOT Compilation'] },
              { title: 'Production', subTopics: ['Build Optimization', 'Environment Config', 'Deployment', 'SEO'] }
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'mongodb',
    title: 'MongoDB Roadmap',
    languageName: 'MongoDB',
    description: 'مسار تعلم MongoDB من المبتدئ إلى المحترف - شامل',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'مفاهيم MongoDB',
        topics: [
          { title: 'التثبيت والإعداد', subTopics: ['MongoDB Installation', 'MongoDB Compass', 'Mongo Shell', 'Atlas (Cloud)'] },
          { title: 'Documents vs Collections', subTopics: ['JSON/BSON', 'Document Structure', 'Collections', '_id Field'] },
          { title: 'CRUD Basics', subTopics: ['insertOne/insertMany', 'find/findOne', 'updateOne/updateMany', 'deleteOne/deleteMany'] },
          { title: 'Data Types', subTopics: ['String', 'Number', 'Boolean', 'Date', 'ObjectId', 'Array', 'Embedded Docs'] },
          { title: 'Query Operators', subTopics: ['$eq', '$gt/$lt', '$in', '$and/$or', '$not', '$exists'] },
          { title: 'Basic Operations', subTopics: ['Sorting', 'Limiting', 'Skipping', 'Counting', 'Projection'] }
        ],
      },
      {
        title: 'المستوى المتوسط - التصميم',
        description: 'Schema Design',
        topics: [
          { title: 'Data Modeling', subTopics: ['Embedding vs Referencing', 'When to Embed', 'When to Reference', 'Hybrid Approach'] },
          { title: 'Relationships', subTopics: ['One-to-One', 'One-to-Many', 'Many-to-Many', 'Design Patterns'] },
          { title: 'Validation', subTopics: ['Schema Validation', 'Validation Rules', 'JSON Schema', 'Validation Levels'] },
          { title: 'Aggregation Basics', subTopics: ['$match', '$group', '$project', '$sort', '$limit', 'Pipeline'] },
          { title: 'Indexes', subTopics: ['Single Field Index', 'Compound Index', 'createIndex', 'Index Types'] },
          { title: 'Text Search', subTopics: ['Text Index', 'Search Queries', '$text', 'Score'] }
        ],
      },
      {
        title: 'المستوى المتقدم - Aggregation & Performance',
        description: 'Advanced Queries',
        topics: [
          { title: 'Aggregation Pipeline', subTopics: ['$lookup', '$unwind', '$addFields', '$facet', '$bucket', 'Complex Pipelines'] },
          { title: 'Advanced Operators', subTopics: ['$expr', '$cond', '$switch', 'Array Operators', 'Date Operators'] },
          { title: 'Performance', subTopics: ['Query Plans', 'explain()', 'Slow Queries', 'Profiling'] },
          { title: 'Index Optimization', subTopics: ['Index Strategies', 'Covered Queries', 'Index Intersection', 'Index Hints'] },
          { title: 'Transactions', subTopics: ['Multi-document Transactions', 'ACID', 'Session', 'Rollback'] },
          'Sharding Concepts'
        ],
      },
      {
        title: 'المستوى الاحترافي - الإنتاج',
        description: 'Production',
        subSections: [
          {
            title: 'High Availability',
            description: 'التوفر العالي',
            topics: [
              { title: 'Replication', subTopics: ['Replica Sets', 'Primary/Secondary', 'Elections', 'Read Preference'] },
              { title: 'Sharding', subTopics: ['Shard Keys', 'Chunks', 'Balancer', 'Zone Sharding'] },
              'Backups & Restore',
              'Disaster Recovery'
            ]
          },
          {
            title: 'Security & Monitoring',
            description: 'الأمان',
            topics: [
              { title: 'Security', subTopics: ['Authentication', 'Authorization', 'Roles', 'Encryption', 'Network Security'] },
              { title: 'Monitoring', subTopics: ['Ops Manager', 'Cloud Manager', 'Metrics', 'Alerts'] },
              'Performance Tuning',
              'Best Practices'
            ]
          },
          {
            title: 'Advanced Topics',
            description: 'مواضيع متقدمة',
            topics: [
              { title: 'Change Streams', subTopics: ['Watch Collections', 'Real-time Updates', 'Resume Tokens'] },
              { title: 'GridFS', subTopics: ['File Storage', 'Large Files', 'Chunks'] },
              { title: 'Time Series', subTopics: ['Time Series Collections', 'IoT Data', 'Analytics'] },
              'Migration Strategies',
              'Capacity Planning'
            ]
          }
        ]
      },
    ],
  },
  {
    id: 'git',
    title: 'Git & Version Control Roadmap',
    languageName: 'Git',
    description: 'مسار تعلم Git وإدارة الإصدارات - شامل ومتكامل',
    sections: [
      {
        title: 'المستوى المبتدئ - الأساسيات',
        description: 'أساسيات Git',
        topics: [
          { title: 'ما هو Git?', subTopics: ['Version Control', 'Distributed vs Centralized', 'Git vs GitHub', 'Git Workflow'] },
          { title: 'التثبيت والإعداد', subTopics: ['Installing Git', 'git config', 'User Name/Email', 'SSH Keys'] },
          { title: 'Repository Basics', subTopics: ['git init', 'git clone', '.git Folder', 'Repository Structure'] },
          { title: 'Basic Commands', subTopics: ['git add', 'git commit', 'git status', 'git log', 'Commit Messages'] },
          { title: 'Viewing Changes', subTopics: ['git diff', 'git diff --staged', 'git show', 'Diff Tools'] },
          { title: 'Undoing Changes', subTopics: ['git restore', 'git reset', 'git revert', 'Working with History'] }
        ],
      },
      {
        title: 'المستوى المتوسط - الفروع والتعاون',
        description: 'Branches & Collaboration',
        topics: [
          { title: 'Branching', subTopics: ['git branch', 'git checkout', 'git switch', 'Branch Naming', 'Branch Strategy'] },
          { title: 'Merging', subTopics: ['git merge', 'Fast-forward', '3-way Merge', 'Merge Commits'] },
          { title: 'Rebase', subTopics: ['git rebase', 'Rebase vs Merge', 'Interactive Rebase', 'Rebase Workflow'] },
          { title: 'Conflict Resolution', subTopics: ['Merge Conflicts', 'Conflict Markers', 'Resolution Tools', 'git mergetool'] },
          { title: 'Remote Repositories', subTopics: ['git remote', 'git push', 'git pull', 'git fetch', 'Origin'] },
          { title: 'Collaboration', subTopics: ['Pull Requests', 'Code Review', 'Forks', 'Upstream'] }
        ],
      },
      {
        title: 'المستوى المتقدم - إدارة التاريخ',
        description: 'History Management',
        topics: [
          { title: 'Interactive Rebase', subTopics: ['git rebase -i', 'Squash', 'Reword', 'Edit', 'Drop', 'Fixup'] },
          { title: 'Advanced Operations', subTopics: ['git cherry-pick', 'Picking Commits', 'Multiple Commits'] },
          { title: 'Recovery', subTopics: ['git reflog', 'Lost Commits', 'Recovering Data', 'Garbage Collection'] },
          { title: 'Debugging', subTopics: ['git bisect', 'Finding Bugs', 'Binary Search', 'Automation'] },
          { title: 'Tags & Releases', subTopics: ['git tag', 'Lightweight Tags', 'Annotated Tags', 'Semantic Versioning'] },
          { title: 'Submodules', subTopics: ['git submodule', 'Adding Submodules', 'Updating', 'Nested Repos'] }
        ],
      },
      {
        title: 'المستوى الاحترافي - أفضل الممارسات',
        description: 'Best Practices',
        subSections: [
          {
            title: 'Workflow Strategies',
            description: 'استراتيجيات العمل',
            topics: [
              { title: 'Git Flow', subTopics: ['Master/Develop', 'Feature Branches', 'Release Branches', 'Hotfixes'] },
              { title: 'GitHub Flow', subTopics: ['Simple Workflow', 'Main Branch', 'Feature Branches', 'Deploy'] },
              { title: 'Trunk-Based', subTopics: ['Single Branch', 'Short-lived Branches', 'Continuous Integration'] },
              'GitLab Flow'
            ]
          },
          {
            title: 'Professional Practices',
            description: 'ممارسات احترافية',
            topics: [
              { title: 'Commit Messages', subTopics: ['Conventional Commits', 'Commit Structure', 'Commit Types', 'Scope'] },
              { title: 'Semantic Versioning', subTopics: ['MAJOR.MINOR.PATCH', 'Version Bumping', 'Breaking Changes'] },
              { title: 'Git Hooks', subTopics: ['pre-commit', 'pre-push', 'commit-msg', 'Husky'] },
              '.gitignore Best Practices',
              'Large File Handling (LFS)'
            ]
          },
          {
            title: 'Advanced Topics',
            description: 'مواضيع متقدمة',
            topics: [
              { title: 'CI/CD Integration', subTopics: ['GitHub Actions', 'GitLab CI', 'Jenkins', 'Automated Testing'] },
              { title: 'Security', subTopics: ['Secret Scanning', 'Signed Commits', 'GPG Keys', 'Security Best Practices'] },
              { title: 'Monorepo', subTopics: ['Monorepo Concepts', 'Git Worktree', 'Sparse Checkout'] },
              'Git Internals',
              { title: 'Performance', subTopics: ['Shallow Clone', 'Partial Clone', 'Git LFS', 'Repository Size'] }
            ]
          }
        ]
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
