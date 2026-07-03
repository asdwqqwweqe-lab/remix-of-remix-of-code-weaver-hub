# خطة تنفيذ المميزات الجديدة

الخطة مقسّمة إلى 4 مراحل مرتّبة حسب التبعيات (Backend أولاً، ثم الميزات المبنية عليه). كل ميزة مستقلة يمكن تفعيلها/تعطيلها.

---

## المرحلة 1 — أساس البيانات (Backend Foundation)

### 1. Reading Analytics — Heatmap لعمق التمرير
- **الجدول موجود بالفعل**: `reading_analytics(post_id, session_id, scroll_depth, time_on_page, section_id, language)`.
- **جديد**: `src/hooks/useReadingTracker.ts` — يرصد `scrollY` مع throttle 2s، ويرسل عبر Beacon API عند `visibilitychange`.
- **حقن في**: `PostDetails.tsx` (تتبع كامل المقال + كل `<h2>` كـ section).
- **عرض في Dashboard**: قسم جديد `ReadingHeatmap.tsx`:
  - Heatmap عمودي لكل 10% من عمق المقال (كثافة القرّاء).
  - Recharts LineChart لمتوسط وقت القراءة عبر آخر 30 يوماً.
  - جدول Top 10 مقالات حسب Completion Rate (scroll_depth ≥ 90%).

### 2. Backup/Restore أسبوعي مع Versioning
- جدول `backup_versions(id, user_id, snapshot jsonb, size_bytes, created_at, label)` مع RLS + GRANTs.
- `src/lib/backupScheduler.ts` — يفحص عند بدء التطبيق آخر backup؛ إذا > 7 أيام يُنشئ نسخة تلقائياً (يستخدم CloudSync الموجود).
- واجهة في Settings > النسخ الاحتياطي: قائمة versions + استعادة + مقارنة + حذف (نحتفظ بآخر 10).

---

## المرحلة 2 — ذكاء المحتوى (AI Features)

### 3. AI Auto-Tagging عند الحفظ
- Edge Function `auto-tag-post` تستقبل title+content، تستدعي `google/gemini-2.5-flash-lite` عبر Lovable AI بـ `Output.object({ tags: array, category, summary })`.
- زر "اقتراح وسوم بالـ AI" في `PostEditor` + خيار "تلقائي عند الحفظ" في Settings.
- يعرض الوسوم المقترحة كـ Badges قابلة للقبول/الرفض قبل الحفظ.

### 4. AI Code Review للـ Snippets
- Edge Function `review-snippet` — تحليل الأمان، الأداء، best-practices، وأخطاء منطقية.
- زر "AI Review" في صفحة Snippet Detail؛ النتيجة تُعرض في panel جانبي بـ 4 أقسام (Security/Performance/Quality/Bugs) مع severity badges.

---

## المرحلة 3 — أدوات البرمجة والبحث

### 5. Code Playground (Sandpack)
- `bun add @codesandbox/sandpack-react`.
- مكوّن `<CodePlayground language="js|ts|react" code={...} />` — يستبدل أي `<pre><code>` في Snippets/PostDetails لديه attribute `data-playground`.
- Python عبر Pyodide (lazy-load CDN) في مكوّن منفصل `PythonPlayground` لتجنّب زيادة bundle الأساسي.

### 6. Citation Manager + BibTeX Export
- جدول `citations(id, user_id, type, title, authors, year, journal, doi, url, note)` + RLS.
- صفحة `/citations` بجدول CRUD كامل، استيراد من DOI (crossref.org API — مفتوح)، تصدير BibTeX/RIS/APA.
- زر "إدراج اقتباس" في PostEditor يفتح picker من المكتبة ويضيف `[cite:id]` marker يُحوَّل عند العرض.

