import React from 'react';
import { X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  credits: number;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    credits: 10,
    features: [
      { text: '10 credits per month', included: true },
      { text: 'Basic generation quality', included: true },
      { text: 'Limited to 1 sample', included: true },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    credits: 100,
    features: [
      { text: '100 credits per month', included: true },
      { text: 'High-quality generation', included: true },
      { text: 'Up to 3 samples', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '$99',
    credits: 500,
    features: [
      { text: '500 credits per month', included: true },
      { text: 'Maximum quality generation', included: true },
      { text: 'Up to 5 samples', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: true },
    ],
  },
];

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier }) => {
  const [loading, setLoading] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubscribe = async (tier: string) => {
    if (tier === currentTier) return;
    
    setLoading(tier);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          subscription_tier: tier.toLowerCase(),
          credits: tier === 'Free' ? 10 : tier === 'Pro' ? 100 : 500,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#222222] rounded-lg p-6 w-full max-w-4xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-150"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-8 text-center">Choose your plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-[#333333] rounded-lg p-6 border-2 ${
                currentTier.toLowerCase() === plan.name.toLowerCase()
                  ? 'border-[#F8D74B]'
                  : 'border-transparent'
              }`}
            >
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check
                      size={16}
                      className={feature.included ? 'text-green-400' : 'text-gray-600'}
                    />
                    <span className={`ml-2 ${feature.included ? 'text-gray-200' : 'text-gray-500'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={loading === plan.name || currentTier.toLowerCase() === plan.name.toLowerCase()}
                className={`w-full py-2 rounded-md font-medium transition-colors duration-150 ${
                  currentTier.toLowerCase() === plan.name.toLowerCase()
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-[#F8D74B] hover:bg-[#f9df6e] text-black'
                } disabled:bg-gray-600 disabled:text-gray-400`}
              >
                {loading === plan.name
                  ? 'Processing...'
                  : currentTier.toLowerCase() === plan.name.toLowerCase()
                  ? 'Current Plan'
                  : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;