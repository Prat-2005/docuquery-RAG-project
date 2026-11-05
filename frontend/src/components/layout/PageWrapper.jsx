import React from 'react';

const PageWrapper = ({ children }) => {
  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text-primary)] font-sans transition-colors duration-200">
      {children}
    </div>
  );
};

export default PageWrapper;
