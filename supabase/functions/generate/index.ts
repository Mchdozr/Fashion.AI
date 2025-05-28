import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = 'fa-e92wafgdYrE5-dRAWJrEPHSW7k4lLJ200CSpa';
const FASHN_API_URL = 'https://api.fashn.ai/v1';
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

    const { modelImage, garmentImage, category, generationId } = await req.json();

    if (!modelImage || !garmentImage || !category || !generationId) {
      throw new Error('Missing required parameters');
    }

    const response = await fetch(`${FASHN_API_URL}/run`, {
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

    if (!response.ok) {
      const errorData = await response.json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'FashnAI API request failed');
    }

    const data = await response.json();
    
    if (!data.id) {
      throw new Error('No task ID received from API');
    }

    const { error: updateError } = await supabase
      .from('generations')
      .update({ 
        task_id: data.id,
        status: 'processing'
      })
      .eq('id', generationId);

    if (updateError) {
      throw new Error('Failed to update generation status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId: data.id 
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