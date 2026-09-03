import { ADMIN_COOKIE_NAME, verifyAdminCredentials, createAdminSessionPayload, checkAdminSession } from '../../../../lib/admin-auth';

export const runtime = 'edge';

/**
 * GET /api/admin/auth - Verificar estado de sesión del administrador
 */
export async function GET(request) {
  const isAuth = checkAdminSession(request);
  return new Response(JSON.stringify({ authenticated: isAuth }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * POST /api/admin/auth - Iniciar sesión de administrador
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Payload inválido' }), { status: 400 });
    }

    const { username, password } = body;
    if (!verifyAdminCredentials(username, password)) {
      return new Response(JSON.stringify({ error: 'Credenciales de administrador incorrectas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = createAdminSessionPayload();
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.append(
      'Set-Cookie',
      `${ADMIN_COOKIE_NAME}=${token}; Path=/; Max-Age=28800; SameSite=Lax`
    );

    return new Response(JSON.stringify({ success: true, url: '/zodia/admin' }), {
      status: 200,
      headers
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * DELETE /api/admin/auth - Cerrar sesión de administrador
 */
export async function DELETE() {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.append('Set-Cookie', `${ADMIN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`);
  return new Response(JSON.stringify({ success: true, url: '/zodia/admin/login' }), {
    status: 200,
    headers
  });
}
