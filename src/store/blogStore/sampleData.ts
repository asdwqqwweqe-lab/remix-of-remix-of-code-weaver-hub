import { Post, Category, Tag, ProgrammingLanguage, Snippet, Collection, LanguageSection } from '@/types/blog';

export const sampleCategories: Category[] = [
  { id: '1', nameAr: 'تطوير الويب', nameEn: 'Web Development', slug: 'web-development', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', nameAr: 'تطوير الموبايل', nameEn: 'Mobile Development', slug: 'mobile-development', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', nameAr: 'الخوادم والباك اند', nameEn: 'Backend & Servers', slug: 'backend-servers', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', nameAr: 'قواعد البيانات', nameEn: 'Databases', slug: 'databases', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', nameAr: 'DevOps', nameEn: 'DevOps', slug: 'devops', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleLanguages: ProgrammingLanguage[] = [
  { id: '1', name: 'JavaScript', slug: 'javascript', color: '#f7df1e', icon: 'js', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'TypeScript', slug: 'typescript', color: '#3178c6', icon: 'ts', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'React', slug: 'react', color: '#61dafb', icon: 'react', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'PHP', slug: 'php', color: '#777bb4', icon: 'php', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Laravel', slug: 'laravel', color: '#ff2d20', icon: 'laravel', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Python', slug: 'python', color: '#3776ab', icon: 'python', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Node.js', slug: 'nodejs', color: '#339933', icon: 'node', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Vue.js', slug: 'vuejs', color: '#4fc08d', icon: 'vue', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'CSS', slug: 'css', color: '#1572b6', icon: 'css', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'HTML', slug: 'html', color: '#e34f26', icon: 'html', createdAt: new Date(), updatedAt: new Date() },
];

export const sampleTags: Tag[] = [
  { id: '1', name: 'API', slug: 'api', color: '#3b82f6' },
  { id: '2', name: 'Authentication', slug: 'authentication', color: '#10b981' },
  { id: '3', name: 'Database', slug: 'database', color: '#f59e0b' },
  { id: '4', name: 'Frontend', slug: 'frontend', color: '#ec4899' },
  { id: '5', name: 'Backend', slug: 'backend', color: '#8b5cf6' },
  { id: '6', name: 'Security', slug: 'security', color: '#ef4444' },
  { id: '7', name: 'Performance', slug: 'performance', color: '#06b6d4' },
  { id: '8', name: 'Testing', slug: 'testing', color: '#84cc16' },
];

export const sampleSections: LanguageSection[] = [
  {
    id: '1',
    languageId: '5',
    title: 'أساسيات Laravel',
    slug: 'laravel-basics',
    description: 'تعلم أساسيات Laravel من الصفر',
    sortOrder: 1,
    posts: [{ postId: '1', sortOrder: 1 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

export const samplePosts: Post[] = [
  {
    id: '1',
    title: 'كيفية إنشاء REST API باستخدام Laravel',
    slug: 'laravel-rest-api',
    summary: 'دليل شامل لبناء واجهة برمجة تطبيقات RESTful باستخدام إطار عمل Laravel',
    content: '<h2>مقدمة</h2><p>في هذا المقال سنتعلم كيفية بناء REST API...</p><pre><code class="language-php">Route::apiResource("posts", PostController::class);</code></pre>',
    mainLanguage: 'ar',
    status: 'published',
    categoryId: '3',
    isFavorite: true,
    viewsCount: 245,
    commentsEnabled: true,
    tags: ['1', '5'],
    programmingLanguages: ['4', '5'],
    links: [{ id: '1', label: 'GitHub Repo', url: 'https://github.com/example', type: 'github' }],
    attachments: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'React Hooks: Complete Guide',
    slug: 'react-hooks-guide',
    summary: 'Learn everything about React Hooks including useState, useEffect, useContext, and custom hooks',
    content: '<h2>Introduction to Hooks</h2><p>React Hooks let you use state and other React features...</p><pre><code class="language-typescript">const [count, setCount] = useState(0);</code></pre>',
    mainLanguage: 'en',
    status: 'published',
    categoryId: '1',
    isFavorite: false,
    viewsCount: 389,
    commentsEnabled: true,
    tags: ['4', '7'],
    programmingLanguages: ['1', '2', '3'],
    links: [
      { id: '1', label: 'React Docs', url: 'https://react.dev', type: 'docs' },
      { id: '2', label: 'Live Demo', url: 'https://example.com/demo', type: 'demo' },
    ],
    attachments: [],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    title: 'تأمين تطبيقات الويب من هجمات XSS',
    slug: 'xss-security',
    summary: 'تعلم كيفية حماية تطبيقك من ثغرات Cross-Site Scripting',
    content: '<h2>ما هي هجمات XSS؟</h2><p>هجمات XSS هي نوع من الهجمات الأمنية...</p>',
    mainLanguage: 'ar',
    status: 'published',
    categoryId: '1',
    isFavorite: true,
    viewsCount: 156,
    commentsEnabled: true,
    tags: ['6', '4'],
    programmingLanguages: ['1'],
    links: [],
    attachments: [],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

export const sampleSnippets: Snippet[] = [
  {
    id: '1',
    title: 'React useState Hook',
    description: 'Basic usage of useState hook in React',
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`,
    languageId: '3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Laravel API Route',
    description: 'Define RESTful API routes in Laravel',
    code: `// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('posts', PostController::class);
    Route::apiResource('comments', CommentController::class);
});`,
    languageId: '5',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const sampleCollections: Collection[] = [
  {
    id: '1',
    title: 'تعلم Laravel من الصفر',
    slug: 'learn-laravel',
    description: 'سلسلة كاملة لتعلم Laravel من البداية للاحتراف',
    posts: [{ postId: '1', sortOrder: 1 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
