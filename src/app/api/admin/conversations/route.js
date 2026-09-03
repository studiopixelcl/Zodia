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
 * GET /api/admin/conversations - Ver lista de conversaciones o mensajes de un chat entre usuarios reales
 */
export async function GET(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userA = searchParams.get('userA');
  const userB = searchParams.get('userB');

  const db = await getDB();
  if (!db) {
    try {
      const { devStore } = await import('../../../../lib/dev-store');
      if (userA && userB) {
        const msgs = (devStore.messages || []).filter(m => 
          (m.sender_id === userA && m.receiver_id === userB) ||
          (m.sender_id === userB && m.receiver_id === userA)
        );
        return new Response(JSON.stringify({ messages: msgs }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Agrupar mensajes en devStore
      const pairs = new Map();
      for (const m of (devStore.messages || [])) {
        if (m.sender_id.startsWith('candidate_') || m.receiver_id.startsWith('candidate_')) continue;
        const key = [m.sender_id, m.receiver_id].sort().join('___');
        const existing = pairs.get(key);
        if (!existing) {
          pairs.set(key, {
            user_a_id: m.sender_id,
            user_a_name: m.sender_id,
            user_b_id: m.receiver_id,
            user_b_name: m.receiver_id,
            last_message: m.content,
            message_count: 1,
            last_activity: m.created_at
          });
        } else {
          existing.message_count++;
          existing.last_message = m.content;
          existing.last_activity = m.created_at;
        }
      }
      return new Response(JSON.stringify({ conversations: Array.from(pairs.values()) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch {
      return new Response(JSON.stringify({ conversations: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  try {
    // Si se solicitan los mensajes de un chat específico
    if (userA && userB) {
      const messages = await db.prepare(`
        SELECT 
          m.id, 
          m.sender_id, 
          m.receiver_id, 
          m.content, 
          m.created_at,
          COALESCE(NULLIF(u_sender.nombre_actual, ''), NULLIF(u_sender.nombre_completo, ''), NULLIF(u_sender.name, ''), u_sender.email, m.sender_id) as sender_name,
          COALESCE(u_sender.avatar_url, u_sender.image) as sender_image
        FROM messages m
        LEFT JOIN users u_sender ON u_sender.id = m.sender_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) 
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
        LIMIT 100
      `).bind(userA, userB, userB, userA).all();

      return new Response(JSON.stringify({ messages: messages?.results || [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Listar las conversaciones agrupadas únicamente entre usuarios reales
    const convs = await db.prepare(`
      SELECT 
        MIN(m.sender_id, m.receiver_id) as user_a_id,
        MAX(m.sender_id, m.receiver_id) as user_b_id,
        COALESCE(NULLIF(u1.nombre_actual, ''), NULLIF(u1.nombre_completo, ''), NULLIF(u1.name, ''), u1.email, 'Sintonizador A') as user_a_name,
        COALESCE(NULLIF(u2.nombre_actual, ''), NULLIF(u2.nombre_completo, ''), NULLIF(u2.name, ''), u2.email, 'Sintonizador B') as user_b_name,
        COALESCE(u1.avatar_url, u1.image) as user_a_image,
        COALESCE(u2.avatar_url, u2.image) as user_b_image,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_activity
      FROM messages m
      LEFT JOIN users u1 ON u1.id = MIN(m.sender_id, m.receiver_id)
      LEFT JOIN users u2 ON u2.id = MAX(m.sender_id, m.receiver_id)
      WHERE m.sender_id NOT LIKE 'candidate_%' 
        AND m.receiver_id NOT LIKE 'candidate_%'
        AND m.sender_id NOT LIKE 'guide_%'
        AND m.receiver_id NOT LIKE 'guide_%'
        AND m.sender_id != 'zodia_bot' 
        AND m.receiver_id != 'zodia_bot'
      GROUP BY MIN(m.sender_id, m.receiver_id), MAX(m.sender_id, m.receiver_id)
      ORDER BY last_activity DESC
      LIMIT 50
    `).all();

    return new Response(JSON.stringify({ conversations: convs?.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * DELETE /api/admin/conversations - Borrar un mensaje individual por moderación
 */
export async function DELETE(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    if (!messageId) {
      return new Response(JSON.stringify({ error: 'messageId requerido' }), { status: 400 });
    }

    const db = await getDB();
    if (db) {
      await db.prepare("DELETE FROM messages WHERE id = ?").bind(messageId).run();
    }

    return new Response(JSON.stringify({ success: true, deletedMessageId: messageId }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
