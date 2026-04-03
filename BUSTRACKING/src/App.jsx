import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import BusTracker from './BusTracker';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/BusTracker" element={<BusTracker />} />
    </Routes>
  );
}

export default App;
