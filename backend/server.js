const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// === Route 1: Fixed path for demo ===
const route1Path = [
  { lat: 17.4850, lng: 78.3950 }, // Start
  { lat: 17.4880, lng: 78.3960 },
  { lat: 17.4910, lng: 78.3980 },
  { lat: 17.4950, lng: 78.4000 },
  { lat: 17.5000, lng: 78.4050 } // Destination
];

// === Bus Stops (ETA destination for Route 1; dummy for others) ===
const stops = {
  "Route 1": { lat: 17.5000, lng: 78.4050 }
  // Add "Route 2"–"Route 17" with dummy values if needed
};

// --- Coordinates for all live buses ---
let coordinates = {}; // { "Route N": [lat, lng] or null, ... }

// === Distance calculation ===
function toRad(deg) {
  return deg * Math.PI / 180;
}
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// --- GET latest coordinates for all routes ---
app.get('/coordinates', (req, res) => {
  res.json(coordinates);
});

// --- POST to update coordinates for a route ---
app.post('/coordinates', (req, res) => {
  const { latitude, longitude, route, status } = req.body;

  if (
    typeof route === 'string' &&
    route.startsWith('Route ')
  ) {
    if (status === "stopped") {
      coordinates[route] = null;
      console.log(`🛑 Received stopped status for ${route}`);
      return res.status(200).json({ message: 'Route stopped' });
    }
    if (
      status === "active" &&
      typeof latitude === 'number' &&
      typeof longitude === 'number'
    ) {
      coordinates[route] = [latitude, longitude];
      console.log(`📍 Received: (${latitude}, ${longitude}) for ${route} [active]`);
      return res.status(200).json({ message: 'Coordinate updated' });
    }
    return res.status(400).json({ error: 'Invalid data for active/stopped' });
  } else {
    return res.status(400).json({ error: 'Invalid route' });
  }
});

// --- GET ETA for a route ---
app.get('/eta', (req, res) => {
  const route = req.query.route;
  if (!route || !coordinates[route] || !stops[route]) {
    console.log('ETA request missing data:', { route, coords: coordinates[route], stops: stops[route] });
    return res.status(400).json({ error: "Missing data" });
  }
  const [lat, lng] = coordinates[route] || [];
  const { lat: destLat, lng: destLng } = stops[route];
  const distance = haversine(lat, lng, destLat, destLng);
  const speed = 25; // km/h (estimate)
  const eta = (distance / speed) * 60; // minutes
  const etaRounded = Math.round(eta);
  console.log(`ETA calculated for ${route}: distance = ${distance.toFixed(2)} km, ETA = ${etaRounded} minutes`);
  return res.json({ eta: etaRounded, distance: Number(distance.toFixed(2)) });
});


const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
