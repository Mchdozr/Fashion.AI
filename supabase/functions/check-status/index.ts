import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = 'fa-ECXn1FiBkfBn-rI4qb4wTKU60b1fSLJtzvClq';
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

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map API status to our status
    let status = data.status;
    let resultUrl = null;

    if (status === 'completed' && data.result_url) {
      resultUrl = data.result_url;
      
      // Update the generation record
      const { error: updateError } = await supabase
        .from('generations')
        .update({
          status: status,
          result_image_url: resultUrl
        })
        .eq('task_id', taskId);

      if (updateError) {
        throw new Error('Failed to update generation with result');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: status,
        resultUrl: resultUrl
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
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});