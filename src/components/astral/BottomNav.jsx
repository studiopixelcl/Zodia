"use client";
import React from 'react';
import { User, Flame, BookOpen, Heart, Gamepad2, Sparkles } from 'lucide-react';

export const BottomNav = ({ activeTab, setActiveTab }) => (
  <nav className="w-full max-w-sm sm:max-w-md mx-auto z-40 pointer-events-auto select-none" aria-label="Navegación principal">
    <div className="relative p-0.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/25 to-pink-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="flex justify-around items-center px-1 py-1 rounded-[15px] sm:rounded-[22px] bg-[#05070e]/95 border border-white/10">
        {[
          { id: 'eter',     icon: <Flame size={17} className="sm:w-[19px] sm:h-[19px]" />,     label: 'Citas'    },
          { id: 'vinculos', icon: <Heart size={17} className="sm:w-[19px] sm:h-[19px]" />,     label: 'Matches'  },
          { id: 'feed',     icon: <Sparkles size={17} className="sm:w-[19px] sm:h-[19px]" />,  label: 'Muro'     },
          { id: 'oraculo',  icon: <BookOpen size={17} className="sm:w-[19px] sm:h-[19px]" />,  label: 'Lecturas' },
          { id: 'juegos',   icon: <Gamepad2 size={17} className="sm:w-[19px] sm:h-[19px]" />,  label: 'Juegos'   },
          { id: 'espejo',   icon: <User size={17} className="sm:w-[19px] sm:h-[19px]" />,      label: 'Perfil'   },
        ].map(({ id, icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-col items-center py-1 px-1 sm:px-2 rounded-xl transition-all duration-300 active:scale-95 ${
                isActive
                  ? 'text-cyan-300 scale-105 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-5 h-0.5 sm:h-1 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
              )}
              <div className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.45)]'
                  : 'bg-transparent'
              }`}>
                {icon}
              </div>
              <span className={`text-[8px] sm:text-[9px] tracking-wider uppercase mt-0.5 font-semibold transition-colors ${
                isActive ? 'text-cyan-300 font-extrabold' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </nav>
);
