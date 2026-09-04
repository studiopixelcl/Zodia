import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { ensureDatabaseSchema } from '../../../lib/db-init';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

// Semilla viva de historias de 24h de la comunidad Zodia
const SEED_STORIES = [
  {
    userId: 'candidate_valeria',
    authorName: 'Valeria Ríos',
    authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    authorSign: 'Leo',
    hasUnseen: true,
    stories: [
      {
        id: 'story_valeria_1',
        mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&auto=format&fit=crop&q=80',
        caption: 'Atardecer dorado en la ciudad... la energía de Leo hoy pide bailar y desconectar ✨🌅',
        vibeTag: '🔥 Energía Solar',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      },
      {
        id: 'story_valeria_2',
        mediaUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=900&auto=format&fit=crop&q=80',
        caption: 'Probando nuevos cortes y colores para la colección de verano 🪡💫',
        vibeTag: '🎨 Creatividad',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
      }
    ]
  },
  {
    userId: 'candidate_mateo',
    authorName: 'Mateo Silva',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    authorSign: 'Piscis',
    hasUnseen: true,
    stories: [
      {
        id: 'story_mateo_1',
        mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&auto=format&fit=crop&q=80',
        caption: 'Café de especialidad y vinilos viejos. La tarde perfecta de desconexión ☕🎶',
        vibeTag: '🌊 Calma y Melodía',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      }
    ]
  },
  {
    userId: 'candidate_camila',
    authorName: 'Camila Beltrán',
    authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    authorSign: 'Géminis',
    hasUnseen: true,
    stories: [
      {
        id: 'story_camila_1',
        mediaUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=900&auto=format&fit=crop&q=80',
        caption: 'Encontré esta librería escondida en el centro. La vibra es de otra época 📚🪐',
        vibeTag: '✨ Curiosidad',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
      }
    ]
  },
  {
    userId: 'candidate_lucas',
    authorName: 'Lucas Morales',
    authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    authorSign: 'Aries',
    hasUnseen: true,
    stories: [
      {
        id: 'story_lucas_1',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&auto=format&fit=crop&q=80',
        caption: 'Cima alcanzada antes del amanecer. La vista no tiene precio 🏔️⚡',
        vibeTag: '🔥 Aventura & Montaña',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ]
  },
  {
    userId: 'candidate_sofia',
    authorName: 'Sofía Carranza',
    authorImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
    authorSign: 'Escorpio',
    hasUnseen: true,
    stories: [
      {
        id: 'story_sofia_1',
        mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80',
        caption: 'Cielo estrellado y noche de oráculo. Las cartas marcan transformación 🔮✨',
        vibeTag: '🌙 Mística',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ]
  }
];

let devStories = [...SEED_STORIES];

export async function GET(request) {
  const token = await getAuthUser(request);
  const db = await getDB();
  const rawId = token ? resolveUserId(token) : null;

  // Si no hay BD o no hay token aún, entregar las historias semilla de la comunidad
  if (!db) {
    return NextResponse.json({ 
      stories: devStories,
      userStories: devStories 
    });
  }

  try {
    await ensureDatabaseSchema(db);
    const myId = token ? ((await resolveCanonicalUserId(db, token)) || rawId) : null;

    // Buscar historias no expiradas en D1
    const { results } = await db.prepare(`
      SELECT * FROM astral_stories 
      WHERE expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at ASC
    `).all();

    const dbStories = results || [];

    // Agrupar por usuario
    const userMap = {};

    // Primero integrar historias creadas en la base de datos
    for (const s of dbStories) {
      if (!userMap[s.user_id]) {
        userMap[s.user_id] = {
          userId: s.user_id,
          authorName: s.author_name,
          authorImage: s.author_image,
          authorSign: s.author_sign,
          hasUnseen: true,
          stories: []
        };
      }
      userMap[s.user_id].stories.push({
        id: s.id,
        mediaUrl: s.media_url,
        caption: s.caption,
        vibeTag: s.vibe_tag,
        createdAt: s.created_at
      });
    }

    // Complementar con la semilla para asegurar historias activas de la comunidad
    for (const seed of SEED_STORIES) {
      if (!userMap[seed.userId]) {
        userMap[seed.userId] = seed;
      }
    }

    const userStories = Object.values(userMap);
    return NextResponse.json({ 
      stories: userStories,
      userStories: userStories 
    });
  } catch (err) {
    console.error("Error obteniendo historias efímeras:", err);
    return NextResponse.json({ 
      stories: devStories,
      userStories: devStories 
    });
  }
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

  const { mediaUrl, caption, vibeTag, authorName, authorImage, authorSign } = body;
  
  // Fondo místico por defecto si solo se envió texto
  const finalMediaUrl = mediaUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80';

  const db = await getDB();
  const rawId = resolveUserId(token);
  const storyId = 'story_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const newStoryItem = {
    id: storyId,
    mediaUrl: finalMediaUrl,
    caption: caption || '',
    vibeTag: vibeTag || '✨ Energía del Día',
    createdAt: now.toISOString()
  };

  const author = {
    userId: rawId,
    authorName: authorName || token.name || 'Sintonizador',
    authorImage: authorImage || token.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'Z')}&background=06b6d4&color=fff`,
    authorSign: authorSign || 'Cosmos'
  };

  if (db) {
    try {
      await ensureDatabaseSchema(db);
      const myId = (await resolveCanonicalUserId(db, token)) || rawId;

      await db.prepare(`
        INSERT INTO astral_stories (id, user_id, author_name, author_image, author_sign, media_url, caption, vibe_tag, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        storyId,
        myId,
        author.authorName,
        author.authorImage,
        author.authorSign,
        finalMediaUrl,
        caption || null,
        vibeTag || '✨ Energía del Día',
        now.toISOString(),
        expiresAt
      ).run();
    } catch (err) {
      console.error("Error insertando historia en D1:", err);
    }
  }

  // Actualizar fallback memoria para sesión local
  const existingUserIdx = devStories.findIndex(u => u.userId === rawId);
  if (existingUserIdx >= 0) {
    devStories[existingUserIdx].stories.unshift(newStoryItem);
  } else {
    devStories.unshift({
      ...author,
      hasUnseen: false,
      stories: [newStoryItem]
    });
  }

  return NextResponse.json({ 
    success: true, 
    story: newStoryItem,
    stories: devStories,
    userStories: devStories 
  });
}
