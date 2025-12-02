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
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showIcon && (
        <div className={`${iconSizes[size]} relative flex-shrink-0`}>
          <img
            src="/movsense_icon_color.png"
            alt="MovSense Icon"
            className="w-full h-full object-contain"
            loading="eager"
          />
        </div>
      )}
      <span
        className={`${sizeClasses[size]} font-bold tracking-tight`}
        style={{ fontFamily: 'Public Sans, sans-serif' }}
      >
        MovSense
      </span>
    </div>
  );
}
