## خطة تنفيذ المرحلة التالية (4 مسارات بالتوازي)

### 1) مساعد AI داخل التطبيق — دردشة سياقية
- **`supabase/functions/ai-assistant/index.ts` (جديد)**: Edge Function يستخدم `@ai-sdk/openai-compatible` + `streamText` مع Lovable AI Gateway
  - النموذج الافتراضي: `google/gemini-3-flash-preview`
  - يقبل `messages: UIMessage[]` + `context` اختياري (نص مقال/ملاحظة حالية) يُحقن في system prompt
- **`src/components/ai/AIAssistantDrawer.tsx` (جديد)**: Drawer جانبي يفتح من زر عائم أو Cmd+J
  - يستخدم `useChat` من `@ai-sdk/react` + `DefaultChatTransport`
  - يعرض messages مع `react-markdown` (موجود على الأغلب)
  - يلتقط تلقائياً المقال/الملاحظة النشطة إن وُجدت لتمريرها كسياق
  - أزرار سريعة: "لخّص هذا"، "أجب على سؤال"، "اقترح تحسينات"، "أنشئ اختبارات"
- **`src/pages/PostDetails.tsx`**: زر "اسأل AI عن هذا المقال" يفتح Drawer مع السياق مُعبّأ
- **حفظ محادثة واحدة** فقط في localStorage (`ai-assistant-messages`)
- تكامل زر عائم global في `MainLayout` بجانب QuickNotes

### 2) تعاون فوري Realtime — مشاركة مباشرة
- **Migration**: جدول `shared_docs`:
  ```
  id uuid PK, owner_id uuid, kind text ('note'|'task'|'mindmap'),
  content jsonb, share_token text unique, viewers text[],
  created_at, updated_at
  ```
  + GRANT + RLS + `ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_docs`
- **`src/pages/SharedDoc.tsx` (جديد)**: مسار عام `/s/:token` يعرض المستند بالقراءة الفقط ويشترك في تحديثات Realtime
- **`src/components/sharing/ShareLiveButton.tsx` (جديد)**: زر "شارك مباشرة" في QuickNotes/Tasks/MindMap ينشئ share_token ويعطي رابط قابل للنسخ + عدّاد المشاهدين النشطين عبر Presence
- **`src/hooks/useLiveShare.ts` (جديد)**: يستقبل تعديلات المستند ويبثّها (throttled 500ms)
- Presence عبر `supabase.channel(token, { config: { presence: { key: userId }}})` لعرض عدد المشاهدين

### 3) ورشة إنتاجية متكاملة — `/workshop`
- **`src/pages/Workshop.tsx` (جديد)**: صفحة تجمع بين:
  - **مؤقّت الجلسة**: 90 د افتراضي مع فواصل بومودورو 25/5
  - **قائمة أهداف اليوم**: 3 مهام قصوى (Warren Buffett rule) مُخزّنة في `workshop-goals-<date>`
  - **مخطّط أسبوعي مرئي**: شبكة 7×24 تعرض جلسات التركيز المنجزة (من `focus-sessions`) وتوقّعات اليوم
  - **تذكيرات الراحة**: كل 25 د أثناء الجلسة → إشعار "خذ استراحة" مع مؤقّت 5 د
  - **مقياس الإنتاجية**: نسبة الجلسات المكتملة / المخطّطة، حالة اليوم (متركز/موزّع/كسول) بألوان
  - **يوميات نهاية الجلسة**: reflection سريع بعد كل جلسة (`session-reflections`)
- تكامل مع `useTaskReminders` الموجود

### 4) محرّك معرفة ذكي — روابط تلقائية
- **`src/lib/knowledgeEngine.ts` (جديد)**:
  - `extractKeywords(text)`: يستخرج الكلمات المفتاحية (TF بسيط + إزالة stopwords عربي/إنجليزي)
  - `findRelated(currentId, currentText, allDocs)`: يحسب similarity (Jaccard على tokens) ويرتّب أعلى 5
  - `detectBacklinks(text, allDocs)`: يبحث عن ذكر عناوين مستندات أخرى ويقترح إنشاء [[wiki-links]]
- **`src/components/knowledge/RelatedPanel.tsx` (جديد)**: قسم "قد يهمك أيضاً" يُدرج في PostDetails
- **`src/components/knowledge/BacklinkSuggestions.tsx` (جديد)**: يعرض داخل PostEditor اقتراحات ربط تلقائية (chip يمكن قبوله ليُدرج `[[title]]`)
- **`src/pages/KnowledgeGraph.tsx`**: تحسين — إضافة زر "أعد اكتشاف الروابط" يمرّ على كل المقالات ويولّد edges جديدة تلقائياً
- كل المعالجة client-side بدون AI (خفيف وسريع)

### التغييرات المشتركة
- **`src/App.tsx`**: مسارات `/workshop`, `/s/:token`
- **`src/components/layout/MainLayout.tsx`**: عنصر nav "الورشة" + زر عائم AIAssistantDrawer + اختصار Cmd+J
- **`src/pages/PostDetails.tsx`**: تكامل AI + Related
- **Migration واحد** لجدول `shared_docs`

### التنفيذ المتوازي
كل ملف مستقل. Migration ينفَّذ أولاً.