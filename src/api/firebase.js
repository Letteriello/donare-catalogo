// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Configuração do Firebase usando variáveis de ambiente com fallback para valores padrão
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAJ9cw5uNQGFd4VH13cD_WgxE1PLaC4DdM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "donare-catalogo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "donare-catalogo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "donare-catalogo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_SENDER_ID || "12091397107",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:12091397107:web:c19ef6fe250cdb6778f886",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-15BG5CH1VW"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, db, storage, auth, analytics };
