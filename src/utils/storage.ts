import { supabase } from '../lib/supabase';

export const uploadImage = async (imageDataUrl: string): Promise<string> => {
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