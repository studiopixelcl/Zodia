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

// ─── NUMEROLOGÍA CABALÍSTICA & EL ÁRBOL DE LA VIDA (SEFIROT) ────────────────
export const TREE_OF_LIFE_SEFIROT = {
  1: {
    sefira: "Kéter",
    hebrew: "כתר",
    title: "La Corona Primordial",
    pillar: "Pilar del Equilibrio (Columna Central)",
    archetype: "El Iniciador Supremo",
    element: "Luz Pura",
    meaning: "Kéter representa el origen de toda manifestación, la chispa de voluntad pura antes de dividirse. Las personas con este camino son catalizadoras naturales que abren senderos donde otros sólo ven vacío.",
    soulMission: "Manifestar liderazgo consciente, confiar en la propia visión original y disolver el miedo a caminar en soledad.",
    love: "En el amor, valoran profundamente la autenticidad y el espacio individual. No toleran la manipulación ni la codependencia; buscan una pareja que admire su empuje y que posea sus propios sueños e independencia.",
    work: "Pioneros por excelencia: emprendimiento, dirección ejecutiva, innovación y toma de decisiones bajo presión. Prefieren crear sus propias reglas a seguir estructuras preestablecidas.",
    money: "Capacidad innata para generar riqueza a partir de ideas vanguardistas. Su desafío financiero es mantener la disciplina a largo plazo y no dispersar el capital en múltiples inicios sin consolidar.",
    tikun: "Aprender a delegar y escuchar activamente; transformar la autosuficiencia rígida en cooperación noble."
  },
  2: {
    sefira: "Jojmá",
    hebrew: "חכמה",
    title: "La Sabiduría Intuitiva",
    pillar: "Pilar de la Misericordia (Columna Derecha)",
    archetype: "La Consciencia Receptiva",
    element: "Agua Espiritual",
    meaning: "Jojmá es la primera emanación de luz que contiene todas las posibilidades. Es la intuición relámpago, la sabiduría que precede al lenguaje y la capacidad de percibir la armonía oculta entre las partes.",
    soulMission: "Tejer la paz, la diplomacia y el entendimiento mutuo. Su poder reside en la empatía y la sintonía emocional.",
    love: "Buscadores de la unión sagrada. Para el 2, una relación es un refugio de ternura, diálogo comprensivo y lealtad. Son compañeros extremadamente considerados y atentos al detalle afectivo.",
    work: "Sobresalen en la mediación, asesoría estratégica, recursos humanos, psicología, diplomacia y alianzas clave. Tienen un sexto sentido para detectar tensiones antes de que estallen.",
    money: "Enfoque prudente y compartido de la economía. Prosperan a través de sociedades transparentes y proyectos conjuntos donde reine la confianza mutua.",
    tikun: "Aprender a decir 'no' sin culpa. Dejar de sacrificarse por complacer a otros y validar las propias necesidades emocionales."
  },
  3: {
    sefira: "Biná",
    hebrew: "בינה",
    title: "El Entendimiento Creador",
    pillar: "Pilar del Rigor (Columna Izquierda)",
    archetype: "La Matriz Expresiva",
    element: "Fuego Inteligente",
    meaning: "Biná da forma y estructura tangible a las ideas. En la numerología del 3, esto se traduce en una desbordante fuerza de expresión artística, palabra magnética y optimismo comunicativo.",
    soulMission: "Inspirar a su entorno mediante la alegría, la comunicación elocuente y la belleza estética.",
    love: "En el romance son vivaces, apasionados y seductores. Necesitan admiración mutua, ligereza, risas compartidas y libertad creadora para desplegar todo su encanto.",
    work: "Brillan en el arte, diseño, marketing, oratoria, literatura, entretenimiento y docencia creativa. Su mente rápida encuentra soluciones ingeniosas y frescas a problemas complejos.",
    money: "El dinero fluye con facilidad a través del carisma y las conexiones públicas. Su gran reto es la administración ordenada para no derrochar por impulsos emocionales.",
    tikun: "Focalizar la energía. Superar la superficialidad o la dispersión y comprometerse con profundidad en los proyectos y relaciones."
  },
  4: {
    sefira: "Jésed / Gevurá",
    hebrew: "חסד וגבורה",
    title: "El Constructor del Orden",
    pillar: "Intersección de Equilibrio y Forma",
    archetype: "El Guardián de la Estructura",
    element: "Tierra Sagrada",
    meaning: "El 4 encarna la estabilidad y la perseverancia inquebrantable. Representa la capacidad de asentar las leyes universales en la materia tangible mediante trabajo impecable.",
    soulMission: "Crear cimientos duraderos de seguridad, justicia y prosperidad para su familia y comunidad.",
    love: "Lealtad y fiabilidad absoluta. Demuestran su amor mediante la presencia incondicional, la protección material y la construcción de un hogar seguro a largo plazo.",
    work: "Arquitectura, ingeniería, derecho, gestión financiera, operaciones y administración estratégica. Nadie organiza procesos complejos con tanta pulcritud y constancia.",
    money: "Mentalidad patrimonial sólida. Ahorran e invierten a paso firme en bienes tangibles. Rara vez caen en especulaciones arriesgadas.",
    tikun: "Abrirse a la flexibilidad. Aprender que el cambio es parte natural de la vida y soltar la necesidad de controlar cada variable."
  },
  5: {
    sefira: "Tiféret",
    hebrew: "תפארת",
    title: "La Belleza & la Armonía del Corazón",
    pillar: "Pilar Central (El Corazón del Árbol)",
    archetype: "El Explorador Integrador",
    element: "Aire Vital",
    meaning: "Tiféret es el centro neurálgico del Árbol de la Vida, donde convergen el cielo y la tierra. En el número 5, se manifiesta como el anhelo de libertad, dinamismo vital, adaptabilidad y belleza integradora.",
    soulMission: "Expandir la conciencia a través del viaje, la experimentación sensorial y la comprensión de diferentes culturas y visiones.",
    love: "Aventureros y magnéticos. En pareja necesitan estimulación constante, proyectos compartidos y respeto irrestricto por su autonomía.",
    work: "Comercio internacional, turismo, medios de comunicación, consultoría de cambio y profesiones que impliquen movilidad y dinamismo constante.",
    money: "Generan ingresos mediante la adaptabilidad y el aprovechamiento veloz de oportunidades. Su lección es crear un fondo de reserva para etapas de transición.",
    tikun: "Canalizar la inquietud interna en constancia con propósito, evitando el escape de compromisos necesarios."
  },
  6: {
    sefira: "Netzaj",
    hebrew: "נצח",
    title: "La Victoria del Afecto",
    pillar: "Pilar de la Misericordia (Victoria Emocional)",
    archetype: "El Protector Nutricio",
    element: "Fuego del Corazón",
    meaning: "Netzaj representa la fuerza arrolladora del amor, los sentimientos nobles y la perseverancia que vence los obstáculos por devoción.",
    soulMission: "Sanar y embellecer su entorno familiar y comunitario a través de la responsabilidad afectiva.",
    love: "El número más devoto y comprometido con el hogar y la pareja. Su mayor alegría es cuidar, construir armonía doméstica y ser un pilar de calma emocional.",
    work: "Salud, psicología, docencia, diseño de interiores, gastronomía, mediación social y proyectos orientados al cuidado del ser humano.",
    money: "Utilizan los recursos para garantizar el bienestar de sus seres queridos. Tienen un ojo impecable para la calidad y la estética del hogar.",
    tikun: "Evitar el perfeccionismo sobre los demás y no asumir cargas ajenas que impidan el crecimiento de quienes aman."
  },
  7: {
    sefira: "Hod",
    hebrew: "הוד",
    title: "El Esplendor de la Verdad",
    pillar: "Pilar del Rigor (Claridad Intelectual)",
    archetype: "El Filósofo Sabio",
    element: "Agua Mental",
    meaning: "Hod simboliza la mente analítica iluminada, la verdad científica y mística, la introspección y la capacidad de discernir lo ilusorio de lo eterno.",
    soulMission: "Buscar la sabiduría profunda, investigar las leyes de la existencia y transmitir conocimiento reflexivo.",
    love: "Selectivos y profundos. Necesitan una conexión mental y espiritual genuina. Valoran los momentos compartidos de silencio fértil y diálogo elevado.",
    work: "Investigación científica, filosofía, desarrollo tecnológico, análisis estratégico, literatura, teología y docencia universitaria.",
    money: "El dinero es una herramienta para ganar independencia y tiempo de estudio. Se guían por la ética y la sobriedad en sus gastos.",
    tikun: "Bajar de la mente al corazón; confiar en las personas y no recluirse en una torre de marfil de aislamiento defensivo."
  },
  8: {
    sefira: "Yesod",
    hebrew: "יסוד",
    title: "El Fundamento de la Manifestación",
    pillar: "Pilar del Equilibrio (El Canal)",
    archetype: "El Maestro de la Abundancia",
    element: "Fuerza Vital Conectora",
    meaning: "Yesod es el embudo cósmico donde todas las energías superiores se condensan para manifestarse en el mundo físico. En el número 8, representa el dominio de la materia, la autoridad y el éxito tangible.",
    soulMission: "Dirigir grandes proyectos y utilizar el poder económico y organizativo con justicia y beneficio colectivo.",
    love: "Protectores, generosos y leales. Admiran a parejas con ambición personal, madurez de carácter y visión de grandeza.",
    work: "Alta dirección ejecutiva, finanzas, banca, bienes raíces, grandes emprendimientos e instituciones de impacto macroeconómico.",
    money: "Atracción natural de la abundancia. Su comprensión del flujo del capital les permite construir imperios financieros duraderos.",
    tikun: "Vincular el éxito terrenal con la compasión y el desapego, recordando que el poder es una herramienta de servicio y no de dominación."
  },
  9: {
    sefira: "Maljut",
    hebrew: "מלכות",
    title: "El Reino de la Plenitud",
    pillar: "Pilar del Equilibrio (La Realización)",
    archetype: "El Sabio Universal",
    element: "Tierra Receptora",
    meaning: "Maljut es la culminación de todo el Árbol de la Vida, donde la luz se hace visible. En el número 9, encarna la sabiduría integradora, el altruismo y el cierre victorioso de ciclos.",
    soulMission: "Servir al bien común, practicar el perdón universal y abrir paso a una conciencia planetaria más empática.",
    love: "Amor generoso, maduro e incondicional. Buscan una relación profunda que comparta valores éticos y trascendencia vital.",
    work: "Derechos humanos, diplomacia internacional, artes transformadoras, sanación holística y liderazgo humanitario.",
    money: "Experimentan que mientras más dan con generosidad desinteresada, más prosperidad reciben de fuentes inesperadas.",
    tikun: "Aprender a soltar el pasado sin amargura, cerrando capítulos con gratitud para recibir lo nuevo."
  },
  11: {
    sefira: "Da'at",
    hebrew: "דעת",
    title: "El Conocimiento Supra-Consciente",
    pillar: "Pilar Central (El Vórtice Secreto)",
    archetype: "El Iluminador de Almas",
    element: "Luz Trascendental",
    meaning: "Da'at es la Sefirá oculta que une la mente y el corazón divinos. El 11 es un puente entre dimensiones, con una sensibilidad psíquica e inspiradora fuera de lo común.",
    soulMission: "Ser un faro de iluminación moral y espiritual en tiempos de transición colectiva.",
    love: "Conexión de almas gemelas. Exigen una sintonía telepática y emocional muy alta; no toleran relaciones superficiales.",
    work: "Liderazgo espiritual, psicología profunda, creación artística transformadora y docencia visionaria.",
    money: "La abundancia llega cuando se mantienen fieles a su vocación auténtica y no se comprometen con metas puramente materialistas.",
    tikun: "Cuidar su sistema nervioso, aprender a enraizarse en la tierra y no dejarse abrumar por el exceso de sensibilidad ambiental."
  },
  22: {
    sefira: "El Gran Arquitecto (Kéter en Maljut)",
    hebrew: "כתר ומלכות",
    title: "El Constructor Universal",
    pillar: "Pilar del Equilibrio Cósmico",
    archetype: "El Maestro de Obras",
    element: "Tierra Sagrada Iluminada",
    meaning: "El 22 toma los ideales más elevados y los convierte en realidades institucionales, científicas o sociales que perduran durante siglos.",
    soulMission: "Crear obras a escala masiva que eleven la calidad de vida y la conciencia de la humanidad.",
    love: "Compañerismo de destino. Necesitan una pareja que comprenda la magnitud de su visión y sea un refugio incondicional de paz.",
    work: "Grandes obras civiles, diseño de sistemas globales, reformas educativas o empresariales a escala internacional.",
    money: "Manejo de presupuestos y patrimonios de gran envergadura con honestidad y visión futurista.",
    tikun: "Superar el temor a fracasar en misiones grandes y mantener la humildad en la cumbre del éxito."
  },
  33: {
    sefira: "El Corazón Crístico (Tiféret Supremo)",
    hebrew: "לב קדוש",
    title: "El Sanador Universal",
    pillar: "Pilar de la Compasión Infinita",
    archetype: "El Maestro del Amor Puro",
    element: "Amor Incondicional",
    meaning: "El 33 es la vibración más elevada del servicio desinteresado y la sanación por presencia.",
    soulMission: "Sanar el dolor ajeno a través del amor compasivo, la caridad noble y la enseñanza del perdón.",
    love: "Amor devocional sublime. Capacidad inagotable de acogida y comprensión emocional.",
    work: "Sanación, docencia compasiva, liderazgo humanitario y guía de almas en procesos de renacimiento.",
    money: "El dinero es visto como energía pura de circulación para bendecir proyectos de auxilio mutuo.",
    tikun: "Cuidar de sí mismos con el mismo fervor con que cuidan al mundo, evitando el agotamiento del cuerpo físico."
  }
};

