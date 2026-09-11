/**
 * Motor de Audio Procedural Web Audio API para Zodia
 * Genera micro-interacciones sensoriales cósmicas en tiempo real
 * (Sin dependencias externas ni archivos pesados, latencia cero en móviles y desktop).
 */

let audioCtx = null;

function getAudioContext() {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    return null;
  }
}

function createNoiseBuffer(ctx, duration = 0.2) {
  const sampleRate = ctx.sampleRate || 44100;
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem('zodia_sound_enabled');
  return stored === null ? true : stored === 'true';
}

export function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('zodia_sound_enabled', String(enabled));
  window.dispatchEvent(new Event('zodia-sound-toggle'));
}

/**
 * 1. Sonido de LIKE (Arpa pentatónica ascendente cristalina)
 */
export function playSwipeLikeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Do mayor brillante)
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    gain.gain.setValueAtTime(0.001, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.3);
  });
}

/**
 * 2. Sonido de PASAR (Susurro suave de viento descendente)
 */
export function playSwipePassSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.23);
}

/**
 * 3. Sonido de SUPERLIKE (Arpegio estelar con brillo Shimmer)
 */
export function playSuperlikeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A mayor brillante
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.001, now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.22, now + idx * 0.04 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.42);
  });
}

/**
 * 4. Sonido de MATCH CÓSMICO (Fanfarria orquestal en 528Hz con acorde de 9na mayor)
 */
export function playMatchCelebrationSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Acorde místico Solfeggio 528 Hz (transformación y amor cósmico)
  const freqs = [264, 330, 396, 528, 660, 792, 1056];
  const now = ctx.currentTime;

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.001, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.25 / Math.sqrt(freqs.length), now + idx * 0.06 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 1.25);
  });
}

/**
 * 5. Sonido de MENSAJE ENVIADO (Gota estelar armónica)
 */
export function playMessageSentSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

/**
 * 6. Sonido de MENSAJE ENTRANTE / NOTIFICACIÓN (Campana dual)
 */
export function playIncomingChimeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [880, 1174.66]; // La5, Re6
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.09);

    gain.gain.setValueAtTime(0.001, now + idx * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.09);
    osc.stop(now + idx * 0.09 + 0.38);
  });
}

/**
 * 7. Sonido de ATAQUE FÍSICO / CORTE DE ESPADA (Chronicles of the Zodia)
 * Simula el deslizamiento veloz del aire (filtro paso banda descendente) y el filo del arma.
 */
export function playBattleSlashSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Ruido de viento / corte aerodinámico
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.16);
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.Q.setValueAtTime(3.5, now);
  bandpass.frequency.setValueAtTime(3800, now);
  bandpass.frequency.exponentialRampToValueAtTime(700, now + 0.14);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.001, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.16);

  // Tono metálico de la hoja
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(680, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
  oscGain.gain.setValueAtTime(0.09, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.11);
}
export const playBattleAttackSound = playBattleSlashSound;

/**
 * 8. Sonido de IMPACTO CONTUNDENTE / GOLPE NORMAL
 * Golpe seco con caída de graves (sub-bass transient) y crujido de armadura.
 */
export function playBattleHeavyHitSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Sub-bass thump
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(170, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

  gain.gain.setValueAtTime(0.24, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.17);

  // Impact crunch (ruido filtrado)
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(550, now);

  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.15, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.1);
}
export const playBattleHitSound = playBattleHeavyHitSound;

/**
 * 9. Sonido de GOLPE CRÍTICO (Explosión estelar resonante y cristal supersónico)
 * Dopamina auditiva pura: sub-drop profundo + destello de campanas astrales.
 */
export function playBattleCritStrikeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // 1. Sub-drop demoledor
  const sub = ctx.createOscillator();
  const subGain = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(210, now);
  sub.frequency.exponentialRampToValueAtTime(32, now + 0.32);
  subGain.gain.setValueAtTime(0.3, now);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

  sub.connect(subGain);
  subGain.connect(ctx.destination);
  sub.start(now);
  sub.stop(now + 0.35);

  // 2. Destello de cristal estelar brillante
  [2093, 3136, 4186].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.02);

    gain.gain.setValueAtTime(0.001, now + idx * 0.02);
    gain.gain.exponentialRampToValueAtTime(0.18 / (idx + 1), now + idx * 0.02 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.02 + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.02);
    osc.stop(now + idx * 0.02 + 0.4);
  });
}
export const playBattleCritSound = playBattleCritStrikeSound;

/**
 * 10. Sonido de ESCUDO / BLOQUEO METÁLICO
 * Clang resonante de barrera defensiva con armónicos metálicos.
 */
export function playBattleShieldClangSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Clang armónico metálico
  [840, 1260, 1920].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = idx === 0 ? 'triangle' : 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12 / (idx + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  });

  // Zumbido de campo de fuerza
  const hum = ctx.createOscillator();
  const humGain = ctx.createGain();
  hum.type = 'sine';
  hum.frequency.setValueAtTime(160, now);
  humGain.gain.setValueAtTime(0.16, now);
  humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  hum.connect(humGain);
  humGain.connect(ctx.destination);
  hum.start(now);
  hum.stop(now + 0.27);
}
export const playBattleShieldSound = playBattleShieldClangSound;

/**
 * 11. Sonido de HABILIDAD ELEMENTAL (Fuego, Agua, Tierra, Aire)
 */
export function playElementalSkillSound(element = 'Fuego') {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const normalized = (element || '').toLowerCase();

  if (normalized.includes('fuego')) {
    // Fuego: estallido de llamas con crujido y barrido ascendente
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.35);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.5, now);
    filter.frequency.setValueAtTime(350, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.34);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.24, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.36);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.2);
    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);

  } else if (normalized.includes('agua')) {
    // Agua: oleaje profundo con campanas cristalinas de hielo
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.35);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);

    [659.25, 987.77, 1318.51].forEach((f, idx) => {
      const drop = ctx.createOscillator();
      const dropGain = ctx.createGain();
      drop.type = 'sine';
      drop.frequency.setValueAtTime(f, now + idx * 0.06);
      dropGain.gain.setValueAtTime(0.001, now + idx * 0.06);
      dropGain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.06 + 0.02);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.3);
      drop.connect(dropGain);
      dropGain.connect(ctx.destination);
      drop.start(now + idx * 0.06);
      drop.stop(now + idx * 0.06 + 0.32);
    });

  } else if (normalized.includes('tierra')) {
    // Tierra: terremoto sub-bass y fractura de roca
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.18, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.2);

  } else {
    // Aire / Éter / Rayo: ráfaga cortante y silbido aerodinámico de alta velocidad
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.0, now);
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(3600, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(900, now + 0.28);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.29);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.3);
  }
}

/**
 * 12. Sonido de ASISTENCIA DE SINASTRÍA / ATAQUE COMBINADO
 * Acorde celestial etéreo que resuena cuando tu alma gemela entra a combatir.
 */
export function playSinastryAssistSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const freqs = [440, 554.37, 659.25, 880, 1108.73]; // La mayor 9ª celestial
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.04);

    gain.gain.setValueAtTime(0.001, now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.04 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.5);
  });
}

/**
 * 13. Sonido de CURACIÓN / REGENERACIÓN ASTRAL
 */
export function playBattleHealSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0.001, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.06 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.38);
  });
}

/**
 * 14. Sonido de GOLPE DE MARTILLO EN EL YUNQUE (Forja Cósmica)
 * Impacto de acero templado con destello y resonancia cristalina de bronce.
 */
export function playForgeAnvilStrikeSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Impacto agudo de acero
  [1950, 3200].forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(f, now);

    gain.gain.setValueAtTime(0.14 / (idx + 1), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  });

  // Resonancia metálica prolongada del yunque
  const ring = ctx.createOscillator();
  const ringGain = ctx.createGain();
  ring.type = 'triangle';
  ring.frequency.setValueAtTime(920, now);
  ringGain.gain.setValueAtTime(0.12, now);
  ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  ring.connect(ringGain);
  ringGain.connect(ctx.destination);
  ring.start(now);
  ring.stop(now + 0.38);
}

/**
 * 15. Sonido de FORJA EXITOSA (+1 a +10)
 * Martilleo + fanfarria ascendente dorada.
 */
export function playForgeSuccessSound() {
  playForgeAnvilStrikeSound();
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + 0.08;

  const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // Do mayor glorioso
  fanfare.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + idx * 0.05);

    gain.gain.setValueAtTime(0.001, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.05 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.45);
  });
}

/**
 * 16. Sonido de FALLO EN LA FORJA
 * Clonk seco con escape de vapor.
 */
export function playForgeFailSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.2);
  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);

  // Ruido de vapor
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 0.25);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.25);
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.12, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  noise.connect(filter);
  filter.connect(nGain);
  nGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.26);
}

/**
 * 17. Sonido de ENGARCE DE GEMA ASTRAL
 * Resonancia pura y cristalina.
 */
export function playGemSocketSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [1760, 2640].forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + idx * 0.04);
    gain.gain.setValueAtTime(0.001, now + idx * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.04 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.04);
    osc.stop(now + idx * 0.04 + 0.5);
  });
}

/**
 * 18. Sonido de RECLAMO DIARIO / LLUVIA DE MONEDAS
 * Cascada de tintineos de polvo estelar y monedas.
 */
export function playDailyClaimSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const coins = [1760, 1975, 2093, 2349, 2793];
  coins.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + idx * 0.045);
    gain.gain.setValueAtTime(0.001, now + idx * 0.045);
    gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.045 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.045);
    osc.stop(now + idx * 0.045 + 0.25);
  });
}

/**
 * 19. Sonido de TURNO LISTO PARA EL JUGADOR
 * Notificación sutil y agradable para capturar la atención en combate.
 */
export function playTurnReadySound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  [1046.50, 1567.98].forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + idx * 0.06);
    gain.gain.setValueAtTime(0.001, now + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.07, now + idx * 0.06 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.28);
  });
}

/**
 * 20. Sonido de VICTORIA ASTRAL
 */
export function playBattleVictorySound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const chords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.001, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.65);
  });
}

/**
 * 21. Sonido de DERROTA / RETIRADA
 */
export function playBattleDefeatSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const freqs = [320, 260, 210, 150];
  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0.12, now + idx * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 0.35);
  });
}

/**
 * 22. Sonido de APERTURA DE COFRE DE LOOT
 */
export function playLootChestSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

    gain.gain.setValueAtTime(0.001, now + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.05 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.05);
    osc.stop(now + idx * 0.05 + 0.45);
  });
}
export const playChestOpenSound = playLootChestSound;

/**
 * ── RESPUESTA HÁPTICA (Vibración sutil para dispositivos móviles) ──
 */
export function triggerHaptic(type = 'light') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'light') {
      navigator.vibrate(15);
    } else if (type === 'medium') {
      navigator.vibrate(28);
    } else if (type === 'success') {
      navigator.vibrate([18, 40, 22]);
    } else if (type === 'celebration') {
      navigator.vibrate([30, 25, 40, 30, 60]);
    }
  } catch {}
}

/**
 * ── MODO FRECUENCIA CÓSMICA 432Hz (Sintetizador Binaural de Meditación) ──
 */
let droneState = {
  isPlaying: false,
  gainNode: null,
  oscillators: []
};

export function is432HzDronePlaying() {
  return droneState.isPlaying;
}

export function start432HzDrone() {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (droneState.isPlaying) return true;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.07, now + 2.0); // Entrada suave en 2s

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(1.5, now);

    // Oscilador 1: Fundamental 432Hz (Tono de afinación pitagórica universal)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(432.0, now);

    // Oscilador 2: 432.5Hz (Latido binaural alfa de 0.5Hz para relajación)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(432.5, now);

    // Oscilador 3: Subarmónico cálido 216Hz (Una octava abajo)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(216.0, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.03, now);
    oscSub.connect(subGain);
    subGain.connect(filter);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    oscSub.start(now);

    droneState = {
      isPlaying: true,
      gainNode: masterGain,
      oscillators: [osc1, osc2, oscSub]
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zodia-drone-change', { detail: { isPlaying: true } }));
    }
    return true;
  } catch (err) {
    console.warn('Error iniciando drone 432Hz:', err);
    return false;
  }
}

export function stop432HzDrone() {
  if (!droneState.isPlaying || !droneState.gainNode) return false;

  try {
    const ctx = getAudioContext();
    if (ctx) {
      const now = ctx.currentTime;
      droneState.gainNode.gain.setValueAtTime(droneState.gainNode.gain.value, now);
      droneState.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2); // Desvanecimiento suave en 1.2s

      setTimeout(() => {
        droneState.oscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch {}
        });
        droneState.gainNode = null;
        droneState.oscillators = [];
        droneState.isPlaying = false;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('zodia-drone-change', { detail: { isPlaying: false } }));
        }
      }, 1300);
    } else {
      droneState.isPlaying = false;
    }
    return false;
  } catch (err) {
    droneState.isPlaying = false;
    return false;
  }
}

export function toggle432HzDrone() {
  if (droneState.isPlaying) {
    stop432HzDrone();
    return false;
  } else {
    return start432HzDrone();
  }
}

