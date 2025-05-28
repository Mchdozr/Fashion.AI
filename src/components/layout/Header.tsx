import React, { useState } from 'react';
import { UserCircle, CreditCard } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import AuthModal from '../auth/AuthModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { supabase } from '../../lib/supabase';

const Header: React.FC = () => {
  const { user, credits } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.debug('Sign out error:', error);
    }
  };

  return (
    <header className="h-16 bg-[#171717] border-b border-[#333333] flex items-center justify-between px-4 py-2">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">STUDIO</h1>
        {user && (
          <div className="ml-4 px-2 py-1 bg-[#333333] rounded text-xs text-gray-300">
            {user.subscription_tier === 'free' ? 'Free Plan' : user.subscription_tier === 'pro' ? 'Pro Plan' : 'Enterprise Plan'}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <div className="text-sm text-gray-300">
              Credits: <span className="font-medium text-white">{credits}</span>
            </div>
            
            <button 
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="flex items-center gap-2 bg-[#F8D74B] hover:bg-[#f9df6e] text-black px-4 py-2 rounded-md font-medium transition-colors duration-150"
            >
              <CreditCard size={18} />
              <span className="text-sm">Buy Credits</span>
            </button>
            
            <button 
              onClick={handleSignOut}
              className="text-gray-400 hover:text-gray-300 transition-colors duration-150"
            >
              <UserCircle size={24} strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 bg-[#F8D74B] hover:bg-[#f9df6e] text-black px-4 py-2 rounded-md font-medium transition-colors duration-150"
          >
            <span className="text-sm">Sign In</span>
          </button>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {user && (
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          currentTier={user.subscription_tier}
        />
      )}
    </header>
  );
};

export default Header;