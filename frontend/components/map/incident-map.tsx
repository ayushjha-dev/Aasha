'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '@/lib/types';

const severityColors: Record<number, string> = {
  1: '#CA8A04', 2: '#CA8A04', 3: '#D97706', 4: '#EA580C', 5: '#DC2626',
};

interface IncidentMapProps {
  incidents: Incident[];
}

export default function IncidentMap({ incidents }: IncidentMapProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  const center: [number, number] = incidents.length > 0
    ? [
        incidents.reduce((sum, i) => sum + i.location.lat, 0) / incidents.length,
        incidents.reduce((sum, i) => sum + i.location.lng, 0) / incidents.length,
      ]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={incidents.length > 0 ? 10 : 5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((inc) => (
        <CircleMarker
          key={inc._id}
          center={[inc.location.lat, inc.location.lng]}
          radius={6 + inc.severity * 2}
          pathOptions={{
            fillColor: severityColors[inc.severity] || '#D97706',
            fillOpacity: 0.7,
            color: '#fff',
            weight: 1,
          }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
                {inc.category}
              </h3>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: '#94A3B8' }}>
                Severity: {inc.severity}/5
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 12, color: '#94A3B8' }}>
                Status: {inc.status}
              </p>
              <p style={{ margin: '0', fontSize: 11, color: '#64748B' }}>
                {inc.description.slice(0, 80)}...
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
