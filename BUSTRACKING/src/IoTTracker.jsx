import React, { useEffect, useRef, useState } from 'react';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, Gauge, Wifi } from 'lucide-react';

function IoTTracker() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const sosCircleRef = useRef(null);

  // States for physical ESP32 data
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [sos, setSos] = useState(0);
  const [connected, setConnected] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      // Default initial view (standard street tiles, centered on a neutral region)
      const map = L.map(mapRef.current, {
        zoomControl: false
      }).setView([20.5937, 78.9629], 5); // Default centered on India at low zoom until coordinate is received

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Listen exclusively to your physical ESP32 /GPS node
  useEffect(() => {
    if (!database) return;

    const gpsRef = ref(database, 'GPS');
    const unsubscribe = onValue(gpsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Parse values matching your ESP32 keys exactly
        const latitude = data.lat !== undefined ? Number(data.lat) : null;
        const longitude = data.lng !== undefined ? Number(data.lng) : null;
        const currentSpeed = data.speed !== undefined ? Number(data.speed) : 0;
        const sosState = data.sos !== undefined ? Number(data.sos) : 0;

        if (latitude && longitude && latitude !== 0 && longitude !== 0) {
          setLat(latitude);
          setLng(longitude);
          setSpeed(currentSpeed);
          setSos(sosState);
          setConnected(true);
        }
      }
    }, (error) => {
      console.error("Firebase read error:", error);
    });

    return () => unsubscribe();
  }, []);

  // Update map coordinates when your ESP32 sends fresh data
  useEffect(() => {
    if (!mapInstanceRef.current || !lat || !lng) return;

    const currentCoords = [lat, lng];

    // Marker styling for your device
    const customIcon = L.divIcon({
      className: 'esp32-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${sos === 1 ? 'bg-red-500 animate-ping opacity-75' : 'bg-blue-500 animate-ping opacity-50'}"></div>
          <div class="w-5 h-5 rounded-full ${sos === 1 ? 'bg-red-600' : 'bg-blue-600'} border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
            ${sos === 1 ? '⚠️' : '🛰️'}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    // Create or update marker position
    if (markerRef.current) {
      markerRef.current.setLatLng(currentCoords);
      markerRef.current.setIcon(customIcon);
    } else {
      markerRef.current = L.marker(currentCoords, { icon: customIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>ESP32 GPS Location</b><br/>Lat: ${lat}<br/>Lng: ${lng}`);
    }

    // Dynamic red alert circle around the coordinates if SOS is active
    if (sos === 1) {
      if (sosCircleRef.current) {
        sosCircleRef.current.setLatLng(currentCoords);
      } else {
        sosCircleRef.current = L.circle(currentCoords, {
          radius: 100,
          color: '#dc2626',
          fillColor: '#dc2626',
          fillOpacity: 0.3,
          weight: 2
        }).addTo(mapInstanceRef.current);
      }
    } else {
      if (sosCircleRef.current) {
        mapInstanceRef.current.removeLayer(sosCircleRef.current);
        sosCircleRef.current = null;
      }
    }

    // Fly map to the ESP32 coordinates smoothly
    mapInstanceRef.current.flyTo(currentCoords, 16, {
      duration: 1.5
    });
  }, [lat, lng, sos]);

  return (
    <div className="relative w-screen h-screen bg-slate-100 font-sans overflow-hidden">
      
      {/* Visual full screen flashing border during SOS */}
      {sos === 1 && (
        <div className="absolute inset-0 bg-red-600/10 pointer-events-none z-30 border-8 border-red-600 animate-pulse"></div>
      )}

      {/* Interactive Map */}
      <div ref={mapRef} className="w-full h-full z-0" />

      {/* Floating HUD Container (Sleek, direct, non-invasive) */}
      <div className="absolute top-6 left-6 z-10 w-full max-w-sm px-4 sm:px-0">
        <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl border border-slate-200/50 p-6 flex flex-col gap-5">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">ESP32 GPS Tracker</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">PHYSICAL HARDWARE FEED</p>
            </div>
            
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
              <Wifi size={12} className={connected ? 'animate-pulse' : ''} />
              {connected ? 'CONNECTED' : 'AWAITING ESP32'}
            </div>
          </div>

          {/* Telemetry Display */}
          <div className="flex flex-col gap-3.5">
            {/* Lat / Lng Panels */}
            {connected ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Latitude</span>
                    <span className="block text-sm font-extrabold font-mono text-slate-700 mt-0.5">
                      {lat ? lat.toFixed(6) : '0.000000'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Longitude</span>
                    <span className="block text-sm font-extrabold font-mono text-slate-700 mt-0.5">
                      {lng ? lng.toFixed(6) : '0.000000'}
                    </span>
                  </div>
                </div>

                {/* Speed Telemetry */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={18} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-semibold">Current Speed</span>
                  </div>
                  <span className="text-base font-black text-slate-800 font-mono">
                    {speed} <span className="text-xs text-slate-500 font-bold">km/h</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-2xl text-center">
                <MapPin size={24} className="mx-auto text-slate-400 animate-bounce mb-2" />
                <span className="text-xs text-slate-600 font-bold block">Waiting for Hardware Coordinates</span>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Turn on your ESP32. It will automatically load coordinates onto this map when it connects.
                </p>
              </div>
            )}

            {/* Emergency SOS Signal Indicator */}
            {connected && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 transition-colors duration-300 ${sos === 1 ? 'bg-red-50 border border-red-200 text-red-700 animate-pulse' : 'bg-emerald-50 border border-emerald-100 text-emerald-700'}`}>
                <AlertTriangle size={20} className={sos === 1 ? 'text-red-600' : 'text-emerald-600'} />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    {sos === 1 ? '🚨 EMERGENCY ALERT' : '🟢 System Status'}
                  </h3>
                  <p className="text-[10px] opacity-90 font-medium">
                    {sos === 1 ? 'SOS emergency button is pressed!' : 'Emergency button is secure.'}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}

export default IoTTracker;
