/**
 * CHRONICLES OF THE ZODIA - RPG ENGINE
 * Motor de simulación de combate por turnos, cálculo de estadísticas totales,
 * modificadores elementales, sinastría de combate e inteligencia artificial.
 */

import { ELEMENTAL_AFFINITIES, ZODIAC_HERO_CLASSES, calculateActiveSets } from './rpg-data';
import { calculatePlanetaryPositions, calculateMoonPhase } from '../../../lib/transits';

/**
 * Obtiene el bono cósmico del tránsito del día basado en la posición real de la Luna
 */
export function getDailyTransitBuff() {
  try {
    const planets = calculatePlanetaryPositions();
    const moon = planets.find(p => p.id === 'moon');
    const moonSign = moon?.sign?.name || 'Cáncer';
    const moonElement = moon?.sign?.element || 'Agua';
    const moonPhase = calculateMoonPhase();

    return {
      moonSign,
      moonElement,
      moonGlyph: moonPhase.glyph || '🌕',
      phaseName: moonPhase.phaseName || 'Fase Lunar',
      description: `La Luna transita por ${moonSign} (${moonElement}). Guerreros de ${moonElement} reciben +15% de poder cósmico.`,
      bonusMultiplier: 1.15
    };
  } catch {
    return {
      moonSign: 'Aries',
      moonElement: 'Fuego',
      moonGlyph: '♈',
      phaseName: 'Energía Primordial',
      description: 'El Éter vibra con energía celestial activa.',
      bonusMultiplier: 1.15
    };
  }
}

/**
 * Calcula las estadísticas efectivas del héroe sumando nivel, equipamiento y bonos de conjunto
 */
export function calculateHeroTotalStats(hero) {
  if (!hero) {
    return {
      baseStats: { hp: 400, atk: 50, def: 25, spd: 30, critRate: 0.15 },
      gearStats: { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0, power: 0 },
      activeSets: [],
      totalPower: 0,
      maxHp: 400,
      atk: 50,
      def: 25,
      spd: 30,
      critRate: 0.15
    };
  }
  const base = hero.stats || ZODIAC_HERO_CLASSES[hero.sign]?.baseStats || { hp: 400, atk: 50, def: 25, spd: 30, critRate: 0.15 };
  const level = hero.level || 1;
  const levelBonus = (level - 1) * 0.08; // 8% por nivel

  const baseHp = Math.round(base.hp * (1 + levelBonus));
  const baseAtk = Math.round(base.atk * (1 + levelBonus));
  const baseDef = Math.round(base.def * (1 + levelBonus));
  const baseSpd = Math.round(base.spd * (1 + levelBonus * 0.5));
  const baseCritRate = base.critRate || 0.15;

  let maxHp = baseHp;
  let atk = baseAtk;
  let def = baseDef;
  let spd = baseSpd;
  let critRate = baseCritRate;

  // Estadísticas aportadas EXCLUSIVAMENTE por piezas de equipo
  const gearStats = { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0, power: 0 };

  const eq = hero.equipped || {};
  for (const slot of ['weapon', 'armor', 'relic']) {
    const item = eq[slot];
    if (item) {
      if (item.atk) { atk += item.atk; gearStats.atk += item.atk; }
      if (item.hp) { maxHp += item.hp; gearStats.hp += item.hp; }
      if (item.def) { def += item.def; gearStats.def += item.def; }
      if (item.spd) { spd += item.spd; gearStats.spd += item.spd; }
      if (item.crit) { critRate += item.crit; gearStats.critRate += item.crit; }
    }
  }

  // Bonificaciones acumulativas de conjuntos de equipo (Set Bonuses)
  const activeSets = calculateActiveSets(eq);
  for (const setInfo of activeSets) {
    const b = setInfo.bonusStats;
    if (b.hp) { maxHp += b.hp; gearStats.hp += b.hp; }
    if (b.atk) { atk += b.atk; gearStats.atk += b.atk; }
    if (b.def) { def += b.def; gearStats.def += b.def; }
    if (b.spd) { spd += b.spd; gearStats.spd += b.spd; }
    if (b.critRate) { critRate += b.critRate; gearStats.critRate += b.critRate; }
  }

  // Cálculo de Poder Cósmico (Gear Score)
  gearStats.power = (gearStats.atk * 3) + Math.round(gearStats.hp * 0.8) + (gearStats.def * 2.5) + (gearStats.spd * 2) + Math.round(gearStats.critRate * 300);
  const totalPower = (atk * 3) + Math.round(maxHp * 0.8) + (def * 2.5) + (spd * 2) + Math.round(critRate * 300);

  return { 
    baseStats: { hp: baseHp, atk: baseAtk, def: baseDef, spd: baseSpd, critRate: baseCritRate },
    gearStats,
    activeSets,
    totalPower,
    maxHp, 
    atk, 
    def, 
    spd, 
    critRate: Math.min(0.85, critRate) 
  };
}

