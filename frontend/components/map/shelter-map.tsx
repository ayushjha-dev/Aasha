'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shelter, Incident } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AlertTriangle, Locate, Navigation, CheckCircle } from 'lucide-react';

// Fix default marker icon issue with webpack/Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom styling for user location marker
const UserIcon = L.divIcon({
  html: `<div style="
    width: 32px; height: 32px;
    background: #3B82F6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(59,130,246,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
  "><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function getCapacityColor(shelter: Shelter): string {
  if (shelter.totalCapacity === 0) return '#64748B';
  const pct = (shelter.currentOccupancy / shelter.totalCapacity) * 100;
  if (pct >= 85) return '#DC2626';
  if (pct >= 60) return '#D97706';
  return '#16A34A';
}

function createShelterIcon(color: string) {
  return L.divIcon({
    html: `<div style="
      width: 24px; height: 24px;
      background: ${color};
      border: 2px solid rgba(255,255,255,0.9);
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

// Distance helper (degrees approximation for local routing)
function distance(p1: [number, number], p2: [number, number]): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

// Low-risk routing algorithm detouring around active incidents
function calculateSafeRoute(
  start: [number, number],
  end: [number, number],
  activeIncidents: Incident[]
): { path: [number, number][]; bypassedIncidentsCount: number; directBlocked: boolean } {
  const hazards = activeIncidents
    .filter((inc) => inc.status !== 'resolved')
    .map((inc) => ({
      center: [inc.location.lat, inc.location.lng] as [number, number],
      radius: (inc.severity || 3) * 0.0035, // in degrees (~350m per severity point)
      category: inc.category,
    }));

  let path: [number, number][] = [start, end];
  let directBlocked = false;
  let bypassedCount = 0;

  // Run up to 3 passes to avoid multiple circles
  for (let pass = 0; pass < 3; pass++) {
    let newPath: [number, number][] = [path[0]];
    let modified = false;

    for (let i = 0; i < path.length - 1; i++) {
      const s = path[i];
      const e = path[i + 1];

      // Find the first intersecting hazard for segment s-e
      let firstIntersection: any = null;
      let minT = 2;

      for (const h of hazards) {
        const dx = e[0] - s[0];
        const dy = e[1] - s[1];
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) continue;

        const t = Math.max(0, Math.min(1, ((h.center[0] - s[0]) * dx + (h.center[1] - s[1]) * dy) / len2));
        const cx = s[0] + t * dx;
        const cy = s[1] + t * dy;
        const dist = Math.sqrt((h.center[0] - cx) * (h.center[0] - cx) + (h.center[1] - cy) * (h.center[1] - cy));

        if (dist < h.radius) {
          if (t < minT) {
            minT = t;
            firstIntersection = { hazard: h, t, cx, cy, dx, dy, len2 };
          }
        }
      }

      if (firstIntersection) {
        if (pass === 0) directBlocked = true;
        modified = true;
        bypassedCount++;

        const h = firstIntersection.hazard;
        // Compute perpendicular vector to bypass
        const px = -firstIntersection.dy / Math.sqrt(firstIntersection.len2);
        const py = firstIntersection.dx / Math.sqrt(firstIntersection.len2);

        // Options: left detour or right detour
        const bypassDistance = h.radius * 1.35;
        const w1: [number, number] = [h.center[0] + px * bypassDistance, h.center[1] + py * bypassDistance];
        const w2: [number, number] = [h.center[0] - px * bypassDistance, h.center[1] - py * bypassDistance];

        // Pick bypass point that keeps route shorter and is away from hazard centers
        const d1 = distance(s, w1) + distance(w1, e);
        const d2 = distance(s, w2) + distance(w2, e);
        const selectedW = d1 < d2 ? w1 : w2;

        newPath.push(selectedW);
        newPath.push(e);
      } else {
        newPath.push(e);
      }
    }

    path = newPath;
    if (!modified) break;
  }

  return { path, bypassedIncidentsCount: bypassedCount, directBlocked };
}

interface ShelterMapProps {
  shelters: Shelter[];
  incidents?: Incident[];
  selectedShelter: Shelter | null;
  setSelectedShelter: (shelter: Shelter | null) => void;
}

export default function ShelterMap({
  shelters,
  incidents = [],
  selectedShelter,
  setSelectedShelter,
}: ShelterMapProps) {
  const { user } = useAuth();
  
  const defaultCenter: [number, number] = user?.location
    ? [user.location.lat, user.location.lng]
    : shelters.length > 0
    ? [
        shelters.reduce((sum, s) => sum + s.location.lat, 0) / shelters.length,
        shelters.reduce((sum, s) => sum + s.location.lng, 0) / shelters.length,
      ]
    : [28.6139, 77.2090];

  const [userLoc, setUserLoc] = useState<[number, number]>(defaultCenter);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');

  // Sync user location from profile context
  useEffect(() => {
    if (user?.location) {
      setUserLoc([user.location.lat, user.location.lng]);
    }
  }, [user]);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setUserLoc([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');

  // Calculate route if shelter is selected
  const route = selectedShelter
    ? calculateSafeRoute(userLoc, [selectedShelter.location.lat, selectedShelter.location.lng], activeIncidents)
    : null;

  // Approximate distance in km (1 degree ~ 111km)
  const kmDistance = selectedShelter
    ? (distance(userLoc, [selectedShelter.location.lat, selectedShelter.location.lng]) * 111).toFixed(2)
    : null;

  const routeKmDistance = route
    ? (route.path.reduce((acc, p, i) => {
        if (i === 0) return acc;
        return acc + distance(route.path[i - 1], p);
      }, 0) * 111).toFixed(2)
    : null;

  const triggerLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error fetching GPS coordinates:', error);
        }
      );
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row">
      {/* Map Element */}
      <div className="flex-1 relative min-h-[40vh] md:min-h-0">
        <MapContainer
          center={userLoc}
          zoom={13}
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

          <MapClickHandler />

          {/* User Current Location Marker */}
          <Marker position={userLoc} icon={UserIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-semibold text-xs text-blue-600 m-0">Your Location</p>
                <p className="text-[10px] text-text-secondary m-0 mt-0.5">
                  ({userLoc[0].toFixed(5)}, {userLoc[1].toFixed(5)})
                </p>
                <p className="text-[9px] text-text-muted m-0 mt-1">Click anywhere on the map to set a new standing position.</p>
              </div>
            </Popup>
          </Marker>

          {/* Render Shelters */}
          {shelters.map((shelter) => {
            const color = getCapacityColor(shelter);
            const pct = shelter.totalCapacity > 0
              ? Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100)
              : 0;

            return (
              <Marker
                key={shelter._id}
                position={[shelter.location.lat, shelter.location.lng]}
                icon={createShelterIcon(color)}
                eventHandlers={{
                  click: () => setSelectedShelter(shelter),
                }}
              >
                <Popup>
                  <div className="min-w-[160px] text-xs">
                    <h3 className="font-semibold text-text-primary m-0 mb-1">{shelter.name}</h3>
                    <p className="text-text-secondary m-0">
                      Capacity: {shelter.currentOccupancy}/{shelter.totalCapacity} ({pct}%)
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedShelter(shelter);
                      }}
                      className="mt-2 w-full btn-primary py-1 px-2 text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Navigation size={10} />
                      Navigate Here
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Render Hazard Circles (Active Incidents) */}
          {activeIncidents.map((inc) => {
            const radiusMeters = (inc.severity || 3) * 450;
            return (
              <Circle
                key={inc._id}
                center={[inc.location.lat, inc.location.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#EF4444',
                  fillColor: '#EF4444',
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              >
                <Popup>
                  <div className="text-xs p-1">
                    <div className="flex items-center gap-1 text-red-500 font-bold m-0 mb-1 uppercase tracking-wider text-[9px]">
                      <AlertTriangle size={12} />
                      Hazard Zone ({inc.category})
                    </div>
                    <p className="m-0 text-text-secondary">Severity: {inc.severity}/5</p>
                    <p className="m-0 text-[10px] text-text-muted mt-1 truncate max-w-[150px]">{inc.description}</p>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Route Rendering */}
          {route && selectedShelter && (
            <>
              {/* Direct Unsafe path (if direct blocked) */}
              {route.directBlocked && (
                <Polyline
                  positions={[userLoc, [selectedShelter.location.lat, selectedShelter.location.lng]]}
                  pathOptions={{
                    color: '#EF4444',
                    weight: 2,
                    dashArray: '5, 8',
                    opacity: 0.5,
                  }}
                />
              )}

              {/* Bypassed Safe Route */}
              <Polyline
                positions={route.path}
                pathOptions={{
                  color: '#10B981',
                  weight: 5,
                  opacity: 0.85,
                  lineJoin: 'round',
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Side Overlay / Direction Control Panel */}
      <div className="w-full md:w-64 bg-surface-secondary border-t md:border-t-0 md:border-l border-surface-border p-4 flex flex-col gap-4 overflow-y-auto z-10">
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Map Control Center</h3>
          <p className="text-[10px] text-text-secondary mt-0.5">Click the map to relocate your position.</p>
        </div>

        <button
          onClick={triggerLocate}
          className="btn-secondary py-1.5 flex items-center justify-center gap-1.5 text-xs w-full cursor-pointer"
        >
          <Locate size={14} />
          Locate Me (GPS)
        </button>

        <div className="border-t border-surface-border/50 my-1 flex flex-col gap-1.5 pt-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Map Layers</span>
          <div className="flex gap-1 bg-surface-primary rounded border border-surface-border p-0.5">
            <button
              onClick={() => setMapType('streets')}
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                mapType === 'streets' ? 'bg-accent text-surface-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`flex-1 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                mapType === 'satellite' ? 'bg-accent text-surface-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        <div className="border-t border-surface-border/50 my-1"></div>

        {selectedShelter ? (
          <div className="space-y-3">
            <div className="bg-surface-elevated/40 p-3 rounded border border-surface-border">
              <span className="text-[9px] text-text-muted block uppercase tracking-wider">Destination</span>
              <h4 className="text-xs font-bold text-text-primary mt-0.5">{selectedShelter.name}</h4>
              <p className="text-[10px] text-text-muted capitalize mt-0.5">Occupancy: {selectedShelter.currentOccupancy}/{selectedShelter.totalCapacity}</p>
            </div>

            <div className="bg-surface-elevated/40 p-3 rounded border border-surface-border space-y-2">
              <span className="text-[9px] text-text-muted block uppercase tracking-wider">Route Diagnostics</span>
              
              {route?.directBlocked ? (
                <div className="flex gap-2 text-xs items-start text-red-500 font-medium">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] leading-tight">Direct Path Blocked</p>
                    <p className="text-[9px] text-text-muted font-normal">Active hazard zones intersected. Detour routing applied.</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 text-xs items-start text-green-500 font-medium">
                  <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] leading-tight">Direct Route Clear</p>
                    <p className="text-[9px] text-text-muted font-normal">No active hazard circle overlaps detected.</p>
                  </div>
                </div>
              )}

              <div className="border-t border-surface-border/40 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Direct Distance:</span>
                  <span className="font-mono font-bold text-text-primary">{kmDistance} km</span>
                </div>
                {route?.directBlocked && (
                  <div className="flex justify-between text-green-500">
                    <span>Safe Route Length:</span>
                    <span className="font-mono font-bold">{routeKmDistance} km</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Avoided Hazards:</span>
                  <span className="font-mono font-bold text-red-400">{route?.bypassedIncidentsCount || 0}</span>
                </div>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${userLoc[0]},${userLoc[1]}&destination=${selectedShelter.location.lat},${selectedShelter.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer no-underline block text-center"
            >
              <Navigation size={12} className="text-surface-primary" />
              Open in Google Maps
            </a>

            <button
              onClick={() => setSelectedShelter(null)}
              className="w-full btn-secondary py-1 text-[10px] cursor-pointer"
            >
              Clear Route Selection
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 py-8 border border-dashed border-surface-border rounded bg-surface-elevated/20">
            <Navigation size={28} className="text-text-muted animate-bounce-subtle" />
            <p className="text-xs text-text-secondary font-medium mt-2">No Shelter Selected</p>
            <p className="text-[10px] text-text-muted mt-1 leading-normal">
              Click a shelter pin on the map to calculate a low-risk detour route.
            </p>
          </div>
        )}
      </div>
    </div>
  );}
