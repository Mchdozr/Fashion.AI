import React from 'react';
import { InfoIcon, PlayIcon } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const ResultPreview: React.FC = () => {
  const { 
    modelImage, 
    garmentImage, 
    resultImage, 
    isGenerating,
    generationStatus,
    startGeneration,
    isModelReady,
    category
  } = useAppContext();

  const canGenerate = modelImage && garmentImage && isModelReady && category && !isGenerating;

  const getStatusMessage = () => {
    switch (generationStatus) {
      case 'pending':
        return 'Waiting to start...';
      case 'processing':
        return 'Processing your request...';
      case 'completed':
        return resultImage ? 'Generation completed!' : 'Waiting for result...';
      case 'failed':
        return 'Generation failed. Please try again.';
      default:
        return 'Upload images to start';
    }
  };

  return (
    <div className="bg-[#222222] rounded-lg border border-[#333333] p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-medium">Result</h2>
          <button className="ml-1 text-gray-400 hover:text-gray-300 transition-colors duration-150">
            <InfoIcon size={16} />
          </button>
        </div>
        <div className="h-8 w-8 flex items-center justify-center rounded-full border border-gray-500 text-gray-400">
          3
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 mb-4 bg-[#1A1A1A] border border-[#333333] rounded-lg flex items-center justify-center overflow-hidden">
          {resultImage ? (
            <img 
              src={resultImage} 
              alt="Result" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-4">
              <div className="text-gray-400 text-sm mb-2">{getStatusMessage()}</div>
              {generationStatus === 'processing' && (
                <div className="w-24 h-24 mx-auto">
                  <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-[#F8D74B]"></div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          onClick={startGeneration}
          disabled={!canGenerate}
          className={`w-full py-3 rounded-md font-medium flex items-center justify-center transition-all duration-150 ${
            !canGenerate
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-[#F8D74B] hover:bg-[#f9df6e] text-black'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {generationStatus === 'pending' ? 'Starting...' : 'Processing...'}
            </>
          ) : (
            <>
              <PlayIcon size={18} className="mr-2" />
              Generate
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultPreview;