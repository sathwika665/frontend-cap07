import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

function BusTracker() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [coordinates, setCoordinates] = useState([]);
  const indexRef = useRef(0);

  // Fetch coordinates every 5 seconds
  useEffect(() => {
    const fetchCoords = () => {
      axios.get('http://localhost:4000/coordinates')
        .then(res => {
          if (res.data.length !== coordinates.length) {
            setCoordinates(res.data);
          }
        })
        .catch(console.error);
    };

    fetchCoords();
    const interval = setInterval(fetchCoords, 5000);
    return () => clearInterval(interval);
  }, [coordinates.length]);

  // Initialize map and marker
  useEffect(() => {
    if (coordinates.length === 0) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView(coordinates[0], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const busIcon = L.icon({
        iconUrl: '/9249336-removebg-preview.png',
        iconSize: [60, 60],
        iconAnchor: [35, 35],
      });

      const marker = L.marker(coordinates[0], { icon: busIcon }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;
      indexRef.current = 0;
    }
  }, [coordinates]);

  // Move marker every 3 seconds
  useEffect(() => {
    if (!markerRef.current || coordinates.length === 0) return;

    const interval = setInterval(() => {
      if (indexRef.current < coordinates.length - 1) {
        indexRef.current += 1;
        const [lat, lng] = coordinates[indexRef.current];
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.panTo([lat, lng]);
      }
    },1000);

    return () => clearInterval(interval);
  }, [coordinates]);

  return <div ref={mapRef} style={{ height: '100vh' }} />;
}

export default BusTracker;
