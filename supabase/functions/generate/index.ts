import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FASHN_API_KEY = Deno.env.get('FASHN_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!FASHN_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelImage, garmentImage, category, userId } = await req.json();

    if (!modelImage || !garmentImage || !category || !userId) {
      throw new Error('Missing required parameters');
    }

    // Insert new generation record
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        model_image_url: modelImage,
        garment_image_url: garmentImage,
        category,
        status: 'pending',
        performance_mode: 'balanced', // Default value
        num_samples: 1, // Default value
        seed: Math.floor(Math.random() * 1000000),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create generation record: ${insertError.message}`);
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
        category,
        webhook_url: `${SUPABASE_URL}/functions/v1/webhook`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`FashnAI API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.task_id) {
      throw new Error('No task_id received from FashnAI API');
    }

    // Update generation with task ID
    const { error: updateError } = await supabase
      .from('generations')
      .update({ 
        task_id: data.task_id,
        status: 'processing'
      })
      .eq('id', generation.id);

    if (updateError) {
      throw new Error(`Failed to update generation with task_id: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId: data.task_id,
        generationId: generation.id 
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
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