import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { delay } from '../utils/time';
import { FASHN_API_URL, FASHN_API_KEY } from '../config/constants';
import { uploadImage } from '../utils/storage';

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
    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserData(session.user.id);
      }
    });

    // Auth durumu değişikliklerini dinle
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

  const generateAIModel = async () => {
    if (!modelImage) return;
    setIsModelGenerating(true);
    
    try {
      await delay(2000); // Simulated API call
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