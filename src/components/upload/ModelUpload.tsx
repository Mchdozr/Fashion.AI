import React from 'react';
import { InfoIcon } from 'lucide-react';
import ImageDropzone from '../ui/ImageDropzone';
import { useAppContext } from '../../contexts/AppContext';

const ModelUpload: React.FC = () => {
  const { modelImage, setModelImage, isModelGenerating, garmentImage } = useAppContext();

  const handleImageChange = (imageUrl: string) => {
    setModelImage(imageUrl);
  };

  return (
    <div className="bg-[#222222] rounded-lg border border-[#333333] p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium">Select Model</h2>
          <button className="ml-1 text-gray-400 hover:text-gray-300 transition-colors duration-150">
            <InfoIcon size={16} />
          </button>
        </div>
        <div className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-500 text-gray-400">
          1
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <ImageDropzone 
          image={modelImage} 
          onImageChange={handleImageChange} 
          className="flex-1"
        />
        
        {isModelGenerating && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Processing model...
          </div>
        )}
      </div>
    </div>
  );
};