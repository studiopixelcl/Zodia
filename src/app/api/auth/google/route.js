export const runtime = 'edge';

async function getGoogleConfig() {
  let clientId = process.env.GOOGLE_CLIENT_ID || '';
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const env = getRequestContext()?.env;
    if (env?.GOOGLE_CLIENT_ID) clientId = env.GOOGLE_CLIENT_ID;
    if (env?.GOOGLE_CLIENT_SECRET) clientSecret = env.GOOGLE_CLIENT_SECRET;
  } catch {}

  const isConfigured = clientId && 
    !clientId.startsWith('tu_id') && 
    clientId.includes('.apps.googleusercontent.com') &&
    clientSecret && 
    !clientSecret.startsWith('tu_secreto');

  return { clientId, clientSecret, isConfigured };
}

/**
 * GET /api/auth/google
 * Inicia el flujo OAuth de Google o informa estado de configuración
 */
export async function GET(request) {
  try {
    const { clientId, isConfigured } = await getGoogleConfig();
    const url = new URL(request.url);
    const host = request.headers.get('host') || 'zodia.studiopixel.cl';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;
    const redirectUri = `${baseUrl}/zodia/api/auth/google/callback`;

    // Si no está configurado, informar al cliente
    if (!isConfigured) {
      return new Response(JSON.stringify({
        configured: false,
        message: 'Google OAuth aún no está configurado con credenciales válidas en Google Cloud Console.',
        redirectUri
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Redirigir a la pantalla de consentimiento de Google
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'online');
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    return Response.redirect(googleAuthUrl.toString(), 302);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