/**
 * Retorna el multiplicador y mensaje de afinidad elemental
 */
export function getElementalMultiplier(attackerElem, defenderElem) {
  if (!attackerElem || !defenderElem) return { multiplier: 1.0, status: 'neutral' };
  
  const rules = ELEMENTAL_AFFINITIES[attackerElem];
  if (rules && rules.strongAgainst === defenderElem) {
    return { multiplier: 1.35, status: 'super_effective' };
  }
  if (rules && rules.weakAgainst === defenderElem) {
    return { multiplier: 0.75, status: 'resisted' };
  }
  return { multiplier: 1.0, status: 'neutral' };
}

/**
 * Calcula el daño de una habilidad o ataque considerando ventajas, tránsitos, posiciones tácticas y posturas
 */
export function calculateDamage(
  attacker, 
  defender, 
  skillMultiplier = 1.0, 
  isCritForced = false, 
  transitElement = null,
  tactics = {}
) {
  const { 
    attackerPosition = 'frontline', 
    defenderPosition = 'frontline', 
    stance = null, 
    isStaggered = false, 
    mutator = null 
  } = tactics;

  let atk = attacker.atk || 50;
  let def = defender.def || 25;
  const attackerElem = attacker.element;
  const defenderElem = defender.element;

  // Modificadores de Postura Cósmica del atacante
  let stanceDamageMult = 1.0;
  let stanceCritBonus = 0;
  if (stance === 'solar') {
    stanceDamageMult = 1.25; // +25% ATQ en postura solar
  } else if (stance === 'lunar') {
    stanceDamageMult = 0.90; // Modo defensivo
  } else if (stance === 'stellar') {
    stanceCritBonus = 0.15; // +15% Prob. Crítico
  }

  // Modificador de Posicionamiento táctico (Vanguardia vs Retaguardia)
  let positionMult = 1.0;
  if (attackerPosition === 'frontline') {
    positionMult *= 1.20; // +20% Daño ofensivo en vanguardia
  } else if (attackerPosition === 'backline') {
    positionMult *= 0.85; // Menos daño físico a distancia
  }

  // Si el defensor está en Retaguardia, absorbe un 30% del impacto directo
  if (defenderPosition === 'backline') {
    positionMult *= 0.70;
  }

  // Multiplicador por Ruptura Cósmica (Stagger / Rotura de Guardia)
  const staggerMult = isStaggered ? 1.50 : 1.0;

  // Mutador de Torre del Caos activo
  let mutatorMult = 1.0;
  if (mutator?.id === 'solar_flare' && (attackerElem === 'Fuego')) {
    mutatorMult = 1.25;
  } else if (mutator?.id === 'gravity_well' && attackerPosition === 'frontline') {
    mutatorMult = 1.30;
  }

  const { multiplier: elemMult, status: elemStatus } = getElementalMultiplier(attackerElem, defenderElem);

  // Bono de tránsito lunar (+15% si coincide el elemento)
  const transitMult = (transitElement && attackerElem === transitElement) ? 1.15 : 1.0;

  // Fórmula de mitigación de daño clásica Zodia (Equilibrada para combates tácticos)
  const rawDamage = Math.max(16, (atk * 1.15 - def * 0.55) * skillMultiplier * stanceDamageMult * positionMult * staggerMult * mutatorMult);

  // Tirada de crítico
  const critRoll = Math.random();
  const critRate = (attacker.critRate || 0.15) + stanceCritBonus + (attackerPosition === 'frontline' ? 0.10 : 0);
  const isCrit = isCritForced || critRoll < critRate;
  const critMult = isCrit ? 1.65 : 1.0;

  // Variación aleatoria (±7%)
  const variance = 0.93 + Math.random() * 0.14;

  const finalDamage = Math.max(10, Math.round(rawDamage * elemMult * transitMult * critMult * variance));

  return {
    damage: finalDamage,
    isCrit,
    elemStatus,
    hasTransitBoost: transitElement && attackerElem === transitElement,
    isSuperEffective: elemStatus === 'super_effective',
    isResisted: elemStatus === 'resisted',
    isStaggered
  };
}

