/**
 * Data portability helpers: export whole app state as JSON, todos as iCal,
 * posts as concatenated Markdown, and import a previously exported JSON.
 */

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Dump every localStorage key into a versioned JSON envelope. */
export function exportAllJson() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    const v = localStorage.getItem(k);
    if (v == null) continue;
    try { data[k] = JSON.parse(v); } catch { data[k] = v; }
  }
  const envelope = {
    format: 'devtale-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  download(`devtale-backup-${stamp}.json`, JSON.stringify(envelope, null, 2), 'application/json');
}

/** Replace or merge localStorage with an exported envelope. */
export function importAllJson(text: string, mode: 'merge' | 'replace' = 'merge'): number {
  const parsed = JSON.parse(text);
  if (parsed?.format !== 'devtale-backup' || !parsed?.data) {
    throw new Error('Invalid backup file');
  }
  const entries = Object.entries(parsed.data as Record<string, unknown>);
  if (mode === 'replace') localStorage.clear();
  for (const [k, v] of entries) {
    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }
  return entries.length;
}

interface TodoLike {
  id: string; text: string; completed: boolean;
  priority: 'low' | 'medium' | 'high'; dueDate?: string;
}

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/** Export todos with due dates as iCal (VTODO). */
export function exportTodosIcs(todos: TodoLike[]) {
  const now = icsDate(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DevTale//Todo//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const t of todos) {
    if (!t.dueDate) continue;
    const due = new Date(t.dueDate);
    if (isNaN(due.getTime())) continue;
    lines.push(
      'BEGIN:VTODO',
      `UID:${t.id}@devtale`,
      `DTSTAMP:${now}`,
      `DUE:${icsDate(due)}`,
      `SUMMARY:${icsEscape(t.text)}`,
      `PRIORITY:${t.priority === 'high' ? 1 : t.priority === 'medium' ? 5 : 9}`,
      `STATUS:${t.completed ? 'COMPLETED' : 'NEEDS-ACTION'}`,
      'END:VTODO',
    );
  }
  lines.push('END:VCALENDAR');
  const stamp = new Date().toISOString().slice(0, 10);
  download(`devtale-todos-${stamp}.ics`, lines.join('\r\n'), 'text/calendar');
}

interface PostLike {
  id: string; title: string; slug?: string; summary?: string;
  content: string; status?: string; tags?: string[]; createdAt?: string | Date;
}

/** Export posts as a single concatenated Markdown file with frontmatter. */
export function exportPostsMarkdown(posts: PostLike[]) {
  const parts = posts.map(p => {
    const created = p.createdAt ? new Date(p.createdAt).toISOString() : '';
    const fm = [
      '---',
      `title: ${JSON.stringify(p.title ?? '')}`,
      p.slug ? `slug: ${p.slug}` : '',
      p.status ? `status: ${p.status}` : '',
      created ? `date: ${created}` : '',
      p.tags?.length ? `tags: [${p.tags.map(t => JSON.stringify(t)).join(', ')}]` : '',
      p.summary ? `summary: ${JSON.stringify(p.summary)}` : '',
      '---',
    ].filter(Boolean).join('\n');
    return `${fm}\n\n# ${p.title}\n\n${p.content ?? ''}\n`;
  });
  const stamp = new Date().toISOString().slice(0, 10);
  download(`devtale-posts-${stamp}.md`, parts.join('\n\n---\n\n'), 'text/markdown');
}
