import { useSettingsStore } from '@/store/settingsStore';

export interface OllamaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaResponse {
  model: string;
  message?: {
    role: string;
    content: string;
  };
  error?: string;
}

// Free Ollama Cloud Models
export const OLLAMA_MODELS = [
  { value: 'gemini-3-flash-preview:cloud', label: 'Gemini 3 Flash Preview (Cloud)', category: 'Google' },
  { value: 'kimi-k2.5:cloud', label: 'Kimi K2.5 (Cloud)', category: 'Moonshot' },
  { value: 'deepseek-v3.1:671b-cloud', label: 'DeepSeek V3.1 671B (Cloud)', category: 'DeepSeek' },
  { value: 'qwen3-coder:480b-cloud', label: 'Qwen3 Coder 480B (Cloud)', category: 'Qwen' },
];

export const OLLAMA_HOST = 'https://ollama.com';
export const OLLAMA_DOCS_URL = 'https://ollama.com/cloud';

export async function callOllama(
  messages: OllamaChatMessage[],
  model?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const store = useSettingsStore.getState();
  const keys = store.settings.ollamaKeys?.filter((k) => k.failCount < 3) || [];
  
  if (keys.length === 0) {
    return { success: false, error: 'لا توجد مفاتيح Ollama متاحة. يرجى إضافة مفتاح في الإعدادات.' };
  }
  
  const modelToUse = model || OLLAMA_MODELS[0].value;
  
  // Try each key until one works
  for (const keyData of keys) {
    try {
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyData.key}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          stream: false,
        }),
      });
      
      if (!response.ok) {
        console.error(`Ollama key ${keyData.name} failed with status:`, response.status);
        store.markOllamaKeyFailed(keyData.id);
        continue;
      }
      
      const data: OllamaResponse = await response.json();
      
      if (data.error) {
        console.error(`Ollama key ${keyData.name} error:`, data.error);
        store.markOllamaKeyFailed(keyData.id);
        continue;
      }
      
      // Reset fail count on success
      store.resetOllamaKeyFailCount(keyData.id);
      store.updateOllamaKey(keyData.id, { lastUsed: new Date() });
      
      return {
        success: true,
        content: data.message?.content || '',
      };
    } catch (error) {
      console.error(`Ollama key ${keyData.name} error:`, error);
      store.markOllamaKeyFailed(keyData.id);
      continue;
    }
  }
  
  return { success: false, error: 'فشلت جميع مفاتيح Ollama. يرجى التحقق من المفاتيح أو إضافة مفاتيح جديدة.' };
}

export async function testOllamaKey(key: string): Promise<{ success: boolean; error?: string; model?: string }> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: OLLAMA_MODELS[0].value,
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const data: OllamaResponse = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error };
    }
    
    return { success: true, model: data.model || OLLAMA_MODELS[0].value };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
  }
}
