/**
 * Motor de Notificaciones Cósmicas Zodia (Web Push & In-App)
 * Compatible con Cloudflare Pages Edge Runtime y Node.js
 */

export async function ensureNotificationTables(db) {
  if (!db) return;
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});

    await db.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        url TEXT,
        type TEXT DEFAULT 'general',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run().catch(() => {});
  } catch (err) {
    console.warn('[Notifications] Error asegurando tablas:', err.message);
  }
}

/**
 * Registra una notificación en la base de datos y envía el Web Push a los móviles registrados
 */
export async function sendNotification({ db, userId, title, body, url = '/zodia/dashboard', type = 'general' }) {
  if (!userId || !title) return { success: false, error: 'Faltan parámetros' };

  if (!db) {
    try {
      const { devStore } = await import('./dev-store');
      devStore.notifications.unshift({
        id: Date.now(),
        user_id: userId,
        title,
        body,
        url,
        type,
        is_read: 0,
        created_at: new Date().toISOString()
      });
    } catch {}
    return { success: true };
  }

  if (db) {
    try {
      await ensureNotificationTables(db);

      // 1. Guardar en la tabla de notificaciones para consumo In-App
      await db.prepare(`
        INSERT INTO notifications (user_id, title, body, url, type, is_read)
        VALUES (?, ?, ?, ?, ?, 0)
      `).bind(userId, title, body, url, type).run();

      // 2. Obtener las suscripciones Web Push activas del usuario
      const subs = await db.prepare(`
        SELECT endpoint, p256dh, auth 
        FROM push_subscriptions 
        WHERE user_id = ?
      `).bind(userId).all();

      const subscriptions = subs?.results || [];

      // 3. Emitir el payload a los dispositivos móviles
      for (const sub of subscriptions) {
        try {
          // Si el endpoint es de FCM / Mozilla / Apple, emitir petición push directa
          await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'TTL': '86400'
            },
            body: JSON.stringify({
              title,
              body,
              url,
              icon: '/zodia/logo.png',
              badge: '/zodia/ico.png'
            })
          }).catch(() => {});
        } catch {}
      }
    } catch (err) {
      console.warn('[sendNotification] Error persistiendo notificación:', err.message);
    }
  }

  return { success: true };
}
