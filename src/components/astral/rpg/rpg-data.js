/**
 * CHRONICLES OF THE ZODIA - RPG DATA ENGINE
 * Definiciones de signos, habilidades cósmicas, afinidades elementales,
 * catálogo de equipamiento cósmico y jefes de las 12 Casas Astrales.
 */

export const ELEMENTAL_AFFINITIES = {
  Fuego: {
    color: '#f97316',
    border: 'border-orange-500',
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    aura: 'shadow-[0_0_25px_rgba(249,115,22,0.6)]',
    strongAgainst: 'Tierra',
    weakAgainst: 'Agua',
    lore: 'Llama inextinguible, ímpetu marcial y poder destructivo.'
  },
  Tierra: {
    color: '#10b981',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    aura: 'shadow-[0_0_25px_rgba(16,185,129,0.6)]',
    strongAgainst: 'Aire',
    weakAgainst: 'Fuego',
    lore: 'Solidez inquebrantable, raíces profundas y baluarte telúrico.'
  },
  Aire: {
    color: '#06b6d4',
    border: 'border-cyan-400',
    bg: 'bg-cyan-400/20',
    text: 'text-cyan-300',
    aura: 'shadow-[0_0_25px_rgba(6,182,212,0.6)]',
    strongAgainst: 'Agua',
    weakAgainst: 'Tierra',
    lore: 'Velocidad de rayo, intelecto etéreo y danza evasiva.'
  },
  Agua: {
    color: '#3b82f6',
    border: 'border-blue-500',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    aura: 'shadow-[0_0_25px_rgba(59,130,246,0.6)]',
    strongAgainst: 'Fuego',
    weakAgainst: 'Aire',
    lore: 'Corrientes abisales, sanación infinita y sabiduría del inconsciente.'
  }
};

export const ZODIAC_HERO_CLASSES = {
  // FUEGO
  Aries: {
    sign: 'Aries',
    symbol: '♈',
    element: 'Fuego',
    title: 'Heraldo de Marte',
    role: 'Asesino Crítico',
    baseStats: { hp: 420, atk: 65, def: 25, spd: 38, critRate: 0.25 },
    basicAttack: { name: 'Corte Ígneo', desc: 'Golpe veloz envuelto en llamas celestiales.', etherGain: 1 },
    skill: {
      name: 'Embestida de Marte',
      etherCost: 2,
      desc: 'Embiste ignorando el 40% de la defensa enemiga e inflige Quemadura.',
      multiplier: 1.6,
      effect: { type: 'burn', turns: 2, dot: 18 }
    },
    ultimate: {
      name: 'Supernova de Aries',
      desc: 'Desata el fuego primordial de la primera constelación con 100% de golpe crítico.',
      multiplier: 2.5
    }
  },
  Leo: {
    sign: 'Leo',
    symbol: '♌',
    element: 'Fuego',
    title: 'Monarca Solar',
    role: 'Luchador / Buff',
    baseStats: { hp: 460, atk: 58, def: 30, spd: 32, critRate: 0.18 },
    basicAttack: { name: 'Zarpazo de Oro', desc: 'Corte desgarrador que deslumbra al rival.', etherGain: 1 },
    skill: {
      name: 'Rugido Solar',
      etherCost: 2,
      desc: 'Ruge con la fuerza de una corona solar, dañando y aumentando el ATK propio un 25%.',
      multiplier: 1.4,
      effect: { type: 'buff_atk', turns: 2, value: 1.25 }
    },
    ultimate: {
      name: 'Fulgor del Rey Helios',
      desc: 'Canaliza el núcleo solar provocando una deflagración cósmica masiva.',
      multiplier: 2.6
    }
  },
  Sagitario: {
    sign: 'Sagitario',
    symbol: '♐',
    element: 'Fuego',
    title: 'Arquero del Firmamento',
    role: 'Francotirador Astral',
    baseStats: { hp: 400, atk: 70, def: 22, spd: 42, critRate: 0.30 },
    basicAttack: { name: 'Flecha de Cometa', desc: 'Proyectil de polvo cósmico a distancia.', etherGain: 1 },
    skill: {
      name: 'Disparo de Júpiter',
      etherCost: 2,
      desc: 'Disparo perforante de alta precisión con probabilidad elevada de crítico brutal.',
      multiplier: 1.7,
      critBonus: 0.35
    },
    ultimate: {
      name: 'Lluvia de Meteoros Zenit',
      desc: 'Lanza una andanada de flechas estelares que caen como meteoritos.',
      multiplier: 2.7
    }
  },

  // TIERRA
  Tauro: {
    sign: 'Tauro',
    symbol: '♉',
    element: 'Tierra',
    title: 'Coloso de Esmeralda',
    role: 'Tanque Inquebrantable',
    baseStats: { hp: 550, atk: 45, def: 48, spd: 20, critRate: 0.10 },
    basicAttack: { name: 'Cornada Sísmica', desc: 'Golpe pesado que hace temblar la corteza estelar.', etherGain: 1 },
    skill: {
      name: 'Fortaleza de Gaia',
      etherCost: 2,
      desc: 'Alza una muralla de piedra que otorga un escudo absorbe-daño y sana 50 HP.',
      multiplier: 1.1,
      effect: { type: 'shield', turns: 2, value: 120, heal: 50 }
    },
    ultimate: {
      name: 'Cataclismo Telúrico',
      desc: 'Fragmenta el suelo astral aplastando al enemigo con rocas de meteorito.',
      multiplier: 2.2
    }
  },
  Virgo: {
    sign: 'Virgo',
    symbol: '♍',
    element: 'Tierra',
    title: 'Códice Sagrado',
    role: 'Estratega / Precisión',
    baseStats: { hp: 440, atk: 52, def: 35, spd: 35, critRate: 0.20 },
    basicAttack: { name: 'Juicio Etéreo', desc: 'Punta de lanza de cuarzo tallada con runas.', etherGain: 1 },
    skill: {
      name: 'Cálculo de Mercurio',
      etherCost: 2,
      desc: 'Analiza la debilidad del rival: reduce su defensa un 30% y asesta un golpe certero.',
      multiplier: 1.35,
      effect: { type: 'debuff_def', turns: 2, value: 0.7 }
    },
    ultimate: {
      name: 'Orden del Prisma Astral',
      desc: 'Sella al rival en una geometría perfecta que purifica y pulveriza.',
      multiplier: 2.4
    }
  },
  Capricornio: {
    sign: 'Capricornio',
    symbol: '♑',
    element: 'Tierra',
    title: 'Guardián del Cronos',
    role: 'Paladín / Castigo',
    baseStats: { hp: 500, atk: 50, def: 42, spd: 25, critRate: 0.12 },
    basicAttack: { name: 'Maza de Obsidiana', desc: 'Impacto contundente con el peso de los eones.', etherGain: 1 },
    skill: {
      name: 'Sentencia de Saturno',
      etherCost: 2,
      desc: 'Golpe pesado que ralentiza al objetivo y absorbe parte del daño como defensa.',
      multiplier: 1.45,
      effect: { type: 'slow_atk', turns: 2 }
    },
    ultimate: {
      name: 'Vórtice del Tiempo Cósmico',
      desc: 'Detiene el tiempo estelar para encestar un golpe demoledor ineludible.',
      multiplier: 2.4
    }
  },

  // AIRE
  Géminis: {
    sign: 'Géminis',
    symbol: '♊',
    element: 'Aire',
    title: 'Doble Espejismo',
    role: 'Bribón Veloz',
    baseStats: { hp: 410, atk: 62, def: 24, spd: 46, critRate: 0.22 },
    basicAttack: { name: 'Daga Céfiro', desc: 'Corte etéreo ultrarrápido.', etherGain: 1 },
    skill: {
      name: 'Danza de Pólux y Cástor',
      etherCost: 2,
      desc: 'Ataca 2 veces consecutivas y aumenta la probabilidad de esquivar el próximo golpe.',
      multiplier: 1.55,
      hits: 2,
      effect: { type: 'evasion', turns: 1 }
    },
    ultimate: {
      name: 'Paradoja de los Gemelos',
      desc: 'Crea múltiples copias de luz estelar atacando desde todos los ángulos del cosmos.',
      multiplier: 2.5
    }
  },
  Libra: {
    sign: 'Libra',
    symbol: '♎',
    element: 'Aire',
    title: 'Juez del Equilibrio',
    role: 'Soporte / Control',
    baseStats: { hp: 430, atk: 54, def: 32, spd: 36, critRate: 0.16 },
    basicAttack: { name: 'Rayo Armónico', desc: 'Ráfaga de viento y luz balanceada.', etherGain: 1 },
    skill: {
      name: 'Balanza del Karma',
      etherCost: 2,
      desc: 'Equilibra las fuerzas: daña al enemigo y cura al usuario por el 50% del daño infligido.',
      multiplier: 1.3,
      effect: { type: 'lifesteal', ratio: 0.5 }
    },
    ultimate: {
      name: 'Sentencia de las Estrellas',
      desc: 'Convoca la balanza universal para castigar el exceso de energía enemiga.',
      multiplier: 2.35
    }
  },
  Acuario: {
    sign: 'Acuario',
    symbol: '♒',
    element: 'Aire',
    title: 'Visionario del Éter',
    role: 'Hechicero / Shock',
    baseStats: { hp: 420, atk: 64, def: 26, spd: 40, critRate: 0.20 },
    basicAttack: { name: 'Pulso Plasma', desc: 'Disparo de energía electromagnética astral.', etherGain: 1 },
    skill: {
      name: 'Ruptura Cuántica',
      etherCost: 2,
      desc: 'Provoca un cortocircuito estelar que inflige daño y tiene probabilidad de aturdir al rival.',
      multiplier: 1.5,
      effect: { type: 'stun', chance: 0.4 }
    },
    ultimate: {
      name: 'Tormenta de Urano',
      desc: 'Invoca un vendaval de iones estelares que borra las defensas contrarias.',
      multiplier: 2.6
    }
  },

  // AGUA
  Cáncer: {
    sign: 'Cáncer',
    symbol: '♋',
    element: 'Agua',
    title: 'Guardián de la Marea',
    role: 'Sanador / Defensor',
    baseStats: { hp: 480, atk: 48, def: 38, spd: 26, critRate: 0.12 },
    basicAttack: { name: 'Espuma Lunar', desc: 'Ola de condensación estelar que golpea al enemigo.', etherGain: 1 },
    skill: {
      name: 'Manto de Selene',
      etherCost: 2,
      desc: 'Invoca la bendición de la Luna: cura 95 HP y levanta un escudo de agua.',
      multiplier: 1.0,
      effect: { type: 'shield_heal', heal: 95, shield: 70 }
    },
    ultimate: {
      name: 'Tsunami de Luna Llena',
      desc: 'Una marea mística arrolla el campo de batalla restaurando tu alma y aplastando al rival.',
      multiplier: 2.2,
      healSelf: 100
    }
  },
  Escorpio: {
    sign: 'Escorpio',
    symbol: '♏',
    element: 'Agua',
    title: 'Sombra del Abismo',
    role: 'Ejecutor Letal',
    baseStats: { hp: 430, atk: 66, def: 28, spd: 34, critRate: 0.26 },
    basicAttack: { name: 'Veneno Astral', desc: 'Punzón impregnado de fluidos de nebulosa.', etherGain: 1 },
    skill: {
      name: 'Aguijón de Plutón',
      etherCost: 2,
      desc: 'Aplica veneno mortal por 3 turnos. Si el rival tiene menos del 40% de vida, daño x1.8.',
      multiplier: 1.45,
      effect: { type: 'poison', turns: 3, dot: 25 }
    },
    ultimate: {
      name: 'Fauces del Inframundo',
      desc: 'Abre una grieta al vacío estelar devorando la vitalidad del oponente.',
      multiplier: 2.65
    }
  },
  Piscis: {
    sign: 'Piscis',
    symbol: '♓',
    element: 'Agua',
    title: 'Chamán de los Sueños',
    role: 'Místico / Regenerativo',
    baseStats: { hp: 440, atk: 56, def: 30, spd: 32, critRate: 0.18 },
    basicAttack: { name: 'Canto Abisal', desc: 'Melodía acuática resonante que causa daño místico.', etherGain: 1 },
    skill: {
      name: 'Espejismo de Neptuno',
      etherCost: 2,
      desc: 'Inunda la arena: regenera 40 HP por 2 turnos y drena 1 de Éter al oponente.',
      multiplier: 1.25,
      effect: { type: 'drain_ether', regenTurns: 2, regenValue: 40 }
    },
    ultimate: {
      name: 'Océano Cósmico Infinito',
      desc: 'Sumerge la realidad en un mar primordial cósmico que disuelve toda hostilidad.',
      multiplier: 2.4,
      healSelf: 80
    }
  }
};

