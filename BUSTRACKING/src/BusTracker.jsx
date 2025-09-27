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
  const [eta, setEta] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);

  // Initialize map on mount
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

  // Fetch coordinates for selected route every 5 seconds
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

  // Fetch ETA for selected route every 5 seconds
  useEffect(() => {
    if (!selectedRoute) return;
    const fetchEta = () => {
      axios.get(`http://localhost:4000/eta?route=${encodeURIComponent(selectedRoute)}`)
        .then(res => setEta(res.data.eta))
        .catch(() => setEta(null));
    };
    fetchEta();
    const interval = setInterval(fetchEta, 5000);
    return () => clearInterval(interval);
  }, [selectedRoute]);

  // Update marker position on map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (Array.isArray(coordinate) && coordinate.length === 2) {
      const busIcon = L.icon({
        iconUrl: '/9249336-removebg-preview.png',
        iconSize: [60, 60],
        iconAnchor: [30, 30],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng(coordinate);
      } else {
        const marker = L.marker(coordinate, { icon: busIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>${selectedRoute}</b>`);
        markerRef.current = marker;
      }

      if (!hasCentered) {
        mapInstanceRef.current.setView(coordinate, 16);
        setHasCentered(true);
      }
    } else {
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [coordinate, selectedRoute, hasCentered]);

  // Reset centering when route changes
  useEffect(() => {
    setHasCentered(false);
  }, [selectedRoute]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && Array.isArray(coordinate) && coordinate.length === 2) {
      mapInstanceRef.current.setView(coordinate, 16);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', minHeight: 400, minWidth: 400 }}>
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      />
      {/* ETA display */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          right: 20,
          zIndex: 1000,
          padding: '10px 20px',
          background: '#fff',
          border: '1px solid #888',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontWeight: 'bold',
          fontSize: 16,
          userSelect: 'none',
        }}
      >
        {eta !== null && eta <= 1 
          ? 'Arrived' 
          : eta > 1 
          ? `Estimated Arrival: ${eta} min` 
          : 'ETA not available'}
      </div>
      {/* Recenter button */}
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
