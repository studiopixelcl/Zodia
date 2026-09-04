"use client";
import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Eye, Info, RotateCcw, Compass, Heart, Users,
  Maximize2, ChevronRight, X, Shield, Star
} from 'lucide-react';
import { 
  ZODIAC_SIGNS, PLANETS, HOUSES, ASPECT_TYPES,
  calculatePlanetaryPositions, calculateAspects, calculateSynastry,
  getSignFromDegree, normalizeAngle
} from '../../lib/transits';

// Interpretaciones profundas por Planeta y Signo
const PLANET_INTERPRETATIONS = {
  sun: "Tu núcleo vital, identidad esencial, propósito de vida y la chispa creadora que te mueve.",
  moon: "Tu mundo emocional interno, intuición, necesidades de apego, vulnerabilidad y memoria del alma.",
  mercury: "Tu mente racional, estilo de comunicación, agilidad de pensamiento y percepción.",
  venus: "Tu lenguaje del amor, atracción, magnetismo estético y lo que valoras en un vínculo.",
  mars: "Tu motor de acción, deseo pasional, valentía para conquistar y cómo defiendes tus límites.",
  jupiter: "Tu portal de expansión, optimismo cósmico, abundancia, fe y búsqueda de sentido.",
  saturn: "Tu maestro del tiempo, disciplina, límites constructivos, madurez y legado vital.",
  uranus: "Tu genialidad rebelde, necesidad de libertad, visión innovadora y originalidad.",
  neptune: "Tu conexión espiritual, empatía mística, sueños lúcidos y disolución de fronteras.",
  pluto: "Tu fuerza de regeneración, poder personal, transformación de sombras y renacimiento.",
  asc: "Tu máscara ante el mundo, presencia física, aura inmediata y cómo comienzas nuevas etapas."
};

/**
 * Convierte coordenadas polares (ángulo en grados, radio) a coordenadas cartesianas (x, y)
 * con centro en (cx, cy).
 * 0° = horizontal hacia la derecha, 90° = vertical hacia abajo en SVG estándar.
 * Ajustamos para que 0° comience arriba o en el horizonte izquierdo como es tradicional.
 */
