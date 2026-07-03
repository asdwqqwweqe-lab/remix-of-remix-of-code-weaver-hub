import { supabase } from '@/integrations/supabase/client';

export interface SharedItemComment {
  id: string;
  user_id: string;
  item_type: 'snippet' | 'gallery';
  item_id: string;
  author_name: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export async function listComments(
  itemType: 'snippet' | 'gallery',
  itemId: string,
): Promise<SharedItemComment[]> {
  const { data, error } = await supabase
    .from('shared_item_comments')
    .select('*')
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as SharedItemComment[];
}

export async function addComment(
  itemType: 'snippet' | 'gallery',
  itemId: string,
  body: string,
): Promise<SharedItemComment> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('يتطلب تسجيل الدخول');
  const clean = body.trim();
  if (clean.length === 0 || clean.length > 2000) throw new Error('نص التعليق غير صالح');
  const { data, error } = await supabase
    .from('shared_item_comments')
    .insert({
      user_id: userData.user.id,
      author_name: userData.user.email?.split('@')[0] ?? null,
      item_type: itemType,
      item_id: itemId,
      body: clean,
    })
    .select()
    .single();
  if (error) throw error;
  return data as SharedItemComment;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('shared_item_comments').delete().eq('id', id);
  if (error) throw error;
}

export async function countComments(
  itemType: 'snippet' | 'gallery',
  itemIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (itemIds.length === 0) return out;
  const { data, error } = await supabase
    .from('shared_item_comments')
    .select('item_id')
    .eq('item_type', itemType)
    .in('item_id', itemIds);
  if (error) return out;
  for (const r of data ?? []) {
    out.set(r.item_id as string, (out.get(r.item_id as string) ?? 0) + 1);
  }
  return out;
}
