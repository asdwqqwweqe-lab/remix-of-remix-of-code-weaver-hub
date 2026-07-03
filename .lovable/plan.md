## خطة تنفيذ المرحلة التالية (4 مسارات بالتوازي)

### 1) تحسينات المقالات — `src/components/posts/*` و`src/pages/PostDetails.tsx`
- **`TableOfContents.tsx` (جديد)**: يستخرج H1-H3 من محتوى المقال، عرض جانبي لاصق مع تمرير سلس وإبراز القسم النشط عبر `IntersectionObserver`
- **`ReadingProgress.tsx` (جديد)**: شريط تقدّم القراءة أعلى الصفحة + وقت قراءة تقديري
- **تمييز الكود**: تفعيل `highlight.js` (موجود على الأغلب) داخل `marked` renderer لجميع كتل الكود مع أزرار نسخ لكل كتلة
- **`PostDiffDialog.tsx` (جديد)**: مقارنة إصداري المقال (النسخة الحالية vs. المُخزّنة مسبقاً في `post-drafts-v1`) عبر خوارزمية diff بسيطة سطرية بألوان أخضر/أحمر
- دمج المكوّنات داخل `PostDetails.tsx`

### 2) بحث عالمي — `src/components/search/CommandPalette.tsx`
- استخدام `cmdk` (موجود ضمن shadcn) لعرض Dialog يُفتح بـ`Cmd/Ctrl+K`
- **مصادر البحث الموحّدة**:
  - المقالات من `useBlogStore()`
  - المهام من `tasks-v1`
  - الملاحظات السريعة `quick-notes`
  - الخرائط الذهنية `mindmap-*`
  - المقتطفات `snippets` والقصاصات
  - أوامر التنقّل (كل مسارات nav)
- Fuzzy matching بسيط + Groups مع أيقونات + اختصار على اليمين
- تسجيل في `useKeyboardShortcuts` (موجود) لفتح Palette
- استبدال زر `SearchTrigger` الحالي بحيث يفتح Palette الجديد

### 3) دعم PWA وتثبيت التطبيق — Manifest-only
- **`public/manifest.webmanifest`**: name/short_name عربي، `display: "standalone"`، theme/background colors من التوكنز، icons 192/512
- توليد أيقونتين PNG (192, 512) بنفس الشعار الحالي عبر `imagegen`
- **`index.html`**: تعديل `<head>` لإضافة `<link rel="manifest">`, `theme-color`, `apple-touch-icon`
- **`InstallPrompt.tsx` (جديد)**: يستمع لحدث `beforeinstallprompt`، يعرض شريطاً صغيراً بالأسفل مع زر "تثبيت التطبيق"، يُخفى إذا رُفض
- **بدون Service Worker** — الأمر Manifest-only فقط (لم يطلب المستخدم offline)

### 4) لوحة أدوات المطوّر — `src/pages/DevTools.tsx`
- تبويبات (Tabs):
  - **JSON/YAML Formatter**: تنسيق/تصغير/التحقق + عدد المفاتيح
  - **Diff Viewer**: مقارنة نصّين جنباً إلى جنب مع تمييز الفروقات
  - **Regex Tester**: RegExp حي مع مطابقات مُبرَزة وعرض المجموعات
  - **Encoders**: Base64 (encode/decode)، URL (encode/decode)، JWT decoder (header/payload/expiry — بدون تحقق توقيع)
  - **UUID/ULID Generator**
  - **Timestamp Converter**: Unix ↔ ISO ↔ readable
- كل تبويب مكوّن مستقل تحت `src/components/devtools/`
- إضافة المسار `/devtools` + عنصر nav بأيقونة `Wrench`

### التغييرات المشتركة
- **`src/App.tsx`**: مسار جديد `/devtools`
- **`src/components/layout/MainLayout.tsx`**: عنصر nav للأدوات + دمج `CommandPalette` global + `InstallPrompt` global
- **`index.html`**: manifest links

### التنفيذ المتوازي
كل ملف مستقل — يمكن كتابة الكل في نفس الدفعة.