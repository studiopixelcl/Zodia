"use client";
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Sparkles, Sword, Shield, Trophy, 
  Flame, Lock, CheckCircle2, Star, Users, Package, 
  HelpCircle, Play, ChevronRight, Zap, Crown, Compass, Target,
  Swords, RefreshCw, Calendar, Gift, Hammer, Coins, Volume2, VolumeX,
  User, Backpack
} from 'lucide-react';
import { CotzBottomNav } from './CotzBottomNav';
import { HeroProfileCard } from './HeroProfileCard';
import { LootInventoryModal } from './LootInventoryModal';
import { SkillTreeModal } from './SkillTreeModal';
import { DailyRewardsModal } from './DailyRewardsModal';
import { CosmicForgeModal } from './CosmicForgeModal';
import PetSanctuaryModal from './PetSanctuaryModal';
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
import { playBattleVictorySound, playIncomingChimeSound, isSoundEnabled, setSoundEnabled } from '../../../lib/sound-effects';
import { apiFetch } from '../../../lib/api';

export function ChroniclesGame({ profile, onBack }) {
  const [hero, setHero] = useState(() => getOrCreateHeroProfile(profile));
  const [activeCotzTab, setActiveCotzTab] = useState('inicio'); // 'inicio' | 'heroe' | 'equipo' | 'skills' | 'aventura' | 'misiones'
  const [equipoSubTab, setEquipoSubTab] = useState('inventory'); // 'inventory' | 'forge'
  const [heroeSubTab, setHeroeSubTab] = useState('perfil'); // 'perfil' | 'mascotas'
  const [selectedAdventureMode, setSelectedAdventureMode] = useState(null); // null = Hub Selector | 'houses' | 'eclipse' | 'tower' | 'shadows' | 'coop' | 'pvp'
  const [activeBattle, setActiveBattle] = useState(null); // { enemy, mode, partner }
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [pvpPromoInfo, setPvpPromoInfo] = useState(null);
  const [realMatches, setRealMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedRaidId, setSelectedRaidId] = useState(COOP_RAID_BOSSES[0].id);
  const [pvpRivals, setPvpRivals] = useState([]);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const openInventory = () => { setActiveCotzTab('equipo'); setEquipoSubTab('inventory'); };
  const openForge = () => { setActiveCotzTab('equipo'); setEquipoSubTab('forge'); };
  const openSkills = () => { setActiveCotzTab('skills'); };
  const openPets = () => { setActiveCotzTab('heroe'); setHeroeSubTab('mascotas'); };
  const openMisiones = () => { setActiveCotzTab('misiones'); };
  const openHero = () => { setActiveCotzTab('heroe'); setHeroeSubTab('perfil'); };
  const openAdventure = (mode = null) => { 
    setActiveCotzTab('aventura'); 
    setSelectedAdventureMode(mode); 
  };

  const handleCotzTabChange = (tabId) => {
    if (tabId === 'aventura' && activeCotzTab === 'aventura') {
      setSelectedAdventureMode(null);
    }
    setActiveCotzTab(tabId);
  };

  useEffect(() => {
    const handler = () => setSoundOn(isSoundEnabled());
    window.addEventListener('zodia-sound-toggle', handler);
    return () => window.removeEventListener('zodia-sound-toggle', handler);
  }, []);

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
  }, []);

  // Manejar el resultado de la batalla
  const handleBattleEnd = ({ victory, exp = 0, gold = 0, dropId = null, pvpPointsGained = 25, updatedConsumables = null }) => {
    if (!victory) {
      if (updatedConsumables) {
        const heroWithConsumables = { ...hero, consumables: updatedConsumables };
        setHero(heroWithConsumables);
        saveHeroProfile(heroWithConsumables);
      }
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
      consumables: updatedConsumables || heroWithQuests.consumables || hero.consumables,
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
    setActiveCotzTab('aventura');
    setSelectedAdventureMode('houses');
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
    setActiveCotzTab('aventura');
    setSelectedAdventureMode('eclipse');
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
    setActiveCotzTab('aventura');
    setSelectedAdventureMode('tower');
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

    setActiveCotzTab('aventura');
    setSelectedAdventureMode('shadows');
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

    setActiveCotzTab('aventura');
    setSelectedAdventureMode('coop');
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
    setActiveCotzTab('aventura');
    setSelectedAdventureMode('pvp');
    setActiveBattle({
      enemy: rival,
      mode: 'pvp'
    });
  };

  const dailyResetInfo = getDailyResetInfo(hero);
  const pendingQuestsCount = (hero?.dailyQuests || []).filter(q => q.completed && !q.claimed).length;
  const hasDailyMasterChest = (hero?.dailyQuests || []).filter(q => q.completed).length >= 3 && !hero?.dailyMasterChestClaimed;
  const hasDailyAlert = dailyResetInfo.canClaimStreak || pendingQuestsCount > 0 || hasDailyMasterChest;
  const heroClass = ZODIAC_HERO_CLASSES[hero?.sign] || ZODIAC_HERO_CLASSES['Aries'];

  // Catálogo reactivo de Modos de Aventura con progreso y estética cósmica
  const adventureModes = [
    {
      id: 'houses',
      shortName: '12 Casas',
      title: 'El Sendero de las 12 Casas',
      subtitle: 'Campaña Principal Zodiacal',
      badge: 'Campaña PvE',
      icon: Trophy,
      gradient: 'from-cyan-950/40 via-[#061325]/80 to-black',
      border: 'border-cyan-500/40 hover:border-cyan-300',
      glowColor: 'hover:shadow-cyan-500/20',
      iconBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50',
      btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black',
      accentText: 'text-cyan-400',
      badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      description: 'Enfrenta a los 12 guardianes del templo estelar, purifica las constelaciones corrompidas y desbloquea botín divino.',
      statsLabel: 'Progreso del Templo',
      statsValue: `${hero?.maxHouseCleared || 0} / 12`,
      progressPct: Math.round(((hero?.maxHouseCleared || 0) / 12) * 100),
      rewards: ['EXP Sagrada', 'Oro Cósmico', 'Armaduras'],
      actionLabel: 'Entrar al Sendero'
    },
    {
      id: 'eclipse',
      shortName: '1vs2 Eclipse',
      title: 'Gemelos del Eclipse',
      subtitle: 'Reto Táctico 1 vs 2',
      badge: 'Reto 1 vs 2',
      icon: Zap,
      gradient: 'from-amber-950/40 via-[#200e05]/80 to-black',
      border: 'border-amber-500/40 hover:border-amber-300',
      glowColor: 'hover:shadow-amber-500/20',
      iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
      btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black',
      accentText: 'text-amber-400',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      description: 'Combates en inferioridad numérica contra dos sombras sincronizadas. Alterna objetivos estratégicamente entre Vanguardia y Retaguardia.',
      statsLabel: 'Desafíos Vencidos',
      statsValue: `${hero?.eclipseCleared?.length || 0} / ${ECLIPSE_TWINS_CHALLENGES.length}`,
      progressPct: Math.round(((hero?.eclipseCleared?.length || 0) / ECLIPSE_TWINS_CHALLENGES.length) * 100),
      rewards: ['EXP Concentrada', 'Polvo Estelar', 'Amuletos'],
      actionLabel: 'Desafiar Gemelos'
    },
    {
      id: 'tower',
      shortName: 'Torre Caos',
      title: 'Torre del Caos Astral',
      subtitle: 'Ascenso Roguelite Infinito',
      badge: 'Endless Roguelite',
      icon: Crown,
      gradient: 'from-purple-950/40 via-[#170628]/80 to-black',
      border: 'border-purple-500/40 hover:border-purple-300',
      glowColor: 'hover:shadow-purple-500/20',
      iconBg: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
      btnBg: 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white',
      accentText: 'text-purple-400',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      description: 'Escala piso a piso una aguja celestial infinita con mutadores aleatorios, barras de guardia impenetrable y jefes mutantes.',
      statsLabel: 'Piso Récord Actual',
      statsValue: `Piso ${hero?.maxTowerFloor || 1}`,
      progressPct: Math.min(100, Math.round(((hero?.maxTowerFloor || 1) / 30) * 100)),
      rewards: ['Fragmentos Raros', 'Pociones', 'Loot Cósmico'],
      actionLabel: 'Ascender Torre'
    },
    {
      id: 'shadows',
      shortName: 'Duelo 1v1',
      title: 'Duelo de Sombras',
      subtitle: 'Entrenamiento Rápido 1v1',
      badge: 'Duelo Rápido',
      icon: Sword,
      gradient: 'from-blue-950/40 via-[#0a152e]/80 to-black',
      border: 'border-blue-500/40 hover:border-blue-300',
      glowColor: 'hover:shadow-blue-500/20',
      iconBg: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
      btnBg: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black',
      accentText: 'text-blue-400',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      description: 'Enfrenta a una sombra espectral adaptada a tu nivel sin riesgo de perder avance ni racha. Ideal para farmear y probar combos.',
      statsLabel: 'Dificultad Dinámica',
      statsValue: `Nivel ${hero?.level || 1}`,
      progressPct: 100,
      rewards: ['EXP Garantizada', 'Polvo Estelar', 'Oro'],
      actionLabel: 'Entrar al Duelo'
    },
    {
      id: 'coop',
      shortName: 'Co-op Dúo',
      title: 'Incursión Co-op Dúo',
      subtitle: 'Asalto Cooperativo con Matches',
      badge: 'Sinastría & Asistencia',
      icon: Users,
      gradient: 'from-emerald-950/40 via-[#06241a]/80 to-black',
      border: 'border-teal-500/40 hover:border-teal-300',
      glowColor: 'hover:shadow-teal-500/20',
      iconBg: 'bg-teal-500/20 text-teal-300 border-teal-400/50',
      btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black',
      accentText: 'text-teal-400',
      badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      description: 'Únete a tus conexiones reales de Zodia o aliados del zodíaco para desplegar ataques de sinastría combinados contra Titanes Ancestrales.',
      statsLabel: 'Matches Conectados',
      statsValue: `${realMatches.length} Vínculos`,
      progressPct: Math.min(100, Math.max(15, (realMatches.length || 0) * 25)),
      rewards: ['Polvo Dúo Cósmico', 'Esencias de Titán', 'Afinidad'],
      actionLabel: 'Formar Dúo'
    },
    {
      id: 'pvp',
      shortName: 'Coliseo PvP',
      title: 'Coliseo Astral PvP',
      subtitle: 'Arena Clasificatoria Asíncrona',
      badge: 'Arena Clasificatoria',
      icon: Swords,
      gradient: 'from-red-950/40 via-[#260a14]/80 to-black',
      border: 'border-red-500/40 hover:border-red-300',
      glowColor: 'hover:shadow-red-500/20',
      iconBg: 'bg-red-500/20 text-red-300 border-red-400/50',
      btnBg: 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-black',
      accentText: 'text-amber-400',
      badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
      description: 'Desafía las formaciones y héroes de otros jugadores en combates de clasificación. Escala en la tabla y reclama gloria estelar.',
      statsLabel: 'Rango y Puntos',
      statsValue: `${hero?.pvpPoints || 0} pts • ${hero?.pvpRank || getPvpRankInfo(hero?.pvpPoints || 0).name}`,
      progressPct: getPvpRankInfo(hero?.pvpPoints || 0).progress || 0,
      rewards: ['Puntos de Gloria', 'Marcos Cósmicos', 'Títulos'],
      actionLabel: 'Entrar a la Arena'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 px-3 sm:px-6 pb-28 sm:pb-32 animate-fadeIn relative">
      
      {/* BARRA SUPERIOR FIJA (STICKY): RETORNO DIRECTO Y STATUS RESUMIDO */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 -mt-2 px-3 sm:px-6 py-2 sm:py-2.5 bg-[#030308]/95 backdrop-blur-xl border-b border-cyan-500/30 flex items-center justify-between shadow-2xl shadow-black/80 gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-cyan-300 hover:text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 shadow-md shadow-cyan-950/40 transition-all group shrink-0"
          title="Regresar a Arcadia Astral / Menú Principal"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform text-cyan-400 shrink-0" />
          <span className="hidden sm:inline">Volver al Menú Principal</span>
          <span className="sm:hidden">Volver</span>
        </button>

        {/* Indicadores rápidos de estado del héroe */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono shadow-sm shrink-0">
            <Coins size={13} className="text-amber-400 shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs">{hero?.polvoEstelar ?? hero?.dust ?? 0}</span>
            <span className="text-[9px] text-amber-400/80 hidden md:inline">✦</span>
          </div>
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono shadow-sm shrink-0">
            <Trophy size={13} className="text-purple-400 shrink-0" />
            <span className="font-bold text-[10px] sm:text-xs truncate max-w-[70px] sm:max-w-[120px]">
              {hero?.pvpRank || getPvpRankInfo(hero?.pvpPoints || 0).name}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold shadow-sm shrink-0 text-[10px] sm:text-xs">
            <span className="text-[9px] text-cyan-400 font-bold">NV</span>
            <span>{hero?.level || 1}</span>
          </div>

          {/* Botón de Sonido ON/OFF */}
          <button
            onClick={() => setSoundEnabled(!soundOn)}
            className={`p-1.5 rounded-xl border transition-all shrink-0 ${
              soundOn 
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
            title={soundOn ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
          >
            {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
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

      {/* ========================================================================= */}
      {/* TAB 1: INICIO (SANCTUARY HUB) */}
      {/* ========================================================================= */}
      {activeCotzTab === 'inicio' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Cabecera Principal del Juego */}
          <div className="glass-panel p-5 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black border border-cyan-500/30 rounded-3xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                  SANTUARIO ASTRAL
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
                Encarna la fuerza primordial de tu signo solar. Purifica las 12 Casas Astrales, forja reliquias cósmicas, despierta tus compañeros sagrados y desata ataques combinados de sinastría con tus almas gemelas.
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

          {/* RESUMEN RÁPIDO DEL HÉROE CON ACCESO DIRECTO */}
          <div className="glass-panel p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-purple-950/20 to-black/60 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden p-0.5 border-2 border-cyan-400 bg-black flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
                <img 
                  src={hero?.avatarUrl || getZodiacIcon(hero?.sign || 'Aries')} 
                  alt="" 
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getZodiacIcon(hero?.sign || 'Aries');
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">{hero?.name || 'Héroe Astral'}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shrink-0">
                    NV {hero?.level || 1}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5 font-mono">
                  {hero?.sign || 'Aries'} • {hero?.element || 'Fuego'} • {heroClass?.name || 'Guerrero'}
                </p>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400 font-mono">
                  <span>HP: <strong className="text-white">{hero?.stats?.hp || 100}</strong></span>
                  <span>ATQ: <strong className="text-orange-300">{hero?.stats?.atk || 20}</strong></span>
                  <span>DEF: <strong className="text-blue-300">{hero?.stats?.def || 10}</strong></span>
                </div>
              </div>
            </div>

            <button
              onClick={openHero}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 shrink-0 cursor-pointer"
            >
              <span>Ver Hoja Completa de Personaje</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* GRID DE MÓDULOS RÁPIDOS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1 flex items-center gap-2">
              <Compass size={14} className="text-cyan-400" />
              <span>Módulos del Santuario</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. Héroe */}
              <button
                onClick={openHero}
                className="group p-3.5 rounded-2xl bg-gradient-to-b from-indigo-950/60 to-[#0c0a1f]/80 hover:from-indigo-900/70 border border-indigo-500/40 hover:border-indigo-400 text-left transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mb-2 group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Personaje</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Atributos y perfil</p>
              </button>

              {/* 2. Equipo */}
              <button
                onClick={openInventory}
                className="group p-3.5 rounded-2xl bg-gradient-to-b from-cyan-950/60 to-[#091522]/80 hover:from-cyan-900/70 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    <Package size={18} />
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
                    {Object.values(hero?.equipped || {}).filter(Boolean).length}/3
                  </span>
                </div>
                <h4 className="font-bold text-white text-xs">Equipo</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Mochila y reliquias</p>
              </button>

              {/* 3. Forja */}
              <button
                onClick={openForge}
                className="group p-3.5 rounded-2xl bg-gradient-to-b from-orange-950/60 to-[#1c0e05]/80 hover:from-orange-900/70 border border-orange-500/40 hover:border-orange-400 text-left transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-300 mb-2 group-hover:scale-110 transition-transform">
                  <Hammer size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Forja Cósmica</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Refinar hasta +10</p>
              </button>

              {/* 4. Skills */}
              <button
                onClick={openSkills}
                className="group p-3.5 rounded-2xl bg-gradient-to-b from-amber-950/60 to-[#1f1606]/80 hover:from-amber-900/70 border border-amber-500/40 hover:border-amber-400 text-left transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-2 group-hover:scale-110 transition-transform">
                  <Zap size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Skills</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Poderes astrales</p>
              </button>

              {/* 5. Aventura / Batalla */}
              <button
                onClick={() => openAdventure(null)}
                className="group p-3.5 rounded-2xl bg-gradient-to-b from-red-950/60 to-[#22070e]/80 hover:from-red-900/70 border border-red-500/40 hover:border-red-400 text-left transition-all shadow-lg hover:-translate-y-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-300 mb-2 group-hover:scale-110 transition-transform">
                  <Swords size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Aventura</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Selector de Modos</p>
              </button>

              {/* 6. Misiones */}
              <button
                onClick={openMisiones}
                className={`group p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/60 to-[#160624]/80 hover:from-purple-900/70 text-left transition-all shadow-lg hover:-translate-y-1 border cursor-pointer ${
                  hasDailyAlert ? 'border-amber-400 shadow-amber-500/20' : 'border-purple-500/40 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                    <Gift size={18} className={hasDailyAlert ? 'text-amber-300 animate-bounce' : 'text-purple-300'} />
                  </div>
                  {hasDailyAlert && (
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                      ¡LISTO!
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-white text-xs">Misiones</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Rachas y cofres</p>
              </button>
            </div>
          </div>

          {/* ESTADÍSTICAS Y ACCESOS RÁPIDOS A AVENTURAS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => openAdventure('houses')} 
              className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 block font-mono">12 CASAS</span>
                <ChevronRight size={12} className="text-gray-500 group-hover:text-cyan-300 transition-transform group-hover:translate-x-0.5" />
              </div>
              <span className="text-base font-bold text-cyan-300 font-mono mt-0.5 block">
                {hero?.maxHouseCleared || 0} / 12
              </span>
              <span className="text-[9px] text-gray-500">Purificadas</span>
            </button>

            <button 
              onClick={() => openAdventure('tower')} 
              className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/20 hover:border-purple-400/60 hover:bg-purple-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 block font-mono">TORRE DEL CAOS</span>
                <ChevronRight size={12} className="text-gray-500 group-hover:text-purple-300 transition-transform group-hover:translate-x-0.5" />
              </div>
              <span className="text-base font-bold text-purple-300 font-mono mt-0.5 block">
                Piso {hero?.maxTowerFloor || 1}
              </span>
              <span className="text-[9px] text-gray-500">Ascenso Astral</span>
            </button>

            <button 
              onClick={() => openAdventure('pvp')} 
              className="p-3.5 rounded-2xl bg-black/40 border border-red-500/20 hover:border-red-400/60 hover:bg-red-950/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 block font-mono">COLISEO PVP</span>
                <ChevronRight size={12} className="text-gray-500 group-hover:text-red-300 transition-transform group-hover:translate-x-0.5" />
              </div>
              <span className="text-base font-bold text-red-300 font-mono mt-0.5 block truncate">
                {hero?.pvpRank || getPvpRankInfo(hero?.pvpPoints || 0).name}
              </span>
              <span className="text-[9px] text-gray-500">{hero?.pvpPoints || 0} Puntos</span>
            </button>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/20">
              <span className="text-[10px] text-gray-400 block font-mono">RACHA DIARIA</span>
              <span className="text-base font-bold text-amber-300 font-mono mt-0.5 block">
                {hero?.dailyStreak || 1} Días
              </span>
              <span className="text-[9px] text-gray-500">Consecutivos</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HÉROE & COMPAÑEROS */}
      {/* ========================================================================= */}
      {activeCotzTab === 'heroe' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Sub-selector Héroe vs Mascotas */}
          <div className="flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
            <button
              onClick={() => setHeroeSubTab('perfil')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                heroeSubTab === 'perfil'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Perfil & Atributos</span>
            </button>
            <button
              onClick={() => setHeroeSubTab('mascotas')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                heroeSubTab === 'mascotas'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>🐾 Mascotas & Alquimia</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-black/30">
                {hero?.pets?.length || 1}
              </span>
            </button>
          </div>

          {heroeSubTab === 'perfil' ? (
            <HeroProfileCard 
              hero={hero} 
              onOpenInventory={openInventory} 
              onOpenSkillTree={openSkills}
              onOpenPetSanctuary={() => setHeroeSubTab('mascotas')}
            />
          ) : (
            <PetSanctuaryModal
              hero={hero}
              onClose={() => setHeroeSubTab('perfil')}
              onUpdateHero={(updated) => {
                setHero(updated);
                saveHeroProfile(updated);
              }}
              isInline={true}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EQUIPO & FORJA */}
      {/* ========================================================================= */}
      {activeCotzTab === 'equipo' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Sub-selector Mochila vs Forja Cósmica */}
          <div className="flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 w-fit">
            <button
              onClick={() => setEquipoSubTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                equipoSubTab === 'inventory'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Package size={14} />
              <span>Mochila & Reliquias</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-black/30">
                {Object.values(hero?.equipped || {}).filter(Boolean).length}/3
              </span>
            </button>
            <button
              onClick={() => setEquipoSubTab('forge')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                equipoSubTab === 'forge'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Hammer size={14} />
              <span>Forja Cósmica (+10)</span>
            </button>
          </div>

          {equipoSubTab === 'inventory' ? (
            <LootInventoryModal
              isOpen={true}
              onClose={() => {}}
              hero={hero}
              onUpdateHero={(updated) => {
                setHero(updated);
                saveHeroProfile(updated);
              }}
              onOpenForge={() => setEquipoSubTab('forge')}
              isInline={true}
            />
          ) : (
            <CosmicForgeModal
              isOpen={true}
              onClose={() => setEquipoSubTab('inventory')}
              hero={hero}
              onUpdateHero={(updated) => {
                setHero(updated);
                saveHeroProfile(updated);
              }}
              isInline={true}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ÁRBOL DE HABILIDADES */}
      {/* ========================================================================= */}
      {activeCotzTab === 'skills' && (
        <div className="space-y-4 animate-fadeIn">
          <SkillTreeModal
            isOpen={true}
            onClose={() => {}}
            hero={hero}
            onUpdateHero={(updated) => {
              setHero(updated);
              saveHeroProfile(updated);
            }}
            isInline={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: MISIONES & RECOMPENSAS */}
      {/* ========================================================================= */}
      {activeCotzTab === 'misiones' && (
        <div className="space-y-4 animate-fadeIn">
          <DailyRewardsModal
            isOpen={true}
            onClose={() => {}}
            hero={hero}
            onHeroUpdate={(updated) => {
              setHero(updated);
              saveHeroProfile(updated);
            }}
            transitBuff={transitBuff}
            isInline={true}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AVENTURA (EXPEDICIONES Y BATALLA) */}
      {/* ========================================================================= */}
      {activeCotzTab === 'aventura' && (
        <div className="space-y-6 animate-fadeIn">
          {activeBattle ? (
            <div className="max-w-5xl mx-auto px-1 sm:px-4 pb-20 animate-fadeIn">
              <BattleArena 
                key={activeBattle ? `${activeBattle.mode}_${activeBattle.enemy?.id || activeBattle.enemy?.name || activeBattle.houseNumber || activeBattle.floorNumber || 'battle'}` : 'none'}
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
          ) : selectedAdventureMode === null ? (
            /* ===================================================================== */
            /* HUB SELECTOR DE AVENTURAS */
            /* ===================================================================== */
            <div className="space-y-6 animate-fadeIn pb-12">
              {/* Cabecera del Hub */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0c1222] via-[#090d18] to-[#14081e] border border-cyan-500/30 shadow-2xl">
                {/* Decoración luminosa de fondo */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold mb-3 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <Sparkles size={13} className="text-cyan-300 animate-spin-slow" />
                      <span>HUB DE EXPEDICIONES Y BATALLA</span>
                    </div>
                    <h2 className="mystic-font text-2xl sm:text-3xl lg:text-4xl text-white font-bold tracking-wide">
                      Selector de Aventuras
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-300 font-light mt-2 leading-relaxed">
                      Elige tu senda astral en el firmamento. Avanza en la campaña de templos zodiacales, desafía la Torre del Caos, entrena contra sombras o compite por gloria en el Coliseo.
                    </p>
                  </div>

                  {/* Resumen rápido de progresión */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full md:w-auto shrink-0">
                    <div className="p-3 rounded-2xl bg-black/50 border border-cyan-500/20 backdrop-blur-sm">
                      <span className="text-[10px] text-gray-400 font-mono block">12 CASAS</span>
                      <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono">
                        {hero?.maxHouseCleared || 0}/12
                      </span>
                      <span className="text-[9px] text-gray-500 block">Purificadas</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/50 border border-purple-500/20 backdrop-blur-sm">
                      <span className="text-[10px] text-gray-400 font-mono block">TORRE CAOS</span>
                      <span className="text-sm sm:text-base font-bold text-purple-300 font-mono">
                        Piso {hero?.maxTowerFloor || 1}
                      </span>
                      <span className="text-[9px] text-gray-500 block">Récord</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/20 backdrop-blur-sm">
                      <span className="text-[10px] text-gray-400 font-mono block">ECLIPSE 1v2</span>
                      <span className="text-sm sm:text-base font-bold text-amber-300 font-mono">
                        {hero?.eclipseCleared?.length || 0}/{ECLIPSE_TWINS_CHALLENGES.length}
                      </span>
                      <span className="text-[9px] text-gray-500 block">Dominados</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/50 border border-red-500/20 backdrop-blur-sm">
                      <span className="text-[10px] text-gray-400 font-mono block">GLORIA PVP</span>
                      <span className="text-sm sm:text-base font-bold text-red-300 font-mono">
                        {hero?.pvpPoints || 0} pts
                      </span>
                      <span className="text-[9px] text-gray-500 block truncate">{hero?.pvpRank || 'Novato'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuadrícula de 6 Modos de Aventura */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {adventureModes.map((mode) => {
                  const ModeIcon = mode.icon;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => setSelectedAdventureMode(mode.id)}
                      className={`group relative flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-b ${mode.gradient} border ${mode.border} backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${mode.glowColor} cursor-pointer overflow-hidden`}
                    >
                      {/* Iluminación interactiva en hover */}
                      <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/[0.06] transition-colors pointer-events-none" />

                      {/* Header de la tarjeta */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${mode.badgeClass}`}>
                            {mode.badge}
                          </span>
                          <div className={`w-10 h-10 rounded-2xl border ${mode.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                            <ModeIcon size={20} />
                          </div>
                        </div>

                        <h3 className="mystic-font text-lg font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                          {mode.title}
                        </h3>
                        <div className={`text-xs font-mono font-semibold ${mode.accentText} mt-0.5`}>
                          {mode.subtitle}
                        </div>

                        <p className="text-xs text-gray-300 font-light mt-2.5 leading-relaxed line-clamp-3">
                          {mode.description}
                        </p>
                      </div>

                      {/* Pie de tarjeta: Estadísticas, Recompensas y Botón de Despliegue */}
                      <div className="relative z-10 mt-5 pt-3.5 border-t border-white/10 space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-gray-400">{mode.statsLabel}:</span>
                            <span className="text-white font-bold">{mode.statsValue}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${mode.btnBg} transition-all duration-500`}
                              style={{ width: `${Math.max(8, mode.progressPct)}%` }}
                            />
                          </div>
                        </div>

                        {/* Recompensas */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {mode.rewards.map((rew, i) => (
                            <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                              ✦ {rew}
                            </span>
                          ))}
                        </div>

                        {/* Botón de despliegue */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAdventureMode(mode.id);
                          }}
                          className={`w-full py-2.5 px-4 rounded-2xl ${mode.btnBg} font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer mt-2`}
                        >
                          <span>{mode.actionLabel}</span>
                          <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ===================================================================== */
            /* VISTA DESPLEGADA DE LA AVENTURA SELECCIONADA */
            /* ===================================================================== */
            <div className="space-y-5 animate-fadeIn pb-12">
              {/* Barra de Retorno y Switcher Rápido de Modos */}
              <div className="p-3 sm:p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedAdventureMode(null)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all group cursor-pointer shadow-sm self-start sm:self-auto"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  <span>← Volver al Selector de Aventuras</span>
                </button>

                {/* Mini selector horizontal de los otros modos para cambiar con 1 clic */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                  {adventureModes.map((m) => {
                    const MIcon = m.icon;
                    const isCurrent = selectedAdventureMode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedAdventureMode(m.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-md shadow-cyan-500/25 font-extrabold ring-1 ring-cyan-300'
                            : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        <MIcon size={12} />
                        <span>{m.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. MODO: SENDERO DE LAS 12 CASAS */}
              {selectedAdventureMode === 'houses' && (
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
      {selectedAdventureMode === 'eclipse' && (
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
      {selectedAdventureMode === 'tower' && (() => {
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
      {selectedAdventureMode === 'shadows' && (
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
      {selectedAdventureMode === 'coop' && (
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
      {selectedAdventureMode === 'pvp' && (
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
            </div>
          )}
        </div>
      )}

      {/* Botón inferior para salir al Menú Principal */}
      <div className="pt-6 pb-2 text-center border-t border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 hover:text-white px-6 py-3 rounded-2xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 shadow-lg shadow-cyan-950/30 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Volver al Menú Principal (Arcadia)
        </button>
      </div>

      {/* NAVEGACIÓN INFERIOR DE COTZ */}
      <CotzBottomNav
        activeTab={activeCotzTab}
        setActiveTab={handleCotzTabChange}
        hasAlert={hasDailyAlert}
        isInBattle={!!activeBattle}
      />
    </div>
  );
}
