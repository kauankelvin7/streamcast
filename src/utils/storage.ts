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
    return true;
  } catch (e) {
    console.error('Erro ao salvar:', e);
    return false;
  }
}
