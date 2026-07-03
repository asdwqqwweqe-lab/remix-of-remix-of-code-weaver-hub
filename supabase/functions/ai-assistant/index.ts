import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, mode } = await req.json() as {
      messages: ChatMessage[];
      context?: string;
      mode?: "summarize" | "improve" | "quiz" | "chat";
    };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modeInstruction: Record<string, string> = {
      summarize: "لخّص المحتوى المُرفق في نقاط واضحة ومفيدة، بنفس لغة المحتوى.",
      improve: "اقترح تحسينات ملموسة على المحتوى: أسلوب، بنية، دقّة، وأمثلة. أعطِ اقتراحات مرقّمة.",
      quiz: "أنشئ 5 أسئلة تعليمية (متعدد الخيارات + سؤال مفتوح) من المحتوى، مع الإجابات في النهاية.",
      chat: "",
    };

    const systemParts = [
      "أنت مساعد ذكي داخل تطبيق مطوّر عربي. أجب بإيجاز واحترافية. استخدم Markdown عندما يكون مفيداً.",
      mode ? modeInstruction[mode] : "",
      context ? `\n\n--- السياق الحالي ---\n${context.slice(0, 8000)}\n--- نهاية السياق ---` : "",
    ].filter(Boolean).join("\n\n");

    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemParts },
      ...messages.filter((m) => m.role !== "system").slice(-20),
    ];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const status = upstream.status;
      let msg = "AI request failed";
      if (status === 429) msg = "تم تجاوز حد الطلبات، حاول لاحقاً";
      else if (status === 402) msg = "الرصيد نفد — يُرجى إضافة رصيد";
      const body = await upstream.text().catch(() => "");
      console.error("AI upstream error", status, body);
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pass-through SSE stream
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    console.error("ai-assistant error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
