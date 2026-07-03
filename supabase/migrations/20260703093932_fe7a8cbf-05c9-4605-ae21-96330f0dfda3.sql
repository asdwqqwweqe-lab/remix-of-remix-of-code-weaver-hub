
CREATE TABLE public.public_post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  post_id TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.public_post_shares TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_post_shares TO authenticated;
GRANT ALL ON public.public_post_shares TO service_role;

ALTER TABLE public.public_post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read non-revoked shares"
  ON public.public_post_shares FOR SELECT
  USING (revoked = false);

CREATE POLICY "Owners can insert their own shares"
  ON public.public_post_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update their own shares"
  ON public.public_post_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can delete their own shares"
  ON public.public_post_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX public_post_shares_created_by_idx
  ON public.public_post_shares(created_by);

CREATE TRIGGER public_post_shares_set_updated_at
  BEFORE UPDATE ON public.public_post_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
