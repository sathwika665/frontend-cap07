const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Store latest coordinate for each route
let coordinates = {}; // { "Route 1": [lat, lng] or null, ... }

app.get('/coordinates', (req, res) => {
  res.json(coordinates);
});

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
    // If status is not recognized or missing required fields
    return res.status(400).json({ error: 'Invalid data for active/stopped' });
  } else {
    return res.status(400).json({ error: 'Invalid route' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
