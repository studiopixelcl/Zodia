"use client";
import React, { useState } from 'react';
import { 
  Calendar, BookOpen, Heart, Briefcase, Coins, Sparkles, 
  ChevronRight, Compass, Shield, Flame, User, Info, ArrowRight,
  Eye, CheckCircle2, RotateCw
} from 'lucide-react';
import { 
  zodiacData, ZODIAC_SYMBOLS, ZODIAC_COMPREHENSIVE_READINGS,
  TREE_OF_LIFE_SEFIROT, getTemporalForecast, calculateAstralProfile
} from '../../lib/astrology';
import { ZodiacBadge } from './ZodiacBadge';

// Coordenadas SVG precisas de las Sefirot del Árbol de la Vida (viewBox: 0 0 400 540)
const SEFIROT_COORDS = [
  { num: 1,  name: "Kéter",    x: 200, y: 45,  hebrew: "כתר" },
  { num: 2,  name: "Jojmá",    x: 315, y: 105, hebrew: "חכמה" },
  { num: 3,  name: "Biná",     x: 85,  y: 105, hebrew: "בינה" },
  { num: 11, name: "Da'at",    x: 200, y: 155, hebrew: "דעת", isDaat: true },
  { num: 4,  name: "Jésed",    x: 315, y: 210, hebrew: "חסד" },
  { num: 5,  name: "Gevurá",   x: 85,  y: 210, hebrew: "גבורה" },
  { num: 6,  name: "Tiféret",  x: 200, y: 275, hebrew: "תפארת" },
  { num: 7,  name: "Netzaj",   x: 315, y: 375, hebrew: "נצח" },
  { num: 8,  name: "Hod",      x: 85,  y: 375, hebrew: "הוד" },
  { num: 9,  name: "Yesod",    x: 200, y: 435, hebrew: "יסוד" },
  { num: 10, name: "Maljut",   x: 200, y: 505, hebrew: "מלכות" },
];

// Los 22 Senderos conectores del Árbol de la Vida
const TREE_PATHS = [
  [200, 45, 315, 105],  // Keter - Chokmah
  [200, 45, 85, 105],   // Keter - Binah
  [200, 45, 200, 275],  // Keter - Tiferet
  [315, 105, 85, 105],  // Chokmah - Binah
  [315, 105, 315, 210], // Chokmah - Chesed
  [315, 105, 200, 275], // Chokmah - Tiferet
  [85, 105, 85, 210],   // Binah - Gevurah
  [85, 105, 200, 275],  // Binah - Tiferet
  [315, 210, 85, 210],  // Chesed - Gevurah
  [315, 210, 200, 275], // Chesed - Tiferet
  [315, 210, 315, 375], // Chesed - Netzach
  [85, 210, 200, 275],  // Gevurah - Tiferet
  [85, 210, 85, 375],   // Gevurah - Hod
  [200, 275, 315, 375], // Tiferet - Netzach
  [200, 275, 85, 375],  // Tiferet - Hod
  [200, 275, 200, 435], // Tiferet - Yesod
  [315, 375, 85, 375],  // Netzach - Hod
  [315, 375, 200, 435], // Netzach - Yesod
  [315, 375, 200, 505], // Netzach - Malkuth
  [85, 375, 200, 435],  // Hod - Yesod
  [85, 375, 200, 505],  // Hod - Malkuth
  [200, 435, 200, 505]  // Yesod - Malkuth
];

