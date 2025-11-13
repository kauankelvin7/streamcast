/**
 * Storage API - Implementação simples e síncrona usando localStorage.
 */
class StorageAPI {
  /**
   * Obtém um item do armazenamento.
   * Retorna o valor como string ou null se não encontrado.
   */
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Storage.get error:', error);
      return null;
    }
  }

  /**
   * Salva um item no armazenamento.
   */
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage.set error:', error);
      // Opcional: relançar o erro se a aplicação precisar saber que a escrita falhou.
    }
  }

  /**
   * Remove um item do armazenamento.
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage.remove error:', error);
    }
  }

  /**
   * Limpa todo o armazenamento (todos os itens).
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage.clear error:', error);
    }
  }
}

// Expor a API globalmente
declare global {
  interface Window {
    storage: StorageAPI;
  }
}

window.storage = new StorageAPI();

export default window.storage;
