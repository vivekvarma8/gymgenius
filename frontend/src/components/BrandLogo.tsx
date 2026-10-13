import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GymGenius Logo - Gym Barbell & Genius Brain Emblem"
    >
      <defs>
        {/* Luxury Gold Primary Metallic Gradient */}
        <linearGradient id="ggGoldGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="25%" stopColor="#FCD34D" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Core Electric Neural Glow Gradient */}
        <linearGradient id="ggCoreGlow" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Dark Obsidian Badge Background */}
        <radialGradient id="ggBadgeBg" cx="32" cy="32" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1E28" />
          <stop offset="70%" stopColor="#121218" />
          <stop offset="100%" stopColor="#0B0B0F" />
        </radialGradient>

        {/* Chrome Barbell Shaft */}
        <linearGradient id="ggSteelShaft" x1="12" y1="32" x2="52" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="40%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFFBEB" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <filter id="ggGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* --- OUTER ATHLETIC SHIELD / HEXAGONAL CREST --- */}
      <path
        d="M32 3.5L55 13.5V33.5C55 47 44.5 57 32 60.5C19.5 57 9 47 9 33.5V13.5L32 3.5Z"
        fill="url(#ggBadgeBg)"
        stroke="url(#ggGoldGrad)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        filter="url(#ggGlowFilter)"
      />

      {/* Inner Bevel Shield Rim */}
      <path
        d="M32 7.5L51 15.8V33C51 44.5 42 53 32 56C22 53 13 44.5 13 33V15.8L32 7.5Z"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* --- THE GENIUS BRAIN HEMISPHERES (Geometric & Athletic Neural Cortex) --- */}
      {/* Left Brain Hemisphere */}
      <path
        d="M30 15C24.5 15 20.5 18.5 19.5 23C16.8 24 15.2 27 15.8 30.5C15 33 16.5 36.5 18.5 38.5C18.2 42 21.5 46.5 26.5 47C29 47.2 30 46 30 44V15Z"
        fill="url(#ggCoreGlow)"
        fillOpacity="0.18"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Right Brain Hemisphere */}
      <path
        d="M34 15C39.5 15 43.5 18.5 44.5 23C47.2 24 48.8 27 48.2 30.5C49 33 47.5 36.5 45.5 38.5C45.8 42 42.5 46.5 37.5 47C35 47.2 34 46 34 44V15Z"
        fill="url(#ggCoreGlow)"
        fillOpacity="0.18"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Left Neural Pathways / Sulci Folds */}
      <path
        d="M23 19.5C26 21.5 27.5 24 25.5 27C23.5 30 26.5 32 30 32"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M19 28C22.5 28.5 24.5 31.5 22.5 34.5C21 37.5 23.5 41 28 42"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Right Neural Pathways / Sulci Folds */}
      <path
        d="M41 19.5C38 21.5 36.5 24 38.5 27C40.5 30 37.5 32 34 32"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M45 28C41.5 28.5 39.5 31.5 41.5 34.5C43 37.5 40.5 41 36 42"
        stroke="url(#ggGoldGrad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Central Cerebral Fissure Axis */}
      <line x1="32" y1="14" x2="32" y2="47" stroke="#121218" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="32" y1="16" x2="32" y2="45" stroke="url(#ggGoldGrad)" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />

      {/* --- GYM BARBELL & WEIGHT PLATES --- */}
      {/* Central Solid Barbell Steel Shaft */}
      <rect x="12" y="30.5" width="40" height="3" rx="1.5" fill="url(#ggSteelShaft)" />

      {/* Left Weight Plate Stack */}
      <rect x="10.5" y="23" width="3" height="18" rx="1.5" fill="url(#ggGoldGrad)" stroke="#121218" strokeWidth="0.8" />
      <rect x="6.5" y="25" width="3" height="14" rx="1.2" fill="url(#ggGoldGrad)" stroke="#121218" strokeWidth="0.8" />
      <rect x="14" y="28" width="1.8" height="8" rx="0.9" fill="#FFF7D6" />

      {/* Right Weight Plate Stack */}
      <rect x="50.5" y="23" width="3" height="18" rx="1.5" fill="url(#ggGoldGrad)" stroke="#121218" strokeWidth="0.8" />
      <rect x="54.5" y="25" width="3" height="14" rx="1.2" fill="url(#ggGoldGrad)" stroke="#121218" strokeWidth="0.8" />
      <rect x="48.2" y="28" width="1.8" height="8" rx="0.9" fill="#FFF7D6" />

      {/* Barbell Diamond Knurling Grips */}
      <line x1="26" y1="30.5" x2="26" y2="33.5" stroke="#121218" strokeWidth="1" />
      <line x1="30" y1="30.5" x2="30" y2="33.5" stroke="#121218" strokeWidth="1" />
      <line x1="34" y1="30.5" x2="34" y2="33.5" stroke="#121218" strokeWidth="1" />
      <line x1="38" y1="30.5" x2="38" y2="33.5" stroke="#121218" strokeWidth="1" />

      {/* --- APEX GENIUS NODE / BRAIN POWER SYNAPSE --- */}
      <circle cx="32" cy="11.5" r="2.5" fill="url(#ggGoldGrad)" />
      <circle cx="32" cy="11.5" r="1" fill="#FFFFFF" />
      <path d="M32 7.5L32 9.5" stroke="url(#ggGoldGrad)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
