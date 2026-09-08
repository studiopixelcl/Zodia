"use client";
import React from 'react';
import { Compass, User, Package, Zap, Swords, Gift } from 'lucide-react';

export const CotzBottomNav = ({ activeTab, setActiveTab, hasAlert = false }) => {
  const tabs = [
    { id: 'inicio',   icon: Compass, label: 'Inicio' },
    { id: 'heroe',    icon: User,    label: 'Héroe' },
    { id: 'equipo',   icon: Package, label: 'Equipo' },
    { id: 'skills',   icon: Zap,     label: 'Skills' },
    { id: 'aventura', icon: Swords,  label: 'Aventura' },
    { id: 'misiones', icon: Gift,    label: 'Misiones', badge: hasAlert },
  ];

  return (
    <nav 
      className="fixed bottom-2 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-auto select-none" 
      aria-label="Navegación de Chronicles of the Zodia"
    >
      <div className="w-full max-w-md sm:max-w-xl mx-auto relative p-0.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-amber-500/25 shadow-[0_10px_35px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
        <div className="flex justify-around items-center px-1 py-1 rounded-[15px] sm:rounded-[22px] bg-[#05070e]/95 border border-cyan-500/20">
          {tabs.map(({ id, icon: Icon, label, badge }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-col items-center py-1 px-1 sm:px-2 rounded-xl transition-all duration-300 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 scale-105 font-bold'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {/* Píldora luminosa superior en pestaña activa */}
                {isActive && (
                  <span className="absolute -top-1 w-5 h-0.5 sm:h-1 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse" />
                )}

                {/* Ícono de pestaña con badge reactivo */}
                <div className="relative">
                  <div className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.45)]'
                      : 'bg-transparent'
                  }`}>
                    <Icon size={18} className="sm:w-[20px] sm:h-[20px]" />
                  </div>

                  {badge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-black animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                  )}
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
};
