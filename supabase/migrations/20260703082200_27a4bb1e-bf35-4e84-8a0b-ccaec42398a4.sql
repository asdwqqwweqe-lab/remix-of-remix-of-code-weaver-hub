CREATE TABLE public.reading_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id text NOT NULL,
  session_id text NOT NULL,
  scroll_depth integer NOT NULL DEFAULT 0,
  time_on_page integer NOT NULL DEFAULT 0,
  section_id text,
  language text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_analytics_post_id ON public.reading_analytics(post_id);
CREATE INDEX idx_reading_analytics_created_at ON public.reading_analytics(created_at DESC);
CREATE INDEX idx_reading_analytics_session ON public.reading_analytics(session_id);

GRANT SELECT, INSERT ON public.reading_analytics TO anon;
GRANT SELECT, INSERT ON public.reading_analytics TO authenticated;
GRANT ALL ON public.reading_analytics TO service_role;

ALTER TABLE public.reading_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert reading analytics"
  ON public.reading_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read reading analytics"
  ON public.reading_analytics FOR SELECT
  TO anon, authenticated
  USING (true);