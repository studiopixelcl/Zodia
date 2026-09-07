'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Zap,
  Flame,
  Heart,
  X,
  ChevronRight,
  Check,
  Lock,
  ArrowUpCircle,
  ShoppingBag,
  Info,
  Swords,
  Plus
} from 'lucide-react';
import {
  ASTRAL_PETS_CATALOG,
  ALCHEMY_CONSUMABLES_CATALOG,
  getHeroActivePet,
  levelUpPet,
  equipPet,
  unlockPet,
  buyConsumableItem
} from './rpg-data';

export default function PetSanctuaryModal({ hero, onClose, onUpdateHero }) {
  const [activeTab, setActiveTab] = useState('pets'); // 'pets' | 'alchemy'
  const [selectedPetId, setSelectedPetId] = useState(hero?.activePetId || 'pet_phoenix');
  const [actionFeedback, setActionFeedback] = useState(null);

  if (!hero) return null;

  const currentActivePet = getHeroActivePet(hero);
  const userPets = hero.pets || [];
  const polvo = hero.polvoEstelar || 0;

  // Encontrar datos de la mascota seleccionada
  const selectedCatalog = ASTRAL_PETS_CATALOG.find(p => p.id === selectedPetId) || ASTRAL_PETS_CATALOG[0];
  const userSelectedPet = userPets.find(p => p.id === selectedPetId);
  const isUnlocked = Boolean(userSelectedPet);
  const isEquipped = hero.activePetId === selectedPetId;
  const currentLevel = userSelectedPet?.level || 1;
  const upgradeCost = currentLevel * 75;

  const showFeedback = (msg, success = true) => {
    setActionFeedback({ msg, success });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleEquip = (petId) => {
    const updated = equipPet(hero, petId);
    onUpdateHero(updated);
    showFeedback('¡Compañero astral equipado con éxito!');
  };

  const handleLevelUp = (petId) => {
    const res = levelUpPet(hero, petId);
    if (res.success) {
      onUpdateHero(res.hero);
      showFeedback(res.message);
    } else {
      showFeedback(res.message, false);
    }
  };

  const handleUnlock = (petId) => {
    const res = unlockPet(hero, petId, 200);
    if (res.success) {
      onUpdateHero(res.hero);
      showFeedback(res.message);
    } else {
      showFeedback(res.message, false);
    }
  };

  const handleBuyConsumable = (itemId) => {
    const res = buyConsumableItem(hero, itemId, 1);
    if (res.success) {
      onUpdateHero(res.hero);
      showFeedback(res.message);
    } else {
      showFeedback(res.message, false);
    }
  };

  // Cálculo de estadísticas proyectadas para la mascota seleccionada
  const levelMult = isUnlocked ? (1 + (currentLevel - 1) * 0.15) : 1.0;
  const nextLevelMult = 1 + currentLevel * 0.15;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#161224] via-[#0d0a18] to-[#080611] text-zinc-100 shadow-2xl shadow-purple-950/50 flex flex-col overflow-hidden my-auto max-h-[92vh] animate-scaleUp">
        {/* Encabezado Superior */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20 bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
              🐾
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200">
                Santuario de Mascotas & Alquimia
              </h2>
              <p className="text-xs text-zinc-400">
                Compañeros astrales con habilidades autónomas y boticario cósmico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Balance de Polvo Estelar */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-bold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{polvo} Polvo Estelar</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas: Mascotas vs Alquimia */}
        <div className="flex border-b border-white/5 bg-black/30 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('pets')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'pets'
                ? 'border-purple-400 text-purple-200 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>🐾 Mascotas Astrales</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-normal">
              {userPets.length}/{ASTRAL_PETS_CATALOG.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('alchemy')}
            className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'alchemy'
                ? 'border-amber-400 text-amber-200 shadow-sm'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>🎒 Boticario & Mochila Táctica</span>
          </button>
        </div>

        {/* Feedback Notificación */}
        {actionFeedback && (
          <div
            className={`mx-6 mt-3 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
              actionFeedback.success
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{actionFeedback.msg}</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'pets' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LISTA DE MASCOTAS (IZQUIERDA) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Bestias del Cosmos
                </div>
                <div className="space-y-2.5">
                  {ASTRAL_PETS_CATALOG.map((pet) => {
                    const owned = userPets.find(p => p.id === pet.id);
                    const isActive = hero.activePetId === pet.id;
                    const isSelected = selectedPetId === pet.id;

                    return (
                      <div
                        key={pet.id}
                        onClick={() => setSelectedPetId(pet.id)}
                        className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-400/80 bg-purple-950/40 shadow-lg shadow-purple-950/40 ring-1 ring-purple-400/30'
                            : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${pet.badgeColor} shadow-inner`}>
                            {pet.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-zinc-100 group-hover:text-purple-200 transition-colors">
                                {pet.name}
                              </span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                  Activa
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                              <span className="capitalize">{pet.element}</span>
                              <span>•</span>
                              {owned ? (
                                <span className="text-purple-300 font-semibold">Nvl. {owned.level}</span>
                              ) : (
                                <span className="text-zinc-500 flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Bloqueada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-purple-300 transition-transform ${isSelected ? 'translate-x-1 text-purple-400' : ''}`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DETALLES DE MASCOTA SELECCIONADA (DERECHA) */}
              <div className="lg:col-span-7 bg-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
                <div>
                  {/* Vista Previa y Pedestal */}
                  <div className="relative flex flex-col items-center justify-center py-6">
                    <div className="absolute inset-0 bg-radial-gradient from-purple-500/10 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Pedestal Brillante */}
                    <div className="relative">
                      <div className="text-6xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] cursor-default select-none animate-bounce" style={{ animationDuration: '3s' }}>
                        {selectedCatalog.icon}
                      </div>
                      <div className="w-24 h-4 bg-purple-500/20 rounded-full blur-md mx-auto mt-2" />
                    </div>

                    <h3 className="text-xl font-black text-zinc-100 mt-4 text-center">
                      {selectedCatalog.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${selectedCatalog.badgeColor}`}>
                        {selectedCatalog.rarity.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                        Elemento: {selectedCatalog.element}
                      </span>
                      {isUnlocked && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-xs text-purple-300 font-bold">
                          Nivel {currentLevel}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 text-center max-w-md mt-3 italic">
                      "{selectedCatalog.lore}"
                    </p>
                  </div>

                  {/* Caja de Habilidad Autónoma de Combate */}
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-pink-950/20 to-purple-950/30 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                          Habilidad Autónoma: {selectedCatalog.passiveName}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                        Cada {selectedCatalog.intervalTurns} turnos
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                      {selectedCatalog.passiveDesc}
                    </p>
                  </div>

                  {/* Atributos Pasivos Otorgados */}
                  <div className="mt-4">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      Bonos al Héroe {isUnlocked ? `(Nivel ${currentLevel})` : '(Base)'}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {Object.entries(selectedCatalog.bonusStats).map(([stat, val]) => {
                        const curVal = isUnlocked
                          ? (stat === 'crit' ? +(val + (currentLevel - 1) * 0.01).toFixed(3) : Math.round(val * levelMult))
                          : val;
                        const nextVal = stat === 'crit' ? +(val + currentLevel * 0.01).toFixed(3) : Math.round(val * nextLevelMult);

                        let label = stat.toUpperCase();
                        let statColor = 'text-purple-300';
                        if (stat === 'hp') { label = 'Vida'; statColor = 'text-emerald-400'; }
                        if (stat === 'patk') { label = 'Atq. Fís.'; statColor = 'text-red-400'; }
                        if (stat === 'matk') { label = 'Atq. Mág.'; statColor = 'text-indigo-400'; }
                        if (stat === 'pdef') { label = 'Def. Fís.'; statColor = 'text-amber-400'; }
                        if (stat === 'mdef') { label = 'Def. Mág.'; statColor = 'text-blue-400'; }
                        if (stat === 'spd') { label = 'Velocidad'; statColor = 'text-sky-400'; }
                        if (stat === 'crit') { label = 'Crítico'; statColor = 'text-yellow-400'; }

                        return (
                          <div key={stat} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col">
                            <span className="text-[11px] text-zinc-400">{label}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`font-black text-sm ${statColor}`}>
                                +{stat === 'crit' ? `${Math.round(curVal * 100)}%` : curVal}
                              </span>
                              {isUnlocked && (
                                <span className="text-[10px] text-zinc-500">
                                  → +{stat === 'crit' ? `${Math.round(nextVal * 100)}%` : nextVal}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Acciones Inferiores */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  {isUnlocked ? (
                    <>
                      <button
                        onClick={() => handleLevelUp(selectedPetId)}
                        disabled={polvo < upgradeCost}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          polvo >= upgradeCost
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        <span>Subir a Nivel {currentLevel + 1}</span>
                        <span className="px-2 py-0.5 rounded-md bg-black/40 text-[10px] font-normal">
                          {upgradeCost} Polvo
                        </span>
                      </button>

                      {isEquipped ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                          <Check className="w-4 h-4" />
                          <span>Mascota Activa en Batalla</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquip(selectedPetId)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                        >
                          <Swords className="w-4 h-4" />
                          <span>Equipar como Compañero</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        Esta bestia celestial aún duerme en el firmamento.
                      </span>
                      <button
                        onClick={() => handleUnlock(selectedPetId)}
                        disabled={polvo < 200}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          polvo >= 200
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/30 cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Despertar Mascota (200 Polvo Estelar)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* PESTAÑA BOTICARIO & CONSUMIBLES */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-amber-200">
                    Boticario Astral & Mochila de Alquimia
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Artículos tácticos de uso libre o instantáneo en el campo de batalla.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALCHEMY_CONSUMABLES_CATALOG.map((item) => {
                  const ownedCount = hero.consumables?.[item.id] || 0;
                  const canAfford = polvo >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner">
                              {item.icon}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-zinc-100 group-hover:text-amber-200 transition-colors">
                                {item.name}
                              </h5>
                              <span className="text-[10px] text-zinc-400 font-medium">
                                {item.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
                              x{ownedCount}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.cost} Polvo</span>
                        </div>

                        <button
                          onClick={() => handleBuyConsumable(item.id)}
                          disabled={!canAfford}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Comprar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
