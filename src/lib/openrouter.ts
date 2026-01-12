import { useSettingsStore } from '@/store/settingsStore';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

export async function callOpenRouter(
  messages: ChatMessage[],
  model?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const store = useSettingsStore.getState();
  const keys = store.settings.openRouterKeys.filter((k) => k.failCount < 3);
  
  if (keys.length === 0) {
    return { success: false, error: 'لا توجد مفاتيح API متاحة. يرجى إضافة مفتاح في الإعدادات.' };
  }
  
  const modelToUse = model || store.settings.defaultModel;
  
  // Try each key until one works
  for (const keyData of keys) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyData.key}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
        }),
      });
      
      const data: OpenRouterResponse = await response.json();
      
      if (data.error) {
        console.error(`Key ${keyData.name} failed:`, data.error.message);
        store.markKeyFailed(keyData.id);
        continue;
      }
      
      // Reset fail count on success
      store.resetKeyFailCount(keyData.id);
      store.updateOpenRouterKey(keyData.id, { lastUsed: new Date() });
      
      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
      };
    } catch (error) {
      console.error(`Key ${keyData.name} error:`, error);
      store.markKeyFailed(keyData.id);
      continue;
    }
  }
  
  return { success: false, error: 'فشلت جميع المفاتيح. يرجى التحقق من المفاتيح أو إضافة مفاتيح جديدة.' };
}

export async function testOpenRouterKey(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
  }
}
