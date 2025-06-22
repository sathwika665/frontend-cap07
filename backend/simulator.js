const axios = require('axios');

const BASE_URL = 'http://localhost:4000/coordinates';
const ROUTE_COUNT = 17;
const BASE_LAT = 17.4850;
const BASE_LNG = 78.3950;

// Function to generate a random coordinate near a base point
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
}

// Send random coordinates for all routes every second
const interval = setInterval(sendAllRoutes, 1000);

console.log('🚗 Simulator started. Sending random coordinates for all routes every second...');

// Graceful shutdown: send "stopped" for all routes before exit
function sendStoppedStatus() {
  console.log('🛑 Simulator stopping. Sending stopped status for all routes...');
  const promises = [];
  for (let i = 1; i <= ROUTE_COUNT; i++) {
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
