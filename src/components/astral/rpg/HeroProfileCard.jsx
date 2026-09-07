"use client";
import React from 'react';
import { 
  Heart, Sword, Shield, Zap, Crosshair, Sparkles, 
  Award, Coins, Package, ChevronRight, Compass
} from 'lucide-react';
import { ELEMENTAL_AFFINITIES, ZODIAC_HERO_CLASSES, RARITIES, getZodiacIcon, isValidImageUrl, getEquippedSkills } from './rpg-data';
import { calculateHeroTotalStats } from './rpg-engine';

export function HeroProfileCard({ hero, onOpenInventory, onOpenSkillTree }) {
  if (!hero) return null;

  const heroClass = ZODIAC_HERO_CLASSES[hero.sign] || ZODIAC_HERO_CLASSES['Aries'];
  const elemRules = ELEMENTAL_AFFINITIES[hero.element] || ELEMENTAL_AFFINITIES['Fuego'];
  const totalStats = calculateHeroTotalStats(hero);
  const equippedSkills = getEquippedSkills(hero);

  const expPercentage = Math.min(100, Math.round((hero.exp / hero.expNext) * 100));

  return (
    <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-b from-black/80 via-purple-950/20 to-black/90 border border-white/10 rounded-2xl shadow-2xl">
      {/* Luz ambiental elemental y watermark del signo */}
      <div 
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 -z-10 pointer-events-none"
        style={{ backgroundColor: elemRules.color }}
      />
      <img 
        src={getZodiacIcon(hero.sign)} 
        alt="" 
        className="absolute -right-8 -bottom-8 w-44 h-44 object-contain opacity-10 pointer-events-none filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
      />

      {/* Cabecera del Héroe */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        {/* Avatar Cósmico con foto de perfil o medallón del signo */}
        <div className="relative">
          <div 
            className={`w-18 h-18 rounded-2xl overflow-hidden p-0.5 border-2 ${elemRules.border} ${elemRules.aura} transition-all duration-500 bg-black flex items-center justify-center`}
            style={{ width: '4.5rem', height: '4.5rem' }}
          >
            {isValidImageUrl(hero.avatarUrl) ? (
              <img 
                src={hero.avatarUrl} 
                alt="" 
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getZodiacIcon(hero.sign);
                  e.currentTarget.className = "w-12 h-12 object-contain";
                }}
              />
            ) : (
              <img 
                src={getZodiacIcon(hero.sign)} 
                alt="" 
                className="w-12 h-12 object-contain"
              />
            )}
          </div>

          {/* Icono del signo superpuesto */}
          <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-black/90 border border-amber-400 p-0.5 shadow-lg flex items-center justify-center">
            <img src={getZodiacIcon(hero.sign)} alt="" className="w-full h-full object-contain" />
          </div>

          {/* Badge de Elemento */}
          <div 
            className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-black flex items-center gap-1 shadow-lg"
            style={{ backgroundColor: elemRules.color }}
          >
            <span>{heroClass.symbol}</span>
            <span>{hero.element}</span>
          </div>
        </div>

        {/* Nivel, Arquetipo y Nombre */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-cyan-300 font-bold">
              NV {hero.level}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 font-semibold truncate">
              {heroClass.archetype || heroClass.title}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-300">
              {heroClass.primaryDamageType === 'physical' ? '⚔️ Físico' : heroClass.primaryDamageType === 'magical' ? '🔮 Mágico' : '⚖️ Híbrido'}
            </span>
          </div>
          <h3 className="mystic-font text-lg text-white font-bold truncate">
            {hero.name}
          </h3>
          
          {/* Barra de Experiencia */}
          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
              <span>EXP</span>
              <span>{hero.exp} / {hero.expNext} ({expPercentage}%)</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500 rounded-full"
                style={{ width: `${expPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recursos: Polvo Estelar y Rango PvP */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={15} className="text-amber-400" />
            <span className="text-xs text-gray-300">Polvo Estelar</span>
          </div>
          <span className="text-sm font-bold text-amber-300 font-mono">
            {hero.polvoEstelar || 0}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={15} className="text-purple-400" />
            <span className="text-xs text-gray-300">Rango</span>
          </div>
          <span className="text-xs font-bold text-purple-300 truncate">
            {hero.pvpRank || 'Polvo I'}
          </span>
        </div>
      </div>

      {/* Cuadrícula de Estadísticas de Batalla (Dividido en Físico y Mágico) */}
      <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 mb-4 space-y-2">
        {/* Fila 1: Ofensiva y Vida */}
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-red-300 font-semibold mb-0.5">
              <Heart size={12} className="text-red-400" /> VIDA
            </div>
            <span className="text-xs font-bold text-white font-mono">{totalStats.maxHp}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-orange-300 font-semibold mb-0.5">
              <Sword size={12} className="text-orange-400" /> ATQ FÍS.
            </div>
            <span className="text-xs font-bold text-orange-200 font-mono">{totalStats.patk}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] text-purple-300 font-semibold mb-0.5">
              <Sparkles size={12} className="text-purple-400" /> ATQ MÁG.
            </div>
            <span className="text-xs font-bold text-purple-200 font-mono">{totalStats.matk}</span>
          </div>
        </div>

        {/* Fila 2: Defensas, Velocidad y Crítico */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[9px] text-blue-300 font-semibold mb-0.5">
              <Shield size={11} className="text-blue-400" /> DEF FÍS.
            </div>
            <span className="text-xs font-bold text-blue-200 font-mono">{totalStats.pdef}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[9px] text-indigo-300 font-semibold mb-0.5">
              <Shield size={11} className="text-indigo-400" /> DEF MÁG.
            </div>
            <span className="text-xs font-bold text-indigo-200 font-mono">{totalStats.mdef}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[9px] text-yellow-300 font-semibold mb-0.5">
              <Zap size={11} className="text-yellow-400" /> VEL
            </div>
            <span className="text-xs font-bold text-yellow-200 font-mono">{totalStats.spd}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center">
            <div className="flex items-center gap-1 text-[9px] text-cyan-300 font-semibold mb-0.5">
              <Crosshair size={11} className="text-cyan-400" /> CRÍT
            </div>
            <span className="text-xs font-bold text-cyan-200 font-mono">{Math.round(totalStats.critRate * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Slots de Equipamiento Rápido */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Package size={14} className="text-cyan-400" /> Reliquias y Equipo
            </span>
            {totalStats.activeSets?.some(s => s.hasAnyBonus) && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1 shadow-sm">
                <Sparkles size={9} /> Set Activo
              </span>
            )}
          </div>
          <button 
            onClick={onOpenInventory}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-medium transition-colors"
          >
            {totalStats.gearStats?.power > 0 ? (
              <span className="font-mono text-[10px] text-amber-300 mr-1.5 font-bold">
                ⚡ +{totalStats.gearStats.power}
              </span>
            ) : null}
            Gestionar <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Arma */}
          <div 
            onClick={onOpenInventory}
            className={`p-2 rounded-xl bg-white/5 border ${hero.equipped?.weapon ? RARITIES[hero.equipped.weapon.rarity]?.border : 'border-white/10'} hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center text-center relative`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Arma</span>
              {hero.equipped?.weapon?.categoryTag && (
                <span className="text-[8px] font-bold text-gray-300 px-1 py-0.2 rounded bg-black/40">
                  {hero.equipped.weapon.categoryTag}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-1">
              <Sword size={16} />
            </div>
            <span className={`text-[10px] font-bold truncate max-w-full ${hero.equipped?.weapon ? RARITIES[hero.equipped.weapon.rarity]?.color : 'text-gray-500'}`}>
              {hero.equipped?.weapon?.name || 'Ninguna'}
            </span>
          </div>

          {/* Armadura */}
          <div 
            onClick={onOpenInventory}
            className={`p-2 rounded-xl bg-white/5 border ${hero.equipped?.armor ? RARITIES[hero.equipped.armor.rarity]?.border : 'border-white/10'} hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center text-center relative`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Armadura</span>
              {hero.equipped?.armor?.categoryTag && (
                <span className="text-[8px] font-bold text-gray-300 px-1 py-0.2 rounded bg-black/40">
                  {hero.equipped.armor.categoryTag}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-1">
              <Shield size={16} />
            </div>
            <span className={`text-[10px] font-bold truncate max-w-full ${hero.equipped?.armor ? RARITIES[hero.equipped.armor.rarity]?.color : 'text-gray-500'}`}>
              {hero.equipped?.armor?.name || 'Ninguna'}
            </span>
          </div>

          {/* Reliquia */}
          <div 
            onClick={onOpenInventory}
            className={`p-2 rounded-xl bg-white/5 border ${hero.equipped?.relic ? RARITIES[hero.equipped.relic.rarity]?.border : 'border-white/10'} hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center text-center relative`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Reliquia</span>
              {hero.equipped?.relic?.categoryTag && (
                <span className="text-[8px] font-bold text-gray-300 px-1 py-0.2 rounded bg-black/40">
                  {hero.equipped.relic.categoryTag}
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-1">
              <Sparkles size={16} />
            </div>
            <span className={`text-[10px] font-bold truncate max-w-full ${hero.equipped?.relic ? RARITIES[hero.equipped.relic.rarity]?.color : 'text-gray-500'}`}>
              {hero.equipped?.relic?.name || 'Ninguna'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección Árbol de Habilidades Astrales */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-gray-300">Habilidades del Signo</span>
          </div>
          {onOpenSkillTree && (
            <button 
              onClick={onOpenSkillTree}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold transition-all bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 shadow-sm"
            >
              Árbol Astral <ChevronRight size={13} />
            </button>
          )}
        </div>

        {/* Habilidades Equipadas en Ranuras */}
        <div className="grid grid-cols-2 gap-2">
          {/* Ranura 1 */}
          <div 
            onClick={onOpenSkillTree}
            className="p-2 rounded-xl bg-purple-950/20 border border-purple-500/30 hover:border-purple-400/60 cursor-pointer transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono uppercase text-purple-400 font-bold">Ranura 1</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                {equippedSkills[0]?.etherCost || 2} Éter
              </span>
            </div>
            <div className="text-xs font-bold text-purple-100 group-hover:text-purple-300 transition-colors truncate">
              {equippedSkills[0]?.name || heroClass.skill.name}
            </div>
            <div className="text-[9px] text-purple-400/80 truncate">
              {equippedSkills[0]?.mechanic ? `⚡ ${equippedSkills[0].mechanic}` : 'Activa'}
            </div>
          </div>

          {/* Ranura 2 */}
          <div 
            onClick={onOpenSkillTree}
            className={`p-2 rounded-xl border transition-all text-left group cursor-pointer ${
              equippedSkills[1] 
                ? 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-400/60' 
                : 'bg-white/[0.02] border-dashed border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] font-mono uppercase font-bold ${equippedSkills[1] ? 'text-cyan-400' : 'text-gray-500'}`}>
                Ranura 2
              </span>
              {equippedSkills[1] ? (
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  {equippedSkills[1].etherCost} Éter
                </span>
              ) : (
                <span className="text-[9px] text-gray-500 font-mono">Niv. 4+</span>
              )}
            </div>
            <div className={`text-xs font-bold truncate ${equippedSkills[1] ? 'text-cyan-100 group-hover:text-cyan-300' : 'text-gray-500'}`}>
              {equippedSkills[1]?.name || 'Sin Asignar'}
            </div>
            <div className="text-[9px] text-gray-400 truncate">
              {equippedSkills[1]?.mechanic ? `⚡ ${equippedSkills[1].mechanic}` : 'Toca para elegir'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
