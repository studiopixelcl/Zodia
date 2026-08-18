"use client";
import React from 'react';
import { User, Compass, Moon, MessageCircle, Gamepad2 } from 'lucide-react';

export const BottomNav = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-md z-50">
    <div className="relative p-1 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-amber-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
      <div className="flex justify-around items-center px-2 py-2 rounded-[22px] bg-[#060812]/95 border border-white/10">
        {[
          { id: 'espejo',   icon: <User size={19} />,          label: 'Perfil'   },
          { id: 'eter',     icon: <Compass size={19} />,       label: 'Explorar' },
          { id: 'oraculo',  icon: <Moon size={19} />,          label: 'Guía'     },
          { id: 'vinculos', icon: <MessageCircle size={19} />, label: 'Mensajes' },
          { id: 'juegos',   icon: <Gamepad2 size={19} />,       label: 'Juegos'   },
        ].map(({ id, icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-cyan-300 scale-105 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:scale-102'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4] animate-pulse" />
              )}
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-transparent'
              }`}>
                {icon}
              </div>
              <span className={`text-[9px] tracking-widest uppercase mt-1 font-semibold ${
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
