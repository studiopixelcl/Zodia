"use client";
import React, { useState } from 'react';
import { 
  X, Package, Sword, Shield, Sparkles, Coins, 
  Check, ArrowUpRight, Gift, Star 
} from 'lucide-react';
import { RARITIES, EQUIPMENT_CATALOG } from './rpg-data';
import { playLootChestSound, playBattleShieldSound } from '../../../lib/sound-effects';

export function LootInventoryModal({ isOpen, onClose, hero, onUpdateHero }) {
  const [filter, setFilter] = useState('all'); // all, weapon, armor, relic
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonResult, setSummonResult] = useState(null);

  if (!isOpen || !hero) return null;

  const inventory = hero.inventory || [];
  const equipped = hero.equipped || {};

  const filteredItems = inventory.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const handleEquip = (item) => {
    const prevEquipped = equipped[item.type];
    const newInventory = inventory.filter(i => i.id !== item.id);
    if (prevEquipped) {
      newInventory.push(prevEquipped);
    }

    const updatedHero = {
      ...hero,
      equipped: {
        ...equipped,
        [item.type]: item
      },
      inventory: newInventory
    };

    playBattleShieldSound();
    onUpdateHero(updatedHero);
    setSelectedItem(null);
  };

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
    setSelectedItem(null);
  };

  // Abrir cofre celestial gastando Polvo Estelar
  const handleOpenChest = () => {
    const cost = 80;
    if ((hero.polvoEstelar || 0) < cost) {
      alert('Necesitas al menos 80 de Polvo Estelar para abrir un Cofre Celestial.');
      return;
    }

    setIsSummoning(true);
    setSummonResult(null);

    setTimeout(() => {
      // Ponderación de rareza
      const roll = Math.random();
      let pool = [];
      if (roll < 0.10) {
        // 10% Legendario
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'legendario');
      } else if (roll < 0.35) {
        // 25% Épico
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'epico');
      } else if (roll < 0.70) {
        // 35% Raro
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'raro');
      } else {
        // 30% Común
        pool = EQUIPMENT_CATALOG.filter(i => i.rarity === 'comun');
      }

      const randomItem = pool[Math.floor(Math.random() * pool.length)] || EQUIPMENT_CATALOG[0];

      // Añadir al inventario con ID único
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel bg-gradient-to-b from-gray-950 via-purple-950/40 to-black border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Package size={20} />
            </div>
            <div>
              <h3 className="mystic-font text-lg text-white font-bold">ALMACÉN DE RELIQUIAS</h3>
              <p className="text-xs text-gray-400">Gestiona tu equipo celestial y forja tu destino</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Polvo Estelar y Acción de Cofre */}
        <div className="my-4 p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black border border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={20} className="text-amber-400" />
            <div>
              <span className="text-xs text-gray-300 font-medium">Polvo Estelar:</span>
              <span className="ml-1.5 text-sm font-bold text-amber-300 font-mono">{hero.polvoEstelar || 0}</span>
            </div>
          </div>

          <button
            onClick={handleOpenChest}
            disabled={isSummoning || (hero.polvoEstelar || 0) < 80}
            className="btn-mystic px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Gift size={15} />
            {isSummoning ? 'Invocando...' : 'Cofre Astral (80)'}
          </button>
        </div>

        {/* Modal de resultado de invocación */}
        {summonResult && (
          <div className="mb-4 p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                <Star size={20} className="animate-spin" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">¡Nueva Reliquia Obtenida!</span>
                <h4 className={`text-xs font-bold ${RARITIES[summonResult.rarity]?.color}`}>
                  {summonResult.name}
                </h4>
                <p className="text-[10px] text-gray-300">{summonResult.desc}</p>
              </div>
            </div>
            <button 
              onClick={() => handleEquip(summonResult)}
              className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold uppercase tracking-wider hover:bg-cyan-400 transition-colors"
            >
              Equipar
            </button>
          </div>
        )}

        {/* Filtros de Categoría */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'weapon', label: 'Armas' },
            { id: 'armor', label: 'Armaduras' },
            { id: 'relic', label: 'Reliquias' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
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

        {/* Lista de Ítems */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">
              No tienes objetos en esta categoría. ¡Abre un Cofre Astral o supera las 12 Casas!
            </div>
          ) : (
            filteredItems.map(item => {
              const rarityMeta = RARITIES[item.rarity] || RARITIES['comun'];
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-2xl bg-white/5 border ${rarityMeta.border} hover:border-cyan-400 transition-all flex items-center justify-between cursor-pointer group`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/80 group-hover:scale-105 transition-transform">
                      {item.type === 'weapon' && <Sword size={18} className="text-orange-400" />}
                      {item.type === 'armor' && <Shield size={18} className="text-blue-400" />}
                      {item.type === 'relic' && <Sparkles size={18} className="text-purple-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${rarityMeta.color}`}>
                          {item.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 font-light">
                          {rarityMeta.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                        {item.desc}
                      </p>
                      {/* Atributos */}
                      <div className="flex gap-3 text-[10px] font-mono text-cyan-300 mt-1">
                        {item.atk && <span>+ATK {item.atk}</span>}
                        {item.hp && <span>+HP {item.hp}</span>}
                        {item.def && <span>+DEF {item.def}</span>}
                        {item.spd && <span>+VEL {item.spd}</span>}
                        {item.crit && <span>+CRÍT {Math.round(item.crit * 100)}%</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEquip(item);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-1"
                  >
                    Equipar
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
