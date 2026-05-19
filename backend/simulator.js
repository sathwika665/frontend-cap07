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

console.log("Starting Simulator...");
if (!firebaseConfig.apiKey) {
  console.log("⚠️ No Firebase config found in .env. Please configure Firebase to run the simulator.");
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
  { lat: 17.4893, lng: 78.3970 },
  { lat: 17.4900, lng: 78.3974 },
  { lat: 17.4907, lng: 78.3978 },
  { lat: 17.4914, lng: 78.3982 },
  { lat: 17.4921, lng: 78.3986 },
  { lat: 17.4928, lng: 78.3990 },
  { lat: 17.4935, lng: 78.3995 },
  { lat: 17.4942, lng: 78.3999 },
  { lat: 17.4949, lng: 78.4004 },
  { lat: 17.4956, lng: 78.4008 },
  { lat: 17.4963, lng: 78.4013 },
  { lat: 17.4970, lng: 78.4017 },
  { lat: 17.4977, lng: 78.4022 },
  { lat: 17.4984, lng: 78.4027 },
  { lat: 17.4991, lng: 78.4032 },
  { lat: 17.4998, lng: 78.4037 },
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
    const route = `Route_${i}`;
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
      await set(ref(db, `routes/${route}`), {
        latitude: lat,
        longitude: lng,
        status: 'active',
        timestamp: Date.now()
      });

      if (i === 1) {
        // Also simulate the physical ESP32 GPS Tracker
        const simulatedSpeed = Number((22.5 + Math.random() * 15).toFixed(1)); // 22.5 to 37.5 km/h
        const simulatedSos = (route1Index === 4 || route1Index === 5) ? 1 : 0; // Trigger SOS simulation on indices 4 and 5
        await set(ref(db, 'GPS'), {
          lat: lat,
          lng: lng,
          speed: simulatedSpeed,
          sos: simulatedSos,
          timestamp: Date.now()
        });
        console.log(`✅ Firebase Written: (${lat}, ${lng}) for Route 1 AND /GPS node (Speed: ${simulatedSpeed} km/h, SOS: ${simulatedSos})`);
      } else {
        console.log(`✅ Firebase Written: (${lat}, ${lng}) for ${route}`);
      }
    } catch (err) {
      console.error(`❌ Error writing to Firebase for ${route}:`, err.message);
    }
  }

  route1Index = (route1Index + 1) % route1Path.length;
}

const interval = setInterval(sendAllRoutes, 1000);

console.log('🚗 Simulator started. Sending ALL routes (1-17) to Firebase every second...');

function sendStoppedStatus() {
  console.log('🛑 Simulator stopping. Sending stopped status for simulated routes to Firebase...');
  const promises = [];

  for (let i = 1; i <= ROUTE_COUNT; i++) {
    const route = `Route_${i}`;
    
    promises.push(
      set(ref(db, `routes/${route}`), {
        status: 'stopped',
        timestamp: Date.now()
      }).then(() => {
        console.log(`🛑 Firebase status set to stopped for ${route}`);
      }).catch(err => {
        console.error(`❌ Error updating Firebase for ${route}:`, err.message);
      })
    );
  }

  // Also reset the IoT GPS node on exit
  promises.push(
    set(ref(db, 'GPS'), {
      lat: 0,
      lng: 0,
      speed: 0,
      sos: 0,
      timestamp: Date.now()
    }).then(() => {
      console.log(`🛑 Firebase GPS node reset`);
    }).catch(err => {
      console.error(`❌ Error resetting GPS node:`, err.message);
    })
  );

  Promise.all(promises).finally(() => process.exit(0));
}

process.on('SIGINT', () => {
  clearInterval(interval);
  sendStoppedStatus();
});

process.on('SIGTERM', () => {
  clearInterval(interval);
  sendStoppedStatus();
});