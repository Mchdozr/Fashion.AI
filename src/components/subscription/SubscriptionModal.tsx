import React from 'react';
import { X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentTier }) => {
  if (!isOpen) return null;

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

        <script async src="https://js.stripe.com/v3/pricing-table.js"></script>
        <stripe-pricing-table 
          pricing-table-id="prctbl_1RTjzKRw2wcN9WgBERB22XA8"
          publishable-key="pk_test_51RTjrIRw2wcN9WgBL1XSTpPdn7dvVom0H3tXGDgaQBUYXJIoZkLGZYslHydnvxGgAmiOaPh2mOQKfI8FhawbFXc800BRlNoqAW">
        </stripe-pricing-table>
      </div>
    </div>
  );
};

export default SubscriptionModal;