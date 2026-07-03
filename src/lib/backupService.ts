import { supabase } from '@/integrations/supabase/client';
import { useBlogStore } from '@/store/blogStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import { useReportStore } from '@/store/reportStore';

const LAST_BACKUP_KEY = 'lastAutoBackupAt';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_KEEP = 10;

export interface BackupSnapshot {
  version: number;
  createdAt: string;
  posts: unknown;
  categories: unknown;
  tags: unknown;
  roadmaps: unknown;
  roadmapSections: unknown;
  settings: unknown;
  pages: unknown;
  reports: unknown;
}

export function buildSnapshot(): BackupSnapshot {
  const blog = useBlogStore.getState();
  const rm = useRoadmapStore.getState();
  const s = useSettingsStore.getState();
  const pb = usePageBuilderStore.getState();
  const rep = useReportStore.getState();
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    posts: blog.posts,
    categories: blog.categories,
    tags: blog.tags,
    roadmaps: rm.roadmaps,
    roadmapSections: rm.roadmapSections,
    settings: s.settings,
    pages: pb.pages,
    reports: rep.reports,
  };
}

export async function createBackup(label = 'Auto Backup', isAuto = true) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('يتطلب تسجيل الدخول لإنشاء نسخة احتياطية');
  const snapshot = buildSnapshot();
  const json = JSON.stringify(snapshot);
  const { data, error } = await supabase
    .from('backup_versions')
    .insert({
      user_id: userData.user.id,
      label,
      snapshot: snapshot as never,
      size_bytes: new Blob([json]).size,
      is_auto: isAuto,
    })
    .select()
    .single();
  if (error) throw error;
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  await pruneOldBackups(userData.user.id);
  return data;
}

async function pruneOldBackups(userId: string) {
  const { data } = await supabase
    .from('backup_versions')
    .select('id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!data || data.length <= MAX_KEEP) return;
  const idsToDelete = data.slice(MAX_KEEP).map((r) => r.id);
  await supabase.from('backup_versions').delete().in('id', idsToDelete);
}

export async function listBackups() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return [];
  const { data } = await supabase
    .from('backup_versions')
    .select('id, label, size_bytes, is_auto, created_at')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function loadBackup(id: string): Promise<BackupSnapshot | null> {
  const { data, error } = await supabase
    .from('backup_versions')
    .select('snapshot')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data.snapshot as unknown as BackupSnapshot;
}

export async function deleteBackup(id: string) {
  await supabase.from('backup_versions').delete().eq('id', id);
}

export async function restoreBackup(id: string) {
  const snap = await loadBackup(id);
  if (!snap) throw new Error('تعذّر تحميل النسخة');
  // Restore each store's persisted slice via zustand setState.
  useBlogStore.setState({
    posts: snap.posts as never,
    categories: snap.categories as never,
    tags: snap.tags as never,
  });
  useRoadmapStore.setState({
    roadmaps: snap.roadmaps as never,
    roadmapSections: snap.roadmapSections as never,
  });
  useSettingsStore.setState({ settings: snap.settings as never });
  usePageBuilderStore.setState({ pages: snap.pages as never });
  useReportStore.setState({ reports: snap.reports as never });
}

export async function maybeRunWeeklyBackup() {
  try {
    const last = localStorage.getItem(LAST_BACKUP_KEY);
    if (last && Date.now() - new Date(last).getTime() < WEEK_MS) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return; // silent skip when signed out
    await createBackup('Weekly Auto Backup', true);
    console.info('[backup] weekly snapshot created');
  } catch (e) {
    console.warn('[backup] weekly backup skipped:', e);
  }
}
