import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';
import { calculateAstralProfile } from '../../../lib/astrology';

export const runtime = 'edge';

// ─── ACCESO AL BINDING D1 ────────────────────────────────────────────────────
async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
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

  const { dob, name, image, bio, intent, location, photos } = body;
  const userId    = resolveUserId(token);
  const userName  = name ?? token.name ?? 'Sintonizador';
  const userEmail = token.email ?? `${userId}@zodia.eter`;

  if (!db) {
    return NextResponse.json({ success: true, mock: true });
  }

  // Si es solo una actualización de avatar
  if (image && !dob && bio === undefined && intent === undefined && photos === undefined) {
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

  // Si es una actualización de detalles del perfil (bio, intent, location, photos, name, image)
  if (bio !== undefined || intent !== undefined || location !== undefined || photos !== undefined) {
    try {
      if (name || image) {
        await db.prepare(`
          UPDATE users 
          SET name = COALESCE(?, name), image = COALESCE(?, image) 
          WHERE id = ?
        `).bind(name ?? null, image ?? null, userId).run();
      }

      const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
      await db.prepare(`
        UPDATE astral_profiles
        SET bio = COALESCE(?, bio),
            intent = COALESCE(?, intent),
            location = COALESCE(?, location),
            photos = COALESCE(?, photos)
        WHERE user_id = ?
      `).bind(
        bio ?? null,
        intent ?? null,
        location ?? null,
        photosStr,
        userId
      ).run();

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('[POST /api/profile] Error al actualizar detalles:', err);
      return NextResponse.json({ error: 'Error al actualizar detalles del perfil.' }, { status: 500 });
    }
  }

  if (!dob) {
    return NextResponse.json({ error: 'La fecha de nacimiento es requerida.' }, { status: 400 });
  }

  let astralProfile;
  try {
    astralProfile = calculateAstralProfile(dob);
  } catch (err) {
    console.error('[POST /api/profile] Fecha inválida:', dob, err);
    return NextResponse.json({ error: 'Fecha de nacimiento inválida.' }, { status: 400 });
  }

  const userImage = image ?? token.picture ?? null;
  const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);

  try {
    await db.prepare(`
      INSERT OR IGNORE INTO users (id, email, name, image)
      VALUES (?, ?, ?, ?)
    `).bind(userId, userEmail, userName, userImage).run();
  } catch (err) {
    console.error('[POST /api/profile] Error al insertar en users:', err);
  }

  try {
    await db.prepare(`
      INSERT OR REPLACE INTO astral_profiles
        (user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, bio, intent, location, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      dob,
      astralProfile.sign,
      astralProfile.element,
      astralProfile.lifePath,
      astralProfile.archetype,
      astralProfile.luz,
      astralProfile.sombra,
      bio ?? '',
      intent ?? 'Citas y Pareja',
      location ?? '',
      photosStr
    ).run();
  } catch (err) {
    console.error('[POST /api/profile] Error al persistir astral_profiles:', err);
  }

  return NextResponse.json({
    success: true,
    profile: {
      user_id:          userId,
      birth_date:       dob,
      sign:             astralProfile.sign,
      element:          astralProfile.element,
      life_path_number: astralProfile.lifePath,
      archetype:        astralProfile.archetype,
      luz:              astralProfile.luz,
      sombra:           astralProfile.sombra,
      bio:              bio ?? '',
      intent:           intent ?? 'Citas y Pareja',
      location:         location ?? '',
      photos:           photosStr
    },
  });
}
