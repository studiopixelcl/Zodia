/**
 * Servicio de Correos Transaccionales con Resend
 * Compatible 100% con Edge Runtime (Cloudflare Pages) y Node.js
 */

async function getResendApiKey() {
  if (process.env.RESEND_API_KEY) {
    return process.env.RESEND_API_KEY;
  }
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.RESEND_API_KEY || null;
  } catch {
    return null;
  }
}

async function getSenderEmail() {
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.RESEND_FROM_EMAIL || 'Zodia <onboarding@resend.dev>';
  } catch {
    return 'Zodia <onboarding@resend.dev>';
  }
}

/**
 * Función base para enviar correo mediante la API REST de Resend
 */
async function sendResendEmail({ to, subject, html, text }) {
  const apiKey = await getResendApiKey();
  const fromEmail = await getSenderEmail();

  if (!apiKey) {
    console.warn('[Resend] No se encontró RESEND_API_KEY. Correo simulado para:', to);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[Resend Error]', data);
      return { success: false, error: data.message || 'Error al enviar correo vía Resend' };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Resend Fatal Error]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Correo de Recuperación de Contraseña con Código PIN Cósmico
 */
export async function sendPasswordResetEmail({ to, name = 'Sintonizador', resetCode, expiresInMinutes = 15 }) {
  const subject = `🔐 Tu código de acceso cósmico: ${resetCode} - Zodia`;
  const text = `Hola ${name}, tu código de recuperación para Zodia es: ${resetCode}. Expira en ${expiresInMinutes} minutos.`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030408; margin: 0; padding: 30px 10px; color: #f1f5f9; }
        .container { max-width: 520px; margin: 0 auto; background: #080b18; border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 24px; padding: 36px 28px; box-shadow: 0 0 50px rgba(6, 182, 212, 0.15); }
        .logo { font-size: 26px; font-weight: 800; letter-spacing: 0.15em; color: #ffffff; text-align: center; margin-bottom: 24px; text-transform: uppercase; }
        .logo span { color: #06b6d4; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; text-align: center; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center; margin-bottom: 28px; }
        .pin-card { background: #020307; border: 1px dashed rgba(6, 182, 212, 0.5); border-radius: 16px; padding: 22px; text-align: center; margin-bottom: 28px; }
        .pin-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #06b6d4; font-weight: 700; margin-bottom: 8px; }
        .pin-code { font-size: 38px; font-family: 'Courier New', Courier, monospace; font-weight: 900; letter-spacing: 0.35em; color: #ffffff; text-shadow: 0 0 15px rgba(6, 182, 212, 0.6); }
        .warning { font-size: 12px; color: #eab308; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 12px; padding: 12px; text-align: center; margin-bottom: 24px; }
        .footer { font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">ZO<span>D</span>IA</div>
        <div class="title">Restablecimiento de Contraseña</div>
        <div class="desc">
          Hola <strong>${name}</strong>, recibimos una solicitud para restablecer tu contraseña en la red cósmica de Zodia.
        </div>
        
        <div class="pin-card">
          <div class="pin-label">Código de Verificación</div>
          <div class="pin-code">${resetCode}</div>
        </div>

        <div class="warning">
          ⏳ Este código es válido por los próximos <strong>${expiresInMinutes} minutos</strong>.
        </div>

        <div class="desc" style="font-size: 12px; margin-bottom: 0;">
          Si tú no solicitaste este código, puedes ignorar este correo de forma segura. Tu cuenta permanece protegida.
        </div>

        <div class="footer">
          © 2026 Zodia • Astrología Consciente & Conexiones Profundas<br>
          <a href="https://zodia.studiopixel.cl/zodia" style="color: #06b6d4; text-decoration: none;">zodia.studiopixel.cl</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendResendEmail({ to, subject, html, text });
}

/**
 * Correo de Bienvenida Cósmica (Nuevo Usuario Registrado)
 */
export async function sendWelcomeEmail({ to, name = 'Sintonizador', sign = 'Aries', element = 'Fuego', lifePath = 9 }) {
  const subject = `✨ Bienvenido a Zodia: Tu frecuencia cósmica ha sido sintonizada`;
  const text = `¡Bienvenido a Zodia, ${name}! Tu signo solar es ${sign}, elemento primordial ${element} y camino de vida ${lifePath}. Ingresa en https://zodia.studiopixel.cl/zodia`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030408; margin: 0; padding: 30px 10px; color: #f1f5f9; }
        .container { max-width: 520px; margin: 0 auto; background: #080b18; border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 24px; padding: 36px 28px; box-shadow: 0 0 50px rgba(6, 182, 212, 0.15); text-align: center; }
        .logo { font-size: 26px; font-weight: 800; letter-spacing: 0.15em; color: #ffffff; margin-bottom: 24px; text-transform: uppercase; }
        .logo span { color: #06b6d4; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.3); color: #06b6d4; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; }
        .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 26px; }
        .cards-grid { display: table; width: 100%; margin-bottom: 30px; }
        .card-col { display: table-cell; width: 33.33%; padding: 0 6px; }
        .card { background: #020307; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 16px 8px; text-align: center; }
        .card-sub { font-size: 9px; text-transform: uppercase; color: #06b6d4; font-weight: 700; letter-spacing: 0.1em; margin-bottom: 4px; }
        .card-val { font-size: 15px; font-weight: 800; color: #ffffff; }
        .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 14px; box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); margin-bottom: 28px; }
        .footer { font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">ZO<span>D</span>IA</div>
        <div class="badge">Sintonía Confirmada</div>
        <div class="title">¡Bienvenido a la red cósmica, ${name}!</div>
        <div class="desc">
          Tu energía astral ha sido calculada e integrada a nuestra matriz. A partir de ahora podrás explorar compatibilidad consciente, lecturas místicas y citas con resonancia auténtica.
        </div>

        <div class="cards-grid">
          <div class="card-col">
            <div class="card">
              <div class="card-sub">Signo Solar</div>
              <div class="card-val">${sign}</div>
            </div>
          </div>
          <div class="card-col">
            <div class="card">
              <div class="card-sub">Elemento</div>
              <div class="card-val">${element}</div>
            </div>
          </div>
          <div class="card-col">
            <div class="card">
              <div class="card-sub">Camino de Vida</div>
              <div class="card-val">Nº ${lifePath}</div>
            </div>
          </div>
        </div>

        <div>
          <a href="https://zodia.studiopixel.cl/zodia" class="btn">Explorar mi Espejo Astral ➔</a>
        </div>

        <div class="footer">
          © 2026 Zodia • Astrología Consciente & Conexiones Profundas<br>
          <a href="https://zodia.studiopixel.cl/zodia" style="color: #06b6d4; text-decoration: none;">zodia.studiopixel.cl</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendResendEmail({ to, subject, html, text });
}
