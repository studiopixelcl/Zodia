"use client";
import React from 'react';
import { 
  Flame, Sparkles, X, Check, Lock, Trophy, Award, 
  Calendar, Shield, Zap 
} from 'lucide-react';
import { COSMIC_BADGES, getGamificationStats } from '../../lib/gamification';

export function CosmicStreakModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const stats = getGamificationStats();
  const streak = stats.streak || 1;
  const unlockedBadges = stats.unlockedBadges || [];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel p-5 sm:p-6 rounded-3xl border border-amber-500/30 max-w-md w-full space-y-4 bg-[#090c1f] shadow-[0_0_50px_rgba(245,158,11,0.2)] relative max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X size={18} />
        </button>

        {/* ── CABECERA: LLAMA DE RACHA CÓSMICA ── */}
        <div className="text-center pt-2 pb-3 border-b border-white/10 space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white mx-auto shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse">
            <Flame size={36} className="fill-white/20" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
              Sintonía Consecutiva
            </span>
            <h3 className="text-2xl font-black text-white mystic-font">
              {streak} {streak === 1 ? 'Día Cósmico' : 'Días Cósmicos'}
            </h3>
            <p className="text-xs text-gray-300 font-light max-w-xs mx-auto mt-1 leading-snug">
              Cada día que abres Zodia fortaleces tu alineación con los tránsitos y elevas tu resonancia colectiva.
            </p>
          </div>
        </div>

        {/* ── INSIGNIAS DE CONSCIENCIA ASTRAL ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Award size={14} className="text-amber-400" />
              Insignias de Consciencia ({unlockedBadges.length}/{COSMIC_BADGES.length})
            </span>
            <span className="text-[10px] text-cyan-300 font-mono">
              {Math.round((unlockedBadges.length / COSMIC_BADGES.length) * 100)}% Desbloqueado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COSMIC_BADGES.map(badge => {
              const isUnlocked = unlockedBadges.includes(badge.id);

              return (
                <div 
                  key={badge.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 relative ${
                    isUnlocked
                      ? `bg-gradient-to-br ${badge.color} shadow-sm`
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className="text-2xl p-1 bg-black/40 rounded-xl shrink-0 leading-none">
                    {badge.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-white leading-tight truncate">
                        {badge.title}
                      </h4>
                      {isUnlocked ? (
                        <Check size={12} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Lock size={11} className="text-gray-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-300 font-light mt-0.5 leading-snug">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón Aceptar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-black font-extrabold text-xs tracking-wider transition shadow-lg"
        >
          Continuar mi Viaje Astral ✨
        </button>
      </div>
    </div>
  );
}
