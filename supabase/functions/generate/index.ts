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
    console.log('FashnAI response:', fashnData);

    // Update generation with task ID immediately
    const { error: taskUpdateError } = await supabase
      .from('generations')
      .update({
        task_id: fashnData.id,
        status: 'processing'
      })
      .eq('id', generationId);

    if (taskUpdateError) {
      throw new Error('Failed to update generation with task ID');
    }

    // Check initial status
    const statusResponse = await fetch(`https://api.fashn.ai/v1/requests/${fashnData.id}`, {
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to check initial status');
    }

    const statusData = await statusResponse.json();
    console.log('Initial status check:', statusData);

    // If we have an immediate result
    if (statusData.status === 'completed' && statusData.output?.[0]) {
      const resultUrl = statusData.output[0];
      
      // Update generation with result
      const { error: resultUpdateError } = await supabase
        .from('generations')
        .update({
          status: 'completed',
          result_image_url: resultUrl
        })
        .eq('id', generationId);

      if (resultUpdateError) {
        throw new Error('Failed to update generation with result');
      }

      return new Response(
        JSON.stringify({
          success: true,
          taskId: fashnData.id,
          resultUrl: resultUrl
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Start polling for result
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pollResponse = await fetch(`https://api.fashn.ai/v1/requests/${fashnData.id}`, {
        headers: {
          'Authorization': `Bearer ${FASHN_API_KEY}`,
        },
      });

      if (!pollResponse.ok) {
        attempts++;
        continue;
      }

      const pollData = await pollResponse.json();
      console.log('Status check:', { attempt: attempts + 1, status: pollData.status });

      if (pollData.status === 'completed' && pollData.output?.[0]) {
        const resultUrl = pollData.output[0];
        
        // Update generation with result
        const { error: resultUpdateError } = await supabase
          .from('generations')
          .update({
            status: 'completed',
            result_image_url: resultUrl
          })
          .eq('id', generationId);

        if (resultUpdateError) {
          console.error('Failed to update final status:', resultUpdateError);
          throw new Error('Failed to save result URL');
        }

        return new Response(
          JSON.stringify({
            success: true,
            taskId: fashnData.id,
            resultUrl: resultUrl
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        );
      }

      attempts++;
    }

    throw new Error('Generation timed out');

  } catch (error) {
    console.error('Generation error:', error);
    
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