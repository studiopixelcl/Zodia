"use client";
import React, { useState, useEffect } from 'react';
import { TabLudoAstral } from './TabLudoAstral';
import { ChroniclesGame } from './rpg/ChroniclesGame';
import { getOrCreateHeroProfile, ZODIAC_HERO_CLASSES, ELEMENTAL_AFFINITIES, getZodiacIcon, isValidImageUrl } from './rpg/rpg-data';
import { Dices, Sparkles, Gamepad2, Trophy, Star, Sword, Shield, ChevronRight, Zap, Coins } from 'lucide-react';

export const TabJuegos = ({ profile, onGameActiveChange }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [hero, setHero] = useState(null);

  useEffect(() => {
    setHero(getOrCreateHeroProfile(profile));
  }, [profile]);

  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
    if (onGameActiveChange) onGameActiveChange(!!gameId);
  };

  if (activeGame === 'ludo') {
    return <TabLudoAstral profile={profile} onBack={() => handleSelectGame(null)} />;
  }

  if (activeGame === 'chronicles') {
    return (
      <ChroniclesGame 
        profile={profile} 
        onBack={() => {
          handleSelectGame(null);
          // Refrescar el estado del héroe tras salir de combate
          setHero(getOrCreateHeroProfile(profile));
        }} 
      />
    );
  }

  const heroSign = hero?.sign || profile?.sign || 'Capricornio';
  const heroClass = ZODIAC_HERO_CLASSES[heroSign] || ZODIAC_HERO_CLASSES['Aries'];
  const heroElem = hero?.element || heroClass?.element || 'Tierra';
  const elemMeta = ELEMENTAL_AFFINITIES[heroElem] || ELEMENTAL_AFFINITIES['Tierra'];
  const expPercent = hero ? Math.min(100, Math.round((hero.exp / hero.expNext) * 100)) : 0;
  const housesPercent = hero ? Math.round(((hero.maxHouseCleared || 0) / 12) * 100) : 0;

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

      {/* BARRA DE PROGRESO ASTRAL DEL JUGADOR */}
      {hero && (
        <div 
          onClick={() => handleSelectGame('chronicles')}
          className="glass-panel p-5 rounded-3xl border-2 border-amber-500/40 hover:border-amber-400 cursor-pointer transition-all bg-gradient-to-r from-purple-950/40 via-black/80 to-amber-950/30 shadow-2xl relative overflow-hidden group"
        >
          {/* Luz de fondo reactiva y watermark del signo */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <img 
            src={getZodiacIcon(heroSign)} 
            alt="" 
            className="absolute -right-6 -bottom-6 w-36 h-36 object-contain opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]" 
          />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-3">
              {/* Avatar con foto de perfil y medallón del signo */}
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 ${elemMeta.border} ${elemMeta.aura} p-1 bg-black flex items-center justify-center relative shadow-xl`}>
                  {isValidImageUrl(hero.avatarUrl) ? (
                    <img 
                      src={hero.avatarUrl} 
                      alt="" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getZodiacIcon(heroSign);
                        e.currentTarget.className = "w-10 h-10 object-contain";
                      }}
                    />
                  ) : (
                    <img src={getZodiacIcon(heroSign)} alt="" className="w-10 h-10 object-contain" />
                  )}
                </div>

                {/* Badge de Nivel */}
                <div className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-amber-400 text-black text-[9px] font-black font-mono shadow-md">
                  Lv.{hero.level}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <img src={getZodiacIcon(heroSign)} alt="" className="w-3 h-3 object-contain inline-block" />
                    Progreso RPG
                  </span>
                  <span className="text-xs text-gray-400 font-light truncate max-w-[120px]">
                    {heroClass.title}
                  </span>
                </div>
                <h4 className="mystic-font text-base text-white font-bold group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  {hero.name} <span className="text-amber-400 font-mono text-xs">({heroSign})</span>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div className="hidden sm:block">
                <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                  <Coins size={12} className="text-amber-400" /> Polvo Estelar
                </div>
                <div className="text-sm font-bold text-amber-300 font-mono">
                  {hero.polvoEstelar || 0} ✦
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-amber-500 group-hover:text-black transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* 1. Barra de Progreso de Experiencia (EXP) */}
          <div className="space-y-1 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-300 font-medium flex items-center gap-1">
                <Zap size={13} className="text-cyan-400" /> Experiencia Astral (Nivel {hero.level})
              </span>
              <span className="text-cyan-300 font-mono font-bold">
                {hero.exp} / {hero.expNext} EXP ({expPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                style={{ width: `${expPercent}%` }}
              />
            </div>
          </div>

          {/* 2. Barra de Progreso de las 12 Casas */}
          <div className="space-y-1 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-300 font-medium flex items-center gap-1">
                <Trophy size={13} className="text-amber-400" /> Casas Purificadas
              </span>
              <span className="text-amber-300 font-mono font-bold">
                {hero.maxHouseCleared || 0} de 12 ({housesPercent}%)
              </span>
            </div>
            {/* Indicador de 12 nodos estelares */}
            <div className="grid grid-cols-12 gap-1 h-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(houseNum => (
                <div 
                  key={houseNum}
                  className={`rounded-full transition-all ${
                    houseNum <= (hero.maxHouseCleared || 0)
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                      : 'bg-white/10'
                  }`}
                  title={`Casa ${houseNum}`}
                />
              ))}
            </div>
          </div>

          <div className="mt-3.5 pt-2 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-400">
              {hero.maxHouseCleared >= 12 
                ? '¡Has conquistado todo el Zodíaco!' 
                : `Siguiente reto: Casa ${(hero.maxHouseCleared || 0) + 1}`}
            </span>
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Continuar Aventura <ChevronRight size={13} />
            </span>
          </div>
        </div>
      )}

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
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 p-1 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/20 relative">
                {isValidImageUrl(hero?.avatarUrl) ? (
                  <img 
                    src={hero.avatarUrl} 
                    alt="" 
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getZodiacIcon(heroSign);
                      e.currentTarget.className = "w-10 h-10 object-contain";
                    }}
                  />
                ) : (
                  <img src={getZodiacIcon(heroSign)} alt="" className="w-10 h-10 object-contain" />
                )}
              </div>
              <h4 className="mystic-font text-xl text-white font-bold mb-2 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                CHRONICLES OF THE ZODIA
              </h4>
              <p className="text-xs text-gray-300 font-light leading-relaxed mb-4">
                RPG táctico por turnos. Encarna el héroe de tu signo zodiacal, conquista las 12 Casas, forja reliquias cósmicas y desata ataques de sinastría en pareja.
              </p>

              {/* Barra de progreso rápida dentro de la tarjeta */}
              {hero && (
                <div className="mb-4 p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-300">
                    <span>Nivel {hero.level} ({heroSign})</span>
                    <span className="text-amber-300 font-mono font-bold">{hero.maxHouseCleared || 0}/12 Casas</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      style={{ width: `${housesPercent}%` }}
                    />
                  </div>
                </div>
              )}
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

