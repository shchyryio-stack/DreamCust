"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';

const EyeIcon = () => (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>);
const EyeOffIcon = () => (<svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>);
const GoogleIcon = () => (<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>);

export default function AuthPage() {
  const { showToast } = useToast();
  const [view, setView] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle OAuth callback token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorMsg = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      setSuccess('Google Login successful!');
      showToast('Google Login successful!', 'success');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } else if (errorMsg) {
      setError(errorMsg);
      showToast(errorMsg, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === '';
  const isPasswordStrong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword || confirmPassword === '';

  let passwordStrength = 0;
  if (password.length > 0) passwordStrength += 25;
  if (password.length >= 8) passwordStrength += 25;
  if (/[A-Z]/.test(password)) passwordStrength += 25;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) passwordStrength += 25;

  const isFormValid = view === 'login' 
    ? (email !== '' && password !== '' && isEmailValid)
    : (email !== '' && password !== '' && confirmPassword !== '' && isEmailValid && isPasswordStrong && passwordsMatch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const endpoint = view === 'login' ? '/auth/login' : '/auth/register';
      
      const payload = view === 'login' 
        ? { email, password } 
        : { name: email.split('@')[0], email, password };
        
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `${view === 'login' ? 'Login' : 'Registration'} failed.`);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      const successMsg = view === 'login' ? 'Login successful!' : 'Account created successfully!';
      setSuccess(successMsg);
      showToast(successMsg, 'success');
      
      setTimeout(() => { window.location.href = '/'; }, 1500);

    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setView(view === 'login' ? 'register' : 'login');
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#F5F6F8]">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      
      <div className="w-full max-w-[440px] bg-white/90 backdrop-blur-xl rounded-[24px] p-8 sm:p-10 border border-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] transition-all duration-500 animate-fade-in-up relative z-10">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-2">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            {view === 'login' ? 'Log in to continue to DreamCust' : 'Join DreamCust to build your dream PC'}
          </p>
        </div>
        
        {success ? (
          <div className="bg-green-50 border border-green-100 text-green-600 p-6 rounded-2xl text-center font-bold animate-fade-in flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            {success}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 p-3 rounded-xl text-sm text-center font-medium animate-shake">
                {error}
              </div>
            )}
            
            <div className="relative group">
              <input 
                type="email" 
                required
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`peer w-full bg-gray-50/50 border ${email !== '' && !isEmailValid ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1E6FE8] focus:ring-[#1E6FE8]/10'} rounded-xl px-4 pt-6 pb-2 text-[#1A1A1A] font-medium focus:bg-white focus:outline-none focus:ring-4 transition-all`}
                placeholder=" "
              />
              <label htmlFor="email" className={`absolute text-sm font-medium ${email !== '' && !isEmailValid ? 'text-red-400' : 'text-gray-400 peer-focus:text-[#1E6FE8]'} duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3`}>
                Email Address
              </label>
            </div>
            
            <div className="relative group mt-6">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 pt-6 pb-2 pr-12 text-[#1A1A1A] font-medium focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1E6FE8]/10 focus:border-[#1E6FE8] transition-all"
                placeholder=" "
              />
              <label htmlFor="password" className="absolute text-sm font-medium text-gray-400 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-[#1E6FE8]">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 outline-none p-1"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {view === 'register' && password.length > 0 && (
              <div className="pt-1 px-1 animate-fade-in">
                <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                  <div className={`h-full transition-all duration-300 ${passwordStrength >= 25 ? 'bg-red-400' : ''} w-1/4`}></div>
                  <div className={`h-full transition-all duration-300 ${passwordStrength >= 50 ? 'bg-orange-400' : ''} w-1/4`}></div>
                  <div className={`h-full transition-all duration-300 ${passwordStrength >= 75 ? 'bg-blue-400' : ''} w-1/4`}></div>
                  <div className={`h-full transition-all duration-300 ${passwordStrength === 100 ? 'bg-green-500' : ''} w-1/4`}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">
                  {passwordStrength < 50 && 'Weak'}
                  {passwordStrength === 75 && 'Good'}
                  {passwordStrength === 100 && 'Strong'}
                  {passwordStrength < 100 && ' (min. 8 chars, 1 uppercase, 1 number)'}
                </p>
              </div>
            )}

            {view === 'register' && (
              <div className="relative group mt-6 animate-fade-in-down">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`peer w-full bg-gray-50/50 border ${!passwordsMatch ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-200 focus:border-[#1E6FE8] focus:ring-[#1E6FE8]/10'} rounded-xl px-4 pt-6 pb-2 text-[#1A1A1A] font-medium focus:bg-white focus:outline-none focus:ring-4 transition-all`}
                  placeholder=" "
                />
                <label htmlFor="confirmPassword" className={`absolute text-sm font-medium ${!passwordsMatch ? 'text-red-400' : 'text-gray-400 peer-focus:text-[#1E6FE8]'} duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3`}>
                  Confirm Password
                </label>
              </div>
            )}

            {view === 'login' && (
              <div className="flex justify-end pt-1">
                <a href="#" className="text-sm font-medium text-[#1E6FE8] hover:text-[#1557BE] transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading || !isFormValid}
                className="w-full bg-[#1E6FE8] hover:bg-[#1557BE] disabled:opacity-50 disabled:hover:bg-[#1E6FE8] disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-[15px] transition-all shadow-[0_4px_14px_rgba(30,111,232,0.3)] hover:shadow-[0_8px_24px_rgba(30,111,232,0.4)] hover:-translate-y-0.5 flex justify-center items-center h-[52px]"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  view === 'login' ? 'Log In' : 'Create Account'
                )}
              </button>
            </div>
          </form>
        )}

        {!success && (
          <>
            <div className="flex items-center gap-4 my-6 opacity-60">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <button type="button" onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'} className="w-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#1A1A1A] font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow h-[52px]">
              <GoogleIcon />
              Continue with Google
            </button>
          </>
        )}
        
        {!success && (
          <p className="text-center text-gray-500 mt-8 font-medium text-sm">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={toggleView}
              className="text-[#1E6FE8] hover:text-[#1557BE] font-bold transition-colors ml-1"
            >
              {view === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
