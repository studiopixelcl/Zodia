"use client";
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Sword, Shield, Trophy, 
  Flame, Lock, CheckCircle2, Star, Users, Package, 
  HelpCircle, Play, ChevronRight, Zap, Crown, Compass, Target,
  Swords, RefreshCw, Calendar, Gift, Hammer, Coins
} from 'lucide-react';
import { HeroProfileCard } from './HeroProfileCard';
import { LootInventoryModal } from './LootInventoryModal';
import { SkillTreeModal } from './SkillTreeModal';
import { DailyRewardsModal } from './DailyRewardsModal';
import { CosmicForgeModal } from './CosmicForgeModal';
import { BattleArena } from './BattleArena';
import { 
  getOrCreateHeroProfile, 
  saveHeroProfile, 
  TWELVE_HOUSES_STAGES, 
  ZODIAC_HERO_CLASSES, 
  EQUIPMENT_CATALOG,
  ELEMENTAL_AFFINITIES,
  getZodiacIcon,
  extractProfilePhoto,
  ECLIPSE_TWINS_CHALLENGES,
  TOWER_MUTATORS,
  generateTowerFloor,
  PVP_RANKS,
  getPvpRankInfo,
  generatePvpRivals,
  COOP_RAID_BOSSES,
  PARTNER_ASSIST_SKILLS,
  getTodayDateString,
  getDailyResetInfo,
  initializeOrSyncDailyQuests,
  recordDailyQuestProgress
} from './rpg-data';
import { getSynastryCompatibility, getDailyTransitBuff } from './rpg-engine';
import { playBattleVictorySound, playIncomingChimeSound } from '../../../lib/sound-effects';
import { apiFetch } from '../../../lib/api';

