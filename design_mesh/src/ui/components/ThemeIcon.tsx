import * as React from "react";

export function ThemeIcon({ theme }: { theme: "light" | "dark" | "system" | "acrylic" }) {
  if (theme === "light") {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-yellow-400">
        <circle cx="12" cy="12" r="5" strokeWidth="2"/>
        <path strokeWidth="2" d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 7.07l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/>
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-900 dark:text-yellow-300">
        <path strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
      </svg>
    );
  }
  if (theme === "acrylic") {
    // Sparkle/frosted glass icon for acrylic
    return (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" className="text-cyan-400 dark:text-pink-300 shimmer">
        <g>
          <circle cx="12" cy="12" r="7" fill="url(#acrylicGradient)" fillOpacity="0.7" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M5.5 18.5l1.5-1.5M17 7l1.5-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.15" />
          {/* Add sparkles */}
          <circle cx="8" cy="8" r="0.5" fill="white" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="16" cy="6" r="0.5" fill="white" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="18" cy="16" r="0.5" fill="white" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
        <defs>
          <radialGradient id="acrylicGradient" cx="0" cy="0" r="1" gradientTransform="translate(12 12) scale(7)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6a82fb" />
            <stop offset="0.5" stopColor="#fc5c7d" />
            <stop offset="1" stopColor="#43cea2" />
          </radialGradient>
        </defs>
      </svg>
    );
  }
  // system
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-500">
      <path strokeWidth="2" d="M12 3v1m0 16v1m8.66-8.66l-.71.71M4.05 19.95l-.71-.71M21 12h-1M4 12H3m16.95-7.07l-.71.71M6.34 6.34l-.71-.71"/>
      <circle cx="12" cy="12" r="5" strokeWidth="2"/>
    </svg>
  );
}
