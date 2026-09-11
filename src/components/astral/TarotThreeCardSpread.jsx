"use client";
import React, { useState, useMemo } from 'react';
import { 
  Sparkles, RotateCw, Eye, Share2, Check, ArrowRight, Star, 
  HelpCircle, Compass, Shield, Flame 
} from 'lucide-react';
import { TAROT_CARDS } from '../../lib/astrology';
import { playSwipeLikeSound, playMatchCelebrationSound, triggerHaptic } from '../../lib/sound-effects';

export function TarotThreeCardSpread({ profile, onShareToFeed }) {
  const [spreadCards, setSpreadCards] = useState(null);
  const [revealedState, setRevealedState] = useState([false, false, false]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Posiciones de la Tirada
  const SPREAD_POSITIONS = [
    { title: "1. La Raíz (Pasado)", subtitle: "De dónde viene tu energía", icon: "🌱" },
    { title: "2. El Foco (Presente)", subtitle: "El momento actual y tu desafío", icon: "⚡" },
    { title: "3. El Éter (Futuro)", subtitle: "Hacia dónde se expande tu vibración", icon: "🌌" }
  ];

  const handleDrawCards = () => {
    setIsShuffling(true);
    triggerHaptic('medium');
    playSwipeLikeSound();

    setTimeout(() => {
      // Mezclar aleatoriamente 3 cartas sin repetición
      const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
      const chosen = [shuffled[0], shuffled[1], shuffled[2]];
      setSpreadCards(chosen);
      setRevealedState([false, false, false]);
      setIsShuffling(false);
    }, 600);
  };

  const handleRevealOne = (index) => {
    if (!spreadCards || revealedState[index]) return;
    triggerHaptic('light');
    playSwipeLikeSound();

    const next = [...revealedState];
    next[index] = true;
    setRevealedState(next);

    // Si con esta se revelan todas las cartas
    if (next.every(Boolean)) {
      setTimeout(() => {
        playMatchCelebrationSound();
        triggerHaptic('celebration');
      }, 400);
    }
  };

  const allRevealed = revealedState.every(Boolean);

  const handleCopyOrShare = () => {
    if (!spreadCards || !allRevealed) return;
    const text = `✨ Mi Tirada Astral de 3 Cartas en Zodia:
🌱 Pasado: ${spreadCards[0].name} (${spreadCards[0].keyword})
⚡ Presente: ${spreadCards[1].name} (${spreadCards[1].keyword})
🌌 Futuro: ${spreadCards[2].name} (${spreadCards[2].keyword})`;

    if (onShareToFeed) {
      onShareToFeed(text);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Cabecera */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/50 via-[#140b2b] to-black/80 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h3 className="mystic-font text-base sm:text-lg font-bold text-white">
                Tirada de 3 Cartas: Pasado, Presente & Futuro
              </h3>
              <p className="text-[11px] text-gray-300 font-light">
                Consulta el flujo de tu destino. Toca cada carta para desvelar su Arcano Mayor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!spreadCards ? (
        /* ESTADO INICIAL: TAPÍZ PARA BARAJAR */
        <div className="glass-panel p-8 text-center rounded-3xl border border-white/10 bg-black/60 shadow-xl space-y-4">
          <div className="relative w-24 h-36 mx-auto flex items-center justify-center cursor-pointer group" onClick={handleDrawCards}>
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500" />
            <div className="relative w-full h-full rounded-2xl border border-purple-400/50 bg-[#0c0822] flex flex-col items-center justify-center shadow-2xl p-2 group-hover:scale-105 transition-transform">
              <Star size={24} className="text-amber-400 animate-pulse mb-1" />
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">Mazo Sagrado</span>
              <span className="text-[9px] text-gray-400 font-mono">22 Arcanos</span>
            </div>
          </div>

          <p className="text-xs text-gray-300 max-w-sm mx-auto font-light leading-relaxed">
            Concéntrate en tu pregunta o en la energía que deseas comprender hoy y corta la baraja.
          </p>

          <button
            type="button"
            onClick={handleDrawCards}
            disabled={isShuffling}
            className="btn-mystic px-6 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            {isShuffling ? (
              <>
                <RotateCw size={14} className="animate-spin" />
                <span>Barajando el éter...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Cortar Baraja & Tirar Cartas</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* TAPÍZ DE LAS 3 CARTAS */
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {spreadCards.map((card, idx) => {
              const pos = SPREAD_POSITIONS[idx];
              const isRevealed = revealedState[idx];

              return (
                <div
                  key={idx}
                  onClick={() => handleRevealOne(idx)}
                  className={`glass-panel p-4 rounded-3xl border transition-all duration-500 cursor-pointer text-center relative overflow-hidden flex flex-col justify-between min-h-[260px] ${
                    isRevealed
                      ? 'border-cyan-400/40 bg-gradient-to-b from-[#080d2a] via-[#05081c] to-black shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                      : 'border-purple-500/30 bg-[#0a071c]/90 hover:border-purple-400 hover:scale-[1.02] shadow-lg'
                  }`}
                >
                  {/* Etiqueta de Posición */}
                  <div className="space-y-0.5 mb-2">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center justify-center gap-1">
                      <span>{pos.icon}</span> {pos.title}
                    </span>
                    <span className="text-[9px] text-gray-400 block font-light">
                      {pos.subtitle}
                    </span>
                  </div>

                  {!isRevealed ? (
                    /* REVERSO DE LA CARTA */
                    <div className="my-auto py-6 space-y-2 group">
                      <div className="w-14 h-20 mx-auto rounded-xl border border-purple-400/40 bg-gradient-to-tr from-purple-950 via-[#100b2b] to-black flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                        <Sparkles size={20} className="text-amber-400 animate-pulse" />
                      </div>
                      <span className="text-[10px] text-purple-300 font-bold uppercase tracking-widest block">
                        Toca para revelar
                      </span>
                    </div>
                  ) : (
                    /* ANVERSO DE LA CARTA REVELADA */
                    <div className="my-auto space-y-2 animate-fadeIn">
                      <div className="text-3xl">{card.symbol}</div>
                      <h4 className="text-sm font-bold text-white mystic-font">
                        {card.name}
                      </h4>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-bold text-cyan-300">
                        {card.keyword}
                      </span>
                      <p className="text-[11px] text-gray-300 font-light leading-relaxed pt-1">
                        "{card.meaning}"
                      </p>
                    </div>
                  )}

                  <div className="text-[9px] text-gray-500 uppercase tracking-widest pt-2 border-t border-white/5">
                    Arcano Mayor
                  </div>
                </div>
              );
            })}
          </div>

          {/* SÍNTESIS FINAL CUANDO TODAS LAS CARTAS ESTÁN REVELADAS */}
          {allRevealed && (
            <div className="glass-panel p-5 rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-[#0a0f2e] to-black shadow-xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Star size={13} className="text-amber-400" /> Síntesis del Oráculo
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrShare}
                  className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[11px] text-cyan-300 transition flex items-center gap-1"
                >
                  {copiedText ? <Check size={12} /> : <Share2 size={12} />}
                  <span>{copiedText ? 'Copiado' : 'Compartir Tirada'}</span>
                </button>
              </div>

              <p className="text-xs text-gray-200 leading-relaxed font-light">
                Tu lectura muestra una transición desde <strong className="text-white">{spreadCards[0].name}</strong> hacia la energía activa de <strong className="text-cyan-300">{spreadCards[1].name}</strong>, culminando en la vibración de <strong className="text-purple-300">{spreadCards[2].name}</strong>. Medita en esta sincronía para tus decisiones de hoy.
              </p>

              <button
                type="button"
                onClick={handleDrawCards}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-medium transition flex items-center justify-center gap-1.5 border border-white/5"
              >
                <RotateCw size={13} />
                <span>Realizar otra tirada de 3 cartas</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
