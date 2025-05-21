import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = Deno.env.get('FASHN_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      throw new Error('Task ID is required');
    }

    // Get the generation record
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (generationError) {
      console.error('Generation fetch error:', generationError);
      throw new Error('Generation not found');
    }

    // Check status from Fashn AI API
    const response = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    const data = await response.json();
    console.log('FashnAI status response:', data);

    let updateData = {
      status: data.status
    };

    if (data.status === 'completed' && data.result_url) {
      updateData = {
        ...updateData,
        result_image_url: data.result_url
      };
    }

    // Update generation status
    const { error: updateError } = await supabase
      .from('generations')
      .update(updateData)
      .eq('task_id', taskId);

    if (updateError) {
      console.error('Status update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: data.status, 
        resultUrl: data.result_url 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});