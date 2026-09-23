import React from 'react';

interface SdkBrandMarkProps {
  className?: string;
  size?: number;
}

export const SdkBrandMark: React.FC<SdkBrandMarkProps> = ({
  className = 'w-48 h-48',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Subaga Digital Kreatif Logo"
    >
      {/* Upper Left Orange Lobe */}
      <path
        d="M 160 40 L 375 40 Q 390 40 395 52 L 305 240 L 160 240 A 100 100 0 0 1 160 40 Z"
        fill="#F58320"
      />

      {/* Upper Right Dark Navy Slash */}
      <path
        d="M 425 40 L 460 40 Q 470 40 472 50 L 392 220 Q 388 228 378 228 L 343 228 Q 333 228 335 218 L 415 48 Q 418 40 425 40 Z"
        fill="#212638"
      />

      {/* Lower Left Orange Stripe 1 (Outer) */}
      <line
        x1="112"
        y1="285"
        x2="42"
        y2="455"
        stroke="#F58320"
        strokeWidth="38"
        strokeLinecap="round"
      />

      {/* Lower Left Orange Stripe 2 (Inner) */}
      <line
        x1="165"
        y1="285"
        x2="95"
        y2="455"
        stroke="#F58320"
        strokeWidth="38"
        strokeLinecap="round"
      />

      {/* Lower Right Dark Navy Lobe */}
      <path
        d="M 310 255 L 340 255 A 100 100 0 0 1 340 455 L 222 455 Q 208 455 214 440 L 298 268 Q 303 255 310 255 Z"
        fill="#212638"
      />
    </svg>
  );
};