function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const radians = ((angleInDegrees - 180) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

/**
 * Genera el path SVG para un sector de corona circular (anillo entre rInner y rOuter)
 */
function describeArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter   = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner   = polarToCartesian(cx, cy, rInner, startAngle);

  const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", rOuter, rOuter, 0, arcSweep, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", rInner, rInner, 0, arcSweep, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

export const MandalaAstral = ({ profile, partnerProfile = null, isCompact = false }) => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [viewMode, setViewMode] = useState('natal'); // 'natal' | 'sinastria'
  const [highlightAspects, setHighlightAspects] = useState(true);

  // Fecha de nacimiento del usuario
  const birthDate = profile?.birth_date || profile?.dob || '1998-07-15T12:00:00Z';
  const natalPlanets = useMemo(() => calculatePlanetaryPositions(birthDate), [birthDate]);
  const natalAspects = useMemo(() => calculateAspects(natalPlanets), [natalPlanets]);

  // Ascendente como pivote para fijar la Casa I a la izquierda (180°)
  const ascPlanet = natalPlanets.find(p => p.id === 'asc') || natalPlanets[0];
  const chartRotation = normalizeAngle(180 - ascPlanet.deg);

  // Carta de la pareja para modo Sinastría
  const partnerBirth = partnerProfile?.birth_date || partnerProfile?.dob || '1997-11-20T14:30:00Z';
  const partnerPlanets = useMemo(() => calculatePlanetaryPositions(partnerBirth), [partnerBirth]);
  const synastryData = useMemo(() => calculateSynastry(natalPlanets, partnerPlanets), [natalPlanets, partnerPlanets]);

  // Dimensiones SVG
  const cx = 300;
  const cy = 300;
  const rOuterZodiac = 280;
  const rInnerZodiac = 230;
  const rHouses      = 185;
  const rPlanets     = 145;
  const rCore        = 115;

  // Planeta activo o predeterminado para el panel explicativo
  const activePlanet = selectedPlanet || natalPlanets.find(p => p.id === 'sun') || natalPlanets[0];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 select-none">
      {/* ── BARRA SUPERIOR DE MODOS (CARTA NATAL VS SINASTRÍA) ── */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setViewMode('natal'); setSelectedPlanet(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'natal'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass size={14} /> Mandala Natal
          </button>
          <button
            type="button"
            onClick={() => { setViewMode('sinastria'); setSelectedPlanet(null); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'sinastria'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart size={14} /> Sinastría Astral
            {viewMode === 'sinastria' && (
              <span className="px-1.5 py-0.2 text-[9px] bg-white/20 rounded-full font-black">
                {synastryData.score}%
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setHighlightAspects(!highlightAspects)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1 ${
            highlightAspects
              ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
              : 'border-white/10 text-slate-400 hover:text-white'
          }`}
          title="Alternar líneas de aspectos sagrados"
        >
          <Sparkles size={13} /> {highlightAspects ? 'Aspectos ON' : 'Aspectos OFF'}
        </button>
      </div>

      {/* ── MANDALA SVG VECTORIAL ULTRA NITIDO ── */}
      <div className="relative w-full aspect-square max-w-[540px] mx-auto rounded-3xl bg-[#04050d] border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.15)] overflow-hidden flex items-center justify-center p-2">
        {/* Glow de fondo animado */}
        <div className="absolute inset-0 bg-radial from-cyan-950/30 via-transparent to-black pointer-events-none" />

        <svg
          viewBox="0 0 600 600"
          className="w-full h-full transform transition-all duration-700 ease-out"
        >
          <defs>
            {/* Filtros de Resplandor Cósmico */}
            <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#082f49" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
            </radialGradient>
          </defs>

          {/* 1. Centro Cósmico */}
          <circle cx={cx} cy={cy} r={rCore} fill="url(#centerGlow)" stroke="#1e293b" strokeWidth="1" />

          {/* 2. Anillo de los 12 Signos Zodiacales */}
          {ZODIAC_SIGNS.map((sign, idx) => {
            const startAngle = (sign.startDeg + chartRotation) % 360;
            const endAngle   = (startAngle + 30) % 360;
            const midAngle   = (startAngle + 15) % 360;
            const glyphPos   = polarToCartesian(cx, cy, (rOuterZodiac + rInnerZodiac) / 2, midAngle);

            return (
              <g key={sign.name} className="cursor-pointer transition-opacity hover:opacity-100">
                <path
                  d={describeArc(cx, cy, rInnerZodiac, rOuterZodiac, startAngle, startAngle + 29.8)}
                  fill={sign.color}
                  fillOpacity="0.12"
                  stroke={sign.border}
                  strokeWidth="0.8"
                  strokeOpacity="0.5"
                  className="hover:fill-opacity-30 transition-all"
                />
                <text
                  x={glyphPos.x}
                  y={glyphPos.y + 5}
                  textAnchor="middle"
                  fill={sign.color}
                  fontSize="17"
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow-md select-none font-sans"
                >
                  {sign.glyph}
                </text>
              </g>
            );
          })}

          {/* 3. Círculos concéntricos divisores */}
          <circle cx={cx} cy={cy} r={rOuterZodiac} fill="none" stroke="#334155" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={rInnerZodiac} fill="none" stroke="#1e293b" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r={rHouses}      fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={cx} cy={cy} r={rPlanets}     fill="none" stroke="#0f172a" strokeWidth="1" />

          {/* 4. Líneas divisorias de las 12 Casas Astrológicas */}
          {HOUSES.map((house, idx) => {
            const houseAngle = (idx * 30 + 180) % 360;
            const pStart = polarToCartesian(cx, cy, rCore, houseAngle);
            const pEnd   = polarToCartesian(cx, cy, rInnerZodiac, houseAngle);
            const isCardinal = idx === 0 || idx === 3 || idx === 6 || idx === 9;

            // Posición de la numeración de la casa
            const labelPos = polarToCartesian(cx, cy, (rHouses + rPlanets) / 2, houseAngle + 15);

            return (
              <g key={house.num}>
                <line
                  x1={pStart.x}
                  y1={pStart.y}
                  x2={pEnd.x}
                  y2={pEnd.y}
                  stroke={isCardinal ? '#38bdf8' : '#334155'}
                  strokeWidth={isCardinal ? '1.8' : '0.7'}
                  strokeOpacity={isCardinal ? '0.85' : '0.4'}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y + 4}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="600"
                  className="pointer-events-none select-none font-mono"
                >
                  {house.num}
                </text>
              </g>
            );
          })}

          {/* 5. Ejes Cardinales: ASC (Horizonte Izq), DSC (Der), MC (Arriba), IC (Abajo) */}
          <text x={26} y={cy + 4} textAnchor="start" fill="#facc15" fontSize="10" fontWeight="900" className="select-none font-mono">
            ASC
          </text>
          <text x={574} y={cy + 4} textAnchor="end" fill="#facc15" fontSize="10" fontWeight="900" className="select-none font-mono">
            DSC
          </text>
          <text x={cx} y={22} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900" className="select-none font-mono">
            MC
          </text>
          <text x={cx} y={590} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900" className="select-none font-mono">
            IC
          </text>

          {/* 6. Líneas Geométricas de Aspectos Sagrados en el Centro */}
          {highlightAspects && (viewMode === 'natal' ? natalAspects : synastryData.mutualAspects).map((asp, aIdx) => {
            const isSynastry = viewMode === 'sinastria';
            const p1 = isSynastry ? asp.planetA : asp.planet1;
            const p2 = isSynastry ? asp.planetB : asp.planet2;

            const pos1 = polarToCartesian(cx, cy, rCore - 8, p1.deg + chartRotation);
            const pos2 = polarToCartesian(cx, cy, rCore - 8, p2.deg + chartRotation);

            const isHighlighted = selectedPlanet 
              ? (p1.id === selectedPlanet.id || p2.id === selectedPlanet.id)
              : true;

            return (
              <line
                key={aIdx}
                x1={pos1.x}
                y1={pos1.y}
                x2={pos2.x}
                y2={pos2.y}
                stroke={asp.aspect.color}
                strokeWidth={isHighlighted ? '1.5' : '0.5'}
                strokeOpacity={isHighlighted ? (selectedPlanet ? '0.95' : '0.45') : '0.08'}
                strokeDasharray={asp.aspect.stroke === 'dashed' ? '3 3' : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* 7. Planetas Natales (Anillo Interior) */}
          {natalPlanets.map((planet) => {
            const planetAngle = (planet.deg + chartRotation) % 360;
            const pos = polarToCartesian(cx, cy, (rHouses + rPlanets) / 2, planetAngle);
            const isSelected = selectedPlanet?.id === planet.id;

            return (
              <g
                key={planet.id}
                onClick={() => setSelectedPlanet(isSelected ? null : planet)}
                className="cursor-pointer group"
              >
                {/* Aura Resplandeciente en Selección */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="15"
                    fill={planet.color}
                    fillOpacity="0.3"
                    filter="url(#glow-cyan)"
                    className="animate-pulse"
                  />
                )}

                {/* Fondo del Glifo */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  fill="#030712"
                  stroke={isSelected ? '#38bdf8' : planet.color}
                  strokeWidth={isSelected ? '2' : '1.2'}
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Glifo Planetario */}
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fill={planet.color}
                  fontSize={planet.id === 'asc' ? '7' : '11'}
                  fontWeight="bold"
                  className="pointer-events-none select-none font-sans"
                >
                  {planet.glyph}
                </text>
              </g>
            );
          })}

          {/* 8. Planetas de la Pareja en Modo Sinastría (Órbita Externa) */}
          {viewMode === 'sinastria' && partnerPlanets.map((planet) => {
            const planetAngle = (planet.deg + chartRotation) % 360;
            const pos = polarToCartesian(cx, cy, rOuterZodiac - 10, planetAngle);

            return (
              <g key={`partner-${planet.id}`} className="cursor-pointer group">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="8"
                  fill="#2e1065"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                  className="animate-pulse"
                />
                <text
                  x={pos.x}
                  y={pos.y + 3}
                  textAnchor="middle"
                  fill="#f3e8ff"
                  fontSize={planet.id === 'asc' ? '6' : '9'}
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {planet.glyph}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Indicador Central Minimalista */}
        <div className="absolute pointer-events-none text-center">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <span className="text-xs font-bold text-cyan-300 font-mono">
              {viewMode === 'natal' ? activePlanet?.glyph : `${synastryData.score}%`}
            </span>
          </div>
        </div>
      </div>

      {/* ── FICHA INTERACTIVA DE INTERPRETACIÓN DEL PLANETA O SINASTRÍA ── */}
      <div className="p-4 rounded-2xl bg-[#090d1f]/90 border border-white/10 backdrop-blur-xl shadow-lg animate-fadeIn">
        {viewMode === 'natal' ? (
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shadow-sm"
                  style={{ backgroundColor: `${activePlanet.color}20`, color: activePlanet.color, border: `1px solid ${activePlanet.color}40` }}
                >
                  {activePlanet.glyph}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {activePlanet.name} en {activePlanet.sign}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono">
                      {activePlanet.degreeInSign}° {activePlanet.minutes}&apos;
                    </span>
                  </h4>
                  <p className="text-[11px] text-cyan-400 font-medium">
                    {activePlanet.houseName} • {activePlanet.houseTheme}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Elemento
                </span>
                <span className="text-xs font-bold text-white">
                  {activePlanet.element}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-light mt-2.5 leading-relaxed">
              {PLANET_INTERPRETATIONS[activePlanet.id] || "Influencia cósmica activa en tu carta natal."}
            </p>

            {/* Selector Rápido de Planetas en Línea */}
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5 overflow-x-auto no-scrollbar">
              {natalPlanets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanet(p)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                    activePlanet.id === p.id
                      ? 'bg-cyan-500 text-black shadow-sm scale-105'
                      : 'text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{p.glyph}</span>
                  <span className="text-[10px] font-normal">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Heart size={16} className="fill-purple-400/40" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Sinastría Cósmica de Vínculos
                  </h4>
                  <p className="text-[11px] text-slate-400 font-light">
                    Intersección de órbitas astrales y magnetismo mutuo
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
                  {synastryData.score}%
                </span>
                <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-medium">
                  Armonía
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-light leading-relaxed">
              El anillo interior representa tu energía natal, mientras que el anillo violeta exterior muestra las posiciones de tu match. Las líneas geométricas doradas y cian revelan trígonos y conjunciones que facilitan la fluidez afectiva.
            </p>

            {/* Aspectos mutuos destacados */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {synastryData.mutualAspects.slice(0, 4).map((mAsp, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mAsp.aspect.color }} />
                  <div className="truncate">
                    <span className="text-white font-bold">{mAsp.planetA.glyph} {mAsp.aspect.name} {mAsp.planetB.glyph}</span>
                    <span className="block text-[10px] text-slate-400 truncate">{mAsp.aspect.quality}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
