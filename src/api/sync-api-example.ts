/**
 * API Simples de Sincronização - Para uso Cross-Origin
 * 
 * Este é um exemplo de como você poderia implementar sincronização
 * entre diferentes domínios usando uma API backend.
 * 
 * IMPORTANTE: Este é apenas um EXEMPLO. Para produção, use:
 * - Firebase Realtime Database
 * - Supabase
 * - MongoDB Atlas
 * - Ou qualquer backend de sua preferência
 */

// Configuração
const API_BASE_URL = 'https://sua-api.com'; // Substitua pela sua API

// Tipos
export interface SyncData {
  config: any;
  playlist: any[];
  schedules: any[];
  lastUpdate: number;
}

/**
 * Salva dados na API (usado pelo Admin)
 */
export async function syncToAPI(data: SyncData): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/streamcast/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        lastUpdate: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    console.log('✅ Dados sincronizados com a API');
    return true;
  } catch (error) {
    console.error('❌ Erro ao sincronizar com API:', error);
    return false;
  }
}

/**
 * Carrega dados da API (usado pelo Embed)
 */
export async function loadFromAPI(): Promise<SyncData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/streamcast/sync`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📥 Dados carregados da API');
    return data;
  } catch (error) {
    console.error('❌ Erro ao carregar da API:', error);
    return null;
  }
}

/**
 * Escuta mudanças em tempo real (polling simples)
 * Para tempo real verdadeiro, use WebSocket ou Firebase
 */
export function listenToAPIChanges(
  callback: (data: SyncData) => void,
  interval: number = 5000
): () => void {
  let lastUpdate = 0;
  
  const checkForUpdates = async () => {
    const data = await loadFromAPI();
    
    if (data && data.lastUpdate > lastUpdate) {
      lastUpdate = data.lastUpdate;
      callback(data);
    }
  };
  
  // Primeira verificação
  checkForUpdates();
  
  // Verificações periódicas
  const intervalId = setInterval(checkForUpdates, interval);
  
  // Retorna função para cancelar
  return () => clearInterval(intervalId);
}

/**
 * Exemplo de uso no Admin Panel:
 * 
 * const handleSaveAll = async () => {
 *   // Salvar localmente
 *   await saveData(STORAGE_KEYS.CONFIG, config);
 *   await saveData(STORAGE_KEYS.PLAYLIST, playlist);
 *   await saveData(STORAGE_KEYS.SCHEDULES, schedules);
 *   
 *   // Sincronizar com API (cross-origin)
 *   await syncToAPI({ config, playlist, schedules, lastUpdate: Date.now() });
 *   
 *   onSave(config, playlist, schedules);
 *   alert('✅ Configurações salvas e sincronizadas!');
 *   onClose();
 * };
 */

/**
 * Exemplo de uso no Embed Player:
 * 
 * useEffect(() => {
 *   // Escutar mudanças da API
 *   const unsubscribe = listenToAPIChanges((data) => {
 *     setConfig(data.config);
 *     // Processar playlist e schedules...
 *   });
 *   
 *   return unsubscribe;
 * }, []);
 */

// ============================================
// EXEMPLO DE BACKEND SIMPLES (Node.js/Express)
// ============================================

/**
 * Exemplo de servidor Node.js para a API:
 * 
 * const express = require('express');
 * const cors = require('cors');
 * const app = express();
 * 
 * app.use(cors()); // Permitir cross-origin
 * app.use(express.json());
 * 
 * let streamcastData = null;
 * 
 * // Endpoint para salvar dados
 * app.post('/streamcast/sync', (req, res) => {
 *   streamcastData = req.body;
 *   res.json({ success: true });
 * });
 * 
 * // Endpoint para carregar dados
 * app.get('/streamcast/sync', (req, res) => {
 *   if (!streamcastData) {
 *     return res.status(404).json({ error: 'No data' });
 *   }
 *   res.json(streamcastData);
 * });
 * 
 * app.listen(3001, () => {
 *   console.log('API rodando em http://localhost:3001');
 * });
 */

// ============================================
// EXEMPLO COM FIREBASE (Recomendado)
// ============================================

/**
 * 1. Instalar: npm install firebase
 * 
 * 2. Criar arquivo src/api/firebase.ts:
 * 
 * import { initializeApp } from 'firebase/app';
 * import { getDatabase, ref, set, onValue } from 'firebase/database';
 * 
 * const firebaseConfig = {
 *   apiKey: "sua-api-key",
 *   authDomain: "seu-projeto.firebaseapp.com",
 *   databaseURL: "https://seu-projeto.firebaseio.com",
 *   projectId: "seu-projeto",
 *   storageBucket: "seu-projeto.appspot.com",
 *   messagingSenderId: "123456789",
 *   appId: "seu-app-id"
 * };
 * 
 * const app = initializeApp(firebaseConfig);
 * const db = getDatabase(app);
 * 
 * export const saveStreamcastData = async (data: any) => {
 *   await set(ref(db, 'streamcast'), data);
 * };
 * 
 * export const listenStreamcastData = (callback: (data: any) => void) => {
 *   const dataRef = ref(db, 'streamcast');
 *   return onValue(dataRef, (snapshot) => {
 *     callback(snapshot.val());
 *   });
 * };
 * 
 * 3. Usar no Admin:
 * 
 * import { saveStreamcastData } from './api/firebase';
 * 
 * const handleSaveAll = async () => {
 *   await saveStreamcastData({ config, playlist, schedules });
 *   alert('Salvo!');
 * };
 * 
 * 4. Usar no Embed:
 * 
 * import { listenStreamcastData } from './api/firebase';
 * 
 * useEffect(() => {
 *   const unsubscribe = listenStreamcastData((data) => {
 *     if (data) {
 *       setConfig(data.config);
 *       setPlaylist(data.playlist);
 *       setSchedules(data.schedules);
 *     }
 *   });
 *   
 *   return () => unsubscribe();
 * }, []);
 */

export default {
  syncToAPI,
  loadFromAPI,
  listenToAPIChanges
};
