import { useSettingsStore } from '@/store/settingsStore';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
      role: string;
    };
  }[];
  error?: {
    message: string;
    code: number;
  };
}

const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  model?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
  const store = useSettingsStore.getState();
  const keys = store.settings.geminiKeys.filter((k) => k.failCount < 3 && k.isActive);
  
  if (keys.length === 0) {
    return { success: false, error: 'لا توجد مفاتيح Gemini API متاحة. يرجى إضافة مفتاح في الإعدادات.' };
  }
  
  const modelToUse = model || 'gemini-2.0-flash';
  
  // Build contents array
  const contents: GeminiMessage[] = [];
  
  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'مفهوم. سأتبع هذه التعليمات.' }] });
  }
  
  contents.push({ role: 'user', parts: [{ text: prompt }] });
  
  // Try each key until one works
  for (const keyData of keys) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${keyData.key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contents }),
        }
      );
      
      // Handle rate limit with automatic retry
      if (response.status === 429) {
        console.warn(`Gemini Key ${keyData.name}: Rate limited (429), trying next key...`);
        store.markGeminiKeyFailed(keyData.id);
        continue;
      }
      
      const data: GeminiResponse = await response.json();
      
      if (data.error) {
        console.error(`Gemini Key ${keyData.name} failed:`, data.error.message);
        store.markGeminiKeyFailed(keyData.id);
        continue;
      }
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        console.error(`Gemini Key ${keyData.name}: No content in response`);
        store.markGeminiKeyFailed(keyData.id);
        continue;
      }
      
      // Reset fail count on success
      store.resetGeminiKeyFailCount(keyData.id);
      store.updateGeminiKey(keyData.id, { lastUsed: new Date() });
      
      return {
        success: true,
        content: content.trim(),
      };
    } catch (error) {
      console.error(`Gemini Key ${keyData.name} error:`, error);
      store.markGeminiKeyFailed(keyData.id);
      continue;
    }
  }
  
  return { success: false, error: 'فشلت جميع المفاتيح. يرجى التحقق من المفاتيح أو إضافة مفاتيح جديدة.' };
}

export async function testGeminiKey(key: string, model?: string): Promise<{ success: boolean; error?: string; model?: string }> {
  const modelToUse = model || 'gemini-2.0-flash';
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        }),
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      // Try other models if the first one fails
      if (model === undefined) {
        for (const altModel of GEMINI_MODELS.slice(1)) {
          const altResult = await testGeminiKey(key, altModel);
          if (altResult.success) {
            return altResult;
          }
        }
      }
      return { success: false, error: data.error.message };
    }
    
    return { success: true, model: modelToUse };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
  }
}

export const GEMINI_MODELS_LIST = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
];