// ─── ANÁLISIS EXHAUSTIVO DE CADA SIGNO ZODIACAL (ENCICLOPEDIA PROFUNDA) ──────
export const ZODIAC_COMPREHENSIVE_READINGS = {
  Aries: {
    psychology: "Regido por Marte, Aries percibe la vida como una constante invitación a la acción valiente. Su mente es directa, intuitiva y alérgica a los rodeos. Procesan las situaciones tomando la iniciativa antes de que el miedo pueda paralizarlos.",
    love: "En el amor, Aries es un conquistador apasionado que vive el cortejo con intensidad electrizante. Busca relaciones donde exista admiración mutua, dinamismo y retos compartidos. Se aburre rápidamente de la rutina pasiva. Valora la franqueza absoluta y prefiere una discusión sincera a un silencio resentido.",
    work: "En el ámbito profesional, son líderes natos, emprendedores incansables y excelentes para desatascar proyectos estancados. Se desempeñan mejor cuando tienen autonomía para decidir y ejecutar. Su punto fuerte es la arrancada y la audacia ejecutiva.",
    money: "Su relación con el dinero es dinámica: les gusta generar con fuerza y no temen asumir riesgos calculados en inversiones. Su aprendizaje financiero reside en no dejarse llevar por compras impulsivas motivadas por la adrenalina del momento.",
    shadowWork: "Aprender a cultivar la paciencia y reconocer que el ritmo de los demás no siempre coincide con el suyo. Integrar la diplomacia sin perder su fuego natural."
  },
  Tauro: {
    psychology: "Regido por Venus, Tauro es el maestro de la manifestación tangible y el discernimiento sensorial. Su mente evalúa cada paso buscando solidez, permanencia y bienestar genuino. No se apresura, pues sabe que lo valioso requiere tiempo de maduración.",
    love: "En los vínculos afectivos, Tauro ofrece un amor fiel, afectuoso y profundamente protector. Para Tauro el romance se expresa a través de los sentidos: caricias, buena cocina, detalles de calidad y un hogar sereno. Valora la estabilidad y la certeza de que su pareja estará allí en los momentos cruciales.",
    work: "Trabajadores ejemplares, metódicos y sumamente perseverantes. Sobresalen en finanzas, agricultura, diseño, arquitectura, gastronomía y gestión de patrimonio. Son el ancla de cualquier equipo gracias a su sensatez y lealtad.",
    money: "Poseen un instinto natural para el ahorro, la inversión prudente y la multiplicación de activos. Saben detectar el valor real de las cosas y huyen de las modas financieras efímeras.",
    shadowWork: "Flexibilizar su apego a lo conocido y no temer a los cambios que la vida propone. Soltar la posesividad y la terquedad defensiva."
  },
  Géminis: {
    psychology: "Regido por Mercurio, Géminis es la mente en constante danza de ideas y conexiones. Su curiosidad insaciable los impulsa a explorar múltiples perspectivas de la realidad, convirtiéndolos en interlocutores fascinantes y polifacéticos.",
    love: "En las citas, Géminis se enamora a través del intelecto y el sentido del humor. Necesitan una pareja que sea al mismo tiempo su mejor amigo, con quien tener conversaciones nocturnas memorables y compartir nuevos descubrimientos. La monotonía es su mayor enemigo afectivo.",
    work: "Brillan en el periodismo, comunicación, relaciones públicas, marketing digital, tecnología y pedagogía. Su agilidad mental les permite procesar grandes volúmenes de información y coordinar varias tareas simultáneamente.",
    money: "Suelen tener múltiples fuentes de ingresos gracias a sus diversos talentos. Su desafío financiero es mantener un seguimiento constante de sus gastos para evitar la dispersión.",
    shadowWork: "Aprender a profundizar y comprometerse con perseverancia en un proyecto o vínculo, resistiendo la tentación de huir cuando surge la rutina."
  },
  Cáncer: {
    psychology: "Gobernado por la Luna, Cáncer posee una inteligencia emocional y una memoria intuitiva excepcionales. Perciben las corrientes subterráneas de cualquier ambiente y tienen un don natural para crear refugios emocionales donde otros se sienten seguros.",
    love: "En el amor, Cáncer entrega el corazón por completo. Son protectores, empáticos y profundamente románticos. Buscan una relación con raíces hondas, basada en la lealtad incondicional, el respeto a la intimidad y la construcción de un proyecto de vida compartido.",
    work: "Sobresalen en la medicina, psicología, educación, recursos humanos, hotelería y cualquier labor que requiera cuidar, nutrir o guiar a personas. Son leales a las instituciones que los respetan.",
    money: "Excelente instinto para la seguridad financiera y la protección patrimonial. Ahorran pensando en el bienestar futuro de su familia y tienen un olfato agudo para inversiones seguras.",
    shadowWork: "Soltar el resentimiento del pasado y aprender a comunicarse sin encerrarse en su caparazón cuando se sienten vulnerables."
  },
  Leo: {
    psychology: "Regido por el Sol, Leo encarna el principio de la dignidad personal, la calidez expansiva y la autoexpresión luminosa. Su mente opera desde el corazón y la generosidad; inspiran a otros a creer en su propio valor.",
    love: "En el romance, Leo es apasionado, caballeroso y sumamente generoso. Le fascina celebrar a su pareja, organizar citas extraordinarias y llenar la relación de entusiasmo. A cambio, necesita reconocimiento sincero, lealtad absoluta y admiración mutua.",
    work: "Líderes natos, creativos, directores, actores, conferencistas y emprendedores. Su presencia escénica y carisma natural elevan la moral de cualquier equipo de trabajo.",
    money: "Atraen la prosperidad gracias a su confianza personal. Les gusta disfrutar de la abundancia con estilo y compartirla con sus seres queridos; su aprendizaje es no gastar para impresionar a terceros.",
    shadowWork: "Trascender la necesidad de validación externa y aprender que la verdadera nobleza reside en la humildad silenciosa."
  },
  Virgo: {
    psychology: "Regido por Mercurio en su faceta analítica y práctica, Virgo posee un ojo clínico para el detalle y la mejora continua. Su mente es metódica, noble y guiada por una genuina vocación de servicio útil.",
    love: "En el amor, Virgo demuestra su afecto a través de actos prácticos de servicio y cuidado diario: recordar tus gustos, ayudarte a resolver problemas y estar presente. Son compañeros leales, respetuosos y de una madurez invaluable.",
    work: "Insuperables en análisis de datos, medicina, edición, programación, control de calidad, administración y auditoría. Su disciplina garantiza resultados impecables.",
    money: "Financieramente sobrios, analíticos y sumamente inteligentes. Comparan, presupuestan e invierten con cautela, garantizando una sólida tranquilidad económica a largo plazo.",
    shadowWork: "Apaciguar la autocrítica implacable y aceptar que la perfección es un ideal y que la imperfección es humana y bella."
  },
  Libra: {
    psychology: "Regido por Venus, Libra busca incansablemente el equilibrio, la justicia y la armonía estética. Su mente evalúa todos los puntos de vista antes de juzgar, dotándolos de una empatía y un refinamiento social extraordinarios.",
    love: "Para Libra, el amor es una obra de arte compartida. Buscan un compañero de vida con quien cultivar la cortesía, el romance continuo, la complicidad intelectual y la belleza estética en el hogar.",
    work: "Diplomacia, leyes, mediación de conflictos, diseño de moda, arquitectura, relaciones corporativas y curaduría artística. Crean consensos donde otros solo ven discordia.",
    money: "Disfrutan del dinero como medio para rodearse de belleza, cultura y confort. Su desafío es no aplazar decisiones financieras estratégicas por miedo a equivocarse.",
    shadowWork: "Aprender a tolerar el conflicto necesario y tomar posturas firmes aun cuando esto decepcione temporalmente a otros."
  },
  Escorpio: {
    psychology: "Regido por Plutón y Marte, Escorpio posee una percepción penetrante que traspasa las máscaras superficiales. Su mente es investigadora, estratégica y dotada de una resiliencia capaz de renacer de las cenizas.",
    love: "En las relaciones, Escorpio busca la fusión de almas, una lealtad a toda prueba y una intimidad emocional y física profunda. Son incondicionales con quienes ganan su confianza, pero implacables ante la traición.",
    work: "Investigación forense, cirugía, psicología profunda, finanzas de riesgo, gestión de crisis y liderazgo estratégico. No temen adentrarse en los terrenos más complejos.",
    money: "Gran talento para el manejo de recursos compartidos, herencias, préstamos estratégicos y transformaciones de negocios en crisis en minas de rentabilidad.",
    shadowWork: "Aprender a perdonar y soltar el control defensivo; abrir el corazón sin el temor paranoide a ser herido."
  },
  Sagitario: {
    psychology: "Regido por Júpiter, Sagitario es el explorador filosófico que busca el sentido superior de la vida. Su mente es optimista, expansiva y orientada a los grandes horizontes éticos y espirituales.",
    love: "En el romance, Sagitario busca un compañero de aventuras con quien viajar, reír y debatir sobre las grandes preguntas de la existencia. Necesitan respeto sagrado por su libertad personal y una visión entusiasta del porvenir.",
    work: "Educación superior, leyes internacionales, viajes, filosofía, edición y consultoría estratégica global. Su optimismo contagioso abre puertas donde otros ven barreras.",
    money: "Tienen una fe inquebrantable en que el universo proveerá, lo que suele atraer golpes de fortuna. Su lección es prever épocas de vacas flacas mediante el ahorro estructurado.",
    shadowWork: "Cultivar la constancia en el detalle diario y no dogmatizar sus convicciones frente a quienes piensan diferente."
  },
  Capricornio: {
    psychology: "Regido por Saturno, Capricornio posee una visión a largo plazo y una disciplina inquebrantable. Su mente entiende las leyes del tiempo y la madurez; no teme al esfuerzo cuesta arriba si la meta es digna.",
    love: "En el amor, Capricornio se toma su tiempo para abrir el corazón, pero cuando se compromete es para toda la vida. Demuestra su devoción mediante la estabilidad, la protección y el cumplimiento riguroso de su palabra.",
    work: "Altas esferas ejecutivas, gobernanza, finanzas corporativas, minería, construcción y gestión de grandes proyectos. Su seriedad y capacidad de trabajo bajo presión imponen respeto.",
    money: "Maestros del patrimonio. Saben invertir con paciencia, reinvertir utilidades y construir solvencia económica blindada contra crisis externas.",
    shadowWork: "Permitirse el disfrute y la vulnerabilidad; recordar que su valor como personas no depende exclusivamente de sus logros externos."
  },
  Acuario: {
    psychology: "Regido por Urano y Saturno, Acuario es el visionario del colectivo que piensa diez años por delante de su época. Su mente es original, disruptiva y comprometida con la libertad y la justicia social.",
    love: "En las citas, Acuario necesita primero una profunda amistad y sintonía mental. Valoran a una pareja que tenga sus propios ideales, que respete la independencia mutua y con quien crear un vínculo fuera de los moldes tradicionales.",
    work: "Tecnología de vanguardia, inteligencia artificial, activismo social, investigación científica, aviación y desarrollo de comunidades digitales. Son pioneros del futuro.",
    money: "Suelen obtener ingresos a través de proyectos innovadores y colaborativos. Su relación con el dinero es utilitaria: es una herramienta para la autonomía y el progreso comunitario.",
    shadowWork: "Bajar de la abstracción teórica a la intimidad emocional cotidiana; permitir que sus sentimientos individuales se expresen sin filtros lógicos."
  },
  Piscis: {
    psychology: "Regido por Neptuno y Júpiter, Piscis posee una sensibilidad oceánica conectada con el inconsciente colectivo. Su mente es artística, profundamente compasiva y capaz de percibir la magia sutil detrás de lo cotidiano.",
    love: "En el amor, Piscis es el romántico definitivo. Sueña con una unión donde la ternura, el arte y la empatía silenciosa creen un santuario de paz. Se entrega generosamente y sabe escuchar como nadie.",
    work: "Música, cine, artes plásticas, psicoterapia, sanación, labores humanitarias y profesiones donde la imaginación y la compasión sean indispensables.",
    money: "El dinero fluye cuando sus actividades se alinean con un propósito noble. Su desafío es establecer fronteras prácticas para que personas abusivas no se aprovechen de su generosidad.",
    shadowWork: "Aprender a poner límites claros y no escapar de la realidad mediante la fantasía cuando surgen dificultades terrenales."
  }
};

