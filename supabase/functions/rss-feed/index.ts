import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// Simple RSS 2.0 generator. Data is client-side (localStorage/Firebase),
// so this function accepts POSTed items and returns an XML feed. Also
// supports GET with a placeholder feed for discovery.

interface FeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
}

interface FeedBody {
  channel: { title: string; link: string; description?: string; language?: string };
  items: FeedItem[];
}

function xmlEscape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRss(body: FeedBody) {
  const { channel, items } = body;
  const itemsXml = items
    .map(
      (it) => `    <item>
      <title>${xmlEscape(it.title)}</title>
      <link>${xmlEscape(it.link)}</link>
      <guid isPermaLink="true">${xmlEscape(it.guid ?? it.link)}</guid>
      ${it.pubDate ? `<pubDate>${xmlEscape(it.pubDate)}</pubDate>` : ''}
      ${it.description ? `<description><![CDATA[${it.description}]]></description>` : ''}
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(channel.title)}</title>
    <link>${xmlEscape(channel.link)}</link>
    <description>${xmlEscape(channel.description ?? '')}</description>
    ${channel.language ? `<language>${xmlEscape(channel.language)}</language>` : ''}
${itemsXml}
  </channel>
</rss>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    let body: FeedBody;
    if (req.method === 'POST') {
      body = await req.json();
    } else {
      body = {
        channel: {
          title: 'DevTaleCraft Feed',
          link: 'https://dev-tale-craft.lovable.app',
          description: 'Feed placeholder — POST feed data to generate a full RSS.',
        },
        items: [],
      };
    }
    const xml = buildRss(body);
    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
