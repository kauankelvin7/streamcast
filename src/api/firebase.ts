/**
 * Configuração do Firebase para Sincronização Cross-Origin
 * 
 * IMPORTANTE: Para usar em produção, você precisa:
 * 1. Criar uma conta no Firebase (https://firebase.google.com)
 * 2. Criar um novo projeto
 * 3. Ativar o Realtime Database
 * 4. Copiar suas credenciais e substituir abaixo
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, Database } from 'firebase/database';
import type { VideoSource, PlayerConfig, ScheduleItem } from '../types';

// ⚠️ CREDENCIAIS DO FIREBASE CONFIGURADAS
// Firebase Console: https://console.firebase.google.com/project/clinicall-b864e
const firebaseConfig = {
  apiKey: "AIzaSyDSQggB7UdEblCe6npvlz2XS9GGmvanB68",
  authDomain: "clinicall-b864e.firebaseapp.com",
  databaseURL: "https://clinicall-b864e-default-rtdb.firebaseio.com",
  projectId: "clinicall-b864e",
  storageBucket: "clinicall-b864e.firebasestorage.app",
  messagingSenderId: "1015959227080",
  appId: "1:1015959227080:web:7cb36c0a271acaf68b73fd"
};

// Verifica se as credenciais foram configuradas
const isConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

let app: FirebaseApp | null = null;
let database: Database | null = null;

/**
 * Inicializa o Firebase (apenas se configurado)
 */
export function initFirebase(): boolean {
  if (!isConfigured) {
    return false;
  }
  
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      database = getDatabase(app);
    }
    return true;
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return false;
  }
}

/**
 * Interface dos dados sincronizados
 */
export interface StreamcastData {
  config: PlayerConfig;
  playlist: VideoSource[];
  schedules: ScheduleItem[];
  lastUpdate: number;
}

/**
 * Salva dados no Firebase (usado pelo Admin)
 */
export async function saveToFirebase(data: StreamcastData): Promise<boolean> {
  if (!initFirebase() || !database) {
    return false;
  }
  
  try {
    const dataRef = ref(database, 'streamcast');
    await set(dataRef, {
      ...data,
      lastUpdate: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar no Firebase:', error);
    return false;
  }
}

/**
 * Carrega dados do Firebase (usado pelo Embed)
 */
export async function loadFromFirebase(): Promise<StreamcastData | null> {
  if (!initFirebase() || !database) {
    return null;
  }
  
  try {
    const dataRef = ref(database, 'streamcast');
    
    return new Promise((resolve) => {
      onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        resolve(data || null);
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error('Erro ao carregar do Firebase:', error);
    return null;
  }
}

/**
 * Escuta mudanças em tempo real no Firebase
 * @param callback Função chamada quando os dados mudam
 * @returns Função para cancelar a escuta
 */
export function listenToFirebase(
  callback: (data: StreamcastData | null) => void
): () => void {
  if (!initFirebase() || !database) {
    return () => {};
  }
  
  const dataRef = ref(database, 'streamcast');
  
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data || null);
  });
  
  return () => {
    off(dataRef);
  };
}

/**
 * Verifica se o Firebase está configurado
 */
export function isFirebaseEnabled(): boolean {
  return isConfigured;
}

/**
 * Obtém a URL do projeto Firebase
 */
export function getFirebaseProjectUrl(): string | null {
  if (!isConfigured) return null;
  return `https://console.firebase.google.com/project/${firebaseConfig.projectId}`;
}

export default {
  initFirebase,
  saveToFirebase,
  loadFromFirebase,
  listenToFirebase,
  isFirebaseEnabled,
  getFirebaseProjectUrl
};
