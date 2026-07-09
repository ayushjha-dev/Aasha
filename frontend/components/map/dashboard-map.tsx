'use client';

import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, Shelter } from '@/lib/types';
import { useState } from 'react';
import { MapPin, AlertTriangle } from 'lucide-react';

// Standard Leaflet Icon setup
const createShelterIcon = (color: string) => {
  return L.divIcon({
    html: `<div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style="background-color: ${color}; color: white;">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
           </div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const getCapacityColor = (shelter: Shelter) => {
  if (shelter.status === 'full' || shelter.currentOccupancy >= shelter.totalCapacity) return '#EF4444'; // Red
  const pct = shelter.totalCapacity > 0 ? shelter.currentOccupancy / shelter.totalCapacity : 0;
  if (pct >= 0.85) return '#F59E0B'; // Orange
  return '#10B981'; // Green
};

interface DashboardMapProps {
  incidents: Incident[];
  shelters: Shelter[];
}

export default function DashboardMap({ incidents, shelters }: DashboardMapProps) {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');

  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  const center: [number, number] = shelters.length > 0
    ? [
        shelters.reduce((sum, s) => sum + s.location.lat, 0) / shelters.length,
        shelters.reduce((sum, s) => sum + s.location.lng, 0) / shelters.length,
      ]
    : defaultCenter;

  return (
    <div className="relative w-full h-full">
      {/* Map layer switcher overlay */}
      <div className="absolute top-3 right-3 z-[999] flex gap-0.5 bg-surface-secondary/95 backdrop-blur border border-surface-border p-1 rounded shadow-md">
        <button
          onClick={() => setMapType('streets')}
          className={`px-2 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer ${
            mapType === 'streets' ? 'bg-accent text-surface-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Streets
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-2 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer ${
            mapType === 'satellite' ? 'bg-accent text-surface-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Satellite
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={shelters.length > 0 ? 12 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {mapType === 'streets' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Shelters */}
        {shelters.map((shelter) => {
          const color = getCapacityColor(shelter);
          const occupancyPct = shelter.totalCapacity > 0
            ? Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100)
            : 0;

          return (
            <Marker
              key={shelter._id}
              position={[shelter.location.lat, shelter.location.lng]}
              icon={createShelterIcon(color)}
            >
              <Popup>
                <div className="min-w-[150px] text-xs space-y-1">
                  <h4 className="font-bold text-text-primary flex items-center gap-1">
                    <MapPin size={12} className="text-accent" />
                    {shelter.name}
                  </h4>
                  <p className="text-[10px] text-text-secondary">
                    Status: <span className="font-bold capitalize">{shelter.status}</span>
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Capacity: {shelter.currentOccupancy}/{shelter.totalCapacity} ({occupancyPct}%)
                  </p>
                  {shelter.contactInfo && (
                    <p className="text-[9px] text-text-muted mt-1">Contact: {shelter.contactInfo}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Incidents (Hazard Overlays) */}
        {incidents.map((inc) => {
          const radiusMeters = (inc.severity || 3) * 450;
          return (
            <Circle
              key={inc._id}
              center={[inc.location.lat, inc.location.lng]}
              radius={radiusMeters}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="min-w-[140px] text-xs space-y-1">
                  <h4 className="font-bold text-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Category: {inc.category}
                  </h4>
                  <p className="text-[10px] text-text-secondary">
                    Severity Level: <span className="font-bold">{inc.severity}/5</span>
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Status: <span className="font-bold capitalize">{inc.status}</span>
                  </p>
                  <p className="text-[9px] text-text-muted italic">{inc.description}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
