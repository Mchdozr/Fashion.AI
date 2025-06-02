import React from 'react';
import { InfoIcon, Shirt, UserSquare2, Shirt as FullBody } from 'lucide-react';
import ImageDropzone from '../ui/ImageDropzone';
import CategorySelector from '../ui/CategorySelector';
import { useAppContext } from '../../contexts/AppContext';

const GarmentUpload: React.FC = () => {
  const { 
    garmentImage, 
    setGarmentImage, 
    category, 
    setCategory, 
    modelImage, 
    isModelReady,
    user 
  } = useAppContext();

  const handleImageChange = (imageUrl: string) => {
    setGarmentImage(imageUrl);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
  };

  return (
    <div className="bg-[#222222] rounded-lg border border-[#333333] p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium">Select Garment</h2>
          <button className="ml-1 text-gray-400 hover:text-gray-300 transition-colors duration-150">
            <InfoIcon size={16} />
          </button>
        </div>
        <div className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-500 text-gray-400">
          2
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative mb-4">
          <ImageDropzone 
            image={garmentImage} 
            onImageChange={handleImageChange} 
            className="absolute inset-0"
          />
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-2">Category</div>
          <CategorySelector 
            selectedCategory={category}
            onCategoryChange={handleCategoryChange}
            categories={[
              { id: 'top', label: 'Top', icon: <Shirt size={20} /> },
              { id: 'bottom', label: 'Bottom', icon: <UserSquare2 size={20} /> },
              { id: 'full-body', label: 'Full Body', icon: <FullBody size={20} /> },
            ]}
          />
        </div>
      </div>
    </div>
  );
};