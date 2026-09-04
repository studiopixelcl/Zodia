import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { calculateResonance } from '../../../lib/astrology';
import { DATING_CANDIDATES } from '../../../lib/dating';
import { ensureDatabaseSchema } from '../../../lib/db-init';

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
  const maxDistParam = searchParams.get('maxDist')?.toLowerCase() || 'todos';
  const minAge = parseInt(searchParams.get('minAge') || '18', 10);
  const maxAge = parseInt(searchParams.get('maxAge') || '99', 10);

  const db = await getDB();
  const rawMyId = resolveUserId(token);
  const myEmail = token.email ? token.email.toLowerCase().trim() : '';

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
      await ensureDatabaseSchema(db);
      const myCanonicalId = await resolveCanonicalUserId(db, token);
      const activeMyId = myCanonicalId || rawMyId;

      // 1. Obtener mi perfil astral
      const fetched = await db.prepare(`
        SELECT p.* FROM astral_profiles p
        WHERE p.user_id = ? 
           OR p.user_id = ?
           OR (p.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?)))
      `).bind(activeMyId, rawMyId, myEmail).first();

      if (fetched) {
        myProfile = fetched;
      }

      // 2. Obtener todos los demás sintonizadores reales desde la tabla users
      const dbOthers = await db.prepare(`
        SELECT 
          u.id as user_id, 
          COALESCE(NULLIF(u.nombre_actual, ''), NULLIF(u.nombre_completo, ''), NULLIF(u.name, ''), u.email, 'Sintonizador') as name, 
          COALESCE(u.avatar_url, u.image) as image,
          COALESCE(NULLIF(u.fecha_nacimiento, ''), p.birth_date, '1998-07-15') as birth_date,
          COALESCE(p.sign, 'Cosmos') as sign,
          COALESCE(p.element, 'Éter') as element,
          COALESCE(p.life_path_number, 9) as life_path_number,
          COALESCE(p.archetype, 'El Explorador') as archetype,
          COALESCE(p.bio, '') as bio,
          COALESCE(p.intent, 'Citas y Pareja') as intent,
          COALESCE(p.location, 'Santiago, Chile') as location,
          COALESCE(p.photos, '[]') as photos,
          p.video_url,
          COALESCE(p.interests, '["Astrología", "Música indie"]') as interests,
          COALESCE(u.is_verified, p.is_verified, 0) as is_verified
        FROM users u
        LEFT JOIN astral_profiles p ON (
          p.user_id = u.id 
          OR (u.email IS NOT NULL AND LOWER(p.user_id) = LOWER(u.email))
          OR (u.email IS NOT NULL AND p.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(u.email)))
        )
        WHERE u.id NOT IN (?, ?)
          AND (u.email IS NULL OR LOWER(u.email) != LOWER(?))
          AND u.id NOT LIKE 'candidate_%'
          AND u.id NOT LIKE 'guide_%'
          AND u.id != 'zodia_bot'
          AND (u.email IS NULL OR u.email NOT LIKE '%@zodia.eter')
          AND u.id != 'tuner_bot_spam'
          AND COALESCE(u.status, 'active') = 'active'
          AND COALESCE(u.is_ghost_mode, p.is_ghost_mode, 0) = 0
        ORDER BY COALESCE(u.created_at, u.rowid) DESC
        LIMIT 60
      `).bind(activeMyId, rawMyId, myEmail).all();

      othersList = (dbOthers.results || []).map(o => {
        let photoList = [];
        try {
          photoList = typeof o.photos === 'string' ? JSON.parse(o.photos) : (o.photos || []);
        } catch {}
        if (!Array.isArray(photoList)) photoList = [];
        if (photoList.length === 0 && o.image) {
          photoList = [o.image];
        }

        let interestsList = ['Astrología', 'Música indie'];
        try {
          interestsList = typeof o.interests === 'string' ? JSON.parse(o.interests) : (o.interests || interestsList);
        } catch {}
        if (!Array.isArray(interestsList)) interestsList = ['Astrología', 'Música indie'];

        let age = 26;
        if (o.birth_date && o.birth_date.length >= 4) {
          const birthYear = parseInt(o.birth_date.slice(0, 4), 10);
          if (!isNaN(birthYear) && birthYear > 1920 && birthYear < 2015) {
            age = Math.max(18, new Date().getFullYear() - birthYear);
          }
        }

        const HIGHRES_ELEMENT_PORTRAITS = {
          Fuego: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=85",
          Tierra: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop&q=85",
          Aire: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=85",
          Agua: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format&fit=crop&q=85",
          Éter: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&auto=format&fit=crop&q=85",
          Default: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&auto=format&fit=crop&q=85"
        };
        const fallback = HIGHRES_ELEMENT_PORTRAITS[o.element] || HIGHRES_ELEMENT_PORTRAITS.Default;
        let resolvedImage = o.image;
        if (!resolvedImage || resolvedImage.includes('ui-avatars.com')) {
          resolvedImage = (photoList.length > 0 && !photoList[0].includes('ui-avatars.com')) ? photoList[0] : fallback;
        }

        const cleanPhotos = photoList
          .map(p => (typeof p === 'string' && p.includes('ui-avatars.com') ? fallback : p))
          .filter(Boolean);
        if (cleanPhotos.length === 0) {
          cleanPhotos.push(resolvedImage);
        }

        return {
          id: o.user_id,
          name: o.name,
          age,
          image: resolvedImage,
          sign: o.sign,
          element: o.element,
          path: o.life_path_number,
          archetype: o.archetype,
          bio: o.bio ?? '',
          intent: o.intent ?? 'Citas y Pareja',
          location: o.location ?? 'Santiago, Chile',
          distanceKm: 3.5,
          photos: cleanPhotos,
          video_url: o.video_url || null,
          interests: interestsList,
          is_verified: o.is_verified === 1 || o.is_verified === true,
          isRealUser: true
        };
      });
    } catch (err) {
      console.error("Error consultando D1 en /api/resonances:", err);
    }
  }

  // Integrar catálogo simulado únicamente si no hay colisión con sintonizadores reales
  const existingIds = new Set(othersList.map(o => o.id));
  const realNames = othersList.map(o => (o.name || '').toLowerCase());

  for (const candidate of DATING_CANDIDATES) {
    if (!existingIds.has(candidate.id) && candidate.id !== rawMyId) {
      // Si existe un sintonizador real con el mismo nombre (ej: Camila), suprimir candidato simulado para no eclipsar al usuario auténtico
      const candidateFirst = (candidate.name || '').toLowerCase().split(' ')[0];
      const hasRealConflict = realNames.some(rn => rn.includes(candidateFirst));
      if (hasRealConflict) continue;

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
        distanceKm: candidate.distanceKm || 4,
        photos: candidate.photos || [candidate.image],
        video_url: candidate.video_url || null,
        interests: candidate.interests || ['Astrología', 'Música indie'],
        likesYou: candidate.likesYou ?? false,
        is_verified: candidate.is_verified ?? true,
        isRealUser: false
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

  // Filtro por Distancia Geográfica máxima (km)
  if (maxDistParam && maxDistParam !== 'todos') {
    const maxD = parseInt(maxDistParam, 10);
    if (!isNaN(maxD) && maxD > 0) {
      resonances = resonances.filter(r => (r.distanceKm ?? 4) <= maxD);
    }
  }

  // Filtro por Rango de Edad
  if (minAge > 18 || maxAge < 99) {
    resonances = resonances.filter(r => {
      const a = r.age ?? 26;
      return a >= minAge && a <= maxAge;
    });
  }

  // PRIORIDAD MÁXIMA: Los sintonizadores reales auténticos van siempre primero en la fila de Citas
  resonances.sort((a, b) => {
    if (a.isRealUser && !b.isRealUser) return -1;
    if (!a.isRealUser && b.isRealUser) return 1;
    return b.affinityScore - a.affinityScore;
  });

  return NextResponse.json(resonances);
}

export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const rawId = resolveUserId(token);

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
    await ensureDatabaseSchema(db);
    const myId = (await resolveCanonicalUserId(db, token)) || rawId;

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