export const TabOraculo = ({ profile }) => {
  // Pestaña principal: 'pronostico' | 'signo' | 'arbol'
  const [mainSection, setMainSection] = useState('pronostico');

  // Período de pronóstico: 'diario' | 'semanal' | 'mensual' | 'anual'
  const [forecastPeriod, setForecastPeriod] = useState('diario');

  // Datos base del perfil activo
  const userSign = profile?.sign || 'Aries';
  const userLifePath = profile?.life_path_number || profile?.lifePath || 1;

  // Signo seleccionado para inspeccionar en la pestaña Signo (permite explorar otros signos)
  const [selectedSign, setSelectedSign] = useState(userSign);

  // Sefirá seleccionada para inspeccionar en el Árbol de la Vida
  const initialSefiraNum = userLifePath > 9 && userLifePath !== 11 && userLifePath !== 22 && userLifePath !== 33 
    ? (userLifePath % 9 || 9) 
    : userLifePath;
  const [inspectedSefira, setInspectedSefira] = useState(initialSefiraNum);

  // Pronóstico calculado
  const forecast = getTemporalForecast(userSign, userLifePath, forecastPeriod);

  // Lectura del signo seleccionado
  const signReading = ZODIAC_COMPREHENSIVE_READINGS[selectedSign] || ZODIAC_COMPREHENSIVE_READINGS.Aries;

  // Información de la Sefirá inspeccionada
  const sefiraData = TREE_OF_LIFE_SEFIROT[inspectedSefira] || TREE_OF_LIFE_SEFIROT[1];

  return (
    <div className="space-y-6 animate-fadeIn pb-20 px-3 sm:px-4 max-w-2xl mx-auto">
      
      {/* ── CABECERA EDITORIAL Y SELECTOR DE SECCIÓN SOBRIA ── */}
      <div className="card-clean p-4 sm:p-5 text-center">
        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">
          Bitácora de Autoconocimiento
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Lecturas & Sabiduría
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
          Guía reflexiva sobre tu signo, ciclos temporales y correspondencia numerológica en el Árbol de la Vida.
        </p>

        {/* Pestañas de navegación interna */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/[0.08] mt-4 max-w-md mx-auto">
          <button
            onClick={() => setMainSection('pronostico')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mainSection === 'pronostico' 
                ? 'bg-sky-500 text-black font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={13} />
            Pronóstico
          </button>
          <button
            onClick={() => setMainSection('signo')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mainSection === 'signo' 
                ? 'bg-sky-500 text-black font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={13} />
            Tu Signo
          </button>
          <button
            onClick={() => setMainSection('arbol')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mainSection === 'arbol' 
                ? 'bg-sky-500 text-black font-bold shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen size={13} />
            Árbol de la Vida
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── 1. SECCIÓN: PRONÓSTICO TEMPORAL (DIARIO / SEMANAL / MES / AÑO) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainSection === 'pronostico' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Selector de escala de tiempo */}
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/[0.06] overflow-x-auto">
            {[
              { id: 'diario',  label: 'Diario' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'mensual', label: 'Mensual' },
              { id: 'anual',   label: 'Anual' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setForecastPeriod(p.id)}
                className={`flex-1 min-w-[70px] py-1.5 px-3 rounded-lg text-xs font-medium transition-all text-center ${
                  forecastPeriod === p.id 
                    ? 'bg-white/10 text-white font-bold border border-sky-400/40 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Banner de Contexto del Período */}
          <div className="glass-panel p-5 rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/[0.05] via-indigo-500/[0.05] to-transparent">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
                {forecast.subtitle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-[10px] font-bold text-sky-300">
                {forecast.timeframe}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Guía para {userSign} • Camino de Vida {userLifePath}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{forecast.data.keyAdvice}"
            </p>
          </div>

          {/* Tarjetas de Ámbitos: Amor, Trabajo, Dinero, Vitalidad */}
          <div className="grid grid-cols-1 gap-3.5">
            
            {/* Amor & Vínculos */}
            <div className="card-clean p-4 sm:p-5 border border-white/[0.06] hover:border-rose-400/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-rose-300">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Heart size={15} className="text-rose-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Amor & Vínculos</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {forecast.data.love}
              </p>
            </div>

            {/* Trabajo & Carrera */}
            <div className="card-clean p-4 sm:p-5 border border-white/[0.06] hover:border-sky-400/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-sky-300">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Briefcase size={15} className="text-sky-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Trabajo & Proyectos</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {forecast.data.work}
              </p>
            </div>

            {/* Dinero & Finanzas */}
            <div className="card-clean p-4 sm:p-5 border border-white/[0.06] hover:border-amber-400/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-amber-300">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Coins size={15} className="text-amber-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Dinero & Prosperidad</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {forecast.data.money}
              </p>
            </div>

            {/* Bienestar & Energía */}
            <div className="card-clean p-4 sm:p-5 border border-white/[0.06] hover:border-emerald-400/30 transition-all">
              <div className="flex items-center gap-2 mb-2 text-emerald-300">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Compass size={15} className="text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white">Energía & Bienestar</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {forecast.data.energy}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── 2. SECCIÓN: ENCICLOPEDIA EXHAUSTIVA DEL SIGNO ZODIACAL ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainSection === 'signo' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Selector horizontal de los 12 signos */}
          <div className="card-clean p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1">
              Explorar Signos Zodiacales:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {zodiacData.slice(0, 12).map((item) => {
                const isSelected = selectedSign === item.sign;
                const isUserSign = userSign === item.sign;
                return (
                  <button
                    key={item.sign}
                    onClick={() => setSelectedSign(item.sign)}
                    className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs transition-all ${
                      isSelected
                        ? 'bg-sky-500 text-black font-bold shadow-sm'
                        : 'bg-black/40 text-slate-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.05]'
                    }`}
                  >
                    <span>{ZODIAC_SYMBOLS[item.sign]}</span>
                    <span>{item.sign}</span>
                    {isUserSign && <span className="text-[9px] text-amber-300 font-bold">•</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarjeta de Encabezado del Signo */}
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] text-center relative overflow-hidden">
            <div className="flex flex-col items-center justify-center">
              <ZodiacBadge sign={selectedSign} size="xl" className="mb-3" />
              <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{selectedSign}</span>
                <span className="text-sky-400 text-lg">{ZODIAC_SYMBOLS[selectedSign]}</span>
              </h3>
              <p className="text-xs text-sky-300 font-medium mt-1">
                {selectedSign === userSign ? '★ Tu Signo Solar Natal' : 'Lectura de Signo'}
              </p>
            </div>

            {/* Ficha técnica del signo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/[0.08] text-left">
              <div className="p-2 rounded-xl bg-black/30">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Elemento</span>
                <span className="text-xs font-bold text-amber-300">
                  {zodiacData.find(z => z.sign === selectedSign)?.element || 'Astros'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/30">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Luz Principal</span>
                <span className="text-xs font-bold text-sky-300 truncate block">
                  {zodiacData.find(z => z.sign === selectedSign)?.luz.split(',')[0] || 'Claridad'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/30">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Sombra a Observar</span>
                <span className="text-xs font-bold text-rose-300 truncate block">
                  {zodiacData.find(z => z.sign === selectedSign)?.sombra.split(',')[0] || 'Atención'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/30">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Polaridad</span>
                <span className="text-xs font-bold text-slate-200">
                  {['Fuego', 'Aire'].includes(zodiacData.find(z => z.sign === selectedSign)?.element) ? 'Emisora (+)' : 'Receptiva (-)'}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose Exhaustivo: Psicología, Amor, Trabajo, Dinero, Sombra */}
          <div className="space-y-3.5">
            
            {/* Psicología & Visión de Mundo */}
            <div className="card-clean p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-sm">
                <Compass size={16} />
                <span>Psicología y Dinámica de Pensamiento</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {signReading.psychology}
              </p>
            </div>

            {/* Amor, Citas y Relaciones */}
            <div className="card-clean p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2 text-rose-400 font-bold text-sm">
                <Heart size={16} />
                <span>En el Amor, Citas y Pareja</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {signReading.love}
              </p>
            </div>

            {/* Profesión, Trabajo y Vocación */}
            <div className="card-clean p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2 text-sky-400 font-bold text-sm">
                <Briefcase size={16} />
                <span>En el Trabajo, Profesión y Liderazgo</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {signReading.work}
              </p>
            </div>

            {/* Dinero y Manejo Financiero */}
            <div className="card-clean p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm">
                <Coins size={16} />
                <span>En el Dinero, Ahorro e Inversión</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {signReading.money}
              </p>
            </div>

            {/* Trabajo de Sombra y Madurez */}
            <div className="card-clean p-5 border border-indigo-500/20 bg-indigo-500/[0.03]">
              <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-sm">
                <Shield size={16} />
                <span>Reto de Crecimiento & Trabajo de Sombra</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {signReading.shadowWork}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── 3. SECCIÓN: NUMEROLOGÍA & EL ÁRBOL DE LA VIDA (SEFIROT) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {mainSection === 'arbol' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Tarjeta de Resumen Numerológico del Usuario */}
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
              Numerología Cabalística
            </span>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-3xl font-extrabold text-amber-400 my-2">
              {userLifePath}
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              {TREE_OF_LIFE_SEFIROT[userLifePath]?.title || `Camino de Vida ${userLifePath}`}
            </h3>
            <p className="text-xs text-sky-300 font-medium mt-1">
              Sefirá regente en tu mapa: <span className="font-bold underline">{TREE_OF_LIFE_SEFIROT[userLifePath]?.sefira}</span> ({TREE_OF_LIFE_SEFIROT[userLifePath]?.hebrew})
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
              {TREE_OF_LIFE_SEFIROT[userLifePath]?.pillar}
            </p>
          </div>

          {/* Diagrama Interactivo SVG del Árbol de la Vida */}
          <div className="card-clean p-4 sm:p-6 text-center border border-white/[0.08] relative">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-white">Mapa del Árbol de la Vida</span>
              <span className="text-[10px] text-slate-400">Pulsa cualquier esfera para leer</span>
            </div>

            <div className="relative w-full max-w-[320px] sm:max-w-[380px] mx-auto bg-black/40 rounded-2xl p-4 border border-white/[0.05]">
              <svg viewBox="0 0 400 540" className="w-full h-auto select-none">
                <defs>
                  <filter id="sefiraGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>

                {/* 22 Senderos conectores */}
                {TREE_PATHS.map(([x1, y1, x2, y2], idx) => (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="2"
                    strokeDasharray={idx % 3 === 0 ? "4 4" : "none"}
                  />
                ))}

                {/* 10 Sefirot (+ Da'at) interactivas */}
                {SEFIROT_COORDS.map((sefira) => {
                  const isUserActive = sefira.num === userLifePath || (sefira.num === 10 && userLifePath === 9);
                  const isCurrentInspected = sefira.num === inspectedSefira;
                  const radius = sefira.isDaat ? 18 : 23;

                  return (
                    <g
                      key={sefira.num}
                      onClick={() => setInspectedSefira(sefira.num)}
                      className="cursor-pointer transition-transform duration-300 hover:scale-110"
                      style={{ transformOrigin: `${sefira.x}px ${sefira.y}px` }}
                    >
                      {/* Aura pulsante si es la Sefirá activa del usuario */}
                      {isUserActive && (
                        <circle
                          cx={sefira.x}
                          cy={sefira.y}
                          r={radius + 8}
                          fill="none"
                          stroke="url(#activeGrad)"
                          strokeWidth="2"
                          opacity="0.7"
                          className="animate-pulse"
                          filter="url(#sefiraGlow)"
                        />
                      )}

                      {/* Esfera base */}
                      <circle
                        cx={sefira.x}
                        cy={sefira.y}
                        r={radius}
                        fill={isCurrentInspected ? "#1e293b" : "#0c0e1a"}
                        stroke={isCurrentInspected ? "#38BDF8" : isUserActive ? "#F59E0B" : "rgba(255,255,255,0.25)"}
                        strokeWidth={isCurrentInspected ? 2.5 : 1.5}
                      />

                      {/* Letra hebrea o número */}
                      <text
                        x={sefira.x}
                        y={sefira.y - 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrentInspected ? "#38BDF8" : isUserActive ? "#F59E0B" : "#F8FAFC"}
                        fontSize={sefira.isDaat ? "10" : "12"}
                        fontWeight="bold"
                        fontFamily="serif"
                      >
                        {sefira.hebrew}
                      </text>

                      {/* Nombre latino de la Sefirá */}
                      <text
                        x={sefira.x}
                        y={sefira.y + 11}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isCurrentInspected ? "#FFFFFF" : "rgba(255,255,255,0.6)"}
                        fontSize="8"
                        fontWeight="600"
                        letterSpacing="0.05em"
                      >
                        {sefira.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Leyenda del gráfico */}
              <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-white/[0.06] text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-400/20 inline-block" />
                  Tu Sefirá Natal
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-sky-400 bg-sky-400/20 inline-block" />
                  Seleccionada
                </span>
              </div>
            </div>
          </div>

          {/* Ficha Detallada de la Sefirá Inspeccionada */}
          <div className="glass-panel p-6 rounded-3xl border border-sky-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[10px] text-sky-400 uppercase tracking-widest font-bold block">
                  {sefiraData.pillar}
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{sefiraData.sefira} ({sefiraData.hebrew})</span>
                  <span className="text-sm font-normal text-slate-400">— {sefiraData.title}</span>
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
                Nº {inspectedSefira}
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {sefiraData.meaning}
            </p>

            {/* Bloques de la Sefirá en la vida real */}
            <div className="grid grid-cols-1 gap-3 pt-2">
              
              {/* Misión de Alma */}
              <div className="card-clean p-4 border border-white/[0.06]">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Misión de Alma & Propósito
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sefiraData.soulMission}
                </p>
              </div>

              {/* En el Amor */}
              <div className="card-clean p-4 border border-white/[0.06]">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  En el Amor & Relaciones Afectivas
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sefiraData.love}
                </p>
              </div>

              {/* En el Trabajo */}
              <div className="card-clean p-4 border border-white/[0.06]">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  En el Trabajo & Profesión
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sefiraData.work}
                </p>
              </div>

              {/* En el Dinero */}
              <div className="card-clean p-4 border border-white/[0.06]">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  En el Dinero & Prosperidad
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {sefiraData.money}
                </p>
              </div>

              {/* Rectificación Kármica (Tikún) */}
              <div className="card-clean p-4 border border-indigo-500/30 bg-indigo-500/[0.04]">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                  Tikún (Aprendizaje Kármico & Rectificación)
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{sefiraData.tikun}"
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
