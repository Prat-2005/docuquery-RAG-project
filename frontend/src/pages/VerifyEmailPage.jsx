import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import PageWrapper from '../components/layout/PageWrapper';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const verificationStarted = useRef(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (verificationStarted.current) {
      return undefined;
    }

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return undefined;
    }

    verificationStarted.current = true;
    authService.verifyEmail(token)
      .then((response) => {
        const verificationMessage = response.message || 'Verification completed.';
        setMessage(verificationMessage);
        setStatus(verificationMessage.startsWith('Verification completed') ? 'success' : 'error');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.detail || 'This verification link is invalid or expired.');
      });
  }, [token]);

  return (
    <PageWrapper>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full theme-card rounded-3xl p-8 sm:p-10 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Email verified</h1>
              <p className="text-slate-600 mb-6 text-sm">{message}</p>
              <Link to="/login" className="inline-block px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700 transition-all active:scale-95">
                Go to Login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                <AlertCircle className="w-9 h-9" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">Verification failed</h1>
              <p className="text-rose-600 mb-6 text-sm">{message}</p>
              <Link to="/register" className="inline-block px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-md hover:bg-indigo-700 transition-all active:scale-95">
                Back to Registration
              </Link>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default VerifyEmailPage;
