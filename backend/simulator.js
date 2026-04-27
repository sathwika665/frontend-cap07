const axios = require('axios');

const BASE_URL = 'http://localhost:4000/coordinates';
const ROUTE_COUNT = 17;
const BASE_LAT = 17.4850;
const BASE_LNG = 78.3950;

// Fixed route path for Route 1 (demo route)
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

function sendAllRoutes() {
  for (let i = 1; i <= ROUTE_COUNT; i++) {
    if (i === 1) {
      const r1Pos = route1Path[route1Index];
      axios.post(BASE_URL, { latitude: r1Pos.lat, longitude: r1Pos.lng, route: "Route 1", status: "active" })
        .then(() => console.log(`✅ Sent: (${r1Pos.lat}, ${r1Pos.lng}) for Route 1 [active]`))
        .catch(err => console.error(`❌ Error sending coordinate for Route 1:`, err.message));
      continue;
    }

    const route = `Route ${i}`;
    const [latitude, longitude] = generateRandomCoordinate(BASE_LAT, BASE_LNG);

    axios.post(BASE_URL, { latitude, longitude, route, status: "active" })
      .then(() => {
        console.log(`✅ Sent: (${latitude}, ${longitude}) for ${route} [active]`);
      })
      .catch(err => {
        console.error(`❌ Error sending coordinate for ${route}:`, err.message);
      });
  }

  route1Index = (route1Index + 1) % route1Path.length;
}

const interval = setInterval(sendAllRoutes, 1000);

console.log('🚗 Simulator started. Sending random coordinates for Routes 2-17 every second...');

function sendStoppedStatus() {
  console.log('🛑 Simulator stopping. Sending stopped status for simulated routes...');
  const promises = [];

  for (let i = 1; i <= ROUTE_COUNT; i++) {
    if (i === 1) continue;

    const route = `Route ${i}`;
    promises.push(
      axios.post(BASE_URL, { route, status: "stopped" })
        .then(() => {
          console.log(`🛑 Sent stopped status for ${route}`);
        })
        .catch(err => {
          console.error(`❌ Error sending stopped status for ${route}:`, err.message);
        })
    );
  }

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