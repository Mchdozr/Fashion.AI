import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];

interface AppContextType {
  user: User | null;
  credits: number;
  modelImage: string | null;
  garmentImage: string | null;
  resultImage: string | null;
  category: string;
  performanceMode: string;
  numSamples: number;
  seed: number;
  isModelReady: boolean;
  isModelGenerating: boolean;
  isGenerating: boolean;
  generationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  generationProgress: number;
  setModelImage: (url: string | null) => void;
  setGarmentImage: (url: string | null) => void;
  setCategory: (category: string) => void;
  setPerformanceMode: (mode: string) => void;
  setNumSamples: (num: number) => void;
  setSeed: (seed: number) => void;
  generateAIModel: () => Promise<void>;
  startGeneration: () => Promise<void>;
}

const categoryMapping = {
  'top': 'upper_body',
  'bottom': 'lower_body',
  'full-body': 'full_body'
};

const FASHN_API_URL = 'https://api.fashn.ai/v1';
const FASHN_API_KEY = 'fa-e92wafgdYrE5-dRAWJrEPHSW7k4lLJ200CSpa';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState(0);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [category, setCategory] = useState('top');
  const [performanceMode, setPerformanceMode] = useState('balanced');
  const [numSamples, setNumSamples] = useState(1);
  const [seed, setSeed] = useState(42);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isModelGenerating, setIsModelGenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setCredits(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return;
    }

    setUser(data);
    setCredits(data.credits);
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const uploadImage = async (imageDataUrl: string): Promise<string> => {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const generateAIModel = async () => {
    if (!modelImage) return;
    setIsModelGenerating(true);
    
    try {
      await delay(2000);
      setIsModelReady(true);
    } catch (error) {
      console.error('Model generation failed:', error);
    } finally {
      setIsModelGenerating(false);
    }
  };

  const startGeneration = async () => {
    if (!modelImage || !garmentImage || !isModelReady || !category || !user) {
      throw new Error('Missing required data for generation');
    }
    
    setIsGenerating(true);
    setGenerationStatus('pending');
    setGenerationProgress(0);
    setResultImage(null);
    
    try {
      console.log('Starting generation with:', {
        category,
        performanceMode,
        numSamples,
        seed
      });

      const modelImageUrl = await uploadImage(modelImage);
      const garmentImageUrl = await uploadImage(garmentImage);

      console.log('Images uploaded successfully:', {
        modelImageUrl,
        garmentImageUrl
      });

      const apiCategory = categoryMapping[category as keyof typeof categoryMapping];
      if (!apiCategory) {
        throw new Error(`Invalid category: ${category}`);
      }

      // Create generation record
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

      console.log('Generation record created:', generation);

      const requestBody = {
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category: apiCategory
      };

      console.log('Sending API request to:', FASHN_API_URL);
      console.log('Request body:', requestBody);

      // Call FashnAI API
      const response = await fetch(`${FASHN_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASHN_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: response.statusText,
          status: response.status 
        }));
        console.error('API request failed:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(errorData.message || `API request failed: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (!data.task_id) {
        throw new Error('No task ID received from API');
      }

      // Update generation with task ID
      await supabase
        .from('generations')
        .update({ 
          task_id: data.task_id,
          status: 'processing'
        })
        .eq('id', generation.id);

      setGenerationStatus('processing');

      // Start polling for status
      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = setInterval(async () => {
        try {
          console.log(`Checking status for task ${data.task_id} (attempt ${attempts + 1}/${maxAttempts})`);
          
          const statusResponse = await fetch(`${FASHN_API_URL}/status/${data.task_id}`, {
            headers: {
              'Authorization': `Bearer ${FASHN_API_KEY}`,
              'Accept': 'application/json'
            }
          });

          if (!statusResponse.ok) {
            const errorData = await statusResponse.json().catch(() => ({ 
              message: statusResponse.statusText,
              status: statusResponse.status 
            }));
            console.error('Status check failed:', {
              status: statusResponse.status,
              statusText: statusResponse.statusText,
              headers: Object.fromEntries(statusResponse.headers.entries()),
              error: errorData
            });
            throw new Error(`Status check failed: ${statusResponse.status} - ${statusResponse.statusText}`);
          }

          const statusData = await statusResponse.json();
          console.log('Status response:', statusData);

          if (statusData.status === 'completed' && statusData.output?.[0]) {
            clearInterval(pollInterval);
            
            const resultUrl = statusData.output[0];
            setResultImage(resultUrl);
            setGenerationStatus('completed');
            setGenerationProgress(100);

            // Update generation with result
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
            throw new Error('Generation failed: ' + (statusData.error || 'Unknown error'));
          }

          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error('Generation timed out after ' + maxAttempts + ' attempts');
          }

          setGenerationProgress(Math.min(90, (attempts / maxAttempts) * 100));
          await delay(2000);

        } catch (error) {
          clearInterval(pollInterval);
          console.error('Status check error:', error);
          
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

  return (
    <AppContext.Provider value={{
      user,
      credits,
      modelImage,
      garmentImage,
      resultImage,
      category,
      performanceMode,
      numSamples,
      seed,
      isModelReady,
      isModelGenerating,
      isGenerating,
      generationStatus,
      generationProgress,
      setModelImage,
      setGarmentImage,
      setCategory,
      setPerformanceMode,
      setNumSamples,
      setSeed,
      generateAIModel,
      startGeneration
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};