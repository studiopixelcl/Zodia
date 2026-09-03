export const runtime = 'edge';

async function getR2Bucket() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext()?.env?.BUCKET ?? null;
  } catch {
    return null;
  }
}

/**
 * GET /api/media/[...key]
 * Sirve archivos multimedia directamente desde Cloudflare R2 con soporte de streaming
 */
export async function GET(request, { params }) {
  try {
    const keyArray = params?.key || [];
    const fullKey = keyArray.join('/');

    if (!fullKey) {
      return new Response('Clave no especificada', { status: 400 });
    }

    const bucket = await getR2Bucket();
    if (!bucket) {
      return new Response('Storage R2 no disponible', { status: 503 });
    }

    const object = await bucket.get(fullKey);
    if (!object) {
      return new Response('Archivo no encontrado', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Accept-Ranges', 'bytes');

    if (!headers.get('Content-Type')) {
      if (fullKey.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
      else if (fullKey.endsWith('.mp4')) headers.set('Content-Type', 'video/mp4');
      else if (fullKey.endsWith('.webm')) headers.set('Content-Type', 'video/webm');
      else if (fullKey.endsWith('.jpg') || fullKey.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
      else if (fullKey.endsWith('.png')) headers.set('Content-Type', 'image/png');
    }

    return new Response(object.body, {
      status: 200,
      headers
    });
  } catch (err) {
    return new Response(`Error al obtener archivo: ${err.message}`, { status: 500 });
  }
}
