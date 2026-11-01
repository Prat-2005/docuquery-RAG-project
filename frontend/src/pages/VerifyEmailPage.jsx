import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import PageWrapper from '../components/layout/PageWrapper';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }

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
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Verifying your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Email verified</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link to="/login" className="inline-block px-5 py-3 bg-indigo-600 text-white font-semibold rounded-xl">
                Go to Login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900 mb-3">Verification failed</h1>
              <p className="text-red-600 mb-6">{message}</p>
              <Link to="/register" className="inline-block px-5 py-3 bg-indigo-600 text-white font-semibold rounded-xl">
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
