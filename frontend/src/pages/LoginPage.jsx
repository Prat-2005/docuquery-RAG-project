import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import PageWrapper from '../components/layout/PageWrapper';
import GoogleLogo from '../components/common/GoogleLogo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authService.login(formData);
      await login(data.access_token);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full theme-card rounded-3xl overflow-hidden p-8 sm:p-10">
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
              <p className="text-slate-500 mt-2 text-sm">Enter your credentials to access your documents</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 outline-none transition-all"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="relative">
                <div className="flex justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 outline-none transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {infoMessage && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-sm border border-indigo-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2 active:scale-95"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--theme-surface)] px-3 text-slate-400 font-medium">or continue with</span>
              </div>
            </div>

            <a
              href={`${API_BASE_URL}/auth/google/login`}
              className="w-full py-3 px-4 theme-item text-slate-700 font-semibold rounded-2xl flex items-center justify-center gap-2.5 transition-all"
            >
              <GoogleLogo />
              <span>Continue with Google</span>
            </a>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default LoginPage;
