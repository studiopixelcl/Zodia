import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { sendNotification } from '../../../lib/push-notifications';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}



export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const withUserId = searchParams.get('with');

  if (!withUserId) {
    return NextResponse.json({ error: "Parámetro 'with' requerido." }, { status: 400 });
  }

  const db = await getDB();
  const myCanonicalId = await resolveCanonicalUserId(db, token);
  const myRawId = resolveUserId(token);

  if (!db) {
    try {
      const { devStore } = await import('../../../lib/dev-store');
      const filtered = (devStore.messages || []).filter(m => 
        ((m.sender_id === myCanonicalId || m.sender_id === myRawId) && (m.receiver_id === withUserId)) ||
        ((m.sender_id === withUserId) && (m.receiver_id === myCanonicalId || m.receiver_id === myRawId))
      );
      return NextResponse.json(filtered);
    } catch {
      return NextResponse.json([]);
    }
  }

  try {
    let otherCanonicalId = withUserId;
    const otherUser = await db.prepare(
      "SELECT id FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))"
    ).bind(withUserId, withUserId.toLowerCase().trim()).first().catch(() => null);

    if (otherUser?.id) otherCanonicalId = otherUser.id;

    // Marcar como leídos los mensajes recibidos del remitente
    await db.prepare(`
      UPDATE messages 
      SET is_read = 1 
      WHERE receiver_id IN (?, ?) AND sender_id IN (?, ?) AND is_read = 0
    `).bind(myCanonicalId, myRawId, otherCanonicalId, withUserId).run().catch(() => {});

    const messages = await db.prepare(`
      SELECT 
        id, sender_id, receiver_id, COALESCE(content, contenido) AS content, is_read, created_at
      FROM messages
      WHERE (sender_id IN (?, ?) AND receiver_id IN (?, ?)) 
         OR (sender_id IN (?, ?) AND receiver_id IN (?, ?))
      ORDER BY created_at ASC
    `).bind(
      myCanonicalId, myRawId, otherCanonicalId, withUserId,
      otherCanonicalId, withUserId, myCanonicalId, myRawId
    ).all();

    return NextResponse.json(messages.results || []);
  } catch (err) {
    console.error("Error al obtener mensajes:", err);
    return NextResponse.json({ error: "Fallo al obtener el historial de mensajes." }, { status: 500 });
  }
}

export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const myId = await resolveCanonicalUserId(db, token);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { receiverId, content } = body;
  if (!receiverId || !content || !content.trim()) {
    return NextResponse.json({ error: "Destinatario y contenido son requeridos." }, { status: 400 });
  }

  let actualReceiverId = receiverId;
  let targetUser = null;

  if (db) {
    try {
      targetUser = await db.prepare(
        "SELECT id, name, email FROM users WHERE id = ? OR (email IS NOT NULL AND LOWER(email) = LOWER(?))"
      ).bind(receiverId, receiverId.toLowerCase().trim()).first();

      if (targetUser?.id) {
        actualReceiverId = targetUser.id;
      }
    } catch (e) {
      console.warn('[POST /api/messages] Resolver targetUser warning:', e.message);
    }
  }

  if (actualReceiverId.startsWith('candidate_') || actualReceiverId.startsWith('guide_') || actualReceiverId === 'zodia_bot') {
    return NextResponse.json({ error: "No es posible enviar mensajes a perfiles simulados." }, { status: 400 });
  }

  const cleanContent = content.trim();
  const userMsgObj = {
    id: Date.now(),
    sender_id: myId,
    receiver_id: actualReceiverId,
    content: cleanContent,
    created_at: new Date().toISOString()
  };

  if (!db) {
    try {
      const { devStore } = await import('../../../lib/dev-store');
      devStore.messages.push(userMsgObj);
      devStore.resonances.push({ user_a_id: myId, user_b_id: actualReceiverId, score: 92 });
      // Emitir notificación in-app en memoria
      const isAudio = cleanContent.includes('"type":"audio"');
      const preview = isAudio ? '🎤 Te envió una nota de voz cósmica' : (cleanContent.length > 50 ? cleanContent.slice(0, 50) + '...' : cleanContent);
      devStore.notifications.unshift({
        id: Date.now(),
        user_id: actualReceiverId,
        title: `${token.name || 'Alguien'} te envió un mensaje 💬`,
        body: preview,
        url: `/zodia/dashboard?tab=vinculos&userId=${myId}`,
        type: 'message',
        is_read: 0,
        created_at: new Date().toISOString()
      });
    } catch {}
    return NextResponse.json(userMsgObj);
  }

  try {
    // 1. Guardar mensaje del usuario
    const result = await db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, contenido, is_read)
      VALUES (?, ?, ?, ?, 0)
    `).bind(myId, actualReceiverId, cleanContent, cleanContent).run();

    // 2. Garantizar que ambos usuarios estén vinculados en la tabla de resonancias
    try {
      const existingRes = await db.prepare(`
        SELECT id FROM resonances
        WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
      `).bind(myId, actualReceiverId, actualReceiverId, myId).first();

      if (!existingRes) {
        await db.prepare(`
          INSERT INTO resonances (user_a_id, user_b_id, score)
          VALUES (?, ?, 92)
        `).bind(myId, actualReceiverId).run();
      }
    } catch (rErr) {
      console.warn('Error asegurando resonancia:', rErr.message);
    }

      // 4. Emitir notificación al destinatario
      const isAudio = cleanContent.includes('"type":"audio"');
      const preview = isAudio ? '🎤 Te envió una nota de voz cósmica' : (cleanContent.length > 50 ? cleanContent.slice(0, 50) + '...' : cleanContent);
      const senderUser = await db.prepare(
        "SELECT name, nombre_actual FROM users WHERE id = ?"
      ).bind(myId).first().catch(() => null);
      const senderName = senderUser?.nombre_actual || senderUser?.name || token.name || 'Alguien';

      await sendNotification({
        db,
        userId: actualReceiverId,
        title: `${senderName} te envió un mensaje 💬`,
        body: preview,
        url: `/zodia/dashboard?tab=vinculos&userId=${myId}`,
        type: 'message'
      });

      return NextResponse.json({
        id: result.meta?.last_row_id ?? Date.now(),
        sender_id: myId,
        receiver_id: actualReceiverId,
        content: cleanContent,
        is_read: 0,
        created_at: new Date().toISOString()
      });
    } catch (err) {
    console.error("Error al enviar mensaje:", err);
    return NextResponse.json({ error: "Fallo al transmitir el mensaje místico.", details: err.message }, { status: 500 });
  }
}
