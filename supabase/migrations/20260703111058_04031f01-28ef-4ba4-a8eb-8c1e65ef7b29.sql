
DROP POLICY IF EXISTS "Allow public insert reading analytics" ON public.reading_analytics;

CREATE POLICY "Allow public insert reading analytics"
  ON public.reading_analytics FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(post_id) > 0
    AND length(session_id) > 0
    AND scroll_depth BETWEEN 0 AND 100
    AND time_on_page >= 0
  );
