export const ADMIN_COOKIE_NAME = 'zodia_admin_token';

// Credenciales por defecto configurables mediante variables de entorno
export const DEFAULT_ADMIN_USER = process.env.ADMIN_USER || 'admin';
export const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'studiopixel2026!';

/**
 * Valida si las credenciales coinciden con las del administrador
 */
export function verifyAdminCredentials(username, password) {
  if (!username || !password) return false;
  return username.trim() === DEFAULT_ADMIN_USER && password.trim() === DEFAULT_ADMIN_PASS;
}

/**
 * Verifica si la solicitud entrante tiene una cookie de administrador válida
 */
export function checkAdminSession(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    if (!match || !match[1]) return false;

    const token = decodeURIComponent(match[1]);
    const payload = JSON.parse(token);

    if (payload.role === 'zodia_master_admin' && payload.user === DEFAULT_ADMIN_USER) {
      if (payload.exp && Date.now() < payload.exp) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Genera la cookie de sesión de administrador
 */
export function createAdminSessionPayload() {
  const payload = {
    role: 'zodia_master_admin',
    user: DEFAULT_ADMIN_USER,
    exp: Date.now() + 8 * 60 * 60 * 1000 // 8 horas
  };
  return encodeURIComponent(JSON.stringify(payload));
}
