"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, MessageCircle, ArrowRight, Heart, Star, X } from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { getZodiacSymbol } from '../../lib/astrology';
import { playMatchCelebrationSound } from '../../lib/sound-effects';

export const MatchCelebrationModal = ({
  matchData, // { candidate, userProfile, userAvatar }
  onClose,
  onStartChat
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    playMatchCelebrationSound();
    // Respuesta háptica en dispositivos compatibles
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate([120, 60, 180]);
    }
  }, []);

  if (!matchData?.candidate || !mounted) return null;
  const { candidate, userProfile, userAvatar } = matchData;

  const candidateSymbol = getZodiacSymbol(candidate.sign);
  const mySymbol = getZodiacSymbol(userProfile?.sign || 'Capricornio');

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn select-none" style={{ margin: 0 }}>
      {/* Fondo de nebulosa animada */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-cyan-500/20 via-purple-500/25 to-pink-500/20 rounded-full blur-[100px] animate-pulseGlow" />
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      <div className="relative w-full max-w-md bg-[#090d1c]/95 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_80px_rgba(6,182,212,0.6)] z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 transition"
        >
          <X size={18} />
        </button>

        {/* Badge Superior */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-widest shadow-inner">
          <Sparkles size={14} className="animate-spin text-amber-400" />
          ¡Resonancia Cósmica!
        </div>

        {/* Título */}
        <div>
          <h2 className="mystic-font text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 font-extrabold tracking-wider">
            ¡HICIERON MATCH!
          </h2>
          <p className="text-xs text-gray-300 mt-2 font-light">
            Las estrellas han alineado tu frecuencia con <span className="text-white font-bold">{candidate.name}</span>.
          </p>
        </div>

        {/* Duelo de Avatares Cósmicos */}
        <div className="flex items-center justify-center gap-3 py-3">
          {/* Avatar del Usuario */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-400 p-1 shadow-[0_0_30px_rgba(6,182,212,0.6)] bg-black">
              <img
                src={typeof userAvatar === 'string' ? userAvatar.replace(/w=\d+/, 'w=1200') : (userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200')}
                alt="Tú"
                className="w-full h-full object-cover object-[center_18%] rounded-full"
              />
            </div>
            <div className="absolute -bottom-2 -left-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs shadow-md">
              {mySymbol}
            </div>
            <span className="text-[11px] font-bold text-gray-300 mt-2 block">Tú</span>
          </div>

          {/* Icono Central de Resonancia */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(236,72,153,0.8)] animate-pulse">
              <Heart size={22} className="fill-white" />
            </div>
            <span className="mt-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-[10px] font-extrabold text-cyan-300">
              {candidate.affinity || '94%'}
            </span>
          </div>

          {/* Avatar del Candidato */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-pink-500 p-1 shadow-[0_0_30px_rgba(236,72,153,0.6)] bg-black">
              <img
                src={candidate.image ? candidate.image.replace(/w=\d+/, 'w=1200') : (candidate.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200')}
                alt={candidate.name}
                className="w-full h-full object-cover object-[center_18%] rounded-full"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-bold text-xs shadow-md">
              {candidateSymbol}
            </div>
            <span className="text-[11px] font-bold text-gray-300 mt-2 block truncate max-w-[90px]">
              {candidate.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Resumen de compatibilidad */}
        <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 text-left space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Sintonía Astral:</span>
            <span className="text-cyan-400 font-bold">{userProfile?.element || 'Tierra'} + {candidate.element}</span>
          </div>
          <p className="text-xs text-gray-200 italic font-light leading-relaxed">
            "{candidate.bio?.slice(0, 90) || 'Buscando almas afines con buena sintonía'}..."
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => onStartChat(candidate)}
            className="btn-mystic w-full py-3.5 rounded-2xl text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-102 transition"
          >
            <MessageCircle size={18} /> Enviar Mensaje Cósmico Ahora
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs tracking-wider transition border border-white/10"
          >
            Seguir Descubriendo Perfiles
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
