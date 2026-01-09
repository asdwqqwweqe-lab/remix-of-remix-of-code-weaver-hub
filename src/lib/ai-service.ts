import { useSettingsStore } from '@/store/settingsStore';
import { callOpenRouter, ChatMessage } from './openrouter';
import { callGemini } from './gemini';
import { supabase } from '@/integrations/supabase/client';

export interface AIServiceResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Unified AI service that uses the provider selected in settings
 */
export async function callAI(
  prompt: string,
  systemPrompt?: string
): Promise<AIServiceResult> {
  const store = useSettingsStore.getState();
  const provider = store.settings.defaultProvider;

  switch (provider) {
    case 'lovable':
      return callLovableAI(prompt, systemPrompt);
    
    case 'gemini':
      return callGemini(prompt, systemPrompt);
    
    case 'openrouter':
      const messages: ChatMessage[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });
      return callOpenRouter(messages);
    
    default:
      return callLovableAI(prompt, systemPrompt);
  }
}

/**
 * Call Lovable AI via edge function with automatic retry on rate limit
 */
async function callLovableAI(
  prompt: string,
  systemPrompt?: string,
  retryCount = 0
): Promise<AIServiceResult> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  try {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { prompt, systemPrompt },
    });

    if (error) {
      console.error('Lovable AI error:', error);
      
      // Handle rate limit with retry
      if (error.message?.includes('429') && retryCount < MAX_RETRIES) {
        console.log(`Rate limited, retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return callLovableAI(prompt, systemPrompt, retryCount + 1);
      }
      
      return { success: false, error: error.message || 'خطأ في الاتصال بالذكاء الاصطناعي' };
    }

    if (data?.error) {
      // Handle rate limit error from edge function response
      if (data.error.includes('429') || data.error.includes('حد الطلبات')) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Rate limited (from data), retrying... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return callLovableAI(prompt, systemPrompt, retryCount + 1);
        }
        return { success: false, error: 'تم تجاوز حد الطلبات. يرجى المحاولة بعد دقيقة.' };
      }
      
      // Handle payment required
      if (data.error.includes('402') || data.error.includes('رصيد')) {
        return { success: false, error: 'يرجى إضافة رصيد إلى حسابك في Lovable' };
      }
      
      return { success: false, error: data.error };
    }

    return { success: true, content: data?.content || '' };
  } catch (error) {
    console.error('Lovable AI exception:', error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return callLovableAI(prompt, systemPrompt, retryCount + 1);
    }
    
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}

/**
 * Stream AI response (for providers that support it)
 */
export async function streamAI(
  prompt: string,
  systemPrompt: string,
  onDelta: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  const store = useSettingsStore.getState();
  const provider = store.settings.defaultProvider;

  // For now, all streaming goes through Lovable AI edge functions
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ prompt, systemPrompt, provider }),
    }
  );

  if (!response.ok || !response.body) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'فشل في الاتصال');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  onDone();
}

export function getAIProviderName(): string {
  const store = useSettingsStore.getState();
  switch (store.settings.defaultProvider) {
    case 'lovable': return 'Lovable AI';
    case 'gemini': return 'Google Gemini';
    case 'openrouter': return 'OpenRouter';
    default: return 'AI';
  }
}
