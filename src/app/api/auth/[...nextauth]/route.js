import { NextResponse } from 'next/server';

export const runtime = 'edge';

const COOKIE_NAME = 'next-auth.session-token';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return cookies;
}

export async function GET(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const cookies = parseCookies(req.headers.get('cookie'));

  // GET /api/auth/session
  if (pathname.endsWith('/session')) {
    const sessionCookie = cookies[COOKIE_NAME];
    if (sessionCookie) {
      try {
        const user = JSON.parse(sessionCookie);
        return NextResponse.json({
          user,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (e) {
        // Ignorar cookie corrupta
      }
    }
    return NextResponse.json({});
  }

  // GET /api/auth/csrf
  if (pathname.endsWith('/csrf')) {
    return NextResponse.json({ csrfToken: 'edge-csrf-token' });
  }

  // GET /api/auth/providers
  if (pathname.endsWith('/providers')) {
    return NextResponse.json({
      credentials: {
        id: 'credentials',
        name: 'Acceso Terrenal',
        type: 'credentials',
        signinUrl: '/api/auth/signin/credentials',
        callbackUrl: '/api/auth/callback/credentials'
      }
    });
  }

  return NextResponse.json({});
}

export async function POST(req) {
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

      const res = NextResponse.json({
        url: '/zodia/dashboard'
      });

      res.cookies.set(COOKIE_NAME, JSON.stringify(user), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60
      });

      return res;
    }

    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 400 });
  }

  // POST /api/auth/signout
  if (pathname.includes('/signout')) {
    const res = NextResponse.json({ url: '/zodia' });
    res.cookies.set(COOKIE_NAME, '', {
      path: '/',
      maxAge: 0
    });
    return res;
  }

  return NextResponse.json({});
}