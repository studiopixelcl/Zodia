/**
 * CHRONICLES OF THE ZODIA - RPG ENGINE
 * Motor de simulación de combate por turnos, cálculo de estadísticas totales,
 * modificadores elementales, sinastría de combate e inteligencia artificial.
 */

import { ELEMENTAL_AFFINITIES, ZODIAC_HERO_CLASSES } from './rpg-data';
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
 * Calcula las estadísticas efectivas del héroe sumando nivel y equipamiento
 */
export function calculateHeroTotalStats(hero) {
  const base = hero.stats || ZODIAC_HERO_CLASSES[hero.sign]?.baseStats || { hp: 400, atk: 50, def: 25, spd: 30, critRate: 0.15 };
  const level = hero.level || 1;
  const levelBonus = (level - 1) * 0.08; // 8% por nivel

  let maxHp = Math.round(base.hp * (1 + levelBonus));
  let atk = Math.round(base.atk * (1 + levelBonus));
  let def = Math.round(base.def * (1 + levelBonus));
  let spd = Math.round(base.spd * (1 + levelBonus * 0.5));
  let critRate = base.critRate || 0.15;

  // Añadir bonos de equipamiento
  const eq = hero.equipped || {};
  if (eq.weapon) {
    if (eq.weapon.atk) atk += eq.weapon.atk;
    if (eq.weapon.crit) critRate += eq.weapon.crit;
  }
  if (eq.armor) {
    if (eq.armor.hp) maxHp += eq.armor.hp;
    if (eq.armor.def) def += eq.armor.def;
  }
  if (eq.relic) {
    if (eq.relic.atk) atk += eq.relic.atk;
    if (eq.relic.def) def += eq.relic.def;
    if (eq.relic.hp) maxHp += eq.relic.hp;
    if (eq.relic.spd) spd += eq.relic.spd;
    if (eq.relic.crit) critRate += eq.relic.crit;
  }

  return { maxHp, atk, def, spd, critRate: Math.min(0.75, critRate) };
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
 * Calcula el daño de una habilidad o ataque considerando ventajas y tránsitos
 */
export function calculateDamage(attacker, defender, skillMultiplier = 1.0, isCritForced = false, transitElement = null) {
  const atk = attacker.atk || 50;
  const def = defender.def || 25;
  const attackerElem = attacker.element;
  const defenderElem = defender.element;

  const { multiplier: elemMult, status: elemStatus } = getElementalMultiplier(attackerElem, defenderElem);

  // Bono de tránsito lunar (+15% si coincide el elemento)
  const transitMult = (transitElement && attackerElem === transitElement) ? 1.15 : 1.0;

  // Fórmula de mitigación de daño clásica Zodia
  // Daño Base = (ATK * 1.5 - DEF * 0.45) * skillMultiplier
  const rawDamage = Math.max(15, (atk * 1.4 - def * 0.45) * skillMultiplier);

  // Tirada de crítico
  const critRoll = Math.random();
  const critRate = attacker.critRate || 0.15;
  const isCrit = isCritForced || critRoll < critRate;
  const critMult = isCrit ? 1.65 : 1.0;

  // Variación aleatoria (±8%)
  const variance = 0.92 + Math.random() * 0.16;

  const finalDamage = Math.max(10, Math.round(rawDamage * elemMult * transitMult * critMult * variance));

  return {
    damage: finalDamage,
    isCrit,
    elemStatus,
    hasTransitBoost: transitElement && attackerElem === transitElement,
    isSuperEffective: elemStatus === 'super_effective',
    isResisted: elemStatus === 'resisted'
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
    } else if (eff.type === 'regen') {
      const heal = eff.value || 30;
      hpChange += heal;
      logMessages.push(`✨ Las mareas astrales restauran +${heal} de vida.`);
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