/**
 * Procesa efectos de estado al inicio o fin del turno (Quemaduras, Veneno, Regeneración, Escudos)
 */
export function processStatusEffects(effects = [], currentHp, maxHp) {
  let updatedEffects = [];
  let hpChange = 0;
  let logMessages = [];
  let activeShield = 0;

  effects.forEach(eff => {
    let remainingTurns = eff.turns - 1;

    if (eff.type === 'burn') {
      const dmg = eff.dot || 20;
      hpChange -= dmg;
      logMessages.push(`🔥 Fuego cósmico quema por ${dmg} de daño.`);
    } else if (eff.type === 'poison') {
      const dmg = eff.dot || 25;
      hpChange -= dmg;
      logMessages.push(`☠️ El veneno astral inflige ${dmg} de daño residual.`);
    } else if (eff.type === 'bleed') {
      const dmg = eff.dot || 24;
      hpChange -= dmg;
      logMessages.push(`🩸 El sangrado etéreo inflige ${dmg} de daño.`);
    } else if (eff.type === 'regen') {
      const heal = eff.value || 30;
      hpChange += heal;
      logMessages.push(`✨ Las mareas astrales restauran +${heal} de vida.`);
    } else if (eff.type === 'stun') {
      logMessages.push(`💫 Aturdido / Congelado: ¡No puede actuar en este turno!`);
    } else if (eff.type === 'shield') {
      activeShield = eff.value || 0;
    }

    if (remainingTurns > 0 && eff.type !== 'shield') {
      updatedEffects.push({ ...eff, turns: remainingTurns });
    } else if (eff.type === 'shield' && remainingTurns > 0) {
      updatedEffects.push({ ...eff, turns: remainingTurns });
    }
  });

  const nextHp = Math.min(maxHp, Math.max(0, currentHp + hpChange));

  return {
    nextHp,
    hpChange,
    updatedEffects,
    activeShield,
    logMessages
  };
}

/**
 * Inteligencia Artificial del Enemigo para elegir acción
 */
export function chooseEnemyAction(enemy, currentHp, maxHp, currentEther) {
  const hpPercent = currentHp / maxHp;

  // 1. Si tiene 2 o más de Éter y poca vida, o 50% de probabilidad si tiene Éter
  if (currentEther >= 2) {
    // Si tiene habilidad curativa o escudo y tiene menos del 50% de vida
    if (hpPercent < 0.45 && (enemy.element === 'Tierra' || enemy.element === 'Agua')) {
      return { type: 'skill', name: enemy.skill?.name || 'Pulso de Protección' };
    }

    // 65% de probabilidad de usar habilidad ofensiva
    if (Math.random() < 0.65) {
      return { type: 'skill', name: enemy.skill?.name || 'Habilidad Estelar' };
    }
  }

  // 2. Por defecto: Ataque básico
  return { type: 'basic', name: enemy.basicAttack?.name || 'Ataque Cósmico' };
}

/**
 * Compatibilidad de sinastría entre dos signos para el modo cooperativo
 */
export function getSynastryCompatibility(signA, signB) {
  const heroA = ZODIAC_HERO_CLASSES[signA] || ZODIAC_HERO_CLASSES['Aries'];
  const heroB = ZODIAC_HERO_CLASSES[signB] || ZODIAC_HERO_CLASSES['Leo'];

  const sameElement = heroA.element === heroB.element;
  const isOpposite = (
    (heroA.element === 'Fuego' && heroB.element === 'Aire') ||
    (heroA.element === 'Aire' && heroB.element === 'Fuego') ||
    (heroA.element === 'Tierra' && heroB.element === 'Agua') ||
    (heroA.element === 'Agua' && heroB.element === 'Tierra')
  );

  let score = 70;
  let attackName = 'Furia del Firmamento';
  let synergyDesc = 'Vínculo astral armónico.';

  if (sameElement) {
    score = 96;
    attackName = `Resonancia Primordial de ${heroA.element}`;
    synergyDesc = `¡Almas de ${heroA.element}! Desata un torrente de energía gemela.`;
  } else if (isOpposite) {
    score = 92;
    attackName = 'Danza de Eclipse Solar y Lunar';
    synergyDesc = 'Opuestos complementarios: fusión perfecta de polaridades.';
  } else {
    score = 80;
    attackName = 'Conjunción Celestial';
    synergyDesc = 'Sinergia elemental equilibrada.';
  }

  return { score, attackName, synergyDesc };
}
