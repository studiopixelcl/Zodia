import { calculateAstralProfile } from '../../../../lib/astrology';
import { hashPassword, verifyPassword } from '../../../../lib/auth-edge';
import { sendWelcomeEmail } from '../../../../lib/resend';

export const runtime = 'edge';

const COOKIE_NAME = 'next-auth.session-token';

// Memoria volátil para desarrollo local cuando D1 no está vinculado
const localMockUsers = new Map();

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
 * Soporta mode: 'register' y mode: 'login' con validación de contraseña y sesiones resilientes.
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: 'Payload inválido: ' + parseErr.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mode = body.mode || (body.isRegister ? 'register' : 'login');
    const rawEmail = (body.email || '').trim();
    const rawIdentifier = (body.identifier || body.email || body.name || '').trim();
    const trimmedName = (body.name || '').trim();
    const password = (body.password || '').trim();
    const dob = body.dob || '1998-07-15';

    const db = await getDB();

    // Migraciones en segundo plano si la base de datos está disponible
    if (db) {
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run();
      } catch {}
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN ban_reason TEXT").run();
      } catch {}
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN password_hash TEXT").run();
      } catch {}
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN reset_code TEXT").run();
      } catch {}
      try {
        await db.prepare("ALTER TABLE users ADD COLUMN reset_expires INTEGER").run();
      } catch {}
    }

    // ─── MODO REGISTRO ────────────────────────────────────────────────────────
    if (mode === 'register') {
      if (!trimmedName) {
        return new Response(JSON.stringify({ error: 'Tu nombre o alias es obligatorio.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!password || password.length < 4) {
        return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 4 caracteres.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const cleanIdentifier = rawEmail 
        ? rawEmail.replace(/[@.]/g, '_').toLowerCase() 
        : trimmedName.toLowerCase().replace(/\s+/g, '');
      const userId = cleanIdentifier.startsWith('tuner_') ? cleanIdentifier : 'tuner_' + cleanIdentifier;
      const userEmail = rawEmail.includes('@') ? rawEmail : `${userId}@zodia.eter`;
      const userImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=06b6d4&color=fff&bold=true`;

      const passwordHash = await hashPassword(password);

      if (db) {
        try {
          const existing = await db.prepare(`
            SELECT id, email, status, ban_reason FROM users 
            WHERE id = ? OR email = ?
          `).bind(userId, userEmail).first();

          if (existing && existing.status === 'banned') {
            return new Response(JSON.stringify({
              error: `Esta cuenta se encuentra suspendida: ${existing.ban_reason || 'Infracción comunitaria.'}`
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          }

          // Insertar o actualizar usuario
          await db.prepare(`
            INSERT INTO users (id, email, name, nombre_completo, nombre_actual, fecha_nacimiento, image, avatar_url, status, password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              nombre_completo = excluded.nombre_completo,
              nombre_actual = excluded.nombre_actual,
              fecha_nacimiento = excluded.fecha_nacimiento,
              email = excluded.email,
              password_hash = COALESCE(excluded.password_hash, users.password_hash),
              image = COALESCE(users.image, excluded.image),
              avatar_url = COALESCE(users.avatar_url, excluded.avatar_url)
          `).bind(userId, userEmail, trimmedName, trimmedName, trimmedName, dob, userImage, userImage, passwordHash).run();

          // Perfil astral
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

          // Enviar correo cósmico de bienvenida vía Resend
          if (userEmail.includes('@') && !userEmail.endsWith('@zodia.eter')) {
            try {
              await sendWelcomeEmail({
                to: userEmail,
                name: trimmedName,
                sign: astral.sign,
                element: astral.element,
                lifePath: astral.lifePath
              });
            } catch (mailErr) {
              console.warn('[Resend Welcome Error]:', mailErr.message);
            }
          }
        } catch (dbErr) {
          console.warn('[POST /api/auth/login - Register] Warning D1:', dbErr.message);
        }
      }

      // Guardar también en mock para dev local
      const mockObj = {
        id: userId,
        name: trimmedName,
        email: userEmail,
        image: userImage,
        dob,
        passwordHash
      };
      localMockUsers.set(userEmail.toLowerCase(), mockObj);
      localMockUsers.set(userId.toLowerCase(), mockObj);
      localMockUsers.set(trimmedName.toLowerCase(), mockObj);

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
    }

    // ─── MODO INICIO DE SESIÓN ────────────────────────────────────────────────
    if (!rawIdentifier) {
      return new Response(JSON.stringify({ error: 'Ingresa tu correo o nombre de usuario.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanId = rawIdentifier.replace(/[@.]/g, '_').toLowerCase().replace(/\s+/g, '');
    const candidateUserId = cleanId.startsWith('tuner_') ? cleanId : 'tuner_' + cleanId;
    const candidateEmail = rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : `${candidateUserId}@zodia.eter`;

    let matchedUser = null;
    let userBirthDate = dob;

    if (db) {
      try {
        const found = await db.prepare(`
          SELECT u.id, u.name, u.email, u.image, u.status, u.ban_reason, u.password_hash,
                 p.birth_date, p.sign, p.element
          FROM users u
          LEFT JOIN astral_profiles p ON p.user_id = u.id
          WHERE LOWER(u.name) = LOWER(?) OR u.id = ? OR LOWER(u.email) = LOWER(?) OR u.id = ?
        `).bind(rawIdentifier, candidateUserId, candidateEmail, rawIdentifier).first();

        if (found) {
          matchedUser = found;
          if (found.birth_date) userBirthDate = found.birth_date;

          if (found.status === 'banned') {
            return new Response(JSON.stringify({
              error: `Esta cuenta ha sido suspendida. Motivo: ${found.ban_reason || 'Infracción de normas cósmicas.'}`
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
          }

          // Si el usuario tiene contraseña configurada, validarla
          if (found.password_hash) {
            if (!password) {
              return new Response(JSON.stringify({ error: 'Por favor ingresa tu contraseña cósmica.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            const isPasswordValid = await verifyPassword(password, found.password_hash);
            if (!isPasswordValid) {
              return new Response(JSON.stringify({
                error: 'Contraseña incorrecta. Por favor verifica o usa "¿Olvidaste tu contraseña?".'
              }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
          }
        }
      } catch (dbErr) {
        console.warn('[POST /api/auth/login - Login] Warning D1:', dbErr.message);
      }
    } else {
      // Entorno dev local sin D1: verificar en mock
      const mockKey = rawIdentifier.toLowerCase();
      const found = localMockUsers.get(mockKey) || localMockUsers.get(candidateEmail.toLowerCase()) || localMockUsers.get(candidateUserId.toLowerCase());
      if (found) {
        matchedUser = found;
        if (found.dob) userBirthDate = found.dob;
        if (found.passwordHash) {
          if (!password) {
            return new Response(JSON.stringify({ error: 'Por favor ingresa tu contraseña cósmica.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          const isPasswordValid = await verifyPassword(password, found.passwordHash);
          if (!isPasswordValid) {
            return new Response(JSON.stringify({
              error: 'Contraseña incorrecta. Por favor verifica o usa "¿Olvidaste tu contraseña?".'
            }), { status: 401, headers: { 'Content-Type': 'application/json' } });
          }
        }
      }
    }

    const finalId = matchedUser?.id || candidateUserId;
    const finalName = matchedUser?.name || trimmedName || (rawIdentifier.includes('@') ? rawIdentifier.split('@')[0] : rawIdentifier);
    const finalEmail = matchedUser?.email || candidateEmail;
    const finalImage = matchedUser?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=06b6d4&color=fff&bold=true`;

    const userSession = {
      id: finalId,
      name: finalName,
      email: finalEmail,
      image: finalImage,
      dob: userBirthDate
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
      url: '/zodia/dashboard',
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
