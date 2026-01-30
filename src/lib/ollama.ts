import { supabase } from '@/integrations/supabase/client';

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaKey {
  id: string;
  name: string;
  is_active: boolean;
  fail_count: number;
  last_used: string | null;
  created_at: string;
}

// Free Ollama Cloud Models
export const OLLAMA_MODELS = [
  { value: 'gemini-3-flash-preview:cloud', label: 'Gemini 3 Flash Preview (Cloud)', category: 'Google' },
  { value: 'kimi-k2.5:cloud', label: 'Kimi K2.5 (Cloud)', category: 'Moonshot' },
  { value: 'deepseek-v3.1:671b-cloud', label: 'DeepSeek V3.1 671B (Cloud)', category: 'DeepSeek' },
  { value: 'qwen3-coder:480b-cloud', label: 'Qwen3 Coder 480B (Cloud)', category: 'Qwen' },
  { value: 'llama4-scout:cloud', label: 'Llama 4 Scout (Cloud)', category: 'Meta' },
  { value: 'llama3.3:70b-cloud', label: 'Llama 3.3 70B (Cloud)', category: 'Meta' },
  { value: 'mistral-small:cloud', label: 'Mistral Small (Cloud)', category: 'Mistral' },
  { value: 'devstral:cloud', label: 'Devstral (Cloud)', category: 'Mistral' },
  { value: 'codestral:cloud', label: 'Codestral (Cloud)', category: 'Mistral' },
  { value: 'qwq:cloud', label: 'QwQ (Cloud)', category: 'Qwen' },
  { value: 'phi-4:cloud', label: 'Phi-4 (Cloud)', category: 'Microsoft' },
  { value: 'command-r:cloud', label: 'Command R (Cloud)', category: 'Cohere' },
];

export const OLLAMA_DOCS_URL = 'https://ollama.com/cloud';

/**
 * Get user's Ollama keys from database
 */
export async function getOllamaKeys(): Promise<{ keys: OllamaKey[]; error?: string }> {
  const { data, error } = await supabase.functions.invoke('ollama-proxy', {
    body: { action: 'list-keys' },
  });

  if (error) {
    return { keys: [], error: error.message };
  }

  return { keys: data?.keys || [] };
}

/**
 * Add a new Ollama key
 */
export async function addOllamaKey(
  name: string,
  key: string
): Promise<{ success: boolean; key?: OllamaKey; model?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('ollama-proxy', {
    body: { action: 'add-key', keyName: name, keyValue: key },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, key: data?.key, model: data?.model };
}

/**
 * Delete an Ollama key
 */
export async function deleteOllamaKey(keyId: string): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('ollama-proxy', {
    body: { action: 'delete-key', keyId },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Update an Ollama key
 */
export async function updateOllamaKey(
  keyId: string,
  updates: { name?: string; isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('ollama-proxy', {
    body: { action: 'update-key', keyId, keyName: updates.name, isActive: updates.isActive },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true };
}

/**
 * Test an Ollama key without saving
 */
export async function testOllamaKey(key: string): Promise<{ success: boolean; error?: string; model?: string }> {
  const { data, error } = await supabase.functions.invoke('ollama-proxy', {
    body: { action: 'test', keyValue: key },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data || { success: false, error: 'خطأ غير معروف' };
}

/**
 * Call Ollama API via proxy
 */
export async function callOllama(
  messages: OllamaChatMessage[],
  model?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('ollama-proxy', {
    body: { 
      action: 'chat', 
      messages, 
      model: model || OLLAMA_MODELS[0].value,
      stream: false,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: data.error };
  }

  return { success: true, content: data?.content || '' };
}

/**
 * Stream Ollama response via proxy
 */
export async function streamOllama(
  messages: OllamaChatMessage[],
  onDelta: (chunk: string) => void,
  onDone: () => void,
  model?: string
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  if (!token) {
    throw new Error('يجب تسجيل الدخول أولاً');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ollama-proxy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'chat',
        messages,
        model: model || OLLAMA_MODELS[0].value,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete JSON lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        if (parsed.message?.content) {
          onDelta(parsed.message.content);
        }

        if (parsed.done) {
          onDone();
          return;
        }
      } catch (parseError) {
        // Continue if parse fails
        console.warn('Failed to parse Ollama chunk:', line);
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.message?.content) {
        onDelta(parsed.message.content);
      }
    } catch {
      // Ignore final parse errors
    }
  }

  onDone();
}
