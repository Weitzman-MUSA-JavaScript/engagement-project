// Persistence: Cloud Firestore when configured, otherwise this browser's localStorage (demo mode).
import { FIREBASE_CONFIG, SUGGESTIONS_COLLECTION } from './config.js';

const FIREBASE_VERSION = '10.12.2';
const LOCAL_KEY = 'shelterSuggestions.demo';

export const isFirestoreConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

let addImpl;

/**
 * Start listening for suggestions. onChange receives the full array every time it changes.
 * Returns { mode: 'firestore' | 'local' }.
 */
export async function initStore(onChange) {
  if (isFirestoreConfigured) {
    const appMod = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`);
    const fs = await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`);
    const app = appMod.initializeApp(FIREBASE_CONFIG);
    const db = fs.getFirestore(app);
    const col = fs.collection(db, SUGGESTIONS_COLLECTION);

    fs.onSnapshot(
      col,
      (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Firestore listen failed:', err),
    );

    addImpl = async (doc) => {
      const ref = await fs.addDoc(col, { ...doc, createdAt: fs.serverTimestamp() });
      return ref.id;
    };
    return { mode: 'firestore' };
  }

  // demo
  const read = () => {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
  };
  let items = read();
  onChange(items);

  addImpl = async (doc) => {
    const id = 'local-' + Date.now().toString(36);
    items = [...items, { id, ...doc, createdAt: new Date().toISOString() }];
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* in-memory only */ }
    onChange(items);
    return id;
  };
  return { mode: 'local' };
}

export function addSuggestion(doc) {
  if (!addImpl) throw new Error('Store not initialized');
  return addImpl(doc);
}