export const ZODIAC_SKILL_TREES = {
  Aries: [
    {
      id: 'aries_1',
      name: 'Embestida de Marte',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.5,
      iconName: 'Flame',
      type: 'burn',
      desc: 'Embiste con fuego primordial ignorando el 30% de la defensa enemiga e inflige Quemadura.',
      effect: { type: 'burn', turns: 2, dot: 20 }
    },
    {
      id: 'aries_2',
      name: 'Sed de Batalla',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.45,
      iconName: 'Heart',
      type: 'lifesteal',
      desc: 'Corte feroz cargado de sangre astral que absorbe el 35% del daño infligido como vida propia.',
      effect: { type: 'lifesteal', ratio: 0.35 }
    },
    {
      id: 'aries_3',
      name: 'Ignición Espontánea',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.3,
      iconName: 'Zap',
      type: 'buff',
      desc: 'Desata una explosión térmica interior aumentando el ATK un 35% y la Prob. Crítica un 25% por 2 turnos.',
      effect: { type: 'buff_atk_crit', turns: 2, atkMultiplier: 1.35, critBonus: 0.25 }
    },
    {
      id: 'aries_4',
      name: 'Tajo Meteórico',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 2.1,
      iconName: 'Sword',
      type: 'attack',
      desc: 'Desciende como un bólido celeste perforando el 50% de la defensa rival con impacto demoledor.',
      critBonus: 0.35
    },
    {
      id: 'aries_5',
      name: 'Cólera del Heraldo',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.4,
      iconName: 'Sparkles',
      type: 'lifesteal_burn',
      desc: 'Canaliza la ira pura de Marte: daño titánico, 40% de Robo de Vida y Quemadura destructiva por 3 turnos.',
      effect: { type: 'lifesteal_burn', ratio: 0.40, turns: 3, dot: 30 }
    }
  ],

  Tauro: [
    {
      id: 'tauro_1',
      name: 'Fortaleza de Gaia',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.1,
      iconName: 'Shield',
      type: 'shield',
      desc: 'Alza una muralla de roca estelar que otorga un escudo de 130 de absorción y sana 50 HP.',
      effect: { type: 'shield', turns: 2, value: 130, heal: 50 }
    },
    {
      id: 'tauro_2',
      name: 'Pisotón Sísmico',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.45,
      iconName: 'Zap',
      type: 'crowd_control',
      desc: 'Hace temblar la corteza astral causando daño pesado y Aturdiendo al rival durante 1 turno.',
      effect: { type: 'stun', turns: 1 }
    },
    {
      id: 'tauro_3',
      name: 'Piel de Obsidiana',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.2,
      iconName: 'Shield',
      type: 'reflect',
      desc: 'Recubre el cuerpo con magma solidificado: Escudo de 160 y refleja el 35% del daño recibido.',
      effect: { type: 'reflect', turns: 2, shield: 160, ratio: 0.35 }
    },
    {
      id: 'tauro_4',
      name: 'Cornada del Minotauro',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 2.2,
      iconName: 'Sword',
      type: 'attack',
      desc: 'Impacto colosal que convierte la propia Defensa en poder ofensivo adicional aplastante.',
      effect: { type: 'def_scaling', boost: 1.4 }
    },
    {
      id: 'tauro_5',
      name: 'Corazón del Coloso',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 1.6,
      iconName: 'Heart',
      type: 'heal',
      desc: 'Restaura 220 HP, otorga un Escudo impenetrable de 200 y aumenta la DEF propia un 40% por 2 turnos.',
      effect: { type: 'heal_shield_buff', heal: 220, shield: 200, turns: 2, defMultiplier: 1.4 }
    }
  ],

  Geminis: [
    {
      id: 'geminis_1',
      name: 'Ráfaga de Espejos',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.4,
      iconName: 'Wind',
      type: 'drain_ether',
      desc: 'Doble corte eólico que desgasta al oponente y le drena 1 punto de Éter.',
      effect: { type: 'drain_ether', amount: 1 }
    },
    {
      id: 'geminis_2',
      name: 'Clon de Viento',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.3,
      iconName: 'Sparkles',
      type: 'buff',
      desc: 'Crea una ilusión etérea que esquiva el próximo ataque enemigo y aumenta la VEL propia un 40%.',
      effect: { type: 'evasion', turns: 1, spdMultiplier: 1.4 }
    },
    {
      id: 'geminis_3',
      name: 'Vórtice Bipolar',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.65,
      iconName: 'Zap',
      type: 'debuff',
      desc: 'Engaña los sentidos rivales provocando Confusión y Sangrado etéreo continuo por 3 turnos.',
      effect: { type: 'bleed', turns: 3, dot: 24 }
    },
    {
      id: 'geminis_4',
      name: 'Paradoja Gemela',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.9,
      iconName: 'Eye',
      type: 'drain_ether',
      desc: 'Roba 2 de Éter directamente al oponente y lo añade a la reserva del héroe.',
      effect: { type: 'drain_grant_ether', drain: 2, grant: 2 }
    },
    {
      id: 'geminis_5',
      name: 'Danza de los Reflejos',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.3,
      iconName: 'Wind',
      type: 'attack',
      desc: 'Ataque múltiple coordinado por ambos gemelos celestiales con 100% de golpe crítico certero.',
      critBonus: 1.0
    }
  ],

  Cancer: [
    {
      id: 'cancer_1',
      name: 'Marea Protectora',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.2,
      iconName: 'Shield',
      type: 'shield',
      desc: 'Envuelve al héroe en una burbuja abisal que absorbe 140 de daño.',
      effect: { type: 'shield', turns: 2, value: 140 }
    },
    {
      id: 'cancer_2',
      name: 'Manantial de Selene',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.0,
      iconName: 'Heart',
      type: 'heal',
      desc: 'Invocación lunar que sana instantáneamente 170 HP y purifica los efectos negativos.',
      effect: { type: 'heal_cleanse', heal: 170 }
    },
    {
      id: 'cancer_3',
      name: 'Garra Abisal',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.6,
      iconName: 'Droplet',
      type: 'lifesteal',
      desc: 'Ataque submarino que quiebra la armadura rival y absorbe el 45% del daño infligido.',
      effect: { type: 'lifesteal', ratio: 0.45 }
    },
    {
      id: 'cancer_4',
      name: 'Perla del Océano',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.3,
      iconName: 'Sparkles',
      type: 'heal',
      desc: 'Escudo de perla de 180 HP y regeneración continua de 60 HP por turno durante 2 turnos.',
      effect: { type: 'shield_regen', shield: 180, regenTurns: 2, regenValue: 60 }
    },
    {
      id: 'cancer_5',
      name: 'Tsunami de la Luna Oculta',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.3,
      iconName: 'Droplet',
      type: 'crowd_control',
      desc: 'Ola cósmica colosal que aturde al rival durante 1 turno y cura al héroe 180 HP.',
      effect: { type: 'stun_heal', turns: 1, heal: 180 }
    }
  ],

  Leo: [
    {
      id: 'leo_1',
      name: 'Rugido Solar',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.4,
      iconName: 'Flame',
      type: 'buff',
      desc: 'Ruge con la fuerza de una corona solar, aumentando el ATK propio un 25% por 2 turnos.',
      effect: { type: 'buff_atk', turns: 2, value: 1.25 }
    },
    {
      id: 'leo_2',
      name: 'Fulgor Deslumbrante',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.35,
      iconName: 'Eye',
      type: 'debuff',
      desc: 'Destello cegador que debilita el poder del rival, reduciendo su ATK un 35% por 2 turnos.',
      effect: { type: 'debuff_atk', turns: 2, value: 0.65 }
    },
    {
      id: 'leo_3',
      name: 'Zarpazo de Oro Puro',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.8,
      iconName: 'Sword',
      type: 'burn',
      desc: 'Corte desgarrador que inflige Quemadura solar e incrementa la Prob. Crítica propia.',
      effect: { type: 'burn', turns: 2, dot: 25 },
      critBonus: 0.25
    },
    {
      id: 'leo_4',
      name: 'Corona de Helios',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.6,
      iconName: 'Crown',
      type: 'buff',
      desc: 'Canaliza la realeza solar: Escudo ardiente de 160 y aumento del 40% de ATK.',
      effect: { type: 'shield_buff_atk', shield: 160, turns: 2, atkMultiplier: 1.4 }
    },
    {
      id: 'leo_5',
      name: 'Llama del Rey Absoluto',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.5,
      iconName: 'Flame',
      type: 'attack',
      desc: 'Deflagración estelar devastadora que ignora el 60% de la defensa enemiga.',
      critBonus: 0.35
    }
  ],

  Virgo: [
    {
      id: 'virgo_1',
      name: 'Cálculo de Mercurio',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.35,
      iconName: 'Eye',
      type: 'debuff',
      desc: 'Analiza la debilidad del rival reduciendo su defensa un 30% por 2 turnos.',
      effect: { type: 'debuff_def', turns: 2, value: 0.7 }
    },
    {
      id: 'virgo_2',
      name: 'Elixir de las Estrellas',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.0,
      iconName: 'Heart',
      type: 'heal',
      desc: 'Destila esencias astrales para curar 150 HP y aumentar la DEF un 30%.',
      effect: { type: 'heal_buff_def', heal: 150, turns: 2, defMultiplier: 1.3 }
    },
    {
      id: 'virgo_3',
      name: 'Polvo Purificador',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.5,
      iconName: 'Sparkles',
      type: 'crowd_control',
      desc: 'Silencia las habilidades rivales durante 1 turno y le inflige Toxicidad leve.',
      effect: { type: 'silence_poison', turns: 1, dot: 20 }
    },
    {
      id: 'virgo_4',
      name: 'Geometría Sagrada',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 2.0,
      iconName: 'Shield',
      type: 'heal',
      desc: 'Encierra al rival en un prisma que ignora defensas y regenera 100 HP al héroe.',
      effect: { type: 'heal', value: 100 }
    },
    {
      id: 'virgo_5',
      name: 'Perfección Alquímica',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.3,
      iconName: 'Sparkles',
      type: 'crowd_control',
      desc: 'Purificación total: sana 200 HP, otorga 2 de Éter y Aturde al enemigo por 1 turno.',
      effect: { type: 'stun_heal_ether', turns: 1, heal: 200, grantEther: 2 }
    }
  ],

  Libra: [
    {
      id: 'libra_1',
      name: 'Brisa Equinoccial',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.3,
      iconName: 'Wind',
      type: 'buff',
      desc: 'Viento armónico que daña y aumenta la Velocidad propia un 35% por 2 turnos.',
      effect: { type: 'buff_spd', turns: 2, value: 1.35 }
    },
    {
      id: 'libra_2',
      name: 'Balanza del Karma',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.4,
      iconName: 'Heart',
      type: 'heal',
      desc: 'Equilibra la contienda: si el héroe tiene menos vida que el rival, restaura hasta 180 HP.',
      effect: { type: 'karma_heal', maxHeal: 180 }
    },
    {
      id: 'libra_3',
      name: 'Sentencia Imparcial',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.7,
      iconName: 'Sword',
      type: 'debuff',
      desc: 'Golpe de justicia cósmica que drena 1 de Éter y reduce el ATK del rival un 30%.',
      effect: { type: 'drain_debuff_atk', amount: 1, turns: 2, atkPenalty: 0.7 }
    },
    {
      id: 'libra_4',
      name: 'Velo de la Armonía',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.5,
      iconName: 'Shield',
      type: 'shield',
      desc: 'Escudo de 180 HP y aumento del 30% en la Probabilidad Crítica por 2 turnos.',
      effect: { type: 'shield_crit', shield: 180, turns: 2, critBonus: 0.3 }
    },
    {
      id: 'libra_5',
      name: 'Juicio de los Dos Platillos',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.4,
      iconName: 'Sparkles',
      type: 'reflect',
      desc: 'Daño masivo balanceado, refleja el 40% del daño recibido y Aturde al rival por 1 turno.',
      effect: { type: 'stun_reflect', turns: 1, ratio: 0.4 }
    }
  ],

  Escorpio: [
    {
      id: 'escorpio_1',
      name: 'Aguijón Venenoso',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.4,
      iconName: 'Skull',
      type: 'poison',
      desc: 'Inyecta veneno de asteroides causando daño continuo corrosivo que ignora defensa por 3 turnos.',
      effect: { type: 'poison', turns: 3, dot: 25 }
    },
    {
      id: 'escorpio_2',
      name: 'Drenaje de Sangre Astral',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.5,
      iconName: 'Heart',
      type: 'lifesteal',
      desc: 'Robo de Vida vampírico: absorbe el 50% de todo el daño infligido y cura al héroe.',
      effect: { type: 'lifesteal', ratio: 0.50 }
    },
    {
      id: 'escorpio_3',
      name: 'Neurotoxina Plutónica',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.6,
      iconName: 'Skull',
      type: 'crowd_control',
      desc: 'Veneno letal acumulativo que además reduce la Velocidad rival un 45% por 2 turnos.',
      effect: { type: 'poison_slow', turns: 2, dot: 28, spdPenalty: 0.55 }
    },
    {
      id: 'escorpio_4',
      name: 'Metamorfosis Sombría',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.9,
      iconName: 'Eye',
      type: 'lifesteal',
      desc: 'Poder plutónico absoluto: 60% de Robo de Vida y aumenta el ATK un 35% por 2 turnos.',
      effect: { type: 'lifesteal_buff', ratio: 0.60, turns: 2, atkMultiplier: 1.35 }
    },
    {
      id: 'escorpio_5',
      name: 'Cataclismo de Veneno',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.5,
      iconName: 'Skull',
      type: 'poison',
      desc: 'Detona todo el veneno latente causando daño crítico letal y drenando 2 de Éter al oponente.',
      effect: { type: 'poison_burst', drainEther: 2 }
    }
  ],

  Sagitario: [
    {
      id: 'sagitario_1',
      name: 'Disparo de Júpiter',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.6,
      iconName: 'Sword',
      type: 'attack',
      desc: 'Disparo perforante de alta precisión con +35% de probabilidad crítica.',
      critBonus: 0.35
    },
    {
      id: 'sagitario_2',
      name: 'Flecha Rastreadora',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.3,
      iconName: 'Eye',
      type: 'buff',
      desc: 'Aumenta la VEL un 40% y asegura que el próximo ataque sea un impacto crítico garantizado.',
      effect: { type: 'guaranteed_crit', turns: 1, spdMultiplier: 1.4 }
    },
    {
      id: 'sagitario_3',
      name: 'Lluvia Incendiaria',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.7,
      iconName: 'Flame',
      type: 'burn',
      desc: 'Flechas de fuego que prenden la arena causando Quemadura continua por 3 turnos.',
      effect: { type: 'burn', turns: 3, dot: 25 }
    },
    {
      id: 'sagitario_4',
      name: 'Flecha de Orión Perforante',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 2.2,
      iconName: 'Zap',
      type: 'attack',
      desc: 'Lanza celestial que desgarra el éter ignorando el 60% de la defensa enemiga.',
      critBonus: 0.40
    },
    {
      id: 'sagitario_5',
      name: 'Cénit del Arquero Supremo',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.6,
      iconName: 'Star',
      type: 'attack',
      desc: 'Disparo mítico con 100% de golpe crítico que genera 2 de Éter inmediatamente.',
      critBonus: 1.0,
      effect: { type: 'grant_ether', amount: 2 }
    }
  ],

  Capricornio: [
    {
      id: 'capricornio_1',
      name: 'Sentencia de Saturno',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.45,
      iconName: 'Shield',
      type: 'debuff',
      desc: 'Golpe pesado que ralentiza al objetivo y aumenta la DEF propia un 25% por 2 turnos.',
      effect: { type: 'slow_buff_def', turns: 2, spdPenalty: 0.7, defMultiplier: 1.25 }
    },
    {
      id: 'capricornio_2',
      name: 'Reloj del Tiempo Cósmico',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.25,
      iconName: 'Zap',
      type: 'drain_ether',
      desc: 'Manipula las líneas temporales: drena 2 de Éter al oponente y otorga 1 Éter al héroe.',
      effect: { type: 'drain_grant_ether', drain: 2, grant: 1 }
    },
    {
      id: 'capricornio_3',
      name: 'Aplastamiento de Gravedad',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.7,
      iconName: 'Shield',
      type: 'shield',
      desc: 'Aumenta la gravedad aplastando al enemigo: reduce su ATK un 35% y otorga Escudo de 150 HP.',
      effect: { type: 'debuff_atk_shield', turns: 2, atkPenalty: 0.65, shield: 150 }
    },
    {
      id: 'capricornio_4',
      name: 'Baluarte del Cronos',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.5,
      iconName: 'Crown',
      type: 'reflect',
      desc: 'Escudo colosal de 250 HP que refleja el 40% de todo el daño físico recibido.',
      effect: { type: 'reflect', turns: 2, shield: 250, ratio: 0.40 }
    },
    {
      id: 'capricornio_5',
      name: 'Sello Temporal Eterno',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.3,
      iconName: 'Zap',
      type: 'crowd_control',
      desc: 'Detiene el tiempo estelar: congela/aturde al rival por 1 turno y asesta daño contundente.',
      effect: { type: 'stun', turns: 1 }
    }
  ],

  Acuario: [
    {
      id: 'acuario_1',
      name: 'Onda Mental Cuántica',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.35,
      iconName: 'Zap',
      type: 'drain_ether',
      desc: 'Pulso psíquico de aire que drena 1 punto de Éter al rival y le causa daño etéreo.',
      effect: { type: 'drain_ether', amount: 1 }
    },
    {
      id: 'acuario_2',
      name: 'Vórtice Criogénico',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.4,
      iconName: 'Wind',
      type: 'crowd_control',
      desc: 'Desata una tormenta de hielo cósmico que Congela / Aturde al rival por 1 turno.',
      effect: { type: 'stun', turns: 1 }
    },
    {
      id: 'acuario_3',
      name: 'Tormenta Galvánica',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.7,
      iconName: 'Zap',
      type: 'debuff',
      desc: 'Rayo en cadena que reduce la defensa rival un 35% y genera 1 de Éter.',
      effect: { type: 'debuff_def_grant_ether', turns: 2, defPenalty: 0.65, grantEther: 1 }
    },
    {
      id: 'acuario_4',
      name: 'Cero Absoluto',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 2.0,
      iconName: 'Droplet',
      type: 'crowd_control',
      desc: 'Congela el flujo de éter enemigo impidiendo el uso de habilidades y sana 130 HP.',
      effect: { type: 'silence_heal', turns: 2, heal: 130 }
    },
    {
      id: 'acuario_5',
      name: 'Singularidad Futurista',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.5,
      iconName: 'Star',
      type: 'attack',
      desc: 'Crea un agujero negro en miniatura que absorbe todo el éter del oponente y causa daño masivo.',
      effect: { type: 'drain_ether', amount: 3 }
    }
  ],

  Piscis: [
    {
      id: 'piscis_1',
      name: 'Espejismo de Neptuno',
      requiredLevel: 1,
      etherCost: 2,
      multiplier: 1.25,
      iconName: 'Droplet',
      type: 'heal',
      desc: 'Regenera 50 HP por turno durante 2 turnos y drena 1 de Éter al rival.',
      effect: { type: 'regen_drain_ether', regenTurns: 2, regenValue: 50, drain: 1 }
    },
    {
      id: 'piscis_2',
      name: 'Canto de Sirena Onírico',
      requiredLevel: 4,
      etherCost: 2,
      multiplier: 1.3,
      iconName: 'Heart',
      type: 'crowd_control',
      desc: 'Melodía celestial que Confunde al oponente haciéndole fallar su próximo ataque.',
      effect: { type: 'evasion', turns: 1 }
    },
    {
      id: 'piscis_3',
      name: 'Marea Sanadora Primordial',
      requiredLevel: 8,
      etherCost: 2,
      multiplier: 1.1,
      iconName: 'Heart',
      type: 'heal',
      desc: 'Oleada sanadora que restaura 200 HP y otorga un Escudo de agua de 110 HP.',
      effect: { type: 'heal_shield', heal: 200, shield: 110 }
    },
    {
      id: 'piscis_4',
      name: 'Sueño Profundo Abisal',
      requiredLevel: 12,
      etherCost: 3,
      multiplier: 1.7,
      iconName: 'Moon',
      type: 'crowd_control',
      desc: 'Sumerge al rival en un trance de sueño profundo por 1 turno completo y restaura 100 HP.',
      effect: { type: 'stun_heal', turns: 1, heal: 100 }
    },
    {
      id: 'piscis_5',
      name: 'Océano Cósmico Infinito',
      requiredLevel: 16,
      etherCost: 3,
      multiplier: 2.4,
      iconName: 'Droplet',
      type: 'heal',
      desc: 'Sumerge el plano en aguas primordiales: sana 230 HP y otorga 2 de Éter al héroe.',
      effect: { type: 'heal_ether', heal: 230, grantEther: 2 }
    }
  ]
};

