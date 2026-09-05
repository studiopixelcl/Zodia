"use client";
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Sword, Shield, Trophy, 
  Flame, Lock, CheckCircle2, Star, Users, Package, 
  HelpCircle, Play, ChevronRight, Zap
} from 'lucide-react';
import { HeroProfileCard } from './HeroProfileCard';
import { LootInventoryModal } from './LootInventoryModal';
import { BattleArena } from './BattleArena';
import { 
  getOrCreateHeroProfile, 
  saveHeroProfile, 
  TWELVE_HOUSES_STAGES, 
  ZODIAC_HERO_CLASSES, 
  EQUIPMENT_CATALOG,
  ELEMENTAL_AFFINITIES,
  getZodiacIcon,
  extractProfilePhoto 
} from './rpg-data';
import { getSynastryCompatibility, getDailyTransitBuff } from './rpg-engine';
import { playBattleVictorySound, playIncomingChimeSound } from '../../../lib/sound-effects';
import { apiFetch } from '../../../lib/api';

export function ChroniclesGame({ profile, onBack }) {
  const [hero, setHero] = useState(() => getOrCreateHeroProfile(profile));
  const [activeTab, setActiveTab] = useState('houses'); // 'houses' | 'shadows' | 'coop'
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [activeBattle, setActiveBattle] = useState(null); // { enemy, mode, partner }
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [realMatches, setRealMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const transitBuff = getDailyTransitBuff();

  // Sincronización con base de datos en nube y carga de vínculos reales
  useEffect(() => {
    // 1. Cargar vínculos reales para el modo coop
    async function loadMatches() {
      try {
        setLoadingMatches(true);
        const res = await apiFetch('/api/vinculos');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setRealMatches(data);
        }
      } catch (err) {
        console.error('Error cargando vínculos para RPG:', err);
      } finally {
        setLoadingMatches(false);
      }
    }

    // 2. Sincronizar perfil con la nube
    async function syncCloudProfile() {
      try {
        const res = await apiFetch('/api/rpg/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.exists && data.profile) {
            // Si la nube tiene mayor nivel o más progreso, fusionar
            setHero(prev => {
              if ((data.profile.level || 1) > (prev.level || 1) || (data.profile.maxHouseCleared || 0) > (prev.maxHouseCleared || 0)) {
                return { ...prev, ...data.profile };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Modo offline / local
      }
    }

    loadMatches();
    syncCloudProfile();
  }, []);

  // Asegurar persistencia local y sincronización con D1 cuando el héroe cambie
  useEffect(() => {
    if (!hero) return;
    saveHeroProfile(hero);

    // Guardado silencioso en nube
    const timer = setTimeout(() => {
      apiFetch('/api/rpg/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hero)
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [hero]);

  // Manejar el resultado de la batalla
  const handleBattleEnd = ({ victory, exp = 0, gold = 0, dropId = null }) => {
    if (!victory) {
      setActiveBattle(null);
      return;
    }

    let newExp = (hero.exp || 0) + exp;
    let newLevel = hero.level || 1;
    let newExpNext = hero.expNext || 150;
    let leveledUp = false;

    // Calcular subida de nivel
    while (newExp >= newExpNext && newLevel < 50) {
      newExp -= newExpNext;
      newLevel += 1;
      newExpNext = Math.round(newExpNext * 1.35);
      leveledUp = true;
    }

    let newInventory = [...(hero.inventory || [])];
    let droppedItem = null;
    if (dropId) {
      const found = EQUIPMENT_CATALOG.find(i => i.id === dropId);
      if (found) {
        droppedItem = { ...found, id: `${found.id}_${Date.now()}` };
        newInventory.push(droppedItem);
      }
    }

    let newMaxHouse = hero.maxHouseCleared || 0;
    const isHouseClearedNow = activeBattle.mode === 'houses' && activeBattle.houseNumber > newMaxHouse;
    if (isHouseClearedNow) {
      newMaxHouse = activeBattle.houseNumber;
    }

    const updatedHero = {
      ...hero,
      level: newLevel,
      exp: newExp,
      expNext: newExpNext,
      polvoEstelar: (hero.polvoEstelar || 0) + gold,
      inventory: newInventory,
      maxHouseCleared: newMaxHouse
    };

    setHero(updatedHero);
    saveHeroProfile(updatedHero);
    setActiveBattle(null);

    // Enviar notificaciones in-app
    if (leveledUp) {
      playBattleVictorySound();
      setLevelUpInfo({ level: newLevel });
      setTimeout(() => setLevelUpInfo(null), 3500);

      apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '⚔️ ¡Ascenso Cósmico!',
          body: `¡Tu héroe ha alcanzado el Nivel ${newLevel} en Chronicles of the Zodia!`,
          type: 'astral'
        })
      }).catch(() => {});
    } else if (droppedItem) {
      playIncomingChimeSound();
    }

    if (isHouseClearedNow) {
      apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🏛️ ¡Casa Astral Purificada!',
          body: `Has derrotado al guardián de la Casa ${activeBattle.houseNumber} del Zodíaco.`,
          type: 'astral'
        })
      }).catch(() => {});
    }
  };

  // Iniciar batalla del Sendero de las 12 Casas
  const startHouseBattle = (stage) => {
    setActiveBattle({
      enemy: {
        ...stage,
        name: stage.guardianName,
        sign: stage.guardianSign
      },
      mode: 'houses',
      houseNumber: stage.house
    });
  };

  // Iniciar Duelo de Sombras (Modo Rápido)
  const startShadowBattle = () => {
    const signs = Object.keys(ZODIAC_HERO_CLASSES);
    const randomSign = signs[Math.floor(Math.random() * signs.length)];
    const classData = ZODIAC_HERO_CLASSES[randomSign];

    const shadowEnemy = {
      name: `Sombra de ${randomSign}`,
      sign: randomSign,
      element: classData.element,
      hp: Math.round(classData.baseStats.hp * (1 + (hero.level - 1) * 0.08)),
      atk: Math.round(classData.baseStats.atk * (1 + (hero.level - 1) * 0.08)),
      def: Math.round(classData.baseStats.def * (1 + (hero.level - 1) * 0.08)),
      spd: classData.baseStats.spd,
      rewardExp: 80 + hero.level * 20,
      rewardGold: 100 + hero.level * 25
    };

    setActiveBattle({
      enemy: shadowEnemy,
      mode: 'quick'
    });
  };

  // Iniciar Incursión Cooperativa de Sinastría
  const startCoopBattle = (allySign) => {
    const allyClass = ZODIAC_HERO_CLASSES[allySign];
    const partner = {
      name: `Aliado Astral (${allySign})`,
      sign: allySign,
      element: allyClass.element
    };

    const titanBoss = {
      name: 'Titán de la Nebulosa Oscura',
      sign: 'Ofiuco',
      element: 'Agua',
      hp: 1200 + hero.level * 150,
      atk: 75 + hero.level * 8,
      def: 35 + hero.level * 4,
      spd: 35,
      rewardExp: 350 + hero.level * 50,
      rewardGold: 400 + hero.level * 60,
      dropChance: 'wp_03'
    };

    setActiveBattle({
      enemy: titanBoss,
      mode: 'coop',
      partner
    });
  };

  // Iniciar Incursión con un Match Real de Zodia
  const startCoopBattleWithMatch = (match) => {
    const partner = {
      name: match.name,
      sign: match.sign || 'Leo',
      element: match.element || 'Fuego',
      image: match.image || match.photos?.[0] || null
    };

    const titanBoss = {
      name: 'Titán de la Nebulosa Oscura',
      sign: 'Ofiuco',
      element: 'Agua',
      hp: 1200 + hero.level * 150,
      atk: 75 + hero.level * 8,
      def: 35 + hero.level * 4,
      spd: 35,
      rewardExp: 350 + hero.level * 50,
      rewardGold: 400 + hero.level * 60,
      dropChance: 'wp_03'
    };

    setActiveBattle({
      enemy: titanBoss,
      mode: 'coop',
      partner
    });
  };

  // Si hay una batalla activa, renderizar la Arena
  if (activeBattle) {
    return (
      <div className="px-3 sm:px-6 pb-24 animate-fadeIn">
        <BattleArena 
          hero={hero}
          enemy={activeBattle.enemy}
          mode={activeBattle.mode}
          partner={activeBattle.partner}
          onBattleEnd={handleBattleEnd}
          onBack={() => setActiveBattle(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-3 sm:px-6 pb-24 animate-fadeIn">
      
      {/* Banner de Notificación de Subida de Nivel */}
      {levelUpInfo && (
        <div className="glass-panel p-4 rounded-2xl bg-gradient-to-r from-amber-500/30 via-purple-600/30 to-black border-2 border-amber-400 text-center animate-bounce shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold mystic-font text-lg">
            <Star className="animate-spin" size={24} /> ¡¡HAS SUBIDO AL NIVEL {levelUpInfo.level}!! <Star className="animate-spin" size={24} />
          </div>
          <p className="text-xs text-white mt-0.5">Tus atributos de Vida, Ataque y Defensa han aumentado permanentemente.</p>
        </div>
      )}

      {/* Cabecera Principal del Juego */}
      <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black border border-cyan-500/30 rounded-3xl">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-cyan-500/30 transition-all"
          >
            <ArrowLeft size={16} /> Volver a Arcadia
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
              RPG POR TURNOS
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="mystic-font text-2xl text-white font-bold tracking-wide flex items-center gap-2.5">
            <Sword className="text-cyan-400" size={26} /> CHRONICLES OF THE ZODIA
          </h2>
          <p className="text-xs text-gray-300 font-light mt-1 max-w-xl leading-relaxed">
            Encarna la fuerza primordial de tu signo solar. Purifica las 12 Casas Astrales, forja reliquias cósmicas y desata ataques combinados de sinastría con tus almas gemelas.
          </p>
        </div>
      </div>

      {/* Banner de Tránsito Planetario en Vivo */}
      <div className="p-4 rounded-2xl glass-panel bg-gradient-to-r from-purple-950/50 via-indigo-950/30 to-black border border-purple-500/30 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
            {transitBuff.moonGlyph}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Tránsito Lunar del Día</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                {transitBuff.phaseName}
              </span>
            </div>
            <p className="text-xs text-white font-medium mt-0.5">
              Luna en <span className="text-amber-300 font-bold">{transitBuff.moonSign}</span> ({transitBuff.moonElement})
            </p>
            <p className="text-[10px] text-gray-400 font-light">
              {transitBuff.description}
            </p>
          </div>
        </div>

        <div className="text-right pl-3 hidden sm:block">
          <span className="text-[10px] text-gray-400 block font-mono">BONO EN ARENA</span>
          <span className="text-xs font-mono font-bold text-amber-300">+15% AFINIDAD</span>
        </div>
      </div>

      {/* Resumen del Héroe */}
      <HeroProfileCard 
        hero={hero} 
        onOpenInventory={() => setIsInventoryOpen(true)} 
      />

      {/* Selector de Pestañas / Modos */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab('houses')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'houses'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20'
              : 'glass-panel text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Trophy size={16} />
          <span>12 Casas</span>
        </button>

        <button
          onClick={() => setActiveTab('shadows')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'shadows'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'glass-panel text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Sword size={16} />
          <span>Duelo 1v1</span>
        </button>

        <button
          onClick={() => setActiveTab('coop')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'coop'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-lg shadow-amber-500/20'
              : 'glass-panel text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Users size={16} />
          <span>Coop Sinastría</span>
        </button>
      </div>

      {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA */}

      {/* 1. MODO: SENDERO DE LAS 12 CASAS */}
      {activeTab === 'houses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-2">
            <div>
              <h3 className="mystic-font text-base text-white font-bold">El Sendero de las 12 Casas</h3>
              <p className="text-xs text-gray-400">Derrota a cada guardián zodiacal para avanzar en el templo.</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
              {hero.maxHouseCleared || 0} / 12 Purificadas
            </span>
          </div>

          {/* MAPA VISUAL DEL SENDERO ZODIACAL (12 CASAS EN FILA) */}
          <div className="p-3 rounded-2xl glass-panel border border-cyan-500/30 bg-black/50 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2.5 min-w-[650px] justify-between px-1">
              {TWELVE_HOUSES_STAGES.map((st) => {
                const isCleared = st.house <= (hero.maxHouseCleared || 0);
                const isCurrent = st.house === (hero.maxHouseCleared || 0) + 1;
                return (
                  <div 
                    key={st.house} 
                    className={`flex flex-col items-center gap-1 transition-all ${
                      isCurrent ? 'scale-110' : isCleared ? 'opacity-95' : 'opacity-40'
                    }`}
                  >
                    <div className={`relative w-10 h-10 rounded-xl p-1.5 flex items-center justify-center border transition-all ${
                      isCurrent 
                        ? 'border-cyan-400 bg-cyan-950/70 shadow-[0_0_12px_rgba(6,182,212,0.7)] animate-pulse' 
                        : isCleared 
                          ? 'border-emerald-500/70 bg-emerald-950/40' 
                          : 'border-white/10 bg-black/60'
                    }`}>
                      <img 
                        src={getZodiacIcon(st.guardianSign)} 
                        alt={st.guardianSign} 
                        className="w-full h-full object-contain"
                      />
                      {isCleared && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black shadow">
                          ✓
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>
                    <span className={`text-[9px] font-mono ${isCurrent ? 'text-cyan-300 font-bold' : isCleared ? 'text-emerald-400 font-medium' : 'text-gray-500'}`}>
                      C{st.house}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TWELVE_HOUSES_STAGES.map((stage) => {
              const isUnlocked = stage.house <= (hero.maxHouseCleared || 0) + 1;
              const isCleared = stage.house <= (hero.maxHouseCleared || 0);
              const stageElem = ELEMENTAL_AFFINITIES[stage.element] || ELEMENTAL_AFFINITIES['Fuego'];

              return (
                <div
                  key={stage.house}
                  className={`p-4 rounded-2xl glass-panel border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isCleared 
                      ? 'border-emerald-500/40 bg-emerald-950/10' 
                      : isUnlocked 
                        ? 'border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-b from-cyan-950/20 to-black' 
                        : 'border-white/5 opacity-50 bg-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-white/10 text-gray-300">
                          CASA {stage.house}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${stageElem.text} ${stageElem.bg}`}>
                          {stage.element}
                        </span>
                        {isCleared && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                            <CheckCircle2 size={12} /> Purificado
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mystic-font">{stage.name}</h4>
                      <p className="text-xs text-gray-300 font-light mt-0.5">{stage.guardianName}</p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-black/70 border border-white/15 flex items-center justify-center p-1.5 shadow-lg shrink-0">
                      <img 
                        src={getZodiacIcon(stage.guardianSign)} 
                        alt={stage.guardianSign} 
                        className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="text-[11px] text-gray-400 font-mono">
                      <span>{stage.hp} HP</span> • <span>+{stage.rewardExp} EXP</span>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => startHouseBattle(stage)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-cyan-400 transition-colors flex items-center gap-1 shadow-md"
                      >
                        <Play size={13} /> {isCleared ? 'Repetir' : 'Desafiar'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock size={13} /> Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MODO: DUELO DE SOMBRAS 1v1 */}
      {activeTab === 'shadows' && (
        <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 via-black to-black space-y-4">
          <div className="text-center max-w-md mx-auto">
            <div className="relative w-20 h-20 rounded-3xl bg-purple-950/40 border border-purple-500/50 p-2 flex items-center justify-center mx-auto mb-3 text-purple-300 shadow-2xl shadow-purple-900/50">
              <img 
                src={getZodiacIcon(hero.sign)} 
                alt="Sombra" 
                className="w-12 h-12 object-contain opacity-80 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.8)] animate-pulse" 
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black border border-purple-400 flex items-center justify-center text-purple-300 shadow">
                <Sword size={12} />
              </div>
            </div>
            <h3 className="mystic-font text-xl text-white font-bold mb-1">Duelo de Sombras Astrales</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-light">
              Entrena tus reflejos y prueba tus combinaciones contra la sombra de un signo aleatorio a tu nivel. Ganarás EXP y Polvo Estelar sin riesgo de perder progreso.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around text-center text-xs font-mono">
            <div>
              <span className="text-gray-400 block text-[10px]">RECOMPENSA EXP</span>
              <span className="text-cyan-300 font-bold">~{80 + hero.level * 20} EXP</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <span className="text-gray-400 block text-[10px]">POLVO ESTELAR</span>
              <span className="text-amber-300 font-bold">~{100 + hero.level * 25} ✦</span>
            </div>
          </div>

          <button
            onClick={startShadowBattle}
            className="btn-mystic w-full py-3.5 rounded-2xl text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl"
          >
            <Sparkles size={16} /> INVOCAR RIVAL DE SOMBRA
          </button>
        </div>
      )}

      {/* 3. MODO: COOPERATIVO DE SINASTRÍA */}
      {activeTab === 'coop' && (
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-black to-black space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-3 text-amber-300 shadow-xl">
              <Users size={30} />
            </div>
            <h3 className="mystic-font text-xl text-white font-bold mb-1">Incursión de Sinastría Cósmica</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-light">
              Únete a una resonancia o signo aliado para desatar un <strong className="text-amber-300">Ataque de Eclipse Combinado</strong> contra el Titán de la Nebulosa.
            </p>
          </div>

          {/* Vínculos Reales de Zodia (Matches) */}
          {realMatches.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} /> Tus Conexiones Cósmicas (Matches de Zodia)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {realMatches.map(match => {
                  const syn = getSynastryCompatibility(hero.sign, match.sign || 'Leo');
                  return (
                    <div 
                      key={match.id}
                      onClick={() => startCoopBattleWithMatch(match)}
                      className="p-3.5 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400/50 bg-black flex items-center justify-center shrink-0">
                          {extractProfilePhoto(match) ? (
                            <img 
                              src={extractProfilePhoto(match)} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getZodiacIcon(match.sign || 'Leo');
                                e.currentTarget.className = "w-8 h-8 object-contain";
                              }}
                            />
                          ) : (
                            <img src={getZodiacIcon(match.sign || 'Leo')} alt="" className="w-8 h-8 object-contain" />
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black/90 border border-amber-400 p-0.5 shadow flex items-center justify-center">
                            <img src={getZodiacIcon(match.sign || 'Leo')} alt="" className="w-full h-full object-contain" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{match.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono font-bold">({match.sign})</span>
                          </div>
                          <div className="text-[10px] text-gray-300 font-mono">
                            ⚡ {syn.score}% Compatibilidad
                          </div>
                          <div className="text-[9px] text-gray-400 truncate max-w-[150px]">
                            {syn.attackName}
                          </div>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-black text-xs font-extrabold uppercase transition-all shadow-md">
                        Invitar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selector de Signos Aliados del Zodíaco */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star size={14} className="text-cyan-400" /> Aliados Celestiales del Zodíaco
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {['Leo', 'Acuario', 'Sagitario', 'Piscis'].map(allySign => {
                const syn = getSynastryCompatibility(hero.sign, allySign);
                const allyClass = ZODIAC_HERO_CLASSES[allySign];

                return (
                  <div 
                    key={allySign}
                    onClick={() => startCoopBattle(allySign)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{allySign}</span>
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center">
                        <img src={getZodiacIcon(allySign)} alt={allySign} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono font-bold">
                      {syn.score}% Sinastría
                    </div>
                    <div className="text-[9px] text-gray-400 truncate mt-1">
                      {syn.attackName}
                    </div>
                    <button className="mt-2.5 w-full py-1.5 rounded-xl bg-amber-500/20 group-hover:bg-amber-500 text-amber-300 group-hover:text-black text-[10px] font-bold uppercase transition-all">
                      Iniciar Dúo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inventario y Reliquias */}
      <LootInventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        hero={hero}
        onUpdateHero={(updated) => setHero(updated)}
      />
    </div>
  );
}
