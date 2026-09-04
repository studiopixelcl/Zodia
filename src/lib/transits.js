/**
 * Motor Astronómico y de Tránsitos Diarios para Zodia
 * Calcula posiciones eclípticas planetarias, fases lunares, aspectos interplanetarios
 * y el Barómetro Cósmico del Día.
 * Compatible con Cloudflare Edge Runtime (cálculo matemático puro en JS).
 */

export const ZODIAC_SIGNS = [
  { name: 'Aries',       glyph: '♈', element: 'Fuego',  startDeg: 0,   color: '#f87171', border: '#ef4444' },
  { name: 'Tauro',       glyph: '♉', element: 'Tierra', startDeg: 30,  color: '#34d399', border: '#10b981' },
  { name: 'Géminis',     glyph: '♊', element: 'Aire',   startDeg: 60,  color: '#38bdf8', border: '#0ea5e9' },
  { name: 'Cáncer',      glyph: '♋', element: 'Agua',   startDeg: 90,  color: '#818cf8', border: '#6366f1' },
  { name: 'Leo',         glyph: '♌', element: 'Fuego',  startDeg: 120, color: '#fbbf24', border: '#f59e0b' },
  { name: 'Virgo',       glyph: '♍', element: 'Tierra', startDeg: 150, color: '#10b981', border: '#059669' },
  { name: 'Libra',       glyph: '♎', element: 'Aire',   startDeg: 180, color: '#22d3ee', border: '#06b6d4' },
  { name: 'Escorpio',    glyph: '♏', element: 'Agua',   startDeg: 210, color: '#c084fc', border: '#a855f7' },
  { name: 'Sagitario',   glyph: '♐', element: 'Fuego',  startDeg: 240, color: '#fb923c', border: '#f97316' },
  { name: 'Capricornio', glyph: '♑', element: 'Tierra', startDeg: 270, color: '#6ee7b7', border: '#059669' },
  { name: 'Acuario',     glyph: '♒', element: 'Aire',   startDeg: 300, color: '#67e8f9', border: '#06b6d4' },
  { name: 'Piscis',      glyph: '♓', element: 'Agua',   startDeg: 330, color: '#a78bfa', border: '#8b5cf6' },
];

export const PLANETS = [
  { id: 'sun',     name: 'Sol',         glyph: '☉', color: '#fbbf24', speed: 0.9856 },
  { id: 'moon',    name: 'Luna',        glyph: '☽', color: '#e2e8f0', speed: 13.176 },
  { id: 'mercury', name: 'Mercurio',   glyph: '☿', color: '#38bdf8', speed: 1.2000 },
  { id: 'venus',   name: 'Venus',       glyph: '♀', color: '#f472b6', speed: 1.1500 },
  { id: 'mars',    name: 'Marte',       glyph: '♂', color: '#ef4444', speed: 0.5240 },
  { id: 'jupiter', name: 'Júpiter',     glyph: '♃', color: '#fb923c', speed: 0.0831 },
  { id: 'saturn',  name: 'Saturno',     glyph: '♄', color: '#a3e635', speed: 0.0334 },
  { id: 'uranus',  name: 'Urano',       glyph: '♅', color: '#22d3ee', speed: 0.0117 },
  { id: 'neptune', name: 'Neptuno',     glyph: '♆', color: '#818cf8', speed: 0.0060 },
  { id: 'pluto',   name: 'Plutón',      glyph: '♇', color: '#c084fc', speed: 0.0040 },
  { id: 'asc',     name: 'Ascendente',  glyph: 'ASC', color: '#facc15', speed: 360.0 }
];

