import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

function BusTracker() {
  const location = useLocation();
  const selectedRoute = location.state?.route || null;

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [coordinate, setCoordinate] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);

  // 1. Initialize map on mount (centered at a default location)
  useEffect(() => {
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([17.428796452434764, 78.45891706071164], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      mapInstanceRef.current = map;
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Fetch coordinates for all routes every 5 seconds, but only use the selected route
  useEffect(() => {
    if (!selectedRoute) return;
    const fetchCoords = () => {
      axios.get('http://localhost:4000/coordinates')
        .then(res => {
          const coord = res.data && res.data[selectedRoute];
          setCoordinate(Array.isArray(coord) ? coord : null);
        })
        .catch(console.error);
    };

    fetchCoords();
    const interval = setInterval(fetchCoords, 5000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // 3. Manage marker for the selected route
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove previous marker if any
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (Array.isArray(coordinate) && coordinate.length === 2) {
      const busIcon = L.icon({
        iconUrl: '/9249336-removebg-preview.png',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      });

      const marker = L.marker(coordinate, { icon: busIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>${selectedRoute}</b>`);
      markerRef.current = marker;

      // Recenter only the first time the marker appears
      if (!hasCentered) {
        mapInstanceRef.current.setView(coordinate, 16);
        setHasCentered(true);
      }
      // Otherwise, do not recenter
    }
    // If coordinate is null, marker is removed (see above)
  }, [coordinate, selectedRoute, hasCentered]);

  // Reset hasCentered if route changes
  useEffect(() => {
    setHasCentered(false);
  }, [selectedRoute]);

  // Handler for recenter button
  const handleRecenter = () => {
    if (mapInstanceRef.current && Array.isArray(coordinate) && coordinate.length === 2) {
      mapInstanceRef.current.setView(coordinate, 16);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', minHeight: 400, minWidth: 400 }}>
      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          zIndex: 0,
        }}
      />
      {/* Recenter Button Overlay */}
      <button
        onClick={handleRecenter}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          padding: '10px 20px',
          background: '#fff',
          border: '1px solid #888',
          borderRadius: 4,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        Recenter
      </button>
    </div>
  );
}

export default BusTracker;
