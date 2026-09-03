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
 * Catálogo enriquecido de perfiles de citas para Zodia
 * Fotos reales de alta calidad y optimizadas para visualización en apps de citas
 */
export const DATING_CANDIDATES = [
  {
    id: "candidate_valeria",
    name: "Valeria Ríos",
    age: 26,
    sign: "Leo",
    element: "Fuego",
    life_path_number: 1,
    archetype: "El Mago",
    bio: "Diseñadora de modas, amante de los atardeceres dorados y la música electrónica en vivo. Busco a alguien que no le tema a la intensidad ni a reírse a carcajadas en la primera cita.",
    intent: "Citas y Pareja",
    location: "Santiago, Chile (a 3 km)",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Música indie", "Festivales", "Café de especialidad", "Fotografía"],
    likesYou: true // ¡Dará match inmediato si el usuario le da Like!
  },
  {
    id: "candidate_mateo",
    name: "Mateo Silva",
    age: 28,
    sign: "Piscis",
    element: "Agua",
    life_path_number: 7,
    archetype: "El Ermitaño",
    bio: "Arquitecto de día, guitarrista aficionado de noche. Me encanta recorrer mercados de antigüedades, preparar café v60 y tener charlas que duren hasta la madrugada.",
    intent: "Conexión Casual",
    location: "Providencia, Chile (a 5 km)",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Café de especialidad", "Música indie", "Cine de culto", "Yoga & Meditación"],
    likesYou: true
  },
  {
    id: "candidate_camila",
    name: "Camila Beltrán",
    age: 25,
    sign: "Géminis",
    element: "Aire",
    life_path_number: 5,
    archetype: "El Hierofante",
    bio: "Periodista cultural y fotógrafa analógica. Si sabes de un bar escondido con buena acústica o una librería con encanto, ya tenemos tema de conversación.",
    intent: "Citas y Pareja",
    location: "Las Condes, Chile (a 7 km)",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80"
    ],
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    interests: ["Lectura de Tarot", "Fotografía", "Vino natural", "Arte contemporáneo"],
    likesYou: true
  },
  {
    id: "candidate_julian",
    name: "Julián Morales",
    age: 30,
    sign: "Tauro",
    element: "Tierra",
    life_path_number: 4,
    archetype: "El Emperador",
    bio: "Cocinero apasionado y amante de la montaña. Mi plan perfecto de domingo incluye hornear pan de masa madre, escuchar vinilos y compartir un buen vino.",
    intent: "Citas y Pareja",
    location: "Ñuñoa, Chile (a 4 km)",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Gastronomía", "Vino natural", "Senderismo", "Naturaleza"],
    likesYou: false
  },
  {
    id: "candidate_sofia",
    name: "Sofía Navarro",
    age: 27,
    sign: "Escorpio",
    element: "Agua",
    life_path_number: 11,
    archetype: "El Iluminado",
    bio: "Psicóloga e investigadora del inconsciente. Amo los viajes espontáneos, la poesía nocturna y las personas transparentes que saben lo que quieren.",
    intent: "Citas y Pareja",
    location: "Santiago Centro, Chile (a 2 km)",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Astrología", "Lectura de Tarot", "Cine de culto", "Yoga & Meditación"],
    likesYou: true
  },
  {
    id: "candidate_nicolas",
    name: "Nicolás Paz",
    age: 29,
    sign: "Sagitario",
    element: "Fuego",
    life_path_number: 9,
    archetype: "Los Enamorados",
    bio: "Desarrollador y escalador en roca. Siempre planeando la próxima escapada al sur. Busco una compañera de ruta con buena vibra y espíritu aventurero.",
    intent: "Citas y Pareja",
    location: "Vitacura, Chile (a 8 km)",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Senderismo", "Tecnología", "Viajes espontáneos", "Festivales"],
    likesYou: true
  },
  {
    id: "candidate_elena",
    name: "Elena Alarcón",
    age: 26,
    sign: "Libra",
    element: "Aire",
    life_path_number: 6,
    archetype: "La Emperatriz",
    bio: "Curadora de arte y ceramista. Me fascinan los espacios armoniosos, las galerías los sábados por la tarde y compartir un matcha latte mientras hablamos de la vida.",
    intent: "Amistad Cósmica",
    location: "Barrio Italia, Chile (a 3 km)",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Arte contemporáneo", "Café de especialidad", "Yoga & Meditación", "Escritura"],
    likesYou: true
  },
  {
    id: "candidate_diego",
    name: "Diego Vega",
    age: 31,
    sign: "Aries",
    element: "Fuego",
    life_path_number: 1,
    archetype: "El Carro",
    bio: "Productor musical y amante del running. Directo, apasionado y con poco gusto por la rutina. Si tienes buena energía y te gusta bailar hasta el amanecer, coincidiremos.",
    intent: "Citas y Pareja",
    location: "Providencia, Chile (a 4 km)",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80"
    ],
    interests: ["Música indie", "Festivales", "Gastronomía", "Viajes espontáneos"],
    likesYou: false
  }
];