export function getHeroSkillTree(sign = 'Aries') {
  return ZODIAC_SKILL_TREES[sign] || ZODIAC_SKILL_TREES['Aries'];
}

export function getEquippedSkills(hero) {
  if (!hero) return [];
  const tree = getHeroSkillTree(hero.sign);
  const heroLevel = hero.level || 1;

  // Si el héroe ya tiene equippedSkills válidas en su perfil, resolverlas
  if (Array.isArray(hero.equippedSkills) && hero.equippedSkills.length > 0) {
    const skills = hero.equippedSkills
      .map(id => tree.find(s => s.id === id))
      .filter(Boolean)
      .filter(s => heroLevel >= s.requiredLevel);
    if (skills.length > 0) return skills;
  }

  // Si no tiene o son inválidas, equipar por defecto las habilidades desbloqueadas por nivel (hasta 2)
  const unlocked = tree.filter(s => heroLevel >= s.requiredLevel);
  return unlocked.slice(0, 2);
}

export const RARITIES = {
  comun: { name: 'Común', color: 'text-gray-300', border: 'border-white/20', bg: 'bg-white/5' },
  raro: { name: 'Raro', color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
  epico: { name: 'Épico', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  legendario: { name: 'Legendario Cósmico', color: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-500/20' }
};

export const EQUIPMENT_SETS = {
  set_starlight: {
    id: 'set_starlight',
    name: 'Baluarte Sideral',
    rarity: 'comun',
    element: 'Aire',
    badge: '✨ Sideral',
    color: 'text-gray-300',
    borderColor: 'border-white/30',
    bgBadge: 'bg-white/10 text-gray-200',
    iconName: 'Sparkles',
    lore: 'Forjado con fragmentos de meteoros y vientos del alba cósmica.',
    pieces: ['wp_01', 'ar_01', 'rl_01'],
    bonuses: [
      {
        requiredPieces: 2,
        title: 'Eco del Polvo (2 Piezas)',
        desc: '+35 HP, +10 DEF',
        stats: { hp: 35, def: 10 }
      },
      {
        requiredPieces: 3,
        title: 'Frecuencia Astral Completa (3 Piezas)',
        desc: '+15 ATK, +6 VEL, +3% Crítico',
        stats: { atk: 15, spd: 6, critRate: 0.03 }
      }
    ]
  },
  set_lunar: {
    id: 'set_lunar',
    name: 'Pléyades & Marea Lunar',
    rarity: 'raro',
    element: 'Agua',
    badge: '🌙 Pléyades',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgBadge: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    iconName: 'Moon',
    lore: 'Canaliza la serenidad de la Luna y las mareas azules de siete hermanas.',
    pieces: ['wp_02', 'ar_02', 'rl_02'],
    bonuses: [
      {
        requiredPieces: 2,
        title: 'Marea de Selene (2 Piezas)',
        desc: '+25 ATK, +60 HP',
        stats: { atk: 25, hp: 60 }
      },
      {
        requiredPieces: 3,
        title: 'Corona de las Pléyades (3 Piezas)',
        desc: '+35 ATK, +8 VEL, +7% Crítico',
        stats: { atk: 35, spd: 8, critRate: 0.07 }
      }
    ]
  },
  set_solar: {
    id: 'set_solar',
    name: 'Llama Solar de los Titanes',
    rarity: 'epico',
    element: 'Fuego',
    badge: '🔥 Titán Solar',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgBadge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    iconName: 'Sun',
    lore: 'Templado en el corazón incandescente de asteroides con la furia telúrica.',
    pieces: ['wp_03', 'ar_03', 'rl_03'],
    bonuses: [
      {
        requiredPieces: 2,
        title: 'Ira del Núcleo Solar (2 Piezas)',
        desc: '+45 ATK, +30 DEF, +120 HP',
        stats: { atk: 45, def: 30, hp: 120 }
      },
      {
        requiredPieces: 3,
        title: 'Corona de Titanio Cósmico (3 Piezas)',
        desc: '+70 ATK, +40 DEF, +12% Crítico',
        stats: { atk: 70, def: 40, critRate: 0.12 }
      }
    ]
  },
  set_cosmic: {
    id: 'set_cosmic',
    name: 'Soberanía de Orión & Casiopea',
    rarity: 'legendario',
    element: 'Tierra',
    badge: '👑 Soberanía Cósmica',
    color: 'text-amber-400',
    borderColor: 'border-amber-400/50',
    bgBadge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20',
    iconName: 'Crown',
    lore: 'El conjunto definitivo de los soberanos del firmamento; desgasta y quiebra el éter con su presencia.',
    pieces: ['wp_04', 'ar_04', 'rl_04'],
    bonuses: [
      {
        requiredPieces: 2,
        title: 'Mirada del Cazador Supremo (2 Piezas)',
        desc: '+90 ATK, +250 HP, +10% Crítico',
        stats: { atk: 90, hp: 250, critRate: 0.10 }
      },
      {
        requiredPieces: 3,
        title: 'Majestad Eterna del Zodíaco (3 Piezas)',
        desc: '+150 ATK, +60 DEF, +400 HP, +15 VEL, +18% Crítico',
        stats: { atk: 150, def: 60, hp: 400, spd: 15, critRate: 0.18 }
      }
    ]
  }
};

export function calculateItemPower(item) {
  if (!item) return 0;
  const atk = (item.atk || 0) * 3;
  const hp = Math.round((item.hp || 0) * 0.8);
  const def = (item.def || 0) * 2.5;
  const spd = (item.spd || 0) * 2;
  const crit = Math.round((item.crit || 0) * 300);
  return atk + hp + def + spd + crit;
}

export function calculateActiveSets(equipped = {}) {
  const activeSets = [];
  if (!equipped) return activeSets;
  const equippedList = Object.values(equipped).filter(Boolean);
  if (equippedList.length === 0) return activeSets;

  const setCounts = {};
  for (const item of equippedList) {
    if (!item) continue;
    const resolvedSetId = item.setId || (item.id ? EQUIPMENT_CATALOG.find(c => item.id.startsWith(c.id))?.setId : null);
    if (resolvedSetId) {
      setCounts[resolvedSetId] = (setCounts[resolvedSetId] || 0) + 1;
    }
  }

  for (const [setId, count] of Object.entries(setCounts)) {
    const setDef = EQUIPMENT_SETS[setId];
    if (!setDef) continue;

    const unlockedBonuses = setDef.bonuses.filter(b => count >= b.requiredPieces);
    
    const totalBonusStats = { hp: 0, atk: 0, def: 0, spd: 0, critRate: 0 };
    for (const b of unlockedBonuses) {
      if (b.stats.hp) totalBonusStats.hp += b.stats.hp;
      if (b.stats.atk) totalBonusStats.atk += b.stats.atk;
      if (b.stats.def) totalBonusStats.def += b.stats.def;
      if (b.stats.spd) totalBonusStats.spd += b.stats.spd;
      if (b.stats.critRate) totalBonusStats.critRate += b.stats.critRate;
    }

    activeSets.push({
      setId,
      set: setDef,
      count,
      maxPieces: 3,
      isFullyActive: count >= 3,
      hasAnyBonus: unlockedBonuses.length > 0,
      unlockedBonuses,
      nextBonus: setDef.bonuses.find(b => count < b.requiredPieces) || null,
      bonusStats: totalBonusStats
    });
  }

  return activeSets;
}

export const EQUIPMENT_CATALOG = [
  // ARMAS
  { id: 'wp_01', type: 'weapon', setId: 'set_starlight', name: 'Daga de Polvo Estelar', rarity: 'comun', atk: 12, crit: 0.03, desc: 'Forjada con remanentes de meteorito menor.' },
  { id: 'wp_02', type: 'weapon', setId: 'set_lunar', name: 'Báculo de las Pléyades', rarity: 'raro', atk: 25, crit: 0.06, desc: 'Canaliza la luz azul de siete estrellas hermanas.' },
  { id: 'wp_03', type: 'weapon', setId: 'set_solar', name: 'Espada de Nebulosa Solar', rarity: 'epico', atk: 45, crit: 0.10, desc: 'Emite calor puro de una supernova en nacimiento.' },
  { id: 'wp_04', type: 'weapon', setId: 'set_cosmic', name: 'Arco Cósmico de Orión', rarity: 'legendario', atk: 75, crit: 0.18, desc: 'El arma mítica de los cazadores celestiales. Desgarra el éter.' },

  // ARMADURAS
  { id: 'ar_01', type: 'armor', setId: 'set_starlight', name: 'Manto de Seda Astral', rarity: 'comun', hp: 40, def: 8, desc: 'Tejido suave bendecido por la brisa cósmica.' },
  { id: 'ar_02', type: 'armor', setId: 'set_lunar', name: 'Pechera de Roca Lunar', rarity: 'raro', hp: 90, def: 18, desc: 'Piedra basáltica extraída de la cara oculta de la Luna.' },
  { id: 'ar_03', type: 'armor', setId: 'set_solar', name: 'Coraza del Coloso Tauro', rarity: 'epico', hp: 170, def: 35, desc: 'Forjada en el corazón de un asteroide de hierro.' },
  { id: 'ar_04', type: 'armor', setId: 'set_cosmic', name: 'Armadura Sagrada de Casiopea', rarity: 'legendario', hp: 300, def: 55, desc: 'Brilla con la soberanía intocable de la reina estelar.' },

  // RELIQUIAS
  { id: 'rl_01', type: 'relic', setId: 'set_starlight', name: 'Fragmento de Cuarzo Místico', rarity: 'comun', hp: 25, spd: 4, desc: 'Pulso suave que afina los sentidos astrales.' },
  { id: 'rl_02', type: 'relic', setId: 'set_lunar', name: 'Lágrima Congelada de Neptuno', rarity: 'raro', spd: 10, crit: 0.05, desc: 'Permite deslizarse entre las corrientes temporales.' },
  { id: 'rl_03', type: 'relic', setId: 'set_solar', name: 'Anillo de los Anillos de Saturno', rarity: 'epico', def: 20, spd: 12, desc: 'Manipula la gravedad alrededor de su portador.' },
  { id: 'rl_04', type: 'relic', setId: 'set_cosmic', name: 'Ojo Omnisciente de Ra', rarity: 'legendario', atk: 35, crit: 0.12, hp: 120, desc: 'Otorga la clarividencia de los antiguos dioses solares.' }
];

export const TWELVE_HOUSES_STAGES = [
  {
    house: 1,
    name: 'Casa I: Templo del Nacimiento',
    guardianSign: 'Aries',
    guardianName: 'Sombra del Carnero Ígneo',
    hp: 820,
    atk: 52,
    def: 25,
    spd: 32,
    element: 'Fuego',
    rewardExp: 100,
    rewardGold: 120,
    dropChance: 'wp_01'
  },
  {
    house: 2,
    name: 'Casa II: Bóveda de la Abundancia',
    guardianSign: 'Tauro',
    guardianName: 'Centinela Telúrico de Tauro',
    hp: 1050,
    atk: 48,
    def: 40,
    spd: 22,
    element: 'Tierra',
    rewardExp: 160,
    rewardGold: 180,
    dropChance: 'ar_01'
  },
  {
    house: 3,
    name: 'Casa III: Salón de los Ecos',
    guardianSign: 'Géminis',
    guardianName: 'Gemelos Espectrales del Viento',
    hp: 980,
    atk: 62,
    def: 28,
    spd: 45,
    element: 'Aire',
    rewardExp: 220,
    rewardGold: 240,
    dropChance: 'rl_01'
  },
  {
    house: 4,
    name: 'Casa IV: El Santuario Inconsciente',
    guardianSign: 'Cáncer',
    guardianName: 'Leviatán de la Marea Oculta',
    hp: 1250,
    atk: 56,
    def: 36,
    spd: 28,
    element: 'Agua',
    rewardExp: 300,
    rewardGold: 320,
    dropChance: 'wp_02'
  },
  {
    house: 5,
    name: 'Casa V: El Trono Solar',
    guardianSign: 'Leo',
    guardianName: 'Gran Monarca de la Llama Viva',
    hp: 1480,
    atk: 74,
    def: 35,
    spd: 35,
    element: 'Fuego',
    rewardExp: 420,
    rewardGold: 450,
    dropChance: 'ar_02'
  },
  {
    house: 6,
    name: 'Casa VI: El Laboratorio Alquímico',
    guardianSign: 'Virgo',
    guardianName: 'Oráculo Mecánico del Firmamento',
    hp: 1420,
    atk: 70,
    def: 42,
    spd: 38,
    element: 'Tierra',
    rewardExp: 550,
    rewardGold: 600,
    dropChance: 'rl_02'
  },
  {
    house: 7,
    name: 'Casa VII: El Espejo del Destino',
    guardianSign: 'Libra',
    guardianName: 'Juez Celestial de los Dos Platillos',
    hp: 1650,
    atk: 76,
    def: 40,
    spd: 40,
    element: 'Aire',
    rewardExp: 700,
    rewardGold: 780,
    dropChance: 'wp_03'
  },
  {
    house: 8,
    name: 'Casa VIII: El Pozo de la Metamorfosis',
    guardianSign: 'Escorpio',
    guardianName: 'Devorador del Vacío de Plutón',
    hp: 1850,
    atk: 90,
    def: 38,
    spd: 37,
    element: 'Agua',
    rewardExp: 900,
    rewardGold: 1000,
    dropChance: 'ar_03'
  },
  {
    house: 9,
    name: 'Casa IX: El Obelisco de las Estrellas Lejanas',
    guardianSign: 'Sagitario',
    guardianName: 'Centauro Cometa de Júpiter',
    hp: 2050,
    atk: 98,
    def: 36,
    spd: 48,
    element: 'Fuego',
    rewardExp: 1150,
    rewardGold: 1300,
    dropChance: 'rl_03'
  },
  {
    house: 10,
    name: 'Casa X: La Cúspide del Cenit',
    guardianSign: 'Capricornio',
    guardianName: 'Titán Inmemorial de Saturno',
    hp: 2400,
    atk: 88,
    def: 58,
    spd: 30,
    element: 'Tierra',
    rewardExp: 1450,
    rewardGold: 1600,
    dropChance: 'wp_04'
  },
  {
    house: 11,
    name: 'Casa XI: La Red de las Constelaciones',
    guardianSign: 'Acuario',
    guardianName: 'Conciencia Estelar de Urano',
    hp: 2350,
    atk: 108,
    def: 44,
    spd: 46,
    element: 'Aire',
    rewardExp: 1800,
    rewardGold: 2000,
    dropChance: 'ar_04'
  },
  {
    house: 12,
    name: 'Casa XII: El Océano de la Disolución (BOSS FINAL)',
    guardianSign: 'Piscis',
    guardianName: 'Ofiuco & El Dragón del Éter Infinito',
    hp: 3200,
    atk: 120,
    def: 50,
    spd: 44,
    element: 'Agua',
    rewardExp: 3000,
    rewardGold: 5000,
    dropChance: 'rl_04'
  }
];

const LOCAL_STORAGE_KEY = 'zodia_rpg_hero_v2';
const LEGACY_STORAGE_KEY = 'zodia_rpg_hero_v1';

export const ZODIAC_ICON_SLUGS = {
  Aries: 'aries', Tauro: 'tauro', Géminis: 'gemini', Cáncer: 'cancer',
  Leo: 'leo', Virgo: 'virgo', Libra: 'libra', Escorpio: 'escorpio',
  Sagitario: 'sagitario', Capricornio: 'capricornio', Acuario: 'acuario', Piscis: 'piscis'
};

export function getZodiacIcon(sign) {
  const slug = ZODIAC_ICON_SLUGS[sign] || 'capricornio';
  return `/zodia/assets/zodiac/${slug}.png`;
}

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.length < 5) return false;
  if (clean.startsWith('[') || clean.startsWith('{') || clean === 'null' || clean === 'undefined') return false;
  return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/') || clean.startsWith('data:image');
}

export function extractProfilePhoto(userProfile) {
  if (!userProfile) return null;

  // 1. Validar imagen directa (user_image, image, avatar_url)
  const candidates = [userProfile.user_image, userProfile.image, userProfile.avatar_url];
  for (const cand of candidates) {
    if (isValidImageUrl(cand)) {
      return cand.trim();
    }
  }

  // 2. Validar fotos (array o JSON string)
  let photos = userProfile.photos;
  if (typeof photos === 'string') {
    if (photos.startsWith('[') || photos.startsWith('{')) {
      try {
        photos = JSON.parse(photos);
      } catch {
        photos = null;
      }
    } else if (isValidImageUrl(photos)) {
      return photos.trim();
    } else {
      photos = null;
    }
  }

  if (Array.isArray(photos) && photos.length > 0) {
    for (const p of photos) {
      if (isValidImageUrl(p)) {
        return p.trim();
      }
    }
  }

  return null;
}

/**
 * Carga o inicializa el perfil de RPG del jugador
 */
export function getOrCreateHeroProfile(userProfile) {
  const defaultSign = userProfile?.sign || 'Capricornio';
  const heroClass = ZODIAC_HERO_CLASSES[defaultSign] || ZODIAC_HERO_CLASSES['Aries'];
  const photo = extractProfilePhoto(userProfile);

  if (typeof window === 'undefined') {
    return createInitialHero(userProfile, heroClass);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && (saved.sign === defaultSign || !saved.sign)) {
        saved.sign = defaultSign;
        saved.element = heroClass.element;
        // Sanitizar avatarUrl de forma estricta
        if (!isValidImageUrl(saved.avatarUrl)) {
          saved.avatarUrl = photo;
        } else if (photo && saved.avatarUrl !== photo) {
          saved.avatarUrl = photo;
        }
        if (userProfile?.name && (!saved.name || saved.name === 'Sintonizador Astral')) {
          saved.name = userProfile.name;
        }
        if (!Array.isArray(saved.equippedSkills) || saved.equippedSkills.length === 0) {
          const signTree = ZODIAC_SKILL_TREES[saved.sign] || ZODIAC_SKILL_TREES['Aries'];
          const unlocked = signTree.filter(s => (saved.level || 1) >= s.requiredLevel);
          saved.equippedSkills = unlocked.slice(0, 2).map(s => s.id);
        }
        if (typeof saved.maxTowerFloor !== 'number') {
          saved.maxTowerFloor = 1;
        }
        if (!Array.isArray(saved.eclipseCleared)) {
          saved.eclipseCleared = [];
        }
        if (typeof saved.dailyStreak !== 'number') {
          saved.dailyStreak = 0;
        }
        if (!Array.isArray(saved.dailyQuests)) {
          saved.dailyQuests = [];
        }
        if (typeof saved.dailyMasterChestClaimed !== 'boolean') {
          saved.dailyMasterChestClaimed = false;
        }
        if (typeof saved.pvpPoints !== 'number') {
          saved.pvpPoints = 0;
        }
        if (!saved.pvpRank) {
          saved.pvpRank = 'Polvo Cósmico I';
        }
        saveHeroProfile(saved);
        try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch {}
        return saved;
      }
    }
  } catch (e) {
    console.error('Error cargando perfil RPG:', e);
  }

  const initialHero = createInitialHero(userProfile, heroClass);
  saveHeroProfile(initialHero);
  try { localStorage.removeItem(LEGACY_STORAGE_KEY); } catch {}
  return initialHero;
}

