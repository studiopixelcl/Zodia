/**
 * Motor de Cálculo y Conocimiento Zodia
 * Segmentado para uso en Cliente y Servidor (Compatibilidad Edge)
 */

export const zodiacData = [
  { sign: "Capricornio", element: "Tierra", end: 19, luz: "Disciplinado, ambicioso, sabio", sombra: "Pesimista, frío, rígido" },
  { sign: "Acuario", element: "Aire", end: 18, luz: "Innovador, visionario, original", sombra: "Distante, rebelde, intransigente" },
  { sign: "Piscis", element: "Agua", end: 20, luz: "Compasivo, artístico, místico", sombra: "Escapista, crédulo, sin límites" },
  { sign: "Aries", element: "Fuego", end: 19, luz: "Valiente, iniciador, directo", sombra: "Impaciente, impulsivo, egocéntrico" },
  { sign: "Tauro", element: "Tierra", end: 20, luz: "Leal, paciente, confiable", sombra: "Terco, posesivo, materialista" },
  { sign: "Géminis", element: "Aire", end: 20, luz: "Adaptable, curioso, ingenioso", sombra: "Inconsistente, superficial, disperso" },
  { sign: "Cáncer", element: "Agua", end: 22, luz: "Intuitivo, protector, empático", sombra: "Temperamental, nostálgico, evasivo" },
  { sign: "Leo", element: "Fuego", end: 22, luz: "Carismático, líder natural, cálido", sombra: "Arrogante, dramático, inflexible" },
  { sign: "Virgo", element: "Tierra", end: 22, luz: "Analítico, detallista, práctico", sombra: "Crítico, perfeccionista, ansioso" },
  { sign: "Libra", element: "Aire", end: 22, luz: "Diplomático, justo, encantador", sombra: "Indeciso, complaciente, superficial" },
  { sign: "Escorpio", element: "Agua", end: 21, luz: "Apasionado, magnético, profundo", sombra: "Celoso, vengativo, controlador" },
  { sign: "Sagitario", element: "Fuego", end: 21, luz: "Optimista, filosófico, aventurero", sombra: "Imprudente, irresponsable, dogmático" },
  { sign: "Capricornio", element: "Tierra", end: 31, luz: "Disciplinado, ambicioso, sabio", sombra: "Pesimista, frío, rígido" }
];

export const ZODIAC_SYMBOLS = {
  Aries: '♈', Tauro: '♉', Géminis: '♊', Cáncer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Escorpio: '♏',
  Sagitario: '♐', Capricornio: '♑', Acuario: '♒', Piscis: '♓',
};

export const ZODIAC_SLUGS = {
  Aries: 'aries', Tauro: 'tauro', Géminis: 'gemini', Cáncer: 'cancer',
  Leo: 'leo', Virgo: 'virgo', Libra: 'libra', Escorpio: 'escorpio',
  Sagitario: 'sagitario', Capricornio: 'capricornio', Acuario: 'acuario', Piscis: 'piscis'
};

export function getZodiacSymbol(sign) {
  return ZODIAC_SYMBOLS[sign] ?? '✦';
}

export function getZodiacIconPath(sign) {
  const slug = ZODIAC_SLUGS[sign] ?? 'capricornio';
  return `/zodia/assets/zodiac/${slug}.png`;
}

// ─── DETALLES EXHAUSTIVOS DE CADA SIGNO ZODIACAL ────────────────────────────
export const ZODIAC_DETAILS = {
  Aries: {
    ruler: "Marte",
    modality: "Cardinal",
    mantra: "Inicio la chispa del destino con coraje inquebrantable.",
    loveDescription: "En el amor y las citas, Aries es directo, apasionado y audaz. No le gusta dar vueltas ni perder el tiempo; busca relaciones intensas donde exista admiración mutua y ganas de conquistar nuevos horizontes juntos.",
    personality: "Dotado de una energía incansable de liderazgo. Eres pionero por naturaleza, independiente, honesto hasta la médula y protector con quienes te importan.",
    idealMatches: ["Leo", "Sagitario", "Géminis", "Libra"],
    luz: "Valiente, iniciador, leal, generoso",
    sombra: "Impaciente, impulsivo, reactivo, competitivo"
  },
  Tauro: {
    ruler: "Venus",
    modality: "Fijo",
    mantra: "Construyo estabilidad, belleza y confort perdurable.",
    loveDescription: "En el amor, Tauro busca seguridad, lealtad incondicional y placer sensorial. Valora los detalles verdaderos, las citas tranquilas, la buena gastronomía y las conexiones a largo plazo.",
    personality: "Práctico, constante y sumamente confiable. Posees una paciencia admirable y un agudo sentido del gusto estético y la armonía.",
    idealMatches: ["Virgo", "Capricornio", "Cáncer", "Escorpio"],
    luz: "Leal, firme, afectuoso, sensato",
    sombra: "Terco, posesivo, celoso de los cambios"
  },
  Géminis: {
    ruler: "Mercurio",
    modality: "Mutable",
    mantra: "Conecto mentes e ideas a través de la palabra libre.",
    loveDescription: "En las citas, Géminis se enamora primero del cerebro. Necesita conversación estimulante, risas, variedad y libertad. Busca a alguien con quien explorar el mundo y nunca aburrirse.",
    personality: "Curioso, versátil y expresivo. Tu agilidad mental te permite conectar con cualquier persona y adaptarte sin esfuerzo a diferentes escenarios.",
    idealMatches: ["Libra", "Acuario", "Aries", "Sagitario"],
    luz: "Ingenioso, comunicativo, divertido, versátil",
    sombra: "Inconsistente, disperso, evasivo en el compromiso"
  },
  Cáncer: {
    ruler: "La Luna",
    modality: "Cardinal",
    mantra: "Protejo el hogar sagrado y honro mis sentimientos.",
    loveDescription: "En el amor, Cáncer es profundamente empático, romántico y protector. Busca una pareja con la que construir un espacio seguro, de mutuo apoyo y lealtad incondicional.",
    personality: "Intuitivo y receptivo. Sientes las vibraciones del entorno con gran intensidad. Tu lealtad y ternura crean vínculos duraderos.",
    idealMatches: ["Escorpio", "Piscis", "Tauro", "Capricornio"],
    luz: "Intuitivo, afectuoso, leal, compasivo",
    sombra: "Temperamental, nostálgico, cauteloso en exceso"
  },
  Leo: {
    ruler: "El Sol",
    modality: "Fijo",
    mantra: "Irradio la luz cálida de mi autenticidad sin temor.",
    loveDescription: "En el amor, Leo es apasionado, carismático y sumamente generoso. Le encanta celebrar a su pareja, organizar citas inolvidables y recibir admiración genuina.",
    personality: "Líder magnético con un corazón dorado. Posees un sentido natural de dignidad, entusiasmo y una creatividad radiante que inspira a los demás.",
    idealMatches: ["Aries", "Sagitario", "Libra", "Acuario"],
    luz: "Carismático, leal, generoso, alegre",
    sombra: "Orgulloso, dramático, necesitado de atención"
  },
  Virgo: {
    ruler: "Mercurio",
    modality: "Mutable",
    mantra: "Perfecciono mi entorno con servicio y sabiduría noble.",
    loveDescription: "En las relaciones, Virgo demuestra su amor a través de acciones prácticas de cuidado y apoyo diario. Busca orden, madurez emocional y proyectos compartidos.",
    personality: "Analítico, detallista y noble. Tu inteligencia práctica y tu vocación de servicio te convierten en un pilar de confianza para tus seres queridos.",
    idealMatches: ["Tauro", "Capricornio", "Cáncer", "Piscis"],
    luz: "Analítico, confiable, trabajador, metódico",
    sombra: "Perfeccionista, autoexigente, ansioso"
  },
  Libra: {
    ruler: "Venus",
    modality: "Cardinal",
    mantra: "Tejo la belleza, la justicia y la armonía entre las almas.",
    loveDescription: "Para Libra, el romance es un arte. Busca dinamismo, estética, caballerosidad/gentileza y un compañero de vida con quien equilibrar todas las facetas.",
    personality: "Encantador, justo y sociables por excelencia. Tienes una habilidad natural para mediar conflictos y crear ambientes refinados.",
    idealMatches: ["Géminis", "Acuario", "Leo", "Aries"],
    luz: "Diplomático, empático, refinado, justo",
    sombra: "Indeciso, complaciente por evitar el conflicto"
  },
  Escorpio: {
    ruler: "Plutón & Marte",
    modality: "Fijo",
    mantra: "Transformo las sombras en luz magnética inquebrantable.",
    loveDescription: "En el amor, Escorpio no conoce los términos medios: busca la fusión de almas, una lealtad a toda prueba y una intimidad emocional y física profunda.",
    personality: "Profundo, intuitivo y magnético. Posees una intuición penetrante para detectar la verdad detrás de las máscaras sociales.",
    idealMatches: ["Cáncer", "Piscis", "Tauro", "Virgo"],
    luz: "Leal, apasionado, perceptivo, resiliente",
    sombra: "Controlador, celoso, reservado en exceso"
  },
  Sagitario: {
    ruler: "Júpiter",
    modality: "Mutable",
    mantra: "Expando mis horizontes en busca de la verdad universal.",
    loveDescription: "En el romance, Sagitario es alegre, aventurero y libre. Quiere un compañero de viaje con quien reír, filosofar y descubrir nuevos destinos sin ataduras asfixiantes.",
    personality: "Optimista, filosófico y entusiasta. Tu franqueza y tu amor por la aventura hacen que tu energía sea contagiosa e inspiradora.",
    idealMatches: ["Aries", "Leo", "Acuario", "Géminis"],
    luz: "Optimista, sincero, visionario, alegre",
    sombra: "Imprudente, impaciente con la rutina, evasivo"
  },
  Capricornio: {
    ruler: "Saturno",
    modality: "Cardinal",
    mantra: "Construyo con paciencia mi imperio de luz y metas.",
    loveDescription: "En las citas y el amor, Capricornio busca madurez, respeto y visión a futuro. Se toma su tiempo para abrir el corazón, pero una vez comprometido es incondicional.",
    personality: "Disciplinado, ambicioso y sabio. Tienes una capacidad extraordinaria para superar adversidades y construir estructuras sólidas.",
    idealMatches: ["Tauro", "Virgo", "Escorpio", "Cáncer"],
    luz: "Perseverante, leal, responsable, sabio",
    sombra: "Reservado, autoexigente, rígido en ocasiones"
  },
  Acuario: {
    ruler: "Urano & Saturno",
    modality: "Fijo",
    mantra: "Inventó el futuro con la bandera de la libertad y el bien común.",
    loveDescription: "En las citas, Acuario busca primero una conexión mental e intelecto de amistad. Es original, respeta el espacio propio y busca proyectos innovadores en pareja.",
    personality: "Visionario, independiente y librepensador. Amas la originalidad y buscas hacer de este mundo un lugar más justo e inclusivo.",
    idealMatches: ["Géminis", "Libra", "Sagitario", "Leo"],
    luz: "Innovador, auténtico, humanitario, leal",
    sombra: "Distante emocionalmente, impredecible, rebelde"
  },
  Piscis: {
    ruler: "Neptuno & Júpiter",
    modality: "Mutable",
    mantra: "Me fundo con el amor universal y la inspiración del arte.",
    loveDescription: "En el amor, Piscis es el romántico místico definitivo. Sueña con una conexión de almas gemelas, caracterizada por la sensibilidad, la empatía y la ternura.",
    personality: "Empático, soñador e intuitivo. Tienes una sensibilidad única para el arte, la música y el lado espiritual de la existencia.",
    idealMatches: ["Cáncer", "Escorpio", "Tauro", "Virgo"],
    luz: "Compasivo, artístico, intuitivo, empático",
    sombra: "Idealista en exceso, escapista, sin límites claros"
  }
};

