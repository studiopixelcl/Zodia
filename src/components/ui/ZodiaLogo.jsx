"use client";
import React, { useState } from 'react';

export default function ZodiaLogo({ size = 'md', showText = true, className = '', textClassName = '' }) {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: { box: 'w-6 h-6 rounded-lg', text: 'text-sm tracking-[0.2em]' },
    sm: { box: 'w-8 h-8 rounded-xl', text: 'text-base tracking-[0.22em]' },
    md: { box: 'w-10 h-10 rounded-2xl', text: 'text-xl tracking-[0.25em]' },
    lg: { box: 'w-12 h-12 rounded-2xl', text: 'text-2xl tracking-[0.28em]' },
    xl: { box: 'w-16 h-16 rounded-3xl', text: 'text-3xl tracking-[0.3em]' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Isotipo Oficial Zodia */}
      <div className={`relative ${currentSize.box} shrink-0 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.6)] border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:border-sky-400/50 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.35)]`}>
        {!imgError ? (
          <img
            src="/zodia/assets/ico.png"
            alt="Zodia"
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              if (e.currentTarget.src.includes('/zodia/')) {
                e.currentTarget.src = '/assets/ico.png';
              } else {
                setImgError(true);
              }
            }}
          />
        ) : (
          /* SVG Fallback vectorial */
          <div className="w-full h-full bg-[#0b0e1a] flex items-center justify-center">
            <svg viewBox="0 0 100 100" width="75%" height="75%" fill="none">
              <defs>
                <linearGradient id="fallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
              <path d="M26 30 H74 L68 37 H34 L74 65 H26 L32 58 H66 Z" fill="url(#fallbackGrad)" />
            </svg>
          </div>
        )}
      </div>

      {/* Logotipo tipográfico */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`mystic-font font-bold text-white transition-colors duration-300 group-hover:text-sky-300 ${currentSize.text} ${textClassName}`}>
            ZODIA
          </span>
        </div>
      )}
    </div>
  );
}
