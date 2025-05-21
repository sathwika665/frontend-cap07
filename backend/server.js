const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const coordinates = [
  [17.4915, 78.3995], // Kukatpally Metro Station
  [17.4935, 78.3950], // KPHB Metro
  [17.4968, 78.3900], // Road toward JNTU
  [17.5005, 78.3850], // JNTU Metro Station
  [17.5065, 78.3780], // Towards Pragathi Nagar
  [17.5118, 78.3730], // Pragathi Nagar crossroad
  [17.5150, 78.3705], // Mehfil Restaurant area
  [17.5192, 78.3685], // Final stretch towards GRIET
  [17.5206, 78.3678]  // GRIET College
];




app.get('/coordinates', (req, res) => {
  res.json(coordinates);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

