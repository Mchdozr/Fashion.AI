import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = 'fa-3IbAVWzJdI3Q-muDAOfQF1dg9TDoUgcG3GmCd';
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

    console.log(`Checking status for task: ${taskId}`);

    const response = await fetch(`https://api.fashn.ai/v1/run/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Fashn AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('FashnAI response:', data);

    let status = data.status;
    let resultUrl = null;

    if (status === 'completed' && data.output && data.output.length > 0) {
      resultUrl = data.output[0];
      console.log('Result URL found:', resultUrl);

      // Get the generation record first
      const { data: generation, error: fetchError } = await supabase
        .from('generations')
        .select('id')
        .eq('task_id', taskId)
        .single();

      if (fetchError || !generation) {
        console.error('Failed to fetch generation:', fetchError);
        throw new Error('Generation not found');
      }

      // Update the generation record with the result URL
      const { error: updateError } = await supabase
        .from('generations')
        .update({ 
          status: status,
          result_image_url: resultUrl
        })
        .eq('id', generation.id);

      if (updateError) {
        console.error('Failed to update generation:', updateError);
        throw new Error('Failed to update generation status');
      }

      console.log('Successfully updated generation with result URL');
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