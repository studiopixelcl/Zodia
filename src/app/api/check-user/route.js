import { NextResponse } from 'next/server';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

/**
 * Endpoint: GET /api/check-user?name=<term>
 * Propósito: Comprueba si un sintonizador ya está registrado en la base de datos D1.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nameQuery = searchParams.get('name')?.trim();

  if (!nameQuery) {
    return NextResponse.json({ exists: false, error: "Nombre o identificador requerido." }, { status: 400 });
  }

  const db = await getDB();
  if (!db) {
    return NextResponse.json({ exists: true, mock: true });
  }

  try {
    const userId = "tuner_" + nameQuery.toLowerCase().replace(/\s+/g, '');
    const userEmail = `${userId}@zodia.eter`;

    const user = await db.prepare(`
      SELECT u.id, u.name, u.image, p.sign, p.element, p.birth_date
      FROM users u
      LEFT JOIN astral_profiles p ON p.user_id = u.id
      WHERE LOWER(u.name) = LOWER(?) OR u.id = ? OR u.email = ?
    `).bind(nameQuery, userId, userEmail).first();

    if (user) {
      return NextResponse.json({
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          sign: user.sign,
          element: user.element,
          birth_date: user.birth_date
        }
      });
    }

    return NextResponse.json({ exists: false });

  } catch (err) {
    console.error("Error al consultar existencia de usuario:", err);
    return NextResponse.json({ exists: false, error: "Fallo en la consulta mística." }, { status: 500 });
  }
}
