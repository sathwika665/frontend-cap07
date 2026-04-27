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

const ROUTE_COUNT = 17;
const BASE_LAT = 17.4850;
const BASE_LNG = 78.3950;

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

function generateRandomCoordinate(baseLat, baseLng, maxOffset = 0.001) {
  const latOffset = Math.random() * 2 * maxOffset - maxOffset;
  const lngOffset = Math.random() * 2 * maxOffset - maxOffset;
  return [
    Number((baseLat + latOffset).toFixed(7)),
    Number((baseLng + lngOffset).toFixed(7))
  ];
}

async function sendAllRoutes() {
  for (let i = 1; i <= ROUTE_COUNT; i++) {
    const routeName = `Route ${i}`;
    let lat, lng;
    
    if (i === 1) {
      const r1Pos = route1Path[route1Index];
      lat = r1Pos.lat;
      lng = r1Pos.lng;
    } else {
      const [randomLat, randomLng] = generateRandomCoordinate(BASE_LAT, BASE_LNG);
      lat = randomLat;
      lng = randomLng;
    }

    try {
      // Write to Firebase Realtime Database
      await set(ref(db, `routes/${routeName}`), {
        latitude: lat,
        longitude: lng,
        status: 'active',
        timestamp: Date.now()
      });
      console.log(`✅ Firebase Written: (${lat}, ${lng}) for ${routeName}`);
    } catch (err) {
      console.error(`❌ Error writing to Firebase for ${routeName}:`, err.message);
    }
  }
  route1Index = (route1Index + 1) % route1Path.length;
}

const interval = setInterval(sendAllRoutes, 2000);

process.on('SIGINT', async () => {
    console.log('🛑 Shutting down simulator.');
    clearInterval(interval);
    process.exit(0);
});
