"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Moon, Sun, Zap, Compass, Heart, Share2, 
  ChevronDown, ChevronUp, RotateCw, Check, Star, ArrowRight
} from 'lucide-react';
import { getDailyCosmicBarometer } from '../../lib/transits';
import { getDailyTarotCard } from '../../lib/astrology';
import { playSwipeLikeSound, playMatchCelebrationSound } from '../../lib/sound-effects';

export function DailyCosmicCapsule({ profile, currentUser, onNavigateTab, onShareToFeed }) {
  const userSign = profile?.sign || 'Aries';
  const birthDate = profile?.birth_date || profile?.dob || '1998-07-15';
  const userId = profile?.user_id || currentUser?.id || 'sintonizador';

  // Fecha de hoy en formato local YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Barómetro astronómico en tiempo real
  const barometer = useMemo(() => {
    return getDailyCosmicBarometer(userSign, birthDate);
  }, [userSign, birthDate]);

  const {
    vitality,
    moonPhase,
    currentMoonSign,
    currentMoonDegree,
    currentSunSign,
    luckySigns,
    todayFocus,
    todayPlanets
  } = barometer;

  // Planetas clave del cielo hoy
  const venusPlanet = todayPlanets?.find(p => p.id === 'venus');
  const marsPlanet  = todayPlanets?.find(p => p.id === 'mars');

  // Carta del Tarot del Día
  const dailyCard = useMemo(() => {
    return getDailyTarotCard(userId, todayStr);
  }, [userId, todayStr]);

  // Estado de revelación de la carta (guardado en localStorage por día)
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedReveal = localStorage.getItem(`zodia_daily_card_revealed_${userId}_${todayStr}`);
      if (storedReveal === 'true') {
        setIsCardRevealed(true);
      }
    }
  }, [userId, todayStr]);

  const handleRevealCard = () => {
    if (isCardRevealed || isFlipping) return;
    setIsFlipping(true);
    playSwipeLikeSound();

    setTimeout(() => {
      setIsCardRevealed(true);
      setIsFlipping(false);
      playMatchCelebrationSound();
      try {
        localStorage.setItem(`zodia_daily_card_revealed_${userId}_${todayStr}`, 'true');
      } catch {}
    }, 600);
  };

  const handleCopyOrShare = () => {
    const textToShare = `✨ Mi Carta Guía de hoy en Zodia es "${dailyCard.name}" (${dailyCard.symbol} - ${dailyCard.keyword}): "${dailyCard.meaning}". Clima Astral: Luna en ${currentMoonSign} (${moonPhase.phaseName}) con ${vitality}% de Vitalidad.`;

    if (onShareToFeed) {
      onShareToFeed(textToShare);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-[#060a1e]/90 via-[#0a0f2e]/80 to-[#040612]/95 border border-cyan-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.12)] p-4 sm:p-5 relative overflow-hidden transition-all">
      {/* Resplandores ambientales de fondo */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── CABECERA DEL WIDGET ── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Sparkles size={18} className="animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest">
                Tránsitos en Vivo
              </span>
              <span className="px-2 py-0.2 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[9px] font-bold text-cyan-200">
                Hoy
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
              Clima Cósmico & Guía Diaria
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Porcentaje de Vitalidad */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">
            <Zap size={14} className="text-cyan-300 animate-pulse" />
            <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 font-mono">
              {vitality}%
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            title={isExpanded ? 'Plegar' : 'Desplegar'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ── CONTENIDO EXPANDIBLE ── */}
      {isExpanded && (
        <div className="mt-3.5 space-y-3.5 relative z-10 animate-fadeIn">
          
          {/* Barra de progreso de energía vital */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-light">
              <span>Sintonía de <strong className="text-white font-semibold">{userSign}</strong> hoy</span>
              <span className="text-cyan-300 font-mono font-medium">Energía Vital: {vitality}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 shadow-[0_0_10px_#06b6d4] transition-all duration-1000"
                style={{ width: `${vitality}%` }}
              />
            </div>
          </div>

          {/* Grid de 2 columnas: Fase Lunar + Posición Planetaria Clave */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Card Fase Lunar */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-3">
              <div className="text-2xl p-1 bg-black/60 rounded-xl border border-white/10 shadow-inner shrink-0 leading-none">
                {moonPhase.glyph || '🌙'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {moonPhase.phaseName}
                  </h4>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {moonPhase.illumination}% luz
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-light mt-0.5 leading-snug">
                  Luna transitando en <strong className="text-cyan-200 font-medium">{currentMoonSign}</strong> a {currentMoonDegree}°. {moonPhase.energyDescription}.
                </p>
              </div>
            </div>

            {/* 2. Card Venus & Marte */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-300 shrink-0 text-sm">
                💖
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white leading-tight">
                  Venus & Atracción
                </h4>
                <p className="text-[11px] text-gray-300 font-light mt-0.5 leading-snug">
                  Venus en <strong className="text-pink-200 font-medium">{venusPlanet?.sign || 'Tauro'}</strong> activa el deseo auténtico; Marte en <strong className="text-amber-200 font-medium">{marsPlanet?.sign || 'Leo'}</strong> da empuje a tus iniciativas.
                </p>
              </div>
            </div>
          </div>

          {/* ── FOCO / CONSEJO CÓSMICO DEL DÍA ── */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-black/40 to-purple-950/30 border border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                <Compass size={14} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
                  Foco: {todayFocus.title}
                </span>
                <p className="text-xs text-gray-200 font-light leading-snug mt-0.5">
                  {todayFocus.desc}
                </p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('oraculo')}
                className="shrink-0 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
                title="Ver tránsitos completos"
              >
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* ── CARTA GUÍA DIARIA (ARCANO MAYOR DEL DÍA) ── */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-black/60 border border-purple-500/30 relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
                <Star size={12} className="text-amber-400" />
                Tu Arcano Guía del Día
              </span>
              <span className="text-[10px] text-gray-400 font-light">
                {isCardRevealed ? 'Revelado hoy' : 'Toca para descubrir'}
              </span>
            </div>

            {!isCardRevealed ? (
              /* DORSAL DE LA CARTA (NO REVELADA) */
              <div
                onClick={handleRevealCard}
                className={`p-5 rounded-2xl border-2 border-dashed border-purple-400/40 bg-gradient-to-b from-purple-950/40 to-black cursor-pointer text-center group hover:border-purple-400 transition-all shadow-lg ${
                  isFlipping ? 'scale-95 opacity-50 rotate-3' : 'hover:scale-[1.01]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 text-xl mx-auto mb-2 group-hover:scale-110 transition shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  🔮
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-200 transition">
                  {isFlipping ? 'Sintonizando con el éter...' : 'Toca para revelar tu Carta Cósmica de hoy'}
                </h4>
                <p className="text-[11px] text-gray-400 font-light mt-1">
                  Una sola tirada diaria que sella tu dirección evolutiva
                </p>
              </div>
            ) : (
              /* CARTA REVELADA CON DETALLE */
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/50 via-[#0d1024] to-black border border-purple-400/40 shadow-xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-black/60 rounded-xl border border-white/10 shadow-inner">
                      {dailyCard.symbol}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-white mystic-font">
                        {dailyCard.name}
                      </h4>
                      <span className="text-[10px] text-amber-300 font-medium">
                        ✦ {dailyCard.keyword}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyOrShare}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[10px] font-bold flex items-center gap-1.5 transition shadow-sm"
                    title="Compartir o copiar"
                  >
                    {copiedText ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={12} />
                        <span>Compartir</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-200 font-normal leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
                  "{dailyCard.meaning}"
                </p>
              </div>
            )}
          </div>

          {/* Footer de navegación rápida */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
            <span>Afinidad dorada hoy con: <strong className="text-cyan-300 font-medium">{luckySigns?.slice(0, 3).join(', ')}</strong></span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('oraculo')}
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 flex items-center gap-1 transition"
              >
                Ver carta astral completa
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
