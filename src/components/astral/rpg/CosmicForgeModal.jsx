"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Flame, Sparkles, Shield, Sword, Package, ArrowRight, 
  CheckCircle2, AlertTriangle, Hammer, Moon, Sun, Wind, 
  RefreshCw, Trash2, Layers, Check, Coins, Zap, ShieldAlert
} from 'lucide-react';
import { 
  UPGRADE_CONFIG, 
  ASTRAL_GEMS, 
  DISMANTLE_RATES, 
  RARITIES, 
  EQUIPMENT_CATALOG,
  refineEquipmentItem, 
  enchantEquipmentItem, 
  dismantleEquipmentItems, 
  transmuteEquipmentItems 
} from './rpg-data';
import { getItemEffectiveStats } from './rpg-engine';
import { playBattleShieldSound, playBattleVictorySound, playIncomingChimeSound } from '../../../lib/sound-effects';

export function CosmicForgeModal({ isOpen, onClose, hero, onUpdateHero }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('refine'); // 'refine' | 'enchant' | 'alchemy'
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedGemId, setSelectedGemId] = useState(ASTRAL_GEMS[0].id);
  const [selectedForDismantle, setSelectedForDismantle] = useState([]);
  const [selectedForTransmute, setSelectedForTransmute] = useState([]);
  const [isForging, setIsForging] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Selección inicial
  useEffect(() => {
    if (isOpen && hero) {
      const firstEquipped = hero.equipped?.weapon || hero.equipped?.armor || hero.equipped?.relic || hero.inventory?.[0];
      if (firstEquipped && !selectedItemId) {
        setSelectedItemId(firstEquipped.id);
      }
    }
  }, [isOpen, hero]);

  if (!isOpen || !hero || !mounted) return null;

  // Lista de todos los ítems disponibles (equipados + inventario)
  const allItems = [];
  if (hero.equipped?.weapon) allItems.push({ ...hero.equipped.weapon, isEquipped: true, slot: 'weapon' });
  if (hero.equipped?.armor) allItems.push({ ...hero.equipped.armor, isEquipped: true, slot: 'armor' });
  if (hero.equipped?.relic) allItems.push({ ...hero.equipped.relic, isEquipped: true, slot: 'relic' });
  (hero.inventory || []).forEach(item => {
    allItems.push({ ...item, isEquipped: false });
  });

  const currentSelectedItem = allItems.find(i => i.id === selectedItemId) || allItems[0];

  // Manejar Refinamiento
  const handleRefine = () => {
    if (!currentSelectedItem || isForging) return;
    const currentLevel = currentSelectedItem.upgradeLevel || 0;
    const step = UPGRADE_CONFIG.levels[currentLevel];
    if (!step) return;

    if ((hero.polvoEstelar || 0) < step.cost) {
      setFeedback({ type: 'error', text: `Necesitas ${step.cost} de Polvo Estelar.` });
      return;
    }

    setIsForging(true);
    setFeedback(null);

    setTimeout(() => {
      const res = refineEquipmentItem(hero, currentSelectedItem.id);
      setIsForging(false);
      if (res.success) {
        playBattleVictorySound();
        onUpdateHero(res.hero);
        setFeedback({ type: 'success', text: res.message });
      } else {
        playBattleShieldSound();
        onUpdateHero(res.hero);
        setFeedback({ type: 'warning', text: res.message });
      }
    }, 700);
  };

  // Manejar Encantamiento
  const handleEnchant = () => {
    if (!currentSelectedItem || !selectedGemId) return;
    const gem = ASTRAL_GEMS.find(g => g.id === selectedGemId);
    if (!gem) return;

    if ((hero.polvoEstelar || 0) < gem.cost) {
      setFeedback({ type: 'error', text: `Necesitas ${gem.cost} de Polvo Estelar.` });
      return;
    }

    const res = enchantEquipmentItem(hero, currentSelectedItem.id, selectedGemId);
    if (res.success) {
      playIncomingChimeSound();
      onUpdateHero(res.hero);
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // Manejar Desmontaje
  const handleDismantle = () => {
    if (selectedForDismantle.length === 0) return;
    const res = dismantleEquipmentItems(hero, selectedForDismantle);
    if (res.success) {
      playBattleShieldSound();
      onUpdateHero(res.hero);
      setSelectedForDismantle([]);
      setFeedback({ type: 'success', text: res.message });
    }
  };

  // Manejar Fusión/Transmutación
  const handleTransmute = () => {
    if (selectedForTransmute.length !== 3) return;
    const res = transmuteEquipmentItems(hero, selectedForTransmute);
    if (res.success) {
      playBattleVictorySound();
      onUpdateHero(res.hero);
      setSelectedForTransmute([]);
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // Helpers de selección rápida para desmontaje
  const toggleSelectDismantle = (id) => {
    setSelectedForDismantle(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllByRarity = (rarity) => {
    const ids = (hero.inventory || [])
      .filter(i => i.rarity === rarity && !i.isEquipped)
      .map(i => i.id);
    setSelectedForDismantle(prev => Array.from(new Set([...prev, ...ids])));
  };

  const clearDismantleSelection = () => {
    setSelectedForDismantle([]);
  };

  // Cálculo de polvo total a ganar en desmontaje
  const totalDismantlePolvo = selectedForDismantle.reduce((acc, id) => {
    const it = (hero.inventory || []).find(i => i.id === id);
    if (!it) return acc;
    const base = DISMANTLE_RATES[it.rarity] || 25;
    const bonus = (it.upgradeLevel || 0) * 15;
    return acc + base + bonus;
  }, 0);

  // Estadísticas actuales vs siguientes para el ítem seleccionado
  const currentLevel = currentSelectedItem?.upgradeLevel || 0;
  const nextStep = UPGRADE_CONFIG.levels[currentLevel];
  const currentEffective = currentSelectedItem ? getItemEffectiveStats(currentSelectedItem) : null;
  const nextEffective = currentSelectedItem && nextStep ? getItemEffectiveStats({
    ...currentSelectedItem,
    upgradeLevel: currentLevel + 1
  }) : null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className="relative w-full max-w-3xl bg-gradient-to-b from-slate-900 via-orange-950/30 to-slate-950 border border-orange-500/40 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_50px_rgba(249,115,22,0.2)] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-orange-500/30 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 font-serif">
                Forja Cósmica y Alquimia
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {hero.polvoEstelar || 0} Polvo Estelar
                </span>
              </h2>
              <p className="text-xs text-orange-300/80 mt-0.5">
                Refina tu equipamiento (+1 a +10), engarza gemas elementales o recicla piezas duplicadas.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de la Forja */}
        <div className="flex border-b border-orange-500/20 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => { setActiveTab('refine'); setFeedback(null); }}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'refine'
                ? 'border-orange-400 text-orange-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="w-4 h-4" />
            Refinamiento (+1 a +10)
          </button>
          <button
            onClick={() => { setActiveTab('enchant'); setFeedback(null); }}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'enchant'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Encantamiento con Gemas
          </button>
          <button
            onClick={() => { setActiveTab('alchemy'); setFeedback(null); }}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'alchemy'
                ? 'border-emerald-400 text-emerald-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Alquimia y Reciclaje
          </button>
        </div>

        {/* Notificación de feedback */}
        {feedback && (
          <div className={`mx-4 mt-3 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
            feedback.type === 'success' 
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
              : feedback.type === 'warning'
                ? 'bg-amber-950/80 border border-amber-500/50 text-amber-200'
                : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
          }`}>
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {feedback.type === 'error' && <X className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar">

          {/* ================= PESTAÑA 1: REFINAMIENTO (+1 a +10) ================= */}
          {activeTab === 'refine' && (
            <div className="space-y-4">
              {/* Selector horizontal de piezas */}
              <div>
                <p className="text-xs font-medium text-slate-300 mb-2">Selecciona la pieza a forjar:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {allItems.map(item => {
                    const isSelected = item.id === selectedItemId;
                    const r = RARITIES[item.rarity] || RARITIES['comun'];
                    const lvl = item.upgradeLevel || 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedItemId(item.id); setFeedback(null); }}
                        className={`p-2.5 rounded-xl border text-left min-w-[140px] shrink-0 transition-all ${
                          isSelected
                            ? 'border-orange-400 bg-orange-950/40 ring-2 ring-orange-400/40 shadow-lg shadow-orange-500/10'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${r.badge}`}>
                            {item.rarity.toUpperCase()}
                          </span>
                          {item.isEquipped && (
                            <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                              EQUIPADO
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <div className="flex items-center justify-between mt-1 text-[11px]">
                          <span className="text-amber-400 font-mono font-bold">
                            {lvl > 0 ? `+${lvl}` : '+0'}
                          </span>
                          {item.enchantment && (
                            <span className="text-[10px] text-cyan-300">💎 Encantado</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Panel de Yunque y Estadísticas de la pieza seleccionada */}
              {currentSelectedItem && (
                <div className="bg-slate-900/80 border border-orange-500/30 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                          {currentSelectedItem.name}
                        </h3>
                        <span className="text-sm font-bold text-amber-400 font-mono px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                          {currentLevel > 0 ? `+${currentLevel}` : '+0'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{currentSelectedItem.desc}</p>
                    </div>

                    {/* Barra de Progreso de Nivel (+X de 10) */}
                    <div className="w-full sm:w-44 text-right">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Nivel de Forja</span>
                        <span className="text-amber-300 font-bold">{currentLevel} / 10</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                          style={{ width: `${(currentLevel / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Comparación de Estadísticas: Actual -> Siguiente */}
                  <div className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Ataque</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-white">{currentEffective?.atk || 0}</span>
                        {nextEffective && nextEffective.atk > (currentEffective?.atk || 0) && (
                          <>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {nextEffective.atk}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Defensa</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-white">{currentEffective?.def || 0}</span>
                        {nextEffective && nextEffective.def > (currentEffective?.def || 0) && (
                          <>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {nextEffective.def}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Vida Máx.</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-white">{currentEffective?.hp || 0}</span>
                        {nextEffective && nextEffective.hp > (currentEffective?.hp || 0) && (
                          <>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              {nextEffective.hp}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Velocidad / Crítico</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-white">
                          +{currentEffective?.spd || 0} / {Math.round((currentEffective?.crit || 0) * 100)}%
                        </span>
                        {nextEffective && (
                          <>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400 font-mono">
                              +{nextEffective.spd} / {Math.round((nextEffective.crit || 0) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel de Acción de Forja */}
                  {currentLevel < 10 ? (
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 block">Coste en Polvo:</span>
                          <span className="font-bold text-amber-300 font-mono text-sm">
                            {nextStep.cost} Polvo Estelar
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Probabilidad de Éxito:</span>
                          <span className={`font-bold font-mono text-sm ${
                            nextStep.successRate === 1.0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {Math.round(nextStep.successRate * 100)}%
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleRefine}
                        disabled={isForging || (hero.polvoEstelar || 0) < nextStep.cost}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                          isForging 
                            ? 'bg-orange-600 text-white animate-pulse cursor-wait'
                            : (hero.polvoEstelar || 0) < nextStep.cost
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/20 active:scale-95'
                        }`}
                      >
                        <Hammer className={`w-4 h-4 ${isForging ? 'animate-spin' : ''}`} />
                        {isForging ? 'Forjando...' : `¡Refinar a +${currentLevel + 1}!`}
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-800 text-center text-amber-300 font-bold text-xs">
                      ★ ¡Esta pieza ha alcanzado el Nivel Máximo Soberano (+10)! ★
                    </div>
                  )}

                  {/* Nota de protección */}
                  <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                    Protección Cósmica: En caso de fallo, tu objeto nunca se destruye ni baja de nivel.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= PESTAÑA 2: ENCANTAMIENTOS ================= */}
          {activeTab === 'enchant' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Engarce de Gemas Elementales
                  </h4>
                  <p className="text-xs text-cyan-300/80 mt-0.5">
                    Pieza seleccionada: <strong className="text-white">{currentSelectedItem?.name || 'Ninguna'}</strong>
                    {currentSelectedItem?.enchantment && (
                      <span className="text-emerald-400 font-bold ml-1">
                        (Actualmente: {currentSelectedItem.enchantment.name})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Selector de Gemas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ASTRAL_GEMS.map(gem => {
                  const isSelected = gem.id === selectedGemId;

                  return (
                    <div
                      key={gem.id}
                      onClick={() => { setSelectedGemId(gem.id); setFeedback(null); }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
                          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${gem.color}`}>
                          {gem.name}
                        </span>
                        <span className="text-xs font-mono text-amber-300 font-bold">
                          {gem.cost} Polvo
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium mb-1">{gem.passiveDesc}</p>
                      <p className="text-[11px] text-slate-400 italic">{gem.flavor}</p>
                    </div>
                  );
                })}
              </div>

              {/* Botón de Aplicación de Encanto */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleEnchant}
                  disabled={!currentSelectedItem || (hero.polvoEstelar || 0) < 110}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Engarzar Gema en {currentSelectedItem?.name} (110 Polvo)
                </button>
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 3: ALQUIMIA Y RECICLAJE ================= */}
          {activeTab === 'alchemy' && (
            <div className="space-y-4">
              {/* Sección de Desmontaje */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-emerald-400" />
                      Desmontaje de Equipamiento Duplicado
                    </h4>
                    <p className="text-xs text-slate-400">
                      Desintegra objetos sobrantes del inventario para recuperar Polvo Estelar.
                    </p>
                  </div>

                  <div className="flex gap-1.5 text-[10px]">
                    <button
                      onClick={() => selectAllByRarity('comun')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      + Comunes
                    </button>
                    <button
                      onClick={() => selectAllByRarity('raro')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      + Raros
                    </button>
                    <button
                      onClick={clearDismantleSelection}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Grid de ítems del inventario para desmontar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {(hero.inventory || []).length === 0 ? (
                    <p className="col-span-full text-center py-4 text-xs text-slate-500">
                      No tienes objetos en el inventario para desmontar.
                    </p>
                  ) : (
                    (hero.inventory || []).map(item => {
                      const isSelected = selectedForDismantle.includes(item.id);
                      const r = RARITIES[item.rarity] || RARITIES['comun'];
                      const polvoGain = (DISMANTLE_RATES[item.rarity] || 25) + ((item.upgradeLevel || 0) * 15);

                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelectDismantle(item.id)}
                          className={`p-2 rounded-xl border cursor-pointer text-left transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-400'
                              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-bold px-1 rounded ${r.badge}`}>
                              {item.rarity.toUpperCase()}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <span className="text-[10px] text-amber-300 font-mono block mt-1">
                            +{polvoGain} Polvo
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Barra de acción de desmontaje */}
                {selectedForDismantle.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-300">
                      Seleccionados: <strong>{selectedForDismantle.length}</strong> → Total: <strong className="text-amber-300 font-mono">+{totalDismantlePolvo} Polvo Estelar</strong>
                    </span>
                    <button
                      onClick={handleDismantle}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      Desintegrar Selección
                    </button>
                  </div>
                )}
              </div>

              {/* Sección de Fusión / Transmutación (3 a 1) */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/30">
                <div className="mb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Transmutación Cósmica (3 a 1)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Selecciona 3 piezas de la misma rareza para transmutarlas en 1 pieza de rango superior.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(hero.inventory || []).map(item => {
                    const isSelected = selectedForTransmute.includes(item.id);
                    const r = RARITIES[item.rarity] || RARITIES['comun'];

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedForTransmute(prev => prev.filter(x => x !== item.id));
                          } else if (selectedForTransmute.length < 3) {
                            setSelectedForTransmute(prev => [...prev, item.id]);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-purple-400 bg-purple-950/60 text-purple-200 ring-2 ring-purple-400/40'
                            : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className={`text-[9px] font-bold px-1 rounded mr-1 ${r.badge}`}>
                          {item.rarity[0].toUpperCase()}
                        </span>
                        {item.name}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">
                    Piezas para transmutar: <strong className="text-purple-300">{selectedForTransmute.length} / 3</strong>
                  </span>
                  <button
                    onClick={handleTransmute}
                    disabled={selectedForTransmute.length !== 3}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transmutar a Rango Superior
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-orange-500/30 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>La Forja Cósmica canaliza el calor de las supernovas estelares.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
