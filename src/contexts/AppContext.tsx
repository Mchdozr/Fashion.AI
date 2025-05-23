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

const FASHN_API_KEY = 'fa-ECXn1FiBkfBn-rI4qb4wTKU60b1fSLJtzvClq';
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

      // Call FashnAI API with enhanced error handling
      const requestBody = {
        model_image: modelImageUrl,
        garment_image: garmentImageUrl,
        category: apiCategory
      };

      console.log('Making API request with:', {
        url: `${FASHN_API_URL}/generate`,
        body: requestBody
      });

      const response = await fetch(`${FASHN_API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASHN_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }

        if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('FashnAI API response:', data);

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

      // Start polling for status
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes maximum
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`${FASHN_API_URL}/status/${data.task_id}`, {
            headers: {
              'Authorization': `Bearer ${FASHN_API_KEY}`
            }
          });

          if (!statusResponse.ok) {
            let errorMessage = `Status check failed with status ${statusResponse.status}`;
            try {
              const errorData = await statusResponse.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
              errorMessage = `${errorMessage}: ${statusResponse.statusText}`;
            }
            throw new Error(errorMessage);
          }

          const statusData = await statusResponse.json();
          console.log('Status check response:', statusData);

          if (statusData.status === 'completed' && statusData.output?.[0]) {
            clearInterval(pollInterval);
            setGenerationStatus('completed');
            setGenerationProgress(100);
            setResultImage(statusData.output[0]);
            setIsGenerating(false);

            // Update generation record with result URL
            const { error: updateError } = await supabase
              .from('generations')
              .update({
                status: 'completed',
                result_image_url: statusData.output[0],
                updated_at: new Date().toISOString()
              })
              .eq('id', generation.id);

            if (updateError) {
              console.error('Error updating generation with result:', updateError);
            }

            // Refresh user data to get updated credits
            await fetchUserData(user.id);

          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(statusData.error || 'Generation failed');
          }

          attempts++;
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error('Generation timed out after 2 minutes');
          }

          // Calculate progress based on attempts
          setGenerationProgress(Math.min(90, (attempts / maxAttempts) * 100));
          await delay(2000); // Wait 2 seconds between checks

        } catch (error) {
          clearInterval(pollInterval);
          setGenerationStatus('failed');
          setIsGenerating(false);
          console.error('Status check error:', error);
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