function createInitialHero(userProfile, heroClass) {
  const photo = extractProfilePhoto(userProfile);
  const signTree = ZODIAC_SKILL_TREES[heroClass.sign] || ZODIAC_SKILL_TREES['Aries'];
  const initialSkill = signTree[0]?.id || 'aries_1';
  return {
    name: userProfile?.name || 'Sintonizador Astral',
    sign: heroClass.sign,
    element: heroClass.element,
    level: 1,
    exp: 0,
    expNext: 150,
    polvoEstelar: 100, // Moneda cósmica
    avatarUrl: photo,
    stats: { ...heroClass.baseStats },
    equippedSkills: [initialSkill],
    equipped: {
      weapon: EQUIPMENT_CATALOG.find(i => i.id === 'wp_01'),
      armor: null,
      relic: null
    },
    inventory: [
      EQUIPMENT_CATALOG.find(i => i.id === 'ar_01'),
      EQUIPMENT_CATALOG.find(i => i.id === 'rl_01')
    ],
    maxHouseCleared: 0,
    maxTowerFloor: 1,
    eclipseCleared: [],
    pvpRank: 'Polvo Cósmico I',
    pvpPoints: 0,
    potions: 3,
    dailyStreak: 0,
    lastDailyClaimDate: null,
    dailyQuests: [],
    dailyQuestsDate: null,
    dailyMasterChestClaimed: false,
    lastFirstWinDate: null
  };
}

