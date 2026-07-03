/**
 * Client-side knowledge engine — extracts keywords and computes similarity
 * between documents without any AI calls. Fast, deterministic, works offline.
 */

const STOPWORDS_EN = new Set([
  'the','a','an','and','or','but','if','then','of','in','on','at','to','for','with','by','from','as','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','can','this','that','these','those','it','its','they','them','their','we','us','our','you','your','he','she','him','her','i','me','my','not','no','so','than','too','very','just','also','into','out','up','down','over','under','again','more','less','most','least','some','any','all','each','every','other','such','only','own','same','about','after','before','while','because','who','whom','what','which','when','where','why','how',
]);
const STOPWORDS_AR = new Set([
  'في','من','إلى','على','عن','مع','هذا','هذه','ذلك','تلك','هو','هي','هم','هن','أنت','أنتم','أنا','نحن','كان','كانت','يكون','تكون','لا','ما','لم','لن','قد','قال','قالت','كل','بعض','كما','أن','إن','لكن','أو','ثم','حتى','عند','عندما','كيف','ماذا','لماذا','أين','متى','مَن','التي','الذي','اللذين','اللاتي','هناك','هنا','ايضا','أيضاً','كذلك','كذا','حيث','بين','أمام','خلف','تحت','فوق','قبل','بعد','منذ','لعل','ليت','بل','لكي','كي','حتى','فقط','لدى','لدي','لك','لكم','لنا',
]);

const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    // Keep Arabic letters + Latin letters + digits; strip everything else
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    // Strip diacritics
    .replace(/[\u064B-\u0652]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS_EN.has(w) && !STOPWORDS_AR.has(w));
};

export interface KeywordScore { word: string; count: number; score: number; }

export function extractKeywords(text: string, limit = 10): KeywordScore[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  const total = tokens.length;
  return Array.from(freq.entries())
    .map(([word, count]) => ({ word, count, score: count / total }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface RelatedDoc { id: string; title: string; text: string; }

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function findRelated<T extends RelatedDoc>(
  currentId: string,
  currentText: string,
  docs: T[],
  limit = 5,
): Array<T & { similarity: number }> {
  const currentTokens = new Set(tokenize(currentText));
  return docs
    .filter((d) => d.id !== currentId)
    .map((d) => ({
      ...d,
      similarity: jaccard(currentTokens, new Set(tokenize(`${d.title} ${d.text}`))),
    }))
    .filter((d) => d.similarity > 0.02)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Detect backlink candidates: other docs whose titles appear (case-insensitive,
 * word-boundary aware) inside the current text but are not yet linked.
 */
export function detectBacklinks(
  text: string,
  docs: Array<{ id: string; title: string }>,
): Array<{ id: string; title: string; positions: number[] }> {
  const lower = text.toLowerCase();
  const results: Array<{ id: string; title: string; positions: number[] }> = [];
  for (const doc of docs) {
    if (!doc.title || doc.title.length < 3) continue;
    const t = doc.title.toLowerCase();
    // Skip if already wiki-linked
    if (lower.includes(`[[${t}]]`)) continue;
    const positions: number[] = [];
    let idx = 0;
    while ((idx = lower.indexOf(t, idx)) !== -1) {
      positions.push(idx);
      idx += t.length;
      if (positions.length >= 3) break;
    }
    if (positions.length > 0) results.push({ id: doc.id, title: doc.title, positions });
  }
  return results.slice(0, 8);
}
