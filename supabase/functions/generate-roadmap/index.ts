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
    const { title, languageName } = await req.json();
    
    console.log('Generating roadmap for:', { title, languageName });
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `أنت خبير في إنشاء خرائط طريق تعليمية شاملة ومفصلة للمبرمجين. 
    
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

    const userPrompt = `أنشئ خريطة طريق تفصيلية لتعلم "${title}" (${languageName}) من البداية للاحتراف.`;

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
        });
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
