"use client";
import React from 'react';

export default function ZodiaLogo({ size = 'md', showText = true, className = '', textClassName = '' }) {
  const sizeMap = {
    xs: { icon: 20, box: 'w-6 h-6', text: 'text-sm tracking-[0.2em]' },
    sm: { icon: 26, box: 'w-8 h-8', text: 'text-base tracking-[0.22em]' },
    md: { icon: 34, box: 'w-10 h-10', text: 'text-xl tracking-[0.25em]' },
    lg: { icon: 44, box: 'w-12 h-12', text: 'text-2xl tracking-[0.28em]' },
    xl: { icon: 56, box: 'w-16 h-16', text: 'text-3xl tracking-[0.3em]' }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Isotipo Zodia SVG */}
      <div className={`relative ${currentSize.box} shrink-0 rounded-2xl bg-[#0b0e1a]/90 border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:border-sky-400/40 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.25)]`}>
        <svg
          viewBox="0 0 100 100"
          width="75%"
          height="75%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="zodiaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="orbitGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.5)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0.3)" />
            </linearGradient>
          </defs>

          {/* Órbita sutil */}
          <g transform="translate(50, 50) rotate(-28)">
            <ellipse cx="0" cy="0" rx="42" ry="16" stroke="url(#orbitGradMini)" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx="41" cy="-4" r="2" fill="#38BDF8" />
          </g>

          {/* Monograma geométrico Z */}
          <path
            d="M26 30 H74 L68 37 H34 L74 65 H26 L32 58 H66 Z"
            fill="url(#zodiaGradient)"
          />

          {/* Estrella guía de 4 puntas */}
          <path
            d="M50 43 L51.5 48.5 L57 50 L51.5 51.5 L50 57 L48.5 51.5 L43 50 L48.5 48.5 Z"
            fill="#FFFFFF"
          />
        </svg>
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
