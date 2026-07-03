import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Citation = Database['public']['Tables']['citations']['Row'];
export type CitationInsert = Omit<Database['public']['Tables']['citations']['Insert'], 'user_id'>;
export type CitationUpdate = Database['public']['Tables']['citations']['Update'];

export const CITATION_TYPES = [
  'article', 'book', 'inproceedings', 'online', 'techreport', 'thesis', 'misc'
] as const;

export function useCitations() {
  const [items, setItems] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('citations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (input: CitationInsert) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('citations')
      .insert({ ...input, user_id: userData.user.id })
      .select()
      .single();
    if (error) throw error;
    setItems(prev => [data, ...prev]);
    return data;
  }, []);

  const update = useCallback(async (id: string, patch: CitationUpdate) => {
    const { data, error } = await supabase
      .from('citations')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setItems(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('citations').delete().eq('id', id);
    if (error) throw error;
    setItems(prev => prev.filter(c => c.id !== id));
  }, []);

  return { items, loading, error, refresh, add, update, remove };
}

// Fetch citation metadata from CrossRef DOI (public API, no key)
export async function fetchFromDOI(doi: string): Promise<CitationInsert> {
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(clean)}`);
  if (!res.ok) throw new Error(`DOI lookup failed (${res.status})`);
  const json = await res.json();
  const w = json.message;
  const authors = (w.author ?? [])
    .map((a: any) => [a.given, a.family].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' and ');
  const year = w.issued?.['date-parts']?.[0]?.[0] ?? w.published?.['date-parts']?.[0]?.[0];
  const type = w.type?.includes('book') ? 'book'
    : w.type?.includes('proceedings') ? 'inproceedings'
    : w.type?.includes('article') ? 'article' : 'misc';
  return {
    title: Array.isArray(w.title) ? w.title[0] : (w.title ?? clean),
    authors: authors || null,
    year: year ?? null,
    journal: Array.isArray(w['container-title']) ? w['container-title'][0] : (w['container-title'] ?? null),
    publisher: w.publisher ?? null,
    doi: clean,
    url: w.URL ?? `https://doi.org/${clean}`,
    citation_type: type,
    note: null,
    tags: null,
  };
}

// BibTeX serialization
export function toBibtex(c: Citation): string {
  const key = (c.authors?.split(/\s+and\s+/)[0]?.split(' ').pop() ?? 'ref')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() + (c.year ?? '') + c.id.slice(0, 4);
  const fields: [string, string | number | null | undefined][] = [
    ['title', c.title],
    ['author', c.authors],
    ['year', c.year],
    ['journal', c.journal],
    ['publisher', c.publisher],
    ['doi', c.doi],
    ['url', c.url],
    ['note', c.note],
  ];
  const body = fields
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `  ${k} = {${String(v).replace(/[{}]/g, '')}}`)
    .join(',\n');
  return `@${c.citation_type || 'misc'}{${key},\n${body}\n}`;
}

export function exportBibtex(items: Citation[]): string {
  return items.map(toBibtex).join('\n\n');
}
