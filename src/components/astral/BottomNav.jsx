"use client";
import React from 'react';
import { User, Flame, BookOpen, Heart, Gamepad2, Sparkles } from 'lucide-react';

export const BottomNav = ({ activeTab, setActiveTab }) => (
  <div className="w-full max-w-sm sm:max-w-md mx-auto z-40 pointer-events-auto select-none">
    <div className="relative p-0.5 sm:p-1 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-amber-500/20 shadow-[0_10px_35px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="flex justify-around items-center px-1 sm:px-1.5 py-1 sm:py-1.5 rounded-[16px] sm:rounded-[22px] bg-[#070913]/95 border border-white/10">
        {[
          { id: 'eter',     icon: <Flame size={16} className="sm:w-[18px] sm:h-[18px]" />,     label: 'Citas'    },
          { id: 'vinculos', icon: <Heart size={16} className="sm:w-[18px] sm:h-[18px]" />,     label: 'Matches'  },
          { id: 'feed',     icon: <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />,  label: 'Muro'     },
          { id: 'oraculo',  icon: <BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" />,  label: 'Lecturas' },
          { id: 'juegos',   icon: <Gamepad2 size={16} className="sm:w-[18px] sm:h-[18px]" />,  label: 'Juegos'   },
          { id: 'espejo',   icon: <User size={16} className="sm:w-[18px] sm:h-[18px]" />,      label: 'Perfil'   },
        ].map(({ id, icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-col items-center py-1 px-1.5 sm:px-2.5 rounded-xl transition-all duration-300 ${
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
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-transparent'
              }`}>
                {icon}
              </div>
              <span className={`text-[8px] sm:text-[9px] tracking-widest uppercase mt-0.5 font-semibold ${
                isActive ? 'text-cyan-300' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
