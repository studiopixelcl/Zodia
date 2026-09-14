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

// Historias en memoria en desarrollo
let devStories = [];

export async function GET(request) {
  const token = await getAuthUser(request);
  const db = await getDB();
  const rawId = token ? resolveUserId(token) : null;

  if (!db) {
    const filtered = devStories.filter(s => !s.userId?.startsWith('candidate_') && s.userId !== 'zodia_bot');
    return NextResponse.json({ 
      stories: filtered,
      userStories: filtered 
    });
  }

  try {
    await ensureDatabaseSchema(db);

    // Buscar historias reales no expiradas en D1
    const { results } = await db.prepare(`
      SELECT * FROM astral_stories 
      WHERE expires_at > CURRENT_TIMESTAMP
        AND user_id NOT LIKE 'candidate_%'
        AND user_id != 'zodia_bot'
      ORDER BY created_at ASC
    `).all();

    const dbStories = results || [];

    // Agrupar por usuario
    const userMap = {};

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

    const userStories = Object.values(userMap);
    return NextResponse.json({ 
      stories: userStories,
      userStories: userStories 
    });
  } catch (err) {
    console.error("Error obteniendo historias efímeras:", err);
    return NextResponse.json({ 
      stories: [],
      userStories: [] 
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
