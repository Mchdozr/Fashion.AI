import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const FASHN_API_KEY = 'fa-ECXn1FiBkfBn-rI4qb4wTKU60b1fSLJtzvClq';
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
    const { modelImage, garmentImage, category } = body;

    if (!modelImage || !garmentImage || !category) {
      throw new Error('Missing required parameters');
    }

    // Get the latest pending generation
    const { data: pendingGeneration, error: fetchError } = await supabase
      .from('generations')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      throw new Error('Failed to fetch pending generation');
    }

    // Call FashnAI API
    const fashnResponse = await fetch('https://api.fashn.ai/v1/generate', {
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

    // Update generation with task ID and initial status
    const { error: updateError } = await supabase
      .from('generations')
      .update({ 
        task_id: fashnData.task_id,
        status: 'processing'
      })
      .eq('id', pendingGeneration.id);

    if (updateError) {
      throw new Error('Failed to update generation status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId: fashnData.task_id 
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