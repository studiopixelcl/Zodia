"use client";
import React, { useState, useRef } from 'react';
import { 
  Sparkles, X, Share2, Download, Copy, Check, Star, 
  Flame, Droplets, Wind, Mountain, ShieldCheck, QrCode, Compass
} from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';
import { getZodiacSymbol } from '../../lib/astrology';
import { triggerHaptic, playMatchCelebrationSound } from '../../lib/sound-effects';

export function CosmicPassportModal({ isOpen, onClose, profile, user }) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const userName = profile?.user_name || user?.name || 'Sintonizador Cósmico';
  const userPhoto = (Array.isArray(profile?.photos) && profile.photos[0]) || profile?.photos || profile?.user_image || user?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
  const userSign = profile?.sign || 'Aries';
  const userElement = profile?.element || 'Fuego';
  const userLifePath = profile?.life_path_number || profile?.lifePath || 7;
  const userArchetype = profile?.archetype || 'El Místico Intuitivo';

  const elementStyles = {
    Fuego: { gradient: 'from-amber-500 via-rose-500 to-orange-600', aura: 'rgba(245,158,11,0.3)', icon: <Flame size={14} className="text-amber-400" /> },
    Tierra: { gradient: 'from-emerald-500 via-teal-600 to-amber-700', aura: 'rgba(16,185,129,0.3)', icon: <Mountain size={14} className="text-emerald-400" /> },
    Aire: { gradient: 'from-cyan-400 via-sky-500 to-blue-600', aura: 'rgba(6,182,212,0.3)', icon: <Wind size={14} className="text-cyan-400" /> },
    Agua: { gradient: 'from-blue-500 via-indigo-600 to-purple-700', aura: 'rgba(99,102,241,0.3)', icon: <Droplets size={14} className="text-indigo-400" /> },
  }[userElement] || { gradient: 'from-cyan-500 to-purple-600', aura: 'rgba(6,182,212,0.3)', icon: <Sparkles size={14} className="text-cyan-400" /> };

  const handleShare = async () => {
    triggerHaptic('medium');
    const shareData = {
      title: `Pasaporte Cósmico de ${userName} en Zodia`,
      text: `✨ Descubre mi ADN astral en Zodia: Signo ${userSign} • Elemento ${userElement} • Sendero ${userLifePath} (${userArchetype}). ¡Sintoniza conmigo!`,
      url: typeof window !== 'undefined' ? window.location.origin : 'https://zodia.lat'
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        // Fallback a portapapeles si el usuario cancela o no soporta
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareData.text} 👉 ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      {/* Contenedor principal */}
      <div className="relative w-full max-w-sm flex flex-col items-center">
        
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-black/60 border border-white/20 text-white hover:bg-white/20 transition shadow-lg z-20"
        >
          <X size={18} />
        </button>

        {/* ── TARJETA PASAPORTE CÓSMICO (Formato 9:16 Holográfico) ── */}
        <div
          ref={cardRef}
          className="w-full rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-[#0c0926] via-[#070517] to-black border border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.3)] relative overflow-hidden space-y-4 select-none"
        >
          {/* Brillos holográficos de fondo */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          
          {/* Patrón de líneas cósmicas */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {/* Cabecera del Pasaporte */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-cyan-400 animate-spin-slow" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-cyan-300">
                Zodia • Pasaporte Cósmico
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-mono font-bold text-gray-300 border border-white/10">
              ORIGEN 9:16
            </span>
          </div>

          {/* Foto de Perfil con Aura Sagrada */}
          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${elementStyles.gradient} blur-md opacity-70 animate-pulse`} />
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/80 p-0.5 bg-black shadow-2xl">
              <img
                src={typeof userPhoto === 'string' ? userPhoto : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600'}
                alt={userName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-black/90 border border-cyan-400 text-cyan-300 shadow">
              {elementStyles.icon}
            </div>
          </div>

          {/* Nombre y Arquetipo */}
          <div className="text-center space-y-1 relative z-10">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center justify-center gap-1.5">
              <span>{userName}</span>
              <ShieldCheck size={16} className="text-cyan-400" />
            </h3>
            <p className="text-xs text-purple-300 font-medium">
              ✦ {userArchetype} ✦
            </p>
          </div>

          {/* Grilla de Tríada Sagrada */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 relative z-10 text-center">
            <div className="p-2 rounded-2xl bg-white/[0.04] border border-white/5 space-y-0.5">
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Signo Solar</span>
              <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                <span>{getZodiacSymbol(userSign)}</span>
                <span>{userSign}</span>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-white/[0.04] border border-white/5 space-y-0.5">
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Elemento</span>
              <div className="text-sm font-bold text-cyan-300">
                {userElement}
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-white/[0.04] border border-white/5 space-y-0.5">
              <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Sendero</span>
              <div className="text-sm font-bold text-amber-300 font-mono">
                #{userLifePath}
              </div>
            </div>
          </div>

          {/* Pie del Pasaporte: Código de Resonancia */}
          <div className="flex items-center justify-between pt-1 relative z-10 text-[10px] text-gray-400 font-mono">
            <div className="flex items-center gap-1.5">
              <QrCode size={16} className="text-cyan-400" />
              <span>ZODIA-ID #{Math.abs(userName.length * 3791) % 99999}</span>
            </div>
            <span className="text-cyan-300 font-semibold">zodia.lat</span>
          </div>
        </div>

        {/* ── BOTONES DE ACCIÓN ── */}
        <div className="flex items-center gap-2.5 w-full mt-3.5">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3 rounded-2xl btn-mystic text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>¡Copiado al portapapeles!</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>Compartir en Stories / Redes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