// ─── DETALLES EXHAUSTIVOS DE NUMEROLOGÍA (CAMINO DE VIDA) ────────────────────
export const LIFE_PATH_DETAILS = {
  1: {
    title: "El Líder Innovador",
    archetype: "El Mago",
    mission: "Tu misión es abrir caminos inexplorados, confiar en tu voz interior y liderar con independencia e innovación.",
    loveStyle: "En el amor eres independiente, apasionado y directo. Buscas a alguien que respete tu espacio y apoye tus ambiciones.",
    challenge: "Superar el temor a la soledad y la tentación del individualismo extremo.",
    compatiblePaths: [1, 5, 7]
  },
  2: {
    title: "El Pacificador Empático",
    archetype: "La Sacerdotisa",
    mission: "Tu misión es tejer la armonía, la cooperación y el equilibrio en las relaciones humanas a través de la intuición.",
    loveStyle: "En el romance eres dulce, considerado y atento a los detalles emocionales. Valoras la paz y el apoyo mutuo.",
    challenge: "Aprender a establecer límites firmes y no descuidar tus propias necesidades.",
    compatiblePaths: [2, 4, 6, 8, 11]
  },
  3: {
    title: "El Comunicador Creativo",
    archetype: "La Emperatriz",
    mission: "Tu misión es inspirar al mundo a través de la expresión artística, el optimismo y la alegría de vivir.",
    loveStyle: "Buscador de la chispa, el humor y la diversión. Disfrutas de citas creativas y conversaciones coloridas.",
    challenge: "Evitar la dispersión de energía y profundizar en los compromisos emocionales.",
    compatiblePaths: [3, 6, 9]
  },
  4: {
    title: "El Constructor Estratégico",
    archetype: "El Emperador",
    mission: "Tu misión es crear bases sólidas, orden y seguridad perdurable para ti y tus seres queridos.",
    loveStyle: "Leal, constante y protector. Demuestras tu afecto garantizando estabilidad y estando presente en momentos clave.",
    challenge: "Soltar la rigidez frente al cambio y dar espacio a la flexibilidad espontánea.",
    compatiblePaths: [2, 4, 8, 22]
  },
  5: {
    title: "El Explorador Libertario",
    archetype: "El Hierofante",
    mission: "Tu misión es experimentar la libertad, adaptarte a los cambios y expandir tus horizontes culturales y vitales.",
    loveStyle: "En el amor necesitas aventura, viajes e intercambios mentales vivaces. No toleras la rutina opresiva.",
    challenge: "Aprender a canalizar la impaciencia y encontrar constancia en lo valioso.",
    compatiblePaths: [1, 5, 7]
  },
  6: {
    title: "El Sanador del Hogar",
    archetype: "Los Enamorados",
    mission: "Tu misión es nutrir, proteger y brindar amor y consejo sabio a tu familia y comunidad.",
    loveStyle: "Profundamente cariñoso, protector y comprometido. Tu objetivo en las citas es construir un hogar cálido.",
    challenge: "Evitar la sobreprotección y el exceso de responsabilidad por los demás.",
    compatiblePaths: [2, 3, 6, 9, 33]
  },
  7: {
    title: "El Buscador de la Verdad",
    archetype: "El Carro",
    mission: "Tu misión es indagar en los misterios de la vida, desarrollar el intelecto y cultivar la espiritualidad reflexiva.",
    loveStyle: "Analítico y selectivo. Necesitas un compañero con quien compartir diálogos profundos y respetar espacios de silencio.",
    challenge: "Superar la tendencia al aislamiento y confiar en el sentir del corazón.",
    compatiblePaths: [1, 5, 7]
  },
  8: {
    title: "El Eficiente del Poder",
    archetype: "La Justicia",
    mission: "Tu misión es dominar la materia, el emprendimiento y el uso ético de la abundancia y la autoridad.",
    loveStyle: "Seguro de ti mismo y generoso. Te atrae la ambición noble y buscas construir un imperio junto a tu pareja.",
    challenge: "Equilibrar el enfoque en el éxito material con la ternura emocional.",
    compatiblePaths: [2, 4, 8]
  },
  9: {
    title: "El Humanista Sabio",
    archetype: "El Ermitaño",
    mission: "Tu misión es servir al bien común, perdonar viejos ciclos y transmitir compasión universal.",
    loveStyle: "Romántico, idealista y de gran corazón. Buscas una relación con propósito e impacto positivo en el mundo.",
    challenge: "Soltar el apego al pasado y no frustrarte si el mundo no es perfecto.",
    compatiblePaths: [3, 6, 9]
  },
  11: {
    title: "Maestro de la Intuición",
    archetype: "El Iluminado",
    mission: "Número Maestro. Tu misión es canalizar la iluminación espiritual e inspirar la transformación de la conciencia.",
    loveStyle: "Intensidad emocional y espiritual. Buscas una conexión de almas que trascienda lo terrenal.",
    challenge: "Manejar la alta sensibilidad y el estrés nervioso.",
    compatiblePaths: [2, 6, 11]
  },
  22: {
    title: "Constructor Maestro",
    archetype: "Constructor Maestro",
    mission: "Número Maestro. Tu misión es materializar visiones a gran escala que beneficien a generaciones futuras.",
    loveStyle: "Gran visión compartida y lealtad inquebrantable. Necesitas una pareja de gran madurez.",
    challenge: "Manejar la presión de tus propios ideales elevados.",
    compatiblePaths: [4, 8, 22]
  },
  33: {
    title: "Sanador de la Humanidad",
    archetype: "Sanador Maestro",
    mission: "Número Maestro. Tu misión es encarnar el amor incondicional y el servicio desinteresado.",
    loveStyle: "Compasión infinita y devoción amorosa.",
    challenge: "Mantener el equilibrio personal y no desgastarte emocionalmente.",
    compatiblePaths: [6, 9, 33]
  }
};