export function ChroniclesGame({ profile, onBack }) {
  const [hero, setHero] = useState(() => getOrCreateHeroProfile(profile));
  const [activeTab, setActiveTab] = useState('houses'); // 'houses' | 'eclipse' | 'tower' | 'shadows' | 'coop' | 'pvp'
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSkillTreeOpen, setIsSkillTreeOpen] = useState(false);
  const [isDailyRewardsOpen, setIsDailyRewardsOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [activeBattle, setActiveBattle] = useState(null); // { enemy, mode, partner }
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [pvpPromoInfo, setPvpPromoInfo] = useState(null);
  const [realMatches, setRealMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedRaidId, setSelectedRaidId] = useState(COOP_RAID_BOSSES[0].id);
  const [pvpRivals, setPvpRivals] = useState([]);

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

  // Generar rivales de PvP cuando el héroe o vínculos cambien
  useEffect(() => {
    if (hero) {
      setPvpRivals(generatePvpRivals(hero, realMatches));
    }
  }, [hero?.level, realMatches.length]);

  const handleRefreshPvpRivals = () => {
    if (hero) {
      setPvpRivals(generatePvpRivals(hero, realMatches));
    }
  };

  // Inicializar o sincronizar misiones diarias y bienvenida de racha
  useEffect(() => {
    if (!hero) return;
    const synced = initializeOrSyncDailyQuests(hero);
    if (synced !== hero) {
      setHero(synced);
    }
    const resetInfo = getDailyResetInfo(synced || hero);
    if (resetInfo.canClaimStreak) {
      const timer = setTimeout(() => {
        setIsDailyRewardsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Manejar el resultado de la batalla
  const handleBattleEnd = ({ victory, exp = 0, gold = 0, dropId = null, pvpPointsGained = 25 }) => {
    if (!victory) {
      setActiveBattle(null);
      return;
    }

    // Registrar progreso en misiones diarias
    const heroWithQuests = recordDailyQuestProgress(hero, activeBattle?.mode);

    // Bono de Primera Victoria del Día (x1.5 EXP y Polvo)
    const todayStr = getTodayDateString();
    const isFirstWinToday = hero.lastFirstWinDate !== todayStr;
    const finalExp = isFirstWinToday ? Math.round(exp * 1.5) : exp;
    const finalGold = isFirstWinToday ? Math.round(gold * 1.5) : gold;

    let newExp = (heroWithQuests.exp || 0) + finalExp;
    let newLevel = heroWithQuests.level || 1;
    let newExpNext = heroWithQuests.expNext || 150;
    let leveledUp = false;

    // Calcular subida de nivel
    while (newExp >= newExpNext && newLevel < 50) {
      newExp -= newExpNext;
      newLevel += 1;
      newExpNext = Math.round(newExpNext * 1.35);
      leveledUp = true;
    }

    let newInventory = [...(heroWithQuests.inventory || [])];
    let droppedItem = null;
    if (dropId) {
      const found = EQUIPMENT_CATALOG.find(i => i.id === dropId);
      if (found) {
        droppedItem = { ...found, id: `${found.id}_${Date.now()}` };
        newInventory.push(droppedItem);
      }
    }

    let newMaxHouse = heroWithQuests.maxHouseCleared || 0;
    const isHouseClearedNow = activeBattle.mode === 'houses' && activeBattle.houseNumber > newMaxHouse;
    if (isHouseClearedNow) {
      newMaxHouse = activeBattle.houseNumber;
    }

    let newMaxTowerFloor = heroWithQuests.maxTowerFloor || 1;
    if (activeBattle.mode === 'tower' && activeBattle.floorNumber >= newMaxTowerFloor) {
      newMaxTowerFloor = activeBattle.floorNumber + 1;
    }

    let newEclipseCleared = [...(heroWithQuests.eclipseCleared || [])];
    if (activeBattle.mode === 'eclipse' && activeBattle.challengeId && !newEclipseCleared.includes(activeBattle.challengeId)) {
      newEclipseCleared.push(activeBattle.challengeId);
    }

    // Manejo de PvP: Puntos de Gloria y Ascenso de Rango
    let newPvpPoints = heroWithQuests.pvpPoints || 0;
    let newPvpRank = heroWithQuests.pvpRank || 'Polvo Cósmico I';
    let pvpPromo = null;

    if (activeBattle.mode === 'pvp') {
      const ptsGained = pvpPointsGained || activeBattle.enemy?.gloryPoints || 35;
      newPvpPoints += ptsGained;
      const rankInfo = getPvpRankInfo(newPvpPoints);
      if (rankInfo.name !== newPvpRank) {
        pvpPromo = rankInfo;
      }
      newPvpRank = rankInfo.name;
    }

    const updatedHero = {
      ...heroWithQuests,
      level: newLevel,
      exp: newExp,
      expNext: newExpNext,
      polvoEstelar: (heroWithQuests.polvoEstelar || 0) + finalGold,
      inventory: newInventory,
      maxHouseCleared: newMaxHouse,
      maxTowerFloor: newMaxTowerFloor,
      eclipseCleared: newEclipseCleared,
      pvpPoints: newPvpPoints,
      pvpRank: newPvpRank,
      lastFirstWinDate: isFirstWinToday ? todayStr : (heroWithQuests.lastFirstWinDate || null)
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
    } else if (pvpPromo) {
      playBattleVictorySound();
      setPvpPromoInfo(pvpPromo);
      setTimeout(() => setPvpPromoInfo(null), 4000);

      apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🏆 ¡Ascenso en el Coliseo Astral!',
          body: `¡Has ascendido al rango ${pvpPromo.name} con ${newPvpPoints} Puntos de Gloria!`,
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

  // Iniciar Desafío 1 vs 2: Gemelos del Eclipse
  const startEclipseBattle = (challenge) => {
    setActiveBattle({
      enemy: challenge.enemy1,
      enemy2: challenge.enemy2,
      mode: 'eclipse',
      challengeId: challenge.id
    });
  };

  // Iniciar combate en Torre del Caos Astral
  const startTowerBattle = (floorNumber) => {
    const floorData = generateTowerFloor(floorNumber, hero.level);
    setActiveBattle({
      enemy: floorData.enemy1,
      enemy2: floorData.enemy2,
      mutator: floorData.mutator,
      mode: 'tower',
      floorNumber
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
      hp: Math.round(classData.baseStats.hp * 1.9 * (1 + (hero.level - 1) * 0.08)),
      atk: Math.round(classData.baseStats.atk * (1 + (hero.level - 1) * 0.08)),
      def: Math.round((classData.baseStats.def + 8) * (1 + (hero.level - 1) * 0.08)),
      spd: classData.baseStats.spd,
      rewardExp: 80 + hero.level * 20,
      rewardGold: 100 + hero.level * 25
    };

    setActiveBattle({
      enemy: shadowEnemy,
      mode: 'quick'
    });
  };

  // Iniciar Incursión Cooperativa contra el Jefe Titánico
  const startCoopRaid = (partnerData, raidId = selectedRaidId) => {
    const raid = COOP_RAID_BOSSES.find(r => r.id === raidId) || COOP_RAID_BOSSES[0];
    const bossHp = raid.hpBase + hero.level * raid.hpPerLevel;
    const bossAtk = raid.atkBase + hero.level * raid.atkPerLevel;
    const bossDef = raid.defBase + hero.level * raid.defPerLevel;

    const titanBoss = {
      name: raid.name,
      title: raid.title,
      sign: raid.sign,
      element: raid.element,
      hp: bossHp,
      atk: bossAtk,
      def: bossDef,
      spd: 35,
      rewardExp: raid.rewardExpBase + hero.level * 40,
      rewardGold: raid.rewardGoldBase + hero.level * 45,
      stardustReward: raid.stardustReward,
      dropChance: raid.dropChance
    };

    setActiveBattle({
      enemy: titanBoss,
      mode: 'coop',
      partner: partnerData
    });
  };

  const startCoopBattle = (allySign) => {
    startCoopRaid({
      name: `Aliado Astral (${allySign})`,
      sign: allySign,
      element: ZODIAC_HERO_CLASSES[allySign]?.element || 'Fuego'
    });
  };

  const startCoopBattleWithMatch = (match) => {
    startCoopRaid({
      name: match.name,
      sign: match.sign || 'Leo',
      element: match.element || 'Fuego',
      image: extractProfilePhoto(match)
    });
  };

  // Iniciar Duelo en el Coliseo Astral PvP
  const startPvpBattle = (rival) => {
    setActiveBattle({
      enemy: rival,
      mode: 'pvp'
    });
  };

  // Si hay una batalla activa, renderizar la Arena
  if (activeBattle) {
    return (
      <div className="px-3 sm:px-6 pb-24 animate-fadeIn">
        <BattleArena 
          hero={hero}
          enemy={activeBattle.enemy}
          enemy2={activeBattle.enemy2 || null}
          mode={activeBattle.mode}
          partner={activeBattle.partner}
          mutator={activeBattle.mutator || null}
          onBattleEnd={handleBattleEnd}
          onBack={() => setActiveBattle(null)}
          onExitToMenu={onBack}
        />
      </div>
    );
  }

  const dailyResetInfo = getDailyResetInfo(hero);
  const pendingQuestsCount = (hero?.dailyQuests || []).filter(q => q.completed && !q.claimed).length;
  const hasDailyMasterChest = (hero?.dailyQuests || []).filter(q => q.completed).length >= 3 && !hero?.dailyMasterChestClaimed;
  const hasDailyAlert = dailyResetInfo.canClaimStreak || pendingQuestsCount > 0 || hasDailyMasterChest;
  const heroClass = ZODIAC_HERO_CLASSES[hero?.sign] || ZODIAC_HERO_CLASSES['Aries'];

  return (
    <div className="space-y-6 px-3 sm:px-6 pb-24 animate-fadeIn relative">
      
      {/* BARRA SUPERIOR FIJA (STICKY): RETORNO DIRECTO Y STATUS RESUMIDO */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 -mt-2 px-3 sm:px-6 py-2.5 bg-[#030308]/95 backdrop-blur-xl border-b border-cyan-500/30 flex items-center justify-between shadow-2xl shadow-black/80">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white px-3.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 shadow-md shadow-cyan-950/40 transition-all group"
          title="Regresar a Arcadia Astral / Menú Principal"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-cyan-400" />
          <span>Volver al Menú Principal</span>
        </button>

        {/* Indicadores rápidos de estado del héroe */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono shadow-sm">
            <Coins size={14} className="text-amber-400" />
            <span className="font-bold">{hero?.dust || 0}</span>
            <span className="text-[10px] text-amber-400/80 hidden sm:inline">Polvo</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono shadow-sm">
            <Trophy size={14} className="text-purple-400" />
            <span className="font-bold">{getPvpRankInfo(hero?.pvpScore || 1000).name}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold shadow-sm">
            <span className="text-[10px] text-cyan-400">NVL</span>
            <span>{hero?.level || 1}</span>
          </div>
        </div>
      </div>

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
              RPG POR TURNOS
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
              Clase: {heroClass?.name || 'Guerrero'}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            {hero?.name || 'Guardián'} • {hero?.sign || 'Aries'}
          </span>
        </div>

        <div className="mt-3">
          <h2 className="mystic-font text-2xl text-white font-bold tracking-wide flex items-center gap-2.5">
            <Sword className="text-cyan-400" size={26} /> CHRONICLES OF THE ZODIA
          </h2>
          <p className="text-xs text-gray-300 font-light mt-1 max-w-xl leading-relaxed">
            Encarna la fuerza primordial de tu signo solar. Purifica las 12 Casas Astrales, forja reliquias cósmicas y desata ataques combinados de sinastría con tus almas gemelas.
          </p>
        </div>
      </div>

      {/* HUB DE ACCIONES PRINCIPALES (BOTONES GRANDES E INTUITIVOS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Botón 1: Equipo e Inventario */}
        <button
          onClick={() => setIsInventoryOpen(true)}
          className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-cyan-950/60 to-[#091522]/80 hover:from-cyan-900/70 hover:to-[#0c1e33] border border-cyan-500/40 hover:border-cyan-400 text-left transition-all duration-300 shadow-lg shadow-cyan-950/30 hover:shadow-cyan-500/20 hover:-translate-y-1 overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:bg-cyan-500/30 transition-all shadow-md">
              <Package size={24} />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {Object.values(hero?.equipment || {}).filter(Boolean).length}/4
            </span>
          </div>
          <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-cyan-200 transition-colors">
            Equipo Astral
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
            Armas, armaduras y reliquias
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Gestionar</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Botón 2: Árbol de Habilidades */}
        <button
          onClick={() => setIsSkillTreeOpen(true)}
          className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-950/60 to-[#1f1606]/80 hover:from-amber-900/70 hover:to-[#2b1f09] border border-amber-500/40 hover:border-amber-400 text-left transition-all duration-300 shadow-lg shadow-amber-950/30 hover:shadow-amber-500/20 hover:-translate-y-1 overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 group-hover:scale-110 group-hover:bg-amber-500/30 transition-all shadow-md">
              <Zap size={24} />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {hero?.skills?.length || 2}/6 Skills
            </span>
          </div>
          <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-amber-200 transition-colors">
            Árbol de Skills
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
            Poderes cósmicos y talentos
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Aprender</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Botón 3: Forja Cósmica */}
        <button
          onClick={() => setIsForgeOpen(true)}
          className="group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-orange-950/60 to-[#1c0e05]/80 hover:from-orange-900/70 hover:to-[#291408] border border-orange-500/40 hover:border-orange-400 text-left transition-all duration-300 shadow-lg shadow-orange-950/30 hover:shadow-orange-500/20 hover:-translate-y-1 overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300 group-hover:scale-110 group-hover:bg-orange-500/30 transition-all shadow-md">
              <Hammer size={24} />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">
              Refinar
            </span>
          </div>
          <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-orange-200 transition-colors">
            Forja Cósmica
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
            Mejora equipo hasta +10
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-orange-400 group-hover:translate-x-1 transition-transform">
            <span>Refinar</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Botón 4: Desafíos y Recompensas Diarias */}
        <button
          onClick={() => setIsDailyRewardsOpen(true)}
          className={`group relative p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-purple-950/60 to-[#160624]/80 hover:from-purple-900/70 hover:to-[#220a38] text-left transition-all duration-300 shadow-lg hover:-translate-y-1 overflow-hidden border cursor-pointer ${
            hasDailyAlert 
              ? 'border-amber-400 shadow-amber-500/20' 
              : 'border-purple-500/40 hover:border-purple-400 shadow-purple-950/30 hover:shadow-purple-500/20'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all shadow-md">
              <Gift size={24} className={hasDailyAlert ? 'text-amber-300 animate-bounce' : 'text-purple-300'} />
            </div>
            {hasDailyAlert ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                ¡RECLAMAR!
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Racha {hero?.dailyStreak || 1}d
              </span>
            )}
          </div>
          <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-purple-200 transition-colors">
            Misiones Diarias
          </h3>
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
            Rachas, cofres y recompensas
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>{hasDailyAlert ? 'Reclamar premios' : 'Ver misiones'}</span>
            <ChevronRight size={14} />
          </div>
        </button>
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
        onOpenSkillTree={() => setIsSkillTreeOpen(true)}
      />

      {/* Selector de Pestañas / Modos (6 Modos) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <button
          onClick={() => setActiveTab('houses')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'houses'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-500/20'
              : 'glass-panel text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Trophy size={15} />
          <span>12 Casas</span>
        </button>

        <button
          onClick={() => setActiveTab('eclipse')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'eclipse'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-lg shadow-amber-500/20'
              : 'glass-panel text-amber-400/80 hover:text-amber-300 border border-amber-500/20'
          }`}
        >
          <Zap size={15} className="text-amber-400" />
          <span>Duelos 1vs2</span>
        </button>

        <button
          onClick={() => setActiveTab('tower')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'tower'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
              : 'glass-panel text-purple-400/80 hover:text-purple-300 border border-purple-500/20'
          }`}
        >
          <Crown size={15} className="text-purple-400" />
          <span>Torre Caos</span>
        </button>

        <button
          onClick={() => setActiveTab('shadows')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'shadows'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
              : 'glass-panel text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Sword size={15} />
          <span>Duelo 1v1</span>
        </button>

        <button
          onClick={() => setActiveTab('coop')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'coop'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-lg shadow-emerald-500/20'
              : 'glass-panel text-teal-400/80 hover:text-teal-300 border border-teal-500/20'
          }`}
        >
          <Users size={15} />
          <span>Sinastría</span>
        </button>

        <button
          onClick={() => setActiveTab('pvp')}
          className={`py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'pvp'
              ? 'bg-gradient-to-r from-red-500 to-amber-500 text-black shadow-lg shadow-red-500/20'
              : 'glass-panel text-amber-400/90 hover:text-amber-300 border border-amber-500/20'
          }`}
        >
          <Swords size={15} className="text-amber-400" />
          <span>Coliseo PvP</span>
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

      {/* 2. MODO: DESAFÍOS 1 VS 2 (GEMELOS DEL ECLIPSE) */}
      {activeTab === 'eclipse' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pl-2 flex-wrap gap-2">
            <div>
              <h3 className="mystic-font text-base text-white font-bold flex items-center gap-2">
                <Zap className="text-amber-400" size={18} /> Gemelos del Eclipse (1 vs 2)
              </h3>
              <p className="text-xs text-gray-400">
                Combates tácticos en inferioridad numérica contra dos sombras sincronizadas. Alterna entre Vanguardia y Retaguardia y selecciona tus objetivos.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
              {hero.eclipseCleared?.length || 0} / {ECLIPSE_TWINS_CHALLENGES.length} Dominados
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {ECLIPSE_TWINS_CHALLENGES.map((ch) => {
              const isCleared = hero.eclipseCleared?.includes(ch.id);
              const isUnlocked = (hero.level || 1) >= ch.levelReq;
              const elem1 = ELEMENTAL_AFFINITIES[ch.enemy1.element] || ELEMENTAL_AFFINITIES['Fuego'];
              const elem2 = ELEMENTAL_AFFINITIES[ch.enemy2.element] || ELEMENTAL_AFFINITIES['Aire'];

              return (
                <div
                  key={ch.id}
                  className={`p-4 rounded-2xl glass-panel border transition-all ${
                    isCleared
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : isUnlocked
                        ? 'border-amber-500/30 hover:border-amber-400/70 bg-gradient-to-r from-amber-950/20 via-black to-purple-950/20'
                        : 'border-white/5 opacity-50 bg-black/40'
                  }`}
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Nivel {ch.levelReq}+
                        </span>
                        {isCleared && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                            <CheckCircle2 size={12} /> Dominado
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mystic-font">{ch.title}</h4>
                      <div className="text-xs text-amber-200/80 font-medium mt-0.5">{ch.subtitle}</div>
                      <p className="text-xs text-gray-400 font-light mt-1.5 leading-relaxed">
                        {ch.description}
                      </p>
                    </div>

                    {/* Previsualización de los 2 enemigos */}
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center">
                        <div className={`w-11 h-11 rounded-xl border ${elem1.border} bg-black/60 p-1 flex items-center justify-center`}>
                          <img src={getZodiacIcon(ch.enemy1.sign)} alt="" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5">{ch.enemy1.sign}</span>
                      </div>
                      <span className="text-amber-400 font-black text-xs">&</span>
                      <div className="flex flex-col items-center">
                        <div className={`w-11 h-11 rounded-xl border ${elem2.border} bg-black/60 p-1 flex items-center justify-center`}>
                          <img src={getZodiacIcon(ch.enemy2.sign)} alt="" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9px] text-gray-400 font-mono mt-0.5">{ch.enemy2.sign}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-3">
                      <span className="text-cyan-300 font-bold">+{ch.rewardExp} EXP</span>
                      <span className="text-amber-300 font-bold">+{ch.rewardGold} ✦</span>
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => startEclipseBattle(ch)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                      >
                        <Zap size={13} /> {isCleared ? 'Repetir 1vs2' : 'Desafiar 1vs2'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock size={13} /> Requiere Nivel {ch.levelReq}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MODO: TORRE DEL CAOS ASTRAL (ENDLESS / PISOS) */}
      {activeTab === 'tower' && (() => {
        const currentFloor = hero.maxTowerFloor || 1;
        const currentData = generateTowerFloor(currentFloor, hero.level);
        const nextMutator = currentData.mutator;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between pl-2 flex-wrap gap-2">
              <div>
                <h3 className="mystic-font text-base text-white font-bold flex items-center gap-2">
                  <Crown className="text-purple-400" size={18} /> Torre del Caos Astral (Modo Infinito)
                </h3>
                <p className="text-xs text-gray-400">
                  Asciende piso a piso por la aguja celestial. Cada nivel introduce mutadores y jefes con barras de guardia.
                </p>
              </div>
              <span className="text-xs font-mono text-purple-300 font-bold bg-purple-500/10 px-2.5 py-1 rounded-xl border border-purple-500/30">
                Piso Máximo: {currentFloor}
              </span>
            </div>

            {/* Tarjeta del Piso Actual */}
            <div className="glass-panel p-6 rounded-3xl border border-purple-500/40 bg-gradient-to-b from-purple-950/30 via-black to-black space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                    PISO ACTUAL
                  </span>
                  <h3 className="mystic-font text-3xl text-white font-bold mt-1">
                    Piso {currentFloor}
                  </h3>
                  <div className="text-xs text-gray-300 font-light mt-0.5">
                    {currentData.isDual ? '⚠️ ¡Batalla de Emboscada 1vs2 en este piso!' : 'Guardián del Caos Individual'}
                  </div>
                </div>

                {/* Previsualización del mutador activo en este piso */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 max-w-xs text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-0.5">
                    <Flame size={13} /> Mutador: {nextMutator.name}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    {nextMutator.desc}
                  </p>
                </div>
              </div>

              {/* Detalles de los Guardianes del Piso */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/40 p-1 flex items-center justify-center">
                    <img src={getZodiacIcon(currentData.enemy1.sign)} alt="" className="w-full h-full object-contain" />
                  </div>
                  {currentData.enemy2 && (
                    <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-500/40 p-1 flex items-center justify-center -ml-3 shadow-lg">
                      <img src={getZodiacIcon(currentData.enemy2.sign)} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">
                      {currentData.enemy1.name} {currentData.enemy2 ? `& ${currentData.enemy2.name}` : ''}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      HP: ~{currentData.enemy1.hp} {currentData.enemy2 ? `+ ${currentData.enemy2.hp}` : ''} • {currentData.isDual ? 'Dúo Sincronizado' : 'Guardián Solitario'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block font-mono">RECOMPENSA AL VENCER</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">+{currentData.rewardExp} EXP • +{currentData.rewardGold} ✦</span>
                </div>
              </div>

              <button
                onClick={() => startTowerBattle(currentFloor)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40 transition-all"
              >
                <Play size={16} /> Entrar al Piso {currentFloor}
              </button>
            </div>
          </div>
        );
      })()}

      {/* 4. MODO: DUELO DE SOMBRAS 1v1 */}
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
        <div className="glass-panel p-6 rounded-3xl border border-teal-500/30 bg-gradient-to-b from-teal-950/20 via-black to-black space-y-6">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center mx-auto mb-3 text-teal-300 shadow-xl">
              <Users size={30} />
            </div>
            <h3 className="mystic-font text-xl text-white font-bold mb-1">Incursión de Sinastría Cósmica</h3>
            <p className="text-xs text-gray-300 leading-relaxed font-light">
              Elige a un Titán Ancestral y únete a un match o aliado para desplegar una <strong className="text-teal-300">formación dual en batalla</strong> con asistencia táctica y ataques de eclipse combinados.
            </p>
          </div>

          {/* Selector de Jefes de Raid Titánica */}
          <div>
            <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Crown size={14} /> Selecciona el Titán de Incursión
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COOP_RAID_BOSSES.map(raid => {
                const isSelected = selectedRaidId === raid.id;
                const raidElem = ELEMENTAL_AFFINITIES[raid.element] || ELEMENTAL_AFFINITIES['Agua'];
                return (
                  <div
                    key={raid.id}
                    onClick={() => setSelectedRaidId(raid.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-400 bg-teal-950/40 shadow-lg shadow-teal-500/20 ring-1 ring-teal-400'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${raidElem.bg} ${raidElem.text}`}>
                          {raid.element}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 font-bold">Niv. {raid.minLevel}+</span>
                      </div>
                      <div className="text-xs font-bold text-white mystic-font truncate">{raid.name}</div>
                      <div className="text-[10px] text-teal-300/80 font-mono mb-2">{raid.title}</div>
                      <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2">{raid.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="text-gray-400">Recompensa:</span>
                      <span className="text-amber-300 font-bold font-mono">+{raid.stardustReward} ✦ Polvo Dúo</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vínculos Reales de Zodia (Matches) */}
          {realMatches.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles size={14} /> Tus Conexiones Cósmicas (Matches de Zodia)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {realMatches.map(match => {
                  const syn = getSynastryCompatibility(hero.sign, match.sign || 'Leo');
                  const photo = extractProfilePhoto(match);
                  return (
                    <div 
                      key={match.id}
                      onClick={() => startCoopBattleWithMatch(match)}
                      className="p-3.5 rounded-2xl bg-white/5 border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow-amber-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400/50 bg-black flex items-center justify-center shrink-0">
                          {photo ? (
                            <img 
                              src={photo} 
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
                          <div className="text-[10px] text-teal-300 font-mono">
                            ⚡ {syn.score}% Compatibilidad
                          </div>
                          <div className="text-[9px] text-gray-400 truncate max-w-[150px]">
                            {syn.attackName}
                          </div>
                        </div>
                      </div>

                      <button className="px-3 py-1.5 rounded-xl bg-teal-500 group-hover:bg-teal-400 text-black text-xs font-extrabold uppercase transition-all shadow-md">
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
              <Star size={14} className="text-cyan-400" /> Aliados Celestiales y Asistencias de Signo
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {['Leo', 'Aries', 'Escorpio', 'Tauro', 'Cáncer', 'Acuario'].map(allySign => {
                const syn = getSynastryCompatibility(hero.sign, allySign);
                const assist = PARTNER_ASSIST_SKILLS[allySign];

                return (
                  <div 
                    key={allySign}
                    onClick={() => startCoopBattle(allySign)}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">{allySign}</span>
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center">
                        <img src={getZodiacIcon(allySign)} alt={allySign} className="w-full h-full object-contain" />
                      </div>
                    </div>
                    <div className="text-[10px] text-teal-300 font-mono font-bold">
                      {syn.score}% Sinastría
                    </div>
                    <div className="text-[9px] text-amber-300 font-mono truncate mt-0.5">
                      ⚡ {assist?.name}
                    </div>
                    <div className="text-[8px] text-gray-400 line-clamp-2 mt-1 leading-tight">
                      {assist?.desc}
                    </div>
                    <button className="mt-2.5 w-full py-1.5 rounded-xl bg-teal-500/20 group-hover:bg-teal-500 text-teal-300 group-hover:text-black text-[10px] font-bold uppercase transition-all">
                      Iniciar Dúo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODO: COLISEO ASTRAL PVP */}
      {activeTab === 'pvp' && (
        <div className="space-y-5">
          {/* Tarjeta de Rango y Gloria del Jugador */}
          {(() => {
            const rankInfo = getPvpRankInfo(hero.pvpPoints || 0);
            return (
              <div className="glass-panel p-5 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-red-950/30 via-black to-amber-950/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/20">
                      <Swords size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Rango en el Coliseo:</span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${rankInfo.badgeColor}`}>
                          {rankInfo.name}
                        </span>
                      </div>
                      <div className="mystic-font text-xl text-white font-bold mt-0.5">
                        {hero.pvpPoints || 0} <span className="text-amber-400 text-sm font-sans font-normal">Puntos de Gloria</span>
                      </div>
                    </div>
                  </div>

                  {rankInfo.nextRank && (
                    <div className="w-full sm:w-48 text-right">
                      <div className="text-[10px] text-gray-400 mb-1 flex justify-between">
                        <span>Ascenso a {rankInfo.nextRank.name}</span>
                        <span className="font-mono text-amber-300 font-bold">{rankInfo.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all"
                          style={{ width: `${rankInfo.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">
                        Faltan {Math.max(0, rankInfo.nextRank.minPts - (hero.pvpPoints || 0))} pts para ascender
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Roster de Rivales Disponibles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pl-1">
              <div>
                <h3 className="mystic-font text-base text-white font-bold flex items-center gap-2">
                  <Target size={16} className="text-red-400" /> Gladiadores del Coliseo
                </h3>
                <p className="text-xs text-gray-400">Desafía a estos oponentes en duelos de clasificación táctica.</p>
              </div>
              <button
                onClick={handleRefreshPvpRivals}
                className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-amber-500/30 transition-all shadow-sm"
                title="Buscar nuevos gladiadores en la arena"
              >
                <RefreshCw size={13} />
                <span>Nuevos Rivales</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pvpRivals.map(rival => {
                const rivalElem = ELEMENTAL_AFFINITIES[rival.element] || ELEMENTAL_AFFINITIES['Fuego'];
                return (
                  <div
                    key={rival.id}
                    className="glass-panel p-4 rounded-2xl border border-white/10 hover:border-amber-400 transition-all flex flex-col justify-between group relative overflow-hidden bg-gradient-to-b from-black via-gray-950 to-black"
                  >
                    <div>
                      {/* Cabecera del Rival */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${rivalElem.bg} ${rivalElem.text}`}>
                          {rival.element}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold">
                          +{rival.gloryPoints} Gloria
                        </span>
                      </div>

                      {/* Avatar y Datos */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 bg-black flex items-center justify-center shrink-0 relative">
                          {rival.avatarUrl ? (
                            <img src={rival.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <img src={getZodiacIcon(rival.sign)} alt="" className="w-8 h-8 object-contain" />
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black border border-white/30 p-0.5 flex items-center justify-center">
                            <img src={getZodiacIcon(rival.sign)} alt="" className="w-full h-full object-contain" />
                          </div>
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1 truncate">
                            <span className="text-xs font-bold text-white truncate">{rival.name}</span>
                            <span className="text-[9px] text-cyan-300 font-mono font-bold">N.{rival.level}</span>
                          </div>
                          <div className="text-[10px] text-amber-300 font-mono truncate">{rival.title}</div>
                          <div className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <span>Postura:</span>
                            <span className="text-gray-300 font-bold">
                              {rival.stance === 'solar' ? '☀️ Solar' : rival.stance === 'lunar' ? '🌙 Lunar' : '🧭 Estelar'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Estadísticas de Poder */}
                      <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-mono text-gray-400 mb-3">
                        <div>HP: <span className="text-white font-bold">{rival.hp}</span></div>
                        <div>ATQ: <span className="text-orange-300 font-bold">{rival.atk}</span></div>
                        <div>DEF: <span className="text-blue-300 font-bold">{rival.def}</span></div>
                        <div>VEL: <span className="text-cyan-300 font-bold">{rival.spd}</span></div>
                      </div>
                    </div>

                    <button
                      onClick={() => startPvpBattle(rival)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Swords size={14} /> Desafiar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Botón inferior para salir al Menú Principal */}
      <div className="pt-6 pb-2 text-center border-t border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white px-6 py-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 shadow-lg shadow-cyan-950/30 transition-all"
        >
          <ArrowLeft size={16} /> Volver al Menú Principal (Arcadia)
        </button>
      </div>

      {/* Modal de Inventario y Reliquias */}
      <LootInventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        hero={hero}
        onUpdateHero={(updated) => setHero(updated)}
        onOpenForge={() => {
          setIsInventoryOpen(false);
          setIsForgeOpen(true);
        }}
      />

      {/* Modal del Árbol de Habilidades Astrales */}
      <SkillTreeModal
        isOpen={isSkillTreeOpen}
        onClose={() => setIsSkillTreeOpen(false)}
        hero={hero}
        onUpdateHero={(updated) => setHero(updated)}
      />

      {/* Modal de Recompensas Diarias y Misiones del Oráculo */}
      <DailyRewardsModal
        isOpen={isDailyRewardsOpen}
        onClose={() => setIsDailyRewardsOpen(false)}
        hero={hero}
        onHeroUpdate={(updated) => {
          setHero(updated);
          saveHeroProfile(updated);
        }}
        transitBuff={transitBuff}
      />

      {/* Modal de la Forja Cósmica y Alquimia */}
      <CosmicForgeModal
        isOpen={isForgeOpen}
        onClose={() => setIsForgeOpen(false)}
        hero={hero}
        onUpdateHero={(updated) => {
          setHero(updated);
          saveHeroProfile(updated);
        }}
      />
    </div>
  );
}
