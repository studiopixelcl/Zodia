import { calculateAstralProfile } from '../../../../lib/astrology';

export const runtime = 'edge';

const COOKIE_NAME = 'next-auth.session-token';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/login
 * Endpoint directo, seguro y perimetral para inicio de sesión y registro en Zodia.
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Payload inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const trimmedName = (body.name || '').trim();
    const rawEmail = (body.email || '').trim();
    const dob = body.dob || '1998-07-15';

    if (!trimmedName) {
      return new Response(JSON.stringify({ error: 'El nombre o alias es obligatorio.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanIdentifier = rawEmail ? rawEmail.replace(/[@.]/g, '_').toLowerCase() : trimmedName.toLowerCase().replace(/\s+/g, '');
    const userId = 'tuner_' + cleanIdentifier;
    const userEmail = rawEmail.includes('@') ? rawEmail : `${userId}@zodia.eter`;
    const userImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=06b6d4&color=fff&bold=true`;

    // Intentar registrar o actualizar en D1 si la base de datos está disponible
    const db = await getDB();
    if (db) {
      try {
        // Verificar si la columna status existe, si no, agregarla
        try {
          await db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run();
        } catch {}

        // Comprobar estado de baneo
        const existingUser = await db.prepare("SELECT id, status, ban_reason FROM users WHERE id = ?").bind(userId).first();
        if (existingUser && existingUser.status === 'banned') {
          return new Response(JSON.stringify({
            error: `Esta cuenta ha sido suspendida. Motivo: ${existingUser.ban_reason || 'Infracción de normas cósmicas.'}`,
            banned: true
          }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Insertar o ignorar usuario
        await db.prepare(`
          INSERT INTO users (id, email, name, image, status)
          VALUES (?, ?, ?, ?, 'active')
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            image = COALESCE(users.image, excluded.image)
        `).bind(userId, userEmail, trimmedName, userImage).run();

        // Calcular perfil astral e insertar si no existe
        const astral = calculateAstralProfile(dob);
        await db.prepare(`
          INSERT OR IGNORE INTO astral_profiles 
          (user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, intent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          dob,
          astral.sign,
          astral.element,
          astral.lifePath,
          astral.archetype,
          astral.luz,
          astral.sombra,
          'Citas y Pareja'
        ).run();

      } catch (dbErr) {
        console.warn('[POST /api/auth/login] Warning D1 (continuando con sesión):', dbErr.message);
      }
    }

    const userSession = {
      id: userId,
      name: trimmedName,
      email: userEmail,
      image: userImage,
      dob: dob
    };

    const cookieVal = encodeURIComponent(JSON.stringify(userSession));
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.append(
      'Set-Cookie',
      `${COOKIE_NAME}=${cookieVal}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
    );

    return new Response(JSON.stringify({
      success: true,
      url: '/zodia/welcome',
      user: userSession
    }), {
      status: 200,
      headers
    });

  } catch (err) {
    console.error('[POST /api/auth/login] Error crítico:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
