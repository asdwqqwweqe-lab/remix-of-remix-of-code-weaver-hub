import { marked } from 'marked';
import DOMPurify from 'dompurify';

export type ImportKind = 'post' | 'report';

export interface ParsedImport {
  title: string;
  summary: string;
  tags: string[];
  markdown: string;
  html: string;
  format: 'json' | 'markdown';
}

export function buildPrompt(opts: { topic: string; kind: ImportKind; lang: 'ar' | 'en'; style: string }) {
  const langName = opts.lang === 'ar' ? 'Arabic' : 'English';
  const what = opts.kind === 'report' ? 'a structured report' : 'a well-organized article/topic';
  return `Write ${what} about: "${opts.topic || '[TOPIC]'}".
Style: ${opts.style}. Language: ${langName}.

Return ONLY one JSON object inside a single \`\`\`json code block, with exactly this shape:
{
  "title": "string",
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "FULL body in rich Markdown: ## headings, bullet lists, **bold**, tables, > quotes, and fenced code blocks with language names. End with a '## Key Takeaways' section."
}
Rules: escape newlines inside "content" as \\n, no text outside the code block.`;
}

function stripFence(s: string): string {
  const m = s.match(/```(?:json)?\s*\n([\s\S]*?)\n```\s*$/i) || s.match(/^```(?:json)?\s*\n([\s\S]*?)```/i);
  return m ? m[1] : s;
}

function tryJson(raw: string): any | null {
  const candidates = [stripFence(raw.trim()), raw.trim()];
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(raw.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch { /* next */ }
  }
  return null;
}

function parseFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { meta: {}, body: md };
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: md.slice(m[0].length) };
}

const toTags = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).map((t) => t.trim()).filter(Boolean);
  if (typeof v === 'string') return v.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  return [];
};

export function mdToHtml(md: string): string {
  return DOMPurify.sanitize(marked.parse(md, { async: false, gfm: true, breaks: false }) as string);
}

export function parseAiResponse(raw: string): ParsedImport | null {
  if (!raw.trim()) return null;
  const json = tryJson(raw);
  if (json && (json.content || json.body || json.sections)) {
    let markdown = String(json.content ?? json.body ?? '');
    if (!markdown && Array.isArray(json.sections)) {
      markdown = json.sections.map((s: any) => `## ${s.heading ?? s.title ?? ''}\n\n${s.content ?? s.body ?? ''}`).join('\n\n');
    }
    return {
      title: String(json.title ?? '').trim(),
      summary: String(json.summary ?? '').trim(),
      tags: toTags(json.tags),
      markdown,
      html: mdToHtml(markdown),
      format: 'json',
    };
  }
  // Markdown (optionally with frontmatter)
  const { meta, body } = parseFrontmatter(raw.trim());
  let markdown = body.trim();
  let title = meta.title ?? '';
  if (!title) {
    const h = markdown.match(/^#\s+(.+)\n?/);
    if (h) { title = h[1].trim(); markdown = markdown.slice(h[0].length).trim(); }
  }
  if (!title) title = (markdown.split('\n').find((l) => l.trim()) ?? '').replace(/^[#>*\-\s]+/, '').slice(0, 100);
  const firstPara = markdown.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith('#') && !p.trim().startsWith('```')) ?? '';
  return {
    title,
    summary: meta.summary ?? firstPara.replace(/[*_`>#]/g, '').trim().slice(0, 300),
    tags: toTags(meta.tags),
    markdown,
    html: mdToHtml(markdown),
    format: 'markdown',
  };
}
