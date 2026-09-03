import { checkAdminSession } from '../../../../lib/admin-auth';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const db = await getDB();
  if (!db) {
    // Datos de demostración enriquecidos si no hay D1 disponible
    return new Response(JSON.stringify({
      totalUsers: 14,
      activeUsers: 13,
      bannedUsers: 1,
      totalMatches: 8,
      totalMessages: 36,
      recentUsers: [
        { id: 'tuner_maverick', name: 'Maverick', sign: 'Capricornio', element: 'Tierra', status: 'active', created_at: new Date().toISOString() },
        { id: 'tuner_valeria', name: 'Valeria Solar', sign: 'Leo', element: 'Fuego', status: 'active', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'tuner_diego', name: 'Diego Acuario', sign: 'Acuario', element: 'Aire', status: 'active', created_at: new Date(Date.now() - 7200000).toISOString() }
      ],
      signDistribution: {
        'Fuego': 4,
        'Tierra': 3,
        'Aire': 4,
        'Agua': 3
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const usersCountRes = await db.prepare("SELECT COUNT(*) as count FROM users").first();
    const bannedCountRes = await db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'banned'").first();
    const matchesCountRes = await db.prepare("SELECT COUNT(*) as count FROM resonances").first();
    const messagesCountRes = await db.prepare("SELECT COUNT(*) as count FROM messages").first();

    const recentUsers = await db.prepare(`
      SELECT u.id, u.name, u.email, u.image, COALESCE(u.status, 'active') as status, u.created_at,
             p.sign, p.element, p.birth_date
      FROM users u
      LEFT JOIN astral_profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 6
    `).all();

    return new Response(JSON.stringify({
      totalUsers: usersCountRes?.count || 0,
      activeUsers: Math.max(0, (usersCountRes?.count || 0) - (bannedCountRes?.count || 0)),
      bannedUsers: bannedCountRes?.count || 0,
      totalMatches: matchesCountRes?.count || 0,
      totalMessages: messagesCountRes?.count || 0,
      recentUsers: recentUsers?.results || []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
