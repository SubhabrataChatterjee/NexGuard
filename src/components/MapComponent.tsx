import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, LocateFixed } from 'lucide-react';

interface MapComponentProps {
  startLat?: number;
  startLng?: number;
  currentLat?: number;
  currentLng?: number;
  destLat?: number;
  destLng?: number;
  startName?: string;
  destName?: string;
  height?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  startLat = 22.5726,
  startLng = 88.3639,
  currentLat = 22.5726,
  currentLng = 88.3639,
  destLat = 22.5802,
  destLng = 88.4370,
  startName = 'Current Location (West Bengal)',
  destName = 'Destination',
  height = '100%',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<L.Map | null>(null);
  const [locating, setLocating] = useState(false);
  const [userGpsPos, setUserGpsPos] = useState<[number, number] | null>(null);

  const handleLocateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserGpsPos([lat, lng]);

        if (leafletInstance.current) {
          leafletInstance.current.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });

          // Add or update live user marker
          L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'live-gps-user-marker',
              html: `<div style="
                width: 22px; height: 22px; background: #008a00; border: 3px solid #ffffff;
                border-radius: 50%; box-shadow: 0 0 12px rgba(0, 138, 0, 0.8);
              "></div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
          })
            .addTo(leafletInstance.current)
            .bindPopup(`<b>Your Live GPS Location</b><br/>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`)
            .openPopup();
        }
        setLocating(false);
      },
      (err) => {
        console.warn('Map locate error:', err);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS dynamically if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!leafletInstance.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
      }).setView([currentLat, currentLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      leafletInstance.current = map;
    } else {
      leafletInstance.current.setView([currentLat, currentLng], 14);
    }

    const map = leafletInstance.current;

    // Clear existing markers & polyline
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Custom Icon helper
    const createCustomIcon = (color: string, iconSymbol: string) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">${iconSymbol}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Current Location Marker (Pulse Purple)
    const currentIcon = L.divIcon({
      className: 'current-location-marker',
      html: `<div style="position: relative;">
        <div style="
          width: 20px;
          height: 20px;
          background: #532dcf;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(83, 45, 207, 0.6);
        "></div>
        <div style="
          position: absolute;
          top: -8px;
          left: -8px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(83, 45, 207, 0.25);
          animation: pulse 2s infinite;
        "></div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add Start Marker
    L.marker([startLat, startLng], {
      icon: createCustomIcon('#6c4ce8', 'A'),
    })
      .addTo(map)
      .bindPopup(`<b>Start</b>: ${startName}`);

    // Add Current Location Marker
    L.marker([currentLat, currentLng], {
      icon: currentIcon,
    })
      .addTo(map)
      .bindPopup(`<b>Current Location</b><br/>Sharing Active`);

    // Add Destination Marker
    if (destLat && destLng) {
      L.marker([destLat, destLng], {
        icon: createCustomIcon('#008a00', 'B'),
      })
        .addTo(map)
        .bindPopup(`<b>Destination</b>: ${destName}`);
    }

    // Polyline Route Path
    const latlngs: [number, number][] = [
      [startLat, startLng],
      [currentLat, currentLng],
      [destLat, destLng],
    ];

    L.polyline(latlngs, {
      color: '#532dcf',
      weight: 5,
      opacity: 0.8,
      dashArray: '10, 6',
    }).addTo(map);

    // Fit Bounds
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [40, 40] });

  }, [startLat, startLng, currentLat, currentLng, destLat, destLng, startName, destName]);

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '16px' }} />

      {/* Locate Me Floating Overlay Button */}
      <button
        type="button"
        onClick={handleLocateUser}
        disabled={locating}
        title="Locate my position on map"
        className="absolute top-3 right-3 z-[400] bg-white text-[#532dcf] p-2.5 rounded-xl shadow-md border border-[#e1e2e5] hover:bg-[#f0ecff] transition-all flex items-center gap-1.5 text-xs font-bold"
      >
        <LocateFixed className={`w-4 h-4 ${locating ? 'animate-spin text-green-600' : ''}`} />
        <span>{locating ? 'Locating...' : 'Locate Me'}</span>
      </button>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.2; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
