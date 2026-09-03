/**
 * Store en memoria global para pruebas de desarrollo local (cuando Cloudflare D1 no está vinculado localmente)
 */
const globalForDev = globalThis;

if (!globalForDev.zodiaDevStore) {
  globalForDev.zodiaDevStore = {
    messages: [],
    interactions: [],
    resonances: [],
    notifications: [],
    users: new Map()
  };
}

export const devStore = globalForDev.zodiaDevStore;
