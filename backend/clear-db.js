require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBsOzN-h6k8op7XFNs8tDJCl9yHugcspzo",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "bustracking-dfce2.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://bustracking-dfce2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.FIREBASE_PROJECT_ID || "bustracking-dfce2",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "bustracking-dfce2.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "810092293839",
  appId: process.env.FIREBASE_APP_ID || "1:810092293839:web:75cdc4e083697b456d11ba"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function clearDatabase() {
  console.log("Connecting to Firebase Database: " + firebaseConfig.databaseURL);
  try {
    // Delete the simulated /routes/Route_1 data
    console.log("Removing simulated routes/Route_1 node...");
    await set(ref(db, 'routes/Route_1'), null);

    // Delete stale /GPS coordinates
    console.log("Resetting GPS coordinates node...");
    await set(ref(db, 'GPS'), {
      lat: 0,
      lng: 0,
      sos: 0,
      speed: 0,
      timestamp: Date.now()
    });

    console.log("✅ Database cleared successfully!");
  } catch (err) {
    console.error("❌ Error clearing Firebase database:", err.message);
  }
  process.exit(0);
}

clearDatabase();
