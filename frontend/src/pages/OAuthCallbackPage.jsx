import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageWrapper from '../components/layout/PageWrapper';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Google sign-in did not return an access token.');
      return;
    }

    login(token)
      .then(() => navigate('/app', { replace: true }))
      .catch(() => {
        setError('Google sign-in could not be completed. Please try again.');
      });
  }, [login, navigate, searchParams]);

  return (
    <PageWrapper>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
          {error ? (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-6">{error}</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-3 bg-indigo-600 text-white font-semibold rounded-xl"
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Completing Google sign-in...</p>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default OAuthCallbackPage;
