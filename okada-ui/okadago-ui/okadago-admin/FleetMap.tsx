import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import {
  MapPin, Navigation, Clock, User, RefreshCw, Filter,
  Wifi, WifiOff, Zap, Bike, Car
} from 'lucide-react';
import './_shared/tokens.css';

type RiderStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

type LiveRider = {
  riderId: string;
  userId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  status: RiderStatus;
  fullName?: string;
  vehiclePlate?: string;
  tripId?: string;
  lastUpdate?: string;
};

type ActiveRequest = {
  rideId: string;
  passengerName?: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress?: string;
  status: string;
  assignedRiderId?: string;
};

const STATUS_COLORS: Record<RiderStatus, { bg: string; border: string; text: string; label: string }> = {
  AVAILABLE: { bg: '#DCFCE7', border: '#22C55E', text: '#166534', label: 'Available' },
  BUSY: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: 'On Trip' },
  OFFLINE: { bg: '#F1F5F9', border: '#94A3B8', text: '#475569', label: 'Offline' },
};

export default function FleetMap() {
  const [riders, setRiders] = useState<LiveRider[]>([]);
  const [requests, setRequests] = useState<ActiveRequest[]>([]);
  const [filter, setFilter] = useState<'all' | RiderStatus>('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const mapRef = useRef<HTMLDivElement>(null);

  // Simulated real-time data fetch (in production, this would use WebSocket)
  const fetchLiveData = useCallback(async () => {
    // In production: subscribe to admin:fleet:subscribe via WebSocket
    // For now, simulate with empty data
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const filteredRiders = riders.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const stats = {
    total: riders.length,
    available: riders.filter((r) => r.status === 'AVAILABLE').length,
    busy: riders.filter((r) => r.status === 'BUSY').length,
    offline: riders.filter((r) => r.status === 'OFFLINE').length,
    activeRequests: requests.length,
  };

  return (
    <AdminLayout
      active="Fleet Map"
      title="Live Fleet Operations"
      breadcrumbs={['Operations', 'Fleet Map']}
      headerRight={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Last update: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchLiveData}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'var(--brand-yellow)', border: 'none', borderRadius: 6,
              padding: '5px 10px', color: '#111', fontSize: 11, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {/* ─── Map Area ──────────────────────────────────────── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              background: '#E5E7EB',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Map placeholder — in production, load Leaflet/Google Maps */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
            }}>
              <MapPin size={32} color="#94A3B8" />
              <span style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
                Fleet Map — {filteredRiders.length} riders
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                Connect WebSocket for live rider positions
              </span>
            </div>

            {/* Rider markers would render here */}
            {filteredRiders.map((rider) => (
              <div
                key={rider.riderId}
                style={{
                  position: 'absolute',
                  left: `${((rider.longitude + 0.2) / 0.1) * 100}%`,
                  top: `${((5.7 - rider.latitude) / 0.1) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: rider.status === 'AVAILABLE' ? 20 : rider.status === 'BUSY' ? 10 : 5,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 14,
                  background: STATUS_COLORS[rider.status].border,
                  border: `2px solid ${STATUS_COLORS[rider.status].bg}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transform: `rotate(${rider.heading ?? 0}deg)`,
                }}>
                  <Bike size={14} color="#FFF" style={{ transform: `rotate(-${rider.heading ?? 0}deg)` }} />
                </div>
              </div>
            ))}

            {/* Active request pickup markers */}
            {requests.map((req) => (
              <div
                key={req.rideId}
                style={{
                  position: 'absolute',
                  left: `${((req.pickupLongitude + 0.2) / 0.1) * 100}%`,
                  top: `${((5.7 - req.pickupLatitude) / 0.1) * 100}%`,
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
          </div>

          {/* Stats Bar Overlay */}
          <div style={{
            position: 'absolute', top: 12, left: 12, right: 12,
            display: 'flex', gap: 8, zIndex: 50,
          }}>
            {[
              { label: 'Total', value: stats.total, color: 'var(--text-primary)', icon: Bike },
              { label: 'Available', value: stats.available, color: '#22C55E', icon: Wifi },
              { label: 'On Trip', value: stats.busy, color: '#F59E0B', icon: Navigation },
              { label: 'Offline', value: stats.offline, color: '#94A3B8', icon: WifiOff },
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
            display: 'flex', gap: 4, zIndex: 50,
          }}>
            {(['all', 'AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: filter === status ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.95)',
                  color: filter === status ? '#111' : 'var(--text-secondary)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }}
              >
                {status === 'all' ? 'All Riders' : STATUS_COLORS[status].label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── Side Panel: Active Requests ────────────────────── */}
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
              background: requests.length > 0 ? '#EF4444' : 'var(--border)',
              color: requests.length > 0 ? '#FFF' : 'var(--text-muted)',
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            }}>
              {requests.length}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {requests.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)',
              }}>
                <MapPin size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: 13, margin: 0 }}>No active ride requests</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req.rideId} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 12, marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4,
                      background: req.assignedRiderId ? '#F59E0B' : '#EF4444',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {req.passengerName || 'Passenger'}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                      color: req.assignedRiderId ? '#F59E0B' : '#EF4444',
                    }}>
                      {req.assignedRiderId ? 'Assigned' : 'Searching'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                    {req.pickupAddress || 'Location'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Rider Legend */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              RIDER STATUS
            </h4>
            {Object.entries(STATUS_COLORS).map(([status, config]) => (
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
