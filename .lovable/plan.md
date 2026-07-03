# المرحلة التالية: AI Auto-Tag + Citation Manager

## 1) AI Auto-Tagging للمقالات
- زر "توليد وسوم بالذكاء" في محرر المقال (Posts editor) بجانب حقل الوسوم.
- Edge Function جديدة `auto-tag-post` تستخدم Lovable AI (`google/gemini-3-flash-preview`) مع structured output (Zod) لإرجاع `{ tags: string[], category?: string, summary?: string }`.
- Input: عنوان + محتوى المقال (مقتطع لأول ~4000 حرف).
- خيار "تطبيق تلقائي عند الحفظ" في الإعدادات (toggle) — عند التفعيل يُستدعى قبل الحفظ إذا كانت الوسوم فارغة.
- Toast يعرض الوسوم المقترحة، والمستخدم يقبل/يرفض قبل الإدراج.

## 2) Citation Manager (للباحثين)
جدول `citations` موجود بالفعل في القاعدة (14 عمود) — سنبني الواجهة فوقه.
- صفحة جديدة `/citations` مع Sidebar entry (أيقونة كتاب).
- CRUD كامل: إضافة/تعديل/حذف مرجع (نوع، مؤلفون، عنوان، سنة، ناشر، DOI، URL، ملاحظات).
- استيراد سريع من DOI عبر `https://api.crossref.org/works/{doi}` (بدون مفتاح).
- تصدير BibTeX (نص عادي) وتنزيله كملف `.bib`.
- ربط المراجع بالمقالات: حقل `post_id` (اختياري) + عرض المراجع داخل صفحة المقال في نهايته كقائمة مرقّمة.
- Shortcode بسيط `[cite:ID]` داخل المحرر يُستبدل بروابط ترقيم `[1]` عند العرض.

## التقنيات
- Edge Functions: `auto-tag-post` (JWT off، Zod validation، CORS).
- Frontend: صفحة `Citations.tsx`، مكوّن `CitationsList` + `CitationForm` + `BibtexExporter`، hook `useCitations` (Supabase).
- تحديث `PostDetails` لعرض المراجع المرتبطة.
- تحديث `Sidebar` + `router` لإضافة مسار `/citations`.

## خارج النطاق (للمراحل القادمة)
- Code Playground (Sandpack/Pyodide)
- Zettelkasten graph view
- AI Code Review
- Reading Analytics dashboard heatmap
