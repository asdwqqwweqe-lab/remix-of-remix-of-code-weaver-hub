import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OLLAMA_HOST = 'https://ollama.com';

interface OllamaRequest {
  action: 'chat' | 'test' | 'list-keys' | 'add-key' | 'delete-key' | 'update-key';
  messages?: Array<{ role: string; content: string }>;
  model?: string;
  stream?: boolean;
  keyId?: string;
  keyName?: string;
  keyValue?: string;
  isActive?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'يجب تسجيل الدخول أولاً' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'جلسة غير صالحة' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: OllamaRequest = await req.json();
    const { action } = body;

    // Handle different actions
    switch (action) {
      case 'list-keys': {
        const { data: keys, error } = await supabase
          .from('ollama_keys')
          .select('id, name, is_active, fail_count, last_used, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ keys }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add-key': {
        const { keyName, keyValue } = body;
        if (!keyName || !keyValue) {
          return new Response(
            JSON.stringify({ error: 'اسم المفتاح وقيمته مطلوبان' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Test the key first
        const testResult = await testOllamaKey(keyValue);
        if (!testResult.success) {
          return new Response(
            JSON.stringify({ error: `فشل اختبار المفتاح: ${testResult.error}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: newKey, error } = await supabase
          .from('ollama_keys')
          .insert({
            user_id: user.id,
            name: keyName,
            encrypted_key: keyValue, // In production, encrypt this
            is_active: true,
            fail_count: 0,
          })
          .select('id, name, is_active, fail_count, created_at')
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ key: newKey, model: testResult.model }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete-key': {
        const { keyId } = body;
        if (!keyId) {
          return new Response(
            JSON.stringify({ error: 'معرف المفتاح مطلوب' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabase
          .from('ollama_keys')
          .delete()
          .eq('id', keyId)
          .eq('user_id', user.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update-key': {
        const { keyId, keyName, isActive } = body;
        if (!keyId) {
          return new Response(
            JSON.stringify({ error: 'معرف المفتاح مطلوب' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updates: Record<string, unknown> = {};
        if (keyName !== undefined) updates.name = keyName;
        if (isActive !== undefined) updates.is_active = isActive;

        const { error } = await supabase
          .from('ollama_keys')
          .update(updates)
          .eq('id', keyId)
          .eq('user_id', user.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'test': {
        const { keyValue } = body;
        if (!keyValue) {
          return new Response(
            JSON.stringify({ error: 'قيمة المفتاح مطلوبة' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await testOllamaKey(keyValue);
        return new Response(
          JSON.stringify(result),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'chat': {
        const { messages, model, stream } = body;
        if (!messages || messages.length === 0) {
          return new Response(
            JSON.stringify({ error: 'الرسائل مطلوبة' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get active keys for this user
        const { data: keys, error: keysError } = await supabase
          .from('ollama_keys')
          .select('id, encrypted_key, fail_count')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .lt('fail_count', 4)
          .order('fail_count', { ascending: true });

        if (keysError || !keys || keys.length === 0) {
          return new Response(
            JSON.stringify({ error: 'لا توجد مفاتيح Ollama متاحة. يرجى إضافة مفتاح في الإعدادات.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const modelToUse = model || 'gemini-3-flash-preview:cloud';

        // Try each key
        for (const keyData of keys) {
          try {
            if (stream) {
              // Streaming response
              const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${keyData.encrypted_key}`,
                },
                body: JSON.stringify({
                  model: modelToUse,
                  messages,
                  stream: true,
                }),
              });

              if (!response.ok) {
                await markKeyFailed(supabase, keyData.id, keyData.fail_count);
                continue;
              }

              // Reset fail count on success
              await resetKeyFailCount(supabase, keyData.id);

              // Return streaming response
              return new Response(response.body, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/x-ndjson',
                  'Transfer-Encoding': 'chunked',
                },
              });
            } else {
              // Non-streaming response
              const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${keyData.encrypted_key}`,
                },
                body: JSON.stringify({
                  model: modelToUse,
                  messages,
                  stream: false,
                }),
              });

              if (!response.ok) {
                await markKeyFailed(supabase, keyData.id, keyData.fail_count);
                continue;
              }

              const data = await response.json();

              if (data.error) {
                await markKeyFailed(supabase, keyData.id, keyData.fail_count);
                continue;
              }

              // Reset fail count and update last_used on success
              await resetKeyFailCount(supabase, keyData.id);

              return new Response(
                JSON.stringify({
                  success: true,
                  content: data.message?.content || '',
                  model: data.model,
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } catch (error) {
            console.error(`Key ${keyData.id} failed:`, error);
            await markKeyFailed(supabase, keyData.id, keyData.fail_count);
            continue;
          }
        }

        return new Response(
          JSON.stringify({ error: 'فشلت جميع مفاتيح Ollama. يرجى التحقق من المفاتيح.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'إجراء غير معروف' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Ollama proxy error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطأ غير متوقع' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function testOllamaKey(key: string): Promise<{ success: boolean; error?: string; model?: string }> {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview:cloud',
        messages: [{ role: 'user', content: 'Hi' }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error };
    }

    return { success: true, model: data.model || 'gemini-3-flash-preview:cloud' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'خطأ غير معروف' };
  }
}

async function markKeyFailed(supabase: any, keyId: string, currentFailCount: number) {
  await supabase
    .from('ollama_keys')
    .update({ fail_count: currentFailCount + 1 })
    .eq('id', keyId);
}

async function resetKeyFailCount(supabase: any, keyId: string) {
  await supabase
    .from('ollama_keys')
    .update({ fail_count: 0, last_used: new Date().toISOString() })
    .eq('id', keyId);
}
