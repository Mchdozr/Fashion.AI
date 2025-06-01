import React, { useState } from 'react';
import { UserCircle, CreditCard, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import AuthModal from '../auth/AuthModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import { supabase } from '../../lib/supabase';

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
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#2A2A2A] transition-colors duration-150"
              >
                <div className="w-8 h-8 rounded-full bg-[#333333] flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.user_metadata?.first_name?.[0]}{user.user_metadata?.last_name?.[0]}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-sm font-medium">
                    {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                  </div>
                  <div className="text-xs text-gray-400 truncate max-w-[150px]">
                    {user.email}
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#222222] rounded-lg shadow-lg border border-[#333333] py-1 z-50">
                  <div className="md:hidden px-4 py-2 border-b border-[#333333]">
                    <div className="font-medium text-sm">
                      {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      // Add profile settings handler
                    }}
                    className="w-full px-4 py-2 text-sm text-left hover:bg-[#2A2A2A] flex items-center gap-2"
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
            </div>
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