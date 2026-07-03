
-- 1. backup_versions
CREATE TABLE public.backup_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Auto Backup',
  snapshot JSONB NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  is_auto BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_versions TO authenticated;
GRANT ALL ON public.backup_versions TO service_role;
ALTER TABLE public.backup_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own backups" ON public.backup_versions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_backup_versions_user_created ON public.backup_versions(user_id, created_at DESC);

-- 2. citations
CREATE TABLE public.citations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  citation_type TEXT NOT NULL DEFAULT 'article',
  title TEXT NOT NULL,
  authors TEXT,
  year INTEGER,
  journal TEXT,
  publisher TEXT,
  doi TEXT,
  url TEXT,
  note TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citations TO authenticated;
GRANT ALL ON public.citations TO service_role;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own citations" ON public.citations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_citations_updated BEFORE UPDATE ON public.citations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. post_backlinks (client-owned data — no user_id required, public read)
CREATE TABLE public.post_backlinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_post_id TEXT NOT NULL,
  target_post_id TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_post_id, target_post_id)
);
GRANT SELECT ON public.post_backlinks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_backlinks TO authenticated;
GRANT ALL ON public.post_backlinks TO service_role;
ALTER TABLE public.post_backlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read backlinks" ON public.post_backlinks FOR SELECT USING (true);
CREATE POLICY "Users insert own backlinks" ON public.post_backlinks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users delete own backlinks" ON public.post_backlinks
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR user_id IS NULL);
CREATE INDEX idx_backlinks_target ON public.post_backlinks(target_post_id);
CREATE INDEX idx_backlinks_source ON public.post_backlinks(source_post_id);

-- 4. shared_snippets
CREATE TABLE public.shared_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shared_snippets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_snippets TO authenticated;
GRANT ALL ON public.shared_snippets TO service_role;
ALTER TABLE public.shared_snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shared snippets" ON public.shared_snippets
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Owner insert shared snippets" ON public.shared_snippets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update shared snippets" ON public.shared_snippets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete shared snippets" ON public.shared_snippets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_shared_snippets_updated BEFORE UPDATE ON public.shared_snippets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. shared_gallery_items
CREATE TABLE public.shared_gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shared_gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_gallery_items TO authenticated;
GRANT ALL ON public.shared_gallery_items TO service_role;
ALTER TABLE public.shared_gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shared gallery" ON public.shared_gallery_items
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Owner insert shared gallery" ON public.shared_gallery_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update shared gallery" ON public.shared_gallery_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete shared gallery" ON public.shared_gallery_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_shared_gallery_updated BEFORE UPDATE ON public.shared_gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. shared_item_likes
CREATE TABLE public.shared_item_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('snippet','gallery')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.shared_item_likes TO authenticated;
GRANT ALL ON public.shared_item_likes TO service_role;
ALTER TABLE public.shared_item_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own likes" ON public.shared_item_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