export const HOUSES = [
  { num: 1,  name: 'Casa I (Ascendente)',  theme: 'Identidad, Presencia, Vitalidad' },
  { num: 2,  name: 'Casa II',              theme: 'Recursos, Autoestima, Abundancia' },
  { num: 3,  name: 'Casa III',             theme: 'Comunicación, Intelecto, Entorno' },
  { num: 4,  name: 'Casa IV (Fondo Cielo)', theme: 'Hogar, Raíces, Intimidad Emocional' },
  { num: 5,  name: 'Casa V',               theme: 'Amor, Creatividad, Autoexpresión' },
  { num: 6,  name: 'Casa VI',              theme: 'Bienestar, Rituales, Hábitos' },
  { num: 7,  name: 'Casa VII (Descendente)', theme: 'Vínculos, Pareja, El Espejo' },
  { num: 8,  name: 'Casa VIII',            theme: 'Transformación, Misterio, Fusión' },
  { num: 9,  name: 'Casa IX',              theme: 'Expansión, Filosofía, Viajes' },
  { num: 10, name: 'Casa X (Medio Cielo)', theme: 'Propósito, Maestría, Vocación' },
  { num: 11, name: 'Casa XI',              theme: 'Comunidad, Sueños, Visión Futura' },
  { num: 12, name: 'Casa XII',             theme: 'Inconsciente, Misticismo, Trascendencia' }
];

export const ASPECT_TYPES = [
  { name: 'Conjunción', angle: 0,   orb: 8, color: '#fbbf24', quality: 'Potente fusión energética', stroke: 'solid' },
  { name: 'Sextil',     angle: 60,  orb: 5, color: '#38bdf8', quality: 'Oportunidad y fluidez',   stroke: 'dashed' },
  { name: 'Cuadratura', angle: 90,  orb: 6, color: '#f87171', quality: 'Tensión evolutiva y reto', stroke: 'solid' },
  { name: 'Trígono',    angle: 120, orb: 7, color: '#34d399', quality: 'Armonía pura y dones natos', stroke: 'solid' },
  { name: 'Oposición',  angle: 180, orb: 8, color: '#c084fc', quality: 'Polaridad e integración', stroke: 'dashed' }
];

/**
 * Normaliza un ángulo en grados al rango [0, 360)
 */
export function normalizeAngle(deg) {
  let angle = deg % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * Obtiene el signo y grado dentro del signo para una longitud dada
 */
export function getSignFromDegree(deg) {
  const norm = normalizeAngle(deg);
  const signIndex = Math.floor(norm / 30);
  const sign = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];
  const degreeInSign = Math.floor(norm % 30);
  const minutes = Math.floor((norm % 1) * 60);
  return { sign, degreeInSign, minutes, totalDegree: norm };
}

/**
 * Cálculo astronómico de la Fase Lunar para una fecha
 */
export function calculateMoonPhase(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  // Algoritmo de Conway / Meeus para fase lunar
  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r -= year < 2000 ? 4 : 8.3;
  r = Math.floor(r + 0.5) % 30;
  const age = r < 0 ? r + 30 : r;

  // Fracción de ciclo lunar (29.53 días)
  const fraction = age / 29.53;
  const illumination = Math.round((1 - Math.cos(fraction * 2 * Math.PI)) / 2 * 100);

  let phaseName = 'Luna Nueva';
  let glyph = '🌑';
  let energyDescription = 'Momento de siembra, introspección y nuevos comienzos';

  if (age >= 1 && age < 7) {
    phaseName = 'Luna Creciente';
    glyph = '🌒';
    energyDescription = 'Impulso vital, atracción de intenciones y proyectos en expansión';
  } else if (age >= 7 && age < 9) {
    phaseName = 'Cuarto Creciente';
    glyph = '🌓';
    energyDescription = 'Toma de decisiones valientes y superación de obstáculos';
  } else if (age >= 9 && age < 14) {
    phaseName = 'Gibosa Creciente';
    glyph = '🌔';
    energyDescription = 'Perfeccionamiento, síntesis y maduración energética';
  } else if (age >= 14 && age < 17) {
    phaseName = 'Luna Llena';
    glyph = '🌕';
    energyDescription = 'Clímax intuitivo, magnetismo desbordante y máxima claridad emocional';
  } else if (age >= 17 && age < 22) {
    phaseName = 'Gibosa Menguante';
    glyph = '🌖';
    energyDescription = 'Agradecimiento, compartir sabiduría y asimilar aprendizajes';
  } else if (age >= 22 && age < 24) {
    phaseName = 'Cuarto Menguante';
    glyph = '🌗';
    energyDescription = 'Liberación de cargas, desapego y limpieza de lazos kármicos';
  } else if (age >= 24 && age < 29) {
    phaseName = 'Luna Balsámica';
    glyph = '🌘';
    energyDescription = 'Reposo sagrado, meditación profunda y recarga espiritual';
  }

  return { age, illumination, phaseName, glyph, energyDescription };
}

