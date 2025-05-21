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
      throw new Error('Missing required parameters: modelImage, garmentImage, category, and userId are required');
    }

    // Validate category
    const validCategories = ['top', 'bottom', 'full-body'];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Invalid user ID or user not found');
    }

    const response = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FASHN_API_KEY}`,
      },
      body: JSON.stringify({
        model_image: modelImage,
        garment_image: garmentImage,
        category: category,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Fashn AI API error:', data);
      throw new Error(data.message || 'Failed to start generation');
    }

    const { data: generation, error } = await supabase
      .from('generations')
      .update({ 
        task_id: data.id,
        status: 'processing'
      })
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, taskId: data.id, generation }),
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
        error: error.message,
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