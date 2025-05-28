import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { Calendar, Clock, RotateCcw, Trash2 } from 'lucide-react';

type Generation = Database['public']['Tables']['generations']['Row'];

const DeletedView: React.FC = () => {
  const [deletedItems, setDeletedItems] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  useEffect(() => {
    const channel = supabase.channel('deleted_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'generations',
        filter: 'deleted_at.is.not.null'
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedGeneration = payload.new as Generation;
          if (updatedGeneration.deleted_at) {
            setDeletedItems(prev => {
              if (!prev.find(item => item.id === updatedGeneration.id)) {
                return [updatedGeneration, ...prev];
              }
              return prev;
            });
          } else {
            setDeletedItems(prev => prev.filter(item => item.id !== updatedGeneration.id));
          }
        } else if (payload.eventType === 'DELETE') {
          setDeletedItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeletedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      
      setDeletedItems(data || []);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (generation: Generation) => {
    try {
      const timestamp = new Date().toISOString();
      
      const { error } = await supabase
        .from('generations')
        .update({ 
          deleted_at: null,
          updated_at: timestamp
        })
        .eq('id', generation.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error restoring item:', error);
    }
  };

  const handlePermanentDelete = async (generation: Generation) => {
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', generation.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error permanently deleting item:', error);
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
      <h2 className="text-2xl font-bold mb-6">Deleted Items</h2>
      
      {deletedItems.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>No deleted items</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deletedItems.map((generation) => (
            <div
              key={generation.id}
              className="bg-[#222222] rounded-lg overflow-hidden border border-[#333333] group"
            >
              <div className="aspect-[3/4] relative group">
                <img
                  src={generation.result_image_url!}
                  alt="Deleted generation"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleRestore(generation)}
                    className="bg-[#F8D74B] text-black p-3 rounded-full hover:bg-[#f9df6e] transition-colors duration-150"
                    title="Restore"
                  >
                    <RotateCcw size={20} />
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(generation)}
                    className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-colors duration-150"
                    title="Delete permanently"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center text-sm text-gray-400">
                    <Calendar size={16} className="mr-1" />
                    {formatDate(generation.deleted_at!)}
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock size={16} className="mr-1" />
                    {formatTime(generation.deleted_at!)}
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

export default DeletedView;