import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

// Respuestas místicas contextuales de los Sintonizadores Guía y ZODIA Bot
const BOT_RESPONSES = {
  zodia_bot: [
    "Las constelaciones observan tu mensaje. Tu frecuencia está alineada con el propósito de tu camino de vida.",
    "El éter procesa tu consulta mística. Confía en la intuición que nace de tu centro espiritual hoy.",
    "Sintonía recibida. La energía astral sugiere mantener el equilibrio entre tus deseos de Luz y tus lecciones de Sombra."
  ],
  guide_astraea: [
    "Siento la firmeza de tu mensaje. Como energía de Tierra (Virgo), te sugiero organizar tus ideas con paciencia y detalle.",
    "Tu inquietud resuena en el elemento Tierra. Todo proyecto sólido requiere cimientos profundos y constancia."
  ],
  guide_orion: [
    "¡Tu mensaje enciende la chispa del éter! Como alma de Fuego (Leo), te animo a liderar tus proyectos con fe y pasión.",
    "No permitas que la duda apague tu llama. El universo favorece a quienes actúan con valentía y coraje."
  ],
  guide_luna: [
    "Tu palabra fluye como el agua misma (Piscis). Escucha los sueños y las corazonadas que surgen en tu interior.",
    "En las aguas profundas de la emoción habita la verdadera verdad. Permítete sentir sin juzgar el proceso."
  ],
  guide_zephyr: [
    "Una perspectiva sumamente original (Acuario/Aire). La mente clara es capaz de ver soluciones donde otros ven límites.",
    "El aire transporta tus ideas hacia nuevos horizontes. Sigue explorando esa visión con libertad espiritual."
  ]
};

function generateGuideReply(receiverId, userContent) {
  const list = BOT_RESPONSES[receiverId] || BOT_RESPONSES.zodia_bot;
  const index = Math.abs(userContent.length + Date.now()) % list.length;
  return list[index];
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
  const myId = resolveUserId(token);

  if (!db) {
    return NextResponse.json([]);
  }

  try {
    const messages = await db.prepare(`
      SELECT 
        id, sender_id, receiver_id, content, created_at
      FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) 
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).bind(myId, withUserId, withUserId, myId).all();

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
  const myId = resolveUserId(token);

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

  const cleanContent = content.trim();
  const userMsgObj = {
    id: Date.now(),
    sender_id: myId,
    receiver_id: receiverId,
    content: cleanContent,
    created_at: new Date().toISOString()
  };

  // Si se chatea con un bot o guía arquetípico, generar respuesta automática
  const isGuideOrBot = receiverId.startsWith('guide_') || receiverId === 'zodia_bot';

  if (!db) {
    const mockResponse = [userMsgObj];
    if (isGuideOrBot) {
      mockResponse.push({
        id: Date.now() + 1,
        sender_id: receiverId,
        receiver_id: myId,
        content: generateGuideReply(receiverId, cleanContent),
        created_at: new Date(Date.now() + 1000).toISOString()
      });
    }
    return NextResponse.json(userMsgObj);
  }

  try {
    // 1. Guardar mensaje del usuario
    const result = await db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `).bind(myId, receiverId, cleanContent).run();

    // 2. Si es guía/bot, guardar respuesta mística
    if (isGuideOrBot) {
      const replyText = generateGuideReply(receiverId, cleanContent);
      await db.prepare(`
        INSERT INTO messages (sender_id, receiver_id, content)
        VALUES (?, ?, ?)
      `).bind(receiverId, myId, replyText).run();
    }

    return NextResponse.json({
      id: result.meta?.last_row_id ?? Date.now(),
      sender_id: myId,
      receiver_id: receiverId,
      content: cleanContent,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
    return NextResponse.json({ error: "Fallo al transmitir el mensaje místico." }, { status: 500 });
  }
}
