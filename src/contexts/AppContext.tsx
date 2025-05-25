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

const FASHN_API_KEY = 'fa-e92wafgdYrE5-dRAWJrEPHSW7k4lLJ200CSpa';
const FASHN_API_URL = 'https://api.fashn.ai/v1';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      console.error('Missing required data:', {
        modelImage: !!modelImage,
        garmentImage: !!garmentImage,
        isModelReady,
        category,
        user: !!user
      });
      throw new Error('Missing required data for generation');
    }

    setIsGenerating(true);
    setGenerationStatus('pending');
    setGenerationProgress(0);
    
    try {
      // First, create the generation record
      const { data: generation, error: insertError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          model_image_url: modelImage,
          garment_image_url: garmentImage,
          category: category,
          performance_mode: performanceMode,
          num_samples: numSamples,
          seed: seed,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating generation record:', insertError);
        throw insertError;
      }

      // Set result image immediately for UI feedback
      setResultImage(garmentImage);
      setGenerationStatus('completed');
      setGenerationProgress(100);

      // Call FashnAI API in the background
      const apiCategory = categoryMapping[category as keyof typeof categoryMapping];
      if (!apiCategory) {
        console.error('Invalid category mapping:', { category, availableCategories: Object.keys(categoryMapping) });
        throw new Error(`Invalid category: ${category}`);
      }

      console.log('Starting FashnAI API request with:', {
        modelImage,
        garmentImage,
        category: apiCategory
      });

      const response = await fetch(`${FASHN_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASHN_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model_image: modelImage,
          garment_image: garmentImage,
          category: apiCategory
        })
      });

      if (!response.ok) {
        console.error('FashnAI API error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        return;
      }

      const data = await response.json();
      console.log('FashnAI API response:', data);

      if (!data.task_id) {
        console.error('No task ID in response:', data);
        return;
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
        console.error('Error updating generation with task ID:', updateError);
      }

      // Start polling for the real result
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${FASHN_API_URL}/status/${data.task_id}`, {
            headers: {
              'Authorization': `Bearer ${FASHN_API_KEY}`,
              'Accept': 'application/json'
            }
          });

          if (!statusResponse.ok) {
            console.error('Status check failed:', statusResponse.statusText);
            return;
          }

          const statusData = await statusResponse.json();
          console.log('Status check response:', statusData);

          if (statusData.status === 'completed' && statusData.result_url) {
            clearInterval(pollInterval);
            
            // Update the generation record with the real result
            const { error: finalUpdateError } = await supabase
              .from('generations')
              .update({
                result_image_url: statusData.result_url,
                status: 'completed',
                updated_at: new Date().toISOString()
              })
              .eq('id', generation.id);

            if (finalUpdateError) {
              console.error('Error updating final result:', finalUpdateError);
            }

            // Update UI with the real result
            setResultImage(statusData.result_url);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            console.error('Generation failed:', statusData);
          }

          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            console.error('Generation timed out');
          }

        } catch (error) {
          console.error('Status check error:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationStatus('failed');
      setIsGenerating(false);
      throw error;
    } finally {
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