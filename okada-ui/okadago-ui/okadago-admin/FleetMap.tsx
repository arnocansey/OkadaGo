import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import {
  MapPin, Navigation, Clock, User, RefreshCw, Filter,
  Wifi, WifiOff, Zap, Bike, Shield, Layers, Activity
} from 'lucide-react';
import './_shared/tokens.css';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';

type RiderStatus = 'online' | 'offline';
type TripFilter = 'IDLE' | 'ON_TRIP' | '';

type AdminRider = {
  id: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  onlineStatus: boolean;
  tripStatus: string;
  serviceZoneId: string | null;
  user: { fullName: string; phoneE164: string };
};

type AdminRide = {
  id: string;
  status: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  pickupAddress: string;
  destinationAddress: string;
  routePolyline: string | null;
  serviceZoneId: string | null;
  rider: { id: string; user: { fullName: string } } | null;
  passenger: { id: string; user: { fullName: string } } | null;
};

type GeofenceFeature = {
  type: 'Feature';
  geometry: unknown;
  properties: { id: string; name: string; ridesEnabled: boolean; deliveriesEnabled: boolean };
};

type DemandFeature = {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    zoneId: string; zoneName: string; requestCount: number;
    availableRiders: number; surgeMultiplier: number; trend: string;
  };
};

const RIDER_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  online: { bg: '#DCFCE7', border: '#22C55E', label: 'Online' },
  offline: { bg: '#F1F5F9', border: '#94A3B8', label: 'Offline' },
};

const TRIP_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  IDLE: { bg: '#DCFCE7', border: '#22C55E', label: 'Idle' },
  ON_TRIP: { bg: '#FEF3C7', border: '#F59E0B', label: 'On Trip' },
};

export default function FleetMap() {
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [geofences, setGeofences] = useState<GeofenceFeature[]>([]);
  const [demand, setDemand] = useState<DemandFeature[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<'all' | RiderStatus>('all');
  const [tripFilter, setTripFilter] = useState<TripFilter>('');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showDemand, setShowDemand] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ridersRes, ridesRes, geofencesRes, demandRes] = await Promise.allSettled([
        fetch(`${BASE}/v1/admin/map/riders`, { credentials: 'include' }),
        fetch(`${BASE}/v1/admin/map/rides?status=SEARCHING`, { credentials: 'include' }),
        fetch(`${BASE}/v1/admin/map/geofences`, { credentials: 'include' }),
        fetch(`${BASE}/v1/admin/map/demand`, { credentials: 'include' }),
      ]);

      if (ridersRes.status === 'fulfilled' && ridersRes.value.ok) {
        const data = await ridersRes.value.json();
        setRiders(data.riders ?? []);
      }
      if (ridesRes.status === 'fulfilled' && ridesRes.value.ok) {
        const data = await ridesRes.value.json();
        setRides(data.rides ?? []);
      }
      if (geofencesRes.status === 'fulfilled' && geofencesRes.value.ok) {
        const data = await geofencesRes.value.json();
        setGeofences(data.features ?? []);
      }
      if (demandRes.status === 'fulfilled' && demandRes.value.ok) {
        const data = await demandRes.value.json();
        setDemand(data.features ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredRiders = riders.filter((r) => {
    if (statusFilter === 'online' && !r.onlineStatus) return false;
    if (statusFilter === 'offline' && r.onlineStatus) return false;
    if (tripFilter === 'IDLE' && r.tripStatus !== 'IDLE') return false;
    if (tripFilter === 'ON_TRIP' && r.tripStatus === 'IDLE') return false;
    return true;
  });

  const stats = {
    total: riders.length,
    online: riders.filter((r) => r.onlineStatus).length,
    offline: riders.filter((r) => !r.onlineStatus).length,
    idle: riders.filter((r) => r.tripStatus === 'IDLE' && r.onlineStatus).length,
    onTrip: riders.filter((r) => r.tripStatus !== 'IDLE' && r.onlineStatus).length,
    activeRequests: rides.length,
  };

  return (
    <AdminLayout
      active="Fleet Map"
      title="Live Fleet Operations"
      breadcrumbs={['Operations', 'Fleet Map']}
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--brand-yellow)', border: 'none', borderRadius: 6,
              padding: '5px 10px', color: '#111', fontSize: 11, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Map Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            ref={mapRef}
            style={{
              width: '100%', height: '100%',
              background: '#E5E7EB', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Map placeholder — integrate Leaflet/Google Maps in production */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
            }}>
              <MapPin size={32} color="#94A3B8" />
              <span style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
                Fleet Map — {filteredRiders.length} riders visible
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                Connect Leaflet or Google Maps for live view
              </span>
            </div>

            {/* Rider markers */}
            {filteredRiders.map((rider) => {
              if (!rider.currentLatitude || !rider.currentLongitude) return null;
              const isOnline = rider.onlineStatus;
              const style = isOnline ? RIDER_STYLE.online : RIDER_STYLE.offline;
              return (
                <div
                  key={rider.id}
                  title={`${rider.user.fullName} — ${rider.tripStatus}`}
                  style={{
                    position: 'absolute',
                    left: `${((rider.currentLongitude + 0.2) / 0.1) * 100}%`,
                    top: `${((5.7 - rider.currentLatitude) / 0.1) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isOnline ? 20 : 5,
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: style.border,
                    border: `2px solid ${style.bg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}>
                    <Bike size={14} color="#FFF" />
                  </div>
                </div>
              );
            })}

            {/* Active request pickup markers */}
            {rides.map((ride) => (
              <div
                key={ride.id}
                title={`${ride.passenger?.user.fullName ?? 'Passenger'} → ${ride.destinationAddress}`}
                style={{
                  position: 'absolute',
                  left: `${((ride.pickupLongitude + 0.2) / 0.1) * 100}%`,
                  top: `${((5.7 - ride.pickupLatitude) / 0.1) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 30,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 10,
                  background: '#EF4444',
                  border: '2px solid #FEE2E2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
                }}>
                  <span style={{ fontSize: 10, color: '#FFF', fontWeight: 900 }}>!</span>
                </div>
              </div>
            ))}

            {/* Geofence overlays */}
            {showGeofences && geofences.map((gf) => (
              <div
                key={gf.properties.id}
                title={gf.properties.name}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(34,197,94,0.1)', border: '1px dashed #22C55E',
                  borderRadius: 6, padding: '4px 8px', fontSize: 10, color: '#166534',
                }}
              >
                {gf.properties.name} — {geofences.length} zones loaded
              </div>
            ))}

            {/* Demand heat indicators */}
            {showDemand && demand.map((d) => (
              <div
                key={d.properties.zoneId}
                title={`${d.properties.zoneName}: ${d.properties.requestCount} requests, ${d.properties.surgeMultiplier}x surge`}
                style={{
                  position: 'absolute',
                  left: `${((d.geometry.coordinates[0] + 0.2) / 0.1) * 100}%`,
                  top: `${((5.7 - d.geometry.coordinates[1]) / 0.1) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 25,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 20,
                  background: d.properties.surgeMultiplier > 1.5
                    ? 'rgba(239,68,68,0.4)'
                    : d.properties.surgeMultiplier > 1
                      ? 'rgba(245,158,11,0.3)'
                      : 'rgba(34,197,94,0.2)',
                  border: `2px solid ${d.properties.surgeMultiplier > 1.5 ? '#EF4444' : d.properties.surgeMultiplier > 1 ? '#F59E0B' : '#22C55E'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#111',
                }}>
                  {d.properties.surgeMultiplier}x
                </div>
              </div>
            ))}
          </div>

          {/* Stats Bar */}
          <div style={{
            position: 'absolute', top: 12, left: 12, right: 12,
            display: 'flex', gap: 8, zIndex: 50, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Total', value: stats.total, color: 'var(--text-primary)', icon: Bike },
              { label: 'Online', value: stats.online, color: '#22C55E', icon: Wifi },
              { label: 'Idle', value: stats.idle, color: '#3B82F6', icon: Activity },
              { label: 'On Trip', value: stats.onTrip, color: '#F59E0B', icon: Navigation },
              { label: 'Requests', value: stats.activeRequests, color: '#EF4444', icon: Zap },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.95)', borderRadius: 8,
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid var(--border)',
              }}>
                <stat.icon size={14} style={{ color: stat.color }} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: 14, color: stat.color, fontWeight: 700 }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Controls */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            display: 'flex', gap: 4, zIndex: 50, flexWrap: 'wrap',
          }}>
            {(['all', 'online', 'offline'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: statusFilter === s ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.95)',
                  color: statusFilter === s ? '#111' : 'var(--text-secondary)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                {s === 'all' ? 'All' : s === 'online' ? 'Online' : 'Offline'}
              </button>
            ))}
            <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
            {(['', 'IDLE', 'ON_TRIP'] as const).map((t) => (
              <button
                key={t || 'any-trip'}
                onClick={() => setTripFilter(t)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: tripFilter === t ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.95)',
                  color: tripFilter === t ? '#111' : 'var(--text-secondary)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                {t === '' ? 'Any Trip' : t === 'IDLE' ? 'Idle' : 'On Trip'}
              </button>
            ))}
            <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
            <button
              onClick={() => setShowGeofences(!showGeofences)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: showGeofences ? '#DCFCE7' : 'rgba(255,255,255,0.95)',
                color: showGeofences ? '#166534' : 'var(--text-secondary)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Layers size={11} /> Zones
            </button>
            <button
              onClick={() => setShowDemand(!showDemand)}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: '1px solid var(--border)', cursor: 'pointer',
                background: showDemand ? '#FEF3C7' : 'rgba(255,255,255,0.95)',
                color: showDemand ? '#92400E' : 'var(--text-secondary)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <Activity size={11} /> Demand
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{
          width: 320, borderLeft: '1px solid var(--border)',
          background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Active Requests
            </h3>
            <span style={{
              background: rides.length > 0 ? '#EF4444' : 'var(--border)',
              color: rides.length > 0 ? '#FFF' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            }}>
              {rides.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {rides.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)',
              }}>
                <MapPin size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: 13, margin: 0 }}>No active ride requests</p>
              </div>
            ) : (
              rides.map((ride) => (
                <div key={ride.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 12, marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4,
                      background: ride.rider ? '#F59E0B' : '#EF4444',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ride.passenger?.user.fullName ?? 'Passenger'}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                      color: ride.rider ? '#F59E0B' : '#EF4444',
                    }}>
                      {ride.rider ? `→ ${ride.rider.user.fullName}` : 'Searching'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    📍 {ride.pickupAddress || 'Pickup'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    🏁 {ride.destinationAddress || 'Destination'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Demand Summary */}
          {showDemand && demand.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                DEMAND HEAT MAP
              </h4>
              {demand.slice(0, 5).map((d) => (
                <div key={d.properties.zoneId} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 4, fontSize: 11,
                }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.properties.zoneName}</span>
                  <span style={{
                    fontWeight: 700,
                    color: d.properties.surgeMultiplier > 1.5 ? '#EF4444' : d.properties.surgeMultiplier > 1 ? '#F59E0B' : '#22C55E',
                  }}>
                    {d.properties.surgeMultiplier}x · {d.properties.trend}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              RIDER STATUS
            </h4>
            {Object.entries(RIDER_STYLE).map(([status, config]) => (
              <div key={status} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 5,
                  background: config.border,
                }} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {config.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
