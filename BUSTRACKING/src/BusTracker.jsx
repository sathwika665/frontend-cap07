import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { database } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import { ArrowLeft, MapPin, AlertTriangle, Gauge, Clock, Navigation } from 'lucide-react';

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
  const navigate = useNavigate();
  const selectedRoute = location.state?.route || null;

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const sosCircleRef = useRef(null);

  const [coordinate, setCoordinate] = useState(null);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [hasCentered, setHasCentered] = useState(false);
  const [firebaseError, setFirebaseError] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [sosRouteName, setSosRouteName] = useState('');

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

    const firebaseKey = selectedRoute.replace(/ /g, '_');
    const isIoT = selectedRoute === 'Route 1';
    
    const parseData = (data) => {
      if (!data) return null;
      let latVal = undefined;
      let lngVal = undefined;

      if (data.lat !== undefined) latVal = Number(data.lat);
      else if (data.latitude !== undefined) latVal = Number(data.latitude);

      if (data.lng !== undefined) lngVal = Number(data.lng);
      else if (data.longitude !== undefined) lngVal = Number(data.longitude);

      if (latVal !== undefined && lngVal !== undefined && !isNaN(latVal) && !isNaN(lngVal) && latVal !== 0 && lngVal !== 0) {
        return {
          lat: latVal,
          lng: lngVal,
          speed: data.speed !== undefined ? Number(data.speed) : 0
        };
      }
      return null;
    };

    if (isIoT) {
      // For Route 1 (IoT), we listen EXCLUSIVELY to 'GPS' node which is updated by your real ESP32
      const gpsRef = ref(database, 'GPS');

      const handleSnapshot = (snapshot) => {
        const data = snapshot.val();
        const parsed = parseData(data);
        if (parsed) {
          setCoordinate([parsed.lat, parsed.lng]);
          setSpeed(parsed.speed);
          
          const dist = haversine(parsed.lat, parsed.lng, GRIET_LAT, GRIET_LNG);
          setDistance(dist);
          
          const activeSpeed = parsed.speed > 5 ? parsed.speed : BUS_SPEED_KMH;
          const etaValue = Math.round((dist / activeSpeed) * 60);
          setEta(etaValue);
        }
      };

      const unsubscribeGps = onValue(gpsRef, handleSnapshot, (error) => {
        console.error("Firebase GPS read error:", error);
        setFirebaseError(true);
      });

      return () => {
        unsubscribeGps();
      };
    } else {
      // For all other routes, read directly from routes/Route_X
      const routeRef = ref(database, `routes/${firebaseKey}`);
      const unsubscribe = onValue(routeRef, (snapshot) => {
        const data = snapshot.val();
        const parsed = parseData(data);
        if (parsed) {
          setCoordinate([parsed.lat, parsed.lng]);
          setSpeed(parsed.speed);
          
          const dist = haversine(parsed.lat, parsed.lng, GRIET_LAT, GRIET_LNG);
          setDistance(dist);
          
          const activeSpeed = parsed.speed > 5 ? parsed.speed : BUS_SPEED_KMH;
          const etaValue = Math.round((dist / activeSpeed) * 60);
          setEta(etaValue);
        } else {
          setCoordinate(null);
          setEta(null);
          setDistance(null);
          setSpeed(0);
        }
      }, (error) => {
        console.error("Firebase read error:", error);
        setFirebaseError(true);
      });

      return () => unsubscribe();
    }
  }, [selectedRoute]);

  // Fetch global SOS status from Firebase Realtime Database
  useEffect(() => {
    if (!database) return;

    const gpsRef = ref(database, 'GPS');
    const routesRef = ref(database, 'routes');

    let activeSosGPS = null;
    let activeSosRoutes = [];

    const updateSosState = (gpsSosRoute, routesSosList) => {
      const activeList = [];
      if (gpsSosRoute) activeList.push(gpsSosRoute);
      activeList.push(...routesSosList);

      if (activeList.length > 0) {
        setSosActive(true);
        setSosRouteName(activeList.join(', '));
      } else {
        setSosActive(false);
        setSosRouteName('');
      }
    };

    const unsubscribeGps = onValue(gpsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sosVal = data.sos !== undefined ? data.sos : data.SOS;
        const isSos = (sosVal === 1 || sosVal === '1' || sosVal === true || sosVal === 'true');
        activeSosGPS = isSos ? 'Route 1 (IoT)' : null;
      } else {
        activeSosGPS = null;
      }
      updateSosState(activeSosGPS, activeSosRoutes);
    }, (error) => {
      console.error("Firebase GPS SOS read error on BusTracker:", error);
    });

    const unsubscribeRoutes = onValue(routesRef, (snapshot) => {
      const data = snapshot.val();
      const tempActive = [];
      if (data) {
        Object.keys(data).forEach((routeKey) => {
          const routeData = data[routeKey];
          if (routeData) {
            const sosVal = routeData.sos !== undefined ? routeData.sos : routeData.SOS;
            if (sosVal === 1 || sosVal === '1' || sosVal === true || sosVal === 'true') {
              const formattedName = routeKey.replace(/_/g, ' ');
              tempActive.push(formattedName);
            }
          }
        });
      }
      activeSosRoutes = tempActive;
      updateSosState(activeSosGPS, activeSosRoutes);
    }, (error) => {
      console.error("Firebase routes SOS read error on BusTracker:", error);
    });

    return () => {
      unsubscribeGps();
      unsubscribeRoutes();
    };
  }, []);

  // Update bus marker position and SOS warning circle on map
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

      // Draw red pulsing indicator circle around the bus if SOS is triggered
      if (sosActive) {
        if (sosCircleRef.current) {
          sosCircleRef.current.setLatLng(coordinate);
        } else {
          sosCircleRef.current = L.circle(coordinate, {
            radius: 150,
            color: '#ff4d4f',
            fillColor: '#ff4d4f',
            fillOpacity: 0.45,
            weight: 2,
            dashArray: '5, 5'
          }).addTo(mapInstanceRef.current);
        }
      } else {
        if (sosCircleRef.current) {
          mapInstanceRef.current.removeLayer(sosCircleRef.current);
          sosCircleRef.current = null;
        }
      }

      if (!hasCentered) {
        mapInstanceRef.current.setView(coordinate, 15);
        setHasCentered(true);
      }
    } else {
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (sosCircleRef.current) {
        mapInstanceRef.current.removeLayer(sosCircleRef.current);
        sosCircleRef.current = null;
      }
    }
  }, [coordinate, selectedRoute, hasCentered, sosActive]);

  // Reset centering when route changes
  useEffect(() => {
    setHasCentered(false);
  }, [selectedRoute]);

  // Handle SOS Sound Alert with Web Audio API
  useEffect(() => {
    let intervalId = null;
    if (sosActive) {
      const playBeep = () => {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // Siren pitch
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.25);
        } catch (e) {
          console.warn("Browser autoplay restrictions blocked audio siren:", e);
        }
      };

      playBeep();
      intervalId = setInterval(playBeep, 800);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [sosActive]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && Array.isArray(coordinate) && coordinate.length === 2) {
      mapInstanceRef.current.setView(coordinate, 15);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', minHeight: 400, minWidth: 400, fontFamily: "'Inter', 'Outfit', sans-serif", overflow: 'hidden' }}>
      
      {/* Keyframe styles for beautiful animations */}
      <style>{`
        @keyframes sosFlash {
          0% { background-color: rgba(239, 68, 68, 0.95); box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6); }
          50% { background-color: rgba(220, 38, 38, 0.7); box-shadow: 0 4px 40px rgba(220, 38, 38, 0.8); }
          100% { background-color: rgba(239, 68, 68, 0.95); box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6); }
        }
        @keyframes pulseGreen {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes slideIn {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-sos {
          animation: sosFlash 1.2s infinite ease-in-out;
        }
        .pulse-dot {
          animation: pulseGreen 1.5s infinite;
        }
        .slide-in-panel {
          animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Firebase Error Warning */}
      {firebaseError && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '15px', background: '#ff4d4f', color: '#fff', textAlign: 'center', zIndex: 9999, fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={20} />
          <span>Firebase connection failed! Check your VITE_FIREBASE config settings.</span>
        </div>
      )}

      {/* Map component */}
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      />

      {/* Floating Back Navigation Button */}
      <button
        onClick={handleBack}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          color: '#1f2937',
          fontWeight: '600',
          fontSize: '14px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#fff';
          e.currentTarget.style.transform = 'translateX(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* High-priority Emergency SOS Banner Overlay */}
      {sosActive && (
        <div 
          className="animate-sos"
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '16px',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backdropFilter: 'blur(10px)',
            maxWidth: '90%',
            width: '460px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', padding: '6px' }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '15px', fontWeight: '800', tracking: '0.05em' }}>🚨 SOS SIGNAL DETECTED</span>
            <span style={{ fontSize: '11px', fontWeight: '500', opacity: 0.9 }}>Emergency button pressed on {sosRouteName}!</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(() => {
              const activeSosList = sosRouteName.split(', ').map(r => r.trim());
              const targetTrackRoute = activeSosList.find(r => r !== selectedRoute);
              if (targetTrackRoute) {
                const routeToNavigate = targetTrackRoute.replace(' (IoT)', '');
                return (
                  <button
                    onClick={() => {
                      navigate('/BusTracker', { state: { route: routeToNavigate } });
                      window.location.reload();
                    }}
                    style={{
                      background: '#fff',
                      color: '#ef4444',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Track
                  </button>
                );
              }
              return null;
            })()}
            <button
              onClick={() => {
                if (database) {
                  const activeSosList = sosRouteName.split(', ').map(r => r.trim());
                  activeSosList.forEach(r => {
                    if (r.includes('Route 1') || r === 'GPS') {
                      set(ref(database, 'GPS/sos'), 0).catch(err => console.error("Error resetting GPS SOS:", err));
                      set(ref(database, 'routes/Route_1/sos'), 0).catch(err => console.error("Error resetting Route_1 SOS:", err));
                    } else {
                      const key = r.replace(/ /g, '_');
                      set(ref(database, `routes/${key}/sos`), 0).catch(err => console.error(`Error resetting ${r} SOS:`, err));
                    }
                  });
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* Main Glassmorphism Telemetry Dashboard */}
      {selectedRoute && (
        <div 
          className="slide-in-panel"
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: '90%',
            maxWidth: '460px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            webkitBackdropFilter: 'blur(16px)',
            border: sosActive ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            transition: 'border 0.3s ease',
          }}
        >
          {/* Header row: Route details and device connection indicator */}
          <div style={{ display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', tracking: '0.05em' }}>Selected Route</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#111827' }}>{selectedRoute}</span>
            </div>
            
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: selectedRoute === 'Route 1' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)', padding: '6px 12px', borderRadius: '20px' }}>
              <div 
                className="pulse-dot"
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: selectedRoute === 'Route 1' ? '#10b981' : '#3b82f6',
                }} 
              />
              <span style={{ fontSize: '11px', fontWeight: '700', color: selectedRoute === 'Route 1' ? '#047857' : '#1d4ed8' }}>
                {selectedRoute === 'Route 1' ? 'LIVE ESP32' : 'SIMULATED'}
              </span>
            </div>
          </div>

          {/* Telemetry Numbers Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            
            {/* Speed Panel */}
            <div style={{ background: 'rgba(0, 0, 0, 0.03)', borderRadius: '16px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Gauge size={18} color="#6b7280" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Speed</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                {coordinate ? `${speed} km/h` : '0 km/h'}
              </span>
            </div>

            {/* ETA Panel */}
            <div style={{ background: 'rgba(0, 0, 0, 0.03)', borderRadius: '16px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Clock size={18} color="#6b7280" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>ETA</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                {eta !== null ? (eta <= 1 ? 'Arrived' : `${eta} mins`) : 'N/A'}
              </span>
            </div>

            {/* Distance Panel */}
            <div style={{ background: 'rgba(0, 0, 0, 0.03)', borderRadius: '16px', padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <Navigation size={18} color="#6b7280" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>Distance</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                {distance !== null ? `${distance.toFixed(2)} km` : 'N/A'}
              </span>
            </div>

          </div>

          {/* Quick Action Button Bar */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              onClick={handleRecenter}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: '#111827',
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(17, 24, 39, 0.15)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#1f2937';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#111827';
              }}
            >
              <MapPin size={16} />
              Recenter Map
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default BusTracker;
