/**
 * Motor de Gamificación y Rachas Cósmicas para Zodia
 * Gestiona rachas diarias (Cosmic Streaks) e Insignias de Consciencia
 */

export const COSMIC_BADGES = [
  {
    id: 'lunar_traveler',
    title: 'Viajero Lunar',
    description: 'Sintoniza con Zodia durante 3 días consecutivos.',
    icon: '🌙',
    category: 'racha',
    requirement: 3,
    color: 'from-blue-500/20 to-cyan-500/20 border-cyan-400/40 text-cyan-300'
  },
  {
    id: 'solar_flame',
    title: 'Llama Solar',
    description: 'Alcanza una racha estelar de 7 días seguidos.',
    icon: '🔥',
    category: 'racha',
    requirement: 7,
    color: 'from-amber-500/20 to-red-500/20 border-amber-400/40 text-amber-300'
  },
  {
    id: 'daily_oracle',
    title: 'Guía del Oráculo',
    description: 'Revela tu Arcano Mayor en la tirada diaria.',
    icon: '🔮',
    category: 'oraculo',
    requirement: 1,
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-400/40 text-purple-300'
  },
  {
    id: 'voice_ether',
    title: 'Voz en el Éter',
    description: 'Publica una resonancia o foto en el Muro Cósmico.',
    icon: '🪐',
    category: 'muro',
    requirement: 1,
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/40 text-emerald-300'
  },
  {
    id: 'astral_voter',
    title: 'Democracia Astral',
    description: 'Participa y vota en una encuesta cósmica de la comunidad.',
    icon: '📊',
    category: 'muro',
    requirement: 1,
    color: 'from-sky-500/20 to-indigo-500/20 border-sky-400/40 text-sky-300'
  },
  {
    id: 'cosmic_echo',
    title: 'Eco en el Éter',
    description: 'Deja al menos 3 comentarios reflexivos en publicaciones ajenas.',
    icon: '💬',
    category: 'muro',
    requirement: 3,
    color: 'from-pink-500/20 to-rose-500/20 border-pink-400/40 text-pink-300'
  },
  {
    id: 'soul_resonate',
    title: 'Resonancia de Almas',
    description: 'Envía 5 reacciones cósmicas (✨, 🔥, 💖, 🌌) en el Muro.',
    icon: '✨',
    category: 'conexion',
    requirement: 5,
    color: 'from-cyan-500/20 to-purple-500/20 border-cyan-400/40 text-cyan-300'
  },
  {
    id: 'zen_frequency',
    title: 'Frecuencia 432Hz',
    description: 'Medita sintonizando el fondo sonoro armónico de Zodia.',
    icon: '🎼',
    category: 'meditacion',
    requirement: 1,
    color: 'from-violet-500/20 to-fuchsia-500/20 border-violet-400/40 text-violet-300'
  }
];

const GAMIFICATION_STORAGE_KEY = 'zodia_gamification_v1';

/**
 * Obtiene las estadísticas y estado actual de gamificación
 */
export function getGamificationStats() {
  if (typeof window === 'undefined') {
    return {
      streak: 1,
      lastVisit: new Date().toISOString().split('T')[0],
      unlockedBadges: ['lunar_traveler'],
      actionsCount: {}
    };
  }

  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (!raw) {
      const initial = {
        streak: 1,
        lastVisit: today,
        unlockedBadges: [],
        actionsCount: {}
      };
      localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const data = JSON.parse(raw);

    // Calcular racha en base al último día de visita
    const lastDate = data.lastVisit;
    if (lastDate !== today) {
      const last = new Date(lastDate);
      const cur = new Date(today);
      const diffDays = Math.round((cur - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutivo: incrementa racha
        data.streak = (data.streak || 0) + 1;
      } else if (diffDays > 1) {
        // Rompió la racha: reinicia a 1
        data.streak = 1;
      }
      data.lastVisit = today;
      localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
    }

    // Auto-desbloquear insignias de racha
    if (data.streak >= 3 && !data.unlockedBadges.includes('lunar_traveler')) {
      data.unlockedBadges.push('lunar_traveler');
    }
    if (data.streak >= 7 && !data.unlockedBadges.includes('solar_flame')) {
      data.unlockedBadges.push('solar_flame');
    }

    return data;
  } catch (err) {
    return {
      streak: 1,
      lastVisit: new Date().toISOString().split('T')[0],
      unlockedBadges: [],
      actionsCount: {}
    };
  }
}

/**
 * Registra una acción del usuario para actualizar el conteo y desbloquear insignias
 */
export function recordGamificationAction(actionType) {
  if (typeof window === 'undefined') return null;

  try {
    const stats = getGamificationStats();
    stats.actionsCount = stats.actionsCount || {};
    stats.actionsCount[actionType] = (stats.actionsCount[actionType] || 0) + 1;
    stats.unlockedBadges = stats.unlockedBadges || [];

    const currentCount = stats.actionsCount[actionType];
    let newlyUnlocked = null;

    // Verificar reglas de desbloqueo
    if (actionType === 'daily_oracle' && !stats.unlockedBadges.includes('daily_oracle')) {
      stats.unlockedBadges.push('daily_oracle');
      newlyUnlocked = COSMIC_BADGES.find(b => b.id === 'daily_oracle');
    }
    if (actionType === 'post_created' && !stats.unlockedBadges.includes('voice_ether')) {
      stats.unlockedBadges.push('voice_ether');
      newlyUnlocked = COSMIC_BADGES.find(b => b.id === 'voice_ether');
    }
    if (actionType === 'poll_voted' && !stats.unlockedBadges.includes('astral_voter')) {
      stats.unlockedBadges.push('astral_voter');
      newlyUnlocked = COSMIC_BADGES.find(b => b.id === 'astral_voter');
    }
    if (actionType === 'comment_sent' && currentCount >= 3 && !stats.unlockedBadges.includes('cosmic_echo')) {
      stats.unlockedBadges.push('cosmic_echo');
      newlyUnlocked = COSMIC_BADGES.find(b => b.id === 'cosmic_echo');
    }
    if (actionType === 'reaction_given' && currentCount >= 5 && !stats.unlockedBadges.includes('soul_resonate')) {
      stats.unlockedBadges.push('soul_resonate');
      newlyUnlocked = COSMIC_BADGES.find(b => b.id === 'soul_resonate');
    }
    if (actionType === 'zen_432hz' && !stats.unlockedBadges.includes('zen_frequency')) {
      stats.unlockedBadges.push('zen_frequency');
      newlyUnlocked = COSMIC_BADGES.find(b => b.id === 'zen_frequency');
    }

    localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(stats));

    if (newlyUnlocked) {
      window.dispatchEvent(new CustomEvent('zodia-badge-unlocked', { detail: newlyUnlocked }));
    }

    return { stats, newlyUnlocked };
  } catch (err) {
    console.warn('Error en gamification action:', err);
    return null;
  }
}