export function saveHeroProfile(hero) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(hero));
  } catch (e) {
    console.error('Error guardando perfil RPG:', e);
  }
}

// ==========================================
// DESAFÍOS 1 VS 2: GEMELOS DEL ECLIPSE
// ==========================================
export const ECLIPSE_TWINS_CHALLENGES = [
  {
    id: 'twin_1',
    title: 'Llamarada Primordial',
    subtitle: 'Furia de Aries & Corona de Leo',
    description: 'Aries presiona con golpes de sangrado y alta velocidad mientras Leo aturde con llamaradas solares. Ambos comparten una gran potencia de Fuego.',
    levelReq: 3,
    rewardExp: 220,
    rewardGold: 260,
    dropChance: 'wp_02',
    enemy1: {
      name: 'Sombra de Aries',
      sign: 'Aries',
      element: 'Fuego',
      hp: 720,
      atk: 58,
      def: 26,
      spd: 45,
      skillName: 'Embate de Fuego',
      role: 'Ofensivo Rápido'
    },
    enemy2: {
      name: 'Sombra de Leo',
      sign: 'Leo',
      element: 'Fuego',
      hp: 660,
      atk: 52,
      def: 30,
      spd: 35,
      skillName: 'Rugido Deslumbrante',
      role: 'Aturdimiento y Escudo'
    }
  },
  {
    id: 'twin_2',
    title: 'Bastión Tectónico',
    subtitle: 'Roca de Tauro & Cima de Capricornio',
    description: 'La muralla indestructible de Tierra. Tauro levanta escudos diamantinos mientras Capricornio desgasta con golpes sísmicos. Recomendado: veneno o penetración.',
    levelReq: 7,
    rewardExp: 380,
    rewardGold: 420,
    dropChance: 'ar_02',
    enemy1: {
      name: 'Sombra de Tauro',
      sign: 'Tauro',
      element: 'Tierra',
      hp: 980,
      atk: 54,
      def: 48,
      spd: 25,
      skillName: 'Escudo Diamantino',
      role: 'Tanque Protector'
    },
    enemy2: {
      name: 'Sombra de Capricornio',
      sign: 'Capricornio',
      element: 'Tierra',
      hp: 920,
      atk: 66,
      def: 42,
      spd: 30,
      skillName: 'Impacto Granítico',
      role: 'Golpeador Físico'
    }
  },
  {
    id: 'twin_3',
    title: 'Velo Venenoso del Espejo',
    subtitle: 'Aguijón de Escorpio & Engaño de Géminis',
    description: 'Un dúo sumamente traicionero. Géminis refleja el daño que recibe mientras Escorpio corrompe tus reservas de vida con veneno y robo vampírico.',
    levelReq: 11,
    rewardExp: 580,
    rewardGold: 620,
    dropChance: 'rl_03',
    enemy1: {
      name: 'Sombra de Escorpio',
      sign: 'Escorpio',
      element: 'Agua',
      hp: 1150,
      atk: 74,
      def: 36,
      spd: 42,
      skillName: 'Picadura Necrótica',
      role: 'Veneno y Drenaje'
    },
    enemy2: {
      name: 'Sombra de Géminis',
      sign: 'Géminis',
      element: 'Aire',
      hp: 1080,
      atk: 68,
      def: 34,
      spd: 52,
      skillName: 'Espejo Ilusorio',
      role: 'Evasión y Reflejo'
    }
  },
  {
    id: 'twin_4',
    title: 'Tormenta del Abismo y Éter',
    subtitle: 'Mareas de Cáncer & Vacío de Acuario',
    description: 'Cáncer sana de forma periódica a ambos guardianes mientras Acuario sabotea tu barra de Éter. Derrota a Cáncer rápido o la batalla será eterna.',
    levelReq: 15,
    rewardExp: 850,
    rewardGold: 900,
    dropChance: 'wp_04',
    enemy1: {
      name: 'Sombra de Cáncer',
      sign: 'Cáncer',
      element: 'Agua',
      hp: 1350,
      atk: 60,
      def: 42,
      spd: 38,
      skillName: 'Marea Restauradora',
      role: 'Sanador de Dúo'
    },
    enemy2: {
      name: 'Sombra de Acuario',
      sign: 'Acuario',
      element: 'Aire',
      hp: 1240,
      atk: 82,
      def: 38,
      spd: 48,
      skillName: 'Prisión de Éter',
      role: 'Drenador de Recursos'
    }
  },
  {
    id: 'twin_5',
    title: 'Sentencia de las Constelaciones',
    subtitle: 'Balanza de Libra & Saeta de Sagitario',
    description: 'El desafío definitivo 1vs2. Libra redistribuye los impactos y purifica a su compañero, mientras Sagitario dispara ráfagas centellantes con probabilidad de crítico letal.',
    levelReq: 19,
    rewardExp: 1300,
    rewardGold: 1400,
    dropChance: 'ar_04',
    enemy1: {
      name: 'Sombra de Libra',
      sign: 'Libra',
      element: 'Aire',
      hp: 1650,
      atk: 78,
      def: 46,
      spd: 44,
      skillName: 'Sentencia Cósmica',
      role: 'Equilibrio y Purificación'
    },
    enemy2: {
      name: 'Sombra de Sagitario',
      sign: 'Sagitario',
      element: 'Fuego',
      hp: 1550,
      atk: 96,
      def: 40,
      spd: 55,
      skillName: 'Flecha del Juicio',
      role: 'Daño Crítico Puro'
    }
  }
];

// ==========================================
// TORRE DEL CAOS ASTRAL (ENDLESS / MUTADORES)
// ==========================================
export const TOWER_MUTATORS = [
  {
    id: 'solar_flare',
    name: 'Llamarada Solar',
    desc: '+25% Daño de Fuego y Luz para todos. Quemaduras causan doble daño.',
    color: '#f59e0b',
    icon: 'Flame'
  },
  {
    id: 'ether_surge',
    name: 'Sobrecarga de Éter',
    desc: 'Ambos bandos generan +1 Éter extra al inicio de turno. Habilidades más frecuentes.',
    color: '#06b6d4',
    icon: 'Zap'
  },
  {
    id: 'lunar_shroud',
    name: 'Manto de Penumbra',
    desc: 'Los escudos y curaciones son un 40% más potentes.',
    color: '#a855f7',
    icon: 'Shield'
  },
  {
    id: 'gravity_well',
    name: 'Pozo Gravitatorio',
    desc: 'La Retaguardia recibe -40% daño. La Vanguardia inflige +30% daño físico.',
    color: '#3b82f6',
    icon: 'Crosshair'
  },
  {
    id: 'blood_eclipse',
    name: 'Eclipse Sangriento',
    desc: 'Todos los ataques físicos aplican una carga de Sangrado por 2 turnos.',
    color: '#ef4444',
    icon: 'Flame'
  }
];

