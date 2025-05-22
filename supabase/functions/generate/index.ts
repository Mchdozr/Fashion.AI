import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const FASHN_API_KEY = 'fa-lt7AjDCKf71y-gC6Nkdyc4gPv7h6YKmvcRxc7';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required environment variables are not set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { modelImage, garmentImage, category, generationId } = body;

    if (!modelImage || !garmentImage || !category || !generationId) {
      throw new Error('Missing required parameters');
    }

    // Call FashnAI API
    const fashnResponse = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
      body: JSON.stringify({
        model_image: modelImage,
        garment_image: garmentImage,
        category: category
      }),
    });

    if (!fashnResponse.ok) {
      const errorData = await fashnResponse.json()
        .catch(() => ({ message: fashnResponse.statusText }));
      throw new Error(errorData.message || 'FashnAI API request failed');
    }

    const fashnData = await fashnResponse.json();

    // Update generation with task ID and result if available
    const updateData: any = {
      status: fashnData.status || 'processing',
      task_id: fashnData.id
    };

    if (fashnData.status === 'completed' && fashnData.output?.[0]) {
      updateData.result_image_url = fashnData.output[0];
    }

    const { error: updateError } = await supabase
      .from('generations')
      .update(updateData)
      .eq('id', generationId);

    if (updateError) {
      throw new Error('Failed to update generation status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId: fashnData.id,
        status: fashnData.status,
        resultUrl: fashnData.output?.[0]
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});