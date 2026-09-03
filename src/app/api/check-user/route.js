export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

/**
 * Endpoint: GET /api/check-user?name=<term>
 * Propósito: Comprueba si un sintonizador ya está registrado en la base de datos D1.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const nameQuery = searchParams.get('name')?.trim();

    if (!nameQuery) {
      return new Response(JSON.stringify({ exists: false, error: "Nombre o identificador requerido." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await getDB();
    if (!db) {
      return new Response(JSON.stringify({ exists: true, mock: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const cleanId = nameQuery.replace(/[@.]/g, '_').toLowerCase().replace(/\s+/g, '');
      const userId = cleanId.startsWith('tuner_') ? cleanId : 'tuner_' + cleanId;
      const userEmail = nameQuery.includes('@') ? nameQuery.toLowerCase() : `${userId}@zodia.eter`;

      const user = await db.prepare(`
        SELECT u.id, u.name, u.image, p.sign, p.element, p.birth_date
        FROM users u
        LEFT JOIN astral_profiles p ON p.user_id = u.id
        WHERE LOWER(u.name) = LOWER(?) OR u.id = ? OR LOWER(u.email) = LOWER(?) OR u.id = ?
      `).bind(nameQuery, userId, userEmail, nameQuery).first();

      if (user) {
        return new Response(JSON.stringify({
          exists: true,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
            sign: user.sign,
            element: user.element,
            birth_date: user.birth_date
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ exists: false, dbError: err.message }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ exists: false, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
