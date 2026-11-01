import React from 'react';

const PageWrapper = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {children}
    </div>
  );
};

export default PageWrapper;
