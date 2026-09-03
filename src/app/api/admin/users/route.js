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
 * GET /api/admin/users - Lista de usuarios reales con búsqueda y filtros
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
    // Si no hay D1 (desarrollo local), consultar almacén en memoria sin inventar cuentas de ejemplo
    try {
      const { devStore } = await import('../../../../lib/dev-store');
      let localUsers = (devStore.users || []).filter(u => 
        !u.id.startsWith('candidate_') && 
        !u.id.startsWith('guide_') && 
        u.id !== 'zodia_bot' && 
        !(u.email || '').endsWith('@zodia.eter') &&
        !['tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam'].includes(u.id)
      );

      if (q) {
        const queryLower = q.toLowerCase();
        localUsers = localUsers.filter(u => 
          (u.name || '').toLowerCase().includes(queryLower) || 
          (u.email || '').toLowerCase().includes(queryLower) ||
          (u.sign || '').toLowerCase().includes(queryLower)
        );
      }

      if (statusFilter) {
        localUsers = localUsers.filter(u => (u.status || 'active') === statusFilter);
      }

      return new Response(JSON.stringify({ users: localUsers }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(JSON.stringify({ users: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const { ensureDatabaseSchema } = await import('../../../../lib/db-init');
    await ensureDatabaseSchema(db);

    let query = `
      SELECT 
        u.id, 
        COALESCE(NULLIF(u.nombre_actual, ''), NULLIF(u.nombre_completo, ''), NULLIF(u.name, ''), u.email, 'Sintonizador') AS name,
        u.email, 
        COALESCE(u.avatar_url, u.image) AS image, 
        COALESCE(u.status, 'active') AS status, 
        u.ban_reason, 
        u.created_at,
        COALESCE(NULLIF(u.fecha_nacimiento, ''), p.birth_date, 'Sin registrar') AS birth_date,
        COALESCE(p.sign, 'Sin calcular') AS sign, 
        COALESCE(p.element, 'Éter') AS element, 
        p.life_path_number, 
        COALESCE(p.archetype, 'Sintonizador') AS archetype, 
        p.bio, 
        p.intent, 
        p.location, 
        p.interests,
        p.photos,
        p.video_url
      FROM users u
      LEFT JOIN astral_profiles p ON (
        p.user_id = u.id 
        OR (u.email IS NOT NULL AND LOWER(p.user_id) = LOWER(u.email))
        OR (u.email IS NOT NULL AND p.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(u.email)))
      )
      WHERE u.id NOT LIKE 'candidate_%'
        AND u.id NOT LIKE 'guide_%'
        AND u.id != 'zodia_bot'
        AND (u.email IS NULL OR u.email NOT LIKE '%@zodia.eter')
        AND u.id NOT IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
    `;
    const params = [];

    if (q) {
      query += ` AND (
        LOWER(COALESCE(u.nombre_actual, u.nombre_completo, u.name, '')) LIKE ? 
        OR LOWER(COALESCE(u.email, '')) LIKE ? 
        OR LOWER(COALESCE(p.sign, '')) LIKE ?
        OR LOWER(u.id) LIKE ?
      )`;
      const wild = `%${q.toLowerCase()}%`;
      params.push(wild, wild, wild, wild);
    }

    if (statusFilter) {
      query += ` AND COALESCE(u.status, 'active') = ?`;
      params.push(statusFilter);
    }

    query += ` ORDER BY COALESCE(u.created_at, u.rowid) DESC LIMIT 200`;

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
 * POST /api/admin/users - Banear, desbanear o purgar cuentas de ejemplo
 */
export async function POST(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { userId, action, reason } = await request.json();
    if (!action) {
      return new Response(JSON.stringify({ error: 'Acción requerida' }), { status: 400 });
    }

    const db = await getDB();

    // Acción para limpiar cuentas de prueba / bots
    if (action === 'cleanup_demos') {
      if (db) {
        await db.prepare(`
          DELETE FROM users 
          WHERE id IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
             OR id LIKE 'candidate_%'
             OR id LIKE 'guide_%'
             OR email LIKE '%@zodia.eter'
        `).run();
        await db.prepare(`
          DELETE FROM astral_profiles 
          WHERE user_id IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
             OR user_id LIKE 'candidate_%'
             OR user_id LIKE 'guide_%'
        `).run();
        await db.prepare(`
          DELETE FROM resonances 
          WHERE user_a_id IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
             OR user_b_id IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
             OR user_a_id LIKE 'candidate_%'
             OR user_b_id LIKE 'candidate_%'
        `).run();
        await db.prepare(`
          DELETE FROM messages 
          WHERE sender_id IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
             OR receiver_id IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
             OR sender_id LIKE 'candidate_%'
             OR receiver_id LIKE 'candidate_%'
        `).run();
      }
      return new Response(JSON.stringify({ success: true, message: 'Cuentas de prueba eliminadas con éxito.' }), { status: 200 });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId requerido' }), { status: 400 });
    }

    if (!db) {
      return new Response(JSON.stringify({ success: true, mock: true, action, userId }), { status: 200 });
    }

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