### 7. Zettelkasten Mode — Backlinks + Graph View
- Parser للمحتوى يستخرج `[[slug]]` links → يحفظ في `post_backlinks(source_id, target_id)` عند حفظ المقال.
- في PostDetails: قسم "مقالات تشير إلى هذه" (backlinks) + "مقالات مرتبطة".
- صفحة `/knowledge-graph` تستخدم `react-force-graph-2d` لعرض شبكة المقالات؛ عقدة = مقال، حافة = link، حجم العقدة = عدد backlinks.

---

## المرحلة 4 — التنظيم والتحفيز

### 8. Content Calendar (Drag & Drop)
- إضافة `scheduled_at` (nullable) لمقالات (client-side في blogStore + optional cloud field).
- صفحة `/calendar` بشبكة شهرية، السحب من "مسودات غير مجدولة" إلى يوم يحدث تاريخ النشر المجدول.
- Badge على المقالات المجدولة في قائمة Posts + فلتر "المجدولة هذا الأسبوع".

### 9. Study Streaks + Gamification
- في `roadmapStore`: `streakData: { currentStreak, longestStreak, lastActivityDate, totalDaysActive, achievements[] }`.
- كل يوم فيه إكمال topic واحد على الأقل → +1 للسلسلة. غياب يوم → reset.
- عرض في Dashboard: بطاقة "🔥 X أيام متتالية" + شبكة GitHub-style للـ 90 يوماً الأخيرة.
- Achievements: 3/7/30/100 يوم + إشعارات عند الفتح (يستخدم نظام الإشعارات الموجود).

### 10. RSS Feeds لكل تصنيف/لغة
- Edge Function `rss-feed` تستقبل `?category=` أو `?language=`، تُرجع XML صالح (RSS 2.0).
- روابط في صفحة Categories/Languages: أيقونة RSS تنسخ الـ URL.
- إضافة `<link rel="alternate" type="application/rss+xml">` في `<head>` للصفحات المناسبة (SEO).

### 11. مكتبة موارد مشتركة (Community Library)
- جدولان: `shared_snippets` و `shared_gallery_items` مع `(user_id, title, content, tags, likes_count, is_public)` + RLS (قراءة عامة، كتابة للمالك).
- صفحة `/community` بتبويبين (Snippets/Gallery)، بحث + فلتر بالوسوم + ترتيب (الأحدث/الأكثر إعجاباً).
- زر "مشاركة مع المجتمع" في صفحات Snippets/Gallery المحلية.
- زر "استيراد للمكتبة الشخصية" على أي عنصر مشترك.

---

## تفاصيل تقنية

**Migrations (بالترتيب مع GRANTs):**
```
backup_versions, citations, post_backlinks,
shared_snippets, shared_gallery_items
```
كل جدول: `GRANT SELECT,INSERT,UPDATE,DELETE ... TO authenticated; GRANT ALL ... TO service_role;` + `GRANT SELECT ... TO anon` فقط للجداول العامة (shared_*).

**Edge Functions جديدة:**
- `auto-tag-post` (verify_jwt=false، يستدعي LOVABLE_API_KEY)
- `review-snippet` (نفس النمط)
- `rss-feed` (verify_jwt=false، يقرأ من public data)

**حزم جديدة:**
- `@codesandbox/sandpack-react`
- `react-force-graph-2d` + `d3-force`
- Pyodide عبر CDN (بدون npm)

**تقسيم الكود:**
- جميع الصفحات الجديدة (`/calendar`, `/citations`, `/knowledge-graph`, `/community`) عبر `React.lazy` — لا زيادة على initial bundle.

**التوافق مع الموجود:**
- يستخدم نظام الإشعارات الحالي (Streaks، AI Tagging).
- يستخدم CloudSync الحالي (Backups).
- يحترم PIN Auth (4419) للعمليات الحسّاسة (حذف backups، مشاركة عامة).

**ترتيب التنفيذ الفعلي:** المرحلة 1 → 2 → 3 → 4، مع commit منفصل لكل ميزة للسماح بالمراجعة.

هل أبدأ التنفيذ من المرحلة 1؟
