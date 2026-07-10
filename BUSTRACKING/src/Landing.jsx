import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Hand, AlertTriangle, MapPin } from 'lucide-react';
import { database } from './firebase';
import { ref, onValue, set } from 'firebase/database';
import './index.css';

function Landing() {
  const [route, setRoute] = useState('');
  const [year, setYear] = useState('');
  const [sosActive, setSosActive] = useState(false);
  const [sosRouteName, setSosRouteName] = useState('');
  const navigate = useNavigate();

  // Listen to both /GPS and all /routes nodes for SOS signal globally
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
      console.error("Firebase GPS SOS read error on Landing:", error);
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
      console.error("Firebase routes SOS read error on Landing:", error);
    });

    return () => {
      unsubscribeGps();
      unsubscribeRoutes();
    };
  }, []);

  // Handle SOS Sound Alert with Web Audio API when on main page
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

  const features = [
    {
      title: 'Expected Time Of Arrival',
      icon: (
        <img
          src="/wt copy.jpeg"
          alt="Bus Tracking"
          className="w-full max-w-2xl max-h-[400px]"
          style={{ borderRadius: '20px' }}
        />
      ),
      description:
        'No more guesswork! Get accurate arrival times for your bus and plan your journey with ease.',
    },
    {
      title: 'Live GPS Tracking',
      icon: (
        <img
          src="/location.jpeg"
          alt="Bus Tracking"
          className="w-full max-w-2xl max-h-[400px]"
          style={{ borderRadius: '20px' }}
        />
      ),
      description:
        'See your bus move in real time! Stay updated with precise location tracking.',
    },
    {
      title: 'SOS ALERT',
      icon: (
        <img
          src="/sos.jpeg"
          alt="Bus Tracking"
          className="w-full max-w-2xl max-h-[400px]"
          style={{ borderRadius: '20px' }}
        />
      ),
      description:
        'Safety first! Instantly send emergency alerts and get quick assistance when needed.',
    },
    {
      title: 'Stops & Routes',
      icon: (
        <img
          src="/bus-removebg-preview copy.png"
          alt="Bus Tracking"
          className="w-full max-w-2xl max-h-[400px]"
          style={{ borderRadius: '20px' }}
        />
      ),
      description:
        'Navigate smarter! Explore all available stops and choose the best route for your journey.',
    },
  ];

  // Fixed: Use backticks and curly braces for template literals in JSX
  const routeOptions = Array.from({ length: 17 }, (_, i) => (
    <option key={i + 1} value={`Route ${i + 1}`}>{`Route ${i + 1}`}</option>
  ));

  const handleConfirm = () => {
    if (route && year) {
      navigate('/BusTracker', { state: { route } }); // Pass route in navigation state
    } else {
      alert('Please select both bus route and year of study');
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 md:px-12 py-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center ">
        <div className="flex items-center space-x-2">
          <div className="flex justify-between items-center ">
            {/* Gokaraju branding block (left) */}
            <div className="flex items-center space-x-2">
              <img src="/LOGO.png" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12" />
              <div className="font-bold text-lg sm:text-xl text-gray-800 leading-tight">
                Gokaraju
                <br />
                <span className="text-sm sm:text-base font-normal">Bus Buddies</span>
              </div>
            </div>
            {/* New logo (right end of screen) */}
            <img
              src="/aac copy.png"
              alt="New Logo"
              className="w-8  sm:w-10  fixed top-6 right-4 z-50"
            />
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-white px-4 sm:px-6 md:px-12 py-6 font-sans">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          SEAMLESS BUS MONITORING MADE EASY
        </h1>
        <p className="text-base sm:text-lg text-gray-700 mb-6">Track - Ride - Arrive</p>

        {/* Dropdowns */}
        <div className="space-y-4 mb-6 md:flex md:justify-center md:flex-col md:items-center">
          <div className="relative">
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full md:w-[500px] appearance-none bg-black text-white font-medium py-3 px-4 rounded-xl shadow-md focus:outline-none"
            >
              <option value="" disabled>
                Select Bus Route
              </option>
              {routeOptions}
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-white pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full md:w-[500px] appearance-none bg-black text-white font-medium py-3 px-4 rounded-xl shadow-md focus:outline-none"
            >
              <option value="" disabled>
                Select Year of Study
              </option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-white pointer-events-none" />
          </div>

          <button
            onClick={handleConfirm}
            className="w-full  bg-green-500 md:w-[500px] text-white font-semibold py-3 rounded-full shadow hover:bg-green-600 transition cursor-pointer"
          >
            Confirm
          </button>

          <div className="flex items-center justify-between w-full md:w-[500px] py-1">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-xs text-gray-400 font-bold uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <button
            onClick={() => navigate('/iot-tracker')}
            className="w-full md:w-[500px] bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-3.5 rounded-full shadow-lg border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2.5 transition cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Launch ESP32 Telemetry Dashboard</span>
            <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Illustration */}
        <div className="mt-10 flex justify-center">
          <img
            src="/map copy.jpeg"
            alt="Bus Tracking"
            className="w-full max-w-2xl max-h-[400px]"
            style={{ borderRadius: '20px' }}
          />
        </div>
        <div className="min-h-screen bg-white p-6 flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-8">Features</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#F3F3F3] p-6 md:p-8 min-h-[180px] rounded-2xl shadow-md flex items-start space-x-4"
              >
                <div className="text-4xl md:text-5xl">{feature.icon}</div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">{feature.title}</h2>
                  <p className="text-sm md:text-base text-gray-600 mt-2">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="min-h-[40vh] bg-white text-white font-sans">
            {/* Header */}
            <div className="bg-white text-black px-6 py-4">
              <h2 className="font-bold text-sm">BUS BUDDIES</h2>
              <h1 className="text-3xl font-black">Contact-us</h1>
            </div>

            {/* Footer / Contact Section */}
            <footer className="bg-black text-white px-6 py-5">
              {/* About + Contact */}
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                {/* About Us */}
                <div className="sm:w-1/2">
                  <h3 className="font-semibold mb-2 text-lg">ABOUT US</h3>
                  <p className="text-sm leading-relaxed">
                    A real-time bus tracking app for college students to view live bus locations,
                    estimated arrival times, and routes, ensuring timely transportation and
                    enhancing campus commuting convenience.
                  </p>
                </div>

                {/* Contact Info */}
                <div className="sm:w-1/2 flex flex-col gap-1 mt-6 sm:mt-0 text-sm">
                  <p className="font-semibold">GRIET</p>
                  <p>+0000000000</p>
                  <p>griet@gmail.com</p>
                  <p className="underline cursor-pointer">-See on map</p>
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex justify-center gap-6 mt-10 text-2xl">
                <span className="bg-white text-black rounded-full p-2 w-10 h-10 flex items-center justify-center">📸</span>
                <span className="bg-white text-black rounded-full p-2 w-10 h-10 flex items-center justify-center">📘</span>
                <span className="bg-white text-black rounded-full p-2 w-10 h-10 flex items-center justify-center">✉</span>
              </div>

              {/* Tagline */}
              <div className="border border-dashed border-white mt-10 p-4 text-center text-sm">
                Missing buses is old school—<br />
                track it, catch it, chill! 😎🚌
              </div>
            </footer>
          </div>
        </div>
      </div>
      
      {/* SOS Alert Modal Overlay */}
      {sosActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* Keyframe stylesheet */}
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            @keyframes pulseRed {
              0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
              70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
              100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
            .sos-pulse-button {
              animation: pulseRed 2s infinite;
            }
          `}</style>

          <div style={{
            background: 'linear-gradient(135deg, #1e1b1b 0%, #0d0a0a 100%)',
            border: '2px solid #ef4444',
            borderRadius: '24px',
            padding: '30px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
            animation: 'scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              borderRadius: '50%',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
            }}>
              <AlertTriangle size={42} color="#ef4444" className="animate-bounce" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444', letterSpacing: '0.05em' }}>
                ⚠️ EMERGENCY ALERT
              </span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#f3f4f6' }}>
                SOS Signal Triggered
              </span>
              <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.5', margin: '8px 0 0 0' }}>
                An active emergency alert was triggered by: <strong>{sosRouteName}</strong>. Immediate assistance may be required.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => navigate('/iot-tracker')}
                className="sos-pulse-button"
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                🚨 OPEN TELEMETRY DASHBOARD
              </button>

              {(() => {
                const activeSosList = sosRouteName.split(', ').map(r => r.trim());
                if (activeSosList.length > 0 && activeSosList[0]) {
                  const targetRoute = activeSosList[0].replace(' (IoT)', '');
                  return (
                    <button
                      onClick={() => navigate('/BusTracker', { state: { route: targetRoute } })}
                      style={{
                        width: '100%',
                        padding: '12px 20px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#d1d5db',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '14px',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#d1d5db';
                      }}
                    >
                      <MapPin size={16} />
                      Locate on Standard Map ({targetRoute})
                    </button>
                  );
                }
                return null;
              })()}

              <button
                onClick={() => {
                  setSosActive(false);
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
                  width: '100%',
                  padding: '12px 20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#d1d5db',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#d1d5db';
                }}
              >
                Dismiss Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;
