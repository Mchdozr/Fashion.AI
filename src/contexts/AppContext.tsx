import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Generation = Database['public']['Tables']['generations']['Row'];
type User = Database['public']['Tables']['users']['Row'];

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
  generateAIModel: () => void;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchUserData(session.user.id);
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
    console.log('Fetching user data for ID:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return;
    }

    console.log('User data fetched:', data);
    setUser(data);
    setCredits(data.credits);
  };

  const uploadImage = async (imageDataUrl: string): Promise<string> => {
    console.log('Starting image upload...');
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    console.log('Uploading image to Supabase Storage:', fileName);
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, blob);

    if (error) {
      console.error('Image upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
  };

  const generateAIModel = () => {
    if (!modelImage) return;
    
    console.log('Starting AI model generation...');
    setIsModelGenerating(true);
    setIsModelReady(false);
    
    setTimeout(() => {
      console.log('AI model generation completed');
      setIsModelGenerating(false);
      setIsModelReady(true);
    }, 3000);
  };

  const checkGenerationStatus = async (taskId: string): Promise<{ status: string; resultUrl: string | null }> => {
    try {
      console.log('Checking generation status for task:', taskId);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Session error: Unable to get current session');
      }
      
      if (!session) {
        console.error('No active session found');
        throw new Error('No active session. Please sign in again.');
      }

      console.log('Making status check request...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-status?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Status check response:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            console.error('Session refresh failed:', refreshError);
            throw new Error('Session expired. Please sign in again.');
          }
          console.log('Session refreshed, retrying status check...');
          const retryResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-status?taskId=${taskId}`, {
            headers: {
              'Authorization': `Bearer ${refreshData.session.access_token}`,
            },
          });
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            console.error('Retry status check failed:', errorData);
            throw new Error(errorData.error || 'Failed to check status after token refresh');
          }
          const retryData = await retryResponse.json();
          console.log('Retry status check successful:', retryData);
          return retryData;
        }
        const errorData = await response.json();
        console.error('Status check failed:', errorData);
        throw new Error(errorData.error || 'Failed to check status');
      }

      const data = await response.json();
      console.log('Status check successful:', data);
      return data;
    } catch (error) {
      console.error('Error in checkGenerationStatus:', error);
      throw error;
    }
  };

  const startGeneration = async () => {
    console.log('Starting generation with params:', {
      hasModelImage: !!modelImage,
      hasGarmentImage: !!garmentImage,
      isModelReady,
      category,
      hasUser: !!user
    });

    if (!modelImage || !garmentImage || !isModelReady || !category || !user) {
      throw new Error('Missing required data for generation');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Session error: Unable to get current session');
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session. Please sign in again.');
    }
    
    setIsGenerating(true);
    setGenerationStatus('pending');
    setGenerationProgress(0);
    
    try {
      console.log('Uploading images...');
      const modelImageUrl = await uploadImage(modelImage);
      const garmentImageUrl = await uploadImage(garmentImage);

      console.log('Creating generation record...');
      const { data: generation, error: insertError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          model_image_url: modelImageUrl,
          garment_image_url: garmentImageUrl,
          category: category as 'top' | 'bottom' | 'full-body',
          performance_mode: performanceMode as 'performance' | 'balanced' | 'quality',
          num_samples: numSamples,
          seed: seed,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Generation record creation failed:', insertError);
        throw insertError;
      }

      console.log('Starting generation API call...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelImage: modelImageUrl,
          garmentImage: garmentImageUrl,
          category,
          userId: user.id,
        }),
      });

      console.log('Generation API response:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log('Token expired, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData.session) {
            console.error('Session refresh failed:', refreshError);
            throw new Error('Session expired. Please sign in again.');
          }
          console.log('Session refreshed, retrying generation...');
          const retryResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshData.session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              modelImage: modelImageUrl,
              garmentImage: garmentImageUrl,
              category,
              userId: user.id,
            }),
          });
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json();
            console.error('Retry generation failed:', errorData);
            throw new Error(errorData.error || 'Failed to start generation after token refresh');
          }
          const retryData = await retryResponse.json();
          console.log('Retry generation successful:', retryData);
          await pollStatus(retryData.taskId, user.id);
          return;
        }
        const errorData = await response.json();
        console.error('Generation API error:', errorData);
        throw new Error(errorData.error || 'Failed to start generation');
      }

      const data = await response.json();
      console.log('Generation started successfully:', data);
      await pollStatus(data.taskId, user.id);

    } catch (error) {
      console.error('Error in startGeneration:', error);
      setGenerationStatus('failed');
      setIsGenerating(false);
      throw error;
    }
  };

  const pollStatus = async (taskId: string, userId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 1 minute timeout (2s * 30)
    const pollInterval = 2000; // 2 seconds

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.error('Generation timed out after', attempts, 'attempts');
        throw new Error('Generation timed out');
      }

      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts} for task:`, taskId);

      try {
        const { status, resultUrl } = await checkGenerationStatus(taskId);
        
        console.log('Poll status result:', { status, resultUrl });
        
        setGenerationStatus(status as 'pending' | 'processing' | 'completed' | 'failed');
        setGenerationProgress(status === 'completed' ? 100 : status === 'processing' ? 50 : 0);

        if (status === 'completed' && resultUrl) {
          console.log('Generation completed successfully');
          setResultImage(resultUrl);
          setIsGenerating(false);
          await fetchUserData(userId);
          return;
        } else if (status === 'failed') {
          console.error('Generation failed');
          throw new Error('Generation failed');
        }

        console.log('Scheduling next poll attempt...');
        setTimeout(() => poll(), pollInterval);
      } catch (error) {
        console.error('Error in status check:', error);
        setGenerationStatus('failed');
        setIsGenerating(false);
        throw error;
      }
    };

    await poll();
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
        generateAIModel,
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