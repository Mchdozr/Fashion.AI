import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Generation = Database['public']['Tables']['generations']['Row'];
type User = Database['public']['Tables']['users']['Row'];

const categoryMapping = {
  'top': 'tops',
  'bottom': 'bottoms',
  'full-body': 'one-pieces'
} as const;

// Updated API URL to use the Supabase Edge Function endpoints
const FASHN_API_KEY = 'fa-e92wafgdYrE5-dRAWJrEPHSW7k4lLJ200CSpa';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

interface AppContextType {
  modelImage: string | null;
  setModelImage: (url: string) => void;
  garmentImage: string | null;
  setGarmentImage: (url: string) => void;
  resultImage: string | null;
  category: string;
  setCategory: (category: string) => void;
  isModelGenerating: boolean;
  isModelReady: boolean;
  isGenerating: boolean;
  generationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  generationProgress: number;
  performanceMode: string;
  setPerformanceMode: (mode: string) => void;
  numSamples: number;
  setNumSamples: (num: number) => void;
  seed: number;
  setSeed: (seed: number) => void;
  startGeneration: () => Promise<void>;
  user: User | null;
  credits: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('top');
  
  const [isModelGenerating, setIsModelGenerating] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const [performanceMode, setPerformanceMode] = useState<string>('balanced');
  const [numSamples, setNumSamples] = useState<number>(1);
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 100000));

  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);

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

  useEffect(() => {
    if (modelImage) {
      setIsModelGenerating(true);
      setIsModelReady(false);
      
      setTimeout(() => {
        setIsModelGenerating(false);
        setIsModelReady(true);
        
        if (garmentImage) {
          startGeneration();
        }
      }, 3000);
    }
  }, [modelImage]);

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

  const makeApiRequest = async (url: string, options: RequestInit, retryCount = 0): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${supabase.auth.getSession().then(({ data }) => data.session?.access_token)}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return response;
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return makeApiRequest(url, options, retryCount + 1);
      }
      throw error;
    }
  };

  const startGeneration = async () => {
    if (!modelImage || !garmentImage || !isModelReady || !category || !user) {
      throw new Error('Missing required data for generation');
    }

    if (credits <= 0) {
      throw new Error('Insufficient credits for generation');
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

      // Updated to use Supabase Edge Function
      const response = await makeApiRequest(`${SUPABASE_URL}/functions/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model_image: modelImageUrl,
          garment_image: garmentImageUrl,
          category: apiCategory,
          api_key: FASHN_API_KEY
        })
      });

      const data = await response.json();
      
      if (!data.id) {
        throw new Error('No task ID received from API');
      }

      await supabase
        .from('generations')
        .update({ 
          task_id: data.id,
          status: 'processing'
        })
        .eq('id', generation.id);

      setGenerationStatus('processing');

      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = setInterval(async () => {
        try {
          // Updated to use Supabase Edge Function
          const statusResponse = await makeApiRequest(`${SUPABASE_URL}/functions/v1/check-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              task_id: data.id,
              api_key: FASHN_API_KEY
            })
          });

          const statusData = await statusResponse.json();

          if (statusData.status === 'completed' && statusData.output?.[0]) {
            clearInterval(pollInterval);
            
            const resultUrl = statusData.output[0];
            setResultImage(resultUrl);
            setGenerationStatus('completed');
            setGenerationProgress(100);

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
            throw new Error('Generation timed out after 2 minutes');
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
    <AppContext.Provider
      value={{
        modelImage,
        setModelImage,
        garmentImage,
        setGarmentImage,
        resultImage,
        category,
        setCategory,
        isModelGenerating,
        isModelReady,
        isGenerating,
        generationStatus,
        generationProgress,
        performanceMode,
        setPerformanceMode,
        numSamples,
        setNumSamples,
        seed,
        setSeed,
        startGeneration,
        user,
        credits
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};