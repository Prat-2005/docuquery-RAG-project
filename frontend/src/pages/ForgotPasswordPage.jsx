import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import PageWrapper from '../components/layout/PageWrapper';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
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
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
              <p className="text-slate-500 mt-2 text-sm">Enter your email to receive a reset link</p>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight">Check Your Email</h2>
                <p className="text-slate-600 mb-8 text-sm">
                  If your email is registered, we've sent a password reset link to your inbox.
                </p>
                <Link
                  to="/login"
                  className="w-full py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all block text-center shadow-md active:scale-95"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 outline-none transition-all"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

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
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <Link to="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ForgotPasswordPage;
