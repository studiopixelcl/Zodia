import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';
import { DATING_CANDIDATES } from '../../../lib/dating';

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
  const myId = resolveUserId(token);

  if (!db) {
    return NextResponse.json({ swipedIds: [], matches: [] });
  }

  try {
    const interactions = await db.prepare(`
      SELECT target_id, type, created_at FROM interactions WHERE user_id = ?
    `).bind(myId).all();

    const swipedIds = (interactions.results || []).map(i => i.target_id);

    // Obtener matches mutuos confirmados
    const dbMatches = await db.prepare(`
      SELECT 
        CASE WHEN user_a_id = ? THEN user_b_id ELSE user_a_id END AS match_id,
        score, created_at
      FROM resonances
      WHERE user_a_id = ? OR user_b_id = ?
    `).bind(myId, myId, myId).all();

    return NextResponse.json({
      swipedIds,
      matches: dbMatches.results || []
    });
  } catch (err) {
    console.error("Error al consultar interacciones:", err);
    return NextResponse.json({ swipedIds: [], matches: [] });
  }
}

export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const myId = resolveUserId(token);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { targetUserId, type = 'like' } = body;
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId es requerido." }, { status: 400 });
  }

  // 1. Verificar si el candidato da match
  const candidate = DATING_CANDIDATES.find(c => c.id === targetUserId);
  let isMatch = false;

  if (type === 'like' || type === 'superlike') {
    // Si es candidato catálogo con likesYou=true o superlike
    if (candidate?.likesYou || type === 'superlike') {
      isMatch = true;
    }
  }

  // 2. Persistir en D1 si está disponible
  if (db) {
    try {
      // Guardar la interacción (Like / Pass / Superlike)
      await db.prepare(`
        INSERT OR REPLACE INTO interactions (user_id, target_id, type)
        VALUES (?, ?, ?)
      `).bind(myId, targetUserId, type).run();

      if (type === 'like' || type === 'superlike') {
        // Verificar si el otro usuario ya nos dio like en D1
        const reverseLike = await db.prepare(`
          SELECT id FROM interactions
          WHERE user_id = ? AND target_id = ? AND type IN ('like', 'superlike')
        `).bind(targetUserId, myId).first();

        if (reverseLike || candidate?.likesYou) {
          isMatch = true;

          // Registrar en resonances si no existe ya
          const existingRes = await db.prepare(`
            SELECT id FROM resonances
            WHERE (user_a_id = ? AND user_b_id = ?) OR (user_a_id = ? AND user_b_id = ?)
          `).bind(myId, targetUserId, targetUserId, myId).first();

          if (!existingRes) {
            await db.prepare(`
              INSERT INTO resonances (user_a_id, user_b_id, score)
              VALUES (?, ?, ?)
            `).bind(myId, targetUserId, type === 'superlike' ? 98 : 88).run();
          }
        }
      }
    } catch (err) {
      console.error("Error al persistir interacción en D1:", err);
    }
  }

  return NextResponse.json({
    success: true,
    targetUserId,
    type,
    isMatch,
    candidate: isMatch ? candidate : null
  });
}
