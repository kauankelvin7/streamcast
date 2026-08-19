/**
 * Gerenciador de cache seguro e seletivo
 * Evita apagar a sessão inteira do usuário (como sessionStorage.clear()), preservando
 * chaves vitais de autenticação, estado e reload de chunks (chunk_reload).
 */

const PROTECTED_KEYS = new Set(['chunk_reload', 'auth_token', 'user_session']);

export function silentCacheCleanup(): void {
  try {
    // Remove apenas itens de cache temporário no sessionStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && !PROTECTED_KEYS.has(key) && (key.startsWith('cache_') || key.startsWith('temp_') || key.startsWith('tmdb_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (e) {
    // Silenciosamente ignorar erros de cota de armazenamento
  }
}

export default {
  silentCacheCleanup,
};
