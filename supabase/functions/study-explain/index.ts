import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics, roadmapTitle, languageName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `أنت معلم برمجة خبير ومتخصص في ${languageName}. مهمتك شرح مواضيع البرمجة بطريقة مفصلة ومناسبة للمبتدئين.

**متطلبات الشرح:**
1. ابدأ بمقدمة بسيطة توضح أهمية كل موضوع
2. اشرح كل مفهوم بالتفصيل مع أمثلة عملية
3. استخدم أمثلة كود واضحة ومفهومة
4. أضف تعليقات توضيحية داخل الكود
5. قدم نصائح وأفضل الممارسات
6. أضف تمارين بسيطة للتطبيق
7. اربط المفاهيم ببعضها البعض
8. استخدم لغة بسيطة وسهلة الفهم
9. أضف ملاحظات مهمة وتحذيرات شائعة للمبتدئين
10. اختم بملخص وخطوات التالية

**ملاحظة:** الشرح يجب أن يكون باللغة العربية مع الحفاظ على المصطلحات التقنية بالإنجليزية.`;

    const userPrompt = `اشرح المواضيع التالية من خريطة الطريق "${roadmapTitle}":

${topics}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تجاوزت حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد إلى حسابك" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "حدث خطأ في الاتصال بالذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Study explain error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
