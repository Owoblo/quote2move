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

  // Explicit dimensions for better CLS (Cumulative Layout Shift)
  const dimensions = {
    sm: { height: 24, width: 120 },
    md: { height: 32, width: 160 },
    lg: { height: 40, width: 200 },
    xl: { height: 48, width: 240 },
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/movsense_logo.svg"
        alt="MovSense - AI-Powered Moving Quotes"
        className={`${logoHeights[size]} w-auto`}
        width={dimensions[size].width}
        height={dimensions[size].height}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
