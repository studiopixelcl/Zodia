"use client";
import React, { useEffect, useState } from 'react';
import { Moon, Sparkles, Compass, Eye, RotateCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';

export const TabOraculo = ({ profile }) => {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchOraculo = async () => {
      try {
        const res = await apiFetch('/api/oraculo');
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        } else {
          setError('No se pudo establecer sintonía con el oráculo.');
        }
      } catch {
        setError('Fallo en la conexión mística.');
      } finally {
        setLoading(false);
      }
    };
    fetchOraculo();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20 text-cyan-500 animate-pulse uppercase text-xs tracking-widest">
        Consultando la Luna y el Tarot del día...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-6 text-center border border-red-500/20 m-4">
        <p className="text-red-400 text-sm">{error || 'No se pudo conectar con la guía diaria.'}</p>
      </div>
    );
  }

  const { moonPhase, tarotCard, transmission } = data;

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out] px-4">
      {/* ── 1. PANEL DE FASE LUNAR ── */}
      <div className="glass-panel p-6 relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
        
        <div className="inline-block relative mb-3">
          <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse select-none">
            {moonPhase.symbol}
          </span>
        </div>

        <h3 className="mystic-font text-2xl text-white tracking-wider mb-1">
          {moonPhase.name}
        </h3>
        
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-xs font-bold mb-4">
          <Moon size={14} /> {moonPhase.illumination}% de Iluminación
        </div>

        <p className="text-sm text-gray-300 italic max-w-md mx-auto leading-relaxed border-t border-white/5 pt-4">
          "{moonPhase.advice}"
        </p>
      </div>

      {/* ── 2. TAROT DEL DÍA ── */}
      <div className="space-y-3">
        <h3 className="mystic-font text-lg text-white pl-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={18} /> Tarot del Día
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            {isFlipped ? 'Carta Revelada' : 'Haz clic para voltear'}
          </span>
        </h3>

        <div className="perspective-1000 w-full cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
          <div
            className={`relative w-full h-80 transition-transform duration-700 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* REVERSO DE LA CARTA */}
            <div className="absolute inset-0 backface-hidden glass-panel p-6 border-2 border-amber-500/30 rounded-3xl flex flex-col items-center justify-center text-center bg-gradient-to-b from-black/80 via-cyan-950/40 to-black/80 shadow-[0_0_30px_rgba(251,191,36,0.15)] group-hover:border-amber-400/60 transition-all">
              <div className="w-20 h-20 rounded-full border border-amber-400/40 flex items-center justify-center mb-4 bg-black/50 shadow-inner">
                <Eye className="text-amber-400 animate-pulse" size={36} />
              </div>
              <h4 className="mystic-font text-xl text-amber-300 tracking-widest uppercase mb-2">
                Carta del Día
              </h4>
              <p className="text-xs text-gray-400 max-w-xs mb-4">
                Tu carta personalizada para la jornada de hoy.
              </p>
              <div className="btn-mystic px-5 py-2.5 rounded-full text-white text-xs font-bold tracking-widest flex items-center gap-2 shadow-lg">
                <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> REVELAR CARTA
              </div>
            </div>

            {/* FRENTE DE LA CARTA */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 glass-panel p-6 border-2 border-cyan-400/40 rounded-3xl flex flex-col justify-between text-center bg-gradient-to-b from-cyan-950/60 via-black/90 to-purple-950/50 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
              <div className="flex justify-between items-center text-xs text-cyan-400 font-bold uppercase tracking-widest border-b border-cyan-500/20 pb-2">
                <span>Arcano Nº {tarotCard.id}</span>
                <span>{tarotCard.keyword}</span>
              </div>

              <div className="my-auto py-2">
                <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] mb-2 block">
                  {tarotCard.symbol}
                </span>
                <h4 className="mystic-font text-2xl text-white tracking-widest mb-3">
                  {tarotCard.name}
                </h4>
                <p className="text-sm text-cyan-100 leading-relaxed px-4 italic font-light">
                  "{tarotCard.meaning}"
                </p>
              </div>

              <div className="bg-black/50 rounded-xl p-3 border border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Intención Astral de Hoy</span>
                <span className="text-cyan-400 font-semibold uppercase tracking-wider">Activa</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. GUÍA DIARIA PERSONALIZADA ── */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <h4 className="mystic-font text-lg text-white mb-3 flex items-center gap-2">
          <Compass className="text-cyan-400" size={18} /> Guía Diaria Personalizada
        </h4>
        <p className="text-sm text-gray-300 leading-relaxed bg-black/50 p-4 rounded-xl border border-cyan-500/20">
          {transmission}
        </p>
      </div>
    </div>
  );
};