// ─── DETALLES DE ELEMENTOS ASTRALES ─────────────────────────────────────────
export const ELEMENT_DETAILS = {
  Fuego: {
    title: "La Chispa Vital & la Pasión",
    traits: "Apasionado, dinámico, directo, entusiasta y valiente.",
    loveStyle: "En el amor pones intensidad inmediata, te apasionan las aventuras spontáneas y necesitas mantener encendida la chispa del entusiasmo.",
    complement: "El Aire alimenta tu llama; la Tierra le da contención firme."
  },
  Tierra: {
    title: "La Raíz Firme & el Confort",
    traits: "Leal, constante, práctico, sensorial y de gran solidez.",
    loveStyle: "En las citas prefieres construir confianza a paso firme, disfrutar del confort físico, la buena mesa y la seguridad mutua.",
    complement: "El Agua nutre tu tierra; el Fuego estimula tu acción."
  },
  Aire: {
    title: "El Viento del Pensamiento & la Mente",
    traits: "Comunicativo, visionario, sociables, curioso e ingenioso.",
    loveStyle: "En las relaciones te enamoras de las palabras, la afinidad intelectual, el sentido del humor y el respeto a la libertad personal.",
    complement: "El Fuego enciende tus ideales; el Agua suaviza tu lógica."
  },
  Agua: {
    title: "El Océano Emocional & la Intuición",
    traits: "Intuitivo, empático, romántico, perceptivo y protector.",
    loveStyle: "En el romance buscas la fusión de almas, una sensibilidad receptiva y la seguridad de ser comprendido en tu profundidad.",
    complement: "La Tierra encauza tus emociones; el Aire te brinda perspectiva."
  }
};

// Puntuación de compatibilidad por elemento (máx 40 pts)
const ELEMENT_SCORES = {
  Fuego:  { Fuego: 40, Aire: 32, Tierra: 16, Agua:   8 },
  Tierra: { Tierra: 40, Agua: 32, Fuego:  16, Aire:   8 },
  Aire:   { Aire: 40, Fuego: 32, Agua:   16, Tierra:  8 },
  Agua:   { Agua: 40, Tierra: 32, Aire:   16, Fuego:   8 },
};

// Números de vida compatibles según numerología tradicional
const COMPATIBLE_PATHS = {
  1:  [1, 5, 7],
  2:  [2, 4, 6, 8, 11],
  3:  [3, 6, 9],
  4:  [2, 4, 8, 22],
  5:  [1, 5, 7],
  6:  [2, 3, 6, 9, 33],
  7:  [1, 5, 7],
  8:  [2, 4, 8],
  9:  [3, 6, 9],
  11: [2, 6, 11],
  22: [4, 8, 22],
  33: [6, 9, 33],
};

export function calculateResonance(profileA, profileB) {
  const elementScore = ELEMENT_SCORES[profileA.element]?.[profileB.element] ?? 16;

  const pathA = profileA.life_path_number ?? profileA.lifePath;
  const pathB = profileB.life_path_number ?? profileB.lifePath;
  let lifePathScore = 12;
  if (pathA === pathB) {
    lifePathScore = 40;
  } else if (COMPATIBLE_PATHS[pathA]?.includes(pathB)) {
    lifePathScore = 30;
  }

  const archetypeScore = profileA.archetype === profileB.archetype ? 20 : 10;

  return Math.min(100, elementScore + lifePathScore + archetypeScore);
}

