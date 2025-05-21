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

    const response = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check status');
    }

    if (data.status === 'completed' && data.result_url) {
      // Update generation with result URL and completed status
      const { error: updateError } = await supabase
        .from('generations')
        .update({ 
          status: 'completed',
          result_image_url: data.result_url
        })
        .eq('task_id', taskId);

      if (updateError) {
        throw updateError;
      }
    } else if (data.status === 'failed') {
      // Update generation with failed status
      const { error: updateError } = await supabase
        .from('generations')
        .update({ 
          status: 'failed',
          result_image_url: null
        })
        .eq('task_id', taskId);

      if (updateError) {
        throw updateError;
      }
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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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