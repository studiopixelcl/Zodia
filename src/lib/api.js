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

export function apiFetch(endpoint, options) {
  return fetch(getApiUrl(endpoint), options);
}
