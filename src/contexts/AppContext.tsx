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
    if (!modelImage || !garmentImage || !isModelReady || !category || !user) return;
    
    setIsGenerating(true);
    setGenerationStatus('pending');
    setGenerationProgress(0);
    
    try {
      const { data: generation, error: insertError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          model_image_url: modelImage,
          garment_image_url: garmentImage,
          category: category as 'top' | 'bottom' | 'full-body',
          performance_mode: performanceMode as 'performance' | 'balanced' | 'quality',
          num_samples: numSamples,
          seed: seed,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelImage,
          garmentImage,
          category,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const { taskId } = await response.json();

      // Poll for status updates
      const statusInterval = setInterval(async () => {
        const { data: status } = await supabase
          .from('generations')
          .select('status, result_image_url')
          .eq('task_id', taskId)
          .single();

        if (status) {
          setGenerationStatus(status.status);
          setGenerationProgress(status.status === 'completed' ? 100 : 50);

          if (status.status === 'completed' && status.result_image_url) {
            setResultImage(status.result_image_url);
            clearInterval(statusInterval);
            setIsGenerating(false);
            await fetchUserData(user.id);
          } else if (status.status === 'failed') {
            clearInterval(statusInterval);
            setIsGenerating(false);
          }
        }
      }, 2000);

      // Clear interval after 5 minutes (timeout)
      setTimeout(() => clearInterval(statusInterval), 300000);

    } catch (error) {
      console.error('Error generating try-on:', error);
      setGenerationStatus('failed');
      setIsGenerating(false);
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