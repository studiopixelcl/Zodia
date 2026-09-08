"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Package, Sword, Shield, Sparkles, Coins, 
  Check, Gift, Star, ArrowRight, ArrowUp, ArrowDown, 
  ChevronRight, Info, AlertTriangle, Layers, Zap, Flame, Moon, Sun, Crown, Eye, Undo2
} from 'lucide-react';
import { 
  RARITIES, 
  EQUIPMENT_CATALOG, 
  EQUIPMENT_SETS, 
  calculateActiveSets, 
  calculateItemPower 
} from './rpg-data';
import { calculateHeroTotalStats, getItemEffectiveStats } from './rpg-engine';
import { playLootChestSound, playBattleShieldSound } from '../../../lib/sound-effects';

export function LootInventoryModal({ isOpen, onClose, hero, onUpdateHero, onOpenForge, isInline = false }) {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState('all'); // all, weapon, armor, relic
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonResult, setSummonResult] = useState(null);
  const [mobileTab, setMobileTab] = useState('inventory'); // 'gear' | 'inventory'

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll de la página y garantizar visualización inmediata en pantalla (solo si es modal)
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
        if (selectedItem) {
          setSelectedItem(null);
        } else if (onClose && !isInline) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInline, selectedItem, onClose]);

  if ((!isOpen && !isInline) || !hero || !mounted) return null;

  const inventory = hero.inventory || [];
  const equipped = hero.equipped || {};

  // Estadísticas globales y de equipamiento calculadas
  const heroTotal = calculateHeroTotalStats(hero);
  const { gearStats, activeSets } = heroTotal;

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  // Manejar equipar objeto
  const handleEquip = (itemToEquip) => {
    if (!itemToEquip) return;
    const slotType = itemToEquip.type;
    const prevEquipped = equipped[slotType];

    // Remover el objeto equipado del inventario
    const newInventory = inventory.filter(i => i.id !== itemToEquip.id);
    
    // Si ya había uno equipado en ese slot, devolverlo al inventario
    if (prevEquipped) {
      newInventory.push(prevEquipped);
    }

    const updatedHero = {
      ...hero,
      equipped: {
        ...equipped,
        [slotType]: itemToEquip
      },
      inventory: newInventory
    };

    playBattleShieldSound();
    onUpdateHero(updatedHero);
    setSelectedItem(null);
    if (summonResult?.id === itemToEquip.id) {
      setSummonResult(null);
    }
  };

  // Manejar desequipar objeto
  const handleUnequip = (slotType) => {
    const currentItem = equipped[slotType];
    if (!currentItem) return;

    const updatedHero = {
      ...hero,
      equipped: {
        ...equipped,
        [slotType]: null
      },
      inventory: [...inventory, currentItem]
    };

    playBattleShieldSound();
    onUpdateHero(updatedHero);
    if (selectedItem?.id === currentItem.id) {
      setSelectedItem(null);
    }
  };

  // Abrir cofre celestial gastando Polvo Estelar
  const handleOpenChest = () => {
    const cost = 80;
    if ((hero.polvoEstelar || 0) < cost) {
      alert('Necesitas al menos 80 de Polvo Estelar para invocar un Cofre Astral.');
      return;
    }

    setIsSummoning(true);
    setSummonResult(null);

    setTimeout(() => {
      const roll = Math.random();
      let pool = [];
      if (roll < 0.10) {
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'legendario');
      } else if (roll < 0.35) {
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'epico');
      } else if (roll < 0.70) {
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'raro');
      } else {
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'comun');
      }

      const randomItem = pool[Math.floor(Math.random() * pool.length)] || EQUIPMENT_CATALOG[0];

      const newItem = {
        ...randomItem,
        id: `${randomItem.id}_${Date.now()}`
      };

      const updatedHero = {
        ...hero,
        polvoEstelar: hero.polvoEstelar - cost,
        inventory: [...hero.inventory, newItem]
      };

      playLootChestSound();
      onUpdateHero(updatedHero);
      setIsSummoning(false);
      setSummonResult(newItem);
    }, 1200);
  };

  // Ícono según el tipo de slot
  const renderSlotIcon = (type, size = 18) => {
    switch (type) {
      case 'weapon':
        return <Sword size={size} className="text-orange-400" />;
      case 'armor':
        return <Shield size={size} className="text-blue-400" />;
      case 'relic':
        return <Sparkles size={size} className="text-purple-400" />;
      default:
        return <Package size={size} className="text-cyan-400" />;
    }
  };

  // Icono del conjunto de equipo
  const renderSetIcon = (setId, size = 14) => {
    const setDef = EQUIPMENT_SETS[setId];
    if (!setDef) return null;
    switch (setDef.iconName) {
      case 'Moon':
        return <Moon size={size} className="text-cyan-300" />;
      case 'Sun':
        return <Sun size={size} className="text-purple-300" />;
      case 'Crown':
        return <Crown size={size} className="text-amber-300" />;
      default:
        return <Sparkles size={size} className="text-gray-300" />;
    }
  };

  // Análisis de impacto de set al comparar
  const getSetImpactAnalysis = (candidateItem) => {
    if (!candidateItem) return null;
    
    // Simular equipo con candidato
    const simulatedEquipped = {
      ...equipped,
      [candidateItem.type]: candidateItem
    };

    const currentSets = calculateActiveSets(equipped);
    const simulatedSets = calculateActiveSets(simulatedEquipped);

    const activatedBonuses = [];
    const brokenBonuses = [];

    // Comprobar si se activa algo nuevo
    for (const sim of simulatedSets) {
      const curr = currentSets.find(c => c.setId === sim.setId);
      const currUnlocked = curr ? curr.unlockedBonuses.length : 0;
      if (sim.unlockedBonuses.length > currUnlocked) {
        const newBonus = sim.unlockedBonuses[sim.unlockedBonuses.length - 1];
        activatedBonuses.push({
          setName: sim.set.name,
          title: newBonus.title,
          desc: newBonus.desc
        });
      }
    }

    // Comprobar si se rompe algún bono
    for (const curr of currentSets) {
      const sim = simulatedSets.find(s => s.setId === curr.setId);
      const simUnlocked = sim ? sim.unlockedBonuses.length : 0;
      if (curr.unlockedBonuses.length > simUnlocked) {
        const lostBonus = curr.unlockedBonuses[curr.unlockedBonuses.length - 1];
        brokenBonuses.push({
          setName: curr.set.name,
          title: lostBonus.title
        });
      }
    }

    return { activatedBonuses, brokenBonuses };
  };

  const modalBody = (
    <div 
      className={`w-full ${isInline ? 'rounded-3xl' : 'max-w-5xl rounded-3xl max-h-[92dvh] sm:max-h-[90vh] shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_50px_rgba(6,182,212,0.25)]'} glass-panel bg-gradient-to-b from-gray-950 via-slate-950 to-black border border-cyan-500/40 p-4 sm:p-6 relative flex flex-col overflow-hidden text-left`}
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Cabecera Principal */}
      <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
            <Package size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="mystic-font text-base sm:text-xl text-white font-extrabold tracking-wide">
                SANTUARIO DE EQUIPO & RELIQUIAS
              </h3>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Zodia Gear Hub
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-400">
              Visualiza tus piezas equipadas, compara reliquias y despierta bonificaciones de conjuntos cósmicos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Polvo estelar en cabecera */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300">
            <Coins size={14} className="text-amber-400" />
            <span className="text-xs font-mono font-bold">{hero.polvoEstelar || 0}</span>
          </div>

          {!isInline && onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Cerrar Santuario"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

        {/* Notificación de Cofre Astral recién abierto */}
        {summonResult && (
          <div className="mt-3 p-3 rounded-2xl bg-cyan-950/60 border border-cyan-400/60 flex items-center justify-between animate-fadeIn shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                <Star size={20} className="animate-spin" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">¡Nueva Reliquia Invocada!</span>
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs sm:text-sm font-bold truncate ${RARITIES[summonResult.rarity]?.color}`}>
                    {summonResult.name}
                  </h4>
                  {summonResult.setId && EQUIPMENT_SETS[summonResult.setId] && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 shrink-0">
                      {EQUIPMENT_SETS[summonResult.setId].badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-300 truncate">{summonResult.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setSelectedItem(summonResult)}
                className="text-xs px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                Comparar
              </button>
              <button 
                onClick={() => handleEquip(summonResult)}
                className="text-xs px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold uppercase tracking-wider hover:opacity-95 transition-all shadow-md"
              >
                Equipar
              </button>
            </div>
          </div>
        )}

        {/* Selector de Pestañas Móviles (Solo visible en pantallas < lg) */}
        <div className="flex lg:hidden bg-white/5 p-1 rounded-2xl border border-white/10 gap-1 mt-2.5 shrink-0">
          <button
            onClick={() => setMobileTab('inventory')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'inventory'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Package size={14} />
            <span>Mochila ({filteredInventory.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('gear')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'gear'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield size={14} />
            <span>Equipadas ({Object.values(equipped).filter(Boolean).length}/3)</span>
          </button>
        </div>

        {/* Contenido Principal de 2 Columnas */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3 overflow-hidden min-h-0">
          
          {/* ======================================================== */}
          {/* COLUMNA IZQUIERDA: EQUIPO ACTIVO, STATS Y SETS (5 cols)  */}
          {/* ======================================================== */}
          <div className={`lg:col-span-5 flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar ${mobileTab === 'gear' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Sección: Slots de Equipo Activo */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Shield size={14} className="text-cyan-400" /> Piezas Equipadas
                </span>
                <span className="text-[10px] text-gray-400">
                  {Object.values(equipped).filter(Boolean).length} / 3 slots
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'weapon', label: 'Arma Principal', defaultDesc: 'Sin arma equipada' },
                  { key: 'armor', label: 'Armadura Sagrada', defaultDesc: 'Sin armadura equipada' },
                  { key: 'relic', label: 'Reliquia Cósmica', defaultDesc: 'Sin reliquia equipada' }
                ].map(({ key, label, defaultDesc }) => {
                  const item = equipped[key];
                  const rarity = item ? (RARITIES[item.rarity] || RARITIES.comun) : null;
                  const setDef = item?.setId ? EQUIPMENT_SETS[item.setId] : null;

                  return (
                    <div 
                      key={key}
                      className={`p-3 rounded-2xl border transition-all ${
                        item 
                          ? `${rarity.border} ${rarity.bg} hover:border-cyan-400` 
                          : 'border-dashed border-white/15 bg-black/30 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Ícono de Slot */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            item 
                              ? 'bg-black/50 border border-white/10 shadow-md' 
                              : 'bg-white/5 text-gray-600'
                          }`}>
                            {renderSlotIcon(key, 20)}
                          </div>

                          {/* Detalles del Ítem */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                                {label}
                              </span>
                              {item && (
                                <span className={`text-[9px] font-bold ${rarity.color}`}>
                                  • {rarity.name}
                                </span>
                              )}
                            </div>

                            {item ? (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className={`text-xs sm:text-sm font-bold truncate ${rarity.color}`}>
                                    {item.name}
                                  </h4>
                                  {item.upgradeLevel > 0 && (
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      +{item.upgradeLevel}
                                    </span>
                                  )}
                                  {item.enchantment && (
                                    <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold" title={item.enchantment.name}>
                                      💎 {item.enchantment.name.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Atributos y Set */}
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {item.categoryTag && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-white/10 text-cyan-300 font-bold">
                                      {item.categoryTag}
                                    </span>
                                  )}
                                  {setDef && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-medium flex items-center gap-0.5">
                                      {renderSetIcon(item.setId, 10)}
                                      {setDef.badge}
                                    </span>
                                  )}
                                  {(() => {
                                    const eff = getItemEffectiveStats(item);
                                    return (
                                      <div className="flex gap-2 text-[10px] font-mono flex-wrap">
                                        {eff.patk > 0 && <span className="text-orange-300">+{eff.patk} PATK</span>}
                                        {eff.matk > 0 && <span className="text-purple-300">+{eff.matk} MATK</span>}
                                        {eff.hp > 0 && <span className="text-red-300">+{eff.hp} HP</span>}
                                        {eff.pdef > 0 && <span className="text-blue-300">+{eff.pdef} PDEF</span>}
                                        {eff.mdef > 0 && <span className="text-indigo-300">+{eff.mdef} MDEF</span>}
                                        {eff.spd > 0 && <span className="text-yellow-300">+{eff.spd} VEL</span>}
                                        {eff.crit > 0 && <span className="text-cyan-300">+{Math.round(eff.crit * 100)}% CRÍT</span>}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </>
                            ) : (
                              <p 
                                onClick={() => {
                                  setFilter(key);
                                  setMobileTab('inventory');
                                }}
                                className="text-xs text-gray-500 italic cursor-pointer hover:text-cyan-400 transition-colors"
                              >
                                {defaultDesc} (toca para buscar)
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones de Slot */}
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item ? (
                            <>
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-[10px] font-semibold transition-all"
                                title="Ver detalles"
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => handleUnequip(key)}
                                className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase transition-all flex items-center gap-1"
                                title="Desequipar objeto y devolver al inventario"
                              >
                                <Undo2 size={12} />
                                <span className="hidden sm:inline">Quitar</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setFilter(key)}
                              className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500 hover:text-black text-[10px] font-bold uppercase transition-all"
                            >
                              Equipar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección: Estadísticas Acumuladas del Equipo */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-black to-cyan-950/30 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap size={14} className="text-amber-400" /> Aporte Total del Equipo
                </span>
                <div className="flex items-center gap-1 text-amber-300 font-mono font-bold text-xs">
                  <span>Poder:</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300">
                    ⚡ +{gearStats.power}
                  </span>
                </div>
              </div>

              {/* Grid 2 filas para físico y mágico */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-orange-300 block font-semibold">ATQ FÍS</span>
                    <span className="text-xs font-mono font-bold text-orange-400">
                      +{gearStats.patk}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-purple-300 block font-semibold">ATQ MÁG</span>
                    <span className="text-xs font-mono font-bold text-purple-400">
                      +{gearStats.matk}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-red-300 block font-semibold">VIDA</span>
                    <span className="text-xs font-mono font-bold text-red-400">
                      +{gearStats.hp}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-blue-300 block font-semibold">DEF FÍS</span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      +{gearStats.pdef}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-indigo-300 block font-semibold">DEF MÁG</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      +{gearStats.mdef}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-yellow-300 block font-semibold">VEL</span>
                    <span className="text-xs font-mono font-bold text-yellow-400">
                      +{gearStats.spd}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[9px] text-cyan-300 block font-semibold">CRÍT</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      +{Math.round(gearStats.critRate * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Bonificaciones por Conjuntos de Equipo (Set Bonuses) */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers size={14} className="text-purple-400" /> Bonos de Conjuntos Cósmicos
                </span>
                <span className="text-[10px] text-gray-400">
                  {activeSets.filter(s => s.hasAnyBonus).length} activos
                </span>
              </div>

              {activeSets.length === 0 ? (
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-center">
                  <p className="text-[11px] text-gray-400">
                    No tienes piezas del mismo conjunto equipadas.
                  </p>
                  <p className="text-[10px] text-cyan-400/80 mt-1">
                    Equipa 2 o 3 piezas del mismo conjunto cósmico para desbloquear bonificaciones especiales.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSets.map(setInfo => {
                    const { set, count, unlockedBonuses } = setInfo;
                    return (
                      <div 
                        key={set.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          unlockedBonuses.length > 0 
                            ? `${set.borderColor} bg-gradient-to-r from-purple-950/20 to-black` 
                            : 'border-white/10 bg-black/30 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {renderSetIcon(set.id, 14)}
                            <span className="text-xs font-bold text-white">
                              {set.name}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            unlockedBonuses.length > 0 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' 
                              : 'bg-white/10 text-gray-400'
                          }`}>
                            {count} / 3 piezas
                          </span>
                        </div>

                        {/* Bonos Desbloqueados */}
                        <div className="mt-2 space-y-1">
                          {set.bonuses.map((b, idx) => {
                            const isUnlocked = count >= b.requiredPieces;
                            return (
                              <div 
                                key={idx}
                                className={`text-[10px] flex items-center justify-between p-1 rounded-lg ${
                                  isUnlocked 
                                    ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 font-medium' 
                                    : 'text-gray-500'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  {isUnlocked ? <Check size={11} className="text-emerald-400" /> : <span className="w-2.5 h-2.5 rounded-full border border-gray-600 inline-block" />}
                                  {b.title}
                                </span>
                                <span className="font-mono text-[9px]">{b.desc}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* COLUMNA DERECHA: INVENTARIO Y COMPARADOR (7 cols)         */}
          {/* ======================================================== */}
          <div className={`lg:col-span-7 flex-col overflow-hidden bg-black/40 rounded-2xl border border-white/10 p-3 sm:p-4 min-h-0 ${mobileTab === 'inventory' ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Barra superior de Inventario: Filtros y Botón de Cofre */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10 shrink-0">
              
              {/* Filtros de Categoría */}
              <div className="flex gap-1.5">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'weapon', label: 'Armas' },
                  { id: 'armor', label: 'Armaduras' },
                  { id: 'relic', label: 'Reliquias' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setFilter(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filter === tab.id 
                        ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20' 
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Botón de Cofre Astral */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div className="sm:hidden flex items-center gap-1.5 text-xs text-amber-300 font-mono font-bold">
                  <Coins size={14} className="text-amber-400" />
                  {hero.polvoEstelar || 0}
                </div>

                <button
                  onClick={handleOpenChest}
                  disabled={isSummoning || (hero.polvoEstelar || 0) < 80}
                  className="btn-mystic px-3 py-1.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gift size={14} />
                  {isSummoning ? 'Invocando...' : 'Cofre Astral (80)'}
                </button>
              </div>
            </div>

            {/* Subtítulo de Inventario */}
            <div className="flex items-center justify-between py-2 text-[11px] text-gray-400 shrink-0">
              <span>Bóveda Cósmica ({filteredInventory.length} disponibles)</span>
              <span>Toca un objeto para comparar o equipar</span>
            </div>

            {/* Lista/Cuadrícula de Ítems del Inventario */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Package size={28} className="text-gray-600" />
                  <span>No tienes objetos en esta categoría del inventario.</span>
                  <span className="text-[11px] text-cyan-400/80">¡Abre un Cofre Astral o conquista las 12 Casas para forjar nuevas reliquias!</span>
                </div>
              ) : (
                filteredInventory.map(item => {
                  const rarityMeta = RARITIES[item.rarity] || RARITIES.comun;
                  const setDef = item.setId ? EQUIPMENT_SETS[item.setId] : null;
                  const itemPwr = calculateItemPower(item);
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                        isSelected 
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                          : `${rarityMeta.border} bg-white/[0.03] hover:border-cyan-500/50 hover:bg-white/[0.06]`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Ícono de Ítem */}
                          <div className={`w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                            {renderSlotIcon(item.type, 18)}
                          </div>

                          {/* Info de Ítem */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-xs font-bold truncate ${rarityMeta.color}`}>
                                {item.name}
                              </span>
                              {item.upgradeLevel > 0 && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  +{item.upgradeLevel}
                                </span>
                              )}
                              {item.enchantment && (
                                <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold" title={item.enchantment.name}>
                                  💎 {item.enchantment.name.split(' ')[0]}
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-gray-300 font-light">
                                {rarityMeta.name}
                              </span>
                              {item.categoryTag && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold">
                                  {item.categoryTag}
                                </span>
                              )}
                              {setDef && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/40 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-0.5">
                                  {renderSetIcon(item.setId, 10)}
                                  {setDef.badge}
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5 truncate">
                              {item.desc}
                            </p>

                            {/* Estadísticas Efectivas */}
                            {(() => {
                              const eff = getItemEffectiveStats(item);
                              return (
                                <div className="flex gap-2.5 text-[10px] font-mono mt-1 flex-wrap">
                                  {eff.patk > 0 && <span className="text-orange-300">+{eff.patk} PATK</span>}
                                  {eff.matk > 0 && <span className="text-purple-300">+{eff.matk} MATK</span>}
                                  {eff.hp > 0 && <span className="text-red-300">+{eff.hp} HP</span>}
                                  {eff.pdef > 0 && <span className="text-blue-300">+{eff.pdef} PDEF</span>}
                                  {eff.mdef > 0 && <span className="text-indigo-300">+{eff.mdef} MDEF</span>}
                                  {eff.spd > 0 && <span className="text-yellow-300">+{eff.spd} VEL</span>}
                                  {eff.crit > 0 && <span className="text-cyan-300">+{Math.round(eff.crit * 100)}% CRÍT</span>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Botones rápidos */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] font-mono text-amber-300 font-bold hidden sm:inline-block">
                            ⚡ {itemPwr}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquip(item);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-black transition-all"
                          >
                            Equipar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* ======================================================== */}
        {/* MODAL / DRAWER DE COMPARACIÓN DIRECTA LADO A LADO        */}
        {/* ======================================================== */}
        {selectedItem && (
          <div 
            className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
            style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedItem(null);
            }}
          >
            <div 
              className="w-full max-w-2xl glass-panel bg-gradient-to-b from-gray-950 via-slate-950 to-black border border-cyan-400/60 rounded-3xl p-4 sm:p-6 shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_60px_rgba(6,182,212,0.35)] relative flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Cabecera del Comparador */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h3 className="mystic-font text-base sm:text-lg text-white font-bold">
                      COMPARADOR DE RELIQUIAS
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Analiza las variaciones de poder antes de forjar tu decisión
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid Comparativa: Equipado Actual VS Seleccionado */}
              {(() => {
                const currentEquipped = equipped[selectedItem.type];
                const currentRarity = currentEquipped ? (RARITIES[currentEquipped.rarity] || RARITIES.comun) : null;
                const candidateRarity = RARITIES[selectedItem.rarity] || RARITIES.comun;
                const setAnalysis = getSetImpactAnalysis(selectedItem);

                const currentPwr = calculateItemPower(currentEquipped);
                const candidatePwr = calculateItemPower(selectedItem);
                const deltaPwr = candidatePwr - currentPwr;

                // Estadísticas para comparar (Físicas y Mágicas divididas)
                const statKeys = [
                  { key: 'patk', label: 'ATQ Físico (PATK)' },
                  { key: 'matk', label: 'ATQ Mágico (MATK)' },
                  { key: 'pdef', label: 'DEF Física (PDEF)' },
                  { key: 'mdef', label: 'DEF Mágica (MDEF)' },
                  { key: 'hp', label: 'Vida (HP)' },
                  { key: 'spd', label: 'Velocidad (VEL)' },
                  { key: 'crit', label: 'Prob. Crítica (CRÍT)', isPercent: true }
                ];

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* LADO IZQUIERDO: OBJETO ACTUALMENTE EQUIPADO */}
                      <div className={`p-4 rounded-2xl border ${
                        currentEquipped 
                           ? `${currentRarity.border} ${currentRarity.bg}` 
                          : 'border-dashed border-white/20 bg-black/40'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">
                            Equipado Actualmente
                          </span>
                          {currentEquipped && (
                            <span className="text-[10px] font-mono text-amber-300 font-bold">
                              ⚡ {currentPwr}
                            </span>
                          )}
                        </div>

                        {currentEquipped ? (
                          <>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                                {renderSlotIcon(currentEquipped.type, 18)}
                              </div>
                              <div className="min-w-0">
                                <h4 className={`text-xs sm:text-sm font-bold truncate ${currentRarity.color}`}>
                                  {currentEquipped.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-gray-400">
                                    {currentRarity.name}
                                  </span>
                                  {currentEquipped.categoryTag && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/60 border border-white/10 text-cyan-300 font-bold">
                                      {currentEquipped.categoryTag}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight mb-3">
                              {currentEquipped.desc}
                            </p>

                            {/* Conjunto */}
                            {currentEquipped.setId && EQUIPMENT_SETS[currentEquipped.setId] && (
                              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-gray-300 mb-2 flex items-center gap-1.5">
                                {renderSetIcon(currentEquipped.setId, 12)}
                                <span>{EQUIPMENT_SETS[currentEquipped.setId].name}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-8 text-center text-gray-500 text-xs">
                            <Shield size={24} className="mx-auto mb-1 opacity-40" />
                            <span>Slot Desocupado</span>
                            <p className="text-[10px] text-gray-600 mt-1">Cualquier bonificación será una ganancia neta.</p>
                          </div>
                        )}
                      </div>

                      {/* LADO DERECHO: NUEVO OBJETO SELECCIONADO */}
                      <div className={`p-4 rounded-2xl border ${candidateRarity.border} ${candidateRarity.bg} ring-1 ring-cyan-400/40`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-300">
                            Objeto Nuevo
                          </span>
                          <span className="text-[10px] font-mono text-amber-300 font-bold">
                            ⚡ {candidatePwr}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-black/50 border border-cyan-400/40 flex items-center justify-center shrink-0">
                            {renderSlotIcon(selectedItem.type, 18)}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`text-xs sm:text-sm font-bold truncate ${candidateRarity.color}`}>
                              {selectedItem.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-gray-400">
                                {candidateRarity.name}
                              </span>
                              {selectedItem.categoryTag && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold">
                                  {selectedItem.categoryTag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight mb-3">
                          {selectedItem.desc}
                        </p>

                        {/* Conjunto */}
                        {selectedItem.setId && EQUIPMENT_SETS[selectedItem.setId] && (
                          <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[10px] text-purple-300 mb-2 flex items-center gap-1.5 font-medium">
                            {renderSetIcon(selectedItem.setId, 12)}
                            <span>{EQUIPMENT_SETS[selectedItem.setId].name}</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Resumen de Deltas Estadísticos */}
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap size={14} className="text-cyan-400" /> Diferencial de Atributos
                        </span>
                        
                        {/* Diferencia en Poder */}
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                          <span className="text-gray-400">Poder Cósmico:</span>
                          <span className={`px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                            deltaPwr > 0 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                              : deltaPwr < 0 
                              ? 'bg-red-950 text-red-400 border border-red-500/40' 
                              : 'bg-white/10 text-gray-300'
                          }`}>
                            {deltaPwr > 0 ? `+${deltaPwr}` : deltaPwr}
                            {deltaPwr > 0 ? <ArrowUp size={12} /> : deltaPwr < 0 ? <ArrowDown size={12} /> : null}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {statKeys.map(({ key, label, isPercent }) => {
                          const currVal = currentEquipped ? (currentEquipped[key] || 0) : 0;
                          const candVal = selectedItem[key] || 0;
                          const delta = isPercent ? Math.round((candVal - currVal) * 100) : (candVal - currVal);

                          if (currVal === 0 && candVal === 0) return null;

                          return (
                            <div 
                              key={key}
                              className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] text-xs font-mono"
                            >
                              <span className="text-gray-300">{label}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400">
                                  {isPercent ? `${Math.round(currVal * 100)}%` : currVal}
                                </span>
                                <ArrowRight size={13} className="text-gray-500" />
                                <span className="font-bold text-white">
                                  {isPercent ? `${Math.round(candVal * 100)}%` : candVal}
                                </span>
                                
                                {/* Delta Badge */}
                                <span className={`min-w-[48px] text-right font-bold flex items-center justify-end gap-0.5 ${
                                  delta > 0 
                                    ? 'text-emerald-400' 
                                    : delta < 0 
                                    ? 'text-rose-400' 
                                    : 'text-gray-500'
                                }`}>
                                  {delta > 0 ? `+${delta}${isPercent ? '%' : ''}` : `${delta}${isPercent ? '%' : ''}`}
                                  {delta > 0 ? <ArrowUp size={11} /> : delta < 0 ? <ArrowDown size={11} /> : null}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Impacto en Conjuntos Cósmicos */}
                    {setAnalysis && (setAnalysis.activatedBonuses.length > 0 || setAnalysis.brokenBonuses.length > 0) && (
                      <div className="space-y-2">
                        {setAnalysis.activatedBonuses.map((act, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5 text-xs text-emerald-300 animate-fadeIn">
                            <Sparkles size={16} className="text-emerald-400 shrink-0" />
                            <div>
                              <span className="font-bold uppercase tracking-wider block text-[10px] text-emerald-400">
                                ¡Activará Bonificación de Conjunto!
                              </span>
                              <span>{act.setName}: <strong>{act.title}</strong> ({act.desc})</span>
                            </div>
                          </div>
                        ))}

                        {setAnalysis.brokenBonuses.map((brk, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-2.5 text-xs text-rose-300 animate-fadeIn">
                            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                            <div>
                              <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400">
                                Aviso: Se desactivará un bono de conjunto
                              </span>
                              <span>Se perderá el bono de <strong>{brk.setName}</strong> ({brk.title}).</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botones de Acción (Sticky al pie en móvil) */}
                    <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur-md pt-3 pb-1 border-t border-white/10 mt-3 -mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center justify-end gap-3 z-10">
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs transition-all"
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={() => handleEquip(selectedItem)}
                        className="btn-mystic px-5 sm:px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                      >
                        <Shield size={16} />
                        {currentEquipped ? 'Reemplazar y Equipar' : 'Equipar Reliquia'}
                      </button>
                    </div>

                  </div>
                );
              })()}

            </div>
          </div>
        )}

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
