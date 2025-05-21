import React from 'react';
import { InfoIcon, Zap, BarChart3, Sparkles } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const GenerationSettings: React.FC = () => {
  const { 
    performanceMode, 
    setPerformanceMode,
    numSamples,
    setNumSamples,
    seed,
    setSeed
  } = useAppContext();

  const modes = [
    { id: 'performance', label: 'Performance', icon: <Zap size={16} /> },
    { id: 'balanced', label: 'Balanced', icon: <BarChart3 size={16} /> },
    { id: 'quality', label: 'Quality', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="bg-[#222222] rounded-lg border border-[#333333] p-4">
      <div className="grid grid-cols-3 gap-2 mb-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setPerformanceMode(mode.id)}
            className={`py-2 rounded flex items-center justify-center text-sm transition-colors duration-150 ${
              performanceMode === mode.id
                ? 'bg-[#333333] text-white'
                : 'text-gray-400 hover:bg-[#2A2A2A]'
            }`}
          >
            <span className="mr-1">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-300">Number of Samples</span>
            <button className="ml-1 text-gray-400 hover:text-gray-300 transition-colors duration-150">
              <InfoIcon size={14} />
            </button>
          </div>
          <span className="text-sm font-medium">{numSamples}</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value={numSamples}
          onChange={(e) => setNumSamples(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-[#333333] rounded-lg appearance-none cursor-pointer"
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <span className="text-sm text-gray-300">Seed</span>
            <button className="ml-1 text-gray-400 hover:text-gray-300 transition-colors duration-150">
              <InfoIcon size={14} />
            </button>
          </div>
        </div>
        <input
          type="number"
          min="0"
          max="99999"
          value={seed}
          onChange={(e) => setSeed(parseInt(e.target.value, 10))}
          className="w-full bg-[#333333] border border-[#444444] rounded-md px-3 py-1.5 text-sm text-white"
        />
      </div>
    </div>
  );
};

export default GenerationSettings;