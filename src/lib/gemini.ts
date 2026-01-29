import { GoogleGenAI } from '@google/genai';
import { useSettingsStore } from '@/store/settingsStore';

// Updated free models list based on Google AI documentation (2025)
// Note: gemini-1.5-* models are deprecated since Apr 29, 2025
const GEMINI_FREE_MODELS = [
  'gemini-2.5-flash',         // Stable - recommended for most use cases
  'gemini-2.5-flash-lite',    // Stable GA - fastest, cost-efficient
  'gemini-2.0-flash',         // Stable - fallback
  'gemini-2.0-flash-lite',    // Stable - lightweight
  'gemini-3-flash-preview',   // Preview - latest experimental
];

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  model?: string;
}

/**
 * Check if error is related to quota exhaustion (limit: 0)
 */
function isQuotaExhausted(message?: string): boolean {
  if (!message) return false;
  return (
    message.includes('Quota exceeded') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('limit: 0') ||
    message.includes('generate_content_free_tier')
  );
}

/**
 * Get unique models array, prioritizing the selected model first
 */
function getModelsToTry(selectedModel: string): string[] {
  const models = [selectedModel, ...GEMINI_FREE_MODELS];
  return Array.from(new Set(models));
}

/**
 * Call Gemini API using the official @google/genai SDK
 */
export async function callGemini(
  prompt: string,
  systemPrompt?: string,
  model?: string
): Promise<GeminiResponse> {
  const store = useSettingsStore.getState();
  const keys = store.settings.geminiKeys.filter((k) => k.failCount < 3 && k.isActive);

  if (keys.length === 0) {
    return { 
      success: false, 
      error: 'لا توجد مفاتيح Gemini API متاحة. يرجى إضافة مفتاح في الإعدادات.' 
    };
  }

  // Use selected model or fall back to the recommended free model
  const selectedModel = model || store.settings.defaultModel || 'gemini-2.5-flash';
  const modelsToTry = getModelsToTry(selectedModel);

  // Build the full prompt with system prompt if provided
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n---\n\n${prompt}`
    : prompt;

  // Try each key until one works
  for (const keyData of keys) {
    // Try each model until one works
    for (const modelName of modelsToTry) {
      try {
        const ai = new GoogleGenAI({ apiKey: keyData.key });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });

        const content = response.text;

        if (!content) {
          console.warn(`Gemini model ${modelName}: Empty response, trying next model...`);
          continue;
        }

        // Success! Reset fail count and update last used
        store.resetGeminiKeyFailCount(keyData.id);
        store.updateGeminiKey(keyData.id, { lastUsed: new Date() });

        return {
          success: true,
          content: content.trim(),
          model: modelName,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Gemini Key ${keyData.name} with model ${modelName} error:`, errorMessage);

        // If quota exhausted for this model, try next model (don't burn the key)
        if (isQuotaExhausted(errorMessage) && modelName !== 'gemini-2.5-flash-lite') {
          console.log(`Quota exhausted for ${modelName}, trying fallback model...`);
          continue;
        }

        // If model not found (404), try next model
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          console.log(`Model ${modelName} not found, trying next model...`);
          continue;
        }

        // For other errors, mark key as failed and try next key
        store.markGeminiKeyFailed(keyData.id);
        break;
      }
    }
  }

  return { 
    success: false, 
    error: 'فشلت جميع المفاتيح. يرجى التحقق من المفاتيح أو استخدام Lovable AI كبديل.' 
  };
}

/**
 * Test a Gemini API key with a simple request
 */
export async function testGeminiKey(
  key: string, 
  model?: string
): Promise<{ success: boolean; error?: string; model?: string }> {
  const modelsToTest = model ? [model] : GEMINI_FREE_MODELS;

  for (const modelName of modelsToTest) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: 'Hi',
      });

      if (response.text) {
        return { success: true, model: modelName };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If model not found or quota issue, try next model
      if (
        errorMessage.includes('404') || 
        errorMessage.includes('not found') ||
        isQuotaExhausted(errorMessage)
      ) {
        continue;
      }

      // Return the error for other cases
      return { success: false, error: errorMessage };
    }
  }

  return { 
    success: false, 
    error: 'فشل اختبار المفتاح مع جميع النماذج المتاحة' 
  };
}

/**
 * Available Gemini models for the UI dropdown
 * Ordered by recommendation: latest stable free models first
 */
export const GEMINI_MODELS_LIST = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (مجاني - موصى به)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (مجاني - سريع جداً)' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (تجريبي - أحدث)' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (مجاني)' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (مجاني - خفيف)' },
];

/**
 * URLs for getting API keys and managing projects
 */
export const GEMINI_API_KEYS_URL = 'https://aistudio.google.com/app/apikey';
export const GEMINI_PROJECTS_URL = 'https://aistudio.google.com/app/projects';

/**
 * Stream content from Gemini using generateContentStream
 * This provides real-time streaming responses for better UX
 */
export async function streamGemini(
  prompt: string,
  systemPrompt: string,
  onDelta: (chunk: string) => void,
  onDone: () => void,
  model?: string
): Promise<void> {
  const store = useSettingsStore.getState();
  const keys = store.settings.geminiKeys.filter((k) => k.failCount < 3 && k.isActive);

  if (keys.length === 0) {
    throw new Error('لا توجد مفاتيح Gemini API متاحة. يرجى إضافة مفتاح في الإعدادات.');
  }

  const selectedModel = model || store.settings.defaultModel || 'gemini-2.5-flash';
  const modelsToTry = getModelsToTry(selectedModel);
  
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n---\n\n${prompt}`
    : prompt;

  let lastError: Error | null = null;

  for (const keyData of keys) {
    for (const modelName of modelsToTry) {
      try {
        const ai = new GoogleGenAI({ apiKey: keyData.key });

        const response = await ai.models.generateContentStream({
          model: modelName,
          contents: fullPrompt,
        });

        // Stream the response chunks
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            onDelta(text);
          }
        }

        // Success! Update key stats
        store.resetGeminiKeyFailCount(keyData.id);
        store.updateGeminiKey(keyData.id, { lastUsed: new Date() });
        
        onDone();
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;
        
        console.warn(`Gemini stream Key ${keyData.name} with model ${modelName} error:`, errorMessage);

        // If quota exhausted, try next model
        if (isQuotaExhausted(errorMessage) && modelName !== 'gemini-2.5-flash-lite') {
          continue;
        }

        // If model not found, try next model
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          continue;
        }

        // For other errors, mark key as failed and try next key
        store.markGeminiKeyFailed(keyData.id);
        break;
      }
    }
  }

  throw lastError || new Error('فشل البث من Gemini. يرجى التحقق من المفاتيح.');
}
