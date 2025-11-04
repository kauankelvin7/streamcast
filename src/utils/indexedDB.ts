/**
 * IndexedDB para armazenamento de vídeos grandes (GB)
 * Suporta arquivos muito maiores que localStorage
 */

const DB_NAME = 'streamcast-videos';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

interface VideoBlob {
  id: string;
  blob: Blob;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: number;
}

/**
 * Abre conexão com IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Erro ao abrir IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Salva vídeo no IndexedDB (suporta arquivos GRANDES - GB)
 * @param onProgress Callback opcional para reportar progresso (0-100)
 */
export async function saveVideoBlob(
  id: string, 
  file: File,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  try {
    const db = await openDB();
    
    // Simula progresso durante a operação (IndexedDB não tem progresso nativo)
    let progressInterval: NodeJS.Timeout | null = null;
    let currentProgress = 0;
    
    if (onProgress) {
      // Simula progresso gradual baseado no tamanho do arquivo
      const fileSizeMB = file.size / 1024 / 1024;
      const estimatedSeconds = Math.min(30, Math.max(5, fileSizeMB / 100)); // 5-30s
      const steps = 100;
      const intervalMs = (estimatedSeconds * 1000) / steps;
      
      progressInterval = setInterval(() => {
        currentProgress = Math.min(95, currentProgress + 1);
        onProgress(currentProgress);
      }, intervalMs);
    }
    
    const videoBlob: VideoBlob = {
      id,
      blob: file,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(videoBlob);

      request.onsuccess = () => {
        if (progressInterval) clearInterval(progressInterval);
        if (onProgress) onProgress(100);
        
        console.log(`✅ Vídeo ${file.name} salvo no IndexedDB (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        resolve(true);
      };

      request.onerror = () => {
        if (progressInterval) clearInterval(progressInterval);
        console.error('Erro ao salvar vídeo:', request.error);
        reject(false);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao salvar no IndexedDB:', error);
    return false;
  }
}

/**
 * Carrega vídeo do IndexedDB e retorna Blob URL
 */
export async function loadVideoBlob(id: string): Promise<string | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result as VideoBlob | undefined;
        
        if (data && data.blob) {
          // Cria Blob URL do arquivo
          const blobUrl = URL.createObjectURL(data.blob);
          console.log(`✅ Vídeo ${data.fileName} carregado do IndexedDB`);
          resolve(blobUrl);
        } else {
          console.warn(`⚠️ Vídeo ${id} não encontrado no IndexedDB`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Erro ao carregar vídeo:', request.error);
        reject(null);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao carregar do IndexedDB:', error);
    return null;
  }
}

/**
 * Remove vídeo do IndexedDB
 */
export async function deleteVideoBlob(id: string): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`✅ Vídeo ${id} removido do IndexedDB`);
        resolve(true);
      };

      request.onerror = () => {
        console.error('Erro ao remover vídeo:', request.error);
        reject(false);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao remover do IndexedDB:', error);
    return false;
  }
}

/**
 * Lista todos os vídeos armazenados
 */
export async function listVideoBlobs(): Promise<VideoBlob[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Erro ao listar vídeos:', request.error);
        reject([]);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Erro ao listar do IndexedDB:', error);
    return [];
  }
}

/**
 * Obtém espaço usado no IndexedDB
 */
export async function getStorageUsage(): Promise<{ used: number; total: number }> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        total: estimate.quota || 0
      };
    }
  } catch (error) {
    console.error('Erro ao obter uso de armazenamento:', error);
  }
  
  return { used: 0, total: 0 };
}

/**
 * Verifica se há espaço suficiente
 */
export async function hasEnoughSpace(fileSize: number): Promise<boolean> {
  const { used, total } = await getStorageUsage();
  
  if (total === 0) return true; // Não conseguiu verificar, assume que tem espaço
  
  const available = total - used;
  return available > fileSize;
}
