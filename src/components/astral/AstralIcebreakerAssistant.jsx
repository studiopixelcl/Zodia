"use client";
import React, { useState } from 'react';
import { 
  Sparkles, Zap, Heart, MessageCircle, Copy, Check, Send, 
  Flame, Mountain, Wind, Droplets, Compass, Star, Bot, X
} from 'lucide-react';
import { ZodiacBadge } from './ZodiacBadge';

/**
 * Motor astrológico de sinastría y generación de rompehielos de alta resonancia
 */
function getSynastryAnalysis(signA = 'Capricornio', signB = 'Virgo', elementA = 'Tierra', elementB = 'Tierra') {
  const elementsKey = `${elementA}-${elementB}`;
  
  const chemistryMap = {
    'Fuego-Fuego': {
      title: 'Doble Llama Sagrada 🔥',
      tagline: 'Intensidad, pasión volcánica y aventura instantánea.',
      tone: 'Directo, apasionado y audaz'
    },
    'Fuego-Aire': {
      title: 'Viento & Fuego ⚡',
      tagline: 'El aire aviva las llamas; conversaciones chispeantes y proyectos locos.',
      tone: 'Divertido, estimulante y curioso'
    },
    'Fuego-Tierra': {
      title: 'Magma & Montaña 🌋',
      tagline: 'El fuego aporta la chispa visionaria y la tierra construye el imperio.',
      tone: 'Magnético, seguro y constructivo'
    },
    'Fuego-Agua': {
      title: 'Vapor Alquímico 🌊🔥',
      tagline: 'Encuentro de alta temperatura emocional y misterio fascinante.',
      tone: 'Intenso, sensible y cautivador'
    },
    'Tierra-Tierra': {
      title: 'Cimiento Cósmico 🏛️',
      tagline: 'Lealtad inquebrantable, placer por lo tangible y ritmo sereno.',
      tone: 'Cálido, elegante y genuino'
    },
    'Tierra-Aire': {
      title: 'Arquitectura Mental 📐',
      tagline: 'Las ideas del aire aterrizan con maestría en el suelo fértil de la tierra.',
      tone: 'Intelectual, agudo y reflexivo'
    },
    'Tierra-Agua': {
      title: 'Tierra Fértil & Manantial 🌿',
      tagline: 'Nutrición natural, profunda empatía y comodidad inmediata.',
      tone: 'Dulce, acogedor y vulnerable'
    },
    'Aire-Aire': {
      title: 'Torbellino de Ideas 🌪️',
      tagline: 'Telepatía mental, charlas eternas hasta el alba y humor cómplice.',
      tone: 'Ingenioso, lúdico y sin filtros'
    },
    'Aire-Agua': {
      title: 'Marea & Brisa Marina 🌊💨',
      tagline: 'La mente poética comprende los misterios del corazón.',
      tone: 'Poético, sutil y envolvente'
    },
    'Agua-Agua': {
      title: 'Océano Infinito 🌌💧',
      tagline: 'Conexión psíquica, complicidad sin palabras y emociones profundas.',
      tone: 'Profundo, intuitivo y místico'
    }
  };

  const reverseKey = `${elementB}-${elementA}`;
  return chemistryMap[elementsKey] || chemistryMap[reverseKey] || {
    title: 'Sincronía Astral ✨',
    tagline: 'Las energías de sus cartas natales forman un puente de resonancia único.',
    tone: 'Magnético y natural'
  };
}

function generateDynamicIcebreakers(mySign, targetSign, targetName, targetInterests = []) {
  const firstName = targetName ? targetName.split(' ')[0] : 'tu match';
  const sharedInterest = targetInterests.length > 0 ? targetInterests[0] : null;

  return [
    {
      id: 'magnetic',
      category: 'Rompehielos Magnético ⚡',
      badgeColor: 'from-amber-500 to-orange-600',
      text: `Hola ${firstName}! Estaba viendo nuestra sintonía entre ${mySign} y ${targetSign}... dicen que esta combinación es o pura chispa o un caos inolvidable. ¿Cuál crees que seremos? ✨`
    },
    {
      id: 'deep',
      category: 'Conexión Profunda 🌙',
      badgeColor: 'from-purple-600 to-indigo-600',
      text: `Siento que con energía de ${targetSign} las charlas superficiales sobran. Si tuvieras que contarme una verdad sobre ti que casi nadie sabe en la primera charla, ¿cuál sería?`
    },
    {
      id: 'date',
      category: 'Propuesta de Cita Cósmica ☕',
      badgeColor: 'from-emerald-500 to-teal-600',
      text: sharedInterest 
        ? `Coincidimos en amar "${sharedInterest}". Si planeáramos la primera cita perfecta alrededor de eso este fin de semana, ¿cuál sería el rincón ideal?`
        : `Café de especialidad para debatir sobre el universo o un buen vino para reírnos de la vida... ¿cuál es tu panorama ideal para una primera salida?`
    },
    {
      id: 'mystic',
      category: 'Curiosidad del Oráculo 🔮',
      badgeColor: 'from-cyan-500 to-blue-600',
      text: `Pregunta rápida del Oráculo Zodia: ¿Qué es lo más acertado (y lo más injusto) que la gente suele asumir de los ${targetSign}? 🪐`
    }
  ];
}

export function AstralIcebreakerAssistant({ 
  myProfile, 
  targetUser, 
  onSelectIcebreaker, 
  onClose,
  title = "Oráculo de Sinastría & Rompehielos"
}) {
  const [copiedId, setCopiedId] = useState(null);

  const mySign = myProfile?.sign || 'Capricornio';
  const myElement = myProfile?.element || 'Tierra';

  const targetSign = targetUser?.sign || 'Leo';
  const targetElement = targetUser?.element || 'Fuego';
  const targetName = targetUser?.name || 'Sintonizador';
  const targetInterests = Array.isArray(targetUser?.interests) ? targetUser.interests : [];

  const synastry = getSynastryAnalysis(mySign, targetSign, myElement, targetElement);
  const icebreakers = generateDynamicIcebreakers(mySign, targetSign, targetName, targetInterests);

  const handleCopy = (text, id, e) => {
    e?.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-4 text-white select-none">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white mystic-font flex items-center gap-1.5">
              {title}
            </h3>
            <p className="text-[10px] text-cyan-300/80 font-light">
              Sinastría entre <span className="font-semibold text-white">{mySign}</span> y <span className="font-semibold text-white">{targetSign}</span> ({targetName.split(' ')[0]})
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Tarjeta de Resonancia de Sinastría */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0a0f1d] to-cyan-950/40 border border-white/10 space-y-2 shadow-inner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZodiacBadge sign={mySign} size="xs" />
            <span className="text-[10px] text-gray-400 font-mono">+</span>
            <ZodiacBadge sign={targetSign} size="xs" />
            <span className="text-xs font-bold text-white ml-1">
              {synastry.title}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-[9px] font-extrabold text-cyan-300">
            {targetUser?.affinity || '92% Afinidad'}
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed font-light">
          {synastry.tagline}
        </p>
      </div>

      {/* Listado de Opciones de Rompehielos */}
      <div className="space-y-2.5">
        <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1">
          <Zap size={12} className="text-amber-400" /> Elige un rompehielos para enviar:
        </p>

        {icebreakers.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-black/50 hover:bg-black/80 border border-white/10 hover:border-cyan-400/50 transition-all group space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${item.badgeColor} text-[9px] font-bold text-white shadow-sm`}>
                {item.category}
              </span>
              <div className="flex items-center gap-1.5">
                {/* Botón Copiar */}
                <button
                  onClick={(e) => handleCopy(item.text, item.id, e)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition text-[10px] flex items-center gap-1"
                  title="Copiar texto"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copiado</span>
                    </>
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-200 font-light leading-relaxed group-hover:text-white transition">
              "{item.text}"
            </p>

            {/* Botón de Usar Directamente */}
            <button
              onClick={() => onSelectIcebreaker && onSelectIcebreaker(item.text)}
              className="w-full py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-400/30 hover:border-cyan-400 text-cyan-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Send size={11} /> Usar en la conversación ✨
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
