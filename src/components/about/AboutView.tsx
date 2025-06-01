import React from 'react';
import { Sparkles, Zap, Shield, Users } from 'lucide-react';

const AboutView: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="text-[#F8D74B]" size={32} />,
      title: 'AI-Powered Fashion',
      description: 'Experience the future of fashion with our state-of-the-art AI technology that creates stunning virtual try-ons.'
    },
    {
      icon: <Zap className="text-[#F8D74B]" size={32} />,
      title: 'Lightning Fast',
      description: 'Get results in seconds with our optimized processing pipeline and high-performance infrastructure.'
    },
    {
      icon: <Shield className="text-[#F8D74B]" size={32} />,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security. We never share your images without permission.'
    },
    {
      icon: <Users className="text-[#F8D74B]" size={32} />,
      title: 'Built for Everyone',
      description: 'Whether you\'re a fashion enthusiast or a business owner, our platform is designed to meet your needs.'
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About FashnAI Studio</h1>
        <p className="text-xl text-gray-400">
          Revolutionizing the way people experience fashion through artificial intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-[#222222] p-6 rounded-xl border border-[#333333] hover:border-[#F8D74B] transition-colors duration-300"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#222222] p-8 rounded-xl border border-[#333333] hover:border-[#F8D74B] transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
        <p className="text-gray-300 leading-relaxed mb-6">
          At FashnAI Studio, we're on a mission to transform the online shopping experience by bridging the gap between digital and physical fashion. Our AI-powered platform enables users to virtually try on clothes with unprecedented realism, helping them make confident purchase decisions from the comfort of their homes.
        </p>
        <p className="text-gray-300 leading-relaxed">
          We believe that technology should enhance the way we interact with fashion, making it more accessible, sustainable, and enjoyable for everyone. By reducing the need for physical try-ons and returns, we're not just improving the shopping experience – we're contributing to a more sustainable fashion industry.
        </p>
      </div>
    </div>
  );
};

export default AboutView;