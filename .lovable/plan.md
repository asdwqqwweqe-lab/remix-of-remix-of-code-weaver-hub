# خطة تنفيذ 4 ميزات بالتوازي

## نظرة عامة
سيتم إنشاء 4 صفحات مستقلة، لكل منها ملف واحد فقط + إدخال في التنقل. بدون تعديلات backend — كلها LocalStorage.

---

## 1) مدير المهام اليومية `/tasks`

**الملف:** `src/pages/Tasks.tsx`

- بنية `Task`: `{ id, title, notes?, priority: 'low'|'med'|'high', dueDate?, tags: string[], completed, createdAt }`
- تخزين: `localStorage["tasks-v1"]`
- الواجهة:
  - شريط إضافة سريعة (Enter للحفظ)
  - فلاتر: الكل / اليوم / متأخرة / منجزة
  - فرز: حسب الأولوية أو تاريخ الاستحقاق
  - بحث نصي + وسوم قابلة للنقر
  - عدّاد إنجاز اليوم + شريط تقدّم
- إجراءات: تحديد كمنجز، تعديل داخل السطر، حذف، تكرار المهمة

## 2) مولّد كلمات مرور `/password`

**الملف:** `src/pages/PasswordGen.tsx`

- خيارات: الطول (8-64 slider)، أحرف كبيرة/صغيرة/أرقام/رموز، استبعاد المتشابهة (`0O1lI`)
- توليد فوري عبر `crypto.getRandomValues`
- مؤشر قوة (Zxcvbn-lite تقديري بدون مكتبات: entropy = log2(pool^length))
- زر توليد passphrase (4-6 كلمات من قائمة مدمجة)
- سجل آخر 10 كلمات مرور (LocalStorage، خيار مسح)
- نسخ للحافظة + toast

## 3) مؤقت تركيز متقدم `/focus`

**الملف:** `src/pages/FocusTimer.tsx`

- جلسات قابلة للتخصيص (25/50/90 دقيقة أو مخصص)
- 3 حالات: تركيز، استراحة قصيرة، استراحة طويلة (كل 4 دورات)
- عدّاد دائري SVG كبير مع نسبة مئوية
- تسجيل جلسات مكتملة: `{ date, duration, label }` في LocalStorage
- إحصائيات: مجموع دقائق اليوم/الأسبوع، عدد الجلسات، أطول سلسلة أيام
- هدف يومي قابل للتعديل + شريط تقدّم
- إشعار صوتي (Web Audio API tone)

## 4) مدير مقتطفات API `/api-snippets`

**الملف:** `src/pages/ApiSnippets.tsx`

- بنية `Snippet`: `{ id, name, method, url, headers: Record<string,string>, body?, createdAt }`
- تخزين: `localStorage["api-snippets-v1"]`
- نموذج: اختيار METHOD (GET/POST/PUT/PATCH/DELETE)، URL، JSON headers، body
- زر **تشغيل** يستخدم `fetch` مباشرة ويعرض:
  - حالة + مدة + حجم الاستجابة
  - Body مُنسّق (JSON pretty) مع تبويب raw
  - Headers الاستجابة
- استبدال متغيرات `{{VAR}}` من جدول متغيرات بيئة (localStorage)
- استيراد/تصدير JSON
- بحث في المقتطفات

---

## ملفات مشتركة (تعديل)

- **`src/App.tsx`**: إضافة 4 مسارات lazy جديدة
- **`src/components/layout/MainLayout.tsx`**: 4 روابط + أيقونات
  - Tasks: `CheckSquare`
  - Password: `KeyRound`
  - Focus: `Timer`
  - API: `Send`

## تفاصيل تقنية

- كل الحالة عبر `useState` + `useEffect` sync إلى LocalStorage
- استعمال `sonner` toast للإشعارات (موجود)
- استخدام مكونات shadcn الموجودة: `Card`, `Button`, `Input`, `Tabs`, `Slider`, `Select`, `Badge`, `Progress`
- التوافق مع الثيم الحالي (dark + teal/coral tokens من `index.css`)
- دعم RTL/LTR عبر `useLanguage()`

## التنفيذ
كتابة الملفات الأربعة الجديدة بالتوازي في استدعاء واحد، ثم تحديث `App.tsx` و `MainLayout.tsx` معاً.