/**
 * Calcula las posiciones planetarias de una fecha dada (Carta Natal o Tránsito de Hoy)
 */
export function calculatePlanetaryPositions(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const yearOffset = d.getFullYear() - 2000;
  const daysTotal = yearOffset * 365.25 + dayOfYear;

  // 1. Sol: 0° Aries en el equinoccio vernal (~20 de marzo, día ~79)
  const sunDeg = normalizeAngle((dayOfYear - 79) * 0.9856 + 360);

  // 2. Luna: Ciclo sinódico de ~29.5 días
  const moonDeg = normalizeAngle(sunDeg + (daysTotal % 29.53) * 12.2);

  // 3. Mercurio: Oscila cerca del Sol (máx ±28°)
  const mercPeriod = (daysTotal * 4.09) * (Math.PI / 180);
  const mercuryDeg = normalizeAngle(sunDeg + Math.sin(mercPeriod) * 22);

  // 4. Venus: Oscila cerca del Sol (máx ±47°)
  const venPeriod = (daysTotal * 1.6) * (Math.PI / 180);
  const venusDeg = normalizeAngle(sunDeg + Math.sin(venPeriod) * 38);

  // 5. Marte: Período sideral ~687 días
  const marsDeg = normalizeAngle((daysTotal * 0.524) + 45);

  // 6. Júpiter: Período ~11.86 años (~30° por año)
  const jupiterDeg = normalizeAngle((yearOffset * 30.3) + (dayOfYear * 0.083) + 25);

  // 7. Saturno: Período ~29.5 años (~12.2° por año)
  const saturnDeg = normalizeAngle((yearOffset * 12.2) + (dayOfYear * 0.033) + 310);

  // 8. Urano: ~4.28° por año
  const uranusDeg = normalizeAngle((yearOffset * 4.28) + 40);

  // 9. Neptuno: ~2.18° por año
  const neptuneDeg = normalizeAngle((yearOffset * 2.18) + 335);

  // 10. Plutón: ~1.45° por año
  const plutoDeg = normalizeAngle((yearOffset * 1.45) + 290);

  // 11. Ascendente: Aproximado según hora o defecto a 180° opuesto o cúspide
  const hours = d.getHours() + d.getMinutes() / 60;
  const ascDeg = normalizeAngle(sunDeg + (hours - 6) * 15);

  const rawPlanets = [
    { ...PLANETS[0], deg: sunDeg },
    { ...PLANETS[1], deg: moonDeg },
    { ...PLANETS[2], deg: mercuryDeg },
    { ...PLANETS[3], deg: venusDeg },
    { ...PLANETS[4], deg: marsDeg },
    { ...PLANETS[5], deg: jupiterDeg },
    { ...PLANETS[6], deg: saturnDeg },
    { ...PLANETS[7], deg: uranusDeg },
    { ...PLANETS[8], deg: neptuneDeg },
    { ...PLANETS[9], deg: plutoDeg },
    { ...PLANETS[10], deg: ascDeg },
  ];

  return rawPlanets.map(p => {
    const info = getSignFromDegree(p.deg);
    // Casa aproximada relativa al Ascendente
    const houseDiff = normalizeAngle(p.deg - ascDeg);
    const houseNum = Math.floor(houseDiff / 30) + 1;
    const house = HOUSES[houseNum - 1] || HOUSES[0];

    return {
      ...p,
      sign: info.sign.name,
      signGlyph: info.sign.glyph,
      element: info.sign.element,
      color: info.sign.color,
      degreeInSign: info.degreeInSign,
      minutes: info.minutes,
      houseNum,
      houseName: house.name,
      houseTheme: house.theme
    };
  });
}

/**
 * Calcula los aspectos geométricos entre una lista de planetas
 */
export function calculateAspects(planets) {
  const aspects = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      // Calcular la menor distancia angular entre ambos
      let diff = Math.abs(p1.deg - p2.deg);
      if (diff > 180) diff = 360 - diff;

      for (const aspect of ASPECT_TYPES) {
        const delta = Math.abs(diff - aspect.angle);
        if (delta <= aspect.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            aspect,
            exactAngle: diff,
            orbDelta: delta
          });
          break;
        }
      }
    }
  }
  return aspects;
}

/**
 * Calcula la Sinastría entre dos cartas (Carta A del usuario y Carta B de la pareja)
 */
export function calculateSynastry(planetsA, planetsB) {
  const mutualAspects = [];
  let harmonyScore = 70; // Base

  planetsA.forEach(pA => {
    planetsB.forEach(pB => {
      let diff = Math.abs(pA.deg - pB.deg);
      if (diff > 180) diff = 360 - diff;

      for (const aspect of ASPECT_TYPES) {
        const delta = Math.abs(diff - aspect.angle);
        if (delta <= aspect.orb) {
          mutualAspects.push({
            planetA: pA,
            planetB: pB,
            aspect,
            exactAngle: diff,
            orbDelta: delta
          });

          if (aspect.name === 'Trígono' || aspect.name === 'Sextil') harmonyScore += 4;
          if (aspect.name === 'Conjunción') harmonyScore += (pA.id === 'venus' || pB.id === 'venus' ? 6 : 3);
          if (aspect.name === 'Cuadratura') harmonyScore -= 2;
          break;
        }
      }
    });
  });

  const clampedScore = Math.min(99, Math.max(55, harmonyScore));
  return { mutualAspects, score: clampedScore };
}

/**
 * Barómetro Cósmico Diario Personalizado
 */
export function getDailyCosmicBarometer(userSign = 'Aries', birthDate) {
  const today = new Date();
  const todayPlanets = calculatePlanetaryPositions(today);
  const moonPhase = calculateMoonPhase(today);
  const moonPlanet = todayPlanets.find(p => p.id === 'moon');
  const sunPlanet = todayPlanets.find(p => p.id === 'sun');

  // Variación diaria armónica basada en el día del año y el signo
  const dayHash = (today.getFullYear() * 365 + today.getMonth() * 31 + today.getDate());
  const signIndex = ZODIAC_SIGNS.findIndex(s => s.name.toLowerCase() === userSign.toLowerCase());
  const vitality = 72 + ((dayHash * 17 + (signIndex >= 0 ? signIndex * 9 : 12)) % 26); // 72% a 97%

  // Signos armónicos del día según el elemento de la Luna de hoy
  const currentMoonElement = moonPlanet?.element || 'Agua';
  const luckySigns = ZODIAC_SIGNS.filter(s => s.element === currentMoonElement).map(s => s.name);

  // Enfoque del día
  const focuses = [
    { title: 'Conexión Emocional & Diálogo', desc: 'La configuración lunar invita a la honestidad afectiva y conversaciones sin máscaras.' },
    { title: 'Magnetismo & Expresión',      desc: 'El tránsito solar despierta tu brillo auténtico. Es un día ideal para dar el primer paso.' },
    { title: 'Intuición & Presencia',        desc: 'Las sincronicidades astrales están activas. Presta atención a las corazonadas.' },
    { title: 'Renovación & Claridad',        desc: 'Despeja dudas antiguas y enfócate en vínculos que sumen calma a tu mente.' }
  ];
  const todayFocus = focuses[dayHash % focuses.length];

  return {
    vitality,
    moonPhase,
    currentMoonSign: moonPlanet?.sign || 'Cáncer',
    currentMoonDegree: moonPlanet?.degreeInSign || 14,
    currentSunSign: sunPlanet?.sign || 'Piscis',
    luckySigns,
    todayFocus,
    todayPlanets
  };
}
