import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';
import { calculateResonance } from '../../../lib/astrology';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

const GUIDE_TUNERS = [
  {
    id: "guide_astraea",
    name: "Astraea Mística",
    sign: "Virgo",
    element: "Tierra",
    life_path_number: 7,
    archetype: "El Ermitaño",
    bio: "Amante del diseño, los libros antiguos y el té herbal. Buscando almas serenas para conversaciones profundas y viajes.",
    intent: "Citas y Pareja",
    location: "Santiago, Chile",
    image: "https://ui-avatars.com/api/?name=Astraea&background=10b981&color=fff&bold=true",
    photos: []
  },
  {
    id: "guide_orion",
    name: "Orion Solis",
    sign: "Leo",
    element: "Fuego",
    life_path_number: 1,
    archetype: "El Mago",
    bio: "Emprendedor, apasionado de la astronomía y la música en vivo. Me encanta crear nuevos proyectos e inspirar a quienes me rodean.",
    intent: "Conexiones Astrales",
    location: "Buenos Aires, Argentina",
    image: "https://ui-avatars.com/api/?name=Orion&background=f59e0b&color=fff&bold=true",
    photos: []
  },
  {
    id: "guide_luna",
    name: "Luna Vespera",
    sign: "Piscis",
    element: "Agua",
    life_path_number: 11,
    archetype: "El Iluminado",
    bio: "Poeta, fotógrafa nocturna y practicante de meditación. Busco alguien empático con quien compartir atardeceres y arte.",
    intent: "Amistad & Conexiones",
    location: "Medellín, Colombia",
    image: "https://ui-avatars.com/api/?name=Luna&background=a855f7&color=fff&bold=true",
    photos: []
  },
  {
    id: "guide_zephyr",
    name: "Zephyr del Éter",
    sign: "Acuario",
    element: "Aire",
    life_path_number: 5,
    archetype: "El Hierofante",
    bio: "Curioso empedernido, viajero y tecnólogo místico. Disfruto los debates filosóficos y los festivales de música.",
    intent: "Citas y Pareja",
    location: "CDMX, México",
    image: "https://ui-avatars.com/api/?name=Zephyr&background=3b82f6&color=fff&bold=true",
    photos: []
  }
];

export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const myId = resolveUserId(token);

  const defaultMyProfile = {
    sign: "Capricornio",
    element: "Tierra",
    life_path_number: 9,
    archetype: "El Ermitaño"
  };

  let myProfile = defaultMyProfile;
  let othersList = [];

  if (db) {
    try {
      const fetched = await db.prepare(
        "SELECT * FROM astral_profiles WHERE user_id = ?"
      ).bind(myId).first();
      if (fetched) myProfile = fetched;

      const dbOthers = await db.prepare(`
        SELECT 
          p.*, 
          u.name, 
          u.image 
        FROM astral_profiles p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id != ? 
        LIMIT 20
      `).bind(myId).all();

      othersList = (dbOthers.results || []).map(o => ({
        id: o.user_id,
        name: o.name,
        image: o.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(o.name || 'Z')}&background=06b6d4&color=fff`,
        sign: o.sign,
        element: o.element,
        path: o.life_path_number,
        archetype: o.archetype,
        bio: o.bio ?? '',
        intent: o.intent ?? 'Citas y Pareja',
        location: o.location ?? '',
        photos: o.photos ? JSON.parse(o.photos) : []
      }));
    } catch (err) {
      console.error("Error consultando D1 en /api/resonances:", err);
    }
  }

  if (othersList.length < 3) {
    const existingIds = new Set(othersList.map(o => o.id));
    for (const guide of GUIDE_TUNERS) {
      if (!existingIds.has(guide.id) && guide.id !== myId) {
        othersList.push({
          id: guide.id,
          name: guide.name,
          image: guide.image,
          sign: guide.sign,
          element: guide.element,
          path: guide.life_path_number,
          archetype: guide.archetype,
          bio: guide.bio,
          intent: guide.intent,
          location: guide.location,
          photos: guide.photos
        });
      }
    }
  }

  const resonances = othersList.map(other => {
    const affinityScore = calculateResonance(myProfile, {
      element: other.element,
      lifePath: other.path ?? other.life_path_number,
      archetype: other.archetype
    });
    
    return {
      id: other.id,
      name: other.name,
      image: other.image,
      sign: other.sign,
      element: other.element,
      path: other.path ?? other.life_path_number,
      archetype: other.archetype,
      bio: other.bio,
      intent: other.intent,
      location: other.location,
      photos: other.photos,
      affinity: `${affinityScore}%`,
      affinityScore
    };
  });

  resonances.sort((a, b) => b.affinityScore - a.affinityScore);

  return NextResponse.json(resonances);
}

export async function POST(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const myId = resolveUserId(token);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { targetUserId, score } = body;
  if (!targetUserId) {
    return NextResponse.json({ error: "ID de usuario objetivo requerido." }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ success: true, mock: true });
  }

  try {
    const existing = await db.prepare(`
      SELECT id FROM resonances
      WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
    `).bind(myId, targetUserId, targetUserId, myId).first();

    if (!existing) {
      await db.prepare(`
        INSERT INTO resonances (user_a_id, user_b_id, score)
        VALUES (?, ?, ?)
      `).bind(myId, targetUserId, score ? parseInt(score) : 80).run();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error al registrar resonancia:", err);
    return NextResponse.json({ error: "Fallo al guardar la sintonización." }, { status: 500 });
  }
}