import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { calculateResonance } from '../../../lib/astrology';

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

  const db = await getDB();
  const myCanonicalId = await resolveCanonicalUserId(db, token);
  const myRawId = resolveUserId(token);

  let resultVinculos = [];

  if (db) {
    try {
      const myProfile = await db.prepare(
        "SELECT * FROM astral_profiles WHERE user_id = ? OR user_id = ?"
      ).bind(myCanonicalId, myRawId).first();

      const connectedUsers = await db.prepare(`
        SELECT DISTINCT 
          CASE WHEN user_a_id IN (?, ?) THEN user_b_id ELSE user_a_id END AS other_id
        FROM resonances
        WHERE user_a_id IN (?, ?) OR user_b_id IN (?, ?)
        UNION
        SELECT DISTINCT 
          CASE WHEN sender_id IN (?, ?) THEN receiver_id ELSE sender_id END AS other_id
        FROM messages
        WHERE sender_id IN (?, ?) OR receiver_id IN (?, ?)
      `).bind(
        myCanonicalId, myRawId, myCanonicalId, myRawId, myCanonicalId, myRawId,
        myCanonicalId, myRawId, myCanonicalId, myRawId, myCanonicalId, myRawId
      ).all();

      const userIds = Array.from(
        new Set((connectedUsers.results || []).map(r => r.other_id).filter(Boolean))
      ).filter(id => 
        id !== myCanonicalId && 
        id !== myRawId && 
        !id.startsWith('candidate_') && 
        !id.startsWith('guide_') && 
        id !== 'zodia_bot'
      );

      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        const details = await db.prepare(`
          SELECT 
            u.id, 
            COALESCE(u.nombre_actual, u.nombre_completo, u.name, 'Sintonizador') AS name, 
            COALESCE(u.avatar_url, u.image) AS image,
            p.sign, p.element, p.life_path_number, p.archetype
          FROM users u
          LEFT JOIN astral_profiles p ON p.user_id = u.id
          WHERE u.id IN (${placeholders})
        `).bind(...userIds).all();

        const dbUsersMap = new Map((details.results || []).map(u => [u.id, u]));

        resultVinculos = await Promise.all(
          userIds.map(async (otherId) => {
            let other = dbUsersMap.get(otherId);

            // Si aún no está en map, buscarlo en users individualmente
            if (!other) {
              const directUser = await db.prepare(`
                SELECT 
                  u.id, 
                  COALESCE(u.nombre_actual, u.nombre_completo, u.name, 'Sintonizador') AS name, 
                  COALESCE(u.avatar_url, u.image) AS image,
                  p.sign, p.element, p.life_path_number, p.archetype
                FROM users u
                LEFT JOIN astral_profiles p ON p.user_id = u.id
                WHERE u.id = ? OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(?))
              `).bind(otherId, otherId).first().catch(() => null);

              if (directUser) other = directUser;
            }

            if (!other) return null;

            const otherIdToMatch = other.id || otherId;

            const lastMsg = await db.prepare(`
              SELECT COALESCE(content, contenido) AS content, created_at, sender_id, is_read
              FROM messages
              WHERE (sender_id IN (?, ?) AND receiver_id IN (?, ?)) 
                 OR (sender_id IN (?, ?) AND receiver_id IN (?, ?))
              ORDER BY created_at DESC
              LIMIT 1
            `).bind(
              myCanonicalId, myRawId, otherIdToMatch, otherId,
              otherIdToMatch, otherId, myCanonicalId, myRawId
            ).first().catch(() => null);

            const affinityScore = (myProfile && other.sign) 
              ? calculateResonance(myProfile, other) 
              : 91;

            return {
              id: otherIdToMatch,
              name: other.name || 'Sintonizador Cósmico',
              image: other.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name || 'Z')}&background=06b6d4&color=fff`,
              sign: other.sign ?? 'Cosmos',
              element: other.element ?? 'Éter',
              path: other.life_path_number ?? '∞',
              affinity: `${affinityScore}%`,
              lastMessage: lastMsg ? lastMsg.content : null,
              lastMessageDate: lastMsg ? lastMsg.created_at : null,
              lastMessageIsRead: lastMsg ? !!lastMsg.is_read : true,
              isSelfSender: lastMsg ? (lastMsg.sender_id === myCanonicalId || lastMsg.sender_id === myRawId) : false,
              isNewMatch: !lastMsg
            };
          })
        );

        resultVinculos = resultVinculos.filter(Boolean);

        // Ordenar: conversaciones con mensajes recientes primero, luego nuevos matches
        resultVinculos.sort((a, b) => {
          if (a.lastMessageDate && b.lastMessageDate) {
            return new Date(b.lastMessageDate) - new Date(a.lastMessageDate);
          }
          if (a.lastMessageDate) return -1;
          if (b.lastMessageDate) return 1;
          return 0;
        });
      }
    } catch (err) {
      console.error("Error en /api/vinculos:", err);
    }
  }

  if (!db) {
    try {
      const { devStore } = await import('../../../lib/dev-store');
      const relatedMsgs = (devStore.messages || []).filter(m => 
        m.sender_id === myCanonicalId || m.sender_id === myRawId ||
        m.receiver_id === myCanonicalId || m.receiver_id === myRawId
      );

      const otherUserIds = Array.from(new Set(relatedMsgs.map(m => 
        (m.sender_id === myCanonicalId || m.sender_id === myRawId) ? m.receiver_id : m.sender_id
      ))).filter(id => !id.startsWith('candidate_') && !id.startsWith('guide_') && id !== 'zodia_bot');

      for (const otherId of otherUserIds) {
        const msgs = relatedMsgs.filter(m => 
          (m.sender_id === otherId && (m.receiver_id === myCanonicalId || m.receiver_id === myRawId)) ||
          ((m.sender_id === myCanonicalId || m.sender_id === myRawId) && m.receiver_id === otherId)
        );
        const lastMsg = msgs[msgs.length - 1];

        resultVinculos.push({
          id: otherId,
          name: otherId.replace('tuner_', '').replace(/_/g, ' '),
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=85',
          sign: 'Cosmos',
          element: 'Éter',
          path: '∞',
          affinity: '92%',
          lastMessage: lastMsg ? lastMsg.content : null,
          lastMessageDate: lastMsg ? lastMsg.created_at : null,
          isSelfSender: lastMsg ? (lastMsg.sender_id === myCanonicalId || lastMsg.sender_id === myRawId) : false,
          isNewMatch: !lastMsg
        });
      }
    } catch (devErr) {
      console.error('[DEV VINCULOS ERROR]:', devErr);
    }
  }

  return NextResponse.json(resultVinculos);
}

export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { recipientId, content } = body;
  if (!recipientId) {
    return NextResponse.json({ error: "recipientId requerido" }, { status: 400 });
  }

  const db = await getDB();
  const rawId = resolveUserId(token);

  if (db) {
    try {
      const myCanonicalId = await resolveCanonicalUserId(db, token);
      const myId = myCanonicalId || rawId;

      // 1. Verificar o insertar resonancia (Match)
      const existingRes = await db.prepare(`
        SELECT id FROM resonances
        WHERE (user_a_id IN (?, ?) AND user_b_id IN (?, ?)) 
           OR (user_a_id IN (?, ?) AND user_b_id IN (?, ?))
      `).bind(myId, rawId, recipientId, recipientId, recipientId, recipientId, myId, rawId).first();

      if (!existingRes) {
        await db.prepare(`
          INSERT INTO resonances (user_a_id, user_b_id, score)
          VALUES (?, ?, ?)
        `).bind(myId, recipientId, 95).run();
      }

      // 2. Registrar interacción 'like'
      await db.prepare(`
        INSERT OR REPLACE INTO interactions (user_id, target_id, type)
        VALUES (?, ?, 'like')
      `).bind(myId, recipientId).run().catch(() => {});

      // 3. Enviar mensaje inicial si se incluyó contenido
      if (content) {
        await db.prepare(`
          INSERT INTO messages (sender_id, receiver_id, content)
          VALUES (?, ?, ?)
        `).bind(myId, recipientId, content).run().catch(() => {});
      }

      return NextResponse.json({ success: true, isMatch: true });
    } catch (err) {
      console.error("Error al persistir vínculo en POST /api/vinculos:", err);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, mock: true });
}
