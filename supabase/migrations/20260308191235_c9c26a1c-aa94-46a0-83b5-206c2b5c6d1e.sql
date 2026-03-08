
CREATE TABLE public.page_builder_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  backup_name TEXT NOT NULL DEFAULT 'Backup',
  pages_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_builder_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backups"
ON public.page_builder_backups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
ON public.page_builder_backups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
ON public.page_builder_backups
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
