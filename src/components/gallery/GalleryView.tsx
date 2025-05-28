import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { Download, Calendar, Clock, Heart, Trash2 } from 'lucide-react';

type Generation = Database['public']['Tables']['generations']['Row'];

type Filter = 'all' | 'favorites';

const GalleryView: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchGenerations();
    
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
  }, [filter]);

  const fetchGenerations = async () => {
    try {
      let query = supabase
        .from('generations')
        .select('*')
        .eq('status', 'completed')
        .is('deleted_at', null)
        .not('result_image_url', 'is', null);

      if (filter === 'favorites') {
        query = query.eq('is_favorite', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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

  const toggleFavorite = async (generation: Generation) => {
    try {
      const { error } = await supabase
        .from('generations')
        .update({ is_favorite: !generation.is_favorite })
        .eq('id', generation.id);

      if (error) throw error;
      
      setGenerations(generations.map(g => 
        g.id === generation.id ? { ...g, is_favorite: !g.is_favorite } : g
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDelete = async (generation: Generation) => {
    try {
      const { error } = await supabase
        .from('generations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', generation.id);

      if (error) throw error;
      
      setGenerations(generations.filter(g => g.id !== generation.id));
    } catch (error) {
      console.error('Error deleting generation:', error);
    }
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">My Gallery</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
              filter === 'all'
                ? 'bg-[#F8D74B] text-black'
                : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-lg transition-colors duration-150 ${
              filter === 'favorites'
                ? 'bg-[#F8D74B] text-black'
                : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>
      
      {generations.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No {filter === 'favorites' ? 'favorite' : ''} generations yet.</p>
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
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleDownload(generation.result_image_url!)}
                    className="bg-[#F8D74B] text-black p-3 rounded-full hover:bg-[#f9df6e] transition-colors duration-150"
                    title="Download"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(generation)}
                    className={`p-3 rounded-full transition-colors duration-150 ${
                      generation.is_favorite
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white text-gray-800 hover:bg-gray-100'
                    }`}
                    title={generation.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={20} fill={generation.is_favorite ? 'white' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleDelete(generation)}
                    className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 transition-colors duration-150"
                    title="Move to trash"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
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