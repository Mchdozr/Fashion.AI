import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = 'fa-SrXFbsn4INbb-aXVejFdvMYdCfEPnVlcSkCZY';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      throw new Error('Task ID is required');
    }

    // Check status from Fashn AI API first
    const response = await fetch(`https://api.fashn.ai/v1/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check status from FashnAI API');
    }

    const data = await response.json();

    // Get the generation record
    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (generationError) {
      throw new Error('Generation not found');
    }

    let updateData: any = {
      status: data.status
    };

    if (data.status === 'completed' && data.output?.[0]) {
      updateData.result_image_url = data.output[0];
    }

    // Update generation status
    const { error: updateError } = await supabase
      .from('generations')
      .update(updateData)
      .eq('task_id', taskId);

    if (updateError) {
      throw new Error('Failed to update generation status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: data.status, 
        resultUrl: data.output?.[0] || null
      }),
      {
        status: 200,
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
        status: error instanceof Error && error.message.includes('Generation not found') ? 404 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});