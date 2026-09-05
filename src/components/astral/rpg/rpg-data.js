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

export const RARITIES = {
  comun: { name: 'Común', color: 'text-gray-300', border: 'border-white/20', bg: 'bg-white/5' },
  raro: { name: 'Raro', color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
  epico: { name: 'Épico', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
  legendario: { name: 'Legendario Cósmico', color: 'text-amber-400', border: 'border-amber-400', bg: 'bg-amber-500/20' }
};

export const EQUIPMENT_CATALOG = [
  // ARMAS
  { id: 'wp_01', type: 'weapon', name: 'Daga de Polvo Estelar', rarity: 'comun', atk: 12, crit: 0.03, desc: 'Forjada con remanentes de meteorito menor.' },
  { id: 'wp_02', type: 'weapon', name: 'Báculo de las Pléyades', rarity: 'raro', atk: 25, crit: 0.06, desc: 'Canaliza la luz azul de siete estrellas hermanas.' },
  { id: 'wp_03', type: 'weapon', name: 'Espada de Nebulosa Solar', rarity: 'epico', atk: 45, crit: 0.10, desc: 'Emite calor puro de una supernova en nacimiento.' },
  { id: 'wp_04', type: 'weapon', name: 'Arco Cósmico de Orión', rarity: 'legendario', atk: 75, crit: 0.18, desc: 'El arma mítica de los cazadores celestiales. Desgarra el éter.' },

  // ARMADURAS
  { id: 'ar_01', type: 'armor', name: 'Manto de Seda Astral', rarity: 'comun', hp: 40, def: 8, desc: 'Tejido suave bendecido por la brisa cósmica.' },
  { id: 'ar_02', type: 'armor', name: 'Pechera de Roca Lunar', rarity: 'raro', hp: 90, def: 18, desc: 'Piedra basáltica extraída de la cara oculta de la Luna.' },
  { id: 'ar_03', type: 'armor', name: 'Coraza del Coloso Tauro', rarity: 'epico', hp: 170, def: 35, desc: 'Forjada en el corazón de un asteroide de hierro.' },
  { id: 'ar_04', type: 'armor', name: 'Armadura Sagrada de Casiopea', rarity: 'legendario', hp: 300, def: 55, desc: 'Brilla con la soberanía intocable de la reina estelar.' },

  // RELIQUIAS
  { id: 'rl_01', type: 'relic', name: 'Fragmento de Cuarzo Místico', rarity: 'comun', hp: 25, spd: 4, desc: 'Pulso suave que afina los sentidos astrales.' },
  { id: 'rl_02', type: 'relic', name: 'Lágrima Congelada de Neptuno', rarity: 'raro', spd: 10, crit: 0.05, desc: 'Permite deslizarse entre las corrientes temporales.' },
  { id: 'rl_03', type: 'relic', name: 'Anillo de los Anillos de Saturno', rarity: 'epico', def: 20, spd: 12, desc: 'Manipula la gravedad alrededor de su portador.' },
  { id: 'rl_04', type: 'relic', name: 'Ojo Omnisciente de Ra', rarity: 'legendario', atk: 35, crit: 0.12, hp: 120, desc: 'Otorga la clarividencia de los antiguos dioses solares.' }
];

export const TWELVE_HOUSES_STAGES = [
  {
    house: 1,
    name: 'Casa I: Templo del Nacimiento',
    guardianSign: 'Aries',
    guardianName: 'Sombra del Carnero Ígneo',
    hp: 450,
    atk: 50,
    def: 20,
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
    hp: 580,
    atk: 45,
    def: 35,
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
    hp: 500,
    atk: 60,
    def: 22,
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
    hp: 650,
    atk: 52,
    def: 32,
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
    hp: 750,
    atk: 72,
    def: 28,
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
    hp: 700,
    atk: 68,
    def: 38,
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
    hp: 800,
    atk: 74,
    def: 36,
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
    hp: 920,
    atk: 88,
    def: 34,
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
    hp: 980,
    atk: 96,
    def: 30,
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
    hp: 1200,
    atk: 85,
    def: 55,
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
    hp: 1150,
    atk: 105,
    def: 38,
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
    hp: 1600,
    atk: 115,
    def: 45,
    spd: 44,
    element: 'Agua',
    rewardExp: 3000,
    rewardGold: 5000,
    dropChance: 'rl_04'
  }
];

const LOCAL_STORAGE_KEY = 'zodia_rpg_hero_v1';

/**
 * Carga o inicializa el perfil de RPG del jugador
 */
export function getOrCreateHeroProfile(userProfile) {
  const defaultSign = userProfile?.sign || 'Aries';
  const heroClass = ZODIAC_HERO_CLASSES[defaultSign] || ZODIAC_HERO_CLASSES['Aries'];

  if (typeof window === 'undefined') {
    return createInitialHero(userProfile, heroClass);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && saved.sign === defaultSign) {
        return saved;
      }
    }
  } catch (e) {
    console.error('Error cargando perfil RPG:', e);
  }

  const initialHero = createInitialHero(userProfile, heroClass);
  saveHeroProfile(initialHero);
  return initialHero;
}

function createInitialHero(userProfile, heroClass) {
  return {
    name: userProfile?.name || 'Sintonizador Astral',
    sign: heroClass.sign,
    element: heroClass.element,
    level: 1,
    exp: 0,
    expNext: 150,
    polvoEstelar: 100, // Moneda cósmica
    avatarUrl: userProfile?.photos?.[0] || userProfile?.image || null,
    stats: { ...heroClass.baseStats },
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
    pvpRank: 'Polvo Estelar I',
    pvpPoints: 0,
    potions: 3
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
