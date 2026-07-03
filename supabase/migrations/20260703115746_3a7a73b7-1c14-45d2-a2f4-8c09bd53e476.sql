
CREATE TABLE public.shared_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('note','task','mindmap','markdown')),
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shared_docs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_docs TO authenticated;
GRANT ALL ON public.shared_docs TO service_role;

ALTER TABLE public.shared_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public shared docs"
  ON public.shared_docs FOR SELECT
  USING (is_public = true);

CREATE POLICY "Owners manage their shared docs"
  ON public.shared_docs FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER shared_docs_updated_at
  BEFORE UPDATE ON public.shared_docs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_docs;
ALTER TABLE public.shared_docs REPLICA IDENTITY FULL;

CREATE INDEX idx_shared_docs_token ON public.shared_docs(share_token);
CREATE INDEX idx_shared_docs_owner ON public.shared_docs(owner_id);
