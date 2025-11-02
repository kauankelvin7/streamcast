/**
 * Storage API - Implementação simples usando localStorage
 * Substitui a API window.storage customizada
 */

interface StorageItem {
  value: string;
  persistent: boolean;
  timestamp: number;
}

class StorageAPI {
  /**
   * Obtém um item do armazenamento
   */
  async get(key: string, persistent: boolean = true): Promise<StorageItem | null> {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      return {
        value: item,
        persistent,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Storage.get error:', error);
      return null;
    }
  }

  /**
   * Salva um item no armazenamento
   */
  async set(key: string, value: string, persistent: boolean = true): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage.set error:', error);
      throw error;
    }
  }

  /**
   * Remove um item do armazenamento
   */
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage.remove error:', error);
      throw error;
    }
  }

  /**
   * Limpa todo o armazenamento
   */
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage.clear error:', error);
      throw error;
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
