import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { Download, Heart, Calendar, Clock, RefreshCw } from 'lucide-react';

type Generation = Database['public']['Tables']['generations']['Row'];

const GalleryView: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'liked'>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchGenerations();
    
    // Set up real-time subscription for all generation changes
    const channel = supabase
      .channel('generations_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generations'
        },
        () => {
          fetchGenerations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshKey]);

  const fetchGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('status', 'completed')
        .not('result_image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setGenerations(data || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Gallery</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-full hover:bg-[#333333] transition-colors duration-150"
            title="Refresh gallery"
          >
            <RefreshCw size={20} className="text-gray-400" />
          </button>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-md transition-colors duration-150 ${
              selectedFilter === 'all'
                ? 'bg-[#F8D74B] text-black'
                : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('liked')}
            className={`px-4 py-2 rounded-md transition-colors duration-150 ${
              selectedFilter === 'liked'
                ? 'bg-[#F8D74B] text-black'
                : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
            }`}
          >
            Liked
          </button>
        </div>
      </div>
      
      {generations.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No completed generations yet. Start creating!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generations.map((generation) => (
            <div
              key={generation.id}
              className="bg-[#222222] rounded-lg overflow-hidden border border-[#333333] group"
            >
              <div className="aspect-[3/4] relative group">
                <img
                  src={generation.result_image_url!}
                  alt="Generated result"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load result image:', generation.result_image_url);
                    e.currentTarget.src = generation.garment_image_url;
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    onClick={() => handleDownload(generation.result_image_url!)}
                    className="bg-[#F8D74B] text-black p-3 rounded-full hover:bg-[#f9df6e] transition-colors duration-150"
                  >
                    <Download size={20} />
                  </button>
                </div>
                <button className="absolute top-4 right-4 text-white hover:text-[#F8D74B] transition-colors duration-150">
                  <Heart size={24} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar size={16} className="mr-1" />
                    {formatDate(generation.created_at)}
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock size={16} className="mr-1" />
                    {formatTime(generation.created_at)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize px-2 py-1 bg-[#333333] rounded">
                    {generation.category}
                  </span>
                  <span className="text-sm text-gray-400 capitalize">
                    {generation.performance_mode}
                  </span>
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