// Önceki AppContext içeriği korunarak sadece startGeneration fonksiyonunda değişiklik yapılacak

const startGeneration = async () => {
  if (!modelImage || !garmentImage || !isModelReady || !category || !user) {
    throw new Error('Missing required data for generation');
  }
  
  setIsGenerating(true);
  setGenerationStatus('pending');
  setGenerationProgress(0);
  setResultImage(null);
  
  try {
    const modelImageUrl = await uploadImage(modelImage);
    const garmentImageUrl = await uploadImage(garmentImage);

    const apiCategory = categoryMapping[category as keyof typeof categoryMapping];
    if (!apiCategory) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Create generation record first
    const { data: generation, error: insertError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        model_image_url: modelImageUrl,
        garment_image_url: garmentImageUrl,
        category: category,
        performance_mode: performanceMode,
        num_samples: numSamples,
        seed: seed,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Call FashnAI API
    const response = await fetch(`${FASHN_API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FASHN_API_KEY}`
      },
      body: JSON.stringify({
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category: apiCategory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.id) {
      throw new Error('No task ID received from API');
    }

    // Update generation with task ID and set status to processing
    await supabase
      .from('generations')
      .update({ 
        task_id: data.id,
        status: 'processing'
      })
      .eq('id', generation.id);

    setGenerationStatus('processing');

    // Start polling for status
    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${FASHN_API_URL}/status/${data.id}`, {
          headers: {
            'Authorization': `Bearer ${FASHN_API_KEY}`
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Status check failed: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed' && statusData.output?.[0]) {
          clearInterval(pollInterval);
          
          const resultUrl = statusData.output[0];
          setResultImage(resultUrl);
          setGenerationStatus('completed');
          setGenerationProgress(100);

          // Update generation with result URL and completed status
          await supabase
            .from('generations')
            .update({
              status: 'completed',
              result_image_url: resultUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', generation.id);

          setIsGenerating(false);
          await fetchUserData(user.id);

        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval);
          throw new Error('Generation failed');
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          throw new Error('Generation timed out');
        }

        setGenerationProgress(Math.min(90, (attempts / maxAttempts) * 100));
        await delay(2000);

      } catch (error) {
        clearInterval(pollInterval);
        console.error('Status check error:', error);
        
        // Update generation status to failed
        await supabase
          .from('generations')
          .update({
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.id);

        setGenerationStatus('failed');
        setIsGenerating(false);
        throw error;
      }
    }, 2000);

  } catch (error) {
    console.error('Generation error:', error);
    setGenerationStatus('failed');
    setIsGenerating(false);
    throw error;
  }
};