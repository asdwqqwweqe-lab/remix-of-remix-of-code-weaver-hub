DROP POLICY IF EXISTS "Allow public read reading analytics" ON public.reading_analytics;
REVOKE SELECT ON public.reading_analytics FROM anon, authenticated;
GRANT INSERT ON public.reading_analytics TO anon, authenticated;