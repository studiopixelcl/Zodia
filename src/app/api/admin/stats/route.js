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
    try {
      const { devStore } = await import('../../../../lib/dev-store');
      const realUsers = (devStore.users || []).filter(u => 
        !u.id.startsWith('candidate_') && 
        !u.id.startsWith('guide_') && 
        u.id !== 'zodia_bot' && 
        !(u.email || '').endsWith('@zodia.eter') &&
        !['tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam'].includes(u.id)
      );

      return new Response(JSON.stringify({
        totalUsers: realUsers.length,
        activeUsers: realUsers.filter(u => (u.status || 'active') !== 'banned').length,
        bannedUsers: realUsers.filter(u => u.status === 'banned').length,
        totalMatches: (devStore.resonances || []).length,
        totalMessages: (devStore.messages || []).length,
        recentUsers: realUsers.slice(0, 6)
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(JSON.stringify({
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        totalMatches: 0,
        totalMessages: 0,
        recentUsers: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  try {
    const REAL_USERS_FILTER = `
      WHERE id NOT LIKE 'candidate_%' 
        AND id NOT LIKE 'guide_%' 
        AND id != 'zodia_bot' 
        AND (email IS NULL OR email NOT LIKE '%@zodia.eter')
        AND id NOT IN ('tuner_maverick', 'tuner_valeria', 'tuner_diego', 'tuner_bot_spam')
    `;

    const usersCountRes = await db.prepare(`SELECT COUNT(*) as count FROM users ${REAL_USERS_FILTER}`).first();
    const bannedCountRes = await db.prepare(`SELECT COUNT(*) as count FROM users ${REAL_USERS_FILTER} AND status = 'banned'`).first();
    const matchesCountRes = await db.prepare(`
      SELECT COUNT(*) as count FROM resonances 
      WHERE user_a_id NOT LIKE 'candidate_%' AND user_b_id NOT LIKE 'candidate_%'
    `).first();
    const messagesCountRes = await db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_id NOT LIKE 'candidate_%' AND receiver_id NOT LIKE 'candidate_%'
        AND sender_id != 'zodia_bot' AND receiver_id != 'zodia_bot'
    `).first();

    const recentUsers = await db.prepare(`
      SELECT 
        u.id, 
        COALESCE(NULLIF(u.nombre_actual, ''), NULLIF(u.nombre_completo, ''), NULLIF(u.name, ''), u.email, 'Sintonizador') as name, 
        u.email, 
        COALESCE(u.avatar_url, u.image) as image, 
        COALESCE(u.status, 'active') as status, 
        u.created_at,
        COALESCE(NULLIF(u.fecha_nacimiento, ''), p.birth_date, 'Sin registrar') as birth_date,
        COALESCE(p.sign, 'Sin calcular') as sign, 
        COALESCE(p.element, 'Éter') as element
      FROM users u
      LEFT JOIN astral_profiles p ON (
        p.user_id = u.id 
        OR (u.email IS NOT NULL AND LOWER(p.user_id) = LOWER(u.email))
        OR (u.email IS NOT NULL AND p.user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(u.email)))
      )
      ${REAL_USERS_FILTER.replace('WHERE', 'WHERE u.')}
      ORDER BY COALESCE(u.created_at, u.rowid) DESC
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
