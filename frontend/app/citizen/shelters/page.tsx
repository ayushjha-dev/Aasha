'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Shelter, Incident } from '@/lib/types';
import { MapPin, Phone, Package, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy-load the map component (Leaflet is heavy)
const ShelterMap = dynamic(() => import('@/components/map/shelter-map'), {
  ssr: false,
  loading: () => (
    <div className="aspect-[16/9] bg-surface-primary rounded flex items-center justify-center border border-surface-border">
      <p className="text-text-muted text-sm">Loading map...</p>
    </div>
  ),
});

export default function CitizenSheltersPage() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shelterRes, incidentRes] = await Promise.all([
          api.get('/shelters'),
          api.get('/incidents/all'),
        ]);
        setShelters(shelterRes.data.shelters || []);
        setIncidents(incidentRes.data.incidents || []);
      } catch (error) {
        console.error('Failed to fetch shelters or incidents:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse-subtle text-text-secondary">Loading shelters...</div>
      </div>
    );
  }

  const getCapacityColor = (shelter: Shelter) => {
    if (shelter.totalCapacity === 0) return 'text-text-muted';
    const pct = (shelter.currentOccupancy / shelter.totalCapacity) * 100;
    if (pct >= 85) return 'text-shelter-full';
    if (pct >= 60) return 'text-shelter-filling';
    return 'text-shelter-available';
  };

  const getCapacityBg = (shelter: Shelter) => {
    if (shelter.totalCapacity === 0) return 'bg-surface-elevated';
    const pct = (shelter.currentOccupancy / shelter.totalCapacity) * 100;
    if (pct >= 85) return 'bg-shelter-full';
    if (pct >= 60) return 'bg-shelter-filling';
    return 'bg-shelter-available';
  };

  return (
    <div className={`animate-slide-up flex flex-col relative w-full ${view === 'map' ? 'h-[calc(100vh-112px)] md:h-screen p-0 overflow-hidden' : 'p-4 md:p-6'}`}>
      {view === 'map' ? (
        <div className="relative w-full h-full flex flex-col">
          {/* Floating Top Header Panel */}
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-[999] flex items-center gap-4 bg-surface-secondary/95 backdrop-blur border border-surface-border p-3 rounded-lg shadow-lg max-w-sm">
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-widest font-semibold">Emergency Shelters</p>
              <h1 className="text-xs font-bold text-text-primary mt-0.5">Find Shelter</h1>
            </div>
            <div className="flex items-center gap-0.5 bg-surface-primary rounded border border-surface-border ml-auto">
              <button
                onClick={() => setView('map')}
                className="px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer bg-accent text-surface-primary"
              >
                Map
              </button>
              <button
                onClick={() => setView('list')}
                className="px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              >
                List
              </button>
            </div>
          </div>

          <div className="w-full h-full">
            <ShelterMap
              shelters={shelters}
              incidents={incidents}
              selectedShelter={selectedShelter}
              setSelectedShelter={setSelectedShelter}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-label">Emergency Shelters</p>
              <h1 className="text-heading-xl mt-1">Find Shelter</h1>
            </div>
            <div className="flex items-center gap-1 bg-surface-secondary rounded border border-surface-border">
              <button
                onClick={() => setView('map')}
                className="px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              >
                Map
              </button>
              <button
                onClick={() => setView('list')}
                className="px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer bg-accent text-surface-primary"
              >
                List
              </button>
            </div>
          </div>
        <div className="space-y-3">
          {shelters.length === 0 ? (
            <div className="card p-8 text-center">
              <MapPin size={32} className="text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary">No shelters available</p>
            </div>
          ) : (
            shelters.map((shelter) => {
              const pct = shelter.totalCapacity > 0
                ? Math.round((shelter.currentOccupancy / shelter.totalCapacity) * 100)
                : 0;
              return (
                <div key={shelter._id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{shelter.name}</h3>
                      <p className="text-xs text-text-muted mt-0.5 capitalize">
                        Status: {shelter.status}
                      </p>
                    </div>
                    <span className={`text-sm font-bold font-display ${getCapacityColor(shelter)}`}>
                      {pct}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${getCapacityBg(shelter)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {shelter.location.lat.toFixed(3)}, {shelter.location.lng.toFixed(3)}
                    </span>
                    <span>
                      {shelter.currentOccupancy}/{shelter.totalCapacity} occupied
                    </span>
                    {shelter.contactInfo && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {shelter.contactInfo}
                      </span>
                    )}
                  </div>

                  {shelter.resourcesAvailable.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Package size={12} className="text-text-muted" />
                      {shelter.resourcesAvailable.map((r, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedShelter(shelter);
                      setView('map');
                    }}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 mt-3 cursor-pointer"
                  >
                    <Navigation size={12} />
                    Navigate on Map
                  </button>
                </div>
              );
            })
          )}
        </div>
        </>
      )}
    </div>
  );
}
