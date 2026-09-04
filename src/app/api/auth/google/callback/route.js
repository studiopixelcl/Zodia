import { ensureDatabaseSchema } from '../../../../../lib/db-init';
import { calculateAstralProfile } from '../../../../../lib/astrology';

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

async function getGoogleConfig() {
  let clientId = process.env.GOOGLE_CLIENT_ID || '';
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const env = getRequestContext()?.env;
    if (env?.GOOGLE_CLIENT_ID) clientId = env.GOOGLE_CLIENT_ID;
    if (env?.GOOGLE_CLIENT_SECRET) clientSecret = env.GOOGLE_CLIENT_SECRET;
  } catch {}

  return { clientId, clientSecret };
}

/**
 * Genera una página HTML de transición para establecer sesión en Cookie y LocalStorage
 */
function createAuthSuccessResponse(userSession, targetUrl) {
  const cookieVal = encodeURIComponent(JSON.stringify(userSession));
  const maxAge = 30 * 24 * 60 * 60;
  const cookieHeader = `${COOKIE_NAME}=${cookieVal}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Iniciando sesión en Zodia...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      background: #07080D;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      text-align: center;
      padding: 24px;
      max-width: 320px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <script>
    try {
      localStorage.setItem('zodia_session', JSON.stringify(${JSON.stringify(userSession)}));
      document.cookie = ${JSON.stringify(cookieHeader)};
    } catch(e) {}
    window.location.replace(${JSON.stringify(targetUrl)});
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <p style="font-size: 14px; font-weight: 600; color: #38bdf8; margin: 0 0 4px;">Autenticación exitosa</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">Entrando a tu cuenta en Zodia...</p>
  </div>
</body>
</html>`;

  const headers = new Headers();
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.append('Set-Cookie', cookieHeader);

  return new Response(html, {
    status: 200,
    headers
  });
}

function createErrorResponse(message, hint = '') {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Aviso de Autenticación | Zodia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      background: #07080D;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .box {
      max-width: 440px;
      background: #0f121d;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      padding: 28px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }
    h2 { color: #f87171; font-size: 18px; margin: 0 0 12px; }
    p { color: #cbd5e1; font-size: 13px; line-height: 1.6; margin: 0 0 16px; }
    .hint { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; font-size: 12px; color: #38bdf8; margin-bottom: 20px; }
    .btn { display: inline-block; background: #38bdf8; color: #000; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 12px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Aviso de Inicio de Sesión</h2>
    <p>${message}</p>
    ${hint ? `<div class="hint">${hint}</div>` : ''}
    <a href="/zodia" class="btn">Volver al Inicio</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/**
 * GET /api/auth/google/callback
 * Procesa el retorno de Google OAuth, crea/autentica el usuario y establece la sesión
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    const host = request.headers.get('host') || 'zodia.studiopixel.cl';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;
    const redirectUri = `${baseUrl}/zodia/api/auth/google/callback`;

    if (error) {
      return createErrorResponse('Google reportó una cancelación o error en el inicio de sesión.', `Detalle: ${error}`);
    }

    if (!code) {
      return createErrorResponse('No se recibió el código de autorización desde Google.');
    }

    const { clientId, clientSecret } = await getGoogleConfig();

    if (!clientSecret || clientSecret === 'tu_secreto') {
      return createErrorResponse(
        'Falta configurar el Secreto de Cliente en Cloudflare Pages.',
        'Ingresa al panel de Cloudflare Pages > zodia-web > Settings > Environment Variables y agrega la variable secreta GOOGLE_CLIENT_SECRET con el valor obtenido de Google Cloud Console.'
      );
    }

    // 1. Intercambiar código por token de acceso
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return createErrorResponse(
        'Google rechazó el intercambio de credenciales.',
        `Respuesta de Google: ${tokenData.error_description || tokenData.error || 'Token no emitido'}. Revisa que el GOOGLE_CLIENT_SECRET coincida con tu proyecto de Google Cloud.`
      );
    }

    // 2. Obtener datos de perfil del usuario desde Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return createErrorResponse('Google no proporcionó una dirección de correo para esta cuenta.');
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || email.split('@')[0];
    const image = googleUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&bold=true`;
    
    // 3. Persistir o enlazar usuario en Cloudflare D1
    const db = await getDB();
    let finalUserId = '';
    let finalName = name;
    let finalImage = image;
    let finalDob = '';
    let isExistingUser = false;

    if (db) {
      try {
        await ensureDatabaseSchema(db);

        // Buscar si ya existe una cuenta registrada con este correo (o ID previo)
        const cleanId = email.replace(/[@.]/g, '_');
        const candidateId = 'tuner_' + cleanId;
        
        const existing = await db.prepare(
          "SELECT id, name, nombre_completo, nombre_actual, fecha_nacimiento, image, avatar_url FROM users WHERE LOWER(email) = LOWER(?) OR id = ?"
        ).bind(email, candidateId).first();

        if (existing) {
          isExistingUser = true;
          finalUserId = existing.id;
          finalName = name || existing.nombre_actual || existing.nombre_completo || existing.name;
          finalImage = image || existing.avatar_url || existing.image;
          finalDob = existing.fecha_nacimiento || '';

          // Actualizar imagen o nombre si venían desde Google
          try {
            await db.prepare(`
              UPDATE users 
              SET name = COALESCE(?, name),
                  nombre_actual = COALESCE(?, nombre_actual),
                  nombre_completo = COALESCE(?, nombre_completo),
                  image = COALESCE(?, image), 
                  avatar_url = COALESCE(?, avatar_url), 
                  status = 'active'
              WHERE id = ?
            `).bind(name, name, name, image, image, existing.id).run();
          } catch (upErr) {
            console.warn('[Google Callback Update Warning]:', upErr.message);
          }
        } else {
          // Usuario nuevo: registrarlo en D1 con fallback resiliente incluyendo password_hash y fecha_nacimiento obligatorios
          finalUserId = candidateId;
          const defaultHash = 'oauth_google_' + cleanId;
          const defaultDob = '1998-07-15';
          try {
            await db.prepare(`
              INSERT INTO users (id, email, name, nombre_completo, nombre_actual, fecha_nacimiento, image, avatar_url, status, password_hash)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
            `).bind(finalUserId, email, name, name, name, defaultDob, image, image, defaultHash).run();
          } catch (insFullErr) {
            console.warn('[Google Callback] Fallback a inserción básica de usuario:', insFullErr.message);
            await db.prepare(`
              INSERT INTO users (id, email, name, image, password_hash, fecha_nacimiento)
              VALUES (?, ?, ?, ?, ?, ?)
            `).bind(finalUserId, email, name, image, defaultHash, defaultDob).run();
          }
        }

        // Si no tiene fecha de nacimiento en users, revisar si ya existía en astral_profiles
        if (!finalDob) {
          try {
            const astral = await db.prepare(
              "SELECT birth_date FROM astral_profiles WHERE user_id = ? OR user_id = ?"
            ).bind(finalUserId, email).first();
            if (astral?.birth_date) {
              finalDob = astral.birth_date;
              try {
                await db.prepare("UPDATE users SET fecha_nacimiento = ? WHERE id = ?").bind(finalDob, finalUserId).run();
              } catch {}
            }
          } catch {}
        }

        // Crear/Asegurar inmediatamente perfil astral inicial para visibilidad garantizada en Citas y Administración
        try {
          const defaultDob = (finalDob && finalDob.length >= 8) ? finalDob : '1998-07-15';
          const astral = calculateAstralProfile(defaultDob);

          await db.prepare(`
            INSERT INTO astral_profiles (
              user_id, birth_date, sign, element, life_path_number, archetype, luz, sombra, intent, location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Citas y Pareja', 'Santiago, Chile')
            ON CONFLICT(user_id) DO NOTHING
          `).bind(
            finalUserId,
            defaultDob,
            astral.sign,
            astral.element,
            astral.lifePath,
            astral.archetype,
            astral.luz,
            astral.sombra
          ).run();
        } catch (astralErr) {
          console.warn('[Google Callback] Astral profile insert warning:', astralErr.message);
        }

      } catch (dbErr) {
        console.error('[Google OAuth Callback] D1 Error:', dbErr);
        if (!finalUserId) finalUserId = 'tuner_' + email.replace(/[@.]/g, '_');
      }
    } else {
      finalUserId = 'tuner_' + email.replace(/[@.]/g, '_');
    }

    // 4. Construir sesión de usuario
    const userSession = {
      id: finalUserId,
      name: finalName,
      email: email,
      image: finalImage,
      dob: finalDob || ''
    };

    // 5. Destino de redirección:
    // Si NO tiene fecha de nacimiento registrada (es NULL o vacía), SIEMPRE debe ir a /zodia/welcome
    // para que ingrese su fecha de nacimiento obligatoriamente.
    const hasBirthDate = Boolean(finalDob && finalDob.length >= 8 && finalDob !== 'registered');
    const targetUrl = hasBirthDate
      ? `${baseUrl}/zodia/dashboard` 
      : `${baseUrl}/zodia/welcome`;

    return createAuthSuccessResponse(userSession, targetUrl);

  } catch (err) {
    return createErrorResponse('Ocurrió un imprevisto al procesar el inicio de sesión.', `Detalle técnico: ${err.message}`);
  }
}
