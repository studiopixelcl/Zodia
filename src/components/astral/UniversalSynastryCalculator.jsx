"use client";
import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Heart, Zap, Shield, Flame, Droplets, Wind, Mountain, 
  Compass, ArrowRight, RotateCcw, Star, Lightbulb, Users, Check, AlertCircle 
} from 'lucide-react';
import { calculateAstralProfile, getZodiacSymbol, calculateResonance, ZODIAC_DETAILS } from '../../lib/astrology';
import { ZodiacBadge } from './ZodiacBadge';
import { playSwipeLikeSound, playMatchCelebrationSound, triggerHaptic } from '../../lib/sound-effects';

const ELEMENT_SYNASTRY_GUIDE = {
  "Fuego-Aire": { title: "Chispa Expansiva & Pasión Intelectual", tag: "Sinergia Dinámica", desc: "El Aire aviva la llama del Fuego con ideas audaces, mientras el Fuego inyecta vitalidad y entusiasmo a la mente del Aire." },
  "Aire-Fuego": { title: "Chispa Expansiva & Pasión Intelectual", tag: "Sinergia Dinámica", desc: "El Aire aviva la llama del Fuego con ideas audaces, mientras el Fuego inyecta vitalidad y entusiasmo a la mente del Aire." },
  "Tierra-Agua": { title: "Alquimia Fértil & Nutricia", tag: "Armonía Sagrada", desc: "La Tierra ofrece raíz y contención segura a las mareas del Agua; el Agua nutre y revitaliza la estructura de la Tierra." },
  "Agua-Tierra": { title: "Alquimia Fértil & Nutricia", tag: "Armonía Sagrada", desc: "La Tierra ofrece raíz y contención segura a las mareas del Agua; el Agua nutre y revitaliza la estructura de la Tierra." },
  "Fuego-Fuego": { title: "Llama Radiante & Pasión Pura", tag: "Fuego Cruzado", desc: "Energía electrizante y complicidad instantánea. Dos espíritus libres que se impulsan a conquistar cumbres sin límite." },
  "Tierra-Tierra": { title: "Estabilidad & Raíz Sagrada", tag: "Construcción Sólida", desc: "Lealtad inquebrantable, placer por lo tangible y proyectos duraderos construidos paso a paso con paciencia." },
  "Aire-Aire": { title: "Danza Mental & Libertad Compartida", tag: "Telepatía Intelectual", desc: "Diálogos que no conocen el fin. Respeto mutuo por la autonomía personal, ideas brillantes y complicidad ligera." },
  "Agua-Agua": { title: "Océano Místico & Telepatía Emocional", tag: "Fusión de Almas", desc: "Conexión psíquica que prescinde de palabras. Empatía tierna, sensibilidad artística y refugio incondicional." },
  "Fuego-Agua": { title: "Vapor Transformador & Alquimia Emocional", tag: "Intensidad Mística", desc: "Gran atracción magnética. El Fuego impulsa al Agua a soñar en grande y el Agua enseña al Fuego la belleza de la ternura." },
  "Agua-Fuego": { title: "Vapor Transformador & Alquimia Emocional", tag: "Intensidad Mística", desc: "Gran atracción magnética. El Fuego impulsa al Agua a soñar en grande y el Agua enseña al Fuego la belleza de la ternura." },
  "Tierra-Aire": { title: "Visión Práctica & Estrategia", tag: "Complemento Útil", desc: "El Aire aporta perspectiva aérea y vanguardia; la Tierra aterriza los conceptos en resultados concretos." },
  "Aire-Tierra": { title: "Visión Práctica & Estrategia", tag: "Complemento Útil", desc: "El Aire aporta perspectiva aérea y vanguardia; la Tierra aterriza los conceptos en resultados concretos." },
  "Fuego-Tierra": { title: "Empuje Volcánico & Realización", tag: "Fuerza Constructiva", desc: "La inspiración del Fuego cobra forma gracias a la persistencia de la Tierra. Una alianza de alto impacto." },
  "Tierra-Fuego": { title: "Empuje Volcánico & Realización", tag: "Fuerza Constructiva", desc: "La inspiración del Fuego cobra forma gracias a la persistencia de la Tierra. Una alianza de alto impacto." }
};

export function UniversalSynastryCalculator({ profile }) {
  const [partnerName, setPartnerName] = useState('');
  const [partnerDob, setPartnerDob] = useState('');
  const [partnerTime, setPartnerTime] = useState('12:00');
  const [relationshipIntent, setRelationshipIntent] = useState('romance'); // 'romance' | 'friendship' | 'creative'
  const [calculatedResult, setCalculatedResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Perfil del usuario activo
  const mySign = profile?.sign || 'Aries';
  const myElement = profile?.element || 'Fuego';
  const myLifePath = profile?.life_path_number || profile?.lifePath || 1;

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!partnerDob) return;

    setIsCalculating(true);
    triggerHaptic('medium');
    playSwipeLikeSound();

    setTimeout(() => {
      try {
        const partnerProfile = calculateAstralProfile(partnerDob, partnerTime || '12:00');
        const pSign = partnerProfile.sign;
        const pElement = partnerProfile.element;
        const pLifePath = partnerProfile.life_path_number || 1;

        // Cálculo de los 4 ejes
        const pairKey = `${myElement}-${pElement}`;
        const guide = ELEMENT_SYNASTRY_GUIDE[pairKey] || ELEMENT_SYNASTRY_GUIDE["Fuego-Aire"];

        // 1. Eje Físico / Pasional (según elementos)
        let physicalScore = (myElement === pElement) ? 90 : (
          (pairKey.includes('Fuego') && pairKey.includes('Aire')) || (pairKey.includes('Tierra') && pairKey.includes('Agua')) ? 94 : 76
        );

        // 2. Eje Emocional (Afinidad lunar y elementos de agua)
        let emotionalScore = (pElement === 'Agua' || myElement === 'Agua') ? 88 : (
          (mySign === pSign) ? 85 : 80
        );

        // 3. Eje Intelectual (Mercurio / Aire y Senderos)
        const pathDiff = Math.abs(myLifePath - pLifePath);
        let intellectualScore = Math.max(70, 95 - (pathDiff * 4));

        // 4. Eje Espiritual & Propósito
        let spiritualScore = (myLifePath === pLifePath) ? 98 : (
          [1, 3, 5, 7, 9].includes(myLifePath) === [1, 3, 5, 7, 9].includes(pLifePath) ? 89 : 82
        );

        const overall = Math.round((physicalScore * 0.3) + (emotionalScore * 0.25) + (intellectualScore * 0.25) + (spiritualScore * 0.2));

        setCalculatedResult({
          partner: {
            name: partnerName.trim() || 'Tu Sintonía',
            sign: pSign,
            element: pElement,
            lifePath: pLifePath,
            archetype: partnerProfile.archetype,
            luz: partnerProfile.luz,
            sombra: partnerProfile.sombra
          },
          scores: {
            overall,
            physical: physicalScore,
            emotional: emotionalScore,
            intellectual: intellectualScore,
            spiritual: spiritualScore
          },
          guide
        });

        playMatchCelebrationSound();
        triggerHaptic('success');
      } catch (err) {
        console.error("Error calculando sinastría libre:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 450);
  };

  const handleReset = () => {
    setCalculatedResult(null);
    setPartnerName('');
    setPartnerDob('');
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Cabecera de la herramienta */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-black/80 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Compass size={20} className="animate-spin" style={{ animationDuration: '10s' }} />
            </div>
            <div>
              <h3 className="mystic-font text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Espejo de Resonancia Libre
              </h3>
              <p className="text-[11px] text-gray-300 font-light">
                Calcula la sinastría de 4 ejes con cualquier persona externa ingresando su fecha de nacimiento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!calculatedResult ? (
        /* FORMULARIO DE CONSULTA */
        <form onSubmit={handleCalculate} className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4 bg-black/60 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Nombre de la Persona (Opcional)
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Ej: Sofía, Mateo, Mi Crush..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-cyan-400 outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                required
                value={partnerDob}
                onChange={(e) => setPartnerDob(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-black/60 border border-cyan-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-300 outline-none transition shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Hora de Nacimiento (Opcional)
              </label>
              <input
                type="time"
                value={partnerTime}
                onChange={(e) => setPartnerTime(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 outline-none transition shadow-inner"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Tipo de Conexión a Evaluar
              </label>
              <select
                value={relationshipIntent}
                onChange={(e) => setRelationshipIntent(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 outline-none transition shadow-inner"
              >
                <option value="romance">💖 Amor & Romance Sagrado</option>
                <option value="friendship">🤝 Amistad & Confianza Cósmica</option>
                <option value="creative">🚀 Creatividad & Proyectos</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={!partnerDob || isCalculating}
            className="w-full py-3 rounded-2xl btn-mystic text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            {isCalculating ? (
              <>
                <Sparkles size={15} className="animate-spin" />
                <span>Sintonizando posiciones astrales...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Revelar Compatibilidad Astral</span>
              </>
            )}
          </button>
        </form>
      ) : (
        /* RESULTADO COMPLETO DE SINASTRÍA */
        <div className="space-y-4 animate-fadeIn">
          {/* Card Principal de Resonancia */}
          <div className="glass-panel p-5 rounded-3xl border border-cyan-400/40 bg-gradient-to-b from-[#080d26] via-[#050716] to-black shadow-2xl relative overflow-hidden text-center space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-bold text-cyan-300 uppercase tracking-wider">
                {profile?.user_name || 'Tú'} ({mySign})
              </span>
              <span className="text-pink-400 font-extrabold text-sm">✦ Sintonía ✦</span>
              <span className="font-bold text-purple-300 uppercase tracking-wider">
                {calculatedResult.partner.name} ({calculatedResult.partner.sign})
              </span>
            </div>

            {/* Círculo de Afinidad Central */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-pink-500 to-purple-600 blur-lg opacity-40 animate-pulse" />
              <div className="w-28 h-28 rounded-full bg-black/90 border-2 border-cyan-400 flex flex-col items-center justify-center relative z-10 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                <span className="text-3xl font-extrabold text-white font-mono leading-none">
                  {calculatedResult.scores.overall}%
                </span>
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest mt-1">
                  Resonancia
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white mystic-font">
                {calculatedResult.guide.title}
              </h4>
              <p className="text-xs text-gray-300 max-w-md mx-auto font-light leading-relaxed">
                {calculatedResult.guide.desc}
              </p>
            </div>

            {/* Desglose de los 4 Ejes Astrales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/20 text-center">
                <Flame size={16} className="mx-auto text-amber-400 mb-1" />
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Física & Pasión</span>
                <span className="text-sm font-mono font-bold text-amber-300">{calculatedResult.scores.physical}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/50 border border-blue-500/20 text-center">
                <Droplets size={16} className="mx-auto text-blue-400 mb-1" />
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Emocional</span>
                <span className="text-sm font-mono font-bold text-blue-300">{calculatedResult.scores.emotional}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/20 text-center">
                <Wind size={16} className="mx-auto text-cyan-400 mb-1" />
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Intelectual</span>
                <span className="text-sm font-mono font-bold text-cyan-300">{calculatedResult.scores.intellectual}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/50 border border-purple-500/20 text-center">
                <Star size={16} className="mx-auto text-purple-400 mb-1" />
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Espiritual</span>
                <span className="text-sm font-mono font-bold text-purple-300">{calculatedResult.scores.spiritual}%</span>
              </div>
            </div>

            {/* Botón para calcular con otra persona */}
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition flex items-center justify-center gap-1.5 mx-auto border border-white/10"
            >
              <RotateCcw size={13} />
              <span>Calcular con otra persona</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
