## خطة تنفيذ المرحلة التالية (4 ميزات بالتوازي)

### 1) لوحة إحصائيات شاملة — `/analytics`
- **`src/pages/Analytics.tsx`**: صفحة جديدة مع مخططات Recharts
  - **KPI cards**: إجمالي المقالات، المهام (منجزة/معلقة)، جلسات التركيز، الملاحظات، خرائط ذهنية
  - **مخططات**:
    - Line chart: نشاط آخر 30 يوم (مقالات + مهام + جلسات)
    - Bar chart: توزيع المهام حسب الأولوية
    - Pie chart: توزيع المقالات حسب التصنيف/الوسوم
    - Area chart: وقت التركيز اليومي (من `focus-sessions`)
  - **Streak counter**: أيام النشاط المتتالية
  - يقرأ من: `localStorage` (`tasks-v1`, `focus-sessions`, `quick-notes`, `mindmap-*`) + Supabase (articles/roadmaps)

### 2) محرر Markdown متقدم — `src/components/editor/AdvancedMarkdownEditor.tsx`
- شريط أدوات كامل: عناوين H1-H3، **B**/*I*/~~S~~، قوائم، اقتباس، كود inline/block، جدول، رابط، صورة
- **معاينة مباشرة** جنبًا إلى جنب (split view) أو تبديل
- اختصارات: Ctrl+B/I/K، Tab للمسافة البادئة
- **إدراج صور** عبر paste/drag-drop (base64) أو URL
- **أوضاع**: عادي، مركّز (تخفي الشريط الجانبي)، ملء الشاشة، Zen (كتابة فقط)
- عدّاد كلمات/أحرف/وقت قراءة
- استبدال في: `ArticleEditor` (إذا موجود) وإتاحته في Quick Notes

### 3) نظام الإشعارات والتذكيرات — `src/lib/notifications.ts` + `src/hooks/useReminders.ts`
- طلب Permission عند التفعيل من الإعدادات
- **مصادر التذكيرات**:
  - مهام لها `dueDate` — تنبيه قبل 15 دقيقة/عند الاستحقاق
  - نهاية جلسة التركيز (موجود جزئيًا — نوسّعه ليدعم Web Notification)
  - تذكيرات مخصصة (إضافة/حذف من صفحة جديدة `/reminders` أو دمجها في `/tasks`)
- خدمة polling كل دقيقة عبر `setInterval` في `App.tsx` (hook global)
- Fallback: toast داخل التطبيق إذا Permission مرفوض
- تخزين آخر تنبيه لكل عنصر في `localStorage` لتفادي التكرار

### 4) تصدير/استيراد شامل — `src/pages/BackupRestore.tsx`
- **تصدير**:
  - JSON كامل: كل مفاتيح `localStorage` ذات الصلة + Supabase (articles, roadmaps, notes)
  - ZIP اختياري عبر `jszip` يحوي: `data.json` + مجلد `articles/*.md` منفصل
- **استيراد**:
  - رفع ملف JSON/ZIP
  - معاينة قبل الاستيراد (عدد العناصر لكل نوع)
  - خيارات: **دمج** (بدون تكرار عبر `id`) أو **استبدال كامل**
  - تأكيد PIN (4419) قبل الاستبدال
- **نسخ تلقائية**: زر "نسخة سريعة" تُخزّن آخر 5 نسخ في `localStorage["backups"]`

### التغييرات المشتركة
- **`src/App.tsx`**: مسارات جديدة `/analytics`, `/backup` (+ hook `useReminders` global)
- **`src/components/layout/MainLayout.tsx`**: عناصر تنقّل جديدة بأيقونات `BarChart3`, `Bell`, `Database`
- **`src/pages/Appearance.tsx`**: تبديل تفعيل الإشعارات
- **`bun add jszip recharts`** (recharts موجود على الأغلب)

### التنفيذ بالتوازي
كل ملف مستقل — سنكتبها في نفس الدفعة عبر tool calls متوازية.

هل أبدأ التنفيذ؟