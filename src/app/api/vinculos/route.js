import { NextResponse } from 'next/server';
import { getToken }     from 'next-auth/jwt';
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

function resolveUserId(token) {
  return token?.id ?? token?.sub ?? token?.email ?? null;
}

const DEFAULT_VINCULOS_GUIDES = [
  {
    id: "zodia_bot",
    name: "ZODIA | Inteligencia Astral",
    image: "https://ui-avatars.com/api/?name=Zodia+Bot&background=06b6d4&color=fff&bold=true",
    sign: "Firmamento",
    element: "Éter",
    path: "∞",
    affinity: "100%",
    lastMessage: "Transmisión mística disponible 24/7."
  },
  {
    id: "guide_astraea",
    name: "Astraea Mística",
    image: "https://ui-avatars.com/api/?name=Astraea&background=10b981&color=fff&bold=true",
    sign: "Virgo",
    element: "Tierra",
    path: "7",
    affinity: "94%",
    lastMessage: "Vínculo de sintonía preparado."
  }
];

export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const myId = resolveUserId(token);

  let resultVinculos = [];

  if (db) {
    try {
      const myProfile = await db.prepare(
        "SELECT * FROM astral_profiles WHERE user_id = ?"
      ).bind(myId).first();

      const connectedUsers = await db.prepare(`
        SELECT DISTINCT 
          CASE WHEN user_a_id = ? THEN user_b_id ELSE user_a_id END AS other_id
        FROM resonances
        WHERE user_a_id = ? OR user_b_id = ?
        UNION
        SELECT DISTINCT
          CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
      `).bind(myId, myId, myId, myId, myId, myId).all();

      const userIds = (connectedUsers.results || []).map(r => r.other_id).filter(Boolean);

      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        const details = await db.prepare(`
          SELECT 
            u.id, u.name, u.image,
            p.sign, p.element, p.life_path_number, p.archetype
          FROM users u
          LEFT JOIN astral_profiles p ON p.user_id = u.id
          WHERE u.id IN (${placeholders})
        `).bind(...userIds).all();

        resultVinculos = await Promise.all(
          (details.results || []).map(async (other) => {
            const lastMsg = await db.prepare(`
              SELECT content, created_at, sender_id
              FROM messages
              WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
              ORDER BY created_at DESC
              LIMIT 1
            `).bind(myId, other.id, other.id, myId).first();

            const affinityScore = (myProfile && other.sign) 
              ? calculateResonance(myProfile, other) 
              : 85;

            return {
              id: other.id,
              name: other.name,
              image: other.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(other.name || 'Z')}&background=06b6d4&color=fff`,
              sign: other.sign ?? 'Desconocido',
              element: other.element ?? 'Éter',
              path: other.life_path_number ?? '—',
              affinity: `${affinityScore}%`,
              lastMessage: lastMsg ? lastMsg.content : 'Vínculo manifestado',
              lastMessageDate: lastMsg ? lastMsg.created_at : null,
              isSelfSender: lastMsg ? lastMsg.sender_id === myId : false
            };
          })
        );
      }
    } catch (err) {
      console.error("Error en /api/vinculos:", err);
    }
  }

  if (resultVinculos.length === 0) {
    resultVinculos = DEFAULT_VINCULOS_GUIDES;
  } else {
    const hasBot = resultVinculos.some(v => v.id === "zodia_bot");
    if (!hasBot) {
      resultVinculos.unshift(DEFAULT_VINCULOS_GUIDES[0]);
    }
  }

  return NextResponse.json(resultVinculos);
}
