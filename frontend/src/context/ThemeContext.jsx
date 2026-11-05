import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const ThemeContext = createContext({
  theme: 'system',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme') || 'system';
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme class to <html>
  const applyThemeToDOM = (selectedTheme) => {
    const root = document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark =
      selectedTheme === 'dark' || (selectedTheme === 'system' && systemPrefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'neomorphism');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'claymorphism');
    }
  };

  useEffect(() => {
    applyThemeToDOM(theme);
    localStorage.setItem('theme', theme);

    // Listen to system changes if theme === 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = localStorage.getItem('theme') || 'system';
      if (current === 'system') {
        applyThemeToDOM('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeToDOM(newTheme);

    // Sync with backend if user has a token
    const token = localStorage.getItem('access_token');
    if (token) {
      authService.updateSettings({ theme: newTheme }).catch(() => {});
    }
  };

  const toggleTheme = () => {
    // If currently dark, flip to light (Claymorphism), otherwise to dark (Neomorphism)
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
