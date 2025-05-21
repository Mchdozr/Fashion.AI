import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Image, Sparkles } from 'lucide-react';

const HomeView: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Wand2 size={24} />,
      title: 'Easy to Use',
      description: 'Simply upload a photo and select your garment'
    },
    {
      icon: <Image size={24} />,
      title: 'High Quality',
      description: 'Realistic and detailed results'
    },
    {
      icon: <Sparkles size={24} />,
      title: 'Fast Results',
      description: 'Get results within seconds'
    }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Try On Clothes with FashnAI</h1>
        <p className="text-gray-400 text-lg mb-8">
          See how clothes look on you with AI
        </p>
        <button
          onClick={() => navigate('/studio')}
          className="bg-[#F8D74B] hover:bg-[#f9df6e] text-black px-8 py-3 rounded-lg font-medium transition-colors duration-150"
        >
          Try Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-[#222222] p-6 rounded-lg border border-[#333333]"
          >
            <div className="bg-[#333333] w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-[#F8D74B]">
              {feature.icon}
            </div>
            <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeView;