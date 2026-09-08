"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Sparkles, Flame, Shield, Heart, Skull, 
  Zap, Droplet, Wind, Eye, Crown, Star, Sword, 
  Lock, Check, CheckCircle2, ChevronRight, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { 
  getHeroSkillTree, 
  getEquippedSkills, 
  ZODIAC_HERO_CLASSES, 
  ELEMENTAL_AFFINITIES, 
  getZodiacIcon 
} from './rpg-data';
import { playBattleShieldSound, playBattleCritSound } from '../../../lib/sound-effects';

export function SkillTreeModal({ isOpen, onClose, hero, onUpdateHero, isInline = false }) {
  const [mounted, setMounted] = useState(false);
  const [inspectingSkill, setInspectingSkill] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll de la página mientras el modal esté abierto (solo si no es inline)
  useEffect(() => {
    if (isOpen && !isInline) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, isInline]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen && !isInline) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (inspectingSkill) {
          setInspectingSkill(null);
        } else if (onClose && !isInline) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInline, inspectingSkill, onClose]);

  if ((!isOpen && !isInline) || !hero || !mounted) return null;

  const heroLevel = hero.level || 1;
  const heroSign = hero.sign || 'Aries';
  const heroClass = ZODIAC_HERO_CLASSES[heroSign] || ZODIAC_HERO_CLASSES['Aries'];
  const elemRules = ELEMENTAL_AFFINITIES[hero.element] || ELEMENTAL_AFFINITIES['Fuego'];
  const skillTree = getHeroSkillTree(heroSign);

  // Habilidades actualmente equipadas (hasta 2)
  const equippedList = getEquippedSkills(hero);
  const slot1 = equippedList[0] || null;
  const slot2 = equippedList[1] || null;

  // Manejar equipar habilidad en una ranura específica (0 para Ranura 1, 1 para Ranura 2)
  const handleEquipInSlot = (skill, slotIndex) => {
    if (heroLevel < skill.requiredLevel) return;

    let newEquippedIds = [...(hero.equippedSkills || equippedList.map(s => s.id))];

    // Asegurar longitud 2
    while (newEquippedIds.length < 2) {
      newEquippedIds.push(null);
    }

    // Si la habilidad ya estaba en la otra ranura, removerla o intercambiarla
    const otherIndex = slotIndex === 0 ? 1 : 0;
    if (newEquippedIds[otherIndex] === skill.id) {
      newEquippedIds[otherIndex] = newEquippedIds[slotIndex];
    }

    newEquippedIds[slotIndex] = skill.id;

    // Filtrar nulos si hay al menos una válida
    const cleanedIds = newEquippedIds.filter(Boolean);

    const updatedHero = {
      ...hero,
      equippedSkills: cleanedIds
    };

    playBattleShieldSound();
    onUpdateHero(updatedHero);
  };

  // Desequipar una ranura
  const handleUnequipSlot = (slotIndex) => {
    let currentIds = [...(hero.equippedSkills || equippedList.map(s => s.id))];
    if (currentIds.length <= 1) {
      // Debe conservar al menos 1 habilidad activa
      alert('Debes mantener al menos una habilidad activa equipada para el combate.');
      return;
    }

    currentIds.splice(slotIndex, 1);
    const updatedHero = {
      ...hero,
      equippedSkills: currentIds
    };

    playBattleShieldSound();
    onUpdateHero(updatedHero);
  };

  // Renderizar ícono según nombre
  const renderSkillIcon = (iconName, size = 18) => {
    switch (iconName) {
      case 'Flame':
        return <Flame size={size} className="text-orange-400" />;
      case 'Shield':
        return <Shield size={size} className="text-blue-400" />;
      case 'Heart':
        return <Heart size={size} className="text-red-400" />;
      case 'Skull':
        return <Skull size={size} className="text-emerald-400" />;
      case 'Zap':
        return <Zap size={size} className="text-yellow-400" />;
      case 'Droplet':
        return <Droplet size={size} className="text-cyan-400" />;
      case 'Wind':
        return <Wind size={size} className="text-teal-300" />;
      case 'Eye':
        return <Eye size={size} className="text-purple-400" />;
      case 'Crown':
        return <Crown size={size} className="text-amber-400" />;
      case 'Star':
        return <Star size={size} className="text-amber-300" />;
      default:
        return <Sparkles size={size} className="text-cyan-300" />;
    }
  };

  // Badge de tipo de mecánica
  const renderMechanicBadge = (type) => {
    switch (type) {
      case 'lifesteal':
      case 'lifesteal_burn':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-950/80 border border-red-500/40 text-red-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Heart size={10} /> Robo de Vida
          </span>
        );
      case 'poison':
      case 'poison_burst':
      case 'crowd_control':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Skull size={10} /> Veneno / Control
          </span>
        );
      case 'burn':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-orange-950/80 border border-orange-500/40 text-orange-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame size={10} /> Quemadura
          </span>
        );
      case 'shield':
      case 'reflect':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/40 text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Shield size={10} /> Escudo / Reflejo
          </span>
        );
      case 'heal':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-teal-950/80 border border-teal-500/40 text-teal-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Heart size={10} /> Sanación
          </span>
        );
      case 'drain_ether':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Zap size={10} /> Drenaje de Éter
          </span>
        );
      case 'buff':
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={10} /> Potenciador
          </span>
        );
      default:
        return (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sword size={10} /> Ataque Mágico
          </span>
        );
    }
  };

  const modalBody = (
    <div 
      className={`w-full ${isInline ? 'rounded-3xl' : 'max-w-4xl rounded-3xl max-h-[92dvh] sm:max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_50px_rgba(168,85,247,0.25)]'} glass-panel bg-gradient-to-b from-gray-950 via-slate-950 to-black border border-purple-500/40 p-4 sm:p-6 relative flex flex-col overflow-hidden text-left`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center text-white shadow-inner p-1 bg-black/60"
            style={{ borderColor: elemRules.color }}
          >
            <img src={getZodiacIcon(heroSign)} alt={heroSign} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="mystic-font text-base sm:text-xl text-white font-extrabold tracking-wide">
                ÁRBOL DE HABILIDADES ASTRALES
              </h3>
              <span 
                className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full text-black"
                style={{ backgroundColor: elemRules.color }}
              >
                {heroSign} ({hero.element})
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400">
              Desbloquea talentos cósmicos por nivel y configura tus 2 habilidades de combate activas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
            <Sparkles size={14} className="text-purple-400" />
            <span>NVL {heroLevel}</span>
          </div>

          {!isInline && onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Cerrar Árbol"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

        {/* Panel Superior: Ranuras de Habilidades Equipadas para Combate */}
        <div className="my-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-black to-cyan-950/30 border border-purple-500/30 shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sword size={14} className="text-amber-400" /> Habilidades Equipadas en Batalla (2 Ranuras)
            </span>
            <span className="text-[10px] text-gray-400">
              Estas son las habilidades que podrás usar en las 12 Casas y PvP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ranura 1 */}
            <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                  {slot1 ? renderSkillIcon(slot1.iconName, 18) : <Sparkles size={18} className="text-gray-600" />}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-cyan-400 block tracking-wider">
                    Ranura 1 (Activa)
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {slot1 ? slot1.name : 'Sin habilidad equipada'}
                  </h4>
                  {slot1 && (
                    <span className="text-[10px] font-mono text-purple-300">
                      -{slot1.etherCost} Éter • Mult x{slot1.multiplier}
                    </span>
                  )}
                </div>
              </div>

              {slot1 && (
                <button
                  onClick={() => handleUnequipSlot(0)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white text-[10px] font-semibold transition-all"
                  title="Quitar de la ranura 1"
                >
                  Quitar
                </button>
              )}
            </div>

            {/* Ranura 2 */}
            <div className="p-3 rounded-xl bg-black/60 border border-purple-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center shrink-0">
                  {slot2 ? renderSkillIcon(slot2.iconName, 18) : <Sparkles size={18} className="text-gray-600" />}
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-purple-400 block tracking-wider">
                    Ranura 2 (Activa)
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {slot2 ? slot2.name : 'Sin habilidad equipada'}
                  </h4>
                  {slot2 && (
                    <span className="text-[10px] font-mono text-purple-300">
                      -{slot2.etherCost} Éter • Mult x{slot2.multiplier}
                    </span>
                  )}
                </div>
              </div>

              {slot2 && (
                <button
                  onClick={() => handleUnequipSlot(1)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white text-[10px] font-semibold transition-all"
                  title="Quitar de la ranura 2"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Árbol de Nodos de la Constelación (Scroll vertical si es necesario) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-0">
          <div className="flex items-center justify-between text-[11px] text-gray-400 pb-1">
            <span>Ramas de la Constelación {heroSign}</span>
            <span>Toca una habilidad para equiparla en la Ranura 1 o Ranura 2</span>
          </div>

          <div className="space-y-3">
            {skillTree.map((skill, index) => {
              const isUnlocked = heroLevel >= skill.requiredLevel;
              const isSlot1 = slot1?.id === skill.id;
              const isSlot2 = slot2?.id === skill.id;
              const isEquipped = isSlot1 || isSlot2;

              return (
                <div 
                  key={skill.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative overflow-hidden ${
                    isEquipped 
                      ? 'border-amber-400 bg-gradient-to-r from-amber-950/30 via-purple-950/20 to-black shadow-[0_0_20px_rgba(251,191,36,0.15)]' 
                      : isUnlocked 
                      ? 'border-white/15 bg-white/[0.03] hover:border-purple-400/60 hover:bg-white/[0.06]' 
                      : 'border-white/5 bg-black/40 opacity-60'
                  }`}
                >
                  {/* Filamento conector visual entre nodos */}
                  {index < skillTree.length - 1 && (
                    <div className="hidden sm:block absolute -bottom-3 left-8 w-0.5 h-3 bg-gradient-to-b from-purple-500/50 to-transparent pointer-events-none" />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Info de la Habilidad */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      
                      {/* Icono del Nodo */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border relative ${
                        isEquipped 
                          ? 'bg-amber-500/20 border-amber-400 shadow-md shadow-amber-500/20' 
                          : isUnlocked 
                          ? 'bg-purple-500/20 border-purple-500/40' 
                          : 'bg-white/5 border-white/10 text-gray-600'
                      }`}>
                        {isUnlocked ? renderSkillIcon(skill.iconName, 22) : <Lock size={20} className="text-gray-500" />}
                        
                        {/* Indicador de Slot en esquina */}
                        {isEquipped && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center shadow-md">
                            {isSlot1 ? '1' : '2'}
                          </div>
                        )}
                      </div>

                      {/* Detalles */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                            {skill.name}
                          </h4>
                          
                          {/* Nivel requerido */}
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-md font-bold ${
                            isUnlocked 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                              : 'bg-red-950/50 text-red-400 border border-red-500/30'
                          }`}>
                            Req. Nivel {skill.requiredLevel}
                          </span>

                          {/* Tipo de mecánica */}
                          {renderMechanicBadge(skill.type)}

                          {/* Costo de Éter */}
                          <span className="text-[10px] font-mono text-cyan-300 font-bold">
                            -{skill.etherCost} Éter
                          </span>
                        </div>

                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          {skill.desc}
                        </p>
                      </div>
                    </div>

                    {/* Botones de Asignación a Ranuras */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {isUnlocked ? (
                        <>
                          <button
                            onClick={() => handleEquipInSlot(skill, 0)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              isSlot1 
                                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30 ring-1 ring-white' 
                                : 'bg-white/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            {isSlot1 && <Check size={12} />}
                            {isSlot1 ? 'En Ranura 1' : 'Ranura 1'}
                          </button>

                          <button
                            onClick={() => handleEquipInSlot(skill, 1)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                              isSlot2 
                                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30 ring-1 ring-white' 
                                : 'bg-white/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {isSlot2 && <Check size={12} />}
                            {isSlot2 ? 'En Ranura 2' : 'Ranura 2'}
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 italic bg-black/30 px-3 py-1.5 rounded-xl border border-white/5">
                          <Lock size={12} />
                          <span>Te faltan {skill.requiredLevel - heroLevel} niveles</span>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );

  if (isInline) {
    return (
      <div className="w-full select-none">
        {modalBody}
      </div>
    );
  }

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fadeIn select-none"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {modalBody}
    </div>,
    document.body
  );
}
