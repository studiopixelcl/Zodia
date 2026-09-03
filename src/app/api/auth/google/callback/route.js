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

    if (error || !code) {
      return Response.redirect(`${baseUrl}/zodia?error=${encodeURIComponent(error || 'Acceso cancelado con Google')}`, 302);
    }

    const { clientId, clientSecret } = await getGoogleConfig();

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
      return Response.redirect(`${baseUrl}/zodia?error=google_token_failed`, 302);
    }

    // 2. Obtener datos de perfil del usuario desde Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return Response.redirect(`${baseUrl}/zodia?error=no_email`, 302);
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || email.split('@')[0];
    const image = googleUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&bold=true`;
    const cleanId = email.replace(/[@.]/g, '_');
    const userId = cleanId.startsWith('tuner_') ? cleanId : 'tuner_' + cleanId;

    // 3. Persistir en D1 si está disponible
    const db = await getDB();
    let hasBirthdate = false;

    if (db) {
      try {
        const existing = await db.prepare("SELECT id, fecha_nacimiento FROM users WHERE LOWER(email) = LOWER(?) OR id = ?").bind(email, userId).first();
        if (existing) {
          hasBirthdate = !!existing.fecha_nacimiento;
          await db.prepare(`
            UPDATE users 
            SET name = COALESCE(name, ?), image = COALESCE(image, ?)
            WHERE id = ?
          `).bind(name, image, existing.id).run();
        } else {
          await db.prepare(`
            INSERT INTO users (id, email, name, nombre_completo, nombre_actual, fecha_nacimiento, image, avatar_url, status)
            VALUES (?, ?, ?, ?, ?, '2000-01-01', ?, ?, 'active')
          `).bind(userId, email, name, name, name, image, image).run();
        }
      } catch (dbErr) {
        console.warn('[Google OAuth Callback] D1 Warning:', dbErr.message);
      }
    }

    // 4. Establecer sesión mediante cookie
    const userSession = {
      id: userId,
      name,
      email,
      image,
      dob: hasBirthdate ? 'registered' : '2000-01-01'
    };

    const cookieVal = encodeURIComponent(JSON.stringify(userSession));
    const targetUrl = hasBirthdate ? `${baseUrl}/zodia/dashboard` : `${baseUrl}/zodia/welcome`;

    const response = Response.redirect(targetUrl, 302);
    response.headers.append(
      'Set-Cookie',
      `${COOKIE_NAME}=${cookieVal}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
    );

    return response;
  } catch (err) {
    const host = request.headers.get('host') || 'zodia.studiopixel.cl';
    return Response.redirect(`https://${host}/zodia?error=${encodeURIComponent(err.message)}`, 302);
  }
}
