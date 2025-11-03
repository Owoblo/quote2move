import React from 'react';

interface MovSenseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

export default function MovSenseLogo({ size = 'md', showIcon = true, className = '' }: MovSenseLogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <div className={`${iconSizes[size]} relative`}>
          {/* AI Eye/Lens Icon - Overlapping cubes */}
          <svg viewBox="0 0 32 32" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer cube */}
            <rect x="4" y="4" width="24" height="24" rx="2" fill="url(#gradient1)" opacity="0.3" />
            {/* Middle cube */}
            <rect x="8" y="8" width="16" height="16" rx="2" fill="url(#gradient2)" opacity="0.5" />
            {/* Inner cube/eye */}
            <rect x="12" y="12" width="8" height="8" rx="2" fill="#00C2FF" />
            {/* Neural pattern lines */}
            <path d="M16 4 L16 12 M4 16 L12 16 M20 16 L28 16 M16 20 L16 28" stroke="#00C2FF" strokeWidth="1.5" opacity="0.6" />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00C2FF" />
                <stop offset="100%" stopColor="#0D1321" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B3D" />
                <stop offset="100%" stopColor="#00C2FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
      <div className="relative">
        <span className={`${sizeClasses[size]} logo-font text-primary font-extrabold tracking-tight`}>
          Mov<span className="relative inline-block">
            S
            {/* Neural pattern underline for the S */}
            <svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path
                d="M 0 5 Q 20 2, 40 5 T 80 5 T 100 5"
                stroke="#00C2FF"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 0 8 Q 25 5, 50 8 T 100 8"
                stroke="#FF6B3D"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </span>ense
        </span>
      </div>
    </div>
  );
}
