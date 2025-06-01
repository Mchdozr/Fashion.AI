import React, { useState } from 'react';
import { UserCircle, CreditCard, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import AuthModal from '../auth/AuthModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { supabase } from '../../lib/supabase';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
}

const Header: React.FC = () => {
  const { user, credits } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsProfileMenuOpen(false);
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
            
            <div className="flex items-center gap-2">
              <div className="text-right mr-2 hidden md:block">
                <div className="text-sm font-medium text-white">
                  Mücahid Özer
                </div>
                <div className="text-xs text-gray-400">
                  {user.email}
                </div>
              </div>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="relative w-8 h-8 rounded-full bg-[#F8D74B] flex items-center justify-center"
              >
                <span className="text-sm font-bold text-black">
                  MÖ
                </span>
              </button>
            </div>

            {isProfileMenuOpen && (
              <div className="absolute right-4 top-14 w-48 bg-[#222222] rounded-lg shadow-lg border border-[#333333] py-1 z-50">
                <button 
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-[#2A2A2A] flex items-center gap-2 text-gray-200"
                >
                  <Settings size={16} />
                  Profile Settings
                </button>
                
                <button 
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-[#2A2A2A] flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
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