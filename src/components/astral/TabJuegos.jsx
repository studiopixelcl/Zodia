"use client";
import React, { useState } from 'react';
import { TabLudoAstral } from './TabLudoAstral';
import { Dices, Sparkles, Gamepad2, Trophy, Star, ShieldAlert } from 'lucide-react';

export const TabJuegos = ({ profile, onGameActiveChange }) => {
  const [activeGame, setActiveGame] = useState(null);

  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
    if (onGameActiveChange) onGameActiveChange(!!gameId);
  };

  if (activeGame === 'ludo') {
    return <TabLudoAstral profile={profile} onBack={() => handleSelectGame(null)} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn px-4 pb-20">
      {/* Cabecera de la Sección de Juegos */}
      <div className="glass-panel p-6 relative overflow-hidden bg-gradient-to-r from-cyan-950/30 via-purple-950/20 to-black/60 border border-cyan-500/20">
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulseGlow" />
        <h3 className="mystic-font text-xl text-white mb-2 flex items-center gap-2">
          <Gamepad2 className="text-cyan-400" size={22} /> ARCADIA ASTRAL
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed font-light">
          Juegos clásicos reinventados con la mitología, astrología y energía elemental de ZODIA.
        </p>
      </div>

      {/* Galería de Juegos */}
      <div>
        <h3 className="mystic-font text-lg text-white mb-4 pl-2 flex items-center justify-between">
          <span>Selecciona un Desafío</span>
          <span className="text-xs text-cyan-400 font-normal">1 Disponible</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Ludo Astral (ACTIVO) */}
          <div className="glass-panel p-6 border border-cyan-500/40 hover:border-cyan-400 transition-all group relative overflow-hidden bg-gradient-to-b from-cyan-950/30 to-black/80 flex flex-col justify-between">
            <div className="absolute top-3 right-3 bg-cyan-500 text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              DISPONIBLE
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                <Dices size={26} />
              </div>
              <h4 className="mystic-font text-xl text-white font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                LUDO ASTRAL
              </h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed mb-4">
                El clásico juego de mesa de 4 facciones elementales (Fuego, Tierra, Aire, Agua). Lanza el dado cósmico y conquista el Núcleo del Éter.
              </p>
            </div>

            <button
              onClick={() => handleSelectGame('ludo')}
              className="btn-mystic w-full py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles size={16} /> ENTRAMOS AL TABLERO
            </button>
          </div>

          {/* 2. Tarot de la Fortuna (PRÓXIMAMENTE) */}
          <div className="glass-panel p-6 border border-white/10 opacity-60 relative overflow-hidden bg-gradient-to-b from-purple-950/10 to-black/80 flex flex-col justify-between">
            <div className="absolute top-3 right-3 bg-white/10 text-gray-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              PRÓXIMAMENTE
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                <Star size={26} />
              </div>
              <h4 className="mystic-font text-xl text-white font-bold mb-2">
                DESAFÍO DEL FIRMAMENTO
              </h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed mb-4">
                Trivia y duelos de conocimientos astrológicos para poner a prueba tu dominio sobre los arcanos y las casas solares.
              </p>
            </div>

            <button
              disabled
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed"
            >
              BLOQUEADO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
