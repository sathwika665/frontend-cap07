import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

// GRIET coordinates
const GRIET_LAT = 17.525;
const GRIET_LNG = 78.368;
const BUS_SPEED_KMH = 25;

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function BusTracker() {
  const location = useLocation();
  const selectedRoute = location.state?.route || null;

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [coordinate, setCoordinate] = useState(null);
  const [eta, setEta] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);

  // Initialize map on mount
  useEffect(() => {
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([17.525, 78.368], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      
      // Destination Marker for GRIET
      L.marker([GRIET_LAT, GRIET_LNG])
        .addTo(map)
        .bindPopup(`<b>GRIET Campus</b>`);
        
      mapInstanceRef.current = map;
    }
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch coordinates from Firebase Realtime Database
  useEffect(() => {
    if (!selectedRoute) return;
    
    if (!database) {
      setFirebaseError(true);
      return;
    }

    const routeRef = ref(database, `routes/${selectedRoute}`);
    const unsubscribe = onValue(routeRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.latitude && data.longitude) {
        setCoordinate([data.latitude, data.longitude]);
        
        // Calculate ETA securely on frontend utilizing destination coordinates
        const dist = haversine(data.latitude, data.longitude, GRIET_LAT, GRIET_LNG);
        const etaValue = Math.round((dist / BUS_SPEED_KMH) * 60);
        setEta(etaValue);
      } else {
        setCoordinate(null);
        setEta(null);
      }
    }, (error) => {
      console.error("Firebase read error:", error);
      setFirebaseError(true);
    });

    return () => unsubscribe();
  }, [selectedRoute]);

  // Update bus marker position on map
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
        mapInstanceRef.current.setView(coordinate, 14);
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
      mapInstanceRef.current.setView(coordinate, 15);
    }
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', minHeight: 400, minWidth: 400 }}>
      {firebaseError && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '15px', background: '#ff4d4f', color: '#fff', textAlign: 'center', zIndex: 2000, fontWeight: 'bold' }}>
          ⚠️ Firebase API is not configured! Please open `.env` and `.env.local` to enter your Firebase project keys.
        </div>
      )}
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
