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
 * POST /api/admin/broadcast - Envío de mensajes masivos o privados oficiales
 */
export async function POST(request) {
  if (!checkAdminSession(request)) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    const { type, targetUserId, message } = await request.json();

    if (!message || !message.trim()) {
      return new Response(JSON.stringify({ error: 'El contenido del mensaje no puede estar vacío.' }), { status: 400 });
    }

    const ADMIN_BOT_ID = 'admin_zodia';
    const ADMIN_BOT_NAME = 'Zodia Oficial ✨';
    const ADMIN_BOT_EMAIL = 'admin@zodia.eter';
    const ADMIN_BOT_IMAGE = 'https://ui-avatars.com/api/?name=Zodia&background=06b6d4&color=fff&bold=true';

    const db = await getDB();
    if (!db) {
      return new Response(JSON.stringify({
        success: true,
        mock: true,
        type,
        sentCount: type === 'broadcast' ? 14 : 1,
        message: 'Mensaje simulado enviado con éxito.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Asegurar que el usuario bot oficial existe en la tabla users
    await db.prepare(`
      INSERT INTO users (id, email, name, image, status)
      VALUES (?, ?, ?, ?, 'active')
      ON CONFLICT(id) DO NOTHING
    `).bind(ADMIN_BOT_ID, ADMIN_BOT_EMAIL, ADMIN_BOT_NAME, ADMIN_BOT_IMAGE).run();

    // 1. Mensaje Privado a un usuario específico
    if (type === 'private') {
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: 'targetUserId es requerido para mensajes privados.' }), { status: 400 });
      }

      await db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES (?, ?, ?)
      `).bind(ADMIN_BOT_ID, targetUserId, message.trim()).run();

      return new Response(JSON.stringify({ success: true, type: 'private', sentTo: targetUserId }), { status: 200 });
    }

    // 2. Mensaje Masivo (Broadcast) a TODOS los usuarios
    if (type === 'broadcast') {
      const allUsers = await db.prepare("SELECT id FROM users WHERE id != ? AND COALESCE(status, 'active') = 'active'").bind(ADMIN_BOT_ID).all();
      const userList = allUsers?.results || [];

      let sentCount = 0;
      for (const u of userList) {
        try {
          await db.prepare(`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES (?, ?, ?)
          `).bind(ADMIN_BOT_ID, u.id, message.trim()).run();
          sentCount++;
        } catch {}
      }

      return new Response(JSON.stringify({
        success: true,
        type: 'broadcast',
        sentCount,
        totalRecipients: userList.length
      }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Tipo de mensaje inválido (debe ser "broadcast" o "private")' }), { status: 400 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
