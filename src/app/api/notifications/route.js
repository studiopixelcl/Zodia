import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';
import { ensureNotificationTables } from '../../../lib/push-notifications';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

// ── GET /api/notifications ───────────────────────────────────────────────────
// Devuelve las notificaciones recientes no leídas del usuario
export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getDB();
  const userId = resolveUserId(token);

  if (!db) {
    try {
      const { devStore } = await import('../../../lib/dev-store');
      const userNotifs = (devStore.notifications || []).filter(n => n.user_id === userId);
      const unreadCount = userNotifs.filter(n => !n.is_read).length;
      const { searchParams } = new URL(request.url);
      if (searchParams.get('mark_read') === 'true') {
        userNotifs.forEach(n => { n.is_read = 1; });
      }
      return NextResponse.json({ notifications: userNotifs.slice(0, 15), unreadCount });
    } catch {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }
  }

  try {
    await ensureNotificationTables(db);

    const { searchParams } = new URL(request.url);
    const markReadId = searchParams.get('id');
    const markAllRead = searchParams.get('mark_read') === 'true';

    if (markReadId) {
      await db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND id = ?`).bind(userId, markReadId).run().catch(() => {});
      await db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?`).bind(userId, markReadId).run().catch(() => {});
    } else if (markAllRead) {
      await db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).bind(userId).run().catch(() => {});
      await db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).bind(userId).run().catch(() => {});
    }

    let notifications = [];
    try {
      const rows = await db.prepare(`
        SELECT id, title, body, url, type, COALESCE(is_read, 0) AS is_read, created_at
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 30
      `).bind(userId).all();
      notifications = rows?.results || [];
    } catch {
      try {
        const fallbackRows = await db.prepare(`
          SELECT id, title, body, url, type, COALESCE(read, 0) AS is_read, created_at
          FROM notifications
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 30
        `).bind(userId).all();
        notifications = fallbackRows?.results || [];
      } catch {}
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[GET /api/notifications] Error:', err);
    return NextResponse.json({ error: 'Error al consultar notificaciones' }, { status: 500 });
  }
}

// ── POST /api/notifications ──────────────────────────────────────────────────
// Registra o renueva una suscripción Web Push
export async function POST(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getDB();
  const userId = resolveUserId(token);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
  }

  const { subscription, action = 'subscribe' } = body;

  if (action === 'unsubscribe') {
    if (db && subscription?.endpoint) {
      try {
        await db.prepare(`
          DELETE FROM push_subscriptions WHERE endpoint = ?
        `).bind(subscription.endpoint).run();
      } catch {}
    }
    return NextResponse.json({ success: true, unsubscribed: true });
  }

  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  }

  const endpoint = subscription.endpoint;
  const p256dh   = subscription.keys?.p256dh || '';
  const auth     = subscription.keys?.auth || '';

  if (db) {
    try {
      await ensureNotificationTables(db);

      await db.prepare(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET
          user_id = excluded.user_id,
          p256dh = excluded.p256dh,
          auth = excluded.auth,
          created_at = CURRENT_TIMESTAMP
      `).bind(userId, endpoint, p256dh, auth).run();
    } catch (err) {
      console.error('[POST /api/notifications] Error guardando suscripción:', err);
    }
  }

  return NextResponse.json({ success: true, registered: true });
}