export function generateTowerFloor(floorNumber, heroLevel = 1) {
  const signs = Object.keys(ZODIAC_HERO_CLASSES);
  const mutator = TOWER_MUTATORS[(floorNumber - 1) % TOWER_MUTATORS.length];
  const isDual = floorNumber >= 5 && floorNumber % 5 === 0;

  const sign1 = signs[(floorNumber * 3) % signs.length];
  const class1 = ZODIAC_HERO_CLASSES[sign1];
  const scaling = 1 + (floorNumber - 1) * 0.12;

  const enemy1 = {
    name: isDual ? `Guardián A (${sign1})` : `Guardián del Piso ${floorNumber} (${sign1})`,
    sign: sign1,
    element: class1.element,
    hp: Math.round((class1.baseStats.hp * 1.85 + 100) * scaling),
    atk: Math.round((class1.baseStats.atk + 10) * scaling),
    def: Math.round((class1.baseStats.def + 10) * scaling),
    spd: Math.round(class1.baseStats.spd * (1 + floorNumber * 0.02)),
    role: isDual ? 'Vanguardia Rival' : 'Guardián del Caos'
  };

  let enemy2 = null;
  if (isDual) {
    const sign2 = signs[(floorNumber * 7) % signs.length];
    const class2 = ZODIAC_HERO_CLASSES[sign2];
    enemy2 = {
      name: `Guardián B (${sign2})`,
      sign: sign2,
      element: class2.element,
      hp: Math.round((class2.baseStats.hp * 1.75 + 80) * scaling * 0.88),
      atk: Math.round((class2.baseStats.atk + 8) * scaling * 0.9),
      def: Math.round((class2.baseStats.def + 8) * scaling * 0.88),
      spd: Math.round(class2.baseStats.spd * (1 + floorNumber * 0.02)),
      role: 'Retaguardia Rival'
    };
  }

  return {
    floor: floorNumber,
    isDual,
    mutator,
    enemy1,
    enemy2,
    rewardExp: 90 + floorNumber * 35,
    rewardGold: 110 + floorNumber * 40
  };
}

// ==========================================
// RANGOS Y PROGRESIÓN PVP: COLISEO ASTRAL
// ==========================================
export const PVP_RANKS = [
  { id: 'polvo_1', name: 'Polvo Cósmico I', minPts: 0, maxPts: 99, badgeColor: 'text-gray-400 border-gray-500 bg-gray-500/10', tier: 'Polvo' },
  { id: 'polvo_2', name: 'Polvo Cósmico II', minPts: 100, maxPts: 199, badgeColor: 'text-zinc-300 border-zinc-400 bg-zinc-500/10', tier: 'Polvo' },
  { id: 'bronce_1', name: 'Gladiador de Bronce I', minPts: 200, maxPts: 349, badgeColor: 'text-amber-600 border-amber-600 bg-amber-600/10', tier: 'Bronce' },
  { id: 'bronce_2', name: 'Gladiador de Bronce II', minPts: 350, maxPts: 499, badgeColor: 'text-amber-500 border-amber-500 bg-amber-500/10', tier: 'Bronce' },
  { id: 'plata_1', name: 'Centurión de Plata I', minPts: 500, maxPts: 649, badgeColor: 'text-slate-200 border-slate-300 bg-slate-300/10', tier: 'Plata' },
  { id: 'plata_2', name: 'Centurión de Plata II', minPts: 650, maxPts: 799, badgeColor: 'text-slate-100 border-slate-200 bg-slate-200/10', tier: 'Plata' },
  { id: 'oro_1', name: 'Guardián Dorado I', minPts: 800, maxPts: 999, badgeColor: 'text-yellow-400 border-yellow-400 bg-yellow-400/10', tier: 'Oro' },
  { id: 'oro_2', name: 'Guardián Dorado II', minPts: 1000, maxPts: 1199, badgeColor: 'text-yellow-300 border-yellow-300 bg-yellow-300/15', tier: 'Oro' },
  { id: 'diamante_1', name: 'Heraldo de Diamante', minPts: 1200, maxPts: 1499, badgeColor: 'text-cyan-300 border-cyan-400 bg-cyan-400/15', tier: 'Diamante' },
  { id: 'cosmico', name: 'Soberano Cósmico', minPts: 1500, maxPts: 99999, badgeColor: 'text-fuchsia-400 border-fuchsia-400 bg-fuchsia-400/20', tier: 'Cósmico' }
];

export function getPvpRankInfo(points = 0) {
  const currentRank = [...PVP_RANKS].reverse().find(r => points >= r.minPts) || PVP_RANKS[0];
  const nextRank = PVP_RANKS[PVP_RANKS.indexOf(currentRank) + 1] || null;
  const progress = nextRank 
    ? Math.min(100, Math.max(0, Math.round(((points - currentRank.minPts) / (nextRank.minPts - currentRank.minPts)) * 100)))
    : 100;

  return {
    ...currentRank,
    nextRank,
    progress,
    points
  };
}

export function generatePvpRivals(hero, realMatches = []) {
  const heroLevel = hero?.level || 1;
  const signs = Object.keys(ZODIAC_HERO_CLASSES);
  const titles = [
    'Vanguardia de Orión',
    'Cazador del Vacío',
    'Hechicera del Eclipse',
    'Guerrero de la Nebulosa',
    'Paladín de Casiopea',
    'Espadachín Solar',
    'Místico de Andrómeda',
    'Heraldo Estelar'
  ];
  const stances = ['solar', 'lunar', 'stellar'];
  const rivals = [];

  // Si hay matches reales, incluir 1-2 como rivales de honor
  if (realMatches && realMatches.length > 0) {
    const match = realMatches[Math.floor(Math.random() * realMatches.length)];
    const matchSign = match.sign || 'Leo';
    const matchClass = ZODIAC_HERO_CLASSES[matchSign] || ZODIAC_HERO_CLASSES['Leo'];
    const photo = match.image || match.photos?.[0] || match.photo || null;

    rivals.push({
      id: `rival_match_${match.id || 'real'}`,
      isRealMatch: true,
      name: match.name || 'Conexión Astral',
      sign: matchSign,
      element: matchClass.element,
      level: Math.max(1, heroLevel + (Math.random() > 0.5 ? 1 : 0)),
      avatarUrl: photo,
      title: 'Vínculo Rival de Zodia',
      stance: stances[Math.floor(Math.random() * stances.length)],
      hp: Math.round(matchClass.baseStats.hp * 1.5 + heroLevel * 65),
      atk: Math.round(matchClass.baseStats.atk * 1.1 + heroLevel * 6),
      def: Math.round(matchClass.baseStats.def * 1.05 + heroLevel * 4),
      spd: matchClass.baseStats.spd + 5,
      gloryPoints: 35 + Math.floor(Math.random() * 15),
      rewardExp: 140 + heroLevel * 25,
      rewardGold: 160 + heroLevel * 30
    });
  }

  // Generar gladiadores astrales para completar 3-4 contrincantes
  const needed = Math.max(3, 4 - rivals.length);
  for (let i = 0; i < needed; i++) {
    const sign = signs[(i * 4 + (heroLevel % 5)) % signs.length];
    const heroClass = ZODIAC_HERO_CLASSES[sign];
    const levelDiff = i === 0 ? -1 : (i === 1 ? 0 : 1);
    const rivalLevel = Math.max(1, heroLevel + levelDiff);
    const scaling = 1 + (rivalLevel - 1) * 0.12;

    rivals.push({
      id: `rival_bot_${i}_${Date.now()}`,
      isRealMatch: false,
      name: `Gladiador ${sign}`,
      sign,
      element: heroClass.element,
      level: rivalLevel,
      avatarUrl: null,
      title: titles[(i + heroLevel) % titles.length],
      stance: stances[i % stances.length],
      hp: Math.round((heroClass.baseStats.hp * 1.5 + 80) * scaling),
      atk: Math.round((heroClass.baseStats.atk + 8) * scaling),
      def: Math.round((heroClass.baseStats.def + 6) * scaling),
      spd: Math.round(heroClass.baseStats.spd * (1 + i * 0.05)),
      gloryPoints: 30 + (i * 10) + Math.floor(Math.random() * 8),
      rewardExp: 120 + rivalLevel * 25,
      rewardGold: 140 + rivalLevel * 30
    });
  }

  return rivals;
}

// ==========================================
// INCURSIONES COOPERATIVAS (RAID BOSSES)
// ==========================================
export const COOP_RAID_BOSSES = [
  {
    id: 'raid_dark_nebula',
    name: 'Titán de la Nebulosa Oscura',
    title: 'Monarca del Vacío Sombrío',
    sign: 'Ofiuco',
    element: 'Agua',
    minLevel: 1,
    description: 'Especialista en Mareas del Abismo que absorben el Éter. La cooperación equilibrada de elementos es vital para romper su núcleo.',
    hpBase: 1800,
    hpPerLevel: 220,
    atkBase: 70,
    atkPerLevel: 8,
    defBase: 38,
    defPerLevel: 4,
    rewardExpBase: 320,
    rewardGoldBase: 350,
    stardustReward: 80,
    dropChance: 'wp_03',
    badge: 'border-cyan-500/40 bg-cyan-950/30'
  },
  {
    id: 'raid_solar_phoenix',
    name: 'Fénix del Eclipse Solar',
    title: 'Avatar de las Llamas Eternas',
    sign: 'Leo',
    element: 'Fuego',
    minLevel: 3,
    description: 'Se envuelve en una corona de plasma solar infligiendo daño constante por quemadura. Requiere coordinación defensiva y escudos.',
    hpBase: 2600,
    hpPerLevel: 280,
    atkBase: 88,
    atkPerLevel: 10,
    defBase: 44,
    defPerLevel: 5,
    rewardExpBase: 480,
    rewardGoldBase: 500,
    stardustReward: 120,
    dropChance: 'ar_03',
    badge: 'border-amber-500/40 bg-amber-950/30'
  },
  {
    id: 'raid_ouroboros',
    name: 'Ouroboros del Vacío Astral',
    title: 'Devorador de Constelaciones',
    sign: 'Escorpio',
    element: 'Tierra',
    minLevel: 5,
    description: 'Titán milenario que altera la gravedad y genera un Vórtice de Ruptura. Otorga las reliquias más codiciadas del cosmos.',
    hpBase: 3600,
    hpPerLevel: 340,
    atkBase: 105,
    atkPerLevel: 12,
    defBase: 52,
    defPerLevel: 6,
    rewardExpBase: 650,
    rewardGoldBase: 700,
    stardustReward: 180,
    dropChance: 'rl_03',
    badge: 'border-purple-500/40 bg-purple-950/30'
  }
];

