import { NextResponse } from 'next/server';
import { getAuthUser, resolveUserId, resolveCanonicalUserId } from '../../../lib/auth-edge';
import { DATING_CANDIDATES } from '../../../lib/dating';
import { ensureDatabaseSchema } from '../../../lib/db-init';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

// Estado en memoria de sesiones de citas a ciegas activas
const activeBlindSessions = new Map();

export async function GET(request) {
  const token = await getAuthUser(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rawId = resolveUserId(token);
  let session = activeBlindSessions.get(rawId);

  if (!session) {
    // Escoger un candidato afín para la cita a ciegas
    const partnerCandidate = DATING_CANDIDATES[Math.floor(Math.random() * Math.min(3, DATING_CANDIDATES.length))] || DATING_CANDIDATES[0];
    
    session = {
      id: 'blind_' + Date.now(),
      userId: rawId,
      partner: {
        id: partnerCandidate.id,
        name: partnerCandidate.name.split(' ')[0], // Solo el primer nombre durante la cita a ciegas
        fullName: partnerCandidate.name,
        sign: partnerCandidate.sign,
        element: partnerCandidate.element,
        age: partnerCandidate.age,
        affinity: '96%',
        bio: partnerCandidate.bio,
        interests: partnerCandidate.interests,
        image: partnerCandidate.image
      },
      durationSeconds: 300,
      userRevealed: false,
      partnerRevealed: false,
      isFullyRevealed: false,
      createdAt: Date.now()
    };
    activeBlindSessions.set(rawId, session);
  }

  return NextResponse.json({ session });
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
  const rawId = resolveUserId(token);
  let session = activeBlindSessions.get(rawId);

  if (action === 'start_new') {
    const partnerCandidate = DATING_CANDIDATES[Math.floor(Math.random() * DATING_CANDIDATES.length)];
    session = {
      id: 'blind_' + Date.now(),
      userId: rawId,
      partner: {
        id: partnerCandidate.id,
        name: partnerCandidate.name.split(' ')[0],
        fullName: partnerCandidate.name,
        sign: partnerCandidate.sign,
        element: partnerCandidate.element,
        age: partnerCandidate.age,
        affinity: '95%',
        bio: partnerCandidate.bio,
        interests: partnerCandidate.interests,
        image: partnerCandidate.image
      },
      durationSeconds: 300,
      userRevealed: false,
      partnerRevealed: false,
      isFullyRevealed: false,
      createdAt: Date.now()
    };
    activeBlindSessions.set(rawId, session);
    return NextResponse.json({ session });
  }

  if (action === 'reveal') {
    if (!session) {
      return NextResponse.json({ error: "No hay sesión activa" }, { status: 400 });
    }

    session.userRevealed = true;

    // En candidatos simulados o sintonizadores, si el usuario decide revelar,
    // tras una breve pausa mutua de conexión cósmica, la contraparte también acepta
    session.partnerRevealed = true;
    session.isFullyRevealed = true;

    activeBlindSessions.set(rawId, session);
    return NextResponse.json({ 
      success: true, 
      session,
      isFullyRevealed: true 
    });
  }

  if (action === 'leave') {
    activeBlindSessions.delete(rawId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
