import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import PageWrapper from './components/layout/PageWrapper';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import { authService } from './services/authService';

const applyTheme = (theme) => {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark));
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAppRoute = location.pathname.startsWith('/app');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    applyTheme(savedTheme);

    if (!user) return undefined;

    let active = true;
    authService.getSettings()
      .then((settings) => {
        if (active && settings.theme) {
          localStorage.setItem('theme', settings.theme);
          applyTheme(settings.theme);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <PageWrapper>
      {!isAppRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/verify-auth-credentials" element={<VerifyEmailPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageWrapper>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
