import { 
  collection, 
  doc, 
  getDoc as firebaseGetDoc, 
  setDoc as firebaseSetDoc, 
  updateDoc as firebaseUpdateDoc, 
  deleteDoc as firebaseDeleteDoc, 
  query, 
  getDocs, 
  onSnapshot, 
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Generic Firestore utility functions for Streamcast
 */
export async function getDoc<T>(col: string, id: string): Promise<T | null> {
  const docRef = doc(db, col, id);
  const snapshot = await firebaseGetDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as T;
  }
  return null;
}

export async function setDoc<T extends DocumentData>(col: string, id: string, data: T): Promise<void> {
  const docRef = doc(db, col, id);
  await firebaseSetDoc(docRef, data);
}

export async function updateDoc(col: string, id: string, data: Partial<unknown>): Promise<void> {
  const docRef = doc(db, col, id);
  await firebaseUpdateDoc(docRef, data as DocumentData);
}

export async function deleteDoc(col: string, id: string): Promise<void> {
  const docRef = doc(db, col, id);
  await firebaseDeleteDoc(docRef);
}

export async function queryDocs<T>(col: string, ...constraints: QueryConstraint[]): Promise<T[]> {
  const colRef = collection(db, col);
  const q = query(colRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as T);
}

export function subscribeDoc<T>(col: string, id: string, callback: (data: T | null) => void): () => void {
  const docRef = doc(db, col, id);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as T);
    } else {
      callback(null);
    }
  });
}

export function subscribeDocs<T>(col: string, constraints: QueryConstraint[], callback: (data: T[]) => void): () => void {
  const colRef = collection(db, col);
  const q = query(colRef, ...constraints);
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data() as T);
    callback(items);
  });
}
