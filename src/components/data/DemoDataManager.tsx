import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBlogStore } from '@/store/blogStore';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Database, Trash2, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const DemoDataManager = () => {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    addPost, addCategory, addTag, addProgrammingLanguage, addSnippet, addCollection, addGalleryImage,
    posts, categories, tags, programmingLanguages, snippets, collections, galleryImages
  } = useBlogStore();
  
  const { addReport, reports } = useReportStore();

  const demoCategories = [
    { nameAr: 'البرمجة العامة', nameEn: 'General Programming', slug: 'general-programming', description: 'مواضيع عامة في البرمجة' },
    { nameAr: 'أمن المعلومات', nameEn: 'Security', slug: 'security', description: 'حماية وأمان التطبيقات' },
    { nameAr: 'الذكاء الاصطناعي', nameEn: 'Artificial Intelligence', slug: 'ai', description: 'تعلم الآلة والذكاء الاصطناعي' },
    { nameAr: 'تطوير الويب', nameEn: 'Web Development', slug: 'web-dev', description: 'تطوير مواقع وتطبيقات الويب' },
    { nameAr: 'قواعد البيانات', nameEn: 'Databases', slug: 'databases', description: 'إدارة وتصميم قواعد البيانات' },
    { nameAr: 'DevOps', nameEn: 'DevOps', slug: 'devops', description: 'أدوات وممارسات DevOps' },
  ];

  const demoTags = [
    { name: 'React', slug: 'react', color: '#61dafb' },
    { name: 'TypeScript', slug: 'typescript', color: '#3178c6' },
    { name: 'Node.js', slug: 'nodejs', color: '#339933' },
    { name: 'Docker', slug: 'docker', color: '#2496ed' },
    { name: 'GraphQL', slug: 'graphql', color: '#e535ab' },
    { name: 'PostgreSQL', slug: 'postgresql', color: '#336791' },
    { name: 'MongoDB', slug: 'mongodb', color: '#47A248' },
    { name: 'Redis', slug: 'redis', color: '#DC382D' },
    { name: 'Kubernetes', slug: 'kubernetes', color: '#326CE5' },
    { name: 'AWS', slug: 'aws', color: '#FF9900' },
  ];

  const demoLanguages = [
    { name: 'JavaScript', slug: 'javascript', color: '#f7df1e', icon: 'javascript' },
    { name: 'TypeScript', slug: 'typescript', color: '#3178c6', icon: 'typescript' },
    { name: 'Python', slug: 'python', color: '#3776ab', icon: 'python' },
    { name: 'Go', slug: 'go', color: '#00add8', icon: 'go' },
    { name: 'Rust', slug: 'rust', color: '#dea584', icon: 'rust' },
    { name: 'Swift', slug: 'swift', color: '#fa7343', icon: 'swift' },
    { name: 'Java', slug: 'java', color: '#ED8B00', icon: 'java' },
    { name: 'C#', slug: 'csharp', color: '#512BD4', icon: 'csharp' },
  ];

  const demoPosts = [
    {
      title: 'مقدمة في React Hooks',
      slug: 'intro-react-hooks',
      summary: 'تعلم أساسيات React Hooks وكيفية استخدامها في مشاريعك',
      content: `# مقدمة في React Hooks

## ما هي Hooks؟

React Hooks هي ميزة جديدة تم إضافتها في React 16.8 تتيح لك استخدام الحالة وميزات React الأخرى بدون كتابة class.

## useState

\`\`\`javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      العدد: {count}
    </button>
  );
}
\`\`\`

## useEffect

\`\`\`javascript
import { useEffect } from 'react';

useEffect(() => {
  document.title = \`عدد النقرات: \${count}\`;
}, [count]);
\`\`\`

| Hook | الوصف | الاستخدام |
|------|-------|----------|
| useState | إدارة الحالة | للقيم البسيطة |
| useEffect | التأثيرات الجانبية | للـ API والاشتراكات |
| useContext | السياق | للبيانات العامة |
`,
      mainLanguage: 'ar' as const,
      status: 'published' as const,
      isFavorite: true,
      viewsCount: 150,
      commentsEnabled: true,
      tags: [],
      programmingLanguages: [],
      links: [],
      attachments: [],
    },
    {
      title: 'Building REST APIs with Node.js',
      slug: 'nodejs-rest-api',
      summary: 'Complete guide to building RESTful APIs using Node.js and Express',
      content: `# Building REST APIs with Node.js

## Introduction

REST APIs are the backbone of modern web applications. Let's learn how to build one with Node.js.

## Setting Up Express

\`\`\`javascript
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
\`\`\`

## Routes Table

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Get all users |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

## Best Practices

- Use proper HTTP status codes
- Implement error handling
- Add input validation
`,
      mainLanguage: 'en' as const,
      status: 'published' as const,
      isFavorite: false,
      viewsCount: 280,
      commentsEnabled: true,
      tags: [],
      programmingLanguages: [],
      links: [],
      attachments: [],
    },
    {
      title: 'Docker للمبتدئين',
      slug: 'docker-beginners',
      summary: 'دليل شامل لفهم واستخدام Docker في مشاريعك',
      content: `# Docker للمبتدئين

## ما هو Docker؟

Docker هو منصة لتطوير وتشغيل التطبيقات في حاويات معزولة.

## المفاهيم الأساسية

| المفهوم | الوصف |
|---------|-------|
| Image | صورة للتطبيق |
| Container | نسخة قيد التشغيل |
| Dockerfile | ملف بناء الصورة |
| Volume | تخزين دائم |

## أوامر Docker الأساسية

\`\`\`bash
# بناء صورة
docker build -t myapp .

# تشغيل حاوية
docker run -p 3000:3000 myapp

# عرض الحاويات
docker ps
\`\`\`
`,
      mainLanguage: 'ar' as const,
      status: 'published' as const,
      isFavorite: true,
      viewsCount: 95,
      commentsEnabled: true,
      tags: [],
      programmingLanguages: [],
      links: [],
      attachments: [],
    },
    {
      title: 'TypeScript Advanced Types',
      slug: 'typescript-advanced',
      summary: 'Deep dive into TypeScript advanced type features',
      content: `# TypeScript Advanced Types

## Generic Types

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello");
\`\`\`

## Utility Types

| Type | Description | Example |
|------|-------------|---------|
| Partial<T> | All optional | Partial<User> |
| Required<T> | All required | Required<User> |
| Pick<T, K> | Select keys | Pick<User, 'name'> |
| Omit<T, K> | Remove keys | Omit<User, 'id'> |

## Conditional Types

\`\`\`typescript
type IsString<T> = T extends string ? true : false;
\`\`\`
`,
      mainLanguage: 'en' as const,
      status: 'published' as const,
      isFavorite: false,
      viewsCount: 220,
      commentsEnabled: true,
      tags: [],
      programmingLanguages: [],
      links: [],
      attachments: [],
    },
  ];

  const demoSnippets = [
    {
      title: 'React Custom Hook',
      description: 'Custom hook for fetching data',
      code: `import { useState, useEffect } from 'react';

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}`,
      languageId: '1',
    },
    {
      title: 'Debounce Function',
      description: 'Utility function for debouncing',
      code: `function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}`,
      languageId: '2',
    },
    {
      title: 'API Error Handler',
      description: 'Express error handling middleware',
      code: `const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;`,
      languageId: '1',
    },
  ];

  const demoCollections = [
    {
      title: 'سلسلة تعلم React',
      slug: 'learn-react-series',
      description: 'سلسلة كاملة لتعلم React من الصفر للاحتراف',
      posts: [],
      targetPostsCount: 10,
    },
    {
      title: 'Backend Development',
      slug: 'backend-dev',
      description: 'Everything you need to know about backend development',
      posts: [],
      targetPostsCount: 15,
    },
    {
      title: 'DevOps Essentials',
      slug: 'devops-essentials',
      description: 'Essential DevOps tools and practices',
      posts: [],
      targetPostsCount: 8,
    },
  ];

  const demoGalleryImages = [
    {
      dataUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
      caption: 'Code on screen',
      description: 'Programming workspace',
      tags: ['programming', 'code'],
    },
    {
      dataUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      caption: 'Developer workspace',
      description: 'Modern development setup',
      tags: ['workspace', 'setup'],
    },
  ];

  const demoReports = [
    {
      title: 'تقرير أداء التطبيق',
      content: `# تقرير أداء التطبيق

## ملخص تنفيذي

هذا التقرير يوضح أداء التطبيق خلال الشهر الماضي ويقدم توصيات للتحسين.

## الإحصائيات الرئيسية

| المقياس | القيمة الحالية | الشهر السابق | التغير |
|---------|----------------|--------------|--------|
| المستخدمين النشطين | 1,500 | 1,200 | +25% |
| الزيارات اليومية | 45,000 | 34,615 | +30% |
| معدل الارتداد | 35% | 40% | -5% |
| متوسط مدة الجلسة | 4:30 | 3:45 | +20% |

## تحليل الأداء

### سرعة التحميل
- الصفحة الرئيسية: **1.2 ثانية**
- صفحات المحتوى: **0.8 ثانية**
- لوحة التحكم: **1.5 ثانية**

### مؤشرات Core Web Vitals

| المؤشر | القيمة | الحالة |
|--------|--------|--------|
| LCP | 2.1s | ✅ جيد |
| FID | 45ms | ✅ جيد |
| CLS | 0.08 | ✅ جيد |

## التوصيات

1. **تحسين الصور**: ضغط الصور وتحويلها لصيغة WebP
2. **التخزين المؤقت**: تفعيل CDN للملفات الثابتة
3. **تحسين الكود**: إزالة JavaScript غير المستخدم

---

> تم إعداد هذا التقرير بتاريخ ${new Date().toLocaleDateString('ar')}
`,
      tags: ['أداء', 'تحليل', 'تقارير'],
      quickLinks: [
        { id: '1', label: 'Google Analytics', url: 'https://analytics.google.com' },
        { id: '2', label: 'PageSpeed Insights', url: 'https://pagespeed.web.dev' },
      ],
    },
    {
      title: 'Technical Architecture Documentation',
      content: `# Technical Architecture Documentation

## System Overview

This document provides a comprehensive overview of the system architecture and technical specifications.

## Architecture Diagram

\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    API Gateway  │────▶│   Microservices │
│   (React SPA)   │     │    (Kong/NGINX) │     │   (Node/Go)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │   PostgreSQL    │             │     Redis       │             │   Elasticsearch │
               │   (Primary DB)  │             │   (Cache)       │             │   (Search)      │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
\`\`\`

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI/UX |
| State | Zustand + React Query | State Management |
| Styling | Tailwind CSS + shadcn/ui | Design System |
| Backend | Node.js + Express | API Services |
| Database | PostgreSQL 15 | Primary Storage |
| Cache | Redis 7 | Session & Cache |
| Search | Elasticsearch 8 | Full-text Search |

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | User authentication |
| POST | /auth/register | User registration |
| POST | /auth/logout | Session termination |
| POST | /auth/refresh | Token refresh |

### Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create new user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Delete user |

## Security Measures

- [x] JWT token authentication
- [x] Rate limiting (100 req/min)
- [x] CORS configuration
- [x] Input validation
- [ ] Two-factor authentication
- [ ] API key rotation

## Performance Requirements

| Metric | Target | Current |
|--------|--------|---------|
| Response Time (p95) | < 200ms | 185ms |
| Throughput | > 1000 rps | 1200 rps |
| Availability | 99.9% | 99.95% |
| Error Rate | < 0.1% | 0.05% |

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`,
      tags: ['documentation', 'technical', 'architecture'],
      quickLinks: [
        { id: '1', label: 'API Docs', url: 'https://api.example.com/docs' },
        { id: '2', label: 'GitHub Repo', url: 'https://github.com/example/project' },
        { id: '3', label: 'Confluence', url: 'https://confluence.example.com' },
      ],
    },
    {
      title: 'دليل واجهة برمجة التطبيقات',
      content: `# دليل واجهة برمجة التطبيقات (API)

## المقدمة

هذا الدليل يشرح كيفية استخدام واجهة برمجة التطبيقات الخاصة بنا.

## المصادقة

جميع الطلبات تتطلب رمز Bearer Token في الـ Header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     https://api.example.com/v1/users
\`\`\`

## نقاط النهاية

### المستخدمين

| العملية | الطريقة | المسار |
|---------|--------|--------|
| جلب الكل | GET | /v1/users |
| جلب واحد | GET | /v1/users/:id |
| إنشاء | POST | /v1/users |
| تحديث | PUT | /v1/users/:id |
| حذف | DELETE | /v1/users/:id |

### مثال على الاستجابة

\`\`\`json
{
  "success": true,
  "data": {
    "id": "usr_123",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "admin"
  }
}
\`\`\`

## أكواد الحالة

| الكود | المعنى |
|-------|--------|
| 200 | نجاح |
| 201 | تم الإنشاء |
| 400 | طلب غير صالح |
| 401 | غير مصرح |
| 404 | غير موجود |
| 500 | خطأ في الخادم |

## حدود الاستخدام

- **المجاني**: 100 طلب/ساعة
- **المميز**: 1000 طلب/ساعة
- **الشركات**: غير محدود

---

> للدعم الفني: support@example.com
`,
      tags: ['API', 'توثيق', 'دليل'],
      quickLinks: [
        { id: '1', label: 'Postman Collection', url: 'https://postman.com/collection' },
      ],
    },
  ];

  const handleLoadDemoData = async () => {
    setIsLoading(true);
    
    try {
      // Add categories
      demoCategories.forEach(cat => addCategory(cat));
      
      // Add tags
      demoTags.forEach(tag => addTag(tag));
      
      // Add languages
      demoLanguages.forEach(lang => addProgrammingLanguage(lang));
      
      // Add posts
      demoPosts.forEach(post => addPost(post));
      
      // Add snippets
      demoSnippets.forEach(snippet => addSnippet(snippet));
      
      // Add collections
      demoCollections.forEach(col => addCollection(col));
      
      // Add gallery images
      demoGalleryImages.forEach(img => addGalleryImage(img));
      
      // Add reports
      demoReports.forEach(report => addReport(report as any));
      
      toast.success(language === 'ar' ? 'تم تحميل البيانات الوهمية بنجاح!' : 'Demo data loaded successfully!');
    } catch (error) {
      toast.error(language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data');
    }
    
    setIsLoading(false);
  };

  const handleClearAllData = () => {
    // Clear localStorage for both stores
    localStorage.removeItem('blog-storage');
    localStorage.removeItem('reports-storage');
    
    // Reload to reset state
    window.location.reload();
  };

  const totalItems = posts.length + categories.length + tags.length + 
    programmingLanguages.length + snippets.length + collections.length + 
    galleryImages.length + reports.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          {language === 'ar' ? 'إدارة البيانات' : 'Data Management'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'تحميل بيانات وهمية للاختبار أو حذف جميع البيانات' 
            : 'Load demo data for testing or clear all data'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {language === 'ar' ? 'إجمالي العناصر الحالية:' : 'Total current items:'}
          </span>
          <span className="font-semibold">{totalItems}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            onClick={handleLoadDemoData}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {language === 'ar' ? 'تحميل بيانات وهمية' : 'Load Demo Data'}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                {language === 'ar' ? 'حذف جميع البيانات' : 'Clear All Data'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'ar' 
                    ? 'سيتم حذف جميع البيانات نهائياً ولا يمكن استرجاعها.'
                    : 'This will permanently delete all data and cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllData}>
                  {language === 'ar' ? 'حذف الكل' : 'Delete All'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="text-xs text-muted-foreground">
          {language === 'ar' 
            ? '* البيانات الوهمية تشمل: مقالات، تقارير، وسوم، تصنيفات، ومجموعات'
            : '* Demo data includes: posts, reports, tags, categories, and collections'}
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoDataManager;
