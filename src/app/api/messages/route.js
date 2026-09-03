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

// Respuestas contextuales de citas y sintonizadores
const BOT_RESPONSES = {
  zodia_bot: [
    "Las constelaciones observan tu mensaje. Tu frecuencia está alineada con el propósito de tu camino de vida.",
    "El éter procesa tu consulta. Confía en la intuición que nace de tu centro espiritual hoy.",
    "Para conquistar a signos de Fuego, sé directo y audaz; para signos de Agua, abre tu vulnerabilidad."
  ],
  candidate_valeria: [
    "¡Hola! Me alegra que hayamos hecho match 😊 ¿Qué tipo de música te gusta escuchar cuando necesitas desconectar?",
    "¡Totalmente de acuerdo! Como Leo suelo ser súper intensa con mis proyectos, pero adoro una buena charla relajada ✨",
    "¡Jajaja me hiciste reír! ¿Tienes algún lugar favorito para tomar un trago o café en la ciudad?",
    "Me encanta tu energía astral. Siento que las conversaciones fluidas son difíciles de encontrar hoy en día 🔥"
  ],
  candidate_mateo: [
    "¡Hola! Qué buena onda que hayamos conectado. Como buen Piscis a veces me pierdo en mis pensamientos, pero aquí estoy jaja 🌊",
    "Me encanta eso. Si tuvieses que elegir una canción que resuma tu momento actual, ¿cuál sería?",
    "¡Qué buena respuesta! Oye, ¿eres más de planes tranquilos de domingo o de salir a explorar?",
    "Siento que nuestra sinergia astral tiene mucho sentido. Me encanta conocer gente con profundidad ✨"
  ],
  candidate_camila: [
    "¡Hola! Me llamó mucho la atención tu perfil 📸 ¿Qué es lo que más te apasiona hacer en tus días libres?",
    "¡Qué interesante! Mi mente Géminis siempre necesita nuevos estímulos jaja. Cuéntame más de eso ✨",
    "¡Exacto! Oye, conozco un café con una vista hermosa de la cordillera, ¿lo conoces?",
    "Me encanta cuando alguien tiene buen sentido del humor y sabe conversar de todo un poco."
  ],
  candidate_sofia: [
    "Hola... Qué linda sorpresa nuestra resonancia cósmica 🌙 ¿Crees que las conexiones se eligen o simplemente suceden?",
    "Qué linda forma de expresarlo. Me gusta la gente que no se queda en lo superficial.",
    "Dicen que los Escorpio somos un enigma, pero en realidad solo valoramos la autenticidad pura.",
    "Me encantaría saber qué es lo que más te motiva en la vida ahora mismo ✨"
  ],
  candidate_nicolas: [
    "¡Ey qué tal! Qué bueno coincidir por aquí. ¿Haces deporte o te gusta salir a la montaña?",
    "¡Buena esa! Yo estoy planeando una escapada para el próximo fin de semana, amo no quedarme quieto 🚀",
    "¡Jajaja genial! Oye, ¿café o cerveza para una primera charla?",
    "Buena vibra total. ¡Se nota la afinidad cósmica!"
  ],
  candidate_elena: [
    "¡Hola! Qué hermosa sintonía tenemos 🌸 ¿Cómo estuvo tu día hoy?",
    "Me encanta lo que dices. Disfruto mucho los pequeños detalles y la buena conversación.",
    "¡Totalmente! Hay que buscar momentos de paz y buena compañía.",
    "Si te gusta el arte o la música suave, creo que nos vamos a llevar increíble ✨"
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

  // Si se chatea con un bot, guía o candidato de prueba, generar respuesta automática
  const isGuideOrBot = receiverId.startsWith('guide_') || receiverId.startsWith('candidate_') || receiverId === 'zodia_bot';

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
