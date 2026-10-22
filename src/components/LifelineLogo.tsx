import React from 'react';

interface LifelineLogoProps {
  id?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
  subtitle?: string;
}

export const LifelineLogo: React.FC<LifelineLogoProps> = ({
  id,
  className = '',
  size = 'md',
  showText = true,
  variant = 'light',
  subtitle = 'LOGIN'
}) => {
  const iconDimensions = {
    sm: { w: 38, h: 38 },
    md: { w: 56, h: 56 },
    lg: { w: 84, h: 84 }
  }[size];

  const isDark = variant === 'dark';

  return (
    <div id={id} className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* Exact Vector Emblem based on project logo */}
      <svg
        width={iconDimensions.w}
        height={iconDimensions.h}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md transition-transform duration-300 hover:scale-105"
      >
        {/* Blue Road Curved Ribbon 1 (Outer Lane) */}
        <path
          d="M 25 155 C 60 155, 75 125, 95 95 C 105 80, 115 75, 125 75 C 110 82, 95 100, 80 125 C 65 150, 45 155, 25 155 Z"
          fill="#1E5C99"
        />

        {/* Blue Road Curved Ribbon 2 (Main Sweeping Highway) */}
        <path
          d="M 40 155 C 80 155, 100 115, 120 78 C 100 90, 85 120, 60 145 C 50 152, 45 155, 40 155 Z"
          fill="#0D3B66"
        />

        {/* Road divider dashed highlights */}
        <path
          d="M 50 152 C 75 145, 90 115, 108 90"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Red Medical Cross Outline / Body */}
        <path
          d="
            M 125 45
            L 145 45
            L 145 75
            L 175 75
            L 175 115
            L 145 115
            L 145 155
            L 125 155
            L 125 115
            L 95 115
            L 95 75
            L 125 75
            Z
          "
          stroke="#E62727"
          strokeWidth="7"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Red Location Pin on top of cross */}
        <path
          d="
            M 135 15
            C 123 15, 115 24, 115 35
            C 115 48, 135 70, 135 70
            C 135 70, 155 48, 155 35
            C 155 24, 147 15, 135 15 Z
          "
          fill="#E62727"
        />
        {/* Pin inner circle hole */}
        <circle cx="135" cy="34" r="5.5" fill="#FFFFFF" />

        {/* Red Pulse / ECG Heartbeat Line crossing the emblem */}
        <polyline
          points="80,105 105,105 115,80 125,130 135,65 145,120 155,95 165,105 185,105"
          fill="none"
          stroke="#E62727"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-black tracking-wider leading-none transition-colors ${
              isDark
                ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]'
                : 'text-slate-900 drop-shadow-xs'
            } ${
              size === 'sm'
                ? 'text-lg sm:text-xl'
                : size === 'lg'
                ? 'text-3xl sm:text-4xl'
                : 'text-2xl sm:text-3xl'
            }`}
            style={{ fontFamily: "'Montserrat', 'Inter', system-ui, -apple-system, sans-serif" }}
          >
            LIFELINE
          </span>
          {subtitle && (
            <span
              className={`font-bold tracking-[0.2em] uppercase mt-0.5 truncate ${
                isDark ? 'text-sky-400 drop-shadow-[0_1px_4px_rgba(56,189,248,0.4)]' : 'text-blue-800'
              } ${
                size === 'sm'
                  ? 'text-[8px] sm:text-[9px]'
                  : size === 'lg'
                  ? 'text-[11px] sm:text-[12px]'
                  : 'text-[9px] sm:text-[10px]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