export const archetypes = {
  1: "El Mago", 2: "La Sacerdotisa", 3: "La Emperatriz", 4: "El Emperador",
  5: "El Hierofante", 6: "Los Enamorados", 7: "El Carro", 8: "La Justicia",
  9: "El Ermitaño", 11: "El Iluminado", 22: "Constructor Maestro", 33: "Sanador Maestro"
};

export function calculateFullNumerology(dobStr = '1995-02-01', fullName = 'Maverick') {
  if (!dobStr) dobStr = '1995-02-01';
  const dateObj = new Date(dobStr);
  const year = dateObj.getUTCFullYear() || 1995;
  const month = dateObj.getUTCMonth() + 1 || 2;
  const day = dateObj.getUTCDate() || 1;

  const reduceNumber = (num, allowMaster = true) => {
    let sum = num;
    while (sum > 9) {
      if (allowMaster && (sum === 11 || sum === 22 || sum === 33)) break;
      sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
    }
    return sum;
  };

  // 1. Fecha de Nacimiento
  const dobDigits = dobStr.replace(/-/g, '').split('').map(Number);
  const lifePath = reduceNumber(dobDigits.reduce((a, b) => a + b, 0), true);
  const attitude = reduceNumber(day + month, false);
  const yearSum = year.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  const generation = reduceNumber(yearSum, false);
  const birthDay = reduceNumber(day, true);

  // 2. Nombre (Pitagórico)
  const letterValues = {
    A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9,
    J:1, K:2, L:3, M:4, N:5, O:6, P:7, Q:8, R:9,
    S:1, T:2, U:3, V:4, W:5, X:6, Y:7, Z:8
  };
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const cleanName = (fullName || 'Sintonizador').toUpperCase().replace(/[^A-Z]/g, '');

  let totalLetters = 0, totalVowels = 0, totalConsonants = 0;
  for (let char of cleanName) {
    const val = letterValues[char] || 0;
    totalLetters += val;
    if (vowels.includes(char)) totalVowels += val;
    else totalConsonants += val;
  }

  const expression = reduceNumber(totalLetters || 7, true);
  const soul = reduceNumber(totalVowels || 9, true);
  const personality = reduceNumber(totalConsonants || 7, true);

  // 3. Madurez
  const maturity = reduceNumber(lifePath + expression, true);

  // 4. Ciclos de Predicción Personales
  const today = new Date();
  const curYear = today.getUTCFullYear();
  const curMonth = today.getUTCMonth() + 1;
  const curDay = today.getUTCDate();

  const personalYear = reduceNumber(day + month + curYear.toString().split('').map(Number).reduce((a, b) => a + b, 0), false);
  const personalMonth = reduceNumber(personalYear + curMonth, false);
  const personalDay = reduceNumber(personalMonth + curDay, false);

  return {
    lifePath,
    attitude,
    generation,
    birthDay,
    expression,
    soul,
    personality,
    maturity,
    personalYear,
    personalMonth,
    personalDay
  };
}

export const NUMEROLOGY_DAILY_ADVICE = {
  1: "Hoy es un día de nuevos inicios. Toma la iniciativa, siembra proyectos y confía en tu fuerza pionera.",
  2: "Día ideal para la diplomacia, la paciencia y el trabajo en pareja. Escucha tu intuición y evita impulsividades.",
  3: "Energía de expresión creativa y optimismo. Comunica tus ideas, ríe y comparte tu luz con el mundo.",
  4: "Día para organizar, estructurar y dar pasos firmes hacia la seguridad material y emocional.",
  5: "Día de movimiento, libertad y sorpresas. Ábrete al cambio y experimenta nuevas experiencias.",
  6: "Foco en la familia, el hogar y el servicio amoroso. Nutre tus vínculos y brinda tu apoyo compasivo.",
  7: "Día de introspección, lectura y meditación. Conéctate con la sabiduría interior y el descanso del espíritu.",
  8: "Día de abundancia y liderazgo ejecutivo. Canaliza tus ambiciones y toma decisiones financieras sólidas.",
  9: "Cierre de ciclo, perdón y renovación. Soltar lo que ya no sirve abre espacio para la abundancia del cosmos."
};

export function calculateAstralProfile(dob) {
  const dateObj = new Date(dob);
  const day = dateObj.getUTCDate();
  const month = dateObj.getUTCMonth() + 1;

  let index = month - 1;
  if (day > zodiacData[index].end) index++;
  const signObj = zodiacData[index];

  let digits = dob.replace(/-/g, '').split('').map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }

  return {
    ...signObj,
    lifePath: sum,
    archetype: archetypes[sum] || "Desconocido"
  };
}

// ─── CÁLCULO DE FASE LUNAR ───────────────────────────────────────────────────
export function calculateMoonPhase(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const diffDays = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const cycleDays = diffDays % 29.53058770576;
  const normalized = cycleDays < 0 ? cycleDays + 29.53058770576 : cycleDays;

  const illumination = Math.round((1 - Math.cos((normalized / 29.53058770576) * 2 * Math.PI)) * 50);

  if (normalized < 1.84566)  return { name: "Luna Nueva", symbol: "🌑", illumination, advice: "Siembra intenciones puras en el silencio." };
  if (normalized < 5.53699)  return { name: "Luna Creciente", symbol: "🌒", illumination, advice: "Los primeros brotes de tu deseo comienzan a emerger." };
  if (normalized < 9.22831)  return { name: "Cuarto Creciente", symbol: "🌓", illumination, advice: "Supera los obstáculos iniciales con voluntad infatigable." };
  if (normalized < 12.91963) return { name: "Luna Gibosa Creciente", symbol: "🌔", illumination, advice: "Perfecciona tus proyectos; la culminación está cerca." };
  if (normalized < 16.61096) return { name: "Luna Llena", symbol: "🌕", illumination, advice: "Momento de máxima claridad, celebración y revelación mística." };
  if (normalized < 20.30228) return { name: "Luna Gibosa Menguante", symbol: "🌖", illumination, advice: "Comparte tu conocimiento y agradece lo cosechado." };
  if (normalized < 23.99361) return { name: "Cuarto Menguante", symbol: "🌗", illumination, advice: "Libera lo que ya no sirve y purifica tu campo energético." };
  if (normalized < 27.68493) return { name: "Luna Menguante", symbol: "🌘", illumination, advice: "Descansa, reflexiona y prepárate para el nuevo ciclo." };
  return { name: "Luna Nueva", symbol: "🌑", illumination, advice: "Siembra intenciones puras en el silencio." };
}

// ─── MAZO DE ARCANOS MAYORES DEL TAROT ───────────────────────────────────────
export const TAROT_CARDS = [
  { id: 0,  name: "El Loco",               symbol: "🃏", keyword: "Inicios & Fe",          meaning: "Confía en el salto hacia lo desconocido. Tu espíritu está libre de viejas ataduras." },
  { id: 1,  name: "El Mago",               symbol: "🪄", keyword: "Manifestación",         meaning: "Posees todos los elementos necesarios para materializar tus visiones hoy." },
  { id: 2,  name: "La Sacerdotisa",        symbol: "📜", keyword: "Intuición Profunda",    meaning: "Mira más allá de las apariencias. Las respuestas habitan en el silencio interior." },
  { id: 3,  name: "La Emperatriz",         symbol: "👑", keyword: "Abundancia",            meaning: "La energía de creación y nutrición te envuelve. Florece lo que siembras." },
  { id: 4,  name: "El Emperador",          symbol: "🏛️", keyword: "Estructura & Poder",     meaning: "Establece límites claros y organiza tus metas con autoridad compasiva." },
  { id: 5,  name: "El Hierofante",         symbol: "🔑", keyword: "Sabiduría Ancestral",   meaning: "Busca la enseñanza sagrada y conéctate con tus principios esenciales." },
  { id: 6,  name: "Los Enamorados",        symbol: "💖", keyword: "Alineación del Corazón", meaning: "Una elección importante requiere coherencia entre tus valores y tus deseos." },
  { id: 7,  name: "El Carro",              symbol: "🛞", keyword: "Victoria & Voluntad",    meaning: "Mantén el enfoque en tu dirección. Vencerás las fuerzas contrapuestas." },
  { id: 8,  name: "La Fuerza",             symbol: "🦁", keyword: "Dominio Compasivo",     meaning: "La verdadera fortaleza no impone; doma las sombras mediante la dulzura." },
  { id: 9,  name: "El Ermitaño",           symbol: "🕯️", keyword: "Luz Interior",          meaning: "Tómate un momento de retiro. Tu propia linterna iluminará el siguiente paso." },
  { id: 10, name: "La Rueda de la Fortuna", symbol: "☸️", keyword: "Giro del Destino",      meaning: "Los ciclos cambian a tu favor. Fluye con la corriente del cosmos." },
  { id: 11, name: "La Justicia",           symbol: "⚖️", keyword: "Equilibrio & Verdad",    meaning: "La verdad prevalece. Actúa con honestidad e imparcialidad en cada acto." },
  { id: 12, name: "El Colgado",            symbol: "⏳", keyword: "Pausa Sagrada",         meaning: "Ver el mundo desde otra perspectiva revelará la solución que buscabas." },
  { id: 13, name: "Transmutación",         symbol: "🦋", keyword: "Renacimiento",          meaning: "Lo viejo muere para dar paso a una versión infinitamente más elevada." },
  { id: 14, name: "La Templanza",          symbol: "🍷", keyword: "Alquimia & Armonía",    meaning: "Modera los extremos y mezcla tus energías con paciencia y serenidad." },
  { id: 15, name: "La Ilusión",            symbol: "🔗", keyword: "Liberación",            meaning: "Reconoce las cadenas invisibles. Tienes el poder de romper cualquier ilusión." },
  { id: 16, name: "La Torre",              symbol: "⚡", keyword: "Revelación",            meaning: "Las estructuras falsas se derrumban para dejar al descubierto la verdad pura." },
  { id: 17, name: "La Estrella",           symbol: "⭐", keyword: "Esperanza Radiante",    meaning: "La inspiración cósmica te bendice. El éter renueva tus fuerzas." },
  { id: 18, name: "La Luna",               symbol: "🌙", keyword: "Percepción Sutil",      meaning: "Sintoniza tus sueños y corazonadas. Tu sensibilidad mística está amplificada." },
  { id: 19, name: "El Sol",                symbol: "☀️", keyword: "Claridad & Éxito",      meaning: "Luz plena en tu camino. Brilla sin temor, tu energía es contagiosa." },
  { id: 20, name: "El Juicio",             symbol: "🎺", keyword: "Llamado del Alma",      meaning: "Despierta a un nuevo nivel de conciencia. Tu propósito te convoca." },
  { id: 21, name: "El Mundo",              symbol: "🌍", keyword: "Plenitud Total",        meaning: "Cierre victorioso de un gran ciclo. Estás en sintonía con el todo." }
];

export function getDailyTarotCard(userId = 'guest', dateStr = new Date().toISOString().split('T')[0]) {
  const seedStr = `${userId}_${dateStr}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAROT_CARDS.length;
  return TAROT_CARDS[index];
}