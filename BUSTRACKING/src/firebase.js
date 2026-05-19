import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const sanitize = (val) => {
  if (typeof val === 'string') {
    return val.replace(/^["']|["']$/g, '');
  }
  return val;
};

const firebaseConfig = {
  apiKey: sanitize(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitize(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  databaseURL: sanitize(import.meta.env.VITE_FIREBASE_DATABASE_URL),
  projectId: sanitize(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitize(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitize(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitize(import.meta.env.VITE_FIREBASE_APP_ID)
};

let app;
let database = null;

// Prevent crashing if the user hasn't added their Firebase config yet
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
  } catch (err) {
    console.error("Firebase Init Error:", err);
  }
}

export { database };
