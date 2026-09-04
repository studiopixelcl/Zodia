"use client";
import React, { useMemo } from 'react';
import { 
  Sparkles, Moon, Sun, Flame, Zap, Heart, Compass, 
  Calendar, CheckCircle2, ArrowRight, Shield, Star
} from 'lucide-react';
import { getDailyCosmicBarometer } from '../../lib/transits';

export const DailyTransits = ({ profile }) => {
  const userSign = profile?.sign || 'Aries';
  const birthDate = profile?.birth_date || profile?.dob || '1998-07-15';

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

  // Planetas clave del día
  const venusPlanet = todayPlanets.find(p => p.id === 'venus');
  const marsPlanet  = todayPlanets.find(p => p.id === 'mars');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* ── 1. BARÓMETRO CÓSMICO DEL DÍA (ENERGÍA VITAL & VIBRACIÓN) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#060a1e] via-[#090e29] to-[#04050d] border border-cyan-500/30 shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
        {/* Glows ambientales */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} className="animate-spin" /> Tránsitos en Tiempo Real
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
              Barómetro Cósmico de Hoy
            </h3>
            <p className="text-xs text-slate-300 font-light mt-0.5">
              Alineación astral calculada para tu sintonía de <strong className="text-white font-semibold">{userSign}</strong>
            </p>
          </div>

          {/* Porcentaje de Energía Cósmica */}
          <div className="flex items-center gap-3 self-end sm:self-center bg-black/40 px-3.5 py-2 rounded-2xl border border-white/10">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Energía Vital
              </span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 font-mono">
                {vitality}%
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Zap size={18} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Barra de Progreso de Sintonía Cósmica */}
        <div className="mt-3 relative z-10">
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shadow-[0_0_12px_#06b6d4] transition-all duration-1000 ease-out"
              style={{ width: `${vitality}%` }}
            />
          </div>
        </div>

        {/* ── FASE LUNAR & TRÁNSITOS CLAVE ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 relative z-10">
          {/* Card Fase Lunar */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="text-3xl shrink-0 p-1 bg-black/40 rounded-xl border border-white/10 shadow-inner">
              {moonPhase.glyph}
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-bold text-white">
                  {moonPhase.phaseName}
                </h4>
                <span className="text-[10px] text-cyan-300 font-mono">
                  {moonPhase.illumination}% luz
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-relaxed">
                Luna transitando en <strong className="text-white font-medium">{currentMoonSign}</strong> a {currentMoonDegree}°. {moonPhase.energyDescription}.
              </p>
            </div>
          </div>

          {/* Card Sol & Magnetismo */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Sun size={20} className="animate-spin" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white">
                Sol en {currentSunSign}
              </h4>
              <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-relaxed">
                Venus en {venusPlanet?.sign || 'Aries'} activa el deseo de autenticidad; Marte en {marsPlanet?.sign || 'Leo'} impulsa iniciativas directas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. FOCO DEL DÍA & RECOMENDACIÓN PRÁCTICA ── */}
      <div className="p-4 rounded-3xl bg-[#070914] border border-white/10 shadow-md flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white shrink-0 shadow-md">
          <Compass size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">
              Foco del Día: {todayFocus.title}
            </h4>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
              Hoy
            </span>
          </div>
          <p className="text-xs text-slate-300 font-light mt-1 leading-relaxed">
            {todayFocus.desc}
          </p>
        </div>
      </div>

      {/* ── 3. SIGNOS EN SINTONÍA DE ORO HOY (COMPATIBILIDAD DIARIA) ── */}
      <div className="p-4 rounded-3xl bg-[#070914] border border-white/10 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-rose-400 fill-rose-400/20" />
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Afinidad Estelar de Hoy
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-light">
            Impulsada por el tránsito de la Luna
          </span>
        </div>

        <p className="text-xs text-slate-300 font-light leading-relaxed mb-3">
          Bajo la vibración celeste actual, tu resonancia cósmica es especialmente armónica y receptiva con personas de:
        </p>

        <div className="flex flex-wrap gap-2">
          {luckySigns.map((sName) => (
            <div
              key={sName}
              className="px-3.5 py-1.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles size={12} className="text-cyan-400" />
              <span>{sName}</span>
              <span className="text-[9px] text-cyan-400/80 font-normal font-mono">+88% hoy</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
