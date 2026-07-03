import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface Body {
  code?: string;
  language?: string;
  uiLanguage?: 'ar' | 'en';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: Body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const code = (body.code ?? '').slice(0, 12000);
  const language = body.language ?? 'text';
  const ui = body.uiLanguage === 'en' ? 'en' : 'ar';

  if (!code.trim()) {
    return new Response(JSON.stringify({ error: 'code required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = ui === 'ar'
    ? `أنت مراجع كود خبير. راجع الكود التالي (${language}) وأعِد JSON فقط بهذا الشكل بالضبط:
{
  "summary": "ملخص قصير (جملة أو جملتين) عن ما يفعله الكود",
  "score": 0-10,
  "issues": [
    { "severity": "high|medium|low", "line": رقم أو null, "title": "عنوان قصير", "description": "شرح واضح", "suggestion": "اقتراح إصلاح" }
  ],
  "improvements": ["اقتراح تحسين 1", "اقتراح تحسين 2"],
  "security": ["ملاحظة أمنية إن وُجدت"],
  "complexity": "O(n) أو وصف مختصر"
}
لا تُضف أي نص خارج JSON. الكود:
\`\`\`${language}
${code}
\`\`\``
    : `You are an expert code reviewer. Review this ${language} code and return ONLY JSON matching:
{
  "summary": "short summary of what the code does",
  "score": 0-10,
  "issues": [
    { "severity": "high|medium|low", "line": number or null, "title": "short title", "description": "clear explanation", "suggestion": "how to fix" }
  ],
  "improvements": ["improvement 1", "improvement 2"],
  "security": ["security note if any"],
  "complexity": "O(n) or short description"
}
No prose outside JSON. Code:
\`\`\`${language}
${code}
\`\`\``;

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: ui === 'ar' ? 'تم تجاوز الحد. حاول لاحقاً.' : 'Rate limit exceeded.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: ui === 'ar' ? 'رصيد الذكاء الاصطناعي منتهٍ.' : 'AI credits exhausted.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: `Gateway ${res.status}: ${t}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }
    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
