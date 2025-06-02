import React, { useState } from 'react';
import { UserCircle, CreditCard, LogOut, Settings } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import AuthModal from '../auth/AuthModal';
import SubscriptionModal from '../subscription/SubscriptionModal';
import ProfileSettingsModal from '../profile/ProfileSettingsModal';
import { supabase } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, credits } = useAppContext();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsProfileMenuOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="h-16 bg-[#171717] border-b border-[#333333] flex items-center justify-between px-4 py-2">
      <div className="flex items-center">
        {location.pathname === '/' && (
          <h1 className="text-xl font-bold hidden lg:block">STUDIO</h1>
        )}
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        {user ? (
          <>
            <div className="text-sm text-gray-300">
              Credits: <span className="font-medium text-white">{credits}</span>
            </div>
            
            <button 
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="flex items-center gap-2 bg-[#F8D74B] hover:bg-[#f9df6e] text-black px-4 py-2 rounded-md font-medium transition-colors duration-150 min-h-[44px]"
            >
              <CreditCard size={20} />
              <span className="text-base">Buy Credits</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-11 h-11 rounded-full bg-[#333333] flex items-center justify-center hover:bg-[#444444] transition-colors duration-150"
              >
                <UserCircle size={24} className="text-gray-300" />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-[#222222] rounded-lg shadow-lg border border-[#333333] py-1 z-50">
                  <button 
                    onClick={() => {
                      setIsProfileSettingsOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-base text-left hover:bg-[#2A2A2A] flex items-center gap-2 text-gray-200"
                  >
                    <Settings size={20} />
                    Profile Settings
                  </button>
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-base text-left text-red-400 hover:bg-[#2A2A2A] flex items-center gap-2"
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 bg-[#F8D74B] hover:bg-[#f9df6e] text-black px-4 py-2 rounded-md font-medium transition-colors duration-150 min-h-[44px]"
          >
            <span className="text-base">Sign In</span>
          </button>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {user && (
        <>
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            currentTier={user.subscription_tier}
          />
          
          <ProfileSettingsModal
            isOpen={isProfileSettingsOpen}
            onClose={() => setIsProfileSettingsOpen(false)}
          />
        </>
      )}
    </header>
  );
};

export default Header;