export async function getAuthUser(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:__Secure-)?next-auth\.session-token=([^;]+)/);
    if (match && match[1]) {
      let decoded = match[1];
      try {
        decoded = decodeURIComponent(match[1]);
      } catch {}
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        // Fallback a JWT
      }
    }
    try {
      const { getToken } = await import('next-auth/jwt');
      const jwtToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      return jwtToken;
    } catch {
      return null;
    }
  } catch (err) {
    return null;
  }
}

export function resolveUserId(token) {
  if (!token) return null;
  return token.id ?? token.sub ?? token.email ?? null;
}

export async function resolveCanonicalUserId(db, token) {
  if (!token) return null;
  const rawId = token.id ?? token.sub ?? token.email ?? null;
  const rawEmail = token.email ? token.email.toLowerCase().trim() : '';

  if (db && (rawId || rawEmail)) {
    try {
      const user = await db.prepare(
        "SELECT id FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))"
      ).bind(rawId, rawEmail).first();
      if (user?.id) return user.id;
    } catch {}
  }
  return rawId;
}

const PASSWORD_SALT = 'zodia_astral_matrix_2026_salt';

/**
 * Hashea una contraseña usando SHA-256 nativo de Web Crypto (compatible Edge / Cloudflare / Node)
 */
export async function hashPassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica si una contraseña coincide con el hash almacenado
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  const computed = await hashPassword(password);
  return computed === storedHash;
}

