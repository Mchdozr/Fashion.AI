import React from 'react';
import ModelUpload from '../upload/ModelUpload';
import GarmentUpload from '../upload/GarmentUpload';
import ResultPreview from '../result/ResultPreview';
import GenerationSettings from '../result/GenerationSettings';
import { useAppContext } from '../../contexts/AppContext';

const StudioView: React.FC = () => {
  const { isGenerating, generationProgress } = useAppContext();

  return (
    <main className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <ModelUpload />
        <GarmentUpload />
        <div className="flex flex-col space-y-4">
          <ResultPreview />
          <GenerationSettings />
          
          {isGenerating && (
            <div className="bg-[#222222] p-4 rounded-lg border border-[#333333]">
              <div className="mb-2 flex justify-between items-center">
                <span className="text-sm font-medium">Generating...</span>
                <span className="text-sm text-gray-400">{Math.round(generationProgress)}%</span>
              </div>
              <div className="w-full bg-[#333333] rounded-full h-2">
                <div 
                  className="bg-[#F8D74B] h-2 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default StudioView;