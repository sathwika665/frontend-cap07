require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

console.log("Starting Firebase Simulator...");
if (!firebaseConfig.apiKey) {
  console.log("⚠️ No Firebase config found in .env. Please configure Firebase to run the simulator.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);



// Fake Route 1 movement data
const route1Path = [
  { lat: 17.4850, lng: 78.3950 },
  { lat: 17.4858, lng: 78.3953 },
  { lat: 17.4865, lng: 78.3956 },
  { lat: 17.4872, lng: 78.3959 },
  { lat: 17.4879, lng: 78.3963 },
  { lat: 17.4886, lng: 78.3967 },
  { lat: 17.4900, lng: 78.3974 },
  { lat: 17.4950, lng: 78.4000 },
  { lat: 17.5000, lng: 78.4050 },
];

let route1Index = 0;



async function sendAllRoutes() {
  const routeName = `Route_1`;
  const r1Pos = route1Path[route1Index];
  const lat = r1Pos.lat;
  const lng = r1Pos.lng;

  try {
    // Write to Firebase Realtime Database
    await set(ref(db, `routes/${routeName}`), {
      latitude: lat,
      longitude: lng,
      status: 'active',
      timestamp: Date.now()
    });

    // Also write to GPS node to simulate ESP32 IoT Device
    const simulatedSpeed = Number((22.5 + Math.random() * 15).toFixed(1)); // 22.5 to 37.5 km/h
    const simulatedSos = (route1Index === 4 || route1Index === 5) ? 1 : 0; // Trigger SOS simulation on indices 4 and 5

    await set(ref(db, 'GPS'), {
      lat: lat,
      lng: lng,
      speed: simulatedSpeed,
      sos: simulatedSos,
      timestamp: Date.now()
    });

    console.log(`✅ Firebase Written: (${lat}, ${lng}) for ${routeName} AND /GPS node (Speed: ${simulatedSpeed} km/h, SOS: ${simulatedSos})`);
  } catch (err) {
    console.error(`❌ Error writing to Firebase:`, err.message);
  }
  
  route1Index = (route1Index + 1) % route1Path.length;
}

const interval = setInterval(sendAllRoutes, 2000);

process.on('SIGINT', async () => {
    console.log('🛑 Shutting down simulator. Resetting Firebase GPS node...');
    clearInterval(interval);
    try {
      await set(ref(db, 'GPS'), {
        lat: 0,
        lng: 0,
        speed: 0,
        sos: 0,
        timestamp: Date.now()
      });
      console.log('✅ Firebase GPS node successfully reset.');
    } catch (err) {
      console.error('❌ Failed to reset Firebase GPS node on shutdown:', err.message);
    }
    process.exit(0);
});

// Dummy HTTP server to keep Render Web Service alive
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Firebase Simulator is running ✅');
}).listen(PORT, () => {
  console.log(`🌐 Dummy server listening on port ${PORT}`);
});
