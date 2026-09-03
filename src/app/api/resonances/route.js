import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';
import { calculateResonance } from '../../../lib/astrology';
import { DATING_CANDIDATES } from '../../../lib/dating';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase()?.trim() || '';
  const elementFilter = searchParams.get('element')?.toLowerCase() || 'todos';
  const signFilter = searchParams.get('sign')?.toLowerCase() || 'todos';
  const intentFilter = searchParams.get('intent')?.toLowerCase() || 'todos';
  const minScore = parseInt(searchParams.get('minScore') || '0', 10);

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
        LIMIT 30
      `).bind(myId).all();

      othersList = (dbOthers.results || []).map(o => ({
        id: o.user_id,
        name: o.name,
        age: 27,
        image: o.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(o.name || 'Z')}&background=06b6d4&color=fff`,
        sign: o.sign,
        element: o.element,
        path: o.life_path_number,
        archetype: o.archetype,
        bio: o.bio ?? '',
        intent: o.intent ?? 'Citas y Pareja',
        location: o.location ?? 'Santiago, Chile',
        photos: o.photos ? (typeof o.photos === 'string' ? JSON.parse(o.photos) : o.photos) : [],
        video_url: o.video_url || null,
        interests: o.interests ? (typeof o.interests === 'string' ? JSON.parse(o.interests) : o.interests) : ['Música indie', 'Café de especialidad', 'Astrología']
      }));
    } catch (err) {
      console.error("Error consultando D1 en /api/resonances:", err);
    }
  }

  // Integrar catálogo de perfiles de citas de alta calidad
  const existingIds = new Set(othersList.map(o => o.id));
  for (const candidate of DATING_CANDIDATES) {
    if (!existingIds.has(candidate.id) && candidate.id !== myId) {
      othersList.push({
        id: candidate.id,
        name: candidate.name,
        age: candidate.age || 26,
        image: candidate.image,
        sign: candidate.sign,
        element: candidate.element,
        path: candidate.life_path_number,
        archetype: candidate.archetype,
        bio: candidate.bio,
        intent: candidate.intent || 'Citas y Pareja',
        location: candidate.location || 'Santiago, Chile',
        photos: candidate.photos || [candidate.image],
        video_url: candidate.video_url || null,
        interests: candidate.interests || ['Astrología', 'Música indie'],
        likesYou: candidate.likesYou ?? false
      });
    }
  }

  let myInterests = [];
  if (myProfile?.interests) {
    try {
      myInterests = typeof myProfile.interests === 'string' ? JSON.parse(myProfile.interests) : myProfile.interests;
    } catch {
      myInterests = [];
    }
  }

  // Calcular afinidad astral personalizada y bono por intereses en común
  let resonances = othersList.map(other => {
    const otherInterests = Array.isArray(other.interests) ? other.interests : [];
    const sharedInterests = myInterests.filter(myInt => 
      otherInterests.some(otherInt => otherInt.toLowerCase() === myInt.toLowerCase())
    );

    const baseAstralScore = calculateResonance(myProfile, {
      element: other.element,
      lifePath: other.path ?? other.life_path_number,
      archetype: other.archetype
    });

    // Bono de +4% por cada interés compartido (máximo 99%)
    const interestBonus = sharedInterests.length * 4;
    const totalAffinity = Math.min(99, Math.max(60, baseAstralScore + interestBonus));
    
    return {
      ...other,
      affinity: `${totalAffinity}%`,
      affinityScore: totalAffinity,
      baseAstralScore,
      sharedInterests
    };
  });

  // Filtros dinámicos
  if (elementFilter && elementFilter !== 'todos') {
    resonances = resonances.filter(r => r.element?.toLowerCase() === elementFilter);
  }

  if (signFilter && signFilter !== 'todos') {
    resonances = resonances.filter(r => r.sign?.toLowerCase() === signFilter);
  }

  if (intentFilter && intentFilter !== 'todos') {
    resonances = resonances.filter(r => r.intent?.toLowerCase()?.includes(intentFilter));
  }

  if (search) {
    resonances = resonances.filter(r => 
      r.name?.toLowerCase()?.includes(search) ||
      r.location?.toLowerCase()?.includes(search) ||
      r.bio?.toLowerCase()?.includes(search) ||
      r.sign?.toLowerCase()?.includes(search) ||
      r.interests?.some(i => i.toLowerCase().includes(search))
    );
  }

  if (minScore > 0) {
    resonances = resonances.filter(r => r.affinityScore >= minScore);
  }

  // Ordenar por afinidad astral de mayor a menor
  resonances.sort((a, b) => b.affinityScore - a.affinityScore);

  return NextResponse.json(resonances);
}

export async function POST(request) {
  const token = await getAuthUser(request);
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