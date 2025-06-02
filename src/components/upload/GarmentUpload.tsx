import React from 'react';
import { InfoIcon } from 'lucide-react';
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
              { 
                id: 'top', 
                label: 'Top', 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h8l4 7H4l4-7z"/>
                  <path d="M4 9v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/>
                </svg>
              },
              { 
                id: 'bottom', 
                label: 'Bottom', 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h8l1 12H7L8 2z"/>
                  <path d="M7 14l-2 8h14l-2-8"/>
                </svg>
              },
              { 
                id: 'full-body', 
                label: 'Full Body', 
                icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2h12l2 7H4l2-7z"/>
                  <path d="M4 9v13h16V9"/>
                  <path d="M8 22v-8"/>
                  <path d="M16 22v-8"/>
                </svg>
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default GarmentUpload;