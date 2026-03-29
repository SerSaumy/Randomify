/**
 * Import baked build-time session into extension storage once (no overwrite).
 * @param {object} deps
 * @param {() => Promise<object>} deps.loadStorage
 * @param {(p: object) => Promise<void>} deps.saveStorage
 * @param {object} deps.STORAGE_KEYS
 * @param {object} [deps.globalObj]
 */
export async function maybeBootstrapSession(deps) {
  const {
    loadStorage,
    saveStorage,
    STORAGE_KEYS,
    globalObj = globalThis,
  } = deps;

  if (typeof globalObj.__RANDOMIFY_SESSION__ !== 'undefined') {
    const s = globalObj.__RANDOMIFY_SESSION__;
    delete globalObj.__RANDOMIFY_SESSION__;
    const existing = await loadStorage();
    if (!existing[STORAGE_KEYS.refreshToken]) {
      await saveStorage({
        [STORAGE_KEYS.clientId]: s.client_id,
        [STORAGE_KEYS.accessToken]: s.access_token,
        [STORAGE_KEYS.refreshToken]: s.refresh_token,
        [STORAGE_KEYS.expiresAt]: s.expires_at || 0,
      });
    }
  }
}
