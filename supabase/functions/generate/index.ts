import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = Deno.env.get('FASHN_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!FASHN_API_KEY) {
  throw new Error('FASHN_API_KEY is not set in environment variables');
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelImage, garmentImage, category, userId } = await req.json();

    // Validate required parameters
    if (!modelImage || !garmentImage || !category || !userId) {
      throw new Error('Missing required parameters');
    }

    // Call Fashn AI API
    const response = await fetch('https://api.fashn.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
      body: JSON.stringify({
        model_image: modelImage,
        garment_image: garmentImage,
        category: category,
        webhook_url: `${SUPABASE_URL}/functions/v1/webhook`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('FashnAI API error:', errorData);
      throw new Error(errorData.message || 'FashnAI API request failed');
    }

    const data = await response.json();
    console.log('FashnAI API response:', data);

    // Update generation with task ID
    const { error: updateError } = await supabase
      .from('generations')
      .update({ 
        task_id: data.task_id,
        status: 'processing'
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, taskId: data.task_id }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Generation error:', error);
    
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