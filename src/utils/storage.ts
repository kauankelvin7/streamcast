import { saveToFirebase, loadFromFirebase, isFirebaseEnabled } from '../api/firebase';
import type { StreamcastData } from '../api/firebase';

export const STORAGE_KEYS = {
  CONFIG: 'streamcast-config',
  PLAYLIST: 'streamcast-playlist',
  SCHEDULES: 'streamcast-schedules'
} as const;

export async function loadData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    if (typeof window !== 'undefined' && (window as any).storage?.get) {
      const result = await (window as any).storage.get(key, true);
      if (result) {
        const parsed = typeof result === 'string' ? JSON.parse(result) : 
                      (result.value ? JSON.parse(result.value) : result);
        console.log('📦 Carregado de window.storage:', key, parsed);
        return parsed || defaultValue;
      }
    }
  } catch (e) {
    console.warn('window.storage falhou, usando localStorage', e);
  }

  try {
    const item = localStorage.getItem(key);
    const parsed = item ? JSON.parse(item) : defaultValue;
    console.log('💾 Carregado de localStorage:', key, parsed);
    return parsed;
  } catch (e) {
    console.log('⚠️ Usando valor padrão:', key, defaultValue);
    return defaultValue;
  }
}

export async function saveData<T>(key: string, value: T): Promise<boolean> {
  try {
    const json = JSON.stringify(value);
    
    if (typeof window !== 'undefined' && (window as any).storage?.set) {
      await (window as any).storage.set(key, json, true);
    }
    
    localStorage.setItem(key, json);
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
 * Salva todos os dados (config, playlist, schedules) localmente E no Firebase
 */
export async function saveAllData(config: any, playlist: any[], schedules: any[]): Promise<boolean> {
  try {
    // Salvar localmente
    await saveData(STORAGE_KEYS.CONFIG, config);
    await saveData(STORAGE_KEYS.PLAYLIST, playlist);
    await saveData(STORAGE_KEYS.SCHEDULES, schedules);
    
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
 * Carrega todos os dados do Firebase (se disponível) ou localStorage
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
        
        // Salva localmente também (cache)
        await saveData(STORAGE_KEYS.CONFIG, firebaseData.config);
        await saveData(STORAGE_KEYS.PLAYLIST, firebaseData.playlist);
        await saveData(STORAGE_KEYS.SCHEDULES, firebaseData.schedules);
        
        return {
          config: firebaseData.config,
          playlist: firebaseData.playlist,
          schedules: firebaseData.schedules
        };
      }
    }
    
    // Fallback: carrega do localStorage
    console.log('📦 Carregando do localStorage (fallback)');
    return null;
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    return null;
  }
}
