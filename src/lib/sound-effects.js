/**
 * Motor de Audio Procedural Web Audio API para Zodia
 * Genera micro-interacciones sensoriales cósmicas en tiempo real
 * (Sin dependencias externas ni archivos pesados, latencia cero en móviles y desktop).
 */

let audioCtx = null;

function getAudioContext() {
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
