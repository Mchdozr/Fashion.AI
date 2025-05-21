import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Generation = Database['public']['Tables']['generations']['Row'];

const GalleryView: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenerations();
  }, []);

  const fetchGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8D74B]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">My Gallery</h2>
      
      {generations.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No generations yet. Start creating!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations.map((generation) => (
            <div
              key={generation.id}
              className="bg-[#222222] rounded-lg overflow-hidden border border-[#333333]"
            >
              <div className="aspect-[3/4] relative">
                <img
                  src={generation.result_image_url || generation.garment_image_url}
                  alt="Generated result"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    {new Date(generation.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium capitalize px-2 py-1 bg-[#333333] rounded">
                    {generation.category}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Mode: <span className="text-white capitalize">{generation.performance_mode}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryView;