
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.shared_item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('snippet','gallery')),
  item_id UUID NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sic_item ON public.shared_item_comments (item_type, item_id, created_at DESC);

GRANT SELECT ON public.shared_item_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_item_comments TO authenticated;
GRANT ALL ON public.shared_item_comments TO service_role;

ALTER TABLE public.shared_item_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read comments on public items"
ON public.shared_item_comments FOR SELECT
USING (
  (item_type = 'snippet' AND EXISTS (
    SELECT 1 FROM public.shared_snippets s WHERE s.id = item_id AND s.is_public = true
  ))
  OR (item_type = 'gallery' AND EXISTS (
    SELECT 1 FROM public.shared_gallery_items g WHERE g.id = item_id AND g.is_public = true
  ))
  OR (auth.uid() = user_id)
);

CREATE POLICY "Auth insert own comments"
ON public.shared_item_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update comments"
ON public.shared_item_comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner delete comments"
ON public.shared_item_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_sic_updated_at
BEFORE UPDATE ON public.shared_item_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
