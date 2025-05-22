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

  const generateAIModel = () => {
    if (!modelImage) return;
    
    setIsModelGenerating(true);
    setIsModelReady(false);
    
    setTimeout(() => {
      setIsModelGenerating(false);
      setIsModelReady(true);
    }, 3000);
  };

  const startGeneration = async () => {
    if (!modelImage || !garmentImage || !isModelReady || !category || !user) {
      throw new Error('Missing required data for generation');
    }

    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session found');
    }
    
    setIsGenerating(true);
    setGenerationStatus('pending');
    setGenerationProgress(0);
    setResultImage(null);
    
    try {
      const modelImageUrl = await uploadImage(modelImage);
      const garmentImageUrl = await uploadImage(garmentImage);

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

      // Call generate function through Supabase Edge Function with session token
      const generateUrl = new URL('/functions/v1/generate', import.meta.env.VITE_SUPABASE_URL).toString();
      const response = await fetch(generateUrl, {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start generation');
      }

      const { taskId } = await response.json();

      // Poll for status updates with session token
      const pollStatus = async () => {
        try {
          const statusUrl = new URL(`/functions/v1/check-status?taskId=${taskId}`, import.meta.env.VITE_SUPABASE_URL).toString();
          const statusResponse = await fetch(statusUrl, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (!statusResponse.ok) {
            throw new Error('Failed to check status');
          }

          const { status, resultUrl } = await statusResponse.json();
          
          setGenerationStatus(status);
          setGenerationProgress(status === 'completed' ? 100 : status === 'processing' ? 50 : 0);

          if (status === 'completed' && resultUrl) {
            setResultImage(resultUrl);
            setIsGenerating(false);
            await fetchUserData(user.id);
            return true;
          } else if (status === 'failed') {
            setIsGenerating(false);
            throw new Error('Generation failed');
          }

          return false;
        } catch (error) {
          console.error('Status check error:', error);
          setGenerationStatus('failed');
          setIsGenerating(false);
          throw error;
        }
      };

      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const isComplete = await pollStatus();
          if (isComplete) {
            clearInterval(pollInterval);
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error('Polling error:', error);
        }
      }, 2000);

      // Set timeout to stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (generationStatus !== 'completed') {
          setGenerationStatus('failed');
          setIsGenerating(false);
        }
      }, 300000);

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