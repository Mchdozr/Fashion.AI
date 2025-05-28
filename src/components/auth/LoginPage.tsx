import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../contexts/AppContext';

const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAppContext();

  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F1F1F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white p-2 rounded-lg mb-4">
            <ImageIcon size={24} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">FASHNAI STUDIO</h1>
          <p className="text-gray-400 mt-2">AI destekli moda deneyimi</p>
        </div>

        <div className="bg-[#222222] rounded-xl p-6 shadow-xl border border-[#333333]">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
          </h2>

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
                className="w-full bg-[#333333] border border-[#444444] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#F8D74B] focus:border-transparent transition duration-200"
                required
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
                className="w-full bg-[#333333] border border-[#444444] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#F8D74B] focus:border-transparent transition duration-200"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F8D74B] hover:bg-[#f9df6e] text-black font-medium py-2.5 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  {isSignUp ? 'Hesap Oluşturuluyor...' : 'Giriş Yapılıyor...'}
                </>
              ) : (
                <>{isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</>
              )}
            </button>

            <div className="text-center text-sm text-gray-400">
              {isSignUp ? (
                <>
                  Zaten hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-[#F8D74B] hover:text-[#f9df6e] transition duration-200"
                  >
                    Giriş Yap
                  </button>
                </>
              ) : (
                <>
                  Hesabınız yok mu?{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-[#F8D74B] hover:text-[#f9df6e] transition duration-200"
                  >
                    Hesap Oluştur
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;