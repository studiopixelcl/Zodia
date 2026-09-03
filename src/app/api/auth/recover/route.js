import { hashPassword } from '../../../../lib/auth-edge';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.DB ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/recover
 * Flujo de recuperación y reseteo de contraseña cósmica.
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      return new Response(JSON.stringify({ error: 'Payload inválido: ' + parseErr.message }), { status: 400 });
    }

    const { action, email, code, newPassword } = body;
    const rawEmail = (email || '').trim().toLowerCase();

    if (!rawEmail) {
      return new Response(JSON.stringify({ error: 'Ingresa tu correo electrónico.' }), { status: 400 });
    }

    const db = await getDB();

    // ─── PASO 1: SOLICITAR CÓDIGO DE RECUPERACIÓN ──────────────────────────────
    if (action === 'request') {
      const cleanId = rawEmail.replace(/[@.]/g, '_').toLowerCase();
      const userId = cleanId.startsWith('tuner_') ? cleanId : 'tuner_' + cleanId;
      const userEmail = rawEmail.includes('@') ? rawEmail : `${userId}@zodia.eter`;

      // Generar PIN cósmico de 6 dígitos
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetExpires = Date.now() + 15 * 60 * 1000; // 15 minutos

      if (db) {
        try {
          await db.prepare("ALTER TABLE users ADD COLUMN reset_code TEXT").run().catch(() => {});
          await db.prepare("ALTER TABLE users ADD COLUMN reset_expires INTEGER").run().catch(() => {});

          const user = await db.prepare(`
            SELECT id, email, name FROM users 
            WHERE LOWER(email) = LOWER(?) OR id = ? OR LOWER(name) = LOWER(?)
          `).bind(userEmail, userId, rawEmail).first();

          if (!user) {
            return new Response(JSON.stringify({
              error: 'No se encontró ninguna cuenta vinculada a este correo o usuario cósmico.'
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
          }

          await db.prepare(`
            UPDATE users 
            SET reset_code = ?, reset_expires = ?
            WHERE id = ?
          `).bind(resetCode, resetExpires, user.id).run();

        } catch (dbErr) {
          console.warn('[POST /api/auth/recover - request] Warning D1:', dbErr.message);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Código cósmico de recuperación generado con éxito.',
        // Se envía el PIN para que la UI pueda autocompletarlo o mostrarlo si no hay SMTP configurado
        code: resetCode,
        expiresInMinutes: 15
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ─── PASO 2: VERIFICAR CÓDIGO Y RESTABLECER CONTRASEÑA ─────────────────────
    if (action === 'verify_and_reset') {
      const trimmedCode = (code || '').trim();
      const trimmedPass = (newPassword || '').trim();

      if (!trimmedCode || trimmedCode.length !== 6) {
        return new Response(JSON.stringify({ error: 'Ingresa el código PIN de 6 dígitos.' }), { status: 400 });
      }

      if (!trimmedPass || trimmedPass.length < 4) {
        return new Response(JSON.stringify({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' }), { status: 400 });
      }

      const cleanId = rawEmail.replace(/[@.]/g, '_').toLowerCase();
      const userId = cleanId.startsWith('tuner_') ? cleanId : 'tuner_' + cleanId;
      const userEmail = rawEmail.includes('@') ? rawEmail : `${userId}@zodia.eter`;

      if (db) {
        try {
          const user = await db.prepare(`
            SELECT id, email, reset_code, reset_expires FROM users 
            WHERE LOWER(email) = LOWER(?) OR id = ? OR LOWER(name) = LOWER(?)
          `).bind(userEmail, userId, rawEmail).first();

          if (!user) {
            return new Response(JSON.stringify({ error: 'Usuario no encontrado.' }), { status: 404 });
          }

          if (user.reset_code !== trimmedCode) {
            return new Response(JSON.stringify({ error: 'Código cósmico inválido o incorrecto.' }), { status: 400 });
          }

          if (user.reset_expires && Date.now() > user.reset_expires) {
            return new Response(JSON.stringify({ error: 'El código ha expirado. Por favor solicita uno nuevo.' }), { status: 400 });
          }

          const passwordHash = await hashPassword(trimmedPass);

          await db.prepare(`
            UPDATE users 
            SET password_hash = ?, reset_code = NULL, reset_expires = NULL
            WHERE id = ?
          `).bind(passwordHash, user.id).run();

          return new Response(JSON.stringify({
            success: true,
            message: '¡Tu contraseña cósmica ha sido actualizada! Ya puedes iniciar sesión.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (dbErr) {
          console.error('[POST /api/auth/recover - verify] Error:', dbErr);
          return new Response(JSON.stringify({ error: 'Error al actualizar contraseña en la base de datos.' }), { status: 500 });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mock: true,
        message: '¡Contraseña actualizada correctamente!'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Acción no válida. Usa action: "request" o "verify_and_reset".' }), { status: 400 });

  } catch (err) {
    console.error('[POST /api/auth/recover] Error crítico:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
