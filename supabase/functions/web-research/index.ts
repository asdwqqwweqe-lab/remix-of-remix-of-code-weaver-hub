import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { query, language = 'ar' } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = language === 'ar'
      ? 'أنت مساعد بحث خبير. قدّم ملخصاً موجزاً ودقيقاً حول الموضوع باللغة العربية، ثم اقترح 3-5 مراجع ونقاطاً رئيسية.'
      : 'You are an expert research assistant. Provide a concise, accurate summary of the topic, then suggest 3-5 references and key bullet points.';

    const schema = {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        references: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              note: { type: 'string' },
            },
            required: ['title', 'note'],
          },
        },
      },
      required: ['summary', 'keyPoints', 'references'],
    };

    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        tools: [{
          type: 'function',
          function: { name: 'research_result', description: 'Structured research output', parameters: schema },
        }],
        tool_choice: { type: 'function', function: { name: 'research_result' } },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text().catch(() => '');
      return new Response(JSON.stringify({ error: `AI failed: ${upstream.status} ${t}` }), { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await upstream.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = {};
    try { parsed = JSON.parse(call ?? '{}'); } catch { parsed = {}; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
