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
 * GET /api/admin/conversations - Ver lista de conversaciones o mensajes de un chat
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
    // Datos mock
    if (userA && userB) {
      return new Response(JSON.stringify({
        messages: [
          { id: 1, sender_id: userA, sender_name: 'Maverick', content: '¡Hola! Qué buena compatibilidad de signos tenemos.', created_at: '2026-09-02 21:10:00' },
          { id: 2, sender_id: userB, sender_name: 'Valeria Solar', content: '¡Totalmente! Capricornio y Leo resuenan en ambición y luz.', created_at: '2026-09-02 21:12:00' }
        ]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      conversations: [
        { user_a_id: 'tuner_maverick', user_a_name: 'Maverick', user_b_id: 'tuner_valeria', user_b_name: 'Valeria Solar', last_message: '¡Totalmente! Capricornio y Leo resuenan en ambición y luz.', message_count: 8, last_activity: '2026-09-02 21:12:00' },
        { user_a_id: 'tuner_diego', user_a_name: 'Diego Acuario', user_b_id: 'tuner_maverick', user_b_name: 'Maverick', last_message: '¿Has mirado el tránsito de Plutón hoy?', message_count: 4, last_activity: '2026-09-02 20:45:00' }
      ]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Si se solicitan los mensajes de un chat específico
    if (userA && userB) {
      const messages = await db.prepare(`
        SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at,
               u_sender.name as sender_name, u_sender.image as sender_image
        FROM messages m
        JOIN users u_sender ON u_sender.id = m.sender_id
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

    // Listar las conversaciones agrupadas
    const convs = await db.prepare(`
      SELECT 
        MIN(m.sender_id, m.receiver_id) as user_a_id,
        MAX(m.sender_id, m.receiver_id) as user_b_id,
        u1.name as user_a_name,
        u2.name as user_b_name,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_activity
      FROM messages m
      JOIN users u1 ON u1.id = MIN(m.sender_id, m.receiver_id)
      JOIN users u2 ON u2.id = MAX(m.sender_id, m.receiver_id)
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
