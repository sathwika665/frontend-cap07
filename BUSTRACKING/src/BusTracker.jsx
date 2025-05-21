import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Vite asset imports
import taxiIconUrl from '/assets/bus.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import iconUrl from 'leaflet/dist/images/marker-icon.png?url';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png?url';

const BusTracker = () => {
  const mapRef = useRef(null);
  const routingControlRef = useRef(null);
  const busRef = useRef(null);
  const sourceRef = useRef(null);
  const destRef = useRef(null);

  const DEFAULT_SOURCE = [17.4945, 78.3996]; // Kukatpally
  const DEFAULT_DEST = [17.4969, 78.3658];  // GRIET

  useEffect(() => {
    const DefaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = DefaultIcon;

    const map = L.map(mapRef.current).setView(DEFAULT_SOURCE, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const busIcon = L.icon({
      iconUrl: taxiIconUrl,
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });

    // Add draggable source marker
    sourceRef.current = L.marker(DEFAULT_SOURCE, { draggable: true }).addTo(map).bindPopup("Source").openPopup();

    // Add draggable destination marker
    destRef.current = L.marker(DEFAULT_DEST, { draggable: true }).addTo(map).bindPopup("Destination").openPopup();

    // Add bus icon initially at source
    busRef.current = L.marker(DEFAULT_SOURCE, { icon: busIcon }).addTo(map);

    const calculateRoute = () => {
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }

      routingControlRef.current = L.Routing.control({
        waypoints: [
          sourceRef.current.getLatLng(),
          destRef.current.getLatLng()
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: '#FF5733', opacity: 0.8, weight: 5 }]
        }
      })
        .on('routesfound', function (e) {
          const route = e.routes[0];
          const coords = route.coordinates;

          // Animate the bus along the route
          coords.forEach((coord, i) => {
            setTimeout(() => {
              busRef.current.setLatLng([coord.lat, coord.lng]);
            }, 40 * i);
          });
        })
        .addTo(map);
    };

    // Initial route
    calculateRoute();

    // Recalculate route on dragging either point
    sourceRef.current.on('dragend', calculateRoute);
    destRef.current.on('dragend', calculateRoute);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    />
  );
};

export default BusTracker;