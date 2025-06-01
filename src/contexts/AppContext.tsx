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
  clearUserData: () => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MODEL_IMAGE: 'fashnai_model_image',
  GARMENT_IMAGE: 'fashnai_garment_image',
  CATEGORY: 'fashnai_category',
  PERFORMANCE_MODE: 'fashnai_performance_mode',
  NUM_SAMPLES: 'fashnai_num_samples',
  SEED: 'fashnai_seed'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modelImage, setModelImageState] = useState<string | null>(() => 
    localStorage.getItem(STORAGE_KEYS.MODEL_IMAGE)
  );
  const [garmentImage, setGarmentImageState] = useState<string | null>(() => 
    localStorage.getItem(STORAGE_KEYS.GARMENT_IMAGE)
  );
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [category, setCategoryState] = useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.CATEGORY) || 'top'
  );
  
  const [isModelGenerating, setIsModelGenerating] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(!!modelImage);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  
  const [performanceMode, setPerformanceModeState] = useState<string>(() => 
    localStorage.getItem(STORAGE_KEYS.PERFORMANCE_MODE) || 'balanced'
  );
  const [numSamples, setNumSamplesState] = useState<number>(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.NUM_SAMPLES) || '1', 10)
  );
  const [seed, setSeedState] = useState<number>(() => 
    parseInt(localStorage.getItem(STORAGE_KEYS.SEED) || String(Math.floor(Math.random() * 100000)), 10)
  );

  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);

  const setModelImage = (url: string | null) => {
    if (url) localStorage.setItem(STORAGE_KEYS.MODEL_IMAGE, url);
    else localStorage.removeItem(STORAGE_KEYS.MODEL_IMAGE);
    setModelImageState(url);
  };

  const setGarmentImage = (url: string | null) => {
    if (url) localStorage.setItem(STORAGE_KEYS.GARMENT_IMAGE, url);
    else localStorage.removeItem(STORAGE_KEYS.GARMENT_IMAGE);
    setGarmentImageState(url);
  };

  const setCategory = (value: string) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORY, value);
    setCategoryState(value);
  };

  const setPerformanceMode = (value: string) => {
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE_MODE, value);
    setPerformanceModeState(value);
  };

  const setNumSamples = (value: number) => {
    localStorage.setItem(STORAGE_KEYS.NUM_SAMPLES, String(value));
    setNumSamplesState(value);
  };

  const setSeed = (value: number) => {
    localStorage.setItem(STORAGE_KEYS.SEED, String(value));
    setSeedState(value);
  };

  const clearUserData = () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    setModelImage(null);
    setGarmentImage(null);
    setResultImage(null);
    setCategory('top');
    setIsModelGenerating(false);
    setIsModelReady(false);
    setIsGenerating(false);
    setGenerationStatus('pending');
    setGenerationProgress(0);
    setPerformanceMode('balanced');
    setNumSamples(1);
    setSeed(Math.floor(Math.random() * 100000));
    setUser(null);
    setCredits(0);
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      setUser({
        ...userData,
        email: authUser?.email || ''
      });
      setCredits(userData.credits);
    } catch (error) {
      console.error('Error fetching user data:', error);
      clearUserData();
    }
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserData(session.user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        clearUserData();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        clearUserData();
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
      }, 3000);
    }
  }, [modelImage]);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

      const response = await makeApiRequest(`${SUPABASE_URL}/functions/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelImage: modelImageUrl,
          garmentImage: garmentImageUrl,
          category: apiCategory,
          generationId: generation.id
        })
      });

      const data = await response.json();
      
      if (!data.success || !data.taskId) {
        throw new Error(data.error || 'Failed to start generation');
      }

      await supabase
        .from('generations')
        .update({ 
          task_id: data.taskId,
          status: 'processing'
        })
        .eq('id', generation.id);

      setGenerationStatus('processing');

      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await makeApiRequest(
            `${SUPABASE_URL}/functions/v1/check-status?taskId=${data.taskId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          const statusData = await statusResponse.json();

          if (!statusData.success) {
            throw new Error(statusData.error || 'Status check failed');
          }

          if (statusData.status === 'completed' && statusData.resultUrl) {
            clearInterval(pollInterval);
            
            setResultImage(statusData.resultUrl);
            setGenerationStatus('completed');
            setGenerationProgress(100);

            await supabase
              .from('generations')
              .update({
                status: 'completed',
                result_image_url: statusData.resultUrl,
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
        credits,
        clearUserData,
        refreshUser
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