import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { calculateResonance } from '../../../lib/astrology';
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

// Estado en memoria de sesiones de citas a ciegas activas
const activeBlindSessions = new Map();

async function findRealCandidate(db, activeId, rawId, myEmail) {
  if (!db) return null;

  try {
    await ensureDatabaseSchema(db);

    // 1. Obtener mi perfil astral
    const myProfile = await db.prepare(`
      SELECT p.* FROM astral_profiles p
      WHERE p.user_id = ? 
         OR p.user_id = ?
         OR (p.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?)))
    `).bind(activeId, rawId, myEmail).first() || {
      sign: "Capricornio",
      element: "Tierra",
      life_path_number: 9,
      archetype: "El Ermitaño"
    };

    // 2. Obtener IDs de usuarios con los que ya existe Match mutuo (resonances)
    const matchesRows = await db.prepare(`
      SELECT CASE WHEN user_a_id IN (?, ?) THEN user_b_id ELSE user_a_id END AS other_id
      FROM resonances
      WHERE user_a_id IN (?, ?) OR user_b_id IN (?, ?)
    `).bind(activeId, rawId, activeId, rawId).all().catch(() => ({ results: [] }));
    const matchedIds = new Set((matchesRows?.results || []).map(r => r.other_id).filter(Boolean));

    // 3. Obtener sintonizadores reales registrados
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
        COALESCE(p.interests, '["Astrología", "Música indie"]') as interests
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
      LIMIT 40
    `).bind(activeId, rawId, myEmail).all();

    const candidates = (dbOthers.results || []).filter(o => !matchedIds.has(o.user_id));
    if (candidates.length === 0) return null;

    // Seleccionar uno de los candidatos reales aleatoriamente
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    let age = 26;
    if (chosen.birth_date && chosen.birth_date.length >= 4) {
      const birthYear = parseInt(chosen.birth_date.slice(0, 4), 10);
      if (!isNaN(birthYear) && birthYear > 1920 && birthYear < 2015) {
        age = Math.max(18, new Date().getFullYear() - birthYear);
      }
    }

    let interestsList = ['Astrología', 'Música indie'];
    try {
      interestsList = typeof chosen.interests === 'string' ? JSON.parse(chosen.interests) : (chosen.interests || interestsList);
    } catch {}
    if (!Array.isArray(interestsList)) interestsList = ['Astrología', 'Música indie'];

    const HIGHRES_ELEMENT_PORTRAITS = {
      Fuego: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=85",
      Tierra: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop&q=85",
      Aire: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&auto=format&fit=crop&q=85",
      Agua: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&auto=format&fit=crop&q=85",
      Éter: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&auto=format&fit=crop&q=85",
      Default: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&auto=format&fit=crop&q=85"
    };
    const fallbackImage = HIGHRES_ELEMENT_PORTRAITS[chosen.element] || HIGHRES_ELEMENT_PORTRAITS.Default;
    let resolvedImage = chosen.image;
    if (!resolvedImage || resolvedImage.includes('ui-avatars.com')) {
      resolvedImage = fallbackImage;
    }

    const baseScore = calculateResonance(myProfile, {
      element: chosen.element,
      lifePath: chosen.life_path_number,
      archetype: chosen.archetype
    });
    const affinityScore = Math.min(99, Math.max(65, baseScore));

    return {
      id: chosen.user_id,
      name: chosen.name.split(' ')[0],
      fullName: chosen.name,
      sign: chosen.sign,
      element: chosen.element,
      age,
      affinity: `${affinityScore}%`,
      bio: chosen.bio || 'Sintonizando el cosmos en busca de conexiones auténticas.',
      interests: interestsList,
      image: resolvedImage,
      archetype: chosen.archetype,
      path: chosen.life_path_number,
      intent: chosen.intent,
      isRealUser: true
    };
  } catch (err) {
    console.error("Error al buscar candidato real para cita a ciegas:", err);
    return null;
  }
}

export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const rawId = resolveUserId(token);
  const myEmail = token.email ? token.email.toLowerCase().trim() : '';
  const myCanonicalId = db ? await resolveCanonicalUserId(db, token) : null;
  const activeId = myCanonicalId || rawId;

  let session = activeBlindSessions.get(rawId);

  if (!session) {
    const partnerCandidate = await findRealCandidate(db, activeId, rawId, myEmail);

    if (!partnerCandidate) {
      return NextResponse.json({ 
        session: null, 
        noAvailableUsers: true,
        message: "No hay otros sintonizadores reales disponibles para citas a ciegas en este momento."
      });
    }

    session = {
      id: 'blind_' + Date.now(),
      userId: rawId,
      partner: partnerCandidate,
      durationSeconds: 300,
      userRevealed: false,
      partnerRevealed: false,
      isFullyRevealed: false,
      createdAt: Date.now()
    };
    activeBlindSessions.set(rawId, session);
  }

  return NextResponse.json({ session });
}

export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { action } = body;
  const rawId = resolveUserId(token);
  const myEmail = token.email ? token.email.toLowerCase().trim() : '';
  const myCanonicalId = db ? await resolveCanonicalUserId(db, token) : null;
  const activeId = myCanonicalId || rawId;

  let session = activeBlindSessions.get(rawId);

  if (action === 'start_new') {
    const partnerCandidate = await findRealCandidate(db, activeId, rawId, myEmail);

    if (!partnerCandidate) {
      activeBlindSessions.delete(rawId);
      return NextResponse.json({ 
        session: null, 
        noAvailableUsers: true,
        message: "No hay otros sintonizadores reales disponibles para citas a ciegas en este momento." 
      });
    }

    session = {
      id: 'blind_' + Date.now(),
      userId: rawId,
      partner: partnerCandidate,
      durationSeconds: 300,
      userRevealed: false,
      partnerRevealed: false,
      isFullyRevealed: false,
      createdAt: Date.now()
    };
    activeBlindSessions.set(rawId, session);
    return NextResponse.json({ session });
  }

  if (action === 'reveal') {
    if (!session) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 400 });
    }

    session.userRevealed = true;
    session.partnerRevealed = true;
    session.isFullyRevealed = true;

    activeBlindSessions.set(rawId, session);
    return NextResponse.json({ 
      success: true, 
      session,
      isFullyRevealed: true 
    });
  }

  if (action === 'leave') {
    activeBlindSessions.delete(rawId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
