import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn group relative flex items-center gap-2 rounded-xl p-2 transition-all duration-200 outline-none ${className}`}
      title={isDark ? 'Switch to Claymorphism Light Mode' : 'Switch to Neomorphism Dark Mode'}
      aria-label="Toggle Claymorphism / Neomorphism theme"
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? 'Neomorphism Dark' : 'Claymorphism Light'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
