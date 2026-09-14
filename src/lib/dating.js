/**
 * Zodia Dating Engine - Utilidades e Inteligencia para Citas Astrales
 */

export const CATEGORIZED_INTERESTS = [
  {
    category: 'Música & Artistas',
    icon: '🎵',
    tags: ['Música indie', 'Trap & Urbano', 'Electrónica & Techno', 'Pop & Hits', 'Rock & Alternativo', 'Jazz & Soul', 'Reggaetón', 'Hip Hop clásico']
  },
  {
    category: 'Estilo de Vida',
    icon: '🌿',
    tags: ['Fitness & Deporte', 'Yoga & Meditación', 'Viajes & Mochilero', 'Gamer & Anime', 'Lectura & Libros', 'Cinefilia & Series', 'Café de especialidad', 'Cocina & Gastronomía']
  },
  {
    category: 'Panoramas & Citas',
    icon: '🌆',
    tags: ['Festivales en vivo', 'Salir por un café', 'Trekking & Montaña', 'Bares & Coctelería', 'Noche de pelis y mantita', 'Exposiciones de arte', 'Escapada a la playa', 'Fotografía urbana']
  },
  {
    category: 'Vibes & Espiritualidad',
    icon: '✨',
    tags: ['Astrología', 'Lectura de Tarot', 'Cristales & Sahumos', 'Filosofía & Cosmos', 'Conversaciones profundas', 'Buenas energías', 'Naturaleza & Silencio', 'Escritura & Poesía']
  }
];

export const DATING_INTERESTS = CATEGORIZED_INTERESTS.flatMap(c => c.tags);

/**
 * Genera preguntas rompehielos personalizadas según la sinergia zodiacal
 */
export function generateAstrologicalIcebreakers(mySign = 'Capricornio', targetSign = 'Virgo', targetName = 'tu match') {
  const common = [
    `¿Qué es lo más acertado que dice tu signo sobre ti? ✨`,
    `Si pudieras viajar a cualquier lugar bajo las estrellas este fin de semana, ¿dónde sería? 🌌`,
    `¿Café para una charla profunda o vino para reírnos de la vida? ☕🍷`,
    `¿Cuál es tu lugar favorito para desconectar del mundo? 🌿`
  ];

  const signSpecific = {
    Aries: [
      `Como Aries, seguro tienes mil proyectos en marcha. ¿Cuál te emociona más ahora mismo? 🔥`,
      `¿Cuál ha sido la aventura más espontánea o loca que has hecho? 🚀`
    ],
    Tauro: [
      `Dicen que a Tauro se le conquista por el paladar... ¿cuál es tu comida reconfortante favorita? 🍝`,
      `¿Una tarde de manta, música suave y desconexión total o una salida a tu rincón favorito? 🛋️`
    ],
    Géminis: [
      `Con mente Géminis seguro nunca te quedas sin temas. ¿Cuál es la obsesión curiosa que estás investigando esta semana? 🧠`,
      `¿Película con final inesperado o debate filosófico a las 2 AM? 🎭`
    ],
    Cáncer: [
      `Dicen que los Cáncer crean los espacios más acogedores. ¿Qué canción te hace sentir en casa al instante? 🎶`,
      `¿Cuál es ese recuerdo que siempre te saca una sonrisa sincera? 🌊`
    ],
    Leo: [
      `Irradias energía de Leo ♌. ¿Qué es lo que más te apasiona compartir o crear con los demás? ☀️`,
      `¿Tu mejor plan para una noche inolvidable en la ciudad? 🥂`
    ],
    Virgo: [
      `Como Virgo, seguro aprecias los detalles sutiles. ¿Qué pequeño detalle en alguien siempre llama tu atención? 🌿`,
      `¿Prefieres planificar cada minuto de un viaje o dejarte sorprender por el destino? 🗺️`
    ],
    Libra: [
      `Tu vibra Libra busca armonía y buen gusto. ¿Cuál es tu rincón estético o galería favorita? 🎨`,
      `¿Cuál es la conversación más fascinante que has tenido últimamente? ⚖️`
    ],
    Escorpio: [
      `Con la intensidad de Escorpio, saltémonos la charla superficial... ¿qué sueño secreto persigues este año? 🦂`,
      `¿Qué misterio o tema poco común te atrapa por completo? 🌙`
    ],
    Sagitario: [
      `Alma libre de Sagitario 🏹. ¿Cuál ha sido el viaje o experiencia que más transformó tu forma de ver la vida? ✈️`,
      `¿Cuál es tu filosofía personal para no tomarte la vida demasiado en serio? 🎯`
    ],
    Capricornio: [
      `Determinación y nobleza capricorniana. ¿Qué logro o meta te hace sentir más orgulloso/a de tu camino? 🏔️`,
      `¿Un proyecto que construiste desde cero y del que amas hablar? ⏳`
    ],
    Acuario: [
      `Perspectiva original de Acuario ⚡. Si pudieras cambiar una sola regla del mundo actual, ¿cuál sería? 💡`,
      `¿Cuál es esa idea o visión de futuro que la mayoría aún no comprende? 🪐`
    ],
    Piscis: [
      `Alma soñadora de Piscis ♓. ¿Qué arte, canción o paisaje te hace sentir en otra dimensión? 🌊`,
      `¿Crees en las conexiones predestinadas o en las coincidencias mágicas? ✨`
    ]
  };

  const specificList = signSpecific[targetSign] || [];
  return [...specificList, ...common].slice(0, 4);
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas geográficas (Fórmula de Haversine)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Catálogo de perfiles: Zodia opera al 100% con sintonizadores y perfiles reales registrados.
 */
export const DATING_CANDIDATES = [];