// ─── GENERADOR DE PRONÓSTICOS TEMPORALES ESTRUCTURADOS (DIARIO/SEMANAL/MENSUAL/ANUAL) ──
export function getTemporalForecast(sign = 'Aries', lifePath = 1, period = 'diario') {
  const zodiac = ZODIAC_COMPREHENSIVE_READINGS[sign] || ZODIAC_COMPREHENSIVE_READINGS.Aries;
  const sefiraInfo = TREE_OF_LIFE_SEFIROT[lifePath] || TREE_OF_LIFE_SEFIROT[1];

  const periodTitles = {
    diario: {
      label: "Pronóstico Diario",
      subtitle: "Vibración energética para las próximas 24 horas",
      timeframe: "Hoy"
    },
    semanal: {
      label: "Pronóstico Semanal",
      subtitle: "Tendencias y oportunidades para los próximos 7 días",
      timeframe: "Esta Semana"
    },
    mensual: {
      label: "Pronóstico Mensual",
      subtitle: "Clima cósmico y enfoque estratégico para este mes",
      timeframe: "Este Mes"
    },
    anual: {
      label: "Pronóstico Anual",
      subtitle: "Visión del ciclo evolutivo de largo alcance",
      timeframe: "Ciclo Anual"
    }
  };

  const currentPeriod = periodTitles[period] || periodTitles.diario;

  // Generación contextual sobria y psicológica según el período
  const forecasts = {
    diario: {
      love: `Para ${sign} y la frecuencia ${lifePath} (${sefiraInfo.sefira}), la energía de hoy favorece el diálogo franco y la empatía sincera. En las relaciones de pareja o citas, un gesto espontáneo de aprecio disolverá tensiones acumuladas. Momento idóneo para escuchar sin juzgar.`,
      work: `En el trabajo, la jornada exige priorizar las tareas esenciales sobre las distracciones menores. Tu capacidad natural como ${sign} para enfocar la energía te permitirá avanzar con agilidad en decisiones que venías postergando.`,
      money: `Día de prudencia operativa. Evita compras superfluas impulsadas por la ansiedad. Buen momento para revisar presupuestos y confirmar que tus recursos estén bien resguardados.`,
      energy: `Tu vitalidad se potencia si te tomas 15 minutos de desconexión digital durante la tarde. Camina, hidrátate conscientemente y respira profundo.`,
      guidingNumber: lifePath,
      keyAdvice: "La claridad interior precede a la victoria externa. Confía en tu discernimiento."
    },
    semanal: {
      love: `Durante esta semana, los vínculos experimentan una fase de clarificación positiva. Si estás en pareja, es un excelente ciclo para planificar una salida fuera de la rutina o conversar sobre metas compartidas. Para quienes están conociendo personas, surgirán conversaciones con profunda afinidad intelectual.`,
      work: `Semana de concreción estratégica. Se presentan aperturas para negociar acuerdos, presentar propuestas creativas o asumir mayor responsabilidad. La influencia de ${sefiraInfo.title} te brinda la autoridad moral para guiar con el ejemplo.`,
      money: `El flujo financiero se muestra estable con tendencia al crecimiento. Si tienes en mente una inversión o ahorro programado, esta semana ofrece buen discernimiento para dar el primer paso con bases firmes.`,
      energy: `Dedica tiempo a restaurar tu ciclo de sueño y equilibrar la actividad física con momentos de lectura o silencio reflexivo.`,
      guidingNumber: (lifePath % 9) + 1,
      keyAdvice: "El orden en tu entorno inmediato genera serenidad en tu mente."
    },
    mensual: {
      love: `Este mes marca un ciclo de maduración afectiva para ${sign}. Se consolidan acuerdos de largo plazo y se disuelven malentendidos que venían arrastrándose. Es un período donde la autenticidad y la vulnerabilidad compartida fortalecen los lazos como nunca.`,
      work: `El mes propicia un salto cualitativo en tu carrera o proyectos personales. Tus talentos serán más visibles y podrías recibir reconocimientos o la oportunidad de liderar un área clave. Mantén la ética y la paciencia como estandartes.`,
      money: `Ciclo propicio para sanear deudas, diversificar ahorros y evaluar nuevos modelos de ingresos. Tu relación con la abundancia se expande cuando reconoces y valoras tus propias habilidades profesionales.`,
      energy: `Mes ideal para iniciar una disciplina de bienestar duradera: alimentación consciente, meditación matutina y contacto con la naturaleza.`,
      guidingNumber: lifePath,
      keyAdvice: "Lo que se construye con paciencia y verdad permanece inalterable ante cualquier tormenta."
    },
    anual: {
      love: `En el horizonte de este ciclo anual, tu vida vincular atraviesa un proceso de purificación y florecimiento. Atraerás personas alineadas con tu verdadero nivel de conciencia, dejando atrás patrones de dependencia o superficialidad. El amor se convierte en un templo de apoyo mutuo.`,
      work: `Año trascendental para la consolidación de tu vocación. Bajo el auspicio de ${sefiraInfo.sefira}, tus esfuerzos acumulados en los últimos años comienzan a dar frutos visibles y sólidos. La clave será mantener el rumbo sin claudicar ante distracciones menores.`,
      money: `Año de estructuración patrimonial y madurez económica. Las semillas financieras que siembres con seriedad durante este ciclo sentarán las bases de la tranquilidad para los próximos cinco años.`,
      energy: `Tu reto de salud y vitalidad para este año es la armonía psicofísica: aprender a descansar a tiempo, regular el estrés laboral y cuidar tus articulaciones y postura.`,
      guidingNumber: lifePath,
      keyAdvice: "Tu misión de vida no es competir con el mundo, sino manifestar la luz única que habita en tu corazón."
    }
  };

  return {
    ...currentPeriod,
    data: forecasts[period] || forecasts.diario
  };
}