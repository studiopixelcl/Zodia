"use client";
import React, { useState } from 'react';
import { getZodiacIconPath, getZodiacSymbol } from '../../lib/astrology';

export const ZodiacBadge = ({ sign, size = "md", className = "", zoom = 1.35 }) => {
  const [imgError, setImgError] = useState(false);
  const iconPath = getZodiacIconPath(sign);
  const symbol = getZodiacSymbol(sign);

  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-7 h-7 text-xs",
    md: "w-10 h-10 text-base",
    lg: "w-14 h-14 text-2xl",
    xl: "w-20 h-20 text-4xl",
    "2xl": "w-24 h-24 text-5xl",
    "3xl": "w-28 h-28 text-6xl"
  };

  const chosenSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-[#060810] border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)] overflow-hidden shrink-0 select-none group/badge ${chosenSize} ${className}`}
      title={sign}
    >
      {!imgError && iconPath ? (
        <img
          src={iconPath}
          alt={sign}
          onError={() => setImgError(true)}
          style={{ transform: `scale(${zoom})` }}
          className="w-full h-full object-cover rounded-full group-hover/badge:scale-[1.5] transition-transform duration-300"
        />
      ) : (
        <span className="text-cyan-400 font-extrabold">{symbol}</span>
      )}
    </div>
  );
};
