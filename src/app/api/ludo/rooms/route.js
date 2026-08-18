import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Almacenamiento en memoria para Salas Multiplayer de Ludo Astral
const roomsStore = new Map();

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, roomCode, player } = body;

    if (action === 'create') {
      const newCode = 'ZOD-' + Math.floor(1000 + Math.random() * 9000);
      const newRoom = {
        code: newCode,
        createdAt: Date.now(),
        host: player || { name: 'Viajero Astral', sign: 'Leo', element: 'Fuego' },
        players: [player || { name: 'Viajero Astral', sign: 'Leo', element: 'Fuego' }],
        status: 'waiting', // 'waiting', 'playing'
        mode: body.mode || 'duelo', // 'duelo' o 'clasico'
      };
      roomsStore.set(newCode, newRoom);

      const shareText = `🌌 ¡Te desafío a una partida de Ludo Astral en Zodia! 🎲\n\nÚnete a mi sala cósmica con el código: *${newCode}*\nEntra a jugar desde aquí: https://zodia.app/dashboard?game=ludo&room=${newCode}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

      return NextResponse.json({
        success: true,
        roomCode: newCode,
        shareText,
        whatsappUrl,
        room: newRoom,
      });
    }

    if (action === 'join') {
      if (!roomCode || !roomsStore.has(roomCode)) {
        return NextResponse.json({ success: false, error: 'La sala cósmica no existe o ha expirado.' }, { status: 444 });
      }

      const room = roomsStore.get(roomCode);
      if (room.players.length >= 4) {
        return NextResponse.json({ success: false, error: 'La sala ya está llena.' }, { status: 400 });
      }

      room.players.push(player || { name: 'Invitado Astral', sign: 'Escorpio', element: 'Agua' });
      roomsStore.set(roomCode, room);

      return NextResponse.json({
        success: true,
        roomCode,
        room,
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get('roomCode');

  if (!roomCode) {
    return NextResponse.json({ success: false, error: 'Falta código de sala' }, { status: 400 });
  }

  const room = roomsStore.get(roomCode);
  if (!room) {
    return NextResponse.json({ success: false, error: 'Sala no encontrada' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
