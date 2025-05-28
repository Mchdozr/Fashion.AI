import React, { useState } from 'react';
import { PlayCircle, UserCircle2, CreditCard } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import AuthModal from '../auth/AuthModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { supabase } from '../../lib/supabase';

const Header: React.FC = () => {
  const { user, credits } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
            
            <a href="#" className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-150">
              <PlayCircle size={18} />
              <span>Watch 2-Minute Tutorial</span>
            </a>
            
            <button 
              onClick={handleSignOut}
              className="text-white hover:text-gray-300 transition-colors duration-150"
            >
              <UserCircle2 size={28} />
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