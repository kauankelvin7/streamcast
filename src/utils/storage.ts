import { saveToFirebase, loadFromFirebase, isFirebaseEnabled } from '../api/firebase';
import type { StreamcastData } from '../api/firebase';

export const STORAGE_KEYS = {
  CONFIG: 'streamcast-config',
  PLAYLIST: 'streamcast-playlist',
  SCHEDULES: 'streamcast-schedules'
} as const;

/**
 * Carrega um dado do localStorage de forma síncrona.
 */
export function loadData<T>(key: string, defaultValue: T): T {
  try {
    const item = window.storage.get(key);
    if (item === null) {
      return defaultValue;
    }
    
    const parsed = JSON.parse(item);

    // Garantir que playerMode existe no objeto de configuração
    if (key === STORAGE_KEYS.CONFIG && parsed && !parsed.playerMode) {
      parsed.playerMode = 'vidsrc'; // Valor padrão
    }
    
    return parsed;
  } catch (e) {
    console.error(`Erro ao carregar e parsear dados para a chave "${key}":`, e);
    return defaultValue;
  }
}

/**
 * Salva um dado no localStorage de forma síncrona.
 */
export function saveData<T>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    window.storage.set(key, json);
    console.log('💾 Dados salvos localmente:', key);
    
    // Disparar evento customizado para notificar outras abas/frames
    window.dispatchEvent(new CustomEvent('streamcast-data-changed', { 
      detail: { key, value } 
    }));
    
    return true;
  } catch (e) {
    console.error('Erro ao salvar:', e);
    return false;
  }
}

/**
 * Salva todos os dados (config, playlist, schedules) localmente E no Firebase.
 * A parte local é síncrona, a parte do Firebase é assíncrona.
 */
export async function saveAllData(config: any, playlist: any[], schedules: any[]): Promise<boolean> {
  try {
    // Salvar localmente (síncrono)
    saveData(STORAGE_KEYS.CONFIG, config);
    saveData(STORAGE_KEYS.PLAYLIST, playlist);
    saveData(STORAGE_KEYS.SCHEDULES, schedules);
    
    // Salvar no Firebase (se configurado)
    if (isFirebaseEnabled()) {
      const firebaseData: StreamcastData = {
        config,
        playlist,
        schedules,
        lastUpdate: Date.now()
      };
      
      const firebaseSaved = await saveToFirebase(firebaseData);
      
      if (firebaseSaved) {
        console.log('☁️ Dados sincronizados com Firebase (cross-origin disponível)');
      } else {
        console.log('📦 Dados salvos apenas localmente (Firebase não disponível)');
      }
    } else {
      console.log('📦 Dados salvos apenas localmente (Firebase não configurado)');
    }
    
    return true;
  } catch (e) {
    console.error('Erro ao salvar dados:', e);
    return false;
  }
}

/**
 * Carrega todos os dados do Firebase (se disponível) ou retorna null para fallback para o localStorage.
 */
export async function loadAllDataWithFirebase(): Promise<{
  config: any;
  playlist: any[];
  schedules: any[];
} | null> {
  try {
    // Tenta carregar do Firebase primeiro
    if (isFirebaseEnabled()) {
      const firebaseData = await loadFromFirebase();
      
      if (firebaseData) {
        console.log('☁️ Dados carregados do Firebase');
        
        // Salva localmente também (cache síncrono)
        saveData(STORAGE_KEYS.CONFIG, firebaseData.config);
        saveData(STORAGE_KEYS.PLAYLIST, firebaseData.playlist);
        saveData(STORAGE_KEYS.SCHEDULES, firebaseData.schedules);
        
        return {
          config: firebaseData.config,
          playlist: firebaseData.playlist,
          schedules: firebaseData.schedules
        };
      }
    }
    
    // Fallback: se o Firebase não estiver habilitado ou não tiver dados
    console.log('📦 Firebase não disponível ou sem dados, usando localStorage.');
    return null;
  } catch (e) {
    console.error('Erro ao carregar dados do Firebase:', e);
    return null; // Em caso de erro, fallback para localStorage
  }
}
