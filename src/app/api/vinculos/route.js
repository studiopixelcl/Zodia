import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { calculateResonance } from '../../../lib/astrology';
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

const DEFAULT_VINCULOS_GUIDES = [
  {
    id: "candidate_valeria",
    name: "Valeria Ríos",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    sign: "Leo",
    element: "Fuego",
    path: "1",
    affinity: "96%",
    lastMessage: "¡Hola! Vi que también te gusta la música indie y los atardeceres ✨",
    lastMessageDate: new Date(Date.now() - 3600000).toISOString(),
    isSelfSender: false,
    isNewMatch: false
  },
  {
    id: "candidate_camila",
    name: "Camila Beltrán",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    sign: "Géminis",
    element: "Aire",
    path: "5",
    affinity: "92%",
    lastMessage: null,
    lastMessageDate: null,
    isSelfSender: false,
    isNewMatch: true
  },
  {
    id: "candidate_sofia",
    name: "Sofía Navarro",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    sign: "Escorpio",
    element: "Agua",
    path: "11",
    affinity: "89%",
    lastMessage: null,
    lastMessageDate: null,
    isSelfSender: false,
    isNewMatch: true
  },
  {
    id: "zodia_bot",
    name: "ZODIA | Guía de Citas Astrales",
    image: "https://ui-avatars.com/api/?name=Zodia+Bot&background=06b6d4&color=fff&bold=true",
    sign: "Firmamento",
    element: "Éter",
    path: "∞",
    affinity: "100%",
    lastMessage: "¿Deseas saber cómo conquistar a tu nuevo match según su signo?",
    lastMessageDate: new Date(Date.now() - 7200000).toISOString(),
    isSelfSender: false,
    isNewMatch: false
  }
];

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
      ).filter(id => id !== myCanonicalId && id !== myRawId);

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

            // Si es un candidato del catálogo
            if (!other) {
              const cand = DATING_CANDIDATES.find(c => c.id === otherId);
              if (cand) {
                other = {
                  id: cand.id,
                  name: cand.name,
                  image: cand.image,
                  sign: cand.sign,
                  element: cand.element,
                  life_path_number: cand.life_path_number,
                  archetype: cand.archetype
                };
              }
            }

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
              SELECT content, created_at, sender_id
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

  if (resultVinculos.length === 0) {
    resultVinculos = DEFAULT_VINCULOS_GUIDES;
  } else {
    // Si no tiene bot, añadirlo para asistencia cósmica
    const hasBot = resultVinculos.some(v => v.id === "zodia_bot");
    if (!hasBot) {
      resultVinculos.push(DEFAULT_VINCULOS_GUIDES.find(g => g.id === "zodia_bot"));
    }
  }

  return NextResponse.json(resultVinculos);
}
