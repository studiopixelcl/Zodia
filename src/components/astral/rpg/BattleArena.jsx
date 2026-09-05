"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Sword, Shield, Zap, Sparkles, Flame, 
  Droplet, Wind, Mountain, AlertCircle, ArrowLeft,
  Trophy, RotateCcw, Skull, CheckCircle2, Star
} from 'lucide-react';
import { ELEMENTAL_AFFINITIES, ZODIAC_HERO_CLASSES, getZodiacIcon, isValidImageUrl } from './rpg-data';
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

export function BattleArena({ hero, enemy, mode = 'quick', partner = null, onBattleEnd, onBack }) {
  const heroStats = calculateHeroTotalStats(hero);
  const heroClass = ZODIAC_HERO_CLASSES[hero.sign] || ZODIAC_HERO_CLASSES['Aries'];
  const heroElemMeta = ELEMENTAL_AFFINITIES[hero.element] || ELEMENTAL_AFFINITIES['Fuego'];

  const enemyClass = ZODIAC_HERO_CLASSES[enemy.sign || enemy.guardianSign] || heroClass;
  const enemyElem = enemy.element || enemyClass.element || 'Fuego';
  const enemyElemMeta = ELEMENTAL_AFFINITIES[enemyElem] || ELEMENTAL_AFFINITIES['Fuego'];

  // Tránsito Planetario de Hoy
  const transitBuff = getDailyTransitBuff();
  const hasHeroTransitBoost = hero.element === transitBuff.moonElement;
  const hasEnemyTransitBoost = enemyElem === transitBuff.moonElement;

  // Estados de combate del jugador
  const [playerHp, setPlayerHp] = useState(heroStats.maxHp);
  const [playerEther, setPlayerEther] = useState(2); // Inicia con 2 éter
  const [playerUltimate, setPlayerUltimate] = useState(0); // 0 a 100%
  const [playerEffects, setPlayerEffects] = useState([]);
  const [playerShield, setPlayerShield] = useState(0);
  const [potionsLeft, setPotionsLeft] = useState(hero.potions ?? 3);

  // Estados de combate del enemigo
  const [enemyMaxHp] = useState(enemy.hp || 500);
  const [enemyHp, setEnemyHp] = useState(enemy.hp || 500);
  const [enemyEther, setEnemyEther] = useState(1);
  const [enemyEffects, setEnemyEffects] = useState([]);
  const [enemyShield, setEnemyShield] = useState(0);

  // Refs para garantizar estado siempre sincronizado en callbacks asíncronos y timeouts
  const enemyHpRef = useRef(enemy.hp || 500);
  const playerHpRef = useRef(heroStats.maxHp);
  const enemyShieldRef = useRef(0);
  const playerShieldRef = useRef(0);
  const enemyEffectsRef = useRef([]);
  const playerEffectsRef = useRef([]);

  // Estados de animación y turno
  const [turn, setTurn] = useState('player'); // 'player' | 'enemy' | 'busy'
  const [animState, setAnimState] = useState({
    playerAttacking: false,
    playerHit: false,
    enemyAttacking: false,
    enemyHit: false,
    screenShake: false
  });
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [battleLog, setBattleLog] = useState([
    `🌌 ¡Comienza el combate cósmico entre ${hero.name} y ${enemy.name || enemy.guardianName}!`,
    hasHeroTransitBoost ? `✨ ¡La Luna en ${transitBuff.moonSign} potencia tus habilidades de ${hero.element} (+15%)!` : null
  ].filter(Boolean));

  // Pantallas de fin de partida
  const [battleOutcome, setBattleOutcome] = useState(null); // 'victory' | 'defeat' | null

  // Cálculo de sinastría en caso de modo cooperativo
  const isCoop = mode === 'coop' && partner;
  const synastry = isCoop ? getSynastryCompatibility(hero.sign, partner.sign) : null;

  // Función para agregar textos flotantes (daño, cura, etc.)
  const spawnFloatingText = (text, target = 'enemy', type = 'damage') => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, text, target, type }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1200);
  };

  // Función para registrar mensajes en el historial
  const logMessage = (msg) => {
    setBattleLog(prev => [msg, ...prev.slice(0, 15)]);
  };

  // Turno del Jugador: 1. Ataque Básico
  const handlePlayerBasicAttack = () => {
    if (turn !== 'player' || battleOutcome) return;
    setTurn('busy');

    playBattleAttackSound();
    setAnimState(p => ({ ...p, playerAttacking: true }));

    setTimeout(() => {
      const { damage, isCrit, hasTransitBoost } = calculateDamage(
        { atk: heroStats.atk, element: hero.element, critRate: heroStats.critRate },
        { def: enemy.def || 25, element: enemyElem },
        1.0,
        false,
        transitBuff.moonElement
      );

      // Sonido de impacto
      if (isCrit) playBattleCritSound();
      else playBattleHitSound();

      setAnimState(p => ({ ...p, playerAttacking: false, enemyHit: true, screenShake: isCrit }));
      setTimeout(() => setAnimState(p => ({ ...p, enemyHit: false, screenShake: false })), 400);

      // Aplicar daño contra escudo o vida del enemigo
      let finalDamage = damage;
      if (enemyShieldRef.current > 0) {
        if (damage <= enemyShieldRef.current) {
          enemyShieldRef.current -= damage;
          setEnemyShield(enemyShieldRef.current);
          finalDamage = 0;
          spawnFloatingText(`¡Bloqueado (${damage})!`, 'enemy', 'shield');
        } else {
          finalDamage = damage - enemyShieldRef.current;
          enemyShieldRef.current = 0;
          setEnemyShield(0);
          spawnFloatingText(`-${finalDamage}`, 'enemy', isCrit ? 'crit' : 'damage');
        }
      } else {
        spawnFloatingText(isCrit ? `¡CRÍTICO! -${finalDamage}` : `-${finalDamage}`, 'enemy', isCrit ? 'crit' : 'damage');
      }

      const nextEnemyHp = Math.max(0, enemyHpRef.current - finalDamage);
      enemyHpRef.current = nextEnemyHp;
      setEnemyHp(nextEnemyHp);

      // Ganar recursos
      setPlayerEther(e => Math.min(5, e + 1));
      setPlayerUltimate(u => Math.min(100, u + 18));

      logMessage(`⚔️ ${hero.name} asestó ${heroClass.basicAttack.name} causando ${finalDamage} de daño.${isCrit ? ' ¡Impacto Crítico Estelar!' : ''}${hasTransitBoost ? ' (Bono Tránsito)' : ''}`);

      if (nextEnemyHp <= 0) {
        handleVictory();
      } else {
        setTimeout(() => startEnemyTurn(nextEnemyHp), 800);
      }
    }, 450);
  };

  // Turno del Jugador: 2. Habilidad de Signo
  const handlePlayerSkill = () => {
    if (turn !== 'player' || battleOutcome) return;
    if (playerEther < heroClass.skill.etherCost) {
      logMessage(`⚠️ Necesitas ${heroClass.skill.etherCost} de Éter para usar ${heroClass.skill.name}.`);
      return;
    }

    setTurn('busy');
    setPlayerEther(e => e - heroClass.skill.etherCost);

    playBattleAttackSound();
    setAnimState(p => ({ ...p, playerAttacking: true }));

    setTimeout(() => {
      const skill = heroClass.skill;
      const { damage, isCrit, hasTransitBoost } = calculateDamage(
        { atk: heroStats.atk, element: hero.element, critRate: (heroStats.critRate || 0.15) + (skill.critBonus || 0) },
        { def: enemy.def || 25, element: enemyElem },
        skill.multiplier || 1.4,
        false,
        transitBuff.moonElement
      );

      if (isCrit) playBattleCritSound();
      else playBattleHitSound();

      setAnimState(p => ({ ...p, playerAttacking: false, enemyHit: true, screenShake: true }));
      setTimeout(() => setAnimState(p => ({ ...p, enemyHit: false, screenShake: false })), 400);

      // Efectos específicos de habilidades
      if (skill.effect?.type === 'shield' || skill.effect?.type === 'shield_heal') {
        const shieldVal = skill.effect.shield || skill.effect.value || 100;
        playerShieldRef.current += shieldVal;
        setPlayerShield(playerShieldRef.current);
        playBattleShieldSound();
        spawnFloatingText(`+${shieldVal} Escudo`, 'player', 'shield');
      }

      if (skill.effect?.heal) {
        const healVal = skill.effect.heal;
        const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healVal);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);
        playBattleHealSound();
        spawnFloatingText(`+${healVal} HP`, 'player', 'heal');
      }

      if (skill.effect?.type === 'burn' || skill.effect?.type === 'poison') {
        enemyEffectsRef.current = [...enemyEffectsRef.current, skill.effect];
        setEnemyEffects([...enemyEffectsRef.current]);
        spawnFloatingText(`¡Efecto de ${skill.effect.type.toUpperCase()}!`, 'enemy', 'buff');
      }

      // Aplicar daño
      const nextEnemyHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = nextEnemyHp;
      setEnemyHp(nextEnemyHp);
      spawnFloatingText(`-${damage}`, 'enemy', 'crit');
      setPlayerUltimate(u => Math.min(100, u + 25));

      logMessage(`✨ ${hero.name} desató [${skill.name}] infligiendo ${damage} de daño elemental.${hasTransitBoost ? ' (+15% Tránsito Lunar)' : ''}`);

      if (nextEnemyHp <= 0) {
        handleVictory();
      } else {
        setTimeout(() => startEnemyTurn(nextEnemyHp), 800);
      }
    }, 500);
  };

  // Turno del Jugador: 3. Alineación Cósmica / Ataque de Sinastría
  const handlePlayerUltimate = () => {
    if (turn !== 'player' || battleOutcome || playerUltimate < 100) return;
    setTurn('busy');
    setPlayerUltimate(0);

    playBattleCritSound();
    setAnimState(p => ({ ...p, playerAttacking: true, screenShake: true }));

    setTimeout(() => {
      const ult = heroClass.ultimate;
      const ultMultiplier = isCoop ? 3.4 : (ult.multiplier || 2.5);

      const { damage } = calculateDamage(
        { atk: heroStats.atk, element: hero.element, critRate: 1.0 },
        { def: Math.round((enemy.def || 25) * 0.4), element: enemyElem },
        ultMultiplier,
        true,
        transitBuff.moonElement
      );

      if (ult.healSelf || isCoop) {
        const healAmount = isCoop ? 140 : (ult.healSelf || 60);
        const nextPlayerHp = Math.min(heroStats.maxHp, playerHpRef.current + healAmount);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);
        playBattleHealSound();
        spawnFloatingText(`+${healAmount} HP`, 'player', 'heal');
      }

      setAnimState(p => ({ ...p, playerAttacking: false, enemyHit: true }));
      setTimeout(() => setAnimState(p => ({ ...p, enemyHit: false, screenShake: false })), 600);

      const nextEnemyHp = Math.max(0, enemyHpRef.current - damage);
      enemyHpRef.current = nextEnemyHp;
      setEnemyHp(nextEnemyHp);
      spawnFloatingText(`¡ALINEACIÓN! -${damage}`, 'enemy', 'crit');

      if (isCoop) {
        logMessage(`💫 ¡¡ATAQUE COMBINADO DE SINASTRÍA!! ${hero.name} y ${partner.name} desataron [${synastry.attackName}] (${synastry.score}% compatibilidad) infligiendo ${damage} de daño titánico!`);
      } else {
        logMessage(`🌌 ¡¡ALINEACIÓN CÓSMICA!! ${hero.name} invocó [${ult.name}] provocando un cataclismo de ${damage} de daño.`);
      }

      if (nextEnemyHp <= 0) {
        handleVictory();
      } else {
        setTimeout(() => startEnemyTurn(nextEnemyHp), 900);
      }
    }, 600);
  };

  // Turno del Jugador: 4. Usar Poción Astral
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

  // Turno del Enemigo (IA)
  const startEnemyTurn = (currentEnemyHp = enemyHpRef.current) => {
    setTurn('enemy');

    // 1. Procesar estados en el enemigo (veneno, quemadura, etc.)
    const statusResult = processStatusEffects(enemyEffectsRef.current, currentEnemyHp, enemyMaxHp);
    enemyHpRef.current = statusResult.nextHp;
    setEnemyHp(statusResult.nextHp);
    enemyEffectsRef.current = statusResult.updatedEffects;
    setEnemyEffects(statusResult.updatedEffects);
    statusResult.logMessages.forEach(m => logMessage(m));

    if (statusResult.nextHp <= 0) {
      handleVictory();
      return;
    }

    // 2. IA del enemigo toma decisión
    setTimeout(() => {
      const action = chooseEnemyAction(enemy, enemyHpRef.current, enemyMaxHp, enemyEther);
      playBattleAttackSound();
      setAnimState(p => ({ ...p, enemyAttacking: true }));

      setTimeout(() => {
        const isSkill = action.type === 'skill';
        const mult = isSkill ? 1.4 : 1.0;
        if (isSkill) setEnemyEther(e => Math.max(0, e - 2));
        else setEnemyEther(e => Math.min(5, e + 1));

        const { damage, isCrit } = calculateDamage(
          { atk: enemy.atk || 55, element: enemyElem, critRate: 0.12 },
          { def: heroStats.def, element: hero.element },
          mult
        );

        if (isCrit) playBattleCritSound();
        else playBattleHitSound();

        setAnimState(p => ({ ...p, enemyAttacking: false, playerHit: true, screenShake: isCrit }));
        setTimeout(() => setAnimState(p => ({ ...p, playerHit: false, screenShake: false })), 400);

        // Absorción de daño por escudo del jugador
        let finalDamage = damage;
        if (playerShieldRef.current > 0) {
          if (damage <= playerShieldRef.current) {
            playerShieldRef.current -= damage;
            setPlayerShield(playerShieldRef.current);
            finalDamage = 0;
            spawnFloatingText(`¡Bloqueaste (${damage})!`, 'player', 'shield');
          } else {
            finalDamage = damage - playerShieldRef.current;
            playerShieldRef.current = 0;
            setPlayerShield(0);
            spawnFloatingText(`-${finalDamage}`, 'player', isCrit ? 'crit' : 'damage');
          }
        } else {
          spawnFloatingText(isCrit ? `¡CRÍTICO! -${finalDamage}` : `-${finalDamage}`, 'player', isCrit ? 'crit' : 'damage');
        }

        const nextPlayerHp = Math.max(0, playerHpRef.current - finalDamage);
        playerHpRef.current = nextPlayerHp;
        setPlayerHp(nextPlayerHp);

        logMessage(`⚡ ${enemy.name || enemy.guardianName} usó ${action.name} causando ${finalDamage} de daño.`);

        if (nextPlayerHp <= 0) {
          handleDefeat();
        } else {
          // Procesar efectos en el jugador
          const playerStatus = processStatusEffects(playerEffectsRef.current, nextPlayerHp, heroStats.maxHp);
          playerHpRef.current = playerStatus.nextHp;
          setPlayerHp(playerStatus.nextHp);
          playerEffectsRef.current = playerStatus.updatedEffects;
          setPlayerEffects(playerStatus.updatedEffects);
          playerStatus.logMessages.forEach(m => logMessage(m));

          if (playerStatus.nextHp <= 0) {
            handleDefeat();
          } else {
            setTurn('player');
          }
        }
      }, 500);
    }, 800);
  };

  // Manejo de Victoria
  const handleVictory = () => {
    setBattleOutcome('victory');
    playBattleVictorySound();
    logMessage(`🏆 ¡VICTORIA! Has purificado la sombra y conquistado la constelación.`);
  };

  // Manejo de Derrota
  const handleDefeat = () => {
    setBattleOutcome('defeat');
    playBattleDefeatSound();
    logMessage(`💀 Has sido derrotado. Tu energía astral regresa al Éter para reconstituirse.`);
  };

  return (
    <div className={`relative min-h-[580px] rounded-3xl overflow-hidden glass-panel border border-cyan-500/30 p-4 sm:p-6 bg-gradient-to-b from-black via-purple-950/30 to-black select-none ${animState.screenShake ? 'animate-bounce' : ''}`}>
      
      {/* Fondo de Estrellas y Nebulosa Reactiva */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black -z-10" />

      {/* Barra Superior de Control / Salir */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 transition-colors"
        >
          <ArrowLeft size={14} /> Retirada Astral
        </button>

        <div className="flex items-center gap-2">
          {/* Badge de Tránsito Lunar en Vivo */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-[10px] text-purple-200 shadow-sm">
            <span>{transitBuff.moonGlyph}</span>
            <span>Luna en {transitBuff.moonSign}</span>
            <span className="font-bold text-amber-300">({transitBuff.moonElement} +15%)</span>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
            {mode === 'houses' ? 'Sendero de las 12 Casas' : mode === 'coop' ? 'Incursión de Sinastría' : 'Duelo de Sombras'}
          </span>
        </div>
      </div>

      {/* ARENA DE COMBATE: Tarjeta Enemigo y Tarjeta Jugador */}
      <div className="space-y-6">
        {/* PANEL DEL ENEMIGO */}
        <div className={`p-4 rounded-2xl bg-black/60 border ${enemyElemMeta.border} relative transition-all duration-300 ${animState.enemyHit ? 'bg-red-950/50 scale-95' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl border-2 ${enemyElemMeta.border} ${enemyElemMeta.aura} overflow-hidden bg-purple-950/40 p-1 flex items-center justify-center`}>
                <img 
                  src={getZodiacIcon(enemy.guardianSign || enemy.sign || 'Aries')} 
                  alt="" 
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white mystic-font truncate max-w-[180px]">
                    {enemy.name || enemy.guardianName}
                  </span>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${enemyElemMeta.text} ${enemyElemMeta.bg}`}>
                    {enemyElem}
                  </span>
                  {hasEnemyTransitBoost && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                      +15% Tránsito
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-400">
                  {enemy.guardianSign || enemy.sign || 'Sombra Cósmica'}
                </span>
              </div>
            </div>

            {/* HP numérico del enemigo */}
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-white">{enemyHp}</span>
              <span className="text-[10px] text-gray-400"> / {enemyMaxHp} HP</span>
            </div>
          </div>

          {/* Barra de Vida del Enemigo */}
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}
            />
          </div>

          {/* Efectos activos en el enemigo */}
          {enemyEffects.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {enemyEffects.map((eff, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold uppercase">
                  {eff.type} ({eff.turns}t)
                </span>
              ))}
            </div>
          )}

          {/* Floating text del enemigo */}
          <div className="absolute top-2 right-4 flex flex-col items-end pointer-events-none">
            {floatingTexts.filter(t => t.target === 'enemy').map(t => (
              <span 
                key={t.id} 
                className={`text-sm font-black font-mono animate-bounce drop-shadow-lg ${
                  t.type === 'crit' ? 'text-amber-400 text-base scale-110' : t.type === 'shield' ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {t.text}
              </span>
            ))}
          </div>
        </div>

        {/* ESPACIO CENTRAL: Campo de colisión de energías */}
        <div className="h-16 flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl animate-pulse" />
          </div>

          {turn === 'enemy' ? (
            <div className="px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
              <Skull size={14} /> Turno de la Sombra...
            </div>
          ) : turn === 'player' ? (
            <div className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
              <Sparkles size={14} /> {isCoop ? `Turno del Dúo (${synastry.score}% Afinidad)` : '¡Tu Turno de Acción!'}
            </div>
          ) : (
            <div className="text-xs text-purple-300 font-bold uppercase tracking-wider animate-pulse">
              Colisión Astral en progreso...
            </div>
          )}
        </div>

        {/* PANEL DEL JUGADOR */}
        <div className={`p-4 rounded-2xl bg-black/60 border ${heroElemMeta.border} relative transition-all duration-300 ${animState.playerHit ? 'bg-red-950/50 scale-95' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* Avatar del Jugador con foto real e icono de signo */}
              <div className="relative">
                <div className={`w-14 h-14 rounded-2xl border-2 ${heroElemMeta.border} ${heroElemMeta.aura} overflow-hidden bg-black flex items-center justify-center relative p-0.5`}>
                  {isValidImageUrl(hero.avatarUrl) ? (
                    <img 
                      src={hero.avatarUrl} 
                      alt="" 
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getZodiacIcon(hero.sign);
                        e.currentTarget.className = "w-10 h-10 object-contain";
                      }}
                    />
                  ) : (
                    <img src={getZodiacIcon(hero.sign)} alt="" className="w-10 h-10 object-contain" />
                  )}
                </div>
                {/* Medallón del signo del jugador */}
                <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-black/90 border border-amber-400/80 p-0.5 shadow-md flex items-center justify-center">
                  <img src={getZodiacIcon(hero.sign)} alt="" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Avatar del Aliado en Coop con foto e icono */}
              {isCoop && (
                <div className="relative -ml-1">
                  <div className="w-12 h-12 rounded-2xl border-2 border-amber-400 overflow-hidden bg-amber-950/40 flex items-center justify-center shadow-lg shadow-amber-500/20 p-0.5">
                    {isValidImageUrl(partner.image) ? (
                      <img 
                        src={partner.image} 
                        alt="" 
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getZodiacIcon(partner.sign);
                          e.currentTarget.className = "w-8 h-8 object-contain";
                        }}
                      />
                    ) : (
                      <img src={getZodiacIcon(partner.sign)} alt="" className="w-8 h-8 object-contain" />
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/90 border border-amber-400 p-0.5 shadow-md flex items-center justify-center">
                    <img src={getZodiacIcon(partner.sign)} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white mystic-font truncate max-w-[180px]">
                    {isCoop ? `${hero.name} & ${partner.name}` : hero.name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${heroElemMeta.text} ${heroElemMeta.bg}`}>
                    {hero.element}
                  </span>
                  {hasHeroTransitBoost && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                      +15% Tránsito
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span>Nivel {hero.level}</span>
                  {isCoop && <span className="text-amber-300 font-bold font-mono">⚡ {synastry.score}% Sinastría</span>}
                  {playerShield > 0 && <span className="text-cyan-300 font-bold">🛡️ +{playerShield} Escudo</span>}
                </div>
              </div>
            </div>

            {/* HP numérico del jugador */}
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-white">{playerHp}</span>
              <span className="text-[10px] text-gray-400"> / {heroStats.maxHp} HP</span>
            </div>
          </div>

          {/* Barra de Vida del Jugador */}
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden p-0.5 mb-2">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, (playerHp / heroStats.maxHp) * 100)}%` }}
            />
          </div>

          {/* Medidores de Éter y Resonancia (Ultimate) */}
          <div className="flex items-center justify-between pt-1">
            {/* Éter (1 a 5) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase">ÉTER:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(dot => (
                  <div 
                    key={dot} 
                    className={`w-3 h-3 rounded-full transition-all ${
                      dot <= playerEther 
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]' 
                        : 'bg-white/10 border border-white/20'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Barra de Ultimate */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                <Sparkles size={11} /> {isCoop ? 'SINASTRÍA:' : 'ULTIMATE:'}
              </span>
              <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${playerUltimate}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300">{playerUltimate}%</span>
            </div>
          </div>

          {/* Floating text del jugador */}
          <div className="absolute top-2 right-4 flex flex-col items-end pointer-events-none">
            {floatingTexts.filter(t => t.target === 'player').map(t => (
              <span 
                key={t.id} 
                className={`text-sm font-black font-mono animate-bounce drop-shadow-lg ${
                  t.type === 'heal' ? 'text-emerald-400 text-base' : t.type === 'shield' ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {t.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN DE COMBATE */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* 1. Ataque Básico */}
        <button
          onClick={handlePlayerBasicAttack}
          disabled={turn !== 'player' || !!battleOutcome}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center justify-between mb-1">
            <Sword size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">+1 Éter</span>
          </div>
          <div className="text-xs font-bold text-white truncate">{heroClass.basicAttack.name}</div>
          <div className="text-[10px] text-gray-400 truncate">Ataque físico cósmico</div>
        </button>

        {/* 2. Habilidad de Signo */}
        <button
          onClick={handlePlayerSkill}
          disabled={turn !== 'player' || playerEther < heroClass.skill.etherCost || !!battleOutcome}
          className={`p-3 rounded-2xl bg-gradient-to-br from-purple-950/40 to-black border ${playerEther >= heroClass.skill.etherCost ? 'border-purple-500/60 hover:border-purple-400' : 'border-white/10'} text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group`}
        >
          <div className="flex items-center justify-between mb-1">
            <Sparkles size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">-{heroClass.skill.etherCost} Éter</span>
          </div>
          <div className="text-xs font-bold text-purple-200 truncate">{heroClass.skill.name}</div>
          <div className="text-[10px] text-gray-400 truncate">Habilidad Elemental</div>
        </button>

        {/* 3. Ultimate Astral / Ataque de Sinastría */}
        <button
          onClick={handlePlayerUltimate}
          disabled={turn !== 'player' || playerUltimate < 100 || !!battleOutcome}
          className={`p-3 rounded-2xl text-left transition-all group ${
            playerUltimate >= 100 
              ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-amber-500 bg-[length:200%_auto] animate-pulse border-2 border-amber-300 text-black shadow-lg shadow-amber-500/30' 
              : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <Star size={16} className={playerUltimate >= 100 ? 'text-amber-100' : 'text-gray-500'} />
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${playerUltimate >= 100 ? 'bg-black text-amber-300' : 'bg-white/10 text-gray-400'}`}>
              {playerUltimate}/100%
            </span>
          </div>
          <div className={`text-xs font-bold truncate ${playerUltimate >= 100 ? 'text-white' : 'text-gray-400'}`}>
            {isCoop ? synastry.attackName : heroClass.ultimate.name}
          </div>
          <div className={`text-[10px] truncate ${playerUltimate >= 100 ? 'text-amber-100' : 'text-gray-500'}`}>
            {isCoop ? `Sinastría Dúo (${synastry.score}%)` : 'Alineación Cósmica'}
          </div>
        </button>

        {/* 4. Poción Astral */}
        <button
          onClick={handleUsePotion}
          disabled={turn !== 'player' || potionsLeft <= 0 || !!battleOutcome}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-emerald-400 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center justify-between mb-1">
            <Heart size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">x{potionsLeft}</span>
          </div>
          <div className="text-xs font-bold text-white truncate">Poción Astral</div>
          <div className="text-[10px] text-gray-400 truncate">Restaura 45% HP</div>
        </button>
      </div>

      {/* TICKER DE HISTORIAL DE COMBATE */}
      <div className="mt-4 p-2.5 rounded-xl bg-black/60 border border-white/10 max-h-20 overflow-y-auto custom-scrollbar font-mono text-[11px] text-gray-300 space-y-0.5">
        {battleLog.map((log, index) => (
          <div key={index} className={index === 0 ? 'text-cyan-300 font-semibold' : 'text-gray-400'}>
            {log}
          </div>
        ))}
      </div>

      {/* MODAL DE RESULTADO: VICTORIA O DERROTA */}
      {battleOutcome && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-6 animate-fadeIn">
          <div className="glass-panel p-6 rounded-3xl border border-cyan-500/40 max-w-sm w-full text-center relative overflow-hidden bg-gradient-to-b from-gray-950 via-purple-950/30 to-black">
            {battleOutcome === 'victory' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-4 text-amber-300 shadow-xl shadow-amber-500/20 animate-bounce">
                  <Trophy size={32} />
                </div>
                <h3 className="mystic-font text-2xl text-white font-bold mb-1">¡VICTORIA CÓSMICA!</h3>
                <p className="text-xs text-gray-300 mb-4">
                  Has purificado el templo y dominado la energía astral.
                </p>

                {/* Recompensas */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-5 space-y-1.5 text-xs text-left">
                  <div className="flex justify-between text-cyan-300">
                    <span>Experiencia Ganada:</span>
                    <span className="font-bold font-mono">+{enemy.rewardExp || 120} EXP</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Polvo Estelar Obtenido:</span>
                    <span className="font-bold font-mono">+{enemy.rewardGold || 150} ✦</span>
                  </div>
                </div>

                <button
                  onClick={() => onBattleEnd({ 
                    victory: true, 
                    exp: enemy.rewardExp || 120, 
                    gold: enemy.rewardGold || 150,
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
                  La sombra de la constelación ha superado tus fuerzas. Reconfigura tus reliquias y vuelve a intentarlo.
                </p>

                <button
                  onClick={() => onBattleEnd({ victory: false })}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
                >
                  REGRESAR AL REFUGIO
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
