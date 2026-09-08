"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, Sword, Shield, Zap, Sparkles, Flame, 
  Droplet, Wind, Mountain, AlertCircle, ArrowLeft,
  Trophy, RotateCcw, Skull, CheckCircle2, Star, Crown,
  Sun, Moon, Compass, Target, Crosshair, ChevronDown, ChevronUp,
  Swords, Users, Volume2, VolumeX
} from 'lucide-react';
import { 
  ELEMENTAL_AFFINITIES, 
  ZODIAC_HERO_CLASSES, 
  getZodiacIcon, 
  isValidImageUrl, 
  getEquippedSkills,
  PARTNER_ASSIST_SKILLS,
  getPvpRankInfo,
  ASTRAL_PETS_CATALOG,
  ALCHEMY_CONSUMABLES_CATALOG
} from './rpg-data';
import { 
  calculateHeroTotalStats, 
  calculateDamage, 
  processStatusEffects, 
  chooseEnemyAction,
  getElementalMultiplier,
  getSynastryCompatibility,
  getDailyTransitBuff
} from './rpg-engine';
import { 
  playBattleSlashSound, 
  playBattleAttackSound,
  playBattleHeavyHitSound, 
  playBattleHitSound,
  playBattleCritStrikeSound, 
  playBattleCritSound,
  playBattleShieldClangSound, 
  playBattleShieldSound,
  playBattleHealSound, 
  playBattleVictorySound, 
  playBattleDefeatSound,
  playElementalSkillSound,
  playSinastryAssistSound,
  playTurnReadySound,
  isSoundEnabled,
  setSoundEnabled
} from '../../../lib/sound-effects';

export function BattleArena({ 
  hero, 
  enemy, 
  enemy2 = null, 
  mode = 'quick', 
  partner = null, 
  mutator = null, 
  onBattleEnd, 
  onBack,
  onExitToMenu = null 
}) {
  // Reproductor seguro de efectos de sonido: atrapa cualquier error para no bloquear la batalla
  const safeSound = (fn, ...args) => {
    try {
      if (typeof fn === 'function') fn(...args);
    } catch (e) {
      console.warn("Audio non-critical warning:", e);
    }
  };

  const heroStats = calculateHeroTotalStats(hero);
  const heroClass = ZODIAC_HERO_CLASSES[hero.sign] || ZODIAC_HERO_CLASSES['Aries'];
  const heroElemMeta = ELEMENTAL_AFFINITIES[hero.element] || ELEMENTAL_AFFINITIES['Fuego'];

  // Habilidades equipadas del Árbol de Habilidades
  const equippedSkills = useMemo(() => getEquippedSkills(hero), [hero]);
  const skillSlot1 = equippedSkills[0] || heroClass.skill;
  const skillSlot2 = equippedSkills[1] || null;

  // Detección de combate dual (1 vs 2)
  const hasDualEnemies = !!enemy2;

  // Enemigo 1
  const enemy1Class = ZODIAC_HERO_CLASSES[enemy.sign || enemy.guardianSign] || heroClass;
  const enemy1Elem = enemy.element || enemy1Class.element || 'Fuego';
  const enemy1ElemMeta = ELEMENTAL_AFFINITIES[enemy1Elem] || ELEMENTAL_AFFINITIES['Fuego'];

  // Enemigo 2 (si existe)
  const enemy2Class = enemy2 ? (ZODIAC_HERO_CLASSES[enemy2.sign || enemy2.guardianSign] || heroClass) : null;
  const enemy2Elem = enemy2 ? (enemy2.element || enemy2Class.element || 'Aire') : 'Aire';
  const enemy2ElemMeta = enemy2 ? (ELEMENTAL_AFFINITIES[enemy2Elem] || ELEMENTAL_AFFINITIES['Aire']) : null;

  // Tránsito Planetario de Hoy
  const transitBuff = getDailyTransitBuff();
  const hasHeroTransitBoost = hero.element === transitBuff.moonElement;

  // Estados del Jugador
  const [playerHp, setPlayerHp] = useState(heroStats.maxHp);
  const [playerEther, setPlayerEther] = useState(mutator?.id === 'ether_surge' ? 3 : 2);
  const [playerUltimate, setPlayerUltimate] = useState(0);
  const [playerEffects, setPlayerEffects] = useState([]);
  const [playerShield, setPlayerShield] = useState(0);
  const [potionsLeft, setPotionsLeft] = useState(hero.potions ?? 3);

  // Mascota Astral Activa (Companion Pet)
  const activePet = heroStats.activePet;
  const [petTurnCount, setPetTurnCount] = useState(0);
  const [petAnim, setPetAnim] = useState(false);

  // Alquimia Táctica (Mochila de Consumibles)
  const [consumables, setConsumables] = useState(() => hero.consumables || {
    item_potion_hp: Math.max(3, hero.potions || 0),
    item_ether_elixir: 2,
    item_star_bomb: 1,
    item_cleanse_incense: 1,
    item_crit_stone: 1,
    item_aegis_talisman: 1
  });
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [critBuffTurns, setCritBuffTurns] = useState(0); // +50% Crit buff de piedra alquímica

  // Estados Tácticos del Jugador
  const [playerPosition, setPlayerPosition] = useState('frontline'); // 'frontline' (Vanguardia) | 'backline' (Retaguardia)
  const [playerStance, setPlayerStance] = useState('solar'); // 'solar' | 'lunar' | 'stellar'

  // Estados del Enemigo 1
  const enemy1MaxHp = enemy.hp || 500;
  const [enemy1Hp, setEnemy1Hp] = useState(enemy1MaxHp);
  const [enemy1Ether, setEnemy1Ether] = useState(1);
  const [enemy1Effects, setEnemy1Effects] = useState([]);
  const [enemy1Shield, setEnemy1Shield] = useState(0);
  const [enemy1Stagger, setEnemy1Stagger] = useState(3); // 3 golpes para ruptura

  // Estados del Enemigo 2
  const enemy2MaxHp = enemy2?.hp || 450;
  const [enemy2Hp, setEnemy2Hp] = useState(enemy2MaxHp);
  const [enemy2Ether, setEnemy2Ether] = useState(1);
  const [enemy2Effects, setEnemy2Effects] = useState([]);
  const [enemy2Shield, setEnemy2Shield] = useState(0);
  const [enemy2Stagger, setEnemy2Stagger] = useState(3);

  // Selector de objetivo activo (0 = Enemigo 1, 1 = Enemigo 2)
  const [activeTarget, setActiveTarget] = useState(0);

  // Refs de sincronización
  const playerHpRef = useRef(heroStats.maxHp);
  const playerShieldRef = useRef(0);
  const playerEffectsRef = useRef([]);

  const enemy1HpRef = useRef(enemy.hp || 500);
  const enemy1ShieldRef = useRef(0);
  const enemy1EffectsRef = useRef([]);
  const enemy1StaggerRef = useRef(3);

  const enemy2HpRef = useRef(enemy2?.hp || 450);
  const enemy2ShieldRef = useRef(0);
  const enemy2EffectsRef = useRef([]);
  const enemy2StaggerRef = useRef(3);

  // Detección de modos especiales
  const isCoop = mode === 'coop' && !!partner;
  const isPvp = mode === 'pvp';

  // Configuración de Sinastría y Asistencia de Compañero
  const synastry = isCoop ? getSynastryCompatibility(hero.sign, partner.sign) : null;
  const partnerAssistSkill = isCoop ? (PARTNER_ASSIST_SKILLS[partner.sign] || PARTNER_ASSIST_SKILLS['Leo']) : null;
  const partnerElemMeta = isCoop ? (ELEMENTAL_AFFINITIES[partner.element || 'Fuego'] || ELEMENTAL_AFFINITIES['Fuego']) : null;
  const partnerMaxHp = isCoop ? Math.round(heroStats.maxHp * 0.95) : 0;
  const [partnerHp, setPartnerHp] = useState(partnerMaxHp);

  // Configuración de PvP: Rango, Postura y Pociones del Rival
  const enemyRankInfo = isPvp ? getPvpRankInfo(enemy.gloryPoints ? enemy.gloryPoints * 10 : (hero.pvpPoints || 100)) : null;
  const [enemyStance, setEnemyStance] = useState(enemy.stance || 'solar');
  const [enemyPotionsLeft, setEnemyPotionsLeft] = useState(1);
  const [enemyUltimateGauge, setEnemyUltimateGauge] = useState(0);

  // Estados de animación y turno
  const [turn, setTurn] = useState('player'); // 'player' | 'enemy' | 'busy'
  const [animState, setAnimState] = useState({
    playerAttacking: false,
    playerCasting: false,
    playerHit: false,
    partnerAttacking: false,
    partnerHit: false,
    enemy1Attacking: false,
    enemy1Hit: false,
    enemy2Attacking: false,
    enemy2Hit: false,
    screenShake: false
  });
  const [activeVfx, setActiveVfx] = useState(null); // { type: 'slash' | 'skill' | 'ultimate', target: 'enemy1' | 'enemy2' | 'player' | 'all', element?: string }
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [battleLog, setBattleLog] = useState([
    isPvp
      ? `⚔️ ¡DUELO DEL COLISEO ASTRAL! ${hero.name} se enfrenta al gladiador [${enemy.name} - ${enemy.title || 'Campeón'}].`
      : isCoop
        ? `🌌 ¡INCURSIÓN DE SINASTRÍA! ${hero.name} y su compañero ${partner.name} (${synastry?.score}% compatibilidad) desafían a [${enemy.name}].`
        : hasDualEnemies 
          ? `🌌 ¡DESAFÍO 1vs2! ${hero.name} se enfrenta a los gemelos ${enemy.name} y ${enemy2.name}.`
          : `🌌 ¡Comienza el combate cósmico entre ${hero.name} y ${enemy.name || enemy.guardianName}!`,
    mutator ? `⚠️ Anomalía de Torre activa: [${mutator.name}] - ${mutator.desc}` : null,
    hasHeroTransitBoost ? `✨ ¡La Luna en ${transitBuff.moonSign} potencia tus habilidades de ${hero.element} (+15%)!` : null
  ].filter(Boolean));

  const [battleOutcome, setBattleOutcome] = useState(null); // 'victory' | 'defeat' | null
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [defeatingTarget, setDefeatingTarget] = useState(null); // 'enemy1' | 'enemy2' | 'both' | 'player' | null
  const [playerGhostHp, setPlayerGhostHp] = useState(playerHp);
  const [enemy1GhostHp, setEnemy1GhostHp] = useState(enemy1Hp);
  const [enemy2GhostHp, setEnemy2GhostHp] = useState(enemy2Hp);

  // Watchdog de resiliencia: Si la batalla queda congelada en 'busy' o 'enemy' por más de 4.5 segundos, forzar retorno a 'player'
  useEffect(() => {
    if (turn === 'player' || battleOutcome) return;
    const watchdog = setTimeout(() => {
      console.warn("Watchdog activado: Turno restablecido al jugador tras tiempo de espera excesivo.");
      setTurn('player');
      setAnimState({
        playerAttacking: false,
        playerCasting: false,
        playerHit: false,
        partnerAttacking: false,
        partnerHit: false,
        enemy1Attacking: false,
        enemy1Hit: false,
        enemy2Attacking: false,
        enemy2Hit: false,
        screenShake: false
      });
      setActiveVfx(null);
      try { playTurnReadySound(); } catch (e) {}
    }, 4500);
    return () => clearTimeout(watchdog);
  }, [turn, battleOutcome]);

  useEffect(() => {
    if (playerHp >= playerGhostHp) {
      setPlayerGhostHp(playerHp);
    } else {
      const timer = setTimeout(() => setPlayerGhostHp(playerHp), 250);
      return () => clearTimeout(timer);
    }
  }, [playerHp]);

  useEffect(() => {
    if (enemy1Hp >= enemy1GhostHp) {
      setEnemy1GhostHp(enemy1Hp);
    } else {
      const timer = setTimeout(() => setEnemy1GhostHp(enemy1Hp), 250);
      return () => clearTimeout(timer);
    }
  }, [enemy1Hp]);

  useEffect(() => {
    if (enemy2Hp >= enemy2GhostHp) {
      setEnemy2GhostHp(enemy2Hp);
    } else {
      const timer = setTimeout(() => setEnemy2GhostHp(enemy2Hp), 250);
      return () => clearTimeout(timer);
    }
  }, [enemy2Hp]);

  useEffect(() => {
    const handler = () => setSoundOn(isSoundEnabled());
    window.addEventListener('zodia-sound-toggle', handler);
    return () => window.removeEventListener('zodia-sound-toggle', handler);
  }, []);

  // Función para agregar textos flotantes
  const spawnFloatingText = (text, target = 'enemy1', type = 'damage') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, target, type }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1200);
  };

  // Función para registrar mensajes en el historial
  const logMessage = (msg) => {
    setBattleLog(prev => [msg, ...prev.slice(0, 18)]);
  };

  // Alternar automáticamente de objetivo si el activo fue derrotado
  useEffect(() => {
    if (hasDualEnemies) {
      if (activeTarget === 0 && enemy1Hp <= 0 && enemy2Hp > 0) {
        setActiveTarget(1);
      } else if (activeTarget === 1 && enemy2Hp <= 0 && enemy1Hp > 0) {
        setActiveTarget(0);
      }
    }
  }, [enemy1Hp, enemy2Hp, activeTarget, hasDualEnemies]);

  // Helpers para obtener referencias del objetivo activo
  const getTargetData = (targetIdx = activeTarget) => {
    if (targetIdx === 1 && hasDualEnemies) {
      return {
        idx: 1,
        enemyObj: enemy2,
        elem: enemy2Elem,
        hpRef: enemy2HpRef,
        setHp: setEnemy2Hp,
        maxHp: enemy2MaxHp,
        shieldRef: enemy2ShieldRef,
        setShield: setEnemy2Shield,
        effectsRef: enemy2EffectsRef,
        setEffects: setEnemy2Effects,
        staggerRef: enemy2StaggerRef,
        setStagger: setEnemy2Stagger,
        targetKey: 'enemy2'
      };
    }
    return {
      idx: 0,
      enemyObj: enemy,
      elem: enemy1Elem,
      hpRef: enemy1HpRef,
      setHp: setEnemy1Hp,
      maxHp: enemy1MaxHp,
      shieldRef: enemy1ShieldRef,
      setShield: setEnemy1Shield,
      effectsRef: enemy1EffectsRef,
      setEffects: setEnemy1Effects,
      staggerRef: enemy1StaggerRef,
      setStagger: setEnemy1Stagger,
      targetKey: 'enemy1'
    };
  };

  // ==========================================
  // TURNO DEL JUGADOR: 1. ATAQUE BÁSICO
  // ==========================================
  const handlePlayerBasicAttack = () => {
    if (turn !== 'player' || battleOutcome) return;
    setTurn('busy');

    safeSound(playBattleAttackSound);
    setAnimState(p => ({ ...p, playerAttacking: true }));

    setTimeout(() => {
      try {
        const tgt = getTargetData();
        const isStaggered = tgt.staggerRef.current <= 0;
        const basicDamageType = heroClass.basicAttack?.damageType || (heroClass.primaryDamageType === 'magical' ? 'magical' : 'physical');
        const isMagical = basicDamageType === 'magical';

        const { damage, isCrit, hasTransitBoost, isSuperEffective, damageType: finalDmgType } = calculateDamage(
          { 
            patk: heroStats.patk,
            matk: heroStats.matk,
            atk: heroStats.atk, 
            element: hero.element, 
            critRate: heroStats.critRate 
          },
          { 
            pdef: tgt.enemyObj.pdef || tgt.enemyObj.def || 25,
            mdef: tgt.enemyObj.mdef || tgt.enemyObj.def || 25,
            def: tgt.enemyObj.def || 25, 
            element: tgt.elem 
          },
          1.0,
          false,
          transitBuff.moonElement,
          {
            attackerPosition: playerPosition,
            defenderPosition: tgt.enemyObj.role === 'Retaguardia Rival' ? 'backline' : 'frontline',
            stance: playerStance,
            isStaggered,
            mutator,
            damageType: basicDamageType
          }
        );

        if (isCrit) safeSound(playBattleCritSound);
        else safeSound(playBattleHitSound);

        setActiveVfx({ type: isMagical ? 'skill' : 'slash', target: tgt.targetKey, element: hero.element });
        setTimeout(() => setActiveVfx(null), 500);

        setAnimState(p => ({ ...p, playerAttacking: false, [tgt.idx === 0 ? 'enemy1Hit' : 'enemy2Hit']: true, screenShake: isCrit }));
        setTimeout(() => setAnimState(p => ({ ...p, enemy1Hit: false, enemy2Hit: false, screenShake: false })), 400);

        // Reducir medidor de Tenacidad Astral (Stagger) si es crítico o super-efectivo
        if (isCrit || isSuperEffective) {
          tgt.staggerRef.current = Math.max(0, tgt.staggerRef.current - 1);
          tgt.setStagger(tgt.staggerRef.current);
          if (tgt.staggerRef.current === 0) {
            spawnFloatingText('¡RUPTURA CÓSMICA!', tgt.targetKey, 'crit');
            logMessage(`💥 ¡RUPTURA CÓSMICA en ${tgt.enemyObj.name}! Pierde su guardia (+50% daño recibido).`);
          }
        }

        // Absorción por escudo
        let finalDamage = damage;
        const iconPrefix = isMagical ? '🔮 ' : '⚔️ ';
        const floatType = isCrit ? 'crit' : (isMagical ? 'magic' : 'damage');

        if (tgt.shieldRef.current > 0) {
          if (damage <= tgt.shieldRef.current) {
            tgt.shieldRef.current -= damage;
            tgt.setShield(tgt.shieldRef.current);
            finalDamage = 0;
            spawnFloatingText(`¡Bloqueado (${damage})!`, tgt.targetKey, 'shield');
          } else {
            finalDamage = damage - tgt.shieldRef.current;
            tgt.shieldRef.current = 0;
            tgt.setShield(0);
            spawnFloatingText(`${iconPrefix}-${finalDamage}`, tgt.targetKey, floatType);
          }
        } else {
          spawnFloatingText(isCrit ? `${iconPrefix}¡CRÍTICO! -${finalDamage}` : `${iconPrefix}-${finalDamage}`, tgt.targetKey, floatType);
        }

        const nextHp = Math.max(0, tgt.hpRef.current - finalDamage);
        tgt.hpRef.current = nextHp;
        tgt.setHp(nextHp);

        // Recursos
        setPlayerEther(e => Math.min(5, e + 1));
        setPlayerUltimate(u => Math.min(100, u + (playerStance === 'solar' ? 22 : 18)));

        logMessage(`${iconPrefix}${hero.name} asestó [${heroClass.basicAttack.name}] infligiendo ${finalDamage} de daño ${isMagical ? 'mágico' : 'físico'}.${isCrit ? ' ¡Crítico!' : ''}${hasTransitBoost ? ' (Bono Tránsito)' : ''}`);

        // Comprobar si los enemigos fueron derrotados
        checkPostAttackOutcome();
      } catch (err) {
        console.error("Error in handlePlayerBasicAttack:", err);
        setTurn('player');
      }
    }, 450);
  };

  // ==========================================
  // TURNO DEL JUGADOR: 2. HABILIDAD EQUIPADA
  // ==========================================
  const handlePlayerCastSkill = (skill) => {
    if (!skill || turn !== 'player' || battleOutcome) return;
    const etherCost = skill.etherCost ?? 2;
    if (playerEther < etherCost) {
      logMessage(`⚠️ Necesitas ${etherCost} de Éter para usar [${skill.name}].`);
      return;
    }

    setTurn('busy');
    setPlayerEther(e => e - etherCost);

    safeSound(playElementalSkillSound, skill.element || hero.element);
    setAnimState(p => ({ ...p, playerCasting: true }));

    setTimeout(() => {
      try {
        const tgt = getTargetData();
        const isStaggered = tgt.staggerRef.current <= 0;
        const skillDamageType = skill.damageType || (heroClass.primaryDamageType === 'magical' ? 'magical' : 'physical');
        const isMagical = skillDamageType === 'magical';

        const { damage, isCrit, hasTransitBoost, isSuperEffective } = calculateDamage(
          { 
            patk: heroStats.patk,
            matk: heroStats.matk,
            atk: heroStats.atk, 
            element: hero.element, 
            critRate: (heroStats.critRate || 0.15) + (skill.critBonus || 0) 
          },
          { 
            pdef: tgt.enemyObj.pdef || tgt.enemyObj.def || 25,
            mdef: tgt.enemyObj.mdef || tgt.enemyObj.def || 25,
            def: tgt.enemyObj.def || 25, 
            element: tgt.elem 
          },
          skill.multiplier || 1.4,
          false,
          transitBuff.moonElement,
          {
            attackerPosition: playerPosition,
            defenderPosition: tgt.enemyObj.role === 'Retaguardia Rival' ? 'backline' : 'frontline',
            stance: playerStance,
            isStaggered,
            mutator,
            damageType: skillDamageType
          }
        );

        if (isCrit) safeSound(playBattleCritSound);
        else safeSound(playBattleHitSound);

        setActiveVfx({ type: isMagical ? 'skill' : 'slash', target: tgt.targetKey, element: hero.element });
        setTimeout(() => setActiveVfx(null), 650);

        setAnimState(p => ({ ...p, playerCasting: false, [tgt.idx === 0 ? 'enemy1Hit' : 'enemy2Hit']: true, screenShake: true }));
        setTimeout(() => setAnimState(p => ({ ...p, enemy1Hit: false, enemy2Hit: false, screenShake: false })), 400);

        // Reducir tenacidad del rival por habilidad
        tgt.staggerRef.current = Math.max(0, tgt.staggerRef.current - 1);
        tgt.setStagger(tgt.staggerRef.current);
        if (tgt.staggerRef.current === 0) {
          spawnFloatingText('¡RUPTURA CÓSMICA!', tgt.targetKey, 'crit');
          logMessage(`💥 ¡RUPTURA CÓSMICA en ${tgt.enemyObj.name}!`);
        }

        // Efectos específicos
        const effect = skill.effect || {};

        // Escudo
        if (effect.type === 'shield' || effect.type === 'shield_heal' || effect.shield) {
          let shieldVal = effect.shield || effect.value || 100;
          if (playerPosition === 'backline') shieldVal = Math.round(shieldVal * 1.35); // +35% en Retaguardia
          playerShieldRef.current += shieldVal;
          setPlayerShield(playerShieldRef.current);
          safeSound(playBattleShieldSound);
          spawnFloatingText(`+${shieldVal} Escudo`, 'player', 'shield');
        }

        // Sanación directa
        if (effect.heal || effect.type === 'heal' || effect.type === 'shield_heal') {
          let healVal = effect.heal || 120;
          if (playerPosition === 'backline') healVal = Math.round(healVal * 1.35);
          const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healVal);
          playerHpRef.current = nextPlayerHp;
          setPlayerHp(nextPlayerHp);
          safeSound(playBattleHealSound);
          spawnFloatingText(`+${healVal} HP`, 'player', 'heal');
        }

        // Robo de vida (Lifesteal)
        if (effect.type === 'lifesteal' || effect.ratio) {
          const leech = Math.max(1, Math.round(damage * (effect.ratio || 0.5)));
          const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + leech);
          playerHpRef.current = nextPlayerHp;
          setPlayerHp(nextPlayerHp);
          safeSound(playBattleHealSound);
          spawnFloatingText(`+${leech} Drenado`, 'player', 'heal');
        }

        // Estados alterados
        if (['burn', 'poison', 'bleed', 'stun'].includes(effect.type)) {
          tgt.effectsRef.current = [...tgt.effectsRef.current, { ...effect, id: Date.now() }];
          tgt.setEffects([...tgt.effectsRef.current]);
          const typeLabels = { burn: '🔥 QUEMADURA', poison: '🧪 VENENO', bleed: '🩸 SANGRADO', stun: '💫 ATURDIDO' };
          spawnFloatingText(typeLabels[effect.type] || effect.type.toUpperCase(), tgt.targetKey, 'buff');
        }

        // Drenaje o ganancia de éter
        if (effect.type === 'drain_ether') {
          const drain = effect.drain || 1;
          setPlayerEther(e => Math.min(5, e + drain));
          spawnFloatingText(`Drenó ${drain} Éter`, tgt.targetKey, 'shield');
        } else if (effect.type === 'ether') {
          const gain = effect.gain || 1;
          setPlayerEther(e => Math.min(5, e + gain));
          spawnFloatingText(`+${gain} Éter`, 'player', 'buff');
        }

        // Reflejo
        if (effect.type === 'reflect') {
          playerEffectsRef.current = [...playerEffectsRef.current, { ...effect, id: Date.now() }];
          setPlayerEffects([...playerEffectsRef.current]);
          spawnFloatingText('🪞 ESPEJO ACTIVO', 'player', 'shield');
        }

        // Purificación
        if (effect.cleanse) {
          playerEffectsRef.current = [];
          setPlayerEffects([]);
          spawnFloatingText('✨ Purificado', 'player', 'heal');
        }

        // Aplicar daño
        const nextHp = Math.max(0, tgt.hpRef.current - damage);
        tgt.hpRef.current = nextHp;
        tgt.setHp(nextHp);

        const floatType = isCrit ? 'crit' : (isMagical ? 'magic' : 'damage');
        const iconPrefix = isMagical ? '🔮 ' : '⚔️ ';
        spawnFloatingText(`${iconPrefix}-${damage}`, tgt.targetKey, floatType);
        setPlayerUltimate(u => Math.min(100, u + 24));

        logMessage(`${iconPrefix}${hero.name} desató [${skill.name}] infligiendo ${damage} de daño ${isMagical ? 'mágico' : 'físico'}${isCrit ? ' ¡CRÍTICO!' : ''} contra [${tgt.enemyObj.name}].`);

        checkPostAttackOutcome();
      } catch (err) {
        console.error("Error in handlePlayerCastSkill:", err);
        setTurn('player');
      }
    }, 500);
  };

  // ==========================================
  // TURNO DEL JUGADOR: 2.5 ASISTENCIA ASTRAL DEL COMPAÑERO (COOP)
  // ==========================================
  const handlePartnerAssist = () => {
    if (turn !== 'player' || battleOutcome || !isCoop || playerEther < 2) return;
    setTurn('busy');
    setPlayerEther(e => Math.max(0, e - 2));

    const skill = partnerAssistSkill;
    const target = getTargetData();

    safeSound(playSinastryAssistSound);
    setAnimState(p => ({ ...p, partnerAttacking: true }));

    setTimeout(() => {
      try {
        setAnimState(p => ({ ...p, partnerAttacking: false }));

        if (skill.type === 'attack' || skill.type === 'hybrid') {
          const { damage, isCrit } = calculateDamage(
            { atk: Math.round(heroStats.atk * 1.1), element: skill.element, critRate: skill.critGuaranteed ? 1.0 : 0.25 },
            { def: Math.round((target.enemyObj.def || 30) * (skill.pierceDef ? 0.5 : 1)), element: target.elem },
            skill.multiplier || 1.35,
            false,
            transitBuff.moonElement,
            { attackerPosition: 'frontline', stance: playerStance, isStaggered: target.staggerRef.current <= 0 }
          );

          if (isCrit) safeSound(playBattleCritSound);
          else safeSound(playBattleHitSound);

          setActiveVfx({ type: 'skill', target: target.targetKey, element: skill.element });
          setTimeout(() => setActiveVfx(null), 500);

          setAnimState(p => ({ ...p, [target.idx === 0 ? 'enemy1Hit' : 'enemy2Hit']: true, screenShake: isCrit }));
          setTimeout(() => setAnimState(p => ({ ...p, enemy1Hit: false, enemy2Hit: false, screenShake: false })), 400);

          const nextHp = Math.max(0, target.hpRef.current - damage);
          target.hpRef.current = nextHp;
          target.setHp(nextHp);

          spawnFloatingText(isCrit ? `¡CRÍTICO DE DÚO! -${damage}` : `-${damage}`, target.targetKey, isCrit ? 'crit' : 'damage');

          if (skill.staggerBreak) {
            const nextStagger = Math.max(0, target.staggerRef.current - skill.staggerBreak);
            target.staggerRef.current = nextStagger;
            target.setStagger(nextStagger);
          }

          if (skill.status) {
            target.effectsRef.current.push({ ...skill.status });
            target.setEffects([...target.effectsRef.current]);
          }
        }

        if (skill.type === 'heal' || skill.type === 'hybrid') {
          const heal = Math.round(heroStats.maxHp * (skill.healPercent || 0.30));
          const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + heal);
          playerHpRef.current = nextPlayerHp;
          setPlayerHp(nextPlayerHp);
          setPartnerHp(p => Math.min(partnerMaxHp, p + heal));
          safeSound(playBattleHealSound);
          spawnFloatingText(`+${heal} HP Dúo`, 'player', 'heal');

          if (skill.cleanse) {
            playerEffectsRef.current = [];
            setPlayerEffects([]);
          }
        }

        if (skill.type === 'shield') {
          const shieldAmt = skill.shieldAmount || 140;
          playerShieldRef.current += shieldAmt;
          setPlayerShield(playerShieldRef.current);
          safeSound(playBattleShieldSound);
          spawnFloatingText(`🛡️ +${shieldAmt} Escudo`, 'player', 'shield');
        }

        if (skill.etherBonus) {
          setPlayerEther(e => Math.min(5, e + skill.etherBonus));
          spawnFloatingText(`+${skill.etherBonus} Éter`, 'player', 'shield');
        }

        // Aumentar carga de Ultimate del Dúo (+25%)
        setPlayerUltimate(u => Math.min(100, u + 25));

        logMessage(`💫 ¡ASISTENCIA DE SINASTRÍA! ${partner.name} ejecutó [${skill.name}]: ${skill.desc}`);

        checkPostAttackOutcome();
      } catch (err) {
        console.error("Error in handlePartnerAssist:", err);
        setTurn('player');
      }
    }, 550);
  };

  // ==========================================
  // TURNO DEL JUGADOR: 3. ULTIMATE CÓSMICA (AOE EN 1v2 / SINASTRÍA DÚO)
  // ==========================================
  const handlePlayerUltimate = () => {
    if (turn !== 'player' || battleOutcome || playerUltimate < 100) return;
    setTurn('busy');
    setPlayerUltimate(0);

    if (isCoop) safeSound(playSinastryAssistSound);
    else safeSound(playElementalSkillSound, hero.element);
    safeSound(playBattleCritStrikeSound);

    setAnimState(p => ({ 
      ...p, 
      playerCasting: true, 
      partnerAttacking: isCoop, 
      screenShake: true 
    }));
    setActiveVfx({ type: 'ultimate', target: 'all' });
    setTimeout(() => setActiveVfx(null), 850);

    setTimeout(() => {
      try {
        const ult = heroClass.ultimate;
        const ultMultiplier = isCoop ? 3.4 : (ult.multiplier || 2.5);

        // Auto-curación de Ultimate
        if (ult.healSelf || isCoop) {
          const healAmount = isCoop ? 150 : (ult.healSelf || 70);
          const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healAmount);
          playerHpRef.current = nextPlayerHp;
          setPlayerHp(nextPlayerHp);
          safeSound(playBattleHealSound);
          spawnFloatingText(`+${healAmount} HP`, 'player', 'heal');
        }

        setAnimState(p => ({ ...p, playerCasting: false, enemy1Hit: true, enemy2Hit: hasDualEnemies }));
        setTimeout(() => setAnimState(p => ({ ...p, enemy1Hit: false, enemy2Hit: false, screenShake: false })), 600);

        // En 1v2, la Ultimate golpea a AMBOS enemigos simultáneamente (AoE Cataclísmico)
        const ultDamageType = heroClass.ultimate?.damageType || (heroClass.primaryDamageType === 'magical' ? 'magical' : 'physical');
        const hitEnemy = (enemyData, isSecond = false) => {
          if (enemyData.hpRef.current <= 0) return 0;
          const { damage } = calculateDamage(
            { 
              patk: heroStats.patk,
              matk: heroStats.matk,
              atk: heroStats.atk, 
              element: hero.element, 
              critRate: 1.0 
            },
            { 
              pdef: Math.round((enemyData.enemyObj.pdef || enemyData.enemyObj.def || 25) * 0.35),
              mdef: Math.round((enemyData.enemyObj.mdef || enemyData.enemyObj.def || 25) * 0.35),
              def: Math.round((enemyData.enemyObj.def || 25) * 0.35), 
              element: enemyData.elem 
            },
            isSecond ? ultMultiplier * 0.85 : ultMultiplier,
            true,
            transitBuff.moonElement,
            { 
              attackerPosition: playerPosition, 
              stance: playerStance, 
              isStaggered: enemyData.staggerRef.current <= 0, 
              mutator,
              damageType: ultDamageType
            }
          );

          const nextHp = Math.max(0, enemyData.hpRef.current - damage);
          enemyData.hpRef.current = nextHp;
          enemyData.setHp(nextHp);
          spawnFloatingText(`¡ALINEACIÓN! ${ultDamageType === 'magical' ? '🔮' : '⚔️'} -${damage}`, enemyData.targetKey, 'crit');

          // Rotura garantizada de guardia al recibir Ultimate
          enemyData.staggerRef.current = 0;
          enemyData.setStagger(0);

          return damage;
        };

        const dmg1 = hitEnemy(getTargetData(0));
        let dmg2 = 0;
        if (hasDualEnemies && enemy2HpRef.current > 0) {
          dmg2 = hitEnemy(getTargetData(1), true);
        }

        if (isCoop) {
          logMessage(`💫 ¡¡ATAQUE COMBINADO DE SINASTRÍA!! ${hero.name} y ${partner.name} desataron [${synastry.attackName}] infligiendo daño cataclísmico!`);
        } else {
          logMessage(`🌌 ¡¡ALINEACIÓN CÓSMICA!! [${ult.name}] barrió el campo causando ${dmg1 + dmg2} de daño total.`);
        }

        checkPostAttackOutcome();
      } catch (err) {
        console.error("Error in handlePlayerUltimate:", err);
        setTurn('player');
      }
    }, 600);
  };

  // ==========================================
  // TURNO DEL JUGADOR: 4. USAR CONSUMIBLE DE ALQUIMIA TÁCTICA
  // ==========================================
  const handleUseConsumable = (itemKey) => {
    if (turn !== 'player' || battleOutcome) return;
    const count = consumables[itemKey] || 0;
    if (count <= 0) return;

    const itemDef = ALCHEMY_CONSUMABLES_CATALOG.find(i => i.id === itemKey);
    if (!itemDef) return;

    // Decrementar cantidad
    const nextConsumables = { ...consumables, [itemKey]: count - 1 };
    setConsumables(nextConsumables);

    const target = getTargetData();

    if (itemKey === 'item_potion_hp') {
      const healAmount = 180;
      const nextHp = Math.min(heroStats.maxHp, playerHpRef.current + healAmount);
      playerHpRef.current = nextHp;
      setPlayerHp(nextHp);
      safeSound(playBattleHealSound);
      spawnFloatingText(`+${healAmount} HP`, 'player', 'heal');
      logMessage(`🧪 ${hero.name} consumió [${itemDef.name}] (+${healAmount} HP).`);
    } else if (itemKey === 'item_ether_elixir') {
      setPlayerEther(e => Math.min(5, e + 2));
      safeSound(playTurnReadySound);
      spawnFloatingText('+2 ÉTER', 'player', 'buff');
      logMessage(`✨ ${hero.name} bebió [${itemDef.name}] (+2 Éter instantáneo).`);
    } else if (itemKey === 'item_star_bomb') {
      safeSound(playBattleHeavyHitSound);
      const dmg = 160;
      const nextHp = Math.max(0, target.hpRef.current - dmg);
      target.hpRef.current = nextHp;
      target.setHp(nextHp);
      spawnFloatingText(`💣 -${dmg}`, target.targetKey, 'crit');
      logMessage(`💣 ${hero.name} lanzó [${itemDef.name}] causando ${dmg} de daño directo a [${target.enemyObj.name}].`);
      if (target.hpRef.current <= 0) {
        checkPostAttackOutcome();
      }
    } else if (itemKey === 'item_cleanse_incense') {
      playerEffectsRef.current = [];
      setPlayerEffects([]);
      safeSound(playBattleHealSound);
      spawnFloatingText('🌿 ¡PURIFICADO!', 'player', 'heal');
      logMessage(`🌿 ${hero.name} encendió [${itemDef.name}] disipando anomalías activas.`);
    } else if (itemKey === 'item_crit_stone') {
      setCritBuffTurns(2);
      safeSound(playTurnReadySound);
      spawnFloatingText('💎 +50% CRÍTICO', 'player', 'buff');
      logMessage(`💎 ${hero.name} activó [${itemDef.name}] (+50% Prob. Crítica x2 turnos).`);
    } else if (itemKey === 'item_aegis_talisman') {
      const shield = 220;
      playerShieldRef.current += shield;
      setPlayerShield(playerShieldRef.current);
      safeSound(playBattleShieldSound);
      spawnFloatingText(`🛡️ +${shield} Escudo`, 'player', 'shield');
      logMessage(`🛡️ ${hero.name} activó [${itemDef.name}] (+${shield} Escudo absorbente).`);
    }
  };

  // ==========================================
  // HABILIDAD AUTÓNOMA DE LA MASCOTA ASTRAL
  // ==========================================
  const triggerPetAction = (target, onComplete) => {
    if (!activePet) {
      if (onComplete) onComplete();
      return;
    }

    setPetAnim(true);
    safeSound(playElementalSkillSound, activePet.element || 'Fuego');
    spawnFloatingText(`🐾 ${activePet.passiveName}`, 'pet', 'buff');

    setTimeout(() => {
      try {
        setPetAnim(false);
        const actionPower = activePet.effectiveActionPower || {};

        // 1. Daño directo al objetivo
        if (actionPower.damage && target && target.hpRef.current > 0) {
          const dmg = actionPower.damage;
          const nextHp = Math.max(0, target.hpRef.current - dmg);
          target.hpRef.current = nextHp;
          target.setHp(nextHp);
          spawnFloatingText(`🐾 -${dmg}`, target.targetKey, 'crit');
        }

        // 2. Curación al jugador
        if (actionPower.heal) {
          const heal = actionPower.heal;
          const nextHp = Math.min(heroStats.maxHp, playerHpRef.current + heal);
          playerHpRef.current = nextHp;
          setPlayerHp(nextHp);
          safeSound(playBattleHealSound);
          spawnFloatingText(`+${heal} HP`, 'player', 'heal');
        }

        // 3. Escudo al jugador
        if (actionPower.shield) {
          const shield = actionPower.shield;
          playerShieldRef.current += shield;
          setPlayerShield(playerShieldRef.current);
          safeSound(playBattleShieldSound);
          spawnFloatingText(`🛡️ +${shield} Escudo`, 'player', 'shield');
        }

        // 4. Éter al jugador
        if (actionPower.ether) {
          setPlayerEther(e => Math.min(5, e + actionPower.ether));
          spawnFloatingText(`+${actionPower.ether} Éter`, 'player', 'buff');
        }

        // 5. Sangrado al enemigo
        if (actionPower.bleed && target) {
          target.effectsRef.current.push({ type: 'bleed', dot: actionPower.bleed, turns: actionPower.bleedTurns || 2, id: Date.now() });
          target.setEffects([...target.effectsRef.current]);
          spawnFloatingText('🩸 Sangrado', target.targetKey, 'buff');
        }

        // 6. Purificación
        if (actionPower.cleanse) {
          playerEffectsRef.current = [];
          setPlayerEffects([]);
          spawnFloatingText('✨ Purificado', 'player', 'heal');
        }

        logMessage(`🐾 ¡Tu compañero [${activePet.name}] desató [${activePet.passiveName}]!`);

        // Si el objetivo murió con el golpe de la mascota
        if (target && target.hpRef.current <= 0) {
          checkPostAttackOutcome();
          return;
        }
      } catch (e) {
        console.error("Error in triggerPetAction:", e);
      }

      if (onComplete) onComplete();
    }, 700);
  };

  // ==========================================
  // COMPROBACIÓN POST-ATAQUE Y CAMBIO DE TURNO
  // ==========================================
  const checkPostAttackOutcome = () => {
    try {
      const isEnemy1Dead = enemy1HpRef.current <= 0;
      const isEnemy2Dead = !hasDualEnemies || enemy2HpRef.current <= 0;

      if (isEnemy1Dead && isEnemy2Dead) {
        setTurn('busy');
        setDefeatingTarget(hasDualEnemies ? 'both' : 'enemy1');
        spawnFloatingText('💥 ¡ANIQUILADO!', activeTarget === 0 ? 'enemy1' : 'enemy2', 'crit');
        logMessage(`💥 ¡Impacto fulminante! Las sombras cósmicas se desintegran.`);
        setTimeout(() => {
          handleVictory();
        }, 1300);
        return;
      }

      if (hasDualEnemies && isEnemy1Dead && activeTarget === 0) {
        setDefeatingTarget('enemy1');
        setActiveTarget(1);
        logMessage(`💀 ¡La Sombra frontal ha caído! Ahora enfócate en [${enemy2?.name || 'Rival'}].`);
      }

      // Progresión de turnos de la Mascota Astral
      const target = getTargetData();
      const interval = activePet?.intervalTurns || 2;
      const nextTurns = petTurnCount + 1;
      setPetTurnCount(nextTurns);

      if (activePet && nextTurns >= interval) {
        setPetTurnCount(0);
        setTimeout(() => {
          triggerPetAction(target, () => {
            setTimeout(() => {
              try {
                startEnemyTurn();
              } catch (e) {
                console.error("Error launching startEnemyTurn after pet:", e);
                setTurn('player');
              }
            }, 450);
          });
        }, 400);
      } else {
        setTimeout(() => {
          try {
            startEnemyTurn();
          } catch (e) {
            console.error("Error launching startEnemyTurn:", e);
            setTurn('player');
          }
        }, 750);
      }
    } catch (err) {
      console.error("Error in checkPostAttackOutcome:", err);
      setTurn('player');
    }
  };

  // ==========================================
  // TURNO DEL ENEMIGO (O DE LOS 2 ENEMIGOS EN 1v2)
  // ==========================================
  const startEnemyTurn = () => {
    setTurn('enemy');

    // Función para ejecutar el ataque de un enemigo específico
    const executeSingleEnemyAttack = (enemyData, onComplete) => {
      try {
        if (!enemyData || !enemyData.hpRef || enemyData.hpRef.current <= 0) {
          onComplete();
          return;
        }

        // 1. Estados en el enemigo
        const statusRes = processStatusEffects(enemyData.effectsRef?.current || [], enemyData.hpRef.current, enemyData.maxHp || 500);
        enemyData.hpRef.current = statusRes.nextHp;
        enemyData.setHp(statusRes.nextHp);
        enemyData.effectsRef.current = statusRes.updatedEffects;
        enemyData.setEffects(statusRes.updatedEffects);
        (statusRes.logMessages || []).forEach(m => logMessage(m));

        if (statusRes.nextHp <= 0) {
          logMessage(`💀 [${enemyData.enemyObj?.name || 'Enemigo'}] sucumbió ante los efectos residuales.`);
          onComplete();
          return;
        }

        // 2. Comprobar Ruptura (Stagger) o Aturdimiento (Stun)
        if ((enemyData.staggerRef?.current ?? 3) <= 0) {
          logMessage(`💫 [${enemyData.enemyObj?.name || 'Enemigo'}] está en RUPTURA CÓSMICA y no puede actuar este turno.`);
          spawnFloatingText('¡Incapacitado!', enemyData.targetKey, 'buff');
          enemyData.staggerRef.current = 3; // Se recupera de la ruptura para el próximo turno
          enemyData.setStagger(3);
          setTimeout(onComplete, 600);
          return;
        }

        const stunIdx = (enemyData.effectsRef?.current || []).findIndex(e => e.type === 'stun');
        if (stunIdx !== -1) {
          logMessage(`💫 [${enemyData.enemyObj?.name || 'Enemigo'}] está aturdido y pierde su turno.`);
          spawnFloatingText('¡Aturdido!', enemyData.targetKey, 'buff');
          enemyData.effectsRef.current.splice(stunIdx, 1);
          enemyData.setEffects([...enemyData.effectsRef.current]);
          setTimeout(onComplete, 600);
          return;
        }

        // 3. IA Ataca al jugador (Con lógica táctica PvP)
        if (isPvp && enemyData.idx === 0) {
          // 3a. Uso de poción de emergencia por el rival
          if (enemyData.hpRef.current / (enemyData.maxHp || 1) < 0.35 && enemyPotionsLeft > 0) {
            const potionHeal = Math.round((enemyData.maxHp || 500) * 0.35);
            const newHp = Math.min(enemyData.maxHp, enemyData.hpRef.current + potionHeal);
            enemyData.hpRef.current = newHp;
            enemyData.setHp(newHp);
            setEnemyPotionsLeft(0);
            safeSound(playBattleHealSound);
            spawnFloatingText(`+${potionHeal} HP`, enemyData.targetKey, 'heal');
            logMessage(`🧪 [${enemyData.enemyObj?.name || 'Rival'}] usó una Poción Astral de emergencia restaurando ${potionHeal} HP.`);
          }

          // 3b. Cambio de postura táctica del rival
          if (enemyData.hpRef.current / (enemyData.maxHp || 1) < 0.40 && enemyStance !== 'lunar') {
            setEnemyStance('lunar');
            logMessage(`🌙 [${enemyData.enemyObj?.name || 'Rival'}] cambia a Postura Lunar para aumentar su defensa.`);
          } else if (playerHpRef.current / (heroStats.maxHp || 1) < 0.35 && enemyStance !== 'solar') {
            setEnemyStance('solar');
            logMessage(`☀️ [${enemyData.enemyObj?.name || 'Rival'}] adopta Postura Solar agresiva buscando el remate.`);
          }
        }

        let isRivalUlt = false;
        if (isPvp && enemyData.idx === 0 && enemyUltimateGauge >= 100) {
          isRivalUlt = true;
          setEnemyUltimateGauge(0);
        } else if (isPvp && enemyData.idx === 0) {
          setEnemyUltimateGauge(u => Math.min(100, u + 25));
        }

        const action = isRivalUlt
          ? { type: 'ultimate', name: `Cataclismo de ${enemyData.enemyObj?.sign || 'Gladiador'}` }
          : chooseEnemyAction(enemyData.enemyObj || {}, enemyData.hpRef.current, enemyData.maxHp || 500, 2);

        if (isRivalUlt || action.type === 'skill') {
          safeSound(playElementalSkillSound, enemyData.elem);
        } else {
          safeSound(playBattleSlashSound);
        }
        setAnimState(p => ({ ...p, [enemyData.idx === 0 ? 'enemy1Attacking' : 'enemy2Attacking']: true }));

        setTimeout(() => {
          try {
            const isSkill = action.type === 'skill';
            let mult = isSkill ? 1.35 : 1.0;
            if (isRivalUlt) mult = 2.3;

            const enemyDamageType = enemyData.enemyObj?.primaryDamageType 
              || (['Agua', 'Aire'].includes(enemyData.elem) || isSkill ? 'magical' : 'physical');
            const isEnemyMagical = enemyDamageType === 'magical';

            const { damage, isCrit } = calculateDamage(
              { 
                patk: enemyData.enemyObj?.patk || enemyData.enemyObj?.atk || 55,
                matk: enemyData.enemyObj?.matk || enemyData.enemyObj?.atk || 55,
                atk: enemyData.enemyObj?.atk || 55, 
                element: enemyData.elem, 
                critRate: isRivalUlt ? 0.4 : 0.12 
              },
              { 
                pdef: heroStats.pdef,
                mdef: heroStats.mdef,
                def: heroStats.def || 20, 
                element: hero.element 
              },
              mult,
              false,
              null,
              {
                attackerPosition: 'frontline',
                defenderPosition: playerPosition,
                stance: isPvp && enemyData.idx === 0 ? enemyStance : playerStance,
                mutator,
                damageType: enemyDamageType
              }
            );

            if (isCrit) safeSound(playBattleCritSound);
            else safeSound(playBattleHitSound);

            setActiveVfx({ type: isRivalUlt ? 'ultimate' : (isSkill ? 'skill' : 'slash'), target: 'player', element: enemyData.elem });
            setTimeout(() => setActiveVfx(null), 500);

            setAnimState(p => ({ ...p, enemy1Attacking: false, enemy2Attacking: false, playerHit: true, screenShake: isCrit || isRivalUlt }));
            setTimeout(() => setAnimState(p => ({ ...p, playerHit: false, screenShake: false })), 400);

            // Absorción por escudo del jugador
            let finalDmg = damage;
            const iconPrefix = isEnemyMagical ? '🔮 ' : '⚔️ ';
            const floatType = isCrit ? 'crit' : (isEnemyMagical ? 'magic' : 'damage');

            if (playerShieldRef.current > 0) {
              if (damage <= playerShieldRef.current) {
                playerShieldRef.current -= damage;
                setPlayerShield(playerShieldRef.current);
                finalDmg = 0;
                safeSound(playBattleShieldClangSound);
                spawnFloatingText(`¡Bloqueaste (${damage})!`, 'player', 'shield');
              } else {
                finalDmg = damage - playerShieldRef.current;
                playerShieldRef.current = 0;
                setPlayerShield(0);
                spawnFloatingText(`${iconPrefix}-${finalDmg}`, 'player', floatType);
              }
            } else {
              spawnFloatingText(isCrit ? `${iconPrefix}¡CRÍTICO! -${finalDmg}` : `${iconPrefix}-${finalDmg}`, 'player', floatType);
            }

            // En Modo Cooperativo: El compañero puede interceptar parte del daño para proteger al héroe
            if (isCoop && partnerHp > 0 && finalDmg > 20 && Math.random() < 0.35) {
              const interceptedDmg = Math.round(finalDmg * 0.40);
              finalDmg -= interceptedDmg;
              setPartnerHp(p => Math.max(0, p - interceptedDmg));
              setAnimState(p => ({ ...p, partnerHit: true }));
              setTimeout(() => setAnimState(p => ({ ...p, partnerHit: false })), 400);
              spawnFloatingText(`🛡️ Interceptado -${interceptedDmg}`, 'player', 'shield');
              logMessage(`🛡️ ¡${partner?.name || 'Compañero'} interceptó ${interceptedDmg} de daño para salvaguardar a ${hero.name}!`);
            }

            // Reflejo de daño si el jugador tiene el efecto activo
            const reflectIndex = playerEffectsRef.current.findIndex(e => e.type === 'reflect');
            if (reflectIndex !== -1 && finalDmg > 0) {
              const reflectDmg = Math.max(1, Math.round(finalDmg * 0.70));
              const newHp = Math.max(0, enemyData.hpRef.current - reflectDmg);
              enemyData.hpRef.current = newHp;
              enemyData.setHp(newHp);
              spawnFloatingText(`🪞 Reflejo -${reflectDmg}`, enemyData.targetKey, 'crit');
              logMessage(`🪞 ¡El Espejo Astral de ${hero.name} reflejó ${reflectDmg} a [${enemyData.enemyObj?.name || 'Enemigo'}]!`);
            }

            const nextPlayerHp = Math.max(0, playerHpRef.current - finalDmg);
            playerHpRef.current = nextPlayerHp;
            setPlayerHp(nextPlayerHp);

            if (isRivalUlt) {
              logMessage(`⚡ ¡¡ALINEACIÓN RIVAL!! [${enemyData.enemyObj?.name || 'Rival'}] desató [${action.name}] causando ${finalDmg} de daño catastrófico.`);
            } else {
              logMessage(`⚡ [${enemyData.enemyObj?.name || 'Enemigo'}] usó [${action.name}] causando ${finalDmg} de daño.`);
            }

            if (nextPlayerHp <= 0) {
              setTurn('busy');
              setDefeatingTarget('player');
              spawnFloatingText('💔 ¡ENERGÍA AGOTADA!', 'player', 'crit');
              logMessage(`💔 La fuerza vital de ${hero.name} ha colapsado.`);
              setTimeout(() => {
                handleDefeat();
              }, 1300);
            } else {
              setTimeout(onComplete, 450);
            }
          } catch (innerErr) {
            console.error("Error resolving enemy attack:", innerErr);
            onComplete();
          }
        }, 500);
      } catch (outerErr) {
        console.error("Error executing enemy attack:", outerErr);
        onComplete();
      }
    };

    // Secuencia de turnos: Enemigo 1 -> (Enemigo 2 si vive) -> Vuelta al Jugador
    try {
      executeSingleEnemyAttack(getTargetData(0), () => {
        if (playerHpRef.current <= 0) return;

        if (hasDualEnemies && enemy2HpRef.current > 0) {
          setTimeout(() => {
            try {
              executeSingleEnemyAttack(getTargetData(1), () => {
                finishEnemyRound();
              });
            } catch (e2) {
              console.error("Error on enemy2 attack:", e2);
              finishEnemyRound();
            }
          }, 450);
        } else {
          finishEnemyRound();
        }
      });
    } catch (startErr) {
      console.error("Error starting enemy attacks:", startErr);
      finishEnemyRound();
    }
  };

  // Fin de ronda enemiga: procesar estados del jugador y devolver turno
  const finishEnemyRound = () => {
    try {
      // Comprobar si ambos enemigos murieron por daño residual (veneno/quemadura)
      const isEnemy1Dead = enemy1HpRef.current <= 0;
      const isEnemy2Dead = !hasDualEnemies || enemy2HpRef.current <= 0;
      if (isEnemy1Dead && isEnemy2Dead) {
        setTurn('busy');
        setDefeatingTarget(hasDualEnemies ? 'both' : 'enemy1');
        spawnFloatingText('💥 ¡ANIQUILADO!', 'enemy1', 'crit');
        setTimeout(() => {
          handleVictory();
        }, 1300);
        return;
      }

      if (playerHpRef.current <= 0) return;

      // Procesar venenos/sangrados en el jugador
      const playerStatus = processStatusEffects(playerEffectsRef.current, playerHpRef.current, heroStats.maxHp);
      playerHpRef.current = playerStatus.nextHp;
      setPlayerHp(playerStatus.nextHp);
      playerEffectsRef.current = playerStatus.updatedEffects;
      setPlayerEffects(playerStatus.updatedEffects);
      (playerStatus.logMessages || []).forEach(m => logMessage(m));

      if (playerStatus.nextHp <= 0) {
        setTurn('busy');
        setDefeatingTarget('player');
        spawnFloatingText('💔 ¡ENERGÍA AGOTADA!', 'player', 'crit');
        logMessage(`💔 La fuerza vital de ${hero.name} ha colapsado.`);
        setTimeout(() => {
          handleDefeat();
        }, 1300);
        return;
      }

      // Inicio del nuevo turno del Jugador: Beneficios Tácticos
      // 1. Postura Lunar: Regenera 4% HP
      if (playerStance === 'lunar') {
        const regen = Math.max(1, Math.round(heroStats.maxHp * 0.04));
        const nextHp = Math.min(heroStats.maxHp, playerHpRef.current + regen);
        playerHpRef.current = nextHp;
        setPlayerHp(nextHp);
        spawnFloatingText(`+${regen} Lunar`, 'player', 'heal');
      }

      // 2. Retaguardia: Gana +1 Éter extra
      if (playerPosition === 'backline') {
        setPlayerEther(e => Math.min(5, e + 1));
        spawnFloatingText('+1 Éter (Retaguardia)', 'player', 'shield');
      }

      // 3. Mutador Sobrecarga de Éter
      if (mutator?.id === 'ether_surge') {
        setPlayerEther(e => Math.min(5, e + 1));
      }

      // 4. Mutador Eclipse Sangriento: Sangrado leve
      if (mutator?.id === 'blood_eclipse') {
        playerEffectsRef.current = [...playerEffectsRef.current, { type: 'bleed', turns: 1, damage: 15 }];
        setPlayerEffects([...playerEffectsRef.current]);
      }

      // 5. Consumible Piedra de Enfoque Cósmico: Duración
      if (critBuffTurns > 0) {
        setCritBuffTurns(c => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Error in finishEnemyRound:", err);
    } finally {
      setTurn('player');
      safeSound(playTurnReadySound);
    }
  };

  // ==========================================
  // MANEJO DE RESULTADOS
  // ==========================================
  const handleVictory = () => {
    setBattleOutcome('victory');
    playBattleVictorySound();
    logMessage(`🏆 ¡VICTORIA CÓSMICA! Has superado el desafío astral.`);
  };

  const handleDefeat = () => {
    setBattleOutcome('defeat');
    playBattleDefeatSound();
    logMessage(`💀 Has sido derrotado. Tu energía astral regresa al Éter.`);
  };

  // Recompensas calculadas
  const totalExpReward = hasDualEnemies ? (enemy.rewardExp || 180) + (enemy2.rewardExp || 160) : (enemy.rewardExp || 120);
  const totalGoldReward = hasDualEnemies ? (enemy.rewardGold || 220) + (enemy2.rewardGold || 200) : (enemy.rewardGold || 150);

  return (
    <div className="relative min-h-[600px] rounded-3xl overflow-hidden glass-panel border border-cyan-500/30 p-4 sm:p-6 bg-gradient-to-b from-black via-purple-950/30 to-black select-none">
      
      {/* Fondo de Estrellas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black -z-10" />

      {/* BARRA SUPERIOR DE CONTROL Y TÁCTICA */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 transition-all shadow-sm group"
            title="Volver al mapa del RPG"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Retirada al Mapa
          </button>

          {onExitToMenu && (
            <button
              onClick={onExitToMenu}
              className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white px-3 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 transition-all shadow-sm"
              title="Salir completamente al Menú Principal (Arcadia Astral)"
            >
              Menú Principal
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mutador de Torre activo */}
          {mutator && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-bold">
              <Flame size={11} /> {mutator.name}
            </div>
          )}

          {/* Badge de Tránsito Lunar */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-200 shadow-sm">
            <span>{transitBuff.moonGlyph}</span>
            <span>{transitBuff.moonSign}</span>
            <span className="font-bold text-amber-300">({transitBuff.moonElement} +15%)</span>
          </div>

          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
            {isPvp ? '⚔️ Coliseo Astral PvP' : isCoop ? '🤝 Incursión Sinastría' : mode === 'eclipse' ? '⚡ Desafío 1 vs 2' : mode === 'tower' ? '🗼 Torre del Caos' : mode === 'houses' ? 'Sendero 12 Casas' : 'Duelo Astral'}
          </span>

          {/* Botón de Audio ON/OFF */}
          <button
            onClick={() => setSoundEnabled(!soundOn)}
            className={`p-1.5 rounded-xl border transition-all ${
              soundOn 
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
            title={soundOn ? 'Silenciar efectos de sonido' : 'Activar efectos de sonido'}
          >
            {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESTADIO DE COMBATE VERTICAL (ASTRAL BATTLE ARENA) */}
      {/* Arriba: Enemigo(s) | Centro: Choque / Turno | Abajo: Jugador */}
      {/* ========================================================================= */}
      <div className="relative min-h-[440px] sm:min-h-[480px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-[#090b20] via-[#04050d] to-[#0b0820] p-3 sm:p-5 flex flex-col justify-between shadow-2xl backdrop-blur-md">
        
        {/* Telón estelar y runas celestiales */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-black pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-purple-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none" />

        {/* BANNER TÁCTICO PARA PVP O COOP */}
        {isPvp && (
          <div className="relative z-10 w-full max-w-md mx-auto mb-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-red-950/60 via-amber-950/60 to-red-950/60 border border-amber-500/40 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
              <Swords size={14} className="text-amber-400" /> Duelo de Clasificación
            </div>
            <div className="text-[10px] font-mono text-gray-200">
              Victoria: <span className="text-amber-400 font-bold">+{enemy.gloryPoints || 35} Pts de Gloria</span>
            </div>
          </div>
        )}

        {isCoop && (
          <div className="relative z-10 w-full max-w-md mx-auto mb-2 py-1.5 px-3 rounded-xl bg-gradient-to-r from-teal-950/60 via-emerald-950/60 to-cyan-950/60 border border-teal-500/40 flex items-center justify-between text-xs shadow-lg">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold uppercase tracking-wider text-[10px]">
              <Users size={14} className="text-teal-400" /> Incursión Cooperativa Dúo
            </div>
            <div className="text-[10px] font-mono text-cyan-200">
              Vínculo con <strong className="text-white">{partner.name}</strong>: <span className="text-amber-300 font-bold">{synastry?.score}% Sinastría</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 1. SECCIÓN SUPERIOR: EL / LOS ENEMIGOS ASTRALES */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 w-full flex flex-col items-center">
          
          {/* Layout de 1 Enemigo o 2 Enemigos (1vs2) */}
          <div className={`w-full ${hasDualEnemies ? 'grid grid-cols-2 gap-2 sm:gap-4 max-w-md mx-auto' : 'flex flex-col items-center max-w-sm mx-auto'}`}>
            
            {/* ENEMIGO 1 */}
            <div 
              onClick={() => hasDualEnemies && enemy1Hp > 0 && setActiveTarget(0)}
              className={`flex flex-col items-center w-full transition-all ${
                hasDualEnemies ? 'cursor-pointer' : ''
              } ${hasDualEnemies && activeTarget !== 0 ? 'opacity-70 hover:opacity-100' : ''}`}
            >
              {/* HUD ENEMIGO 1 */}
              <div className={`w-full mb-1.5 p-2 rounded-xl border transition-all text-[11px] bg-black/75 backdrop-blur-sm ${
                activeTarget === 0 && enemy1Hp > 0 
                  ? 'border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40' 
                  : 'border-white/10'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-white mystic-font truncate">{enemy.name || enemy.guardianName}</span>
                    <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${enemy1ElemMeta.text} ${enemy1ElemMeta.bg}`}>
                      {enemy1Elem}
                    </span>
                    {isPvp && enemyRankInfo && (
                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold border ${enemyRankInfo.badgeColor} hidden sm:inline`}>
                        {enemyRankInfo.name}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-red-300 shrink-0 text-[10px]">{enemy1Hp}/{enemy1MaxHp}</span>
                </div>

                {/* Barra de Vida con Animación Gradual y Barra Fantasma de Daño */}
                <div className="relative w-full h-2.5 bg-black/70 border border-white/15 rounded-full overflow-hidden shadow-inner">
                  {/* Barra Fantasma (Trail de daño recibido) */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-white/40 rounded-full transition-[width] duration-500 ease-out z-0"
                    style={{ width: `${Math.min(100, Math.max(0, (enemy1GhostHp / enemy1MaxHp) * 100))}%` }}
                  />
                  {/* Barra Principal de Vida */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-[width] duration-300 ease-out shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10"
                    style={{ width: `${Math.min(100, Math.max(0, (enemy1Hp / enemy1MaxHp) * 100))}%` }}
                  />
                </div>

                {/* Tenacidad Astral (Ruptura) y Postura en PvP */}
                <div className="flex items-center justify-between mt-1 text-[9px]">
                  <span className="text-gray-400 truncate">
                    {isPvp ? (
                      <span className="text-amber-300 font-bold">
                        {enemy.title || 'Gladiador Astral'} ({enemyStance === 'solar' ? '☀️ Solar' : enemyStance === 'lunar' ? '🌙 Lunar' : '🧭 Estelar'})
                      </span>
                    ) : (
                      enemy.role || 'Guardián'
                    )}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {enemy1Stagger > 0 ? (
                      [...Array(3)].map((_, i) => (
                        <span key={i} className={`text-[9px] ${i < enemy1Stagger ? 'text-cyan-400' : 'text-gray-600'}`}>◆</span>
                      ))
                    ) : (
                      <span className="text-[8px] font-bold text-red-400 animate-pulse">¡RUPTURA! (+50%)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar y Pedestal Enemigo 1 */}
              <div className="relative flex flex-col items-center">
                <div 
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border-2 ${enemy1ElemMeta.border} bg-gradient-to-b from-black to-purple-950/80 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                    (defeatingTarget === 'enemy1' || defeatingTarget === 'both')
                      ? 'animate-defeat-dissolve z-30'
                      : enemy1Hp <= 0 
                        ? 'opacity-25 grayscale' 
                        : animState.enemy1Attacking 
                          ? 'animate-battle-lunge-down z-30' 
                          : animState.enemy1Hit 
                            ? 'animate-battle-hurt-up bg-red-950/80' 
                            : enemy1Stagger === 0 
                              ? 'animate-pulse ring-4 ring-red-500/70' 
                              : ''
                  } ${activeTarget === 0 && enemy1Hp > 0 ? 'ring-2 ring-amber-400 shadow-amber-500/30' : ''}`}
                >
                  {(defeatingTarget === 'enemy1' || defeatingTarget === 'both') && (
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-4 border-amber-300 animate-defeat-shockwave pointer-events-none" />
                  )}
                  {isPvp && isValidImageUrl(enemy.avatarUrl) ? (
                    <img src={enemy.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                  ) : (
                    <img 
                      src={getZodiacIcon(enemy.guardianSign || enemy.sign || 'Aries')} 
                      alt="" 
                      className="w-10 h-10 sm:w-14 sm:h-14 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                    />
                  )}

                  {/* Retícula de Objetivo Fijado */}
                  {activeTarget === 0 && enemy1Hp > 0 && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-black text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md whitespace-nowrap">
                      <Crosshair size={9} className="animate-spin" /> Fijado
                    </div>
                  )}

                  {/* Slash / Magic Burst sobre Enemigo 1 */}
                  {activeVfx && (activeVfx.target === 'enemy1' || activeVfx.target === 'enemy') && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                      {activeVfx.type === 'slash' && (
                        <div className="animate-slash-sweep w-28 sm:w-36 h-2.5 bg-gradient-to-r from-transparent via-cyan-200 to-amber-100 shadow-[0_0_20px_rgba(56,189,248,1)] rounded-full rotate-[-35deg]" />
                      )}
                      {activeVfx.type === 'skill' && (
                        <div className="animate-magic-burst-ring w-20 h-20 rounded-full border-4 border-purple-400 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-cyan-500/30 shadow-[0_0_30px_rgba(168,85,247,0.9)] flex items-center justify-center">
                          <Sparkles size={24} className="text-amber-300 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pedestal de Sombra Enemigo 1 */}
                <div className="w-20 sm:w-28 h-5 sm:h-6 rounded-[50%] bg-gradient-to-r from-purple-900/30 via-red-950/50 to-purple-900/30 border border-purple-500/30 -mt-2.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center">
                  <div className="w-10 h-1.5 rounded-[50%] bg-purple-500/20 blur-xs" />
                </div>

                {/* Textos Flotantes Enemigo 1 */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                  {floatingTexts.filter(t => t.target === 'enemy1' || t.target === 'enemy').map(t => (
                    <span 
                      key={t.id} 
                      className={`text-xs sm:text-sm font-black font-mono animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                        t.type === 'crit' 
                          ? 'text-amber-300 text-sm sm:text-base scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' 
                          : t.type === 'shield' 
                            ? 'text-blue-300' 
                            : t.type === 'magic'
                              ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]'
                              : 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]'
                      }`}
                    >
                      {t.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ENEMIGO 2 (SOLO EN 1v2 O TORRE DUAL) */}
            {hasDualEnemies && (
              <div 
                onClick={() => enemy2Hp > 0 && setActiveTarget(1)}
                className={`flex flex-col items-center w-full cursor-pointer transition-all ${
                  activeTarget !== 1 ? 'opacity-70 hover:opacity-100' : ''
                }`}
              >
                {/* HUD ENEMIGO 2 */}
                <div className={`w-full mb-1.5 p-2 rounded-xl border transition-all text-[11px] bg-black/75 backdrop-blur-sm ${
                  activeTarget === 1 && enemy2Hp > 0 
                    ? 'border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40' 
                    : 'border-white/10'
                }`}>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-white mystic-font truncate">{enemy2.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-bold uppercase ${enemy2ElemMeta.text} ${enemy2ElemMeta.bg}`}>
                        {enemy2Elem}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-red-300 shrink-0 text-[10px]">{enemy2Hp}/{enemy2MaxHp}</span>
                  </div>

                  {/* Barra de Vida con Animación Gradual y Barra Fantasma de Daño */}
                  <div className="relative w-full h-2.5 bg-black/70 border border-white/15 rounded-full overflow-hidden shadow-inner">
                    {/* Barra Fantasma (Trail de daño) */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-white/40 rounded-full transition-[width] duration-500 ease-out z-0"
                      style={{ width: `${Math.min(100, Math.max(0, (enemy2GhostHp / enemy2MaxHp) * 100))}%` }}
                    />
                    {/* Barra Principal */}
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-[width] duration-300 ease-out shadow-[0_0_8px_rgba(239,68,68,0.6)] z-10"
                      style={{ width: `${Math.min(100, Math.max(0, (enemy2Hp / enemy2MaxHp) * 100))}%` }}
                    />
                  </div>

                  {/* Tenacidad Astral (Ruptura) */}
                  <div className="flex items-center justify-between mt-1 text-[9px]">
                    <span className="text-gray-400 truncate">{enemy2.role || 'Guardián'}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {enemy2Stagger > 0 ? (
                        [...Array(3)].map((_, i) => (
                          <span key={i} className={`text-[9px] ${i < enemy2Stagger ? 'text-cyan-400' : 'text-gray-600'}`}>◆</span>
                        ))
                      ) : (
                        <span className="text-[8px] font-bold text-red-400 animate-pulse">¡RUPTURA! (+50%)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar y Pedestal Enemigo 2 */}
                <div className="relative flex flex-col items-center">
                  <div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl border-2 ${enemy2ElemMeta.border} bg-gradient-to-b from-black to-purple-950/80 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                      (defeatingTarget === 'enemy2' || defeatingTarget === 'both')
                        ? 'animate-defeat-dissolve z-30'
                        : enemy2Hp <= 0 
                          ? 'opacity-25 grayscale' 
                          : animState.enemy2Attacking 
                            ? 'animate-battle-lunge-down z-30' 
                            : animState.enemy2Hit 
                              ? 'animate-battle-hurt-up bg-red-950/80' 
                              : enemy2Stagger === 0 
                                ? 'animate-pulse ring-4 ring-red-500/70' 
                                : ''
                    } ${activeTarget === 1 && enemy2Hp > 0 ? 'ring-2 ring-amber-400 shadow-amber-500/30' : ''}`}
                  >
                    {(defeatingTarget === 'enemy2' || defeatingTarget === 'both') && (
                      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-4 border-amber-300 animate-defeat-shockwave pointer-events-none" />
                    )}
                    <img 
                      src={getZodiacIcon(enemy2.guardianSign || enemy2.sign || 'Leo')} 
                      alt="" 
                      className="w-10 h-10 sm:w-14 sm:h-14 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                    />

                    {/* Retícula de Objetivo Fijado */}
                    {activeTarget === 1 && enemy2Hp > 0 && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-black text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md whitespace-nowrap">
                        <Crosshair size={9} className="animate-spin" /> Fijado
                      </div>
                    )}

                    {/* Slash / Magic Burst sobre Enemigo 2 */}
                    {activeVfx && activeVfx.target === 'enemy2' && (
                      <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        {activeVfx.type === 'slash' && (
                          <div className="animate-slash-sweep w-28 sm:w-36 h-2.5 bg-gradient-to-r from-transparent via-cyan-200 to-amber-100 shadow-[0_0_20px_rgba(56,189,248,1)] rounded-full rotate-[-35deg]" />
                        )}
                        {activeVfx.type === 'skill' && (
                          <div className="animate-magic-burst-ring w-20 h-20 rounded-full border-4 border-purple-400 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-cyan-500/30 shadow-[0_0_30px_rgba(168,85,247,0.9)] flex items-center justify-center">
                            <Sparkles size={24} className="text-amber-300 animate-spin" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="w-20 sm:w-28 h-5 sm:h-6 rounded-[50%] bg-gradient-to-r from-purple-900/30 via-red-950/50 to-purple-900/30 border border-purple-500/30 -mt-2.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center">
                    <div className="w-10 h-1.5 rounded-[50%] bg-purple-500/20 blur-xs" />
                  </div>

                  {/* Textos Flotantes Enemigo 2 */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                    {floatingTexts.filter(t => t.target === 'enemy2').map(t => (
                      <span 
                        key={t.id} 
                        className={`text-xs sm:text-sm font-black font-mono animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                          t.type === 'crit' 
                            ? 'text-amber-300 text-sm sm:text-base scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]' 
                            : t.type === 'shield' 
                              ? 'text-blue-300' 
                              : t.type === 'magic'
                                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]'
                                : 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]'
                        }`}
                      >
                        {t.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. ZONA CENTRAL: CHOQUE CÓSMICO Y TURNO ACTIVO */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 w-full py-1.5 my-1 flex items-center justify-center">
          
          {/* Indicador de Turno */}
          <div className="flex items-center gap-2">
            <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-cyan-500/40" />
            <div className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md ${
              turn === 'player'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-cyan-500/20'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/20 animate-pulse'
            }`}>
              {turn === 'player' ? (
                <span>✨ Tu Turno</span>
              ) : (
                <span>⚔️ Acción Enemiga</span>
              )}
            </div>
            <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-cyan-500/40" />
          </div>

          {/* Visual Ultimate Nova FX (Pantalla completa de arena) */}
          {activeVfx?.type === 'ultimate' && (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-cosmic-ultimate-nova bg-purple-950/40 backdrop-blur-xs">
              <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-full border-4 border-amber-300 bg-gradient-to-r from-amber-500/30 via-purple-600/40 to-cyan-500/30 shadow-[0_0_80px_rgba(245,158,11,1)] flex items-center justify-center">
                <span className="mystic-font text-2xl sm:text-3xl font-black text-amber-200 drop-shadow-[0_0_20px_rgba(245,158,11,1)] tracking-widest uppercase text-center px-4">
                  ¡CATACLISMO ASTRAL!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. SECCIÓN INFERIOR: FORMACIÓN DEL HÉROE O DÚO SINASTRÍA */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 w-full flex flex-col items-center max-w-md mx-auto">
          
          {/* Fila de Avatares: Solo Héroe o Héroe + Nexo + Compañero */}
          <div className={`w-full flex items-center justify-center ${isCoop ? 'gap-2 sm:gap-4' : 'gap-4 sm:gap-6'}`}>
            
            {/* MASCOTA ASTRAL COMPAÑERA */}
            {activePet && (
              <div className="relative flex flex-col items-center select-none shrink-0 -mr-1 sm:mr-0">
                <div 
                  className={`w-12 h-12 sm:w-15 sm:h-15 rounded-2xl border border-purple-400/50 bg-gradient-to-b from-purple-950/80 to-black p-1 relative flex items-center justify-center transition-all duration-300 shadow-lg ${
                    petAnim 
                      ? 'scale-125 -translate-y-2 ring-2 ring-purple-300 shadow-purple-500/50 z-30' 
                      : 'animate-bounce hover:scale-105'
                  }`}
                  style={{ animationDuration: '3.5s' }}
                  title={`${activePet.name}: ${activePet.passiveName}`}
                >
                  <span className="text-2xl sm:text-3xl drop-shadow-md select-none">{activePet.icon}</span>

                  {/* Medidor de Carga de Turnos de Mascota */}
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full border shadow-sm ${
                      petTurnCount >= (activePet.intervalTurns - 1)
                        ? 'bg-amber-400 text-black border-amber-200 animate-pulse'
                        : 'bg-black/90 text-purple-300 border-purple-500/40'
                    }`}>
                      {petTurnCount >= (activePet.intervalTurns - 1) ? '¡LISTO!' : `${petTurnCount + 1}/${activePet.intervalTurns}`}
                    </span>
                  </div>
                </div>

                {/* Pedestal Rúnico de la Mascota */}
                <div className="w-14 sm:w-16 h-3 rounded-[50%] bg-purple-500/20 border border-purple-400/30 mt-1 shadow-sm flex items-center justify-center">
                  <div className="w-8 h-1 rounded-[50%] bg-purple-400/30 blur-xs" />
                </div>

                {/* Texto flotante de la mascota */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center">
                  {floatingTexts.filter(t => t.target === 'pet').map(t => (
                    <span key={t.id} className="text-[10px] sm:text-xs font-black font-mono text-purple-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-bounce whitespace-nowrap">
                      {t.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AVATAR Y PEDESTAL DEL HÉROE */}
            <div className="relative flex flex-col items-center">
              <div 
                className={`w-18 h-18 sm:w-22 sm:h-22 rounded-2xl sm:rounded-3xl border-2 ${heroElemMeta.border} ${heroElemMeta.aura} bg-gradient-to-b from-black to-indigo-950 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                  defeatingTarget === 'player'
                    ? 'animate-player-faint z-30'
                    : animState.playerAttacking 
                      ? 'animate-battle-lunge-up z-30' 
                      : animState.playerCasting 
                        ? 'scale-110 -translate-y-3 ring-4 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.8)] z-30'
                        : animState.playerHit 
                          ? 'animate-battle-hurt-down bg-red-950/60' 
                          : 'animate-hero-battle-float'
                }`}
              >
                {defeatingTarget === 'player' && (
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border-4 border-rose-500 animate-defeat-shockwave pointer-events-none" />
                )}
                {isValidImageUrl(hero.avatarUrl) ? (
                  <img src={hero.avatarUrl} alt={hero.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                ) : (
                  <img src={getZodiacIcon(hero.sign)} alt={hero.sign} className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                )}

                {/* Badge de Postura Activa */}
                <div className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-full bg-black/80 border border-white/20 text-[8px] font-bold shadow-md flex items-center gap-0.5">
                  {playerStance === 'solar' && <span className="text-amber-400 flex items-center gap-0.5"><Sun size={9} /> Solar</span>}
                  {playerStance === 'lunar' && <span className="text-purple-400 flex items-center gap-0.5"><Moon size={9} /> Lunar</span>}
                  {playerStance === 'stellar' && <span className="text-cyan-400 flex items-center gap-0.5"><Compass size={9} /> Estelar</span>}
                </div>

                {/* Badge de Fila */}
                <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-black/80 border border-white/20 text-[8px] font-bold shadow-md flex items-center gap-0.5">
                  {playerPosition === 'frontline' ? (
                    <span className="text-orange-400 flex items-center gap-0.5"><Sword size={9} /> Vanguardia</span>
                  ) : (
                    <span className="text-blue-400 flex items-center gap-0.5"><Shield size={9} /> Retaguardia</span>
                  )}
                </div>

                {/* Slash / Magic Burst sobre Jugador */}
                {activeVfx && activeVfx.target === 'player' && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                    {activeVfx.type === 'slash' && (
                      <div className="animate-slash-sweep w-28 sm:w-36 h-2.5 bg-gradient-to-r from-transparent via-red-200 to-amber-100 shadow-[0_0_20px_rgba(239,68,68,1)] rounded-full rotate-[-35deg]" />
                    )}
                    {activeVfx.type === 'skill' && (
                      <div className="animate-magic-burst-ring w-20 h-20 rounded-full border-4 border-amber-400 bg-gradient-to-r from-red-500/30 via-purple-500/20 to-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.9)] flex items-center justify-center">
                        <Sparkles size={24} className="text-red-300 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pedestal Rúnico de Luz */}
              <div className="w-24 sm:w-32 h-5 sm:h-7 rounded-[50%] bg-gradient-to-r from-cyan-500/20 via-indigo-500/40 to-cyan-500/20 border border-cyan-400/40 animate-pedestal-pulse -mt-2.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
                <div className="w-14 h-1.5 rounded-[50%] bg-cyan-400/30 blur-xs" />
              </div>

              {/* Textos Flotantes sobre el Héroe */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                {floatingTexts.filter(t => t.target === 'player').map(t => (
                  <span 
                    key={t.id} 
                    className={`text-xs sm:text-sm font-black font-mono animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                      t.type === 'heal' 
                        ? 'text-emerald-300 text-sm sm:text-base scale-110' 
                        : t.type === 'shield' 
                          ? 'text-cyan-300' 
                          : t.type === 'crit'
                            ? 'text-rose-400 text-sm sm:text-base scale-110 drop-shadow-[0_0_10px_rgba(244,63,94,0.9)]'
                            : t.type === 'magic'
                              ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]'
                              : 'text-red-400'
                    }`}
                  >
                    {t.text}
                  </span>
                ))}
              </div>
            </div>

            {/* NEXO CÓSMICO DE SINASTRÍA (SI ES CO-OP) */}
            {isCoop && (
              <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-r from-amber-500/20 to-teal-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse">
                  <Sparkles size={14} />
                </div>
                <span className="text-[8px] font-mono font-bold text-amber-300 mt-0.5">
                  {synastry?.score}% Dúo
                </span>
                <div className="w-10 sm:w-14 h-0.5 bg-gradient-to-r from-cyan-400 via-amber-400 to-teal-400 rounded-full animate-pulse shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              </div>
            )}

            {/* AVATAR Y PEDESTAL DEL COMPAÑERO (SI ES CO-OP) */}
            {isCoop && (
              <div className="relative flex flex-col items-center">
                <div 
                  className={`w-18 h-18 sm:w-22 sm:h-22 rounded-2xl sm:rounded-3xl border-2 ${partnerElemMeta?.border || 'border-teal-400'} bg-gradient-to-b from-black to-teal-950/80 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                    animState.partnerAttacking 
                      ? 'animate-battle-lunge-up z-30' 
                      : animState.partnerHit 
                        ? 'animate-battle-hurt-down bg-red-950/60' 
                        : 'animate-hero-battle-float'
                  }`}
                >
                  {isValidImageUrl(partner.image) ? (
                    <img src={partner.image} alt={partner.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                  ) : (
                    <img src={getZodiacIcon(partner.sign || 'Leo')} alt={partner.sign} className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                  )}

                  {/* Badge de Signo de Compañero */}
                  <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-black/80 border border-teal-400/40 text-[8px] font-bold shadow-md flex items-center gap-0.5 text-teal-300">
                    <Users size={9} /> {partner.sign}
                  </div>

                  {/* Badge de Habilidad de Apoyo */}
                  <div className="absolute -bottom-2 -left-2 px-1.5 py-0.5 rounded-full bg-black/80 border border-amber-400/40 text-[7px] font-bold shadow-md flex items-center gap-0.5 text-amber-300 truncate max-w-[85px]">
                    ⚡ {partnerAssistSkill?.name}
                  </div>
                </div>

                {/* Pedestal Rúnico del Compañero */}
                <div className="w-24 sm:w-32 h-5 sm:h-7 rounded-[50%] bg-gradient-to-r from-teal-500/20 via-emerald-500/40 to-teal-500/20 border border-teal-400/40 animate-pedestal-pulse -mt-2.5 shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center">
                  <div className="w-14 h-1.5 rounded-[50%] bg-teal-400/30 blur-xs" />
                </div>
              </div>
            )}
          </div>

          {/* HUD FLOTANTE DEL HÉROE (+ INTEGRACIÓN COMPAÑERO EN CO-OP) */}
          <div className="w-full mt-2 bg-black/75 p-2 rounded-xl border border-cyan-500/30 backdrop-blur-sm shadow-md">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-white mystic-font truncate">{hero.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">N.{hero.level}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${heroElemMeta.text} ${heroElemMeta.bg}`}>{hero.element}</span>
                {isCoop && (
                  <span className="text-[9px] text-teal-300 font-bold ml-1 truncate">
                    + {partner.name}
                  </span>
                )}
              </div>
              <div className="text-right font-mono text-[10px] text-gray-300 shrink-0">
                <span className="font-bold text-cyan-300">{playerHp}</span>/{heroStats.maxHp}
              </div>
            </div>

            {/* Barra de Vida fluida del Jugador con Barra Fantasma de Daño */}
            <div className="relative w-full h-3 bg-black/70 border border-cyan-500/40 rounded-full overflow-hidden shadow-inner">
              {/* Barra Fantasma (Trail de daño) */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-rose-400/40 rounded-full transition-[width] duration-500 ease-out z-0"
                style={{ width: `${Math.min(100, Math.max(0, (playerGhostHp / heroStats.maxHp) * 100))}%` }}
              />
              {/* Barra Principal (Gradual y brillante) */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-[width] duration-300 ease-out shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10"
                style={{ width: `${Math.min(100, Math.max(0, (playerHp / heroStats.maxHp) * 100))}%` }}
              />
            </div>

            {/* Si es Co-op: Vida y Estado de Asistencia del Compañero */}
            {isCoop && (
              <div className="mt-1.5 pt-1.5 border-t border-white/5 space-y-1 text-[9px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-teal-300 truncate">
                    <span className="font-bold">APOYO DE {partner.name}:</span>
                    <span className="text-gray-400 truncate">[{partnerAssistSkill?.name}]</span>
                  </div>
                  <div className="font-mono text-[10px] text-teal-300 shrink-0 font-bold">
                    {partnerHp}/{partnerMaxHp} HP
                  </div>
                </div>
                <div className="relative w-full h-1.5 bg-black/70 border border-teal-500/30 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-[width] duration-300 ease-out shadow-[0_0_6px_rgba(20,184,166,0.6)]"
                    style={{ width: `${Math.min(100, Math.max(0, (partnerHp / partnerMaxHp) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recursos: Escudo y Éter */}
            <div className="flex items-center justify-between mt-1 text-[9px]">
              <div className="flex items-center gap-1 text-cyan-300">
                <span className="font-bold">ÉTER:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(dot => (
                    <div 
                      key={dot} 
                      className={`w-2 h-2 rounded-full transition-all ${
                        dot <= playerEther 
                          ? 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]' 
                          : 'bg-white/10'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              {playerShield > 0 && (
                <span className="text-blue-300 font-bold font-mono">🛡️ +{playerShield} Escudo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA TÁCTICA: POSICIONAMIENTO Y POSTURA CÓSMICA */}
      {/* ========================================================================= */}
      <div className="mt-3 p-2.5 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-between flex-wrap gap-2 shadow-sm">
        {/* Toggle de Posicionamiento */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">FILA:</span>
          <div className="flex rounded-xl bg-white/5 p-0.5 border border-white/10">
            <button
              onClick={() => turn === 'player' && setPlayerPosition('frontline')}
              disabled={turn !== 'player'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                playerPosition === 'frontline'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sword size={11} /> Vanguardia (+20% ATQ)
            </button>
            <button
              onClick={() => turn === 'player' && setPlayerPosition('backline')}
              disabled={turn !== 'player'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                playerPosition === 'backline'
                  ? 'bg-blue-500 text-black shadow-md shadow-blue-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Shield size={11} /> Retaguardia (-30% Daño)
            </button>
          </div>
        </div>

        {/* Selector de Postura Cósmica */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">POSTURA:</span>
          <div className="flex rounded-xl bg-white/5 p-0.5 border border-white/10">
            <button
              onClick={() => turn === 'player' && setPlayerStance('solar')}
              disabled={turn !== 'player'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                playerStance === 'solar'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Postura Solar: +25% Daño infligido"
            >
              <Sun size={11} /> Solar
            </button>
            <button
              onClick={() => turn === 'player' && setPlayerStance('lunar')}
              disabled={turn !== 'player'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                playerStance === 'lunar'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Postura Lunar: +30% Defensa y regenera 4% HP por turno"
            >
              <Moon size={11} /> Lunar
            </button>
            <button
              onClick={() => turn === 'player' && setPlayerStance('stellar')}
              disabled={turn !== 'player'}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                playerStance === 'stellar'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Postura Estelar: +20% Velocidad y +15% Probabilidad Crítica"
            >
              <Compass size={11} /> Estelar
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONSOLA DE ACCIONES DE COMBATE (5 O 6 COMANDOS SEGÚN MODO) */}
      {/* ========================================================================= */}
      <div className={`mt-3 grid ${isCoop ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-5'} gap-2`}>
        {/* 1. Ataque Básico */}
        <button
          onClick={handlePlayerBasicAttack}
          disabled={turn !== 'player' || !!battleOutcome}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <Sword size={16} className={heroClass.basicAttack?.damageType === 'magical' ? "text-purple-400 group-hover:scale-110 transition-transform" : "text-orange-400 group-hover:scale-110 transition-transform"} />
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-white/10 text-gray-300">
                {heroClass.basicAttack?.damageType === 'magical' ? '🔮 MÁG' : '⚔️ FÍS'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">+1 Éter</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-white truncate">{heroClass.basicAttack.name}</div>
            <div className="text-[9px] text-gray-400 truncate">Impacto Directo</div>
          </div>
        </button>

        {/* 2. Habilidad Ranura 1 */}
        <button
          onClick={() => handlePlayerCastSkill(skillSlot1)}
          disabled={turn !== 'player' || !skillSlot1 || playerEther < (skillSlot1.etherCost || 2) || !!battleOutcome}
          className={`p-2.5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-black border ${
            playerEther >= (skillSlot1?.etherCost || 2) ? 'border-purple-500/60 hover:border-purple-400 shadow-md shadow-purple-950/40' : 'border-white/10'
          } text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-1">
            <Sparkles size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1">
              {skillSlot1?.damageType && (
                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-white/10 text-gray-300">
                  {skillSlot1.damageType === 'magical' ? '🔮 MÁG' : '⚔️ FÍS'}
                </span>
              )}
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                -{skillSlot1?.etherCost || 2} Éter
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-purple-200 truncate">{skillSlot1?.name || 'Habilidad 1'}</div>
            <div className="text-[9px] text-purple-400/80 truncate">
              {skillSlot1?.mechanic ? `⚡ ${skillSlot1.mechanic}` : 'Habilidad Astral'}
            </div>
          </div>
        </button>

        {/* 3. Habilidad Ranura 2 */}
        {skillSlot2 ? (
          <button
            onClick={() => handlePlayerCastSkill(skillSlot2)}
            disabled={turn !== 'player' || playerEther < (skillSlot2.etherCost || 2) || !!battleOutcome}
            className={`p-2.5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-black border ${
              playerEther >= (skillSlot2.etherCost || 2) ? 'border-cyan-500/60 hover:border-cyan-400 shadow-md shadow-cyan-950/40' : 'border-white/10'
            } text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-1">
              <Zap size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="flex items-center gap-1">
                {skillSlot2?.damageType && (
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-white/10 text-gray-300">
                    {skillSlot2.damageType === 'magical' ? '🔮 MÁG' : '⚔️ FÍS'}
                  </span>
                )}
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  -{skillSlot2.etherCost} Éter
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-200 truncate">{skillSlot2.name}</div>
              <div className="text-[9px] text-cyan-400/80 truncate">
                {skillSlot2.mechanic ? `⚡ ${skillSlot2.mechanic}` : 'Habilidad Secundaria'}
              </div>
            </div>
          </button>
        ) : (
          <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-left flex flex-col justify-between opacity-50 select-none">
            <div className="flex items-center justify-between mb-1">
              <Zap size={16} className="text-gray-600" />
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-gray-500 font-mono">Ranura 2</span>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-500 truncate">Sin Asignar</div>
              <div className="text-[9px] text-gray-600 truncate">Árbol Astral (Niv. 4+)</div>
            </div>
          </div>
        )}

        {/* 4. ASISTENCIA DE SINASTRÍA DEL COMPAÑERO (SOLO EN CO-OP) */}
        {isCoop && (
          <button
            onClick={handlePartnerAssist}
            disabled={turn !== 'player' || playerEther < 2 || !!battleOutcome}
            className={`p-2.5 rounded-2xl bg-gradient-to-br from-teal-950/80 to-black border ${
              playerEther >= 2 ? 'border-teal-400 hover:border-teal-300 shadow-md shadow-teal-950/60' : 'border-white/10'
            } text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-1">
              <Users size={16} className="text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono font-bold">
                -2 Éter
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-teal-200 truncate">{partnerAssistSkill?.name || 'Asistencia'}</div>
              <div className="text-[9px] text-teal-400/80 truncate">
                ⚡ Apoyo de {partner.name}
              </div>
            </div>
          </button>
        )}

        {/* 5. Mochila de Alquimia Táctica */}
        <div className="relative">
          <button
            onClick={() => setIsBackpackOpen(o => !o)}
            disabled={turn !== 'player' || !!battleOutcome}
            className={`w-full h-full p-2.5 rounded-2xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between shadow-sm cursor-pointer ${
              isBackpackOpen 
                ? 'bg-amber-950/60 border-amber-400 ring-1 ring-amber-400/50' 
                : 'bg-white/5 hover:bg-white/15 border-white/10 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base group-hover:scale-110 transition-transform">🎒</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                x{Object.values(consumables).reduce((a, b) => a + (Number(b) || 0), 0)}
              </span>
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors truncate">
                Mochila Alquimia
              </div>
              <div className="text-[9px] text-amber-400/80 truncate">
                {isBackpackOpen ? '▲ Ocultar' : '▼ 6 Pociones'}
              </div>
            </div>
          </button>

          {/* Popover / Menú Desplegable de Consumibles */}
          {isBackpackOpen && (
            <>
              {/* Backdrop en móvil */}
              <div 
                className="sm:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={() => setIsBackpackOpen(false)}
              />
              <div className="fixed sm:absolute bottom-4 sm:bottom-full left-3 sm:left-0 sm:-left-12 right-3 sm:right-auto mb-0 sm:mb-2 max-w-sm sm:w-80 mx-auto sm:mx-0 rounded-2xl border border-amber-500/40 bg-[#0e0c18]/95 backdrop-blur-md p-3.5 sm:p-3 shadow-2xl shadow-black/90 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <span>🎒</span> Mochila de Alquimia Táctica
                  </span>
                  <button
                    onClick={() => setIsBackpackOpen(false)}
                    className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded-md hover:bg-white/10"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-64 sm:max-h-56 overflow-y-auto custom-scrollbar">
                  {ALCHEMY_CONSUMABLES_CATALOG.map((item) => {
                    const count = consumables[item.id] || 0;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleUseConsumable(item.id);
                          if (count <= 1) setIsBackpackOpen(false);
                        }}
                        disabled={count <= 0 || turn !== 'player'}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          count > 0 
                            ? 'bg-white/5 hover:bg-amber-500/20 border-white/10 hover:border-amber-400/60 cursor-pointer' 
                            : 'bg-white/[0.02] border-white/5 opacity-30 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{item.icon}</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/50 text-amber-300">
                            x{count}
                          </span>
                        </div>
                        <div className="mt-1">
                          <div className="text-[11px] font-bold text-zinc-100 truncate">{item.name}</div>
                          <div className="text-[9px] text-zinc-400 line-clamp-1">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 6. Ultimate Astral / Cataclismo AoE / Ataque de Dúo */}
        <button
          onClick={handlePlayerUltimate}
          disabled={turn !== 'player' || playerUltimate < 100 || !!battleOutcome}
          className={`col-span-2 sm:col-span-1 p-2.5 rounded-2xl text-left transition-all group flex flex-col justify-between ${
            playerUltimate >= 100 
              ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-amber-500 bg-[length:200%_auto] animate-pulse border-2 border-amber-300 text-black shadow-lg shadow-amber-500/40' 
              : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Star size={16} className={playerUltimate >= 100 ? 'text-amber-100' : 'text-gray-500'} />
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${playerUltimate >= 100 ? 'bg-black text-amber-300' : 'bg-white/10 text-gray-400'}`}>
              {playerUltimate}%
            </span>
          </div>
          <div>
            <div className={`text-xs font-bold truncate ${playerUltimate >= 100 ? 'text-white' : 'text-gray-400'}`}>
              {isCoop ? synastry?.attackName : heroClass.ultimate.name}
            </div>
            <div className={`text-[9px] truncate ${playerUltimate >= 100 ? 'text-amber-100' : 'text-gray-500'}`}>
              {isCoop ? '¡Ataque Dúo!' : hasDualEnemies ? '¡Golpea a Ambos!' : 'Alineación'}
            </div>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* HISTORIAL Y TICKER DE COMBATE */}
      {/* ========================================================================= */}
      <div className="mt-3 rounded-xl bg-black/60 border border-white/10 overflow-hidden font-mono text-[11px]">
        {/* Ticker de último evento con botón de colapso */}
        <div 
          onClick={() => setIsLogExpanded(e => !e)}
          className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all text-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase">LOG</span>
            <span className="text-cyan-200 truncate">{battleLog[0] || 'En guardia cósmica.'}</span>
          </div>
          <button className="text-gray-400 hover:text-white p-1">
            {isLogExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Historial extendido */}
        {isLogExpanded && (
          <div className="px-3 pb-2 pt-1 border-t border-white/5 max-h-24 overflow-y-auto custom-scrollbar space-y-1">
            {battleLog.slice(1).map((log, index) => (
              <div key={index} className="text-gray-400 text-[10px]">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE RESULTADO: VICTORIA O DERROTA */}
      {battleOutcome && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-cyan-500/40 max-w-sm sm:max-w-md w-full text-center relative overflow-hidden bg-gradient-to-b from-gray-950 via-purple-950/40 to-black shadow-[0_0_80px_rgba(0,0,0,0.95),0_0_50px_rgba(6,182,212,0.3)]">
            {battleOutcome === 'victory' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-4 text-amber-300 shadow-xl shadow-amber-500/20 animate-bounce">
                  <Trophy size={32} />
                </div>
                <h3 className="mystic-font text-2xl text-white font-bold mb-1">
                  {isPvp ? '¡TRIUNFO EN EL COLISEO!' : isCoop ? '¡INCURSIÓN PURIFICADA!' : '¡VICTORIA CÓSMICA!'}
                </h3>
                <p className="text-xs text-gray-300 mb-4">
                  {isPvp
                    ? `Has derrotado al gladiador [${enemy.name}] en duelo de clasificación cósmica.`
                    : isCoop
                      ? `Tú y ${partner.name} desataron su sinastría y abatieron al Titán.`
                      : hasDualEnemies 
                        ? 'Has doblegado a los dos guardianes en combate de desventaja táctica.' 
                        : 'Has purificado la sombra y conquistado la energía astral.'}
                </p>

                {/* Recompensas */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-5 space-y-1.5 text-xs text-left">
                  {isPvp && (
                    <div className="flex justify-between text-amber-400 font-bold border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="flex items-center gap-1"><Trophy size={14} /> Puntos de Gloria PvP:</span>
                      <span className="font-mono">+{enemy.gloryPoints || 35} Pts</span>
                    </div>
                  )}
                  {isCoop && (
                    <div className="flex justify-between text-teal-300 font-bold border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="flex items-center gap-1"><Users size={14} /> Bono de Sinastría:</span>
                      <span className="font-mono">+{Math.round((enemy.stardustReward || 100) * 1.5)} ✦ Polvo Dúo</span>
                    </div>
                  )}
                  <div className="flex justify-between text-cyan-300">
                    <span>Experiencia Ganada:</span>
                    <span className="font-bold font-mono">+{totalExpReward} EXP</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Polvo Estelar:</span>
                    <span className="font-bold font-mono">+{isCoop ? Math.round(totalGoldReward * 1.5) : totalGoldReward} ✦</span>
                  </div>
                </div>

                <button
                  onClick={() => onBattleEnd({ 
                    victory: true, 
                    exp: totalExpReward, 
                    gold: isCoop ? Math.round(totalGoldReward * 1.5) : totalGoldReward,
                    pvpPointsGained: isPvp ? (enemy.gloryPoints || 35) : 0,
                    dropId: enemy.dropChance,
                    updatedConsumables: consumables
                  })}
                  className="btn-mystic w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-lg"
                >
                  RECLAMAR RECOMPENSAS
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/50 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-xl shadow-red-500/20">
                  <Skull size={32} />
                </div>
                <h3 className="mystic-font text-2xl text-white font-bold mb-1">HAS SIDO DISUELTO</h3>
                <p className="text-xs text-gray-300 mb-5">
                  La fuerza enemiga superó tus líneas. Prueba cambiando a Postura Lunar defensiva o retirándote a la Retaguardia.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => onBattleEnd({ victory: false, updatedConsumables: consumables })}
                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Reintentar
                  </button>
                  {onExitToMenu && (
                    <button
                      onClick={onExitToMenu}
                      className="px-4 py-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-500/40 transition-all"
                    >
                      Menú
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
