import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = 'fa-CiroGfKMHu6D-RSKwu7ZtZ67E6qySH7AOAM1l';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Add delay utility function for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Verify task exists in database first
    const { data: generation, error: dbError } = await supabase
      .from('generations')
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (dbError || !generation) {
      console.error('Task not found in database:', taskId);
      throw new Error(`Task ID ${taskId} not found in database`);
    }

    // Implement retry logic for Fashn AI API
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const response = await fetch(`https://api.fashn.ai/v1/run/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${FASHN_API_KEY}`,
          },
        });

        const responseText = await response.text();
        console.log(`Attempt ${4 - retries}: Fashn AI raw response:`, responseText);

        if (response.status === 404) {
          console.log(`Task ${taskId} not found on Fashn AI, retrying in 2 seconds...`);
          await delay(2000);
          retries--;
          lastError = new Error(`Task not found on Fashn AI after attempt ${4 - retries}`);
          continue;
        }

        if (!response.ok) {
          throw new Error(`Fashn AI API error: ${response.status} ${response.statusText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (error) {
          console.error('Failed to parse Fashn AI response:', error);
          throw new Error('Invalid response from Fashn AI API');
        }

        console.log('Parsed FashnAI status response:', data);

        let status = data.status;
        let resultUrl = null;

        if (status === 'completed' && data.output && data.output.length > 0) {
          resultUrl = data.output[0];
          console.log('Result URL found:', resultUrl);

          const { error: updateError } = await supabase
            .from('generations')
            .update({ 
              status: status,
              result_image_url: resultUrl
            })
            .eq('task_id', taskId);

          if (updateError) {
            console.error('Supabase status update error:', updateError);
            throw new Error(`Failed to update generation status: ${updateError.message}`);
          }

          console.log('Successfully updated generation status in database');
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
        lastError = error;
        if (retries > 1) {
          console.log(`Attempt failed, retrying in 2 seconds... (${retries - 1} attempts remaining)`);
          await delay(2000);
          retries--;
        } else {
          break;
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('Failed to check status after all retries');

  } catch (error) {
    console.error('Status check error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
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