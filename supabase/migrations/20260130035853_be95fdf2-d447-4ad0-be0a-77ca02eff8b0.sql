-- Create table for storing Ollama API keys securely
CREATE TABLE public.ollama_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    fail_count INTEGER NOT NULL DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ollama_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own keys
CREATE POLICY "Users can view their own Ollama keys"
ON public.ollama_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own keys
CREATE POLICY "Users can create their own Ollama keys"
ON public.ollama_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own keys
CREATE POLICY "Users can update their own Ollama keys"
ON public.ollama_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own keys
CREATE POLICY "Users can delete their own Ollama keys"
ON public.ollama_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_ollama_keys_user_id ON public.ollama_keys(user_id);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_ollama_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ollama_keys_updated_at
BEFORE UPDATE ON public.ollama_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_ollama_keys_updated_at();