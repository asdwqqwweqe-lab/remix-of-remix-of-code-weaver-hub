import { supabase } from '@/integrations/supabase/client';

export interface SharedSnippet {
  id: string;
  user_id: string;
  author_name: string | null;
  title: string;
  description: string | null;
  code: string;
  language: string | null;
  tags: string[] | null;
  likes_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublishInput {
  title: string;
  description?: string;
  code: string;
  language?: string;
  tags?: string[];
  author_name?: string;
}

/** Publish (or update) a snippet in the shared library. */
export async function publishSnippet(input: PublishInput): Promise<SharedSnippet> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('يتطلب تسجيل الدخول');
  const { data, error } = await supabase
    .from('shared_snippets')
    .insert({
      user_id: userData.user.id,
      author_name: input.author_name ?? userData.user.email?.split('@')[0] ?? null,
      title: input.title,
      description: input.description ?? null,
      code: input.code,
      language: input.language ?? null,
      tags: input.tags ?? [],
      is_public: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SharedSnippet;
}

export async function unpublishSnippet(id: string): Promise<void> {
  const { error } = await supabase.from('shared_snippets').delete().eq('id', id);
  if (error) throw error;
}

export interface ListOptions {
  search?: string;
  language?: string;
  tag?: string;
  sort?: 'recent' | 'popular';
  limit?: number;
}

export async function listSharedSnippets(opts: ListOptions = {}): Promise<{
  items: SharedSnippet[];
  likedIds: Set<string>;
  liveCounts: Map<string, number>;
}> {
  let q = supabase
    .from('shared_snippets')
    .select('*')
    .eq('is_public', true)
    .limit(opts.limit ?? 60);

  if (opts.language) q = q.eq('language', opts.language);
  if (opts.search) q = q.or(`title.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
  if (opts.tag) q = q.contains('tags', [opts.tag]);
  q = opts.sort === 'popular'
    ? q.order('likes_count', { ascending: false })
    : q.order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) throw error;
  const items = (data ?? []) as SharedSnippet[];
  const ids = items.map(i => i.id);

  const liveCounts = new Map<string, number>();
  const likedIds = new Set<string>();
  if (ids.length > 0) {
    const { data: likeRows } = await supabase
      .from('shared_item_likes')
      .select('item_id, user_id')
      .eq('item_type', 'snippet')
      .in('item_id', ids);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    for (const r of likeRows ?? []) {
      liveCounts.set(r.item_id as string, (liveCounts.get(r.item_id as string) ?? 0) + 1);
      if (uid && r.user_id === uid) likedIds.add(r.item_id as string);
    }
  }
  return { items, likedIds, liveCounts };
}

export async function toggleLike(itemId: string, currentlyLiked: boolean): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('يتطلب تسجيل الدخول');
  if (currentlyLiked) {
    const { error } = await supabase
      .from('shared_item_likes')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('item_type', 'snippet')
      .eq('item_id', itemId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('shared_item_likes').insert({
    user_id: userData.user.id,
    item_type: 'snippet',
    item_id: itemId,
  });
  if (error && !String(error.message).includes('duplicate')) throw error;
  return true;
}

export async function listMyPublications(): Promise<SharedSnippet[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];
  const { data } = await supabase
    .from('shared_snippets')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });
  return (data ?? []) as SharedSnippet[];
}

// ================= Gallery =================

export interface SharedGalleryItem {
  id: string;
  user_id: string;
  author_name: string | null;
  title: string;
  description: string | null;
  image_url: string;
  category: string | null;
  tags: string[] | null;
  likes_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublishGalleryInput {
  title: string;
  description?: string;
  image_url: string;
  category?: string;
  tags?: string[];
  author_name?: string;
}

export async function publishGalleryItem(input: PublishGalleryInput): Promise<SharedGalleryItem> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('يتطلب تسجيل الدخول');
  const { data, error } = await supabase
    .from('shared_gallery_items')
    .insert({
      user_id: userData.user.id,
      author_name: input.author_name ?? userData.user.email?.split('@')[0] ?? null,
      title: input.title,
      description: input.description ?? null,
      image_url: input.image_url,
      category: input.category ?? null,
      tags: input.tags ?? [],
      is_public: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SharedGalleryItem;
}

export async function unpublishGalleryItem(id: string): Promise<void> {
  const { error } = await supabase.from('shared_gallery_items').delete().eq('id', id);
  if (error) throw error;
}

export interface GalleryListOptions {
  search?: string;
  category?: string;
  tag?: string;
  sort?: 'recent' | 'popular';
  limit?: number;
}

export async function listSharedGallery(opts: GalleryListOptions = {}): Promise<{
  items: SharedGalleryItem[];
  likedIds: Set<string>;
  liveCounts: Map<string, number>;
}> {
  let q = supabase
    .from('shared_gallery_items')
    .select('*')
    .eq('is_public', true)
    .limit(opts.limit ?? 60);

  if (opts.category) q = q.eq('category', opts.category);
  if (opts.search) q = q.or(`title.ilike.%${opts.search}%,description.ilike.%${opts.search}%`);
  if (opts.tag) q = q.contains('tags', [opts.tag]);
  q = opts.sort === 'popular'
    ? q.order('likes_count', { ascending: false })
    : q.order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) throw error;
  const items = (data ?? []) as SharedGalleryItem[];
  const ids = items.map(i => i.id);

  const liveCounts = new Map<string, number>();
  const likedIds = new Set<string>();
  if (ids.length > 0) {
    const { data: likeRows } = await supabase
      .from('shared_item_likes')
      .select('item_id, user_id')
      .eq('item_type', 'gallery')
      .in('item_id', ids);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    for (const r of likeRows ?? []) {
      liveCounts.set(r.item_id as string, (liveCounts.get(r.item_id as string) ?? 0) + 1);
      if (uid && r.user_id === uid) likedIds.add(r.item_id as string);
    }
  }
  return { items, likedIds, liveCounts };
}

export async function toggleGalleryLike(itemId: string, currentlyLiked: boolean): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('يتطلب تسجيل الدخول');
  if (currentlyLiked) {
    const { error } = await supabase
      .from('shared_item_likes')
      .delete()
      .eq('user_id', userData.user.id)
      .eq('item_type', 'gallery')
      .eq('item_id', itemId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('shared_item_likes').insert({
    user_id: userData.user.id,
    item_type: 'gallery',
    item_id: itemId,
  });
  if (error && !String(error.message).includes('duplicate')) throw error;
  return true;
}

export async function listMyGalleryPublications(): Promise<SharedGalleryItem[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];
  const { data } = await supabase
    .from('shared_gallery_items')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });
  return (data ?? []) as SharedGalleryItem[];
}
