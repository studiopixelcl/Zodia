import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId } from '../../../lib/auth-edge';

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
 * POST /api/upload
 * Sube una imagen o video optimizado a Cloudflare R2 con fallback local
 */
export async function POST(request) {
  try {
    const token = await getAuthUser(request);
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = resolveUserId(token);
    const safeUserId = (userId || 'anon').replace(/[^a-zA-Z0-9_-]/g, '_');
    const formData = await request.formData();
    const file = formData.get('file');
    const mediaType = formData.get('type') || 'photo'; // 'photo' | 'video' | 'audio'

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No se recibió ningún archivo válido.' }, { status: 400 });
    }

    const contentType = file.type || (mediaType === 'video' ? 'video/webm' : (mediaType === 'audio' ? 'audio/webm' : 'image/webp'));
    let ext = 'webp';
    let folder = 'photos';

    if (mediaType === 'video' || contentType.startsWith('video/')) {
      folder = 'videos';
      ext = contentType.includes('mp4') ? 'mp4' : 'webm';
    } else if (mediaType === 'audio' || contentType.startsWith('audio/')) {
      folder = 'audio';
      ext = contentType.includes('mp4') || contentType.includes('m4a') ? 'm4a' : (contentType.includes('ogg') ? 'ogg' : 'webm');
    } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      ext = 'jpg';
    } else if (contentType.includes('png')) {
      ext = 'png';
    }

    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const fileKey = `${folder}/${safeUserId}/${Date.now()}_${randomSuffix}.${ext}`;

    const bucket = await getR2Bucket();
    const fileBuffer = await file.arrayBuffer();

    if (bucket) {
      try {
        await bucket.put(fileKey, fileBuffer, {
          httpMetadata: {
            contentType,
            cacheControl: 'public, max-age=31536000, immutable'
          },
          customMetadata: {
            uploadedBy: safeUserId,
            mediaType,
            uploadedAt: new Date().toISOString()
          }
        });

        const publicUrl = `/zodia/api/media/${fileKey}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          key: fileKey,
          storage: 'r2',
          size: file.size,
          type: contentType
        });
      } catch (r2Err) {
        console.warn('[Upload R2 Error] Fallback to base64:', r2Err.message);
      }
    }

    // Fallback para desarrollo local si R2 no está vinculado localmente
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const fallbackUrl = `data:${contentType};base64,${base64String}`;

    return NextResponse.json({
      success: true,
      url: fallbackUrl,
      key: fileKey,
      storage: 'fallback_data_url',
      size: file.size,
      type: contentType
    });
  } catch (err) {
    console.error('[POST /api/upload] Error:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar el archivo.' }, { status: 500 });
  }
}