// ==========================================
// HABILIDADES DE ASISTENCIA COOPERATIVA (SINASTRÍA)
// ==========================================
export const PARTNER_ASSIST_SKILLS = {
  Aries: {
    name: 'Embestida de Cometa',
    type: 'attack',
    element: 'Fuego',
    desc: 'Inflige daño físico pesado y desestabiliza al objetivo (-1 Tenacidad).',
    multiplier: 1.4,
    staggerBreak: 1
  },
  Tauro: {
    name: 'Muro de Cuarzo Astral',
    type: 'shield',
    element: 'Tierra',
    desc: 'Otorga un escudo de 140 puntos al Héroe y regenera +1 Éter.',
    shieldAmount: 140,
    etherBonus: 1
  },
  Géminis: {
    name: 'Doble Reflejo de Éter',
    type: 'buff',
    element: 'Aire',
    desc: 'Otorga +2 puntos de Éter instantáneos y aumenta el daño del próximo turno un 25%.',
    etherBonus: 2,
    damageBuff: 0.25
  },
  Cáncer: {
    name: 'Manto de Marea Sanadora',
    type: 'heal',
    element: 'Agua',
    desc: 'Restaura un 30% de la vida máxima del Héroe y limpia estados alterados.',
    healPercent: 0.30,
    cleanse: true
  },
  Leo: {
    name: 'Llamarada Solar Real',
    type: 'attack',
    element: 'Fuego',
    desc: 'Inflige daño de Fuego devastador y aplica 2 turnos de Quemadura.',
    multiplier: 1.5,
    status: { type: 'burn', turns: 2, dot: 45 }
  },
  Virgo: {
    name: 'Precisión Geométrica',
    type: 'crit_buff',
    element: 'Tierra',
    desc: 'Garantiza Golpe Crítico en la siguiente acción y reduce la defensa enemiga.',
    critGuaranteed: true,
    defShred: 15
  },
  Libra: {
    name: 'Balanza Cósmica',
    type: 'hybrid',
    element: 'Aire',
    desc: 'Absorbe 80 de vida del enemigo y la transfiere como curación al Héroe.',
    multiplier: 0.9,
    healAmount: 90
  },
  Escorpio: {
    name: 'Picadura del Abismo',
    type: 'attack',
    element: 'Agua',
    desc: 'Aplica Veneno Mortal que corroe al enemigo durante 3 turnos.',
    multiplier: 1.2,
    status: { type: 'poison', turns: 3, dot: 55 }
  },
  Sagitario: {
    name: 'Flecha del Cénit',
    type: 'attack',
    element: 'Fuego',
    desc: 'Disparo certero que atraviesa el 50% de la defensa enemiga con alta prob. crítica.',
    multiplier: 1.6,
    pierceDef: 0.5
  },
  Capricornio: {
    name: 'Fortaleza del Titán',
    type: 'shield',
    element: 'Tierra',
    desc: 'Otorga un escudo de 180 puntos y reduce el daño recibido el próximo turno.',
    shieldAmount: 180,
    damageReduction: 0.25
  },
  Acuario: {
    name: 'Torbellino Estelar',
    type: 'attack',
    element: 'Aire',
    desc: 'Ráfaga cósmica que inflige daño y reduce la velocidad y ataque del enemigo.',
    multiplier: 1.3,
    atkDebuff: 10
  },
  Piscis: {
    name: 'Bendición de las Profundidades',
    type: 'heal',
    element: 'Agua',
    desc: 'Restaura un 35% de vida y otorga un escudo protector de 80 puntos.',
    healPercent: 0.35,
    shieldAmount: 80
  }
};

// ==========================================
// RECOMPENSAS DE RACHA DIARIA (7 DÍAS)
// ==========================================
export const DAILY_STREAK_REWARDS = [
  {
    day: 1,
    title: 'Despertar Astral',
    desc: 'Bono inicial de bienvenida al cosmos',
    polvoEstelar: 60,
    exp: 50,
    potions: 1,
    icon: 'Sparkles',
    badge: 'Día 1'
  },
  {
    day: 2,
    title: 'Pulso de Nebulosa',
    desc: 'Crecimiento de éter celestial',
    polvoEstelar: 90,
    exp: 80,
    potions: 1,
    icon: 'Flame',
    badge: 'Día 2'
  },
  {
    day: 3,
    title: 'Cofre del Heraldo',
    desc: 'Equipamiento Raro de Pléyades garantizado',
    polvoEstelar: 120,
    exp: 100,
    potions: 1,
    itemDropId: 'wp_02',
    icon: 'Gift',
    badge: 'Día 3 ★'
  },
  {
    day: 4,
    title: 'Elixir de los Astros',
    desc: 'Reserva médica cósmica ampliada',
    polvoEstelar: 150,
    exp: 130,
    potions: 2,
    icon: 'Heart',
    badge: 'Día 4'
  },
  {
    day: 5,
    title: 'Vórtice Cósmico',
    desc: 'Sobrecarga de poder y experiencia',
    polvoEstelar: 190,
    exp: 180,
    potions: 2,
    icon: 'Zap',
    badge: 'Día 5'
  },
  {
    day: 6,
    title: 'Reliquia de Saturno',
    desc: 'Artefacto Épico de anillos astrales',
    polvoEstelar: 240,
    exp: 220,
    potions: 2,
    itemDropId: 'rl_03',
    icon: 'Compass',
    badge: 'Día 6 ★'
  },
  {
    day: 7,
    title: 'Soberanía del Zodíaco',
    desc: 'Cofre Mítico: Arma Legendaria de Orión y Polvo Máximo',
    polvoEstelar: 400,
    exp: 320,
    potions: 3,
    itemDropId: 'wp_04',
    icon: 'Crown',
    badge: 'Día 7 ★★★'
  }
];

// ==========================================
// MISIONES DIARIAS DEL ORÁCULO (DAILY QUESTS)
// ==========================================
export const DAILY_QUESTS_TEMPLATE = [
  {
    id: 'quest_houses',
    category: 'houses',
    title: 'Purificación del Templo',
    desc: 'Lucha o vence en 1 Casa de las Doce Casas del Zodíaco',
    target: 1,
    reward: { polvoEstelar: 50, exp: 60 },
    icon: 'Landmark'
  },
  {
    id: 'quest_pvp',
    category: 'pvp',
    title: 'Gloria en el Coliseo',
    desc: 'Disputa 1 Duelo en el Coliseo Astral contra otro gladiador',
    target: 1,
    reward: { polvoEstelar: 55, exp: 50, pvpPoints: 15 },
    icon: 'Swords'
  },
  {
    id: 'quest_coop',
    category: 'coop',
    title: 'Nexo de Sinastría',
    desc: 'Participa en 1 Incursión Titánica junto a un compañero de vínculo o aliado',
    target: 1,
    reward: { polvoEstelar: 65, exp: 70, potions: 1 },
    icon: 'Users'
  },
  {
    id: 'quest_shadows_tower',
    category: 'shadows_tower',
    title: 'Prueba de Tenacidad',
    desc: 'Lucha en un Duelo de Sombras, Torre del Caos o Gemelos del Eclipse',
    target: 1,
    reward: { polvoEstelar: 45, exp: 50 },
    icon: 'Target'
  }
];

export const DAILY_MASTER_CHEST_REWARD = {
  polvoEstelar: 180,
  exp: 150,
  potions: 2,
  itemDropId: 'ar_03'
};

/**
 * Retorna la fecha local en formato YYYY-MM-DD
 */
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula el estado de reinicio diario, racha activa y disponibilidad
 */
export function getDailyResetInfo(hero) {
  const todayStr = getTodayDateString();
  const lastClaim = hero?.lastDailyClaimDate;

  let canClaimStreak = false;
  let streak = hero?.dailyStreak || 0;

  if (!lastClaim) {
    canClaimStreak = true;
  } else if (lastClaim !== todayStr) {
    const todayDate = new Date(todayStr);
    const lastDate = new Date(lastClaim);
    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      canClaimStreak = true;
    } else {
      canClaimStreak = true;
      streak = 0;
    }
  }

  // Índice para mostrar el día actual en el ciclo de 7 días (0 a 6)
  const currentDayIndex = canClaimStreak ? (streak % 7) : Math.max(0, ((streak - 1) % 7));
  const isFirstWinAvailable = hero?.lastFirstWinDate !== todayStr;

  return {
    todayStr,
    canClaimStreak,
    dailyStreak: streak,
    currentDayIndex,
    isFirstWinAvailable
  };
}

/**
 * Procesa el reclamo del día actual en la racha de 7 días
 */
export function claimDailyStreakReward(hero) {
  const { canClaimStreak, dailyStreak, todayStr } = getDailyResetInfo(hero);
  if (!canClaimStreak) return { updatedHero: hero, rewardDef: null, gainedItem: null };

  const newStreak = (dailyStreak % 7) + 1;
  const rewardIndex = newStreak - 1;
  const rewardDef = DAILY_STREAK_REWARDS[rewardIndex] || DAILY_STREAK_REWARDS[0];

  let newInventory = [...(hero.inventory || [])];
  let gainedItem = null;
  if (rewardDef.itemDropId) {
    const item = EQUIPMENT_CATALOG.find(i => i.id === rewardDef.itemDropId);
    if (item) {
      gainedItem = { ...item, id: `${item.id}_streak_${Date.now()}` };
      newInventory.push(gainedItem);
    }
  }

  const updatedHero = {
    ...hero,
    dailyStreak: newStreak,
    lastDailyClaimDate: todayStr,
    polvoEstelar: (hero.polvoEstelar || 0) + (rewardDef.polvoEstelar || 0),
    exp: (hero.exp || 0) + (rewardDef.exp || 0),
    potions: (hero.potions || 0) + (rewardDef.potions || 0),
    inventory: newInventory
  };

  saveHeroProfile(updatedHero);
  return { updatedHero, rewardDef, gainedItem };
}

/**
 * Inicializa o resetea las misiones diarias si el día cambió
 */
export function initializeOrSyncDailyQuests(hero) {
  if (!hero) return hero;
  const todayStr = getTodayDateString();

  if (hero.dailyQuestsDate === todayStr && Array.isArray(hero.dailyQuests) && hero.dailyQuests.length === DAILY_QUESTS_TEMPLATE.length) {
    return hero;
  }

  const initialQuests = DAILY_QUESTS_TEMPLATE.map(t => ({
    id: t.id,
    category: t.category,
    progress: 0,
    target: t.target,
    completed: false,
    claimed: false
  }));

  const updatedHero = {
    ...hero,
    dailyQuestsDate: todayStr,
    dailyQuests: initialQuests,
    dailyMasterChestClaimed: false
  };

  saveHeroProfile(updatedHero);
  return updatedHero;
}

/**
 * Incrementa el progreso de la misión diaria según la actividad realizada
 */
export function recordDailyQuestProgress(hero, actionType) {
  if (!hero) return hero;
  let updatedHero = initializeOrSyncDailyQuests(hero);
  let quests = [...(updatedHero.dailyQuests || [])];
  let changed = false;

  quests = quests.map(q => {
    let matches = false;
    if (q.category === 'houses' && actionType === 'houses') matches = true;
    if (q.category === 'pvp' && actionType === 'pvp') matches = true;
    if (q.category === 'coop' && actionType === 'coop') matches = true;
    if (q.category === 'shadows_tower' && (actionType === 'quick' || actionType === 'tower' || actionType === 'eclipse')) matches = true;

    if (matches && !q.completed) {
      const newProgress = Math.min(q.target, (q.progress || 0) + 1);
      changed = true;
      return {
        ...q,
        progress: newProgress,
        completed: newProgress >= q.target
      };
    }
    return q;
  });

  if (changed) {
    updatedHero = { ...updatedHero, dailyQuests: quests };
    saveHeroProfile(updatedHero);
  }
  return updatedHero;
}

/**
 * Reclama la recompensa de una misión diaria completada
 */
export function claimDailyQuestReward(hero, questId) {
  if (!hero || !hero.dailyQuests) return { updatedHero: hero, reward: null };
  const questIndex = hero.dailyQuests.findIndex(q => q.id === questId);
  if (questIndex === -1) return { updatedHero: hero, reward: null };

  const quest = hero.dailyQuests[questIndex];
  if (!quest.completed || quest.claimed) return { updatedHero: hero, reward: null };

  const template = DAILY_QUESTS_TEMPLATE.find(t => t.id === questId);
  const reward = template ? template.reward : { polvoEstelar: 40, exp: 40 };

  const updatedQuests = [...hero.dailyQuests];
  updatedQuests[questIndex] = { ...quest, claimed: true };

  const updatedHero = {
    ...hero,
    dailyQuests: updatedQuests,
    polvoEstelar: (hero.polvoEstelar || 0) + (reward.polvoEstelar || 0),
    exp: (hero.exp || 0) + (reward.exp || 0),
    pvpPoints: (hero.pvpPoints || 0) + (reward.pvpPoints || 0),
    potions: (hero.potions || 0) + (reward.potions || 0)
  };

  saveHeroProfile(updatedHero);
  return { updatedHero, reward };
}

