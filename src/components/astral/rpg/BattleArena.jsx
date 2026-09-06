"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Heart, Sword, Shield, Zap, Sparkles, Flame, 
  Droplet, Wind, Mountain, AlertCircle, ArrowLeft,
  Trophy, RotateCcw, Skull, CheckCircle2, Star, Crown,
  Sun, Moon, Compass, Target, Crosshair, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  ELEMENTAL_AFFINITIES, 
  ZODIAC_HERO_CLASSES, 
  getZodiacIcon, 
  isValidImageUrl, 
  getEquippedSkills 
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
  playBattleAttackSound, 
  playBattleHitSound, 
  playBattleCritSound, 
  playBattleShieldSound, 
  playBattleHealSound, 
  playBattleVictorySound, 
  playBattleDefeatSound 
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

  // Estados Tácticos del Jugador
  const [playerPosition, setPlayerPosition] = useState('frontline'); // 'frontline' (Vanguardia) | 'backline' (Retaguardia)
  const [playerStance, setPlayerStance] = useState('solar'); // 'solar' | 'lunar' | 'stellar'

  // Estados del Enemigo 1
  const [enemy1MaxHp] = useState(enemy.hp || 500);
  const [enemy1Hp, setEnemy1Hp] = useState(enemy.hp || 500);
  const [enemy1Ether, setEnemy1Ether] = useState(1);
  const [enemy1Effects, setEnemy1Effects] = useState([]);
  const [enemy1Shield, setEnemy1Shield] = useState(0);
  const [enemy1Stagger, setEnemy1Stagger] = useState(3); // 3 golpes para ruptura

  // Estados del Enemigo 2
  const [enemy2MaxHp] = useState(enemy2?.hp || 450);
  const [enemy2Hp, setEnemy2Hp] = useState(enemy2?.hp || 450);
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

  // Estados de animación y turno
  const [turn, setTurn] = useState('player'); // 'player' | 'enemy' | 'busy'
  const [animState, setAnimState] = useState({
    playerAttacking: false,
    playerCasting: false,
    playerHit: false,
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
    hasDualEnemies 
      ? `🌌 ¡DESAFÍO 1vs2! ${hero.name} se enfrenta a los gemelos ${enemy.name} y ${enemy2.name}.`
      : `🌌 ¡Comienza el combate cósmico entre ${hero.name} y ${enemy.name || enemy.guardianName}!`,
    mutator ? `⚠️ Anomalía de Torre activa: [${mutator.name}] - ${mutator.desc}` : null,
    hasHeroTransitBoost ? `✨ ¡La Luna en ${transitBuff.moonSign} potencia tus habilidades de ${hero.element} (+15%)!` : null
  ].filter(Boolean));

  const [battleOutcome, setBattleOutcome] = useState(null); // 'victory' | 'defeat' | null

  // Cálculo de sinastría en caso de modo cooperativo
  const isCoop = mode === 'coop' && partner;
  const synastry = isCoop ? getSynastryCompatibility(hero.sign, partner.sign) : null;

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

    playBattleAttackSound();
    setAnimState(p => ({ ...p, playerAttacking: true }));

    setTimeout(() => {
      const tgt = getTargetData();
      const isStaggered = tgt.staggerRef.current <= 0;

      const { damage, isCrit, hasTransitBoost, isSuperEffective } = calculateDamage(
        { atk: heroStats.atk, element: hero.element, critRate: heroStats.critRate },
        { def: tgt.enemyObj.def || 25, element: tgt.elem },
        1.0,
        false,
        transitBuff.moonElement,
        {
          attackerPosition: playerPosition,
          defenderPosition: tgt.enemyObj.role === 'Retaguardia Rival' ? 'backline' : 'frontline',
          stance: playerStance,
          isStaggered,
          mutator
        }
      );

      if (isCrit) playBattleCritSound();
      else playBattleHitSound();

      setActiveVfx({ type: 'slash', target: tgt.targetKey });
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
          spawnFloatingText(`-${finalDamage}`, tgt.targetKey, isCrit ? 'crit' : 'damage');
        }
      } else {
        spawnFloatingText(isCrit ? `¡CRÍTICO! -${finalDamage}` : `-${finalDamage}`, tgt.targetKey, isCrit ? 'crit' : 'damage');
      }

      const nextHp = Math.max(0, tgt.hpRef.current - finalDamage);
      tgt.hpRef.current = nextHp;
      tgt.setHp(nextHp);

      // Recursos
      setPlayerEther(e => Math.min(5, e + 1));
      setPlayerUltimate(u => Math.min(100, u + (playerStance === 'solar' ? 22 : 18)));

      logMessage(`⚔️ ${hero.name} golpeó a [${tgt.enemyObj.name}] causando ${finalDamage} de daño.${isCrit ? ' ¡Crítico!' : ''}${hasTransitBoost ? ' (Bono Tránsito)' : ''}`);

      // Comprobar si los enemigos fueron derrotados
      checkPostAttackOutcome();
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

    playBattleAttackSound();
    setAnimState(p => ({ ...p, playerCasting: true }));

    setTimeout(() => {
      const tgt = getTargetData();
      const isStaggered = tgt.staggerRef.current <= 0;

      const { damage, isCrit, hasTransitBoost, isSuperEffective } = calculateDamage(
        { atk: heroStats.atk, element: hero.element, critRate: (heroStats.critRate || 0.15) + (skill.critBonus || 0) },
        { def: tgt.enemyObj.def || 25, element: tgt.elem },
        skill.multiplier || 1.4,
        false,
        transitBuff.moonElement,
        {
          attackerPosition: playerPosition,
          defenderPosition: tgt.enemyObj.role === 'Retaguardia Rival' ? 'backline' : 'frontline',
          stance: playerStance,
          isStaggered,
          mutator
        }
      );

      if (isCrit) playBattleCritSound();
      else playBattleHitSound();

      setActiveVfx({ type: 'skill', target: tgt.targetKey, element: hero.element });
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
        playBattleShieldSound();
        spawnFloatingText(`+${shieldVal} Escudo`, 'player', 'shield');
      }

      // Sanación directa
      if (effect.heal || effect.type === 'heal' || effect.type === 'shield_heal') {
        let healVal = effect.heal || 120;
        if (playerPosition === 'backline') healVal = Math.round(healVal * 1.35);
        const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healVal);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);
        playBattleHealSound();
        spawnFloatingText(`+${healVal} HP`, 'player', 'heal');
      }

      // Robo de vida (Lifesteal)
      if (effect.type === 'lifesteal' || effect.ratio) {
        const leech = Math.max(1, Math.round(damage * (effect.ratio || 0.5)));
        const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + leech);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);
        playBattleHealSound();
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
      spawnFloatingText(`-${damage}`, tgt.targetKey, isCrit ? 'crit' : 'damage');
      setPlayerUltimate(u => Math.min(100, u + 24));

      logMessage(`✨ ${hero.name} desató [${skill.name}] contra [${tgt.enemyObj.name}] infligiendo ${damage} de daño.`);

      checkPostAttackOutcome();
    }, 500);
  };

  // ==========================================
  // TURNO DEL JUGADOR: 3. ULTIMATE CÓSMICA (AOE EN 1v2)
  // ==========================================
  const handlePlayerUltimate = () => {
    if (turn !== 'player' || battleOutcome || playerUltimate < 100) return;
    setTurn('busy');
    setPlayerUltimate(0);

    playBattleCritSound();
    setAnimState(p => ({ ...p, playerCasting: true, screenShake: true }));
    setActiveVfx({ type: 'ultimate', target: 'all' });
    setTimeout(() => setActiveVfx(null), 850);

    setTimeout(() => {
      const ult = heroClass.ultimate;
      const ultMultiplier = isCoop ? 3.4 : (ult.multiplier || 2.5);

      // Auto-curación de Ultimate
      if (ult.healSelf || isCoop) {
        const healAmount = isCoop ? 150 : (ult.healSelf || 70);
        const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healAmount);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);
        playBattleHealSound();
        spawnFloatingText(`+${healAmount} HP`, 'player', 'heal');
      }

      setAnimState(p => ({ ...p, playerCasting: false, enemy1Hit: true, enemy2Hit: hasDualEnemies }));
      setTimeout(() => setAnimState(p => ({ ...p, enemy1Hit: false, enemy2Hit: false, screenShake: false })), 600);

      // En 1v2, la Ultimate golpea a AMBOS enemigos simultáneamente (AoE Cataclísmico)
      const hitEnemy = (enemyData, isSecond = false) => {
        if (enemyData.hpRef.current <= 0) return 0;
        const { damage } = calculateDamage(
          { atk: heroStats.atk, element: hero.element, critRate: 1.0 },
          { def: Math.round((enemyData.enemyObj.def || 25) * 0.35), element: enemyData.elem },
          isSecond ? ultMultiplier * 0.85 : ultMultiplier,
          true,
          transitBuff.moonElement,
          { attackerPosition: playerPosition, stance: playerStance, isStaggered: enemyData.staggerRef.current <= 0, mutator }
        );

        const nextHp = Math.max(0, enemyData.hpRef.current - damage);
        enemyData.hpRef.current = nextHp;
        enemyData.setHp(nextHp);
        spawnFloatingText(`¡ALINEACIÓN! -${damage}`, enemyData.targetKey, 'crit');

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
    }, 600);
  };

  // ==========================================
  // TURNO DEL JUGADOR: 4. USAR POCIÓN ASTRAL
  // ==========================================
  const handleUsePotion = () => {
    if (turn !== 'player' || battleOutcome || potionsLeft <= 0) return;
    setPotionsLeft(p => p - 1);
    const healAmount = Math.round(heroStats.maxHp * 0.45);
    const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healAmount);
    playerHpRef.current = nextPlayerHp;
    setPlayerHp(nextPlayerHp);
    playBattleHealSound();
    spawnFloatingText(`+${healAmount} HP`, 'player', 'heal');
    logMessage(`🧪 ${hero.name} consumió una Poción Astral curando ${healAmount} HP.`);
  };

  // ==========================================
  // COMPROBACIÓN POST-ATAQUE Y CAMBIO DE TURNO
  // ==========================================
  const checkPostAttackOutcome = () => {
    const isEnemy1Dead = enemy1HpRef.current <= 0;
    const isEnemy2Dead = !hasDualEnemies || enemy2HpRef.current <= 0;

    if (isEnemy1Dead && isEnemy2Dead) {
      handleVictory();
    } else {
      if (hasDualEnemies && isEnemy1Dead && activeTarget === 0) {
        setActiveTarget(1);
        logMessage(`💀 ¡La Sombra frontal ha caído! Ahora enfócate en [${enemy2.name}].`);
      }
      setTimeout(() => startEnemyTurn(), 850);
    }
  };

  // ==========================================
  // TURNO DEL ENEMIGO (O DE LOS 2 ENEMIGOS EN 1v2)
  // ==========================================
  const startEnemyTurn = () => {
    setTurn('enemy');

    // Función para ejecutar el ataque de un enemigo específico
    const executeSingleEnemyAttack = (enemyData, onComplete) => {
      if (enemyData.hpRef.current <= 0) {
        onComplete();
        return;
      }

      // 1. Estados en el enemigo
      const statusRes = processStatusEffects(enemyData.effectsRef.current, enemyData.hpRef.current, enemyData.maxHp);
      enemyData.hpRef.current = statusRes.nextHp;
      enemyData.setHp(statusRes.nextHp);
      enemyData.effectsRef.current = statusRes.updatedEffects;
      enemyData.setEffects(statusRes.updatedEffects);
      statusRes.logMessages.forEach(m => logMessage(m));

      if (statusRes.nextHp <= 0) {
        logMessage(`💀 [${enemyData.enemyObj.name}] sucumbió ante los efectos residuales.`);
        onComplete();
        return;
      }

      // 2. Comprobar Ruptura (Stagger) o Aturdimiento (Stun)
      if (enemyData.staggerRef.current <= 0) {
        logMessage(`💫 [${enemyData.enemyObj.name}] está en RUPTURA CÓSMICA y no puede actuar este turno.`);
        spawnFloatingText('¡Incapacitado!', enemyData.targetKey, 'buff');
        enemyData.staggerRef.current = 3; // Se recupera de la ruptura para el próximo turno
        enemyData.setStagger(3);
        setTimeout(onComplete, 700);
        return;
      }

      const stunIdx = enemyData.effectsRef.current.findIndex(e => e.type === 'stun');
      if (stunIdx !== -1) {
        logMessage(`💫 [${enemyData.enemyObj.name}] está aturdido y pierde su turno.`);
        spawnFloatingText('¡Aturdido!', enemyData.targetKey, 'buff');
        enemyData.effectsRef.current.splice(stunIdx, 1);
        enemyData.setEffects([...enemyData.effectsRef.current]);
        setTimeout(onComplete, 700);
        return;
      }

      // 3. IA Ataca al jugador
      const action = chooseEnemyAction(enemyData.enemyObj, enemyData.hpRef.current, enemyData.maxHp, 2);
      playBattleAttackSound();
      setAnimState(p => ({ ...p, [enemyData.idx === 0 ? 'enemy1Attacking' : 'enemy2Attacking']: true }));

      setTimeout(() => {
        const isSkill = action.type === 'skill';
        const mult = isSkill ? 1.35 : 1.0;

        const { damage, isCrit } = calculateDamage(
          { atk: enemyData.enemyObj.atk || 55, element: enemyData.elem, critRate: 0.12 },
          { def: heroStats.def, element: hero.element },
          mult,
          false,
          null,
          {
            attackerPosition: 'frontline',
            defenderPosition: playerPosition,
            stance: playerStance,
            mutator
          }
        );

        if (isCrit) playBattleCritSound();
        else playBattleHitSound();

        setActiveVfx({ type: isSkill ? 'skill' : 'slash', target: 'player', element: enemyData.elem });
        setTimeout(() => setActiveVfx(null), 500);

        setAnimState(p => ({ ...p, enemy1Attacking: false, enemy2Attacking: false, playerHit: true, screenShake: isCrit }));
        setTimeout(() => setAnimState(p => ({ ...p, playerHit: false, screenShake: false })), 400);

        // Absorción por escudo del jugador
        let finalDmg = damage;
        if (playerShieldRef.current > 0) {
          if (damage <= playerShieldRef.current) {
            playerShieldRef.current -= damage;
            setPlayerShield(playerShieldRef.current);
            finalDmg = 0;
            spawnFloatingText(`¡Bloqueaste (${damage})!`, 'player', 'shield');
          } else {
            finalDmg = damage - playerShieldRef.current;
            playerShieldRef.current = 0;
            setPlayerShield(0);
            spawnFloatingText(`-${finalDmg}`, 'player', isCrit ? 'crit' : 'damage');
          }
        } else {
          spawnFloatingText(isCrit ? `¡CRÍTICO! -${finalDmg}` : `-${finalDmg}`, 'player', isCrit ? 'crit' : 'damage');
        }

        // Reflejo de daño si el jugador tiene el efecto activo
        const reflectIndex = playerEffectsRef.current.findIndex(e => e.type === 'reflect');
        if (reflectIndex !== -1 && finalDmg > 0) {
          const reflectDmg = Math.max(1, Math.round(finalDmg * 0.70));
          const newHp = Math.max(0, enemyData.hpRef.current - reflectDmg);
          enemyData.hpRef.current = newHp;
          enemyData.setHp(newHp);
          spawnFloatingText(`🪞 Reflejo -${reflectDmg}`, enemyData.targetKey, 'crit');
          logMessage(`🪞 ¡El Espejo Astral de ${hero.name} reflejó ${reflectDmg} a [${enemyData.enemyObj.name}]!`);
        }

        const nextPlayerHp = Math.max(0, playerHpRef.current - finalDmg);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);

        logMessage(`⚡ [${enemyData.enemyObj.name}] usó [${action.name}] causando ${finalDmg} de daño.`);

        if (nextPlayerHp <= 0) {
          handleDefeat();
        } else {
          setTimeout(onComplete, 500);
        }
      }, 500);
    };

    // Secuencia de turnos: Enemigo 1 -> (Enemigo 2 si vive) -> Vuelta al Jugador
    executeSingleEnemyAttack(getTargetData(0), () => {
      if (playerHpRef.current <= 0) return;

      if (hasDualEnemies && enemy2HpRef.current > 0) {
        setTimeout(() => {
          executeSingleEnemyAttack(getTargetData(1), () => {
            finishEnemyRound();
          });
        }, 500);
      } else {
        finishEnemyRound();
      }
    });
  };

  // Fin de ronda enemiga: procesar estados del jugador y devolver turno
  const finishEnemyRound = () => {
    if (playerHpRef.current <= 0) return;

    // Procesar venenos/sangrados en el jugador
    const playerStatus = processStatusEffects(playerEffectsRef.current, playerHpRef.current, heroStats.maxHp);
    playerHpRef.current = playerStatus.nextHp;
    setPlayerHp(playerStatus.nextHp);
    playerEffectsRef.current = playerStatus.updatedEffects;
    setPlayerEffects(playerStatus.updatedEffects);
    playerStatus.logMessages.forEach(m => logMessage(m));

    if (playerStatus.nextHp <= 0) {
      handleDefeat();
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

    setTurn('player');
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
    <div className={`relative min-h-[600px] rounded-3xl overflow-hidden glass-panel border border-cyan-500/30 p-4 sm:p-6 bg-gradient-to-b from-black via-purple-950/30 to-black select-none ${animState.screenShake ? 'animate-bounce' : ''}`}>
      
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
            {mode === 'eclipse' ? '⚡ Desafío 1 vs 2' : mode === 'tower' ? '🗼 Torre del Caos' : mode === 'houses' ? 'Sendero 12 Casas' : 'Duelo Astral'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESTADIO DE COMBATE CINEMATOGRÁFICO (ASTRAL BATTLE ARENA) */}
      {/* ========================================================================= */}
      <div className="relative min-h-[320px] sm:min-h-[360px] rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-[#0a0d24]/80 via-[#050612]/90 to-[#0c0824]/80 p-3 sm:p-5 flex flex-col justify-between shadow-2xl backdrop-blur-md">
        
        {/* Telón estelar y runas celestiales */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-black pointer-events-none" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-gradient-to-t from-cyan-500/10 via-purple-500/5 to-transparent blur-xl pointer-events-none" />

        {/* CAMPO DE COMBATE: HÉROE (IZQUIERDA) vs ENEMIGO(S) (DERECHA) */}
        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-8 flex-1 py-2">
          
          {/* ------------------------------------------------------------- */}
          {/* LADO IZQUIERDO: EL HÉROE ASTRAL */}
          {/* ------------------------------------------------------------- */}
          <div className="flex flex-col items-center justify-center relative w-1/2 max-w-[240px]">
            
            {/* HUD FLOTANTE SUPERIOR DEL HÉROE */}
            <div className="w-full mb-2 bg-black/60 p-2 rounded-xl border border-cyan-500/30 backdrop-blur-sm shadow-md">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-white mystic-font truncate">{hero.name}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">N.{hero.level}</span>
                </div>
                <div className="text-right font-mono text-[10px] text-gray-300 shrink-0">
                  <span className="font-bold text-cyan-300">{playerHp}</span>/{heroStats.maxHp}
                </div>
              </div>

              {/* Barra de Vida fluida */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.2">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  style={{ width: `${Math.max(0, (playerHp / heroStats.maxHp) * 100)}%` }}
                />
              </div>

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
                  <span className="text-blue-300 font-bold font-mono">🛡️ +{playerShield}</span>
                )}
              </div>
            </div>

            {/* PERSONAJE DEL HÉROE CON PEDESTAL Y AURA */}
            <div className="relative flex flex-col items-center mt-1">
              
              {/* Avatar y Estado Animado del Héroe */}
              <div 
                className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-2 ${heroElemMeta.border} ${heroElemMeta.aura} bg-gradient-to-b from-black to-indigo-950 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                  animState.playerAttacking 
                    ? 'animate-battle-lunge-right z-30' 
                    : animState.playerCasting 
                      ? 'scale-110 -translate-y-3 ring-4 ring-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.8)] z-30'
                      : animState.playerHit 
                        ? 'animate-battle-hurt-left bg-red-950/60' 
                        : 'animate-hero-battle-float'
                }`}
              >
                {isValidImageUrl(hero.avatarUrl) ? (
                  <img src={hero.avatarUrl} alt={hero.name} className="w-full h-full object-cover rounded-xl sm:rounded-2xl" />
                ) : (
                  <img src={getZodiacIcon(hero.sign)} alt={hero.sign} className="w-14 h-14 sm:w-18 sm:h-18 object-contain filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                )}

                {/* Badge de Postura Activa */}
                <div className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-full bg-black/80 border border-white/20 text-[9px] font-bold shadow-md flex items-center gap-0.5">
                  {playerStance === 'solar' && <span className="text-amber-400 flex items-center gap-0.5"><Sun size={10} /> Solar</span>}
                  {playerStance === 'lunar' && <span className="text-purple-400 flex items-center gap-0.5"><Moon size={10} /> Lunar</span>}
                  {playerStance === 'stellar' && <span className="text-cyan-400 flex items-center gap-0.5"><Compass size={10} /> Estelar</span>}
                </div>

                {/* Badge de Fila */}
                <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-black/80 border border-white/20 text-[9px] font-bold shadow-md flex items-center gap-0.5">
                  {playerPosition === 'frontline' ? (
                    <span className="text-orange-400 flex items-center gap-0.5"><Sword size={10} /> Vanguardia</span>
                  ) : (
                    <span className="text-blue-400 flex items-center gap-0.5"><Shield size={10} /> Retaguardia</span>
                  )}
                </div>
              </div>

              {/* Pedestal Rúnico de Luz */}
              <div className="w-28 sm:w-36 h-6 sm:h-8 rounded-[50%] bg-gradient-to-r from-cyan-500/20 via-indigo-500/40 to-cyan-500/20 border border-cyan-400/40 animate-pedestal-pulse -mt-3 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
                <div className="w-16 h-2 rounded-[50%] bg-cyan-400/30 blur-xs" />
              </div>

              {/* Textos Flotantes sobre el Héroe */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                {floatingTexts.filter(t => t.target === 'player').map(t => (
                  <span 
                    key={t.id} 
                    className={`text-xs sm:text-sm font-black font-mono animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                      t.type === 'heal' 
                        ? 'text-emerald-300 text-sm sm:text-base scale-110' 
                        : t.type === 'shield' 
                          ? 'text-cyan-300' 
                          : 'text-red-400'
                    }`}
                  >
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* ZONA CENTRAL DE CHOQUE Y EFECTOS VISUALES (VFX IMPACT LAYER) */}
          {/* ------------------------------------------------------------- */}
          <div className="relative flex flex-col items-center justify-center shrink-0 w-8 sm:w-16 h-24 pointer-events-none">
            {/* Visual Slash FX */}
            {activeVfx?.type === 'slash' && (
              <div className="absolute inset-0 flex items-center justify-center z-40 animate-slash-sweep">
                <div className="w-28 sm:w-44 h-2.5 bg-gradient-to-r from-transparent via-cyan-200 to-amber-100 shadow-[0_0_25px_rgba(56,189,248,1)] rounded-full rotate-[-35deg]" />
              </div>
            )}

            {/* Visual Skill Magic Burst FX */}
            {activeVfx?.type === 'skill' && (
              <div className="absolute inset-0 flex items-center justify-center z-40 animate-magic-burst-ring">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-purple-400 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-cyan-500/30 shadow-[0_0_35px_rgba(168,85,247,0.9)] flex items-center justify-center">
                  <Sparkles size={28} className="text-amber-300 animate-spin" />
                </div>
              </div>
            )}

            {/* Visual Ultimate Nova FX */}
            {activeVfx?.type === 'ultimate' && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-cosmic-ultimate-nova bg-purple-950/40 backdrop-blur-xs">
                <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-full border-4 border-amber-300 bg-gradient-to-r from-amber-500/30 via-purple-600/40 to-cyan-500/30 shadow-[0_0_80px_rgba(245,158,11,1)] flex items-center justify-center">
                  <span className="mystic-font text-2xl sm:text-3xl font-black text-amber-200 drop-shadow-[0_0_20px_rgba(245,158,11,1)] tracking-widest uppercase">
                    ¡CATACLISMO ASTRAL!
                  </span>
                </div>
              </div>
            )}

            <div className="text-[10px] font-black text-white/30 tracking-widest uppercase select-none">VS</div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* LADO DERECHO: EL/LOS ENEMIGO(S) ASTRALES */}
          {/* ------------------------------------------------------------- */}
          <div className="flex flex-col items-center justify-center relative w-1/2 max-w-[280px]">
            
            <div className={`w-full flex gap-2 ${hasDualEnemies ? 'flex-col sm:flex-row' : 'flex-col'}`}>
              
              {/* PERSONAJE: ENEMIGO 1 */}
              <div 
                onClick={() => hasDualEnemies && enemy1Hp > 0 && setActiveTarget(0)}
                className={`flex-1 flex flex-col items-center cursor-pointer transition-all ${
                  hasDualEnemies && activeTarget !== 0 ? 'opacity-70 hover:opacity-100' : ''
                }`}
              >
                {/* HUD ENEMIGO 1 */}
                <div className={`w-full mb-1.5 p-1.5 rounded-xl border transition-all text-[10px] bg-black/70 ${
                  activeTarget === 0 && enemy1Hp > 0 
                    ? 'border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40' 
                    : 'border-white/10'
                }`}>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1 truncate">
                      <span className="font-bold text-white mystic-font truncate">{enemy.name || enemy.guardianName}</span>
                      <span className={`text-[8px] px-1 py-0.1 rounded font-bold uppercase ${enemy1ElemMeta.text} ${enemy1ElemMeta.bg}`}>
                        {enemy1Elem}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-red-300 shrink-0">{enemy1Hp}/{enemy1MaxHp}</span>
                  </div>

                  {/* Barra de Vida */}
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${Math.max(0, (enemy1Hp / enemy1MaxHp) * 100)}%` }}
                    />
                  </div>

                  {/* Tenacidad Astral (Ruptura) */}
                  <div className="flex items-center justify-between mt-0.5 text-[8px]">
                    <span className="text-gray-400">{enemy.role || 'Guardián'}</span>
                    <div className="flex items-center gap-0.5">
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
                    className={`w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl border-2 ${enemy1ElemMeta.border} bg-gradient-to-b from-black to-purple-950/70 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                      enemy1Hp <= 0 
                        ? 'opacity-25 grayscale' 
                        : animState.enemy1Attacking 
                          ? 'animate-battle-lunge-left z-30' 
                          : animState.enemy1Hit 
                            ? 'animate-battle-hurt-right bg-red-950/80' 
                            : enemy1Stagger === 0 
                              ? 'animate-pulse ring-4 ring-red-500/70' 
                              : ''
                    } ${activeTarget === 0 && enemy1Hp > 0 ? 'ring-2 ring-amber-400 shadow-amber-500/30' : ''}`}
                  >
                    <img 
                      src={getZodiacIcon(enemy.guardianSign || enemy.sign || 'Aries')} 
                      alt="" 
                      className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                    />

                    {/* Retícula de Objetivo Fijado */}
                    {activeTarget === 0 && enemy1Hp > 0 && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-black text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md whitespace-nowrap">
                        <Crosshair size={9} className="animate-spin" /> Fijado
                      </div>
                    )}
                  </div>

                  {/* Pedestal de Sombra Enemigo 1 */}
                  <div className="w-24 sm:w-32 h-5 sm:h-7 rounded-[50%] bg-gradient-to-r from-purple-900/30 via-red-950/50 to-purple-900/30 border border-purple-500/30 -mt-2.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center">
                    <div className="w-12 h-1.5 rounded-[50%] bg-purple-500/20 blur-xs" />
                  </div>

                  {/* Textos Flotantes Enemigo 1 */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                    {floatingTexts.filter(t => t.target === 'enemy1' || t.target === 'enemy').map(t => (
                      <span 
                        key={t.id} 
                        className={`text-xs sm:text-sm font-black font-mono animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                          t.type === 'crit' 
                            ? 'text-amber-300 text-sm sm:text-base scale-110' 
                            : t.type === 'shield' 
                              ? 'text-blue-300' 
                              : 'text-red-400'
                        }`}
                      >
                        {t.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* PERSONAJE: ENEMIGO 2 (SI ES 1v2 O TORRE DUAL) */}
              {hasDualEnemies && (
                <div 
                  onClick={() => enemy2Hp > 0 && setActiveTarget(1)}
                  className={`flex-1 flex flex-col items-center cursor-pointer transition-all ${
                    activeTarget !== 1 ? 'opacity-70 hover:opacity-100' : ''
                  }`}
                >
                  {/* HUD ENEMIGO 2 */}
                  <div className={`w-full mb-1.5 p-1.5 rounded-xl border transition-all text-[10px] bg-black/70 ${
                    activeTarget === 1 && enemy2Hp > 0 
                      ? 'border-amber-400 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40' 
                      : 'border-white/10'
                  }`}>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1 truncate">
                        <span className="font-bold text-white mystic-font truncate">{enemy2.name}</span>
                        <span className={`text-[8px] px-1 py-0.1 rounded font-bold uppercase ${enemy2ElemMeta.text} ${enemy2ElemMeta.bg}`}>
                          {enemy2Elem}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-red-300 shrink-0">{enemy2Hp}/{enemy2MaxHp}</span>
                    </div>

                    {/* Barra de Vida */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-300"
                        style={{ width: `${Math.max(0, (enemy2Hp / enemy2MaxHp) * 100)}%` }}
                      />
                    </div>

                    {/* Tenacidad Astral (Ruptura) */}
                    <div className="flex items-center justify-between mt-0.5 text-[8px]">
                      <span className="text-gray-400">{enemy2.role || 'Guardián'}</span>
                      <div className="flex items-center gap-0.5">
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
                      className={`w-18 h-18 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl border-2 ${enemy2ElemMeta.border} bg-gradient-to-b from-black to-purple-950/70 p-1 relative flex items-center justify-center transition-all duration-300 shadow-xl ${
                        enemy2Hp <= 0 
                          ? 'opacity-25 grayscale' 
                          : animState.enemy2Attacking 
                            ? 'animate-battle-lunge-left z-30' 
                            : animState.enemy2Hit 
                              ? 'animate-battle-hurt-right bg-red-950/80' 
                              : enemy2Stagger === 0 
                                ? 'animate-pulse ring-4 ring-red-500/70' 
                                : ''
                      } ${activeTarget === 1 && enemy2Hp > 0 ? 'ring-2 ring-amber-400 shadow-amber-500/30' : ''}`}
                    >
                      <img 
                        src={getZodiacIcon(enemy2.guardianSign || enemy2.sign || 'Leo')} 
                        alt="" 
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" 
                      />

                      {activeTarget === 1 && enemy2Hp > 0 && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-amber-400 text-black text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-md whitespace-nowrap">
                          <Crosshair size={9} className="animate-spin" /> Fijado
                        </div>
                      )}
                    </div>

                    <div className="w-24 sm:w-32 h-5 sm:h-7 rounded-[50%] bg-gradient-to-r from-purple-900/30 via-red-950/50 to-purple-900/30 border border-purple-500/30 -mt-2.5 shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center">
                      <div className="w-12 h-1.5 rounded-[50%] bg-purple-500/20 blur-xs" />
                    </div>

                    {/* Textos Flotantes Enemigo 2 */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                      {floatingTexts.filter(t => t.target === 'enemy2').map(t => (
                        <span 
                          key={t.id} 
                          className={`text-xs sm:text-sm font-black font-mono animate-bounce drop-shadow-[0_2px_8px_rgba(0,0,0,1)] ${
                            t.type === 'crit' 
                              ? 'text-amber-300 text-sm sm:text-base scale-110' 
                              : t.type === 'shield' 
                                ? 'text-blue-300' 
                                : 'text-red-400'
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
      {/* CONSOLA DE ACCIONES DE COMBATE (5 COMANDOS) */}
      {/* ========================================================================= */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* 1. Ataque Básico */}
        <button
          onClick={handlePlayerBasicAttack}
          disabled={turn !== 'player' || !!battleOutcome}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <Sword size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">+1 Éter</span>
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
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
              -{skillSlot1?.etherCost || 2} Éter
            </span>
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
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                -{skillSlot2.etherCost} Éter
              </span>
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

        {/* 4. Ultimate Astral / Cataclismo AoE */}
        <button
          onClick={handlePlayerUltimate}
          disabled={turn !== 'player' || playerUltimate < 100 || !!battleOutcome}
          className={`p-2.5 rounded-2xl text-left transition-all group flex flex-col justify-between ${
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
              {isCoop ? synastry.attackName : heroClass.ultimate.name}
            </div>
            <div className={`text-[9px] truncate ${playerUltimate >= 100 ? 'text-amber-100' : 'text-gray-500'}`}>
              {hasDualEnemies ? '¡Golpea a Ambos!' : 'Alineación'}
            </div>
          </div>
        </button>

        {/* 5. Poción Astral */}
        <button
          onClick={handleUsePotion}
          disabled={turn !== 'player' || potionsLeft <= 0 || !!battleOutcome}
          className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-400 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between mb-1">
            <Heart size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">x{potionsLeft}</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white truncate">Poción Astral</div>
            <div className="text-[9px] text-gray-400 truncate">Restaura 45% HP</div>
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
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 max-w-sm w-full text-center relative overflow-hidden bg-gradient-to-b from-gray-950 via-purple-950/30 to-black shadow-2xl">
            {battleOutcome === 'victory' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-4 text-amber-300 shadow-xl shadow-amber-500/20 animate-bounce">
                  <Trophy size={32} />
                </div>
                <h3 className="mystic-font text-2xl text-white font-bold mb-1">¡VICTORIA CÓSMICA!</h3>
                <p className="text-xs text-gray-300 mb-4">
                  {hasDualEnemies 
                    ? 'Has doblegado a los dos guardianes en combate de desventaja táctica.' 
                    : 'Has purificado la sombra y conquistado la energía astral.'}
                </p>

                {/* Recompensas */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-5 space-y-1.5 text-xs text-left">
                  <div className="flex justify-between text-cyan-300">
                    <span>Experiencia Ganada:</span>
                    <span className="font-bold font-mono">+{totalExpReward} EXP</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Polvo Estelar:</span>
                    <span className="font-bold font-mono">+{totalGoldReward} ✦</span>
                  </div>
                </div>

                <button
                  onClick={() => onBattleEnd({ 
                    victory: true, 
                    exp: totalExpReward, 
                    gold: totalGoldReward,
                    dropId: enemy.dropChance 
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
                    onClick={() => onBattleEnd({ victory: false })}
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
