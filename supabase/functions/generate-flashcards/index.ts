import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { text, count = 10, language = "ar" } = await req.json();
    if (!text || typeof text !== "string" || text.length < 20) {
      return new Response(JSON.stringify({ error: "text must be at least 20 characters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const n = Math.max(3, Math.min(30, Number(count) || 10));
    const lang = language === "en" ? "English" : "Arabic";

    const sys = `You generate study flashcards. Return ONLY valid JSON of shape:
{"cards":[{"front":"question","back":"answer"}]}
Rules:
- ${n} cards.
- Language: ${lang}. Both front and back in the same language.
- front: concise question/prompt. back: short accurate answer.
- No markdown, no code fences, no extra keys.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: text.slice(0, 8000) },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      return new Response(JSON.stringify({ error: `AI error: ${resp.status}`, details: errText }), {
        status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }
    const cards = Array.isArray(parsed.cards) ? parsed.cards
      .filter((c: any) => c && typeof c.front === "string" && typeof c.back === "string")
      .map((c: any) => ({ front: String(c.front).trim(), back: String(c.back).trim() }))
      .slice(0, n) : [];

    return new Response(JSON.stringify({ cards }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
