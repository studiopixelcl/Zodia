export const runtime = 'edge';

const COOKIE_NAME = 'next-auth.session-token';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  try {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        try {
          cookies[key] = decodeURIComponent(val);
        } catch {
          cookies[key] = val;
        }
      }
    });
  } catch {}
  return cookies;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const cookies = parseCookies(req.headers.get('cookie'));

    // GET /api/auth/session
    if (pathname.endsWith('/session')) {
      const sessionCookie = cookies[COOKIE_NAME];
      if (sessionCookie) {
        try {
          const user = JSON.parse(sessionCookie);
          return new Response(JSON.stringify({
            user,
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {
          // Ignorar cookie corrupta
        }
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/auth/csrf
    if (pathname.endsWith('/csrf')) {
      return new Response(JSON.stringify({ csrfToken: 'edge-csrf-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /api/auth/providers
    if (pathname.endsWith('/providers')) {
      return new Response(JSON.stringify({
        credentials: {
          id: 'credentials',
          name: 'Acceso Terrenal',
          type: 'credentials',
          signinUrl: '/zodia/api/auth/signin/credentials',
          callbackUrl: '/zodia/api/auth/callback/credentials'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req) {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // POST /api/auth/callback/credentials o POST /api/auth/signin/credentials
    if (pathname.includes('/credentials')) {
      let credentials = {};
      try {
        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          credentials = await req.json();
        } else {
          const formData = await req.formData();
          credentials = Object.fromEntries(formData.entries());
        }
      } catch (e) {
        //
      }

      const trimmedName = (credentials.name || '').trim();
      if (trimmedName) {
        const userId = 'tuner_' + trimmedName.toLowerCase().replace(/\s+/g, '');
        const dob = credentials.dob || '2000-01-01';
        const user = {
          id: userId,
          name: trimmedName,
          email: `${userId}@zodia.eter`,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=06b6d4&color=fff&bold=true`,
          dob: dob
        };

        const cookieVal = encodeURIComponent(JSON.stringify(user));
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.append(
          'Set-Cookie',
          `${COOKIE_NAME}=${cookieVal}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`
        );

        return new Response(JSON.stringify({ url: '/zodia/dashboard', user }), {
          status: 200,
          headers
        });
      }

      return new Response(JSON.stringify({ error: 'Credenciales inválidas' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/auth/signout
    if (pathname.includes('/signout')) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`);
      return new Response(JSON.stringify({ url: '/zodia' }), {
        status: 200,
        headers
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}