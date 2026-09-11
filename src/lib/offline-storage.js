/**
 * Gestor de Caché y Persistencia Astral Offline para Zodia
 * Permite consultar Carta Astral, Tránsitos y lecturas sin conexión a internet.
 */

const OFFLINE_PROFILE_KEY = 'zodia_offline_astral_profile';
const OFFLINE_FAVORITES_KEY = 'zodia_offline_favorites';

export function saveOfflineAstralData(profile) {
  if (typeof window === 'undefined' || !profile) return;
  try {
    localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify({
      profile,
      cachedAt: new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Error guardando carta astral offline:', err);
  }
}

export function getOfflineAstralData() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(OFFLINE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isDeviceOnline() {
  if (typeof window === 'undefined') return true;
  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}
