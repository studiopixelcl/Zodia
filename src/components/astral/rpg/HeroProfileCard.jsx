"use client";
import React from 'react';
import { 
  Heart, Sword, Shield, Zap, Crosshair, Sparkles, 
  Award, Coins, Package, ChevronRight 
} from 'lucide-react';
import { ELEMENTAL_AFFINITIES, ZODIAC_HERO_CLASSES, RARITIES, getZodiacIcon } from './rpg-data';
import { calculateHeroTotalStats } from './rpg-engine';

export function HeroProfileCard({ hero, onOpenInventory }) {
  if (!hero) return null;

  const heroClass = ZODIAC_HERO_CLASSES[hero.sign] || ZODIAC_HERO_CLASSES['Aries'];
  const elemRules = ELEMENTAL_AFFINITIES[hero.element] || ELEMENTAL_AFFINITIES['Fuego'];
  const totalStats = calculateHeroTotalStats(hero);

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
        alt={hero.sign} 
        className="absolute -right-8 -bottom-8 w-44 h-44 object-contain opacity-10 pointer-events-none filter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
      />

      {/* Cabecera del Héroe */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        {/* Avatar Cósmico con foto de perfil y medallón del signo */}
        <div className="relative">
          <div 
            className={`w-18 h-18 rounded-2xl overflow-hidden p-0.5 border-2 ${elemRules.border} ${elemRules.aura} transition-all duration-500 bg-black flex items-center justify-center`}
            style={{ width: '4.5rem', height: '4.5rem' }}
          >
            {hero.avatarUrl ? (
              <img 
                src={hero.avatarUrl} 
                alt={hero.name} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <img 
                src={getZodiacIcon(hero.sign)} 
                alt={hero.sign} 
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

        {/* Nivel y Nombre */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 border border-white/20 font-mono text-cyan-300 font-bold">
              NIVEL {hero.level}
            </span>
            <span className="text-xs text-gray-400 font-light truncate">
              {heroClass.title}
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
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={16} className="text-amber-400" />
            <span className="text-xs text-gray-300">Polvo Estelar</span>
          </div>
          <span className="text-sm font-bold text-amber-300 font-mono">
            {hero.polvoEstelar || 0}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-purple-400" />
            <span className="text-xs text-gray-300">Rango</span>
          </div>
          <span className="text-xs font-bold text-purple-300 truncate">
            {hero.pvpRank || 'Polvo I'}
          </span>
        </div>
      </div>

      {/* Cuadrícula de Estadísticas de Batalla */}
      <div className="grid grid-cols-5 gap-1.5 p-3 rounded-xl bg-black/40 border border-white/5 mb-4 text-center">
        <div className="flex flex-col items-center">
          <Heart size={14} className="text-red-400 mb-1" />
          <span className="text-[10px] text-gray-400">VIDA</span>
          <span className="text-xs font-bold text-white font-mono">{totalStats.maxHp}</span>
        </div>
        <div className="flex flex-col items-center">
          <Sword size={14} className="text-orange-400 mb-1" />
          <span className="text-[10px] text-gray-400">ATQ</span>
          <span className="text-xs font-bold text-white font-mono">{totalStats.atk}</span>
        </div>
        <div className="flex flex-col items-center">
          <Shield size={14} className="text-blue-400 mb-1" />
          <span className="text-[10px] text-gray-400">DEF</span>
          <span className="text-xs font-bold text-white font-mono">{totalStats.def}</span>
        </div>
        <div className="flex flex-col items-center">
          <Zap size={14} className="text-yellow-400 mb-1" />
          <span className="text-[10px] text-gray-400">VEL</span>
          <span className="text-xs font-bold text-white font-mono">{totalStats.spd}</span>
        </div>
        <div className="flex flex-col items-center">
          <Crosshair size={14} className="text-cyan-400 mb-1" />
          <span className="text-[10px] text-gray-400">CRÍT</span>
          <span className="text-xs font-bold text-white font-mono">{Math.round(totalStats.critRate * 100)}%</span>
        </div>
      </div>

      {/* Slots de Equipamiento Rápido */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <Package size={14} className="text-cyan-400" /> Reliquias y Equipamiento
          </span>
          <button 
            onClick={onOpenInventory}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-medium transition-colors"
          >
            Ver Inventario <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Arma */}
          <div 
            onClick={onOpenInventory}
            className={`p-2 rounded-xl bg-white/5 border ${hero.equipped?.weapon ? RARITIES[hero.equipped.weapon.rarity]?.border : 'border-white/10'} hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center text-center`}
          >
            <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Arma</span>
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
            className={`p-2 rounded-xl bg-white/5 border ${hero.equipped?.armor ? RARITIES[hero.equipped.armor.rarity]?.border : 'border-white/10'} hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center text-center`}
          >
            <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Armadura</span>
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
            className={`p-2 rounded-xl bg-white/5 border ${hero.equipped?.relic ? RARITIES[hero.equipped.relic.rarity]?.border : 'border-white/10'} hover:border-cyan-400 cursor-pointer transition-all flex flex-col items-center text-center`}
          >
            <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Reliquia</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-1">
              <Sparkles size={16} />
            </div>
            <span className={`text-[10px] font-bold truncate max-w-full ${hero.equipped?.relic ? RARITIES[hero.equipped.relic.rarity]?.color : 'text-gray-500'}`}>
              {hero.equipped?.relic?.name || 'Ninguna'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
