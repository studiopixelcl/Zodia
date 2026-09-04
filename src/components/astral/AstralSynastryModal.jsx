"use client";
import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Heart, Zap, X, Shield, Flame, Droplets, Wind, 
  Mountain, Star, Compass, ArrowRight, Lightbulb, MapPin, AlertCircle, Check 
} from 'lucide-react';
import { AstralPortalModal } from './AstralPortalModal';
import { ZodiacBadge } from './ZodiacBadge';
import { getZodiacSymbol, calculateResonance, ZODIAC_DETAILS, LIFE_PATH_DETAILS } from '../../lib/astrology';

// Matriz de sinastría elemental completa
const ELEMENT_SYNASTRY = {
  "Tierra-Tierra": {
    title: "Estabilidad & Raíz Sagrada",
    score: 95,
    summary: "Conexión de altísima solidez. Ambos valoran la lealtad, la calma, el confort y la construcción de proyectos tangibles a largo plazo sin apresuramientos.",
    alchemy: "Firmeza mutua, placer sensorial y confianza absoluta."
  },
  "Tierra-Agua": {
    title: "Alquimia Fértil & Nutricia",
    score: 93,
    summary: "Una de las combinaciones más armoniosas del zodíaco. La Tierra le da estructura y seguridad emocional al Agua, mientras que el Agua nutre y suaviza la practicidad de la Tierra.",
    alchemy: "Cuidado recíproco, ternura y crecimiento espiritual y material."
  },
  "Agua-Tierra": {
    title: "Alquimia Fértil & Nutricia",
    score: 93,
    summary: "Una de las combinaciones más armoniosas del zodíaco. La Tierra le da estructura y seguridad emocional al Agua, mientras que el Agua nutre y suaviza la practicidad de la Tierra.",
    alchemy: "Cuidado recíproco, ternura y crecimiento espiritual y material."
  },
  "Fuego-Aire": {
    title: "Chispa Expansiva & Pasión Intelectual",
    score: 92,
    summary: "El Aire alimenta la llama del Fuego con ideas audaces, mientras que el Fuego llena de entusiasmo y dinamismo los pensamientos del Aire. Cero aburrimiento.",
    alchemy: "Aventuras compartidas, risas, estímulo mental y libertad mutua."
  },
  "Aire-Fuego": {
    title: "Chispa Expansiva & Pasión Intelectual",
    score: 92,
    summary: "El Aire alimenta la llama del Fuego con ideas audaces, mientras que el Fuego llena de entusiasmo y dinamismo los pensamientos del Aire. Cero aburrimiento.",
    alchemy: "Aventuras compartidas, risas, estímulo mental y libertad mutua."
  },
  "Fuego-Fuego": {
    title: "Llama Radiante & Pasión Pura",
    score: 90,
    summary: "Atracción magnética instantánea y complicidad electrizante. Dos almas enérgicas que se impulsan a conquistar metas y vivir al máximo.",
    alchemy: "Vitalidad desbordante, espontaneidad y fervor romántico."
  },
  "Aire-Aire": {
    title: "Danza Mental & Libertad Compartida",
    score: 88,
    summary: "Una complicidad intelectual envidiable. Conversaciones infinitas, curiosidad compartida y respeto por el espacio personal de cada uno.",
    alchemy: "Amistad profunda, ligereza y visión de futuro sin ataduras."
  },
  "Agua-Agua": {
    title: "Océano Místico & Telepatía Emocional",
    score: 94,
    summary: "Conexión de almas profundas. Se entienden con una sola mirada; la intimidad es tierna, psíquica y de gran sensibilidad artística y espiritual.",
    alchemy: "Fusión empática, romanticismo puro y apoyo incondicional."
  },
  "Tierra-Fuego": {
    title: "Construcción Volcánica & Empuje",
    score: 78,
    summary: "El Fuego aporta la chispa inspiradora y la Tierra asegura que la visión se materialice en la realidad. Requiere respetar los ritmos distintos de cada uno.",
    alchemy: "El Fuego enseña a soñar en grande; la Tierra enseña a persistir."
  },
  "Fuego-Tierra": {
    title: "Construcción Volcánica & Empuje",
    score: 78,
    summary: "El Fuego aporta la chispa inspiradora y la Tierra asegura que la visión se materialice en la realidad. Requiere respetar los ritmos distintos de cada uno.",
    alchemy: "El Fuego enseña a soñar en grande; la Tierra enseña a persistir."
  },
  "Aire-Tierra": {
    title: "Realismo & Visión Estratégica",
    score: 75,
    summary: "El Aire expande las perspectivas de la Tierra, mientras que la Tierra ayuda al Aire a aterrizar sus ideas. Una unión de gran enriquecimiento intelectual.",
    alchemy: "Complementariedad entre la visión conceptual y la ejecución práctica."
  },
  "Tierra-Aire": {
    title: "Realismo & Visión Estratégica",
    score: 75,
    summary: "El Aire expande las perspectivas de la Tierra, mientras que la Tierra ayuda al Aire a aterrizar sus ideas. Una unión de gran enriquecimiento intelectual.",
    alchemy: "Complementariedad entre la visión conceptual y la ejecución práctica."
  },
  "Fuego-Agua": {
    title: "Vapor Sagrado & Alquimia Emocional",
    score: 72,
    summary: "Relación de gran intensidad transformadora. El Fuego despierta la valentía en el Agua, y el Agua enseña al Fuego a conectar con su mundo vulnerable.",
    alchemy: "Pasión volcánica que requiere paciencia y comunicación afectuosa."
  },
  "Agua-Fuego": {
    title: "Vapor Sagrado & Alquimia Emocional",
    score: 72,
    summary: "Relación de gran intensidad transformadora. El Fuego despierta la valentía en el Agua, y el Agua enseña al Fuego a conectar con su mundo vulnerable.",
    alchemy: "Pasión volcánica que requiere paciencia y comunicación afectuosa."
  },
  "Aire-Agua": {
    title: "Sensibilidad Poética & Horizonte Mental",
    score: 74,
    summary: "La mente rápida del Aire se encuentra con la profundidad oceánica del Agua. Si logran sintonizar su lenguaje, crearán un vínculo de gran belleza artística.",
    alchemy: "El Agua aporta corazón al Aire; el Aire aporta claridad al Agua."
  },
  "Agua-Aire": {
    title: "Sensibilidad Poética & Horizonte Mental",
    score: 74,
    summary: "La mente rápida del Aire se encuentra con la profundidad oceánica del Agua. Si logran sintonizar su lenguaje, crearán un vínculo de gran belleza artística.",
    alchemy: "El Agua aporta corazón al Aire; el Aire aporta claridad al Agua."
  }
};

// Generador de consejos para la primera cita según la sinastría
function generateFirstDateTips(signA = 'Capricornio', signB = 'Tauro') {
  const tipsBySign = {
    Aries: { spot: "Lugar activo con dinamismo: terraza al aire libre, arcade retro o un bar con música en vivo.", icebreaker: "¿Cuál ha sido la aventura más espontánea que has hecho sin pensarlo dos veces?", avoid: "Lugares con esperas largas o conversaciones monótonas de rutina." },
    Tauro: { spot: "Un bistró íntimo con gastronomía exquisita, buena carta de vinos o un café de especialidad acogedor.", icebreaker: "¿Cuál es tu placer sensorial o comida favorita que nunca te cansa?", avoid: "Lugares ruidosos donde no se pueda conversar con calma." },
    Géminis: { spot: "Un café cultural, librería con mesas o un bar speakeasy con cócteles creativos.", icebreaker: "¿Qué libro, serie o documental reciente cambió por completo tu perspectiva de algo?", avoid: "Quedarse en temas superficiales o cerrados que no permitan debate ameno." },
    Cáncer: { spot: "Un rincón íntimo con luz tenue, jardín protegido o una cafetería cálida frente al atardecer.", icebreaker: "¿Cuál es ese rincón especial en tu ciudad donde sientes verdadera paz interior?", avoid: "Presionar para revelar temas familiares o emocionales antes de que haya confianza." },
    Leo: { spot: "Un rooftop elegante con vista a la ciudad o un restaurante con diseño de autor y buena energía.", icebreaker: "¿Qué proyecto o pasión tuya hace que tus ojos brillen al hablar de ello?", avoid: "Ignorar sus logros o hacer comentarios que apaguen su entusiasmo natural." },
    Virgo: { spot: "Una cafetería de diseño minimalista, cata de café/té o un bistró orgánico con cocina cuidada.", icebreaker: "¿Tienes algún hábito o rutina diaria que consideres sagrada para tu bienestar?", avoid: "Llegar tarde o mostrar desorden e impaciencia en los detalles." },
    Libra: { spot: "Una galería de arte, wine bar con estética refinada o un parque botánico con música suave.", icebreaker: "¿Qué pieza de arte, canción o lugar consideras visualmente perfecto?", avoid: "Debates agresivos o forzar elecciones apresuradas en la primera cita." },
    Escorpio: { spot: "Un lounge con iluminación tenue y privacidad, o una mesa apartada en un bar temático.", icebreaker: "¿Qué verdad sobre ti misma pocas personas logran percibir a simple vista?", avoid: "Preguntas invasivas o conversaciones superficiales de protocolo social." },
    Sagitario: { spot: "Comida callejera gourmet al aire libre, parque con vista panorámica o bar multicultural.", icebreaker: "¿Cuál es el viaje que más te ha transformado espiritualmente?", avoid: "Hablar de compromisos rígidos o rutinas aburridas en el primer encuentro." },
    Capricornio: { spot: "Un lounge de hotel clásico, café tradicional con historia o un restaurante sobrio y elegante.", icebreaker: "¿Cuál es una meta a largo plazo que estás construyendo con paciencia?", avoid: "Alardear sin fundamentos o mostrar falta de puntualidad y seriedad." },
    Acuario: { spot: "Un espacio alternativo, bar con juegos de mesa indie o una exposición interactiva.", icebreaker: "¿Qué causa o innovación tecnológica crees que definirá la próxima década?", avoid: "Seguir reglas tradicionales o etiquetar de inmediato la dinámica." },
    Piscis: { spot: "Un rincón cerca del agua, cafetería bohemia con música acústica o cineclub indie.", icebreaker: "¿Hay alguna canción que sientas que fue compuesta especialmente para tu alma?", avoid: "El cinismo, la frialdad o juzgar sus corazonadas intuitivas." }
  };

  const tipB = tipsBySign[signB] || tipsBySign.Tauro;
  return {
    bestSpot: tipB.spot,
    icebreaker: tipB.icebreaker,
    avoid: tipB.avoid
  };
}

export function AstralSynastryModal({
  isOpen,
  onClose,
  profileA: propProfileA,
  myProfile,
  candidate: propCandidate,
  targetProfile,
  onLike,
  onIcebreaker
}) {
  const profileA = propProfileA || myProfile;
  const candidate = propCandidate || targetProfile;
  const [activeTab, setActiveTab] = useState('elementos'); // 'elementos' | 'sol' | 'numerologia' | 'cita'

  // Cálculo de sinastría en tiempo real
  const synastryData = useMemo(() => {
    if (!profileA || !candidate) return null;

    const elemA = profileA.element || 'Tierra';
    const elemB = candidate.element || 'Tierra';
    const elemKey = `${elemA}-${elemB}`;
    const elemInfo = ELEMENT_SYNASTRY[elemKey] || ELEMENT_SYNASTRY["Tierra-Tierra"];

    // Afinidad numérica global
    const globalScore = candidate.affinityNumber 
      ? candidate.affinityNumber 
      : calculateResonance(profileA, candidate);

    const tips = generateFirstDateTips(profileA.sign, candidate.sign);

    const pathA = profileA.life_path_number || profileA.lifePath || 7;
    const pathB = candidate.life_path_number || candidate.lifePath || 3;
    const infoPathA = LIFE_PATH_DETAILS[pathA] || LIFE_PATH_DETAILS[7];
    const infoPathB = LIFE_PATH_DETAILS[pathB] || LIFE_PATH_DETAILS[3];
    const isPathCompatible = infoPathA.compatiblePaths?.includes(pathB);

    return {
      globalScore,
      elemA,
      elemB,
      elemInfo,
      tips,
      pathA,
      pathB,
      infoPathA,
      infoPathB,
      isPathCompatible
    };
  }, [profileA, candidate]);

  if (!isOpen || !candidate || !synastryData) return null;

  return (
    <AstralPortalModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      className="bg-gradient-to-b from-[#0c1024] via-[#080b1a] to-[#04050a] border border-cyan-500/40 p-4 sm:p-6 shadow-[0_0_80px_rgba(6,182,212,0.25)]"
    >
      {/* Botón de cierre */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer z-20"
      >
        <X size={20} />
      </button>

      {/* ── ENCABEZADO CÓSMICO DE SINASTRÍA ── */}
      <div className="text-center pb-3 border-b border-white/10 relative">
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-2">
          {/* Avatar Usuario A */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <img
                src={profileA?.user_image || profileA?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt="Tú"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-black"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">
                <ZodiacBadge sign={profileA?.sign || 'Capricornio'} size="xs" />
              </span>
            </div>
            <span className="text-[11px] font-bold text-white max-w-[70px] truncate">
              {profileA?.nombre_actual || profileA?.name || 'Tú'}
            </span>
          </div>

          {/* Símbolo Central de Conexión & Porcentaje */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-500 to-pink-500 p-0.5 shadow-[0_0_25px_rgba(168,85,247,0.6)] flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                <Heart size={20} className="fill-pink-500 text-pink-400 animate-pulse" />
              </div>
            </div>
            <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300 mt-1">
              {synastryData.globalScore}% Afín
            </span>
          </div>

          {/* Avatar Candidato B */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]">
              <img
                src={candidate.image || candidate.photos?.[0] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                alt={candidate.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-black"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80';
                }}
              />
              <span className="absolute -bottom-1 -right-1 text-xs">
                <ZodiacBadge sign={candidate.sign || 'Tauro'} size="xs" />
              </span>
            </div>
            <span className="text-[11px] font-bold text-white max-w-[70px] truncate">
              {candidate.name?.split(' ')[0]}
            </span>
          </div>
        </div>

        <h3 className="mystic-font text-base sm:text-lg font-bold text-white tracking-wide">
          Sinastría Astral Profunda
        </h3>
        <p className="text-[11px] text-cyan-300/80 font-light">
          Análisis multidimensional de química elemental, afinidad y destino
        </p>
      </div>

      {/* ── SELECTOR DE PESTAÑAS DE ANÁLISIS ── */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 my-3">
        {[
          { id: 'elementos', label: 'Elementos', icon: <Flame size={12} /> },
          { id: 'sol', label: 'Esencia', icon: <SunIcon size={12} /> },
          { id: 'numerologia', label: 'Destino', icon: <Star size={12} /> },
          { id: 'cita', label: '1ª Cita', icon: <Lightbulb size={12} /> },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENIDO POR PESTAÑA ── */}
      <div className="space-y-3 min-h-[220px]">
        {/* 1. QUÍMICA ELEMENTAL */}
        {activeTab === 'elementos' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-black/50 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-400" />
                  {synastryData.elemA} + {synastryData.elemB}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                  {synastryData.elemInfo.score}% Armonía
                </span>
              </div>

              {/* Barra de compatibilidad */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 rounded-full"
                  style={{ width: `${synastryData.elemInfo.score}%` }}
                />
              </div>

              <h4 className="text-sm font-bold text-cyan-300 mystic-font">
                "{synastryData.elemInfo.title}"
              </h4>
              <p className="text-xs text-gray-300 leading-relaxed font-light">
                {synastryData.elemInfo.summary}
              </p>
              <div className="pt-1 text-[11px] text-amber-200/90 font-medium flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-300 shrink-0" />
                <span>Alquimia: {synastryData.elemInfo.alchemy}</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. ESENCIA SOLAR & ROMÁNTICA */}
        {activeTab === 'sol' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-black/50 border border-purple-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-purple-400" />
                  {profileA?.sign || 'Capricornio'} ✦ {candidate.sign || 'Tauro'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold border border-purple-500/30">
                  Atracción Solar
                </span>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-light">
                Como <strong className="text-white">{profileA?.sign}</strong>, buscas una conexión auténtica con respeto por tu espacio. Con <strong className="text-cyan-300">{candidate.name?.split(' ')[0]} ({candidate.sign})</strong>, existe una resonancia natural donde sus metas de vida y valores personales se potencian sin competir.
              </p>

              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200/90 space-y-1">
                <span className="font-bold block text-purple-300">✨ Magnetismo & Dinámica:</span>
                <p className="leading-snug text-gray-300">
                  {candidate.sign === profileA?.sign 
                    ? "Espejo idéntico: se comprenden instintivamente, aunque deben cuidar no caer en los mismos puntos ciegos."
                    : `La energía de ${candidate.sign} complementa tus fortalezas, aportando calidez y balance a tu día a día.`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. CAMINO DE VIDA (NUMEROLOGÍA) */}
        {activeTab === 'numerologia' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Star size={14} className="text-amber-400" />
                  Sendero {synastryData.pathA} ✦ Sendero {synastryData.pathB}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  synastryData.isPathCompatible
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
                  {synastryData.isPathCompatible ? 'Alta Compatibilidad' : 'Armonía de Aprendizaje'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-gray-400 block">Tu Misión:</span>
                  <span className="font-bold text-white">{synastryData.infoPathA?.title}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-gray-400 block">Misión de {candidate.name?.split(' ')[0]}:</span>
                  <span className="font-bold text-cyan-300">{synastryData.infoPathB?.title}</span>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed font-light">
                {synastryData.isPathCompatible
                  ? `Sus números de vida forman una alianza natural según la numerología pitagórica. Comparten visión de futuro y la capacidad de impulsarse mutuamente hacia el éxito personal.`
                  : `Una combinación que despierta crecimiento profundo. Cada uno aporta perspectivas frescas que amplían los horizontes del otro.`}
              </p>
            </div>
          </div>
        )}

        {/* 4. CONSEJOS PARA LA 1ª CITA */}
        {activeTab === 'cita' && (
          <div className="space-y-2.5 animate-fadeIn">
            {/* Rompehielos ideal */}
            <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Lightbulb size={13} className="text-amber-400" />
                Tema Rompehielos Perfecto
              </span>
              <p className="text-xs text-gray-200 italic leading-snug">
                "{synastryData.tips.icebreaker}"
              </p>
            </div>

            {/* Atmósfera y lugar ideal */}
            <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-1">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin size={13} className="text-pink-400" />
                Ambiente o Lugar Ideal
              </span>
              <p className="text-xs text-gray-300 leading-snug font-light">
                {synastryData.tips.bestSpot}
              </p>
            </div>

            {/* Qué evitar */}
            <div className="p-2.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle size={13} className="text-rose-400" />
                Qué evitar en la 1ª cita
              </span>
              <p className="text-xs text-gray-300 leading-snug font-light">
                {synastryData.tips.avoid}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTONES DE ACCIÓN INFERIOR ── */}
      <div className="flex items-center gap-2.5 pt-3 border-t border-white/10 mt-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onLike) onLike(candidate);
          }}
          className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:opacity-95 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
        >
          <Heart size={15} className="fill-current" />
          Sintonizar ({synastryData.globalScore}%)
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            if (onIcebreaker) onIcebreaker(candidate);
          }}
          className="px-4 py-3 rounded-2xl font-bold text-xs bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 flex items-center gap-1.5 transition active:scale-98 cursor-pointer shadow-md"
          title="Enviar Rompehielos Directo"
        >
          <Zap size={15} />
          <span className="hidden sm:inline">Rompehielos</span>
        </button>
      </div>
    </AstralPortalModal>
  );
}

// Icono auxiliar de Sol
function SunIcon({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
      <path d="m4.93 4.93 1.41 1.41"/>
      <path d="m17.66 17.66 1.41 1.41"/>
      <path d="M2 12h2"/>
      <path d="M20 12h2"/>
      <path d="m6.34 17.66-1.41 1.41"/>
      <path d="m19.07 4.93-1.41 1.41"/>
    </svg>
  );
}
