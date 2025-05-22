import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            setError('Bu email adresi zaten kayıtlı. Giriş yapmak için "Giriş Yap" butonuna tıklayın.');
            setIsSignUp(false);
          } else {
            throw error;
          }
        } else {
          setSuccess(true);
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login')) {
            setError('Email veya şifre hatalı');
          } else {
            throw error;
          }
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#222222] rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-150"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold mb-6">
          {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
        </h2>

        {success ? (
          <div className="text-center">
            <p className="text-green-400 mb-4">Hesabınız başarıyla oluşturuldu!</p>
            <button
              onClick={() => {
                setIsSignUp(false);
                setSuccess(false);
              }}
              className="text-[#F8D74B] hover:text-[#f9df6e] transition-colors duration-150"
            >
              Şimdi giriş yapın
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#333333] border border-[#444444] rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F8D74B] focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#333333] border border-[#444444] rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#F8D74B] focus:border-transparent"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F8D74B] hover:bg-[#f9df6e] text-black font-medium py-2 rounded-md transition-colors duration-150 disabled:bg-gray-600 disabled:text-gray-400"
            >
              {loading ? 'İşleniyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
            </button>

            <div className="text-center text-sm text-gray-400">
              {isSignUp ? (
                <>
                  Zaten hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setError(null);
                    }}
                    className="text-[#F8D74B] hover:text-[#f9df6e] transition-colors duration-150"
                    disabled={loading}
                  >
                    Giriş Yap
                  </button>
                </>
              ) : (
                <>
                  Hesabınız yok mu?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError(null);
                    }}
                    className="text-[#F8D74B] hover:text-[#f9df6e] transition-colors duration-150"
                    disabled={loading}
                  >
                    Kayıt Ol
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;