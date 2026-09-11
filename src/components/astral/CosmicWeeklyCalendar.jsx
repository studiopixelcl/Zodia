"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Sparkles, Moon, Sun, Clock, ChevronLeft, 
  ChevronRight, Compass, Heart, Zap, Star, Shield, ArrowRight, 
  CheckCircle2, Flame, Droplets, Wind, Mountain
} from 'lucide-react';
import { calculatePlanetaryPositions, calculateMoonPhase, ZODIAC_SIGNS } from '../../lib/transits';
import { playSwipeLikeSound, triggerHaptic } from '../../lib/sound-effects';

// Nombres de los días y planetas regentes clásicos
const DAY_RULERS = [
  { day: 'Domingo',   ruler: 'Sol',       glyph: '☉', icon: '☀️', theme: 'Vitalidad, brillo auténtico y recarga solar.' },
  { day: 'Lunes',     ruler: 'Luna',      glyph: '☽', icon: '🌙', theme: 'Emociones, receptividad, intuición y descanso.' },
  { day: 'Martes',    ruler: 'Marte',     glyph: '♂', icon: '🔥', theme: 'Iniciativa, valentía, acción y superación.' },
  { day: 'Miércoles', ruler: 'Mercurio',  glyph: '☿', icon: '💨', theme: 'Comunicación, ideas, aprendizaje y negocios.' },
  { day: 'Jueves',    ruler: 'Júpiter',   glyph: '♃', icon: '✨', theme: 'Expansión, abundancia, optimismo y sabiduría.' },
  { day: 'Viernes',   ruler: 'Venus',     glyph: '♀', icon: '💖', theme: 'Amor, magnetismo, belleza y armonía en vínculos.' },
  { day: 'Sábado',    ruler: 'Saturno',   glyph: '♄', icon: '🪐', theme: 'Estructura, disciplina, límites y orden.' }
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function CosmicWeeklyCalendar({ profile }) {
  const userSign = profile?.sign || 'Aries';

  // Reloj en tiempo real
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [calendarView, setCalendarView] = useState('week'); // 'week' | 'month'

  // Estado para la navegación del mes
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  // Actualizar hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Datos del día en que nos encontramos (HOY)
  const todayInfo = useMemo(() => {
    const now = currentTime;
    const dayOfWeekIdx = now.getDay();
    const rulerInfo = DAY_RULERS[dayOfWeekIdx];

    const planets = calculatePlanetaryPositions(now);
    const moonPhase = calculateMoonPhase(now);
    const moonPlanet = planets.find(p => p.id === 'moon');
    const sunPlanet = planets.find(p => p.id === 'sun');

    const dayHash = (now.getFullYear() * 365 + now.getMonth() * 31 + now.getDate());
    const signIndex = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === userSign.toLowerCase());
    const vitality = 70 + ((dayHash * 19 + (signIndex >= 0 ? signIndex * 7 : 10)) % 28);

    const dateFormatted = now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      dateFormatted: dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1),
      rulerInfo,
      moonPhase,
      currentMoonSign: moonPlanet?.sign || 'Cáncer',
      currentMoonDegree: moonPlanet?.degreeInSign || 12,
      currentSunSign: sunPlanet?.sign || 'Virgo',
      vitality
    };
  }, [currentTime, userSign]);

  // Cálculo de los próximos 7 días ("Lo que viene para esta semana")
  const weeklyForecast = useMemo(() => {
    const days = [];
    const baseDate = new Date();

    const FOCUS_ADVICES = [
      { focus: "Magnetismo & Vínculos", icon: "💖", tag: "Romance", advice: "Tu palabra seduce y abre puertas. Excelente día para conversaciones de corazón." },
      { focus: "Iniciativa & Proyectos", icon: "🔥", tag: "Acción", advice: "La alineación te impulsa a dar el paso audaz que venías postergando." },
      { focus: "Calma & Restauración", icon: "🌿", tag: "Bienestar", advice: "Momento propicio para desconectar del ruido, meditar y nutrir tu paz interior." },
      { focus: "Claridad Intelectual", icon: "💨", tag: "Enfoque", advice: "Mente ágil para resolver acertijos, planificar metas y negociar acuerdos." },
      { focus: "Intuición & Misticismo", icon: "🔮", tag: "Espiritual", advice: "Tus sueños y corazonadas traen mensajes clave. Confía en lo que sientes antes de dudar." },
      { focus: "Creatividad & Brillo", icon: "✨", tag: "Expansión", advice: "Tu campo áurico está magnético. Comparte tus talentos y celebra tus logros." },
      { focus: "Estructura & Raíces", icon: "🌱", tag: "Orden", advice: "Aterriza tus ideas en planes tangibles. El esfuerzo de hoy rinde frutos duraderos." }
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const dayIdx = d.getDay();
      const ruler = DAY_RULERS[dayIdx];
      const planets = calculatePlanetaryPositions(d);
      const moonPhase = calculateMoonPhase(d);
      const moonP = planets.find(p => p.id === 'moon');
      const sunP = planets.find(p => p.id === 'sun');

      const dHash = (d.getFullYear() * 365 + d.getMonth() * 31 + d.getDate());
      const signIndex = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === userSign.toLowerCase());
      const vitality = 72 + ((dHash * 13 + (signIndex >= 0 ? signIndex * 8 : 14)) % 26);
      const adviceItem = FOCUS_ADVICES[(dHash + i) % FOCUS_ADVICES.length];

      const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString('es-ES', { month: 'short' });

      days.push({
        isToday: i === 0,
        dayOffset: i,
        date: d,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        dayNum,
        monthShort,
        ruler,
        moonPhase,
        moonSign: moonP?.sign || 'Leo',
        moonElement: moonP?.element || 'Fuego',
        sunSign: sunP?.sign || 'Virgo',
        vitality,
        advice: adviceItem
      });
    }

    return days;
  }, [userSign]);

  // Cuadrícula del Calendario Mensual
  const monthCalendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const cells = [];

    // Días vacíos previos
    for (let i = 0; i < startDay; i++) {
      cells.push({ empty: true, key: `empty-${i}` });
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const moonPhase = calculateMoonPhase(dateObj);
      const planets = calculatePlanetaryPositions(dateObj);
      const moonP = planets.find(p => p.id === 'moon');

      const isToday = isCurrentMonth && d === todayDate;

      cells.push({
        empty: false,
        day: d,
        date: dateObj,
        isToday,
        moonPhase,
        moonSign: moonP?.sign || 'Aries',
        key: `day-${d}`
      });
    }

    return cells;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* ── 1. EL DÍA EN QUE NOS ENCONTRAMOS (HOY EN TIEMPO REAL) ── */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#060a1e]/90 via-[#0a0f2e]/80 to-[#040612]/95 shadow-[0_0_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 border-b border-white/10 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-extrabold uppercase tracking-widest text-cyan-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Hoy en Tiempo Real
              </span>
              <div className="flex items-center gap-1 text-gray-400 text-xs font-mono">
                <Clock size={12} className="text-cyan-400" />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1.5">
              {todayInfo.dateFormatted}
            </h3>
            <p className="text-xs text-slate-300 font-light mt-0.5 flex items-center gap-1.5">
              <span>{todayInfo.rulerInfo.icon}</span>
              <span>Día regido por <strong className="text-white font-semibold">{todayInfo.rulerInfo.ruler} ({todayInfo.rulerInfo.glyph})</strong>: {todayInfo.rulerInfo.theme}</span>
            </p>
          </div>

          {/* Barómetro de Energía Vital de Hoy */}
          <div className="flex items-center gap-3 bg-black/50 px-3.5 py-2 rounded-2xl border border-white/10 self-end sm:self-center shadow-inner">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Vitalidad Astral</span>
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300 font-mono">
                {todayInfo.vitality}%
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Zap size={18} className="animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tránsitos Clave de Hoy */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3.5 relative z-10">
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
            <div className="text-2xl">{todayInfo.moonPhase.glyph}</div>
            <div className="min-w-0">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Fase Lunar</span>
              <span className="text-xs font-bold text-white truncate block">{todayInfo.moonPhase.phaseName}</span>
              <span className="text-[10px] text-cyan-300 font-mono">{todayInfo.moonPhase.illumination}% iluminada</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Moon size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Luna en Tránsito</span>
              <span className="text-xs font-bold text-white truncate block">{todayInfo.currentMoonSign}</span>
              <span className="text-[10px] text-purple-300 font-mono">{todayInfo.currentMoonDegree}° en el cielo</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun size={16} className="animate-spin" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block">Tránsito Solar</span>
              <span className="text-xs font-bold text-white truncate block">Sol en {todayInfo.currentSunSign}</span>
              <span className="text-[10px] text-amber-300 font-medium">Temporada activa</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SELECTOR DE VISTA: ESTA SEMANA VS CALENDARIO MENSUAL ── */}
      <div className="flex rounded-2xl bg-black/60 p-1 border border-white/10 max-w-sm mx-auto shadow-md">
        <button
          type="button"
          onClick={() => setCalendarView('week')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            calendarView === 'week'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles size={13} />
          <span>Esta Semana (7 Días)</span>
        </button>

        <button
          type="button"
          onClick={() => setCalendarView('month')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            calendarView === 'month'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CalendarIcon size={13} />
          <span>Mes en Tiempo Real</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VISTA A: LO QUE VIENE PARA ESTA SEMANA (TIMELINE 7 DÍAS) ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {calendarView === 'week' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-400" /> Lo que viene para esta semana
            </h4>
            <span className="text-[10px] text-gray-400 font-light">Próximos 7 días cósmicos</span>
          </div>

          <div className="space-y-2.5">
            {weeklyForecast.map((item) => (
              <div
                key={item.dayNum + item.dayName}
                onClick={() => setSelectedDayDetails(item)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group shadow-md ${
                  item.isToday
                    ? 'border-cyan-400/60 bg-gradient-to-r from-[#0a1236] via-[#09112a] to-black shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-white/10 bg-black/40 hover:border-cyan-500/40 hover:bg-black/60'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Fecha y Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                      item.isToday
                        ? 'bg-cyan-500 text-black border-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-white/[0.04] text-white border-white/10'
                    }`}>
                      <span className="text-xs font-extrabold uppercase leading-none">{item.monthShort}</span>
                      <span className="text-lg font-black font-mono leading-tight">{item.dayNum}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition">
                          {item.dayName} {item.dayNum}
                        </h5>
                        {item.isToday && (
                          <span className="px-2 py-0.2 rounded-full bg-cyan-400 text-black text-[9px] font-black uppercase tracking-wider shadow">
                            ¡HOY!
                          </span>
                        )}
                        <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[9px] font-bold">
                          {item.advice.tag}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 font-light mt-0.5 flex items-center gap-1.5">
                        <span>{item.moonPhase.glyph}</span>
                        <span>Luna en <strong>{item.moonSign}</strong> ({item.moonPhase.phaseName})</span>
                        <span className="hidden xs:inline text-gray-500">•</span>
                        <span className="hidden xs:inline text-gray-400">{item.ruler.glyph} {item.ruler.ruler}</span>
                      </p>
                    </div>
                  </div>

                  {/* Energía Vital del Día */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-extrabold text-cyan-300 block">
                      {item.vitality}%
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase block font-semibold">
                      Vitalidad
                    </span>
                  </div>
                </div>

                {/* Consejo y Foco del Día */}
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-gray-300 font-light">
                  <span className="truncate pr-2">
                    <strong className="text-white font-medium">{item.advice.focus}:</strong> {item.advice.advice}
                  </span>
                  <ChevronRight size={14} className="text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VISTA B: CALENDARIO MENSUAL EN TIEMPO REAL               ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {calendarView === 'month' && (
        <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/10 bg-black/60 shadow-xl space-y-3.5 animate-fadeIn">
          {/* Navegación de Mes */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon size={16} className="text-purple-400" />
              <span>{MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
            </h4>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 transition"
                title="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewDate(new Date())}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 text-[11px] text-cyan-300 font-bold transition"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 transition"
                title="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Días de la Semana (L M X J V S D) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          {/* Cuadrícula de Días */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {monthCalendarDays.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} className="h-14 rounded-xl bg-transparent" />;
              }

              return (
                <div
                  key={cell.key}
                  onClick={() => {
                    const dIdx = cell.date.getDay();
                    const r = DAY_RULERS[dIdx];
                    setSelectedDayDetails({
                      isToday: cell.isToday,
                      date: cell.date,
                      dayName: cell.date.toLocaleDateString('es-ES', { weekday: 'long' }),
                      dayNum: cell.day,
                      monthShort: cell.date.toLocaleDateString('es-ES', { month: 'short' }),
                      ruler: r,
                      moonPhase: cell.moonPhase,
                      moonSign: cell.moonSign,
                      vitality: 75 + (cell.day * 7) % 23,
                      advice: {
                        focus: "Sincronía Celestial",
                        advice: `Tránsito lunar en ${cell.moonSign} con ${cell.moonPhase.phaseName}. Sintoniza con la energía de este día.`
                      }
                    });
                  }}
                  className={`h-14 sm:h-16 p-1 rounded-xl border flex flex-col items-center justify-between cursor-pointer transition-all ${
                    cell.isToday
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : 'border-white/5 bg-black/40 hover:border-purple-500/40 hover:bg-black/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-1">
                    <span className={`text-[10px] sm:text-xs font-bold font-mono ${
                      cell.isToday ? 'text-cyan-300 font-black' : 'text-gray-300'
                    }`}>
                      {cell.day}
                    </span>
                    {cell.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>

                  <span className="text-sm sm:text-base leading-none" title={cell.moonPhase.phaseName}>
                    {cell.moonPhase.glyph}
                  </span>

                  <span className="text-[8px] text-gray-400 truncate max-w-full font-light">
                    {cell.moonSign.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL DETALLES DEL DÍA SELECCIONADO ── */}
      {selectedDayDetails && (
        <div className="p-4 rounded-3xl border border-cyan-400/50 bg-gradient-to-br from-[#0a1033] to-black shadow-2xl animate-fadeIn space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedDayDetails.moonPhase.glyph}</span>
              <div>
                <h5 className="text-sm font-bold text-white">
                  {selectedDayDetails.dayName} {selectedDayDetails.dayNum} de {selectedDayDetails.monthShort}
                </h5>
                <span className="text-[10px] text-cyan-300 font-mono">
                  {selectedDayDetails.isToday ? '¡Hoy!' : 'Pronóstico Astral'} • Regente {selectedDayDetails.ruler.ruler} ({selectedDayDetails.ruler.glyph})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDetails(null)}
              className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
              <span className="text-[9px] text-gray-400 uppercase font-bold">Fase Lunar</span>
              <span className="text-xs font-bold text-white block">{selectedDayDetails.moonPhase.phaseName}</span>
              <span className="text-[10px] text-purple-300">Luna en {selectedDayDetails.moonSign}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
              <span className="text-[9px] text-gray-400 uppercase font-bold">Vitalidad Astral</span>
              <span className="text-xs font-bold text-emerald-400 font-mono block">{selectedDayDetails.vitality}%</span>
              <span className="text-[10px] text-gray-300">{selectedDayDetails.ruler.theme.slice(0, 30)}...</span>
            </div>
          </div>

          <p className="text-xs text-slate-200 font-light leading-relaxed">
            <strong className="text-white font-medium">{selectedDayDetails.advice.focus}:</strong> {selectedDayDetails.advice.advice}
          </p>
        </div>
      )}
    </div>
  );
}
