import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { ensureDatabaseSchema } from '../../../lib/db-init';
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

// Semilla viva de publicaciones cósmicas para el Éter social
const SEED_FEED_POSTS = [
  {
    id: 'post_valeria_1',
    user_id: 'candidate_valeria',
    author_name: 'Valeria Ríos',
    author_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    author_sign: 'Leo',
    author_element: 'Fuego',
    content: 'Hoy la Luna está en fase creciente y la energía de Fuego se siente a tope 🔥 ¿Quién más siente ganas de empezar un proyecto creativo de golpe?',
    media_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    vibe_tag: '🪐 Tránsitos',
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // hace 35 min
    reactions: { resonate: 12, fire: 18, love: 6, cosmos: 9 },
    userReactions: ['fire'],
    commentsCount: 3,
    comments: [
      {
        id: 'c1',
        author_name: 'Mateo Silva',
        author_sign: 'Piscis',
        author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
        content: '¡Totalmente! Llevo toda la tarde componiendo un riff en la guitarra 🎸',
        created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      },
      {
        id: 'c2',
        author_name: 'Camila Beltrán',
        author_sign: 'Géminis',
        author_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
        content: 'Jajaja yo ya abrí 15 pestañas de investigación nueva ✨',
        created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ]
  },
  {
    id: 'post_mateo_1',
    user_id: 'candidate_mateo',
    author_name: 'Mateo Silva',
    author_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    author_sign: 'Piscis',
    author_element: 'Agua',
    content: 'Recordatorio estelar de hoy: no todas las conexiones necesitan explicarse con palabras. A veces basta con estar en la misma sintonía de silencio 🌊✨',
    media_url: null,
    vibe_tag: '✨ Reflexión',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // hace 2 hrs
    reactions: { resonate: 24, fire: 4, love: 15, cosmos: 19 },
    userReactions: ['resonate', 'love'],
    commentsCount: 2,
    comments: [
      {
        id: 'c3',
        author_name: 'Sofía Navarro',
        author_sign: 'Escorpio',
        author_image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        content: 'La paz compartida vale más que mil charlas vacías 🌙',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      }
    ]
  },
  {
    id: 'post_camila_1',
    user_id: 'candidate_camila',
    author_name: 'Camila Beltrán',
    author_image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    author_sign: 'Géminis',
    author_element: 'Aire',
    content: '¿Qué canción sienten que define el signo lunar de cada uno? Dejen recomendaciones para armar una playlist astral colectiva de Zodia 🎧🌌',
    media_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    vibe_tag: '🎵 Música',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // hace 4 hrs
    reactions: { resonate: 17, fire: 8, love: 11, cosmos: 14 },
    userReactions: [],
    commentsCount: 1,
    comments: [
      {
        id: 'c4',
        author_name: 'Nicolás Paz',
        author_sign: 'Sagitario',
        author_image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300',
        content: '"Midnight City" de M83, vibra cósmica pura 🚀',
        created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
      }
    ]
  }
];

// Fallback en memoria en desarrollo
let devFeed = [...SEED_FEED_POSTS];

export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vibeFilter = searchParams.get('vibe')?.toLowerCase() || 'todos';

  const db = await getDB();
  const rawId = resolveUserId(token);

  if (!db) {
    let filtered = devFeed;
    if (vibeFilter !== 'todos') {
      filtered = filtered.filter(p => (p.vibe_tag || '').toLowerCase().includes(vibeFilter));
    }
    return NextResponse.json({ posts: filtered });
  }

  try {
    await ensureDatabaseSchema(db);
    const myId = (await resolveCanonicalUserId(db, token)) || rawId;

    let query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM feed_comments c WHERE c.post_id = p.id) as commentsCount,
        (SELECT COUNT(*) FROM feed_reactions r WHERE r.post_id = p.id AND r.type = 'resonate') as resonateCount,
        (SELECT COUNT(*) FROM feed_reactions r WHERE r.post_id = p.id AND r.type = 'fire') as fireCount,
        (SELECT COUNT(*) FROM feed_reactions r WHERE r.post_id = p.id AND r.type = 'love') as loveCount,
        (SELECT COUNT(*) FROM feed_reactions r WHERE r.post_id = p.id AND r.type = 'cosmos') as cosmosCount,
        (SELECT GROUP_CONCAT(r.type) FROM feed_reactions r WHERE r.post_id = p.id AND r.user_id = ?) as myReactions
      FROM feed_posts p
    `;

    const binds = [myId];
    if (vibeFilter !== 'todos') {
      query += ` WHERE LOWER(p.vibe_tag) LIKE ?`;
      binds.push(`%${vibeFilter}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT 50`;

    const { results } = await db.prepare(query).bind(...binds).all();

    // Si la tabla D1 aún no tiene posts de usuarios, integrar la semilla cósmica
    let posts = (results || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      author_name: row.author_name,
      author_image: row.author_image,
      author_sign: row.author_sign,
      author_element: row.author_element,
      content: row.content,
      media_url: row.media_url,
      vibe_tag: row.vibe_tag,
      created_at: row.created_at,
      commentsCount: row.commentsCount || 0,
      reactions: {
        resonate: row.resonateCount || 0,
        fire: row.fireCount || 0,
        love: row.loveCount || 0,
        cosmos: row.cosmosCount || 0
      },
      userReactions: row.myReactions ? row.myReactions.split(',') : []
    }));

    if (posts.length === 0) {
      let filteredSeed = SEED_FEED_POSTS;
      if (vibeFilter !== 'todos') {
        filteredSeed = filteredSeed.filter(p => (p.vibe_tag || '').toLowerCase().includes(vibeFilter));
      }
      posts = filteredSeed;
    }

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Error obteniendo publicaciones del feed:", err);
    return NextResponse.json({ posts: devFeed });
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

  const { action } = body;
  const db = await getDB();
  const rawId = resolveUserId(token);

  // 1. ACCIÓN: CREAR PUBLICACIÓN EN EL MURO
  if (action === 'create_post') {
    const { content, vibeTag, mediaUrl, authorName, authorImage, authorSign, authorElement } = body;
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "El contenido no puede estar vacío." }, { status: 400 });
    }

    const newPostId = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newPost = {
      id: newPostId,
      user_id: rawId,
      author_name: authorName || token.name || 'Sintonizador',
      author_image: authorImage || token.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'Z')}&background=06b6d4&color=fff`,
      author_sign: authorSign || 'Capricornio',
      author_element: authorElement || 'Tierra',
      content: content.trim(),
      media_url: mediaUrl || null,
      vibe_tag: vibeTag || 'Reflexión ✨',
      created_at: new Date().toISOString(),
      commentsCount: 0,
      reactions: { resonate: 0, fire: 0, love: 0, cosmos: 0 },
      userReactions: []
    };

    if (db) {
      try {
        await ensureDatabaseSchema(db);
        const myId = (await resolveCanonicalUserId(db, token)) || rawId;
        await db.prepare(`
          INSERT INTO feed_posts (id, user_id, author_name, author_image, author_sign, author_element, content, media_url, vibe_tag)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newPost.id,
          myId,
          newPost.author_name,
          newPost.author_image,
          newPost.author_sign,
          newPost.author_element,
          newPost.content,
          newPost.media_url,
          newPost.vibe_tag
        ).run();
      } catch (err) {
        console.error("Error insertando post en D1:", err);
      }
    }

    devFeed = [newPost, ...devFeed];
    return NextResponse.json({ success: true, post: newPost });
  }

  // 2. ACCIÓN: REACCIONAR (TOGGLE)
  if (action === 'react') {
    const { postId, type } = body; // type: 'resonate' | 'fire' | 'love' | 'cosmos'
    if (!postId || !type) {
      return NextResponse.json({ error: "Faltan parámetros de reacción" }, { status: 400 });
    }

    if (db) {
      try {
        await ensureDatabaseSchema(db);
        const myId = (await resolveCanonicalUserId(db, token)) || rawId;

        const existing = await db.prepare(`
          SELECT id FROM feed_reactions WHERE post_id = ? AND user_id = ? AND type = ?
        `).bind(postId, myId, type).first();

        let added = false;
        if (existing) {
          await db.prepare(`
            DELETE FROM feed_reactions WHERE post_id = ? AND user_id = ? AND type = ?
          `).bind(postId, myId, type).run();
        } else {
          await db.prepare(`
            INSERT INTO feed_reactions (post_id, user_id, type) VALUES (?, ?, ?)
          `).bind(postId, myId, type).run();
          added = true;

          // Notificación al autor del post
          const postOwner = await db.prepare(`SELECT user_id, author_name FROM feed_posts WHERE id = ?`).bind(postId).first();
          if (postOwner && postOwner.user_id !== myId) {
            const reactionIcons = { resonate: '✨', fire: '🔥', love: '💖', cosmos: '🌌' };
            await sendNotification({
              db,
              userId: postOwner.user_id,
              title: "Nueva Resonancia en tu Muro",
              body: `Alguien reaccionó ${reactionIcons[type] || '✨'} a tu publicación cósmica.`,
              url: "/zodia/dashboard?tab=feed",
              type: "feed_reaction"
            });
          }
        }

        return NextResponse.json({ success: true, added });
      } catch (err) {
        console.error("Error al reaccionar en D1:", err);
      }
    }

    // Fallback memoria
    const targetPost = devFeed.find(p => p.id === postId);
    if (targetPost) {
      if (!targetPost.reactions) targetPost.reactions = { resonate: 0, fire: 0, love: 0, cosmos: 0 };
      if (!targetPost.userReactions) targetPost.userReactions = [];

      const hasReacted = targetPost.userReactions.includes(type);
      if (hasReacted) {
        targetPost.userReactions = targetPost.userReactions.filter(t => t !== type);
        targetPost.reactions[type] = Math.max(0, (targetPost.reactions[type] || 1) - 1);
      } else {
        targetPost.userReactions.push(type);
        targetPost.reactions[type] = (targetPost.reactions[type] || 0) + 1;
      }
      return NextResponse.json({ success: true, added: !hasReacted });
    }

    return NextResponse.json({ success: true });
  }

  // 3. ACCIÓN: COMENTAR
  if (action === 'comment') {
    const { postId, content, authorName, authorImage, authorSign } = body;
    if (!postId || !content || !content.trim()) {
      return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });
    }

    const commentId = 'com_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newComment = {
      id: commentId,
      post_id: postId,
      user_id: rawId,
      author_name: authorName || token.name || 'Sintonizador',
      author_image: authorImage || token.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'Z')}&background=06b6d4&color=fff`,
      author_sign: authorSign || 'Cosmos',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    if (db) {
      try {
        await ensureDatabaseSchema(db);
        const myId = (await resolveCanonicalUserId(db, token)) || rawId;

        await db.prepare(`
          INSERT INTO feed_comments (id, post_id, user_id, author_name, author_image, author_sign, content)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newComment.id,
          postId,
          myId,
          newComment.author_name,
          newComment.author_image,
          newComment.author_sign,
          newComment.content
        ).run();

        // Notificar al dueño del post
        const postOwner = await db.prepare(`SELECT user_id FROM feed_posts WHERE id = ?`).bind(postId).first();
        if (postOwner && postOwner.user_id !== myId) {
          await sendNotification({
            db,
            userId: postOwner.user_id,
            title: "Nuevo Comentario en tu Resonancia",
            body: `${newComment.author_name} comentó: "${newComment.content.slice(0, 45)}..."`,
            url: "/zodia/dashboard?tab=feed",
            type: "feed_comment"
          });
        }

        return NextResponse.json({ success: true, comment: newComment });
      } catch (err) {
        console.error("Error al guardar comentario en D1:", err);
      }
    }

    // Fallback memoria
    const targetPost = devFeed.find(p => p.id === postId);
    if (targetPost) {
      if (!targetPost.comments) targetPost.comments = [];
      targetPost.comments.push(newComment);
      targetPost.commentsCount = (targetPost.commentsCount || 0) + 1;
    }

    return NextResponse.json({ success: true, comment: newComment });
  }

  // 4. ACCIÓN: OBTENER COMENTARIOS DE UN POST
  if (action === 'get_comments') {
    const { postId } = body;
    if (!postId) return NextResponse.json({ comments: [] });

    if (db) {
      try {
        await ensureDatabaseSchema(db);
        const { results } = await db.prepare(`
          SELECT * FROM feed_comments WHERE post_id = ? ORDER BY created_at ASC
        `).bind(postId).all();
        return NextResponse.json({ comments: results || [] });
      } catch (err) {
        console.error("Error al obtener comentarios en D1:", err);
      }
    }

    const targetPost = devFeed.find(p => p.id === postId);
    return NextResponse.json({ comments: targetPost?.comments || [] });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
