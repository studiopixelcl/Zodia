export async function getAuthUser(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
    if (match && match[1]) {
      let decoded = match[1];
      try {
        decoded = decodeURIComponent(match[1]);
      } catch {}
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        // Fallback a JWT
      }
    }
    try {
      const { getToken } = await import('next-auth/jwt');
      const jwtToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      return jwtToken;
    } catch {
      return null;
    }
  } catch (err) {
    return null;
  }
}

export function resolveUserId(token) {
  if (!token) return null;
  return token.id ?? token.sub ?? token.email ?? null;
}