/**
 * Reclama el Cofre Maestro Diario al completar al menos 3 misiones
 */
export function claimDailyMasterChest(hero) {
  if (!hero || hero.dailyMasterChestClaimed) return { updatedHero: hero, reward: null, gainedItem: null };
  const completedCount = (hero.dailyQuests || []).filter(q => q.completed).length;
  if (completedCount < 3) return { updatedHero: hero, reward: null, gainedItem: null };

  let newInventory = [...(hero.inventory || [])];
  let gainedItem = null;
  if (DAILY_MASTER_CHEST_REWARD.itemDropId) {
    const item = EQUIPMENT_CATALOG.find(i => i.id === DAILY_MASTER_CHEST_REWARD.itemDropId);
    if (item) {
      gainedItem = { ...item, id: `${item.id}_master_${Date.now()}` };
      newInventory.push(gainedItem);
    }
  }

  const updatedHero = {
    ...hero,
    dailyMasterChestClaimed: true,
    polvoEstelar: (hero.polvoEstelar || 0) + DAILY_MASTER_CHEST_REWARD.polvoEstelar,
    exp: (hero.exp || 0) + DAILY_MASTER_CHEST_REWARD.exp,
    potions: (hero.potions || 0) + DAILY_MASTER_CHEST_REWARD.potions,
    inventory: newInventory
  };

  saveHeroProfile(updatedHero);
  return { updatedHero, reward: DAILY_MASTER_CHEST_REWARD, gainedItem };
}

// ==========================================
// FORJA CÓSMICA Y ALQUIMIA (REFINE, ENCHANT, DISMANTLE)
// ==========================================
export const UPGRADE_CONFIG = {
  maxLevel: 10,
  levels: [
    { from: 0, to: 1, cost: 35, successRate: 1.00, title: '+1 Forjado' },
    { from: 1, to: 2, cost: 50, successRate: 1.00, title: '+2 Templado' },
    { from: 2, to: 3, cost: 70, successRate: 1.00, title: '+3 Purificado' },
    { from: 3, to: 4, cost: 95, successRate: 1.00, title: '+4 Brillante' },
    { from: 4, to: 5, cost: 125, successRate: 0.85, title: '+5 Astral' },
    { from: 5, to: 6, cost: 160, successRate: 0.80, title: '+6 Resonante' },
    { from: 6, to: 7, cost: 200, successRate: 0.75, title: '+7 Celestial' },
    { from: 7, to: 8, cost: 250, successRate: 0.65, title: '+8 Cósmico' },
    { from: 8, to: 9, cost: 310, successRate: 0.55, title: '+9 Supernova' },
    { from: 9, to: 10, cost: 400, successRate: 0.50, title: '+10 Soberano' }
  ]
};

export const ASTRAL_GEMS = [
  {
    id: 'gem_fire',
    name: 'Rubí de Fuego Solar',
    element: 'Fuego',
    cost: 110,
    icon: 'Flame',
    color: 'text-orange-400 bg-orange-500/20 border-orange-500/40',
    bonusStats: { atk: 18, crit: 0.04 },
    passiveDesc: '+18 Ataque y +4% Probabilidad Crítica.',
    flavor: 'Arde con el calor primordial de una estrella en ignición.'
  },
  {
    id: 'gem_water',
    name: 'Zafiro de Marea Lunar',
    element: 'Agua',
    cost: 110,
    icon: 'Moon',
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40',
    bonusStats: { hp: 85, def: 8 },
    passiveDesc: '+85 Vida Máxima y +8 Defensa.',
    flavor: 'Canaliza el pulso de las mareas y el alivio de las profundidades.'
  },
  {
    id: 'gem_earth',
    name: 'Esmeralda de Granito Terrestre',
    element: 'Tierra',
    cost: 110,
    icon: 'Shield',
    color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
    bonusStats: { def: 24, hp: 40 },
    passiveDesc: '+24 Defensa y +40 Vida Máxima.',
    flavor: 'Dureza inquebrantable forjada en las raíces del zodíaco.'
  },
  {
    id: 'gem_air',
    name: 'Topacio de Viento Etéreo',
    element: 'Aire',
    cost: 110,
    icon: 'Wind',
    color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/40',
    bonusStats: { spd: 8, atk: 10 },
    passiveDesc: '+8 Velocidad y +10 Ataque.',
    flavor: 'Otorga la ligereza de las ráfagas celestiales y anticipación veloz.'
  }
];

export const DISMANTLE_RATES = {
  comun: 25,
  raro: 60,
  epico: 130,
  legendario: 280
};

/**
 * Refina una pieza de equipo (+1 a +10)
 */
export function refineEquipmentItem(hero, itemId) {
  if (!hero || !itemId) return { success: false, hero, message: 'Datos inválidos' };

  let targetItem = null;
  let isEquippedSlot = null;

  for (const slot of ['weapon', 'armor', 'relic']) {
    if (hero.equipped && hero.equipped[slot]?.id === itemId) {
      targetItem = hero.equipped[slot];
      isEquippedSlot = slot;
      break;
    }
  }

  if (!targetItem && Array.isArray(hero.inventory)) {
    targetItem = hero.inventory.find(i => i.id === itemId);
  }

  if (!targetItem) return { success: false, hero, message: 'Objeto no encontrado' };

  const currentLevel = targetItem.upgradeLevel || 0;
  if (currentLevel >= UPGRADE_CONFIG.maxLevel) {
    return { success: false, hero, message: 'El objeto ya alcanzó el nivel máximo (+10).' };
  }

  const step = UPGRADE_CONFIG.levels[currentLevel];
  if (!step) return { success: false, hero, message: 'Nivel no disponible' };

  if ((hero.polvoEstelar || 0) < step.cost) {
    return { success: false, hero, message: `Necesitas ${step.cost} de Polvo Estelar.` };
  }

  const roll = Math.random();
  const isSuccess = roll <= step.successRate;
  const newPolvo = hero.polvoEstelar - step.cost;

  if (isSuccess) {
    const updatedItem = {
      ...targetItem,
      upgradeLevel: currentLevel + 1
    };

    let newEquipped = { ...(hero.equipped || {}) };
    let newInventory = [...(hero.inventory || [])];

    if (isEquippedSlot) {
      newEquipped[isEquippedSlot] = updatedItem;
    } else {
      newInventory = newInventory.map(i => i.id === itemId ? updatedItem : i);
    }

    const updatedHero = {
      ...hero,
      polvoEstelar: newPolvo,
      equipped: newEquipped,
      inventory: newInventory
    };

    saveHeroProfile(updatedHero);
    return {
      success: true,
      hero: updatedHero,
      updatedItem,
      levelGained: currentLevel + 1,
      message: `¡Éxito en la Forja! Objeto refinado a +${currentLevel + 1} (${step.title})`
    };
  } else {
    const updatedHero = {
      ...hero,
      polvoEstelar: newPolvo
    };
    saveHeroProfile(updatedHero);
    return {
      success: false,
      hero: updatedHero,
      message: 'La armonía estelar falló, pero el objeto permaneció intacto.'
    };
  }
}

/**
 * Aplica una gema de encantamiento elemental a una pieza
 */
export function enchantEquipmentItem(hero, itemId, gemId) {
  if (!hero || !itemId || !gemId) return { success: false, hero, message: 'Datos incompletos' };

  const gem = ASTRAL_GEMS.find(g => g.id === gemId);
  if (!gem) return { success: false, hero, message: 'Gema no válida' };

  if ((hero.polvoEstelar || 0) < gem.cost) {
    return { success: false, hero, message: `Necesitas ${gem.cost} de Polvo Estelar para engarzar esta gema.` };
  }

  let targetItem = null;
  let isEquippedSlot = null;

  for (const slot of ['weapon', 'armor', 'relic']) {
    if (hero.equipped && hero.equipped[slot]?.id === itemId) {
      targetItem = hero.equipped[slot];
      isEquippedSlot = slot;
      break;
    }
  }

  if (!targetItem && Array.isArray(hero.inventory)) {
    targetItem = hero.inventory.find(i => i.id === itemId);
  }

  if (!targetItem) return { success: false, hero, message: 'Objeto no encontrado' };

  const updatedItem = {
    ...targetItem,
    enchantment: {
      gemId: gem.id,
      name: gem.name,
      element: gem.element,
      bonusStats: gem.bonusStats,
      passiveDesc: gem.passiveDesc
    }
  };

  let newEquipped = { ...(hero.equipped || {}) };
  let newInventory = [...(hero.inventory || [])];

  if (isEquippedSlot) {
    newEquipped[isEquippedSlot] = updatedItem;
  } else {
    newInventory = newInventory.map(i => i.id === itemId ? updatedItem : i);
  }

  const updatedHero = {
    ...hero,
    polvoEstelar: hero.polvoEstelar - gem.cost,
    equipped: newEquipped,
    inventory: newInventory
  };

  saveHeroProfile(updatedHero);
  return {
    success: true,
    hero: updatedHero,
    updatedItem,
    message: `¡Encantamiento exitoso! ${gem.name} engarzada.`
  };
}

/**
 * Desmonta una lista de piezas del inventario para recuperar Polvo Estelar
 */
export function dismantleEquipmentItems(hero, itemIds) {
  if (!hero || !Array.isArray(itemIds) || itemIds.length === 0) {
    return { success: false, hero, gainedPolvo: 0 };
  }

  let gainedPolvo = 0;
  const itemsToRemove = new Set(itemIds);

  (hero.inventory || []).forEach(item => {
    if (itemsToRemove.has(item.id)) {
      const rate = DISMANTLE_RATES[item.rarity] || 25;
      const upgradeBonus = (item.upgradeLevel || 0) * 15;
      gainedPolvo += (rate + upgradeBonus);
    }
  });

  const newInventory = (hero.inventory || []).filter(item => !itemsToRemove.has(item.id));

  const updatedHero = {
    ...hero,
    polvoEstelar: (hero.polvoEstelar || 0) + gainedPolvo,
    inventory: newInventory
  };

  saveHeroProfile(updatedHero);
  return {
    success: true,
    hero: updatedHero,
    gainedPolvo,
    message: `Has desintegrado ${itemIds.length} pieza(s) y obtenido +${gainedPolvo} de Polvo Estelar.`
  };
}

/**
 * Fusiona 3 piezas de la misma rareza para transmutar en 1 de rareza superior
 */
export function transmuteEquipmentItems(hero, itemIds) {
  if (!hero || !Array.isArray(itemIds) || itemIds.length !== 3) {
    return { success: false, hero, message: 'Se requieren exactamente 3 piezas para la fusión.' };
  }

  const items = (hero.inventory || []).filter(i => itemIds.includes(i.id));
  if (items.length !== 3) {
    return { success: false, hero, message: 'No se encontraron las 3 piezas en el inventario.' };
  }

  const baseRarity = items[0].rarity;
  const allSameRarity = items.every(i => i.rarity === baseRarity);
  if (!allSameRarity) {
    return { success: false, hero, message: 'Las 3 piezas deben ser de la misma rareza.' };
  }

  let targetRarity = 'raro';
  if (baseRarity === 'comun') targetRarity = 'raro';
  else if (baseRarity === 'raro') targetRarity = 'epico';
  else if (baseRarity === 'epico') targetRarity = 'legendario';
  else {
    return { success: false, hero, message: 'Piezas legendarias no pueden transmutarse más allá.' };
  }

  const pool = EQUIPMENT_CATALOG.filter(i => i.rarity === targetRarity);
  const randomItem = pool[Math.floor(Math.random() * pool.length)] || EQUIPMENT_CATALOG[0];

  const newItem = {
    ...randomItem,
    id: `${randomItem.id}_transmute_${Date.now()}`
  };

  const newInventory = (hero.inventory || []).filter(i => !itemIds.includes(i.id));
  newInventory.push(newItem);

  const updatedHero = {
    ...hero,
    inventory: newInventory
  };

  saveHeroProfile(updatedHero);
  return {
    success: true,
    hero: updatedHero,
    gainedItem: newItem,
    message: `¡Transmutación exitosa! Has obtenido [${newItem.name}] (${targetRarity.toUpperCase()}).`
  };
}



