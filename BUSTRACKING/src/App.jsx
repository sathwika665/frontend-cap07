import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import BusTracker from './BusTracker';
import IoTTracker from './IoTTracker';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/BusTracker" element={<BusTracker />} />
      <Route path="/iot-tracker" element={<IoTTracker />} />
      <Route path="/iot" element={<IoTTracker />} />
    </Routes>
  );
}

export default App;
