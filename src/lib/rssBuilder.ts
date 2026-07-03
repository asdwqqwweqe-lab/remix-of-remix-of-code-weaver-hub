import type { Post, Category, ProgrammingLanguage } from '@/types/blog';

function xmlEscape(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface FeedChannel {
  title: string;
  link: string;
  description?: string;
  language?: string;
}
export interface FeedItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
  categories?: string[];
}

export function buildRss(channel: FeedChannel, items: FeedItem[]): string {
  const itemsXml = items
    .map((it) => {
      const cats = (it.categories ?? []).map(c => `      <category>${xmlEscape(c)}</category>`).join('\n');
      return `    <item>
      <title>${xmlEscape(it.title)}</title>
      <link>${xmlEscape(it.link)}</link>
      <guid isPermaLink="true">${xmlEscape(it.guid ?? it.link)}</guid>
${it.pubDate ? `      <pubDate>${xmlEscape(it.pubDate)}</pubDate>\n` : ''}${cats ? cats + '\n' : ''}${it.description ? `      <description><![CDATA[${it.description}]]></description>\n` : ''}    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(channel.title)}</title>
    <link>${xmlEscape(channel.link)}</link>
    <description>${xmlEscape(channel.description ?? '')}</description>
${channel.language ? `    <language>${xmlEscape(channel.language)}</language>\n` : ''}    <atom:link href="${xmlEscape(channel.link)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}

export interface FeedFilters {
  categoryId?: string | null;
  languageId?: string | null;
  contentLanguage?: 'ar' | 'en' | null;
  tag?: string | null;
}

export function filterPostsForFeed(posts: Post[], filters: FeedFilters): Post[] {
  return posts
    .filter(p => p.status === 'published')
    .filter(p => !filters.categoryId || p.categoryId === filters.categoryId)
    .filter(p => !filters.languageId || p.programmingLanguages?.includes(filters.languageId))
    .filter(p => !filters.contentLanguage || p.mainLanguage === filters.contentLanguage)
    .filter(p => !filters.tag || p.tags?.includes(filters.tag))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}

export function postsToFeed(
  posts: Post[],
  channel: FeedChannel,
  categories: Category[],
  languages: ProgrammingLanguage[]
): string {
  const items: FeedItem[] = posts.map(p => {
    const cats: string[] = [];
    const cat = categories.find(c => c.id === p.categoryId);
    if (cat) cats.push(p.mainLanguage === 'ar' ? cat.nameAr : cat.nameEn);
    for (const lid of p.programmingLanguages ?? []) {
      const lang = languages.find(l => l.id === lid);
      if (lang) cats.push(lang.name);
    }
    return {
      title: p.title || 'Untitled',
      link: `${channel.link.replace(/\/$/, '')}/posts/${p.slug || p.id}`,
      description: p.summary || '',
      pubDate: new Date(p.createdAt).toUTCString(),
      guid: p.id,
      categories: cats,
    };
  });
  return buildRss(channel, items);
}

export function downloadFeed(xml: string, filename: string) {
  const blob = new Blob([xml], { type: 'application/rss+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
