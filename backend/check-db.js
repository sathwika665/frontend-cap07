require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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

async function checkDatabase() {
  console.log("Connecting to Firebase Database: " + firebaseConfig.databaseURL);
  try {
    const gpsRef = ref(db, 'GPS');
    const snapshot = await get(gpsRef);
    if (snapshot.exists()) {
      console.log("\n📡 Active data inside /GPS node:");
      console.log(JSON.stringify(snapshot.val(), null, 2));
    } else {
      console.log("\n⚠️ The /GPS node is empty or does not exist in this database!");
    }

    const routeRef = ref(db, 'routes/Route_1');
    const routeSnapshot = await get(routeRef);
    if (routeSnapshot.exists()) {
      console.log("\n📡 Active data inside /routes/Route_1 node:");
      console.log(JSON.stringify(routeSnapshot.val(), null, 2));
    } else {
      console.log("\n⚠️ The /routes/Route_1 node is empty!");
    }
  } catch (err) {
    console.error("❌ Error reading from Firebase:", err.message);
  }
  process.exit(0);
}

checkDatabase();
