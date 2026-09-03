import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';
import { calculateAstralProfile } from '../../../lib/astrology';

export const runtime = 'edge';

// ─── ACCESO AL BINDING D1 ────────────────────────────────────────────────────
async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

// ─── GET /api/profile ─────────────────────────────────────────────────────────
export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getDB();
  const userId = resolveUserId(token);

  if (!db) {
    const dob = token.dob || '1998-07-15';
    let astralProfile;
    try {
      astralProfile = calculateAstralProfile(dob);
    } catch {
      astralProfile = calculateAstralProfile('1998-07-15');
    }

    return NextResponse.json({
      exists: true,
      profile: {
        user_id: userId,
        birth_date: dob,
        sign: astralProfile.sign,
        element: astralProfile.element,
        life_path_number: astralProfile.lifePath,
        archetype: astralProfile.archetype,
        luz: astralProfile.luz,
        sombra: astralProfile.sombra,
        bio: 'Amante de la astrología, la música y las conversaciones profundas bajo las estrellas ✨',
        intent: 'Citas y Pareja',
        location: 'Santiago, Chile',
        photos: JSON.stringify([]),
        interests: JSON.stringify(['Música indie', 'Café de especialidad', 'Astrología']),
        user_name: token.name || 'Sintonizador',
        user_image: token.picture || null
      }
    });
  }

  try {
    const profile = await db.prepare(`
      SELECT
        p.*,
        u.name  AS user_name,
        u.image AS user_image
      FROM astral_profiles p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ?
    `).bind(userId).first();

    return NextResponse.json({ exists: !!profile, profile: profile ?? null });

  } catch (err) {
    console.error('[GET /api/profile] Error D1:', err);
    return NextResponse.json(
      { error: 'Fallo al consultar el perfil astral.' },
      { status: 500 }
    );
  }
}

// ─── POST /api/profile ────────────────────────────────────────────────────────
export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getDB();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const { dob, name, image, bio, intent, location, photos, video_url, interests } = body;
  const userId    = resolveUserId(token);
  const userName  = name ?? token.name ?? 'Sintonizador';
  const userEmail = token.email ?? `${userId}@zodia.eter`;

  if (!db) {
    return NextResponse.json({ success: true, mock: true });
  }

  // Si es solo una actualización de avatar
  if (image && !dob && bio === undefined && intent === undefined && photos === undefined && video_url === undefined && interests === undefined) {
    try {
      await db.prepare(`UPDATE users SET image = ? WHERE id = ?`)
        .bind(image, userId)
        .run();
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('[POST /api/profile] Error al actualizar imagen:', err);
      return NextResponse.json({ error: 'Error al guardar la imagen.' }, { status: 500 });
    }
  }

  // Si se incluye dob (fecha de nacimiento): recalculamos toda la carta astral y actualizamos users + astral_profiles
  if (dob) {
    let astralProfile;
    try {
      astralProfile = calculateAstralProfile(dob);
    } catch (err) {
      console.error('[POST /api/profile] Fecha inválida:', dob, err);
      return NextResponse.json({ error: 'Fecha de nacimiento inválida.' }, { status: 400 });
    }

    try {
      await db.prepare(`
        UPDATE users 
        SET fecha_nacimiento = ?,
            name = COALESCE(?, name),
            image = COALESCE(?, image)
        WHERE id = ?
      `).bind(dob, name ?? null, image ?? null, userId).run();
    } catch (uErr) {
      console.warn('[POST /api/profile] Error actualizando users con dob:', uErr.message);
    }

    const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
    const interestsStr = typeof interests === 'string' ? interests : JSON.stringify(interests || ['Música indie', 'Café de especialidad', 'Astrología']);

    try {
      await db.prepare(`ALTER TABLE astral_profiles ADD COLUMN interests TEXT`).run();
    } catch {}
    try {
      await db.prepare(`ALTER TABLE astral_profiles ADD COLUMN video_url TEXT`).run();
    } catch {}

    try {
      await db.prepare(`
        INSERT INTO astral_profiles (
          user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, bio, intent, location, photos, video_url, interests
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          birth_date = excluded.birth_date,
          sign = excluded.sign,
          element = excluded.element,
          life_path_number = excluded.life_path_number,
          archetype = excluded.archetype,
          luz = excluded.luz,
          sombra = excluded.sombra,
          bio = COALESCE(excluded.bio, astral_profiles.bio),
          intent = COALESCE(excluded.intent, astral_profiles.intent),
          location = COALESCE(excluded.location, astral_profiles.location),
          photos = COALESCE(excluded.photos, astral_profiles.photos),
          video_url = COALESCE(excluded.video_url, astral_profiles.video_url),
          interests = COALESCE(excluded.interests, astral_profiles.interests)
      `).bind(
        userId,
        dob,
        astralProfile.sign,
        astralProfile.element,
        astralProfile.lifePath,
        astralProfile.archetype,
        astralProfile.luz,
        astralProfile.sombra,
        bio ?? null,
        intent ?? null,
        location ?? null,
        photos !== undefined ? photosStr : null,
        video_url !== undefined ? video_url : null,
        interests !== undefined ? interestsStr : null
      ).run();
    } catch (pErr) {
      console.error('[POST /api/profile] Error al persistir astral_profiles con dob:', pErr);
    }

    return NextResponse.json({
      success: true,
      profile: {
        user_id: userId,
        birth_date: dob,
        sign: astralProfile.sign,
        element: astralProfile.element,
        life_path_number: astralProfile.lifePath,
        archetype: astralProfile.archetype,
        luz: astralProfile.luz,
        sombra: astralProfile.sombra,
        bio,
        intent,
        location,
        photos,
        video_url,
        interests
      }
    });
  }

  // Si es una actualización de detalles sin cambiar dob (bio, intent, location, photos, video_url, interests, name, image)
  if (bio !== undefined || intent !== undefined || location !== undefined || photos !== undefined || video_url !== undefined || interests !== undefined) {
    try {
      if (name || image) {
        await db.prepare(`
          UPDATE users 
          SET name = COALESCE(?, name), image = COALESCE(?, image) 
          WHERE id = ?
        `).bind(name ?? null, image ?? null, userId).run();
      }

      const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
      const interestsStr = typeof interests === 'string' ? interests : JSON.stringify(interests || []);

      try {
        await db.prepare(`ALTER TABLE astral_profiles ADD COLUMN interests TEXT`).run();
      } catch {}
      try {
        await db.prepare(`ALTER TABLE astral_profiles ADD COLUMN video_url TEXT`).run();
      } catch {}

      await db.prepare(`
        UPDATE astral_profiles
        SET bio = COALESCE(?, bio),
            intent = COALESCE(?, intent),
            location = COALESCE(?, location),
            photos = COALESCE(?, photos),
            video_url = COALESCE(?, video_url),
            interests = COALESCE(?, interests)
        WHERE user_id = ?
      `).bind(
        bio ?? null,
        intent ?? null,
        location ?? null,
        photos !== undefined ? photosStr : null,
        video_url !== undefined ? video_url : null,
        interests !== undefined ? interestsStr : null,
        userId
      ).run();

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('[POST /api/profile] Error al actualizar detalles:', err);
      return NextResponse.json({ error: 'Error al actualizar detalles del perfil.' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'La fecha de nacimiento es requerida.' }, { status: 400 });
}
