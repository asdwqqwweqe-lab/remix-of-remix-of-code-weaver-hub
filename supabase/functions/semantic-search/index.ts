import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Item { id: string; text: string; title?: string; }

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

async function embed(texts: string[], apiKey: string): Promise<number[][]> {
  const out: number[][] = [];
  // Gemini embedding-001 caps: <=100 items per request, 2048 tokens each.
  for (let i = 0; i < texts.length; i += 90) {
    const batch = texts.slice(i, i + 90).map((t) => t.slice(0, 6000));
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-embedding-001", input: batch }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`embed ${res.status}: ${t.slice(0, 200)}`);
    }
    const j = await res.json();
    for (const d of j.data ?? []) out.push(d.embedding);
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query, items, topK = 8 } = await req.json() as {
      query: string; items: Item[]; topK?: number;
    };
    if (!query?.trim() || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "query and items required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const texts = [query, ...items.map((i) => `${i.title ? i.title + "\n\n" : ""}${i.text}`.slice(0, 6000))];
    const vecs = await embed(texts, key);
    const qv = vecs[0];
    const scored = items.map((it, idx) => {
      const v = vecs[idx + 1];
      const score = v ? cosine(qv, v) : 0;
      // snippet: pick a 240-char window around any query word if possible
      const raw = it.text.replace(/\s+/g, " ").trim();
      const qWord = query.split(/\s+/).find((w) => w.length > 2)?.toLowerCase();
      let snippet = raw.slice(0, 240);
      if (qWord) {
        const i = raw.toLowerCase().indexOf(qWord);
        if (i > 40) snippet = "…" + raw.slice(i - 40, i - 40 + 240);
      }
      return { id: it.id, title: it.title, score, snippet };
    }).sort((a, b) => b.score - a.score).slice(0, topK);

    return new Response(JSON.stringify({ results: scored }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("semantic-search", e);
    const msg = String((e as Error).message || "");
    let status = 500;
    if (msg.includes("402")) status = 402;
    else if (msg.includes("429")) status = 429;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
