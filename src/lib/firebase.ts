import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Suppress internal offline warnings
setLogLevel('silent'); // Changed to silent to suppress noisy internal connectivity and auth token fetch errors

// Connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('the client is offline') || 
      error.message.includes("Backend didn't respond") ||
      error.message.includes('auth/network-request-failed')
    )) {
      console.warn("Firestore is operating in offline mode or blocked by network settings (e.g. ad blockers, Brave Shields).");
    }
  }
}
testConnection();
