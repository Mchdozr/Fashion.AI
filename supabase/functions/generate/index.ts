import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

const FASHN_API_KEY = 'fa-3IbAVWzJdI3Q-muDAOfQF1dg9TDoUgcG3GmCd';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Required environment variables are not set');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

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

    console.log('Auth header present:', !!authHeader);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    const body = await req.json().catch(() => ({}));
    console.log('Request body:', body);

    const { modelImage, garmentImage, category } = body;

    if (!modelImage || !garmentImage || !category) {
      throw new Error('Missing required parameters');
    }

    // Call FashnAI API
    console.log('Calling FashnAI API...');
    const fashnResponse = await fetch('https://api.fashn.ai/v1/run', {
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
      console.error('FashnAI API error:', errorData);
      throw new Error(errorData.message || 'FashnAI API request failed');
    }

    const fashnData = await fashnResponse.json();
    console.log('FashnAI response:', fashnData);

    // Update generation status
    const { error: updateError } = await supabase
      .from('generations')
      .update({ 
        status: 'processing',
        task_id: fashnData.id
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update generation status');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        taskId: fashnData.id 
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