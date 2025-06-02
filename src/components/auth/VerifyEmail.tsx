import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const VerifyEmail: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const email = sessionStorage.getItem('verificationEmail');

  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user?.email_confirmed_at) {
          setVerificationStatus('success');
          setTimeout(() => {
            sessionStorage.removeItem('verificationEmail');
            navigate('/login');
          }, 3000);
        }
      } catch (err) {
        setVerificationStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    };

    const interval = setInterval(checkEmailVerification, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white p-2 rounded-lg mb-4">
            <ImageIcon size={24} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">FASHNAI STUDIO</h1>
        </div>

        <div className="bg-[#222222] rounded-xl p-6 shadow-xl border border-[#333333] text-center">
          <div className="mb-6">
            {verificationStatus === 'pending' && (
              <Loader2 size={48} className="animate-spin text-[#F8D74B] mx-auto" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle2 size={48} className="text-green-500 mx-auto" />
            )}
            {verificationStatus === 'error' && (
              <XCircle size={48} className="text-red-500 mx-auto" />
            )}
          </div>

          <h2 className="text-xl font-semibold mb-4 text-white">
            {verificationStatus === 'pending' && 'Verify Your Email'}
            {verificationStatus === 'success' && 'Email Verified!'}
            {verificationStatus === 'error' && 'Verification Failed'}
          </h2>

          <p className="text-gray-400 mb-6">
            {verificationStatus === 'pending' && (
              <>
                We've sent a verification email to:<br />
                <span className="text-white font-medium">{email}</span><br />
                Please check your inbox and click the verification link.
              </>
            )}
            {verificationStatus === 'success' && (
              'Your email has been verified successfully. Redirecting to login...'
            )}
            {verificationStatus === 'error' && error}
          </p>

          {verificationStatus === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-[#F8D74B] hover:bg-[#f9df6e] text-black font-medium py-2.5 rounded-lg transition duration-200"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;