import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { calculateAstralProfile } from '../../../lib/astrology';
import { sendWelcomeEmail } from '../../../lib/resend';
import { ensureDatabaseSchema } from '../../../lib/db-init';

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
  const rawId = resolveUserId(token);
  const userEmail = token.email ? token.email.toLowerCase().trim() : '';

  if (!db) {
    try {
      const { devStore } = await import('../../../lib/dev-store');
      const devUser = (devStore.users || []).find(u => u.id === rawId || (userEmail && u.email?.toLowerCase() === userEmail));
      const dob = devUser?.fecha_nacimiento || token.dob || '1998-07-15';
      const astralProfile = calculateAstralProfile(dob);

      return NextResponse.json({
        exists: true,
        profile: {
          user_id: devUser?.id || rawId,
          birth_date: dob,
          sign: astralProfile.sign,
          element: astralProfile.element,
          life_path_number: astralProfile.lifePath,
          archetype: astralProfile.archetype,
          luz: astralProfile.luz,
          sombra: astralProfile.sombra,
          bio: devUser?.bio || 'Amante de la astrología, la música y las conversaciones profundas bajo las estrellas ✨',
          intent: devUser?.intent || 'Citas y Pareja',
          location: devUser?.location || 'Santiago, Chile',
          photos: devUser?.photos || '[]',
          video_url: devUser?.video_url || null,
          interests: devUser?.interests || JSON.stringify(['Música indie', 'Café de especialidad', 'Astrología']),
          user_name: devUser?.name || token.name || 'Sintonizador',
          user_image: devUser?.image || token.picture || null
        }
      });
    } catch {
      const dob = token.dob || '1998-07-15';
      const astralProfile = calculateAstralProfile(dob);
      return NextResponse.json({
        exists: true,
        profile: {
          user_id: rawId,
          birth_date: dob,
          sign: astralProfile.sign,
          element: astralProfile.element,
          life_path_number: astralProfile.lifePath,
          archetype: astralProfile.archetype,
          user_name: token.name || 'Sintonizador',
          user_image: token.picture || null
        }
      });
    }
  }

  try {
    await ensureDatabaseSchema(db);
    const canonicalId = await resolveCanonicalUserId(db, token);
    const searchId = canonicalId || rawId;

    let profile = await db.prepare(`
      SELECT
        p.*,
        COALESCE(NULLIF(u.nombre_actual, ''), NULLIF(u.nombre_completo, ''), NULLIF(u.name, ''), u.email, 'Sintonizador') AS user_name,
        COALESCE(u.avatar_url, u.image) AS user_image
      FROM astral_profiles p
      LEFT JOIN users u ON u.id = p.user_id
      WHERE p.user_id = ? 
         OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(?))
         OR p.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?))
    `).bind(searchId, userEmail, userEmail).first();

    // Si el usuario o el perfil astral no existían en D1, generarlos y registrarlos inmediatamente
    if (!profile) {
      let u = await db.prepare(
        "SELECT id, name, nombre_actual, nombre_completo, email, image, avatar_url, fecha_nacimiento FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))"
      ).bind(searchId, userEmail).first();

      // Si no existía en users pero tiene sesión activa válida, auto-registrarlo en users
      if (!u && token && (token.email || token.name)) {
        const fallbackName = token.name || 'Sintonizador';
        const fallbackEmail = userEmail || `${searchId}@zodia.eter`;
        const fallbackImage = token.picture || token.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=0284c7&color=fff&bold=true`;
        const fallbackDob = token.dob || '1998-07-15';

        const fallbackHash = 'oauth_' + searchId;
        try {
          await db.prepare(`
            INSERT INTO users (id, email, name, nombre_actual, nombre_completo, fecha_nacimiento, image, avatar_url, status, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
            ON CONFLICT(id) DO UPDATE SET
              name = COALESCE(users.name, excluded.name),
              nombre_actual = COALESCE(users.nombre_actual, excluded.nombre_actual),
              image = COALESCE(users.image, excluded.image),
              avatar_url = COALESCE(users.avatar_url, excluded.avatar_url),
              status = 'active'
          `).bind(searchId, fallbackEmail, fallbackName, fallbackName, fallbackName, fallbackDob, fallbackImage, fallbackImage, fallbackHash).run();
        } catch (uInsErr) {
          try {
            await db.prepare(`
              INSERT INTO users (id, email, name, image, password_hash) VALUES (?, ?, ?, ?, ?)
            `).bind(searchId, fallbackEmail, fallbackName, fallbackImage, fallbackHash).run();
          } catch {}
        }

        u = await db.prepare("SELECT * FROM users WHERE id = ?").bind(searchId).first();
      }

      if (u) {
        const effectiveDob = u.fecha_nacimiento || token.dob || '1998-07-15';
        const astral = calculateAstralProfile(effectiveDob);
        const effectiveId = u.id || searchId;

        try {
          await db.prepare(`
            INSERT INTO astral_profiles (
              user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, intent, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Citas y Pareja', 'Santiago, Chile')
            ON CONFLICT(user_id) DO UPDATE SET
              birth_date = COALESCE(astral_profiles.birth_date, excluded.birth_date),
              sign = COALESCE(astral_profiles.sign, excluded.sign),
              element = COALESCE(astral_profiles.element, excluded.element)
          `).bind(
            effectiveId,
            effectiveDob,
            astral.sign,
            astral.element,
            astral.lifePath,
            astral.archetype,
            astral.luz,
            astral.sombra
          ).run();

          profile = await db.prepare("SELECT * FROM astral_profiles WHERE user_id = ?").bind(effectiveId).first();
          if (profile) {
            profile.user_name = u.nombre_actual || u.nombre_completo || u.name || token.name || 'Sintonizador';
            profile.user_image = u.avatar_url || u.image || token.picture || null;
          }
        } catch (genErr) {
          console.warn('[GET /api/profile] Auto-generate astral_profile warning:', genErr.message);
        }
      }
    }

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
  const rawId     = resolveUserId(token);
  const userName  = name ?? token.name ?? 'Sintonizador';
  const userEmail = token.email ? token.email.toLowerCase().trim() : `${rawId}@zodia.eter`;

  let actualUserId = rawId;
  let wasWithoutDob = false;

  if (db) {
    try {
      await ensureDatabaseSchema(db);

      const existingUser = await db.prepare(
        "SELECT id, name, nombre_actual, fecha_nacimiento FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))"
      ).bind(rawId, userEmail).first();

      if (existingUser) {
        actualUserId = existingUser.id;
        if (!existingUser.fecha_nacimiento) {
          wasWithoutDob = true;
        }
      } else {
        wasWithoutDob = true;
        const fallbackHash = 'oauth_' + actualUserId;
        try {
          await db.prepare(`
            INSERT INTO users (id, email, name, nombre_actual, nombre_completo, fecha_nacimiento, image, avatar_url, status, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
            ON CONFLICT(id) DO UPDATE SET
              name = COALESCE(users.name, excluded.name),
              nombre_actual = COALESCE(users.nombre_actual, excluded.nombre_actual),
              nombre_completo = COALESCE(users.nombre_completo, excluded.nombre_completo),
              image = COALESCE(users.image, excluded.image),
              avatar_url = COALESCE(users.avatar_url, excluded.avatar_url),
              status = 'active'
          `).bind(actualUserId, userEmail, userName, userName, userName, dob || null, image || null, image || null, fallbackHash).run();
        } catch (insErr) {
          // Si el conflicto fue por correo duplicado con otro ID, re-vincular a dicho ID
          const reCheck = await db.prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)").bind(userEmail).first();
          if (reCheck?.id) {
            actualUserId = reCheck.id;
          } else {
            try {
              await db.prepare("INSERT INTO users (id, email, name, image, password_hash) VALUES (?, ?, ?, ?, ?)").bind(actualUserId, userEmail, userName, image || null, fallbackHash).run();
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('[POST /api/profile] Check user error:', e.message);
    }
  }

  // 1. Si es solo una actualización de avatar
  if (image && !dob && name === undefined && bio === undefined && intent === undefined && photos === undefined && video_url === undefined && interests === undefined) {
    if (db) {
      try {
        await db.prepare(`
          UPDATE users 
          SET image = ?, avatar_url = ? 
          WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))
        `).bind(image, image, actualUserId, userEmail).run();
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error('[POST /api/profile] Error al actualizar imagen:', err);
        return NextResponse.json({ error: 'Error al guardar la imagen.' }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true, mock: true });
  }

  // 2. Si se incluye dob (fecha de nacimiento): recalculamos toda la carta astral y actualizamos users + astral_profiles
  if (dob) {
    let astralProfile;
    try {
      astralProfile = calculateAstralProfile(dob);
    } catch (err) {
      console.error('[POST /api/profile] Fecha inválida:', dob, err);
      return NextResponse.json({ error: 'Fecha de nacimiento inválida.' }, { status: 400 });
    }

    if (db) {
      try {
        await db.prepare(`
          UPDATE users 
          SET fecha_nacimiento = ?,
              name = COALESCE(?, name),
              nombre_actual = COALESCE(?, nombre_actual),
              nombre_completo = COALESCE(?, nombre_completo),
              image = COALESCE(?, image),
              avatar_url = COALESCE(?, avatar_url)
          WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))
        `).bind(dob, name ?? null, name ?? null, name ?? null, image ?? null, image ?? null, actualUserId, userEmail).run();
      } catch (uErr) {
        console.warn('[POST /api/profile] Error actualizando users con dob:', uErr.message);
      }

      const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
      const interestsStr = typeof interests === 'string' ? interests : JSON.stringify(interests || ['Música indie', 'Café de especialidad', 'Astrología']);

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
          actualUserId,
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
    }

    // Si es su primer registro de fecha de nacimiento y tiene correo real, enviar correo de bienvenida
    if (wasWithoutDob && userEmail.includes('@') && !userEmail.endsWith('@zodia.eter')) {
      try {
        await sendWelcomeEmail({
          to: userEmail,
          name: name || userName,
          sign: astralProfile.sign,
          element: astralProfile.element,
          lifePath: astralProfile.lifePath
        });
      } catch (mailErr) {
        console.warn('[Resend Welcome Email Error]:', mailErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        user_id: actualUserId,
        birth_date: dob,
        sign: astralProfile.sign,
        element: astralProfile.element,
        life_path_number: astralProfile.lifePath,
        archetype: astralProfile.archetype,
        luz: astralProfile.luz,
        sombra: astralProfile.sombra,
        bio: bio ?? '',
        intent: intent ?? 'Citas y Pareja',
        location: location ?? '',
        photos: photos !== undefined ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : '[]',
        video_url: video_url ?? null,
        interests: interests !== undefined ? (typeof interests === 'string' ? interests : JSON.stringify(interests)) : '[]',
        user_name: name || userName,
        user_image: image || token.picture || null
      }
    });
  }

  // 3. Si es una actualización de detalles sin cambiar dob (bio, intent, location, photos, video_url, interests, name, image)
  if (name !== undefined || bio !== undefined || intent !== undefined || location !== undefined || photos !== undefined || video_url !== undefined || interests !== undefined || image !== undefined) {
    if (db) {
      try {
        const firstPhoto = Array.isArray(photos) && photos.length > 0 ? photos[0] : (typeof photos === 'string' && photos.startsWith('[') ? JSON.parse(photos)[0] : null);
        const resolvedImage = image || firstPhoto || null;

        await db.prepare(`
          UPDATE users 
          SET name = COALESCE(?, name),
              nombre_actual = COALESCE(?, nombre_actual),
              nombre_completo = COALESCE(?, nombre_completo),
              image = COALESCE(?, image),
              avatar_url = COALESCE(?, avatar_url)
          WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))
        `).bind(name ?? null, name ?? null, name ?? null, resolvedImage, resolvedImage, actualUserId, userEmail).run();

        const photosStr = typeof photos === 'string' ? photos : JSON.stringify(photos || []);
        const interestsStr = typeof interests === 'string' ? interests : JSON.stringify(interests || []);

        // Comprobar si ya existe el registro en astral_profiles
        const existingAstral = await db.prepare(
          "SELECT user_id, birth_date FROM astral_profiles WHERE user_id = ? OR user_id = ?"
        ).bind(actualUserId, userEmail).first();

        if (existingAstral) {
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
            existingAstral.user_id
          ).run();
        } else {
          // Si no existía fila en astral_profiles, crearla con valores astrales calculados
          const uRow = await db.prepare("SELECT fecha_nacimiento FROM users WHERE id = ?").bind(actualUserId).first();
          const birthDate = uRow?.fecha_nacimiento || '1998-07-15';
          const astral = calculateAstralProfile(birthDate);

          await db.prepare(`
            INSERT INTO astral_profiles (
              user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, bio, intent, location, photos, video_url, interests
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            actualUserId,
            birthDate,
            astral.sign,
            astral.element,
            astral.lifePath,
            astral.archetype,
            astral.luz,
            astral.sombra,
            bio ?? null,
            intent ?? 'Citas y Pareja',
            location ?? 'Santiago, Chile',
            photosStr,
            video_url ?? null,
            interestsStr
          ).run();
        }
      } catch (err) {
        console.error('[POST /api/profile] Error al actualizar detalles:', err);
        return NextResponse.json({ error: 'Error al actualizar detalles del perfil.' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        user_id: actualUserId,
        user_name: name || userName,
        bio: bio ?? '',
        intent: intent ?? 'Citas y Pareja',
        location: location ?? '',
        photos: photos !== undefined ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : '[]',
        video_url: video_url ?? null,
        interests: interests !== undefined ? (typeof interests === 'string' ? interests : JSON.stringify(interests)) : '[]'
      }
    });
  }

  return NextResponse.json({ error: 'La fecha de nacimiento es requerida.' }, { status: 400 });
}
