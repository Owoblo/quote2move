import React from 'react';

interface MovSenseLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  className?: string;
}

export default function MovSenseLogo({ size = 'md', showIcon = true, className = '' }: MovSenseLogoProps) {
  const logoHeights = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-12',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/movsense_logo.svg"
        alt="MovSense Logo"
        className={`${logoHeights[size]} w-auto`}
      />
    </div>
  );
}
