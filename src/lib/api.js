/**
 * Helper para asegurar que todas las llamadas de API respeten el basePath (/zodia)
 */
export function getApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('/zodia/')) return endpoint;
  if (endpoint.startsWith('/api/')) return `/zodia${endpoint}`;
  if (endpoint.startsWith('api/')) return `/zodia/${endpoint}`;
  return endpoint;
}

export function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});

  // Adjuntar sesión activa como encabezado para asegurar autenticación en móviles/PWAs donde las cookies son bloqueadas
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('zodia_session');
      if (stored && !headers.has('x-zodia-user')) {
        headers.set('x-zodia-user', encodeURIComponent(stored));
      }
    } catch {}
  }

  return fetch(getApiUrl(endpoint), {
    ...options,
    credentials: options.credentials || 'include',
    headers
  });
}
