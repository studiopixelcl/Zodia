"use client";
import React, { useState } from 'react';
import { TabLudoAstral } from './TabLudoAstral';
import { ChroniclesGame } from './rpg/ChroniclesGame';
import { Dices, Sparkles, Gamepad2, Trophy, Star, Sword, ShieldAlert } from 'lucide-react';

export const TabJuegos = ({ profile, onGameActiveChange }) => {
  const [activeGame, setActiveGame] = useState(null);

  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
    if (onGameActiveChange) onGameActiveChange(!!gameId);
  };

  if (activeGame === 'ludo') {
    return <TabLudoAstral profile={profile} onBack={() => handleSelectGame(null)} />;
  }

  if (activeGame === 'chronicles') {
    return <ChroniclesGame profile={profile} onBack={() => handleSelectGame(null)} />;
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
          Juegos y aventuras cósmicas reinventadas con la mitología, sinastría y energía elemental de ZODIA.
        </p>
      </div>

      {/* Galería de Juegos */}
      <div>
        <h3 className="mystic-font text-lg text-white mb-4 pl-2 flex items-center justify-between">
          <span>Selecciona un Desafío</span>
          <span className="text-xs text-cyan-400 font-normal">2 Disponibles</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Chronicles of the Zodia (RPG NUEVO Y DESTACADO) */}
          <div className="glass-panel p-6 border-2 border-amber-500/60 hover:border-amber-400 transition-all group relative overflow-hidden bg-gradient-to-b from-purple-950/40 via-indigo-950/20 to-black/90 flex flex-col justify-between shadow-xl shadow-amber-500/10">
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-md">
              NUEVO RPG
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-300 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                <Sword size={26} />
              </div>
              <h4 className="mystic-font text-xl text-white font-bold mb-2 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                CHRONICLES OF THE ZODIA
              </h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed mb-4">
                RPG táctico por turnos. Encarna el héroe de tu signo zodiacal, conquista las 12 Casas, forja reliquias cósmicas y desata ataques de sinastría en pareja.
              </p>
            </div>

            <button
              onClick={() => handleSelectGame('chronicles')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all"
            >
              <Sparkles size={16} /> JUGAR CRÓNICAS
            </button>
          </div>

          {/* 2. Ludo Astral (ACTIVO) */}
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
              <Sparkles size={16} /> ENTRAR AL TABLERO
            </button>
          </div>

          {/* 3. Trivia del Firmamento (PRÓXIMAMENTE) */}
          <div className="glass-panel p-6 border border-white/10 opacity-60 relative overflow-hidden bg-gradient-to-b from-purple-950/10 to-black/80 flex flex-col justify-between sm:col-span-2">
            <div className="absolute top-3 right-3 bg-white/10 text-gray-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              PRÓXIMAMENTE
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 text-purple-400">
                <Star size={22} />
              </div>
              <h4 className="mystic-font text-lg text-white font-bold mb-1">
                DESAFÍO DEL FIRMAMENTO
              </h4>
              <p className="text-xs text-gray-400 font-light leading-relaxed mb-3">
                Trivia y duelos de conocimientos astrológicos para poner a prueba tu dominio sobre los arcanos mayores y las casas solares.
              </p>
            </div>

            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed"
            >
              BLOQUEADO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

