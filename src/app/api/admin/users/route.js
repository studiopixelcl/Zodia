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

/**
 * GET /api/admin/users - Lista de usuarios con búsqueda y filtros
 */
export async function GET(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const statusFilter = searchParams.get('status')?.trim() || '';

  const db = await getDB();
  if (!db) {
    // Mock data si no hay D1
    const mockUsers = [
      { id: 'tuner_maverick', name: 'Maverick', email: 'tuner_maverick@zodia.eter', sign: 'Capricornio', element: 'Tierra', archetype: 'El Ermitaño', status: 'active', created_at: '2026-09-02 21:00:00', bio: 'Explorando resonancias cósmicas y portales.', interests: '["Tarot","Astrología","Música Ambient"]' },
      { id: 'tuner_valeria', name: 'Valeria Solar', email: 'tuner_valeria@zodia.eter', sign: 'Leo', element: 'Fuego', archetype: 'La Soberana', status: 'active', created_at: '2026-09-02 20:00:00', bio: 'Buscando almas con fuego vital.', interests: '["Arte","Fotografía","Viajes Astrales"]' },
      { id: 'tuner_diego', name: 'Diego Acuario', email: 'tuner_diego@zodia.eter', sign: 'Acuario', element: 'Aire', archetype: 'El Visionario', status: 'active', created_at: '2026-09-02 19:00:00', bio: 'Sincronía cuántica y frecuencias 432Hz.', interests: '["Filosofía","Tecnología Cósmica"]' },
      { id: 'tuner_bot_spam', name: 'Usuario Spam', email: 'tuner_bot@zodia.eter', sign: 'Géminis', element: 'Aire', archetype: 'El Bufón', status: 'banned', ban_reason: 'Envío de enlaces externos no autorizados.', created_at: '2026-09-02 18:00:00', bio: 'Cuenta bloqueada por seguridad.', interests: '[]' }
    ];
    let filtered = mockUsers;
    if (q) {
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.sign.toLowerCase().includes(q.toLowerCase()));
    }
    if (statusFilter) {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
    return new Response(JSON.stringify({ users: filtered }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let query = `
      SELECT u.id, u.name, u.email, u.image, COALESCE(u.status, 'active') as status, u.ban_reason, u.created_at,
             p.sign, p.element, p.life_path_number, p.archetype, p.bio, p.intent, p.location, p.interests
      FROM users u
      LEFT JOIN astral_profiles p ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += ` AND (LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(p.sign) LIKE ?)`;
      params.push(`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`);
    }

    if (statusFilter) {
      query += ` AND COALESCE(u.status, 'active') = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY u.created_at DESC LIMIT 100`;

    const stmt = db.prepare(query);
    const users = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    return new Response(JSON.stringify({ users: users?.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * POST /api/admin/users - Banear, suspender o desbanear usuario
 */
export async function POST(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { userId, action, reason } = await request.json();
    if (!userId || !action) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos' }), { status: 400 });
    }

    const db = await getDB();
    if (!db) {
      return new Response(JSON.stringify({ success: true, mock: true, action, userId }), { status: 200 });
    }

    try {
      await db.prepare("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'").run();
    } catch {}
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN ban_reason TEXT").run();
    } catch {}

    if (action === 'ban') {
      await db.prepare(`
        UPDATE users 
        SET status = 'banned', ban_reason = ?
        WHERE id = ?
      `).bind(reason || 'Cuenta suspendida por infringir las directrices de la comunidad.', userId).run();

      return new Response(JSON.stringify({ success: true, status: 'banned' }), { status: 200 });
    }

    if (action === 'unban') {
      await db.prepare(`
        UPDATE users 
        SET status = 'active', ban_reason = NULL
        WHERE id = ?
      `).bind(userId).run();

      return new Response(JSON.stringify({ success: true, status: 'active' }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Acción no reconocida' }), { status: 400 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * DELETE /api/admin/users - Eliminar cuenta permanentemente
 */
export async function DELETE(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId requerido' }), { status: 400 });
    }

    const db = await getDB();
    if (db) {
      await db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").bind(userId, userId).run();
      await db.prepare("DELETE FROM resonances WHERE user_a_id = ? OR user_b_id = ?").bind(userId, userId).run();
      await db.prepare("DELETE FROM interactions WHERE user_id = ? OR target_id = ?").bind(userId, userId).run();
      await db.prepare("DELETE FROM astral_profiles WHERE user_id = ?").bind(userId).run();
      await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    }

    return new Response(JSON.stringify({ success: true, deletedUserId: userId }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
