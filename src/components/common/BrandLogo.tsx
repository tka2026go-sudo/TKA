import React, { useState } from 'react';

export const APP_LOGO_URL = 'https://lh3.googleusercontent.com/d/1tQPCSlVqJv08xNKeZRZhtRKC8T8PF-Uj?authuser=0';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const [hasError, setHasError] = useState(false);

  const sizeMap = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  const imgSizeClass = sizeMap[size];

  if (hasError) {
    return (
      <div className={`${imgSizeClass} bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-blue-600/20 border border-white/40 ${className}`}>
        TKA
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center shrink-0 overflow-hidden bg-white/90 p-1 shadow-md shadow-blue-900/10 border border-white/80 backdrop-blur-md ${imgSizeClass} ${className}`}>
      <img
        src={APP_LOGO_URL}
        alt="Logo TRY OUT TKA SMP"
        className="w-full h-full object-contain filter drop-shadow-xs"
        onError={() => setHasError(true)}
        loading="eager"
      />
    </div>
  );
};
