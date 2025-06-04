const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Start with an empty coordinates array
let coordinates = [];

// GET endpoint for the frontend to fetch coordinates
app.get('/coordinates', (req, res) => {
  res.json(coordinates);
});

// POST endpoint for the simulator to send coordinates
app.post('/coordinates', (req, res) => {
  const { latitude, longitude } = req.body;

  if (typeof latitude === 'number' && typeof longitude === 'number') {
    coordinates.push([latitude, longitude]);
    console.log(`📍 Received: (${latitude}, ${longitude})`);
    res.status(200).json({ message: 'Coordinate added' });
  } else {
    res.status(400).json({ error: 'Invalid coordinates' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
