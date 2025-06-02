import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier }) => {
  const [billingPeriod, setBillingPeriod] = useState<'yearly' | 'monthly'>('yearly');

  if (!isOpen) return null;

  const plans = [
    {
      name: 'Basic Plan',
      price: billingPeriod === 'yearly' ? 9 : 12,
      features: [
        '200 FASHN credits*',
        'Try-on studio',
        'Background AI editor',
        'Generate AI models',
        'FASHN consistent models',
        'Model swap',
        'Mockup generator',
        'Saved generation history',
        'Shareable public links',
        'Ticket-based support'
      ],
      buttonVariant: 'outline'
    },
    {
      name: 'Pro Plan',
      price: billingPeriod === 'yearly' ? 49 : 59,
      features: [
        'Everything in Basic Plan',
        'Unlimited FASHN credits*',
        'Try-on videos',
        'Direct channel support'
      ],
      buttonVariant: 'primary',
      highlight: true
    },
    {
      name: 'Agency Plan',
      price: billingPeriod === 'yearly' ? 99 : 119,
      features: [
        'Everything in Pro Plan',
        'Higher-quality try-on videos',
        'Custom consistent models',
        'Prioritized feature requests'
      ],
      buttonVariant: 'white'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors duration-150"
          >
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Choose a Plan</h2>
            <div className="inline-flex items-center bg-[#222222] rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  billingPeriod === 'yearly'
                    ? 'bg-[#333333] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  billingPeriod === 'monthly'
                    ? 'bg-[#333333] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 ${
                  plan.highlight
                    ? 'bg-[#F8D74B] text-black'
                    : 'bg-[#222222] border border-[#333333]'
                }`}
              >
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="ml-2 text-sm opacity-80">/ month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-lg font-medium transition-colors duration-150 ${
                    plan.highlight
                      ? 'bg-black text-white hover:bg-gray-900'
                      : plan.buttonVariant === 'white'
                      ? 'bg-white text-black hover:bg-gray-100'
                      : 'bg-[#333333] text-white hover:bg-[#444444]'
                  }`}
                >
                  Start Now
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-sm text-gray-400">
            *FASHN credits apply to AI tools, including generating models, try-ons, and backgrounds.
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              The subscription plans apply exclusively to the web app. To purchase API credits,{' '}
              <a href="#" className="underline hover:text-blue-300">
                please visit the API section
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;