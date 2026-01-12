import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, languageName, enhance = false, currentStructure = [] } = await req.json();
    
    console.log('Generating roadmap for:', { title, languageName, enhance });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `أنت خبير في إنشاء خرائط طريق تعليمية شاملة ومفصلة للمبرمجين. 
    
قم بإنشاء خريطة طريق تفصيلية للتعلم مقسمة إلى أقسام رئيسية، وكل قسم يحتوي على مواضيع، وكل موضوع يحتوي على مواضيع فرعية.

يجب أن تكون الخريطة:
- مرتبة من المبتدئ للمتقدم
- شاملة لجميع المفاهيم الأساسية والمتقدمة
- تحتوي على 6-10 أقسام رئيسية
- كل قسم يحتوي على 3-6 مواضيع
- كل موضوع يحتوي على 2-5 مواضيع فرعية

أرجع النتيجة بصيغة JSON فقط بالشكل التالي:
{
  "sections": [
    {
      "title": "1. عنوان القسم",
      "description": "وصف مختصر للقسم",
      "topics": [
        {
          "title": "عنوان الموضوع",
          "subtopics": ["موضوع فرعي 1", "موضوع فرعي 2", "موضوع فرعي 3"]
        }
      ]
    }
  ]
}`;

    let userPrompt = `أنشئ خريطة طريق تفصيلية لتعلم "${title}" (${languageName}) من البداية للاحتراف.`;

    // If enhancing existing roadmap
    if (enhance && currentStructure.length > 0) {
      systemPrompt = `أنت خبير في تحسين وتطوير خرائط الطريق التعليمية.

مهمتك:
1. تحليل خريطة الطريق الحالية وإيجاد الفجوات المعرفية
2. إضافة مواضيع فرعية تفصيلية للمواضيع الموجودة
3. إضافة أقسام جديدة للمواضيع المتقدمة أو المهمة التي لم يتم تغطيتها
4. تحسين التنظيم والترتيب
5. إضافة مواضيع متقدمة ومواضيع عملية (Best Practices, Common Mistakes, etc.)

أرجع النتيجة بصيغة JSON فقط للأقسام الجديدة أو المحسّنة:
{
  "sections": [
    {
      "title": "عنوان القسم الجديد أو المحسّن",
      "description": "وصف مختصر",
      "topics": [
        {
          "title": "عنوان الموضوع",
          "subtopics": ["موضوع فرعي 1", "موضوع فرعي 2"]
        }
      ]
    }
  ]
}`;

      userPrompt = `حلّل خريطة الطريق التالية لـ "${title}" (${languageName}) وقدم أقسام جديدة أو محسّنة:

الخريطة الحالية:
${JSON.stringify(currentStructure, null, 2)}

قم بإنشاء أقسام جديدة تتضمن:
- مواضيع فرعية تفصيلية للمواضيع الموجودة
- مواضيع متقدمة لم يتم تغطيتها
- مواضيع عملية (Best Practices، أخطاء شائعة، نصائح الأداء)
- مشاريع عملية ومراجع مفيدة`;
    }

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "الرصيد غير كافٍ، يرجى إضافة رصيد" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });1
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse the JSON from the response
    let roadmapData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        roadmapData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse roadmap data");
    }

    return new Response(JSON.stringify(roadmapData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
