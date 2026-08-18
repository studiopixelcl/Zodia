import { NextResponse } from 'next/server';
import { getToken }     from 'next-auth/jwt';
import { calculateMoonPhase, getDailyTarotCard, calculateAstralProfile } from '../../../lib/astrology';

export const runtime = 'edge';

async function getDB() {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    return getRequestContext().env?.DB ?? null;
  } catch {
    return null;
  }
}

function resolveUserId(token) {
  return token?.id ?? token?.sub ?? token?.email ?? null;
}

/**
 * Endpoint: GET /api/oraculo
 * Propósito: Devuelve la transmisión personalizada del Oráculo Lunar y la Carta del Día para el usuario.
 */
export async function GET(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = await getDB();
  const userId = resolveUserId(token);
  const todayStr = new Date().toISOString().split('T')[0];
  const userName = token.name || 'Sintonizador';
  const userDob = token.dob || '1998-07-15';

  let profile = null;
  if (db) {
    try {
      profile = await db.prepare(
        "SELECT * FROM astral_profiles WHERE user_id = ?"
      ).bind(userId).first();
    } catch (err) {
      console.error("Error al leer perfil en /api/oraculo:", err);
    }
  }

  // Fallback astronómico preciso si no proviene de DB
  let userAstral;
  if (profile) {
    userAstral = {
      sign: profile.sign,
      element: profile.element,
      lifePath: profile.life_path_number,
      archetype: profile.archetype
    };
  } else {
    try {
      const calculated = calculateAstralProfile(userDob);
      userAstral = {
        sign: calculated.sign,
        element: calculated.element,
        lifePath: calculated.lifePath,
        archetype: calculated.archetype
      };
    } catch {
      userAstral = {
        sign: "Capricornio",
        element: "Tierra",
        lifePath: 9,
        archetype: "El Ermitaño"
      };
    }
  }

  const moonPhase = calculateMoonPhase(new Date());
  const tarotCard = getDailyTarotCard(userId, todayStr);

  const transmission = `${userName}, bajo la influencia de la ${moonPhase.name} (${moonPhase.illumination}% iluminada), la energía de ${userAstral.element} que rige a ${userAstral.sign} entra en resonancia profunda con tu Camino de Vida ${userAstral.lifePath} (${userAstral.archetype}). La carta '${tarotCard.name}' revela la clave para tu evolución de hoy.`;

  return NextResponse.json({
    date: todayStr,
    userName,
    moonPhase,
    tarotCard,
    transmission,
    profile: userAstral
  });
}
