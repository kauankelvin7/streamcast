import { describe, it, expect, beforeEach } from 'vitest';
import { silentCacheCleanup } from './cacheManager';

describe('cacheManager', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('deve remover apenas chaves temporárias e preservar chaves essenciais', () => {
    sessionStorage.setItem('cache_item_1', 'abc');
    sessionStorage.setItem('temp_data', '123');
    sessionStorage.setItem('tmdb_movies', '[]');
    sessionStorage.setItem('chunk_reload', 'true');
    sessionStorage.setItem('auth_token', 'jwt-token-xyz');

    silentCacheCleanup();

    expect(sessionStorage.getItem('cache_item_1')).toBeNull();
    expect(sessionStorage.getItem('temp_data')).toBeNull();
    expect(sessionStorage.getItem('tmdb_movies')).toBeNull();
    expect(sessionStorage.getItem('chunk_reload')).toBe('true');
    expect(sessionStorage.getItem('auth_token')).toBe('jwt-token-xyz');
  });
});
