
-- quiz_results
ALTER TABLE public.quiz_results ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.quiz_results ALTER COLUMN user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Allow public insert" ON public.quiz_results;
DROP POLICY IF EXISTS "Allow public read" ON public.quiz_results;

REVOKE ALL ON public.quiz_results FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_results TO authenticated;
GRANT ALL ON public.quiz_results TO service_role;

CREATE POLICY "Users can view own quiz results"
  ON public.quiz_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON public.quiz_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz results"
  ON public.quiz_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- saved_explanations
ALTER TABLE public.saved_explanations ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.saved_explanations ALTER COLUMN user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Allow public insert" ON public.saved_explanations;
DROP POLICY IF EXISTS "Allow public read" ON public.saved_explanations;
DROP POLICY IF EXISTS "Allow public delete" ON public.saved_explanations;

REVOKE ALL ON public.saved_explanations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_explanations TO authenticated;
GRANT ALL ON public.saved_explanations TO service_role;

CREATE POLICY "Users can view own saved explanations"
  ON public.saved_explanations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved explanations"
  ON public.saved_explanations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved explanations"
  ON public.saved_explanations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
