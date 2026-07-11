import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Users, Bike, MapPin, Clock, Navigation, Activity, MoreVertical, 
  ChevronRight, Search, Filter, ExternalLink, Smartphone,
  ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';
import './_shared/tokens.css';

interface Rider {
  name: string;
  id: string;
  location: string;
  locationTime: string;
  status: 'Online' | 'On Trip' | 'Idle' | 'Offline';
  speed: string;
  onlineTime: string;
  trips: number;
  distance: string;
  zone: string;
  rating: number;
  phone: string;
  earnings: string;
}

interface ActivityItem {
  type: string;
  desc: string;
  time: string;
  color: string;
  icon: any;
}

interface Toast {
  id: number;
  message: string;
  visible: boolean;
}

const allRiders: Rider[] = [
  { name: 'Kofi Mensah', id: 'RID124567', location: 'East Legon, Accra', locationTime: '2 min ago', status: 'Online', speed: '32 km/h', onlineTime: '5h 20m', trips: 12, distance: '98.6 km', zone: 'East Legon', rating: 4.8, phone: '055 123 4567', earnings: 'GHS 245.50' },
  { name: 'Ama Serwaa', id: 'RID124568', location: 'Osu, Accra', locationTime: '1 min ago', status: 'Online', speed: '28 km/h', onlineTime: '4h 45m', trips: 10, distance: '76.3 km', zone: 'Osu', rating: 4.9, phone: '050 987 6543', earnings: 'GHS 210.00' },
  { name: 'Kwame Asare', id: 'RID124569', location: 'Lapaz, Accra', locationTime: '3 min ago', status: 'On Trip', speed: '25 km/h', onlineTime: '6h 10m', trips: 15, distance: '112.4 km', zone: 'Lapaz', rating: 4.7, phone: '024 555 1234', earnings: 'GHS 312.75' },
  { name: 'Akua Boakye', id: 'RID124570', location: 'Tema, Greater Accra', locationTime: '2 min ago', status: 'Online', speed: '41 km/h', onlineTime: '5h 05m', trips: 9, distance: '82.1 km', zone: 'Tema', rating: 4.6, phone: '027 888 4321', earnings: 'GHS 198.30' },
  { name: 'Emmanuel Tetteh', id: 'RID124571', location: 'Nungua, Accra', locationTime: '4 min ago', status: 'Online', speed: '23 km/h', onlineTime: '3h 40m', trips: 7, distance: '64.2 km', zone: 'Nungua', rating: 4.5, phone: '054 321 7890', earnings: 'GHS 155.00' },
  { name: 'Esi Mensah', id: 'RID124572', location: 'Labadi, Accra', locationTime: '5 min ago', status: 'On Trip', speed: '18 km/h', onlineTime: '2h 30m', trips: 5, distance: '42.8 km', zone: 'Labadi', rating: 4.4, phone: '026 444 5678', earnings: 'GHS 120.50' },
  { name: 'Yaw Boateng', id: 'RID124573', location: 'Spintex, Accra', locationTime: '1 min ago', status: 'Online', speed: '35 km/h', onlineTime: '7h 15m', trips: 18, distance: '134.2 km', zone: 'Spintex', rating: 4.9, phone: '020 666 3456', earnings: 'GHS 405.25' },
  { name: 'Abena Osei', id: 'RID124574', location: 'Dansoman, Accra', locationTime: '3 min ago', status: 'Idle', speed: '0 km/h', onlineTime: '4h 50m', trips: 8, distance: '56.9 km', zone: 'Dansoman', rating: 4.3, phone: '055 777 8901', earnings: 'GHS 178.00' },
  { name: 'Nana Agyemang', id: 'RID124575', location: 'Madina, Accra', locationTime: '6 min ago', status: 'Online', speed: '22 km/h', onlineTime: '3h 55m', trips: 6, distance: '48.3 km', zone: 'Madina', rating: 4.2, phone: '024 888 2345', earnings: 'GHS 132.40' },
  { name: 'Adwoa Frimpong', id: 'RID124576', location: 'Kaneshie, Accra', locationTime: '2 min ago', status: 'On Trip', speed: '30 km/h', onlineTime: '5h 45m', trips: 14, distance: '105.7 km', zone: 'Kaneshie', rating: 4.7, phone: '027 999 6789', earnings: 'GHS 289.60' },
  { name: 'Kojo Annan', id: 'RID124577', location: 'Teshie, Accra', locationTime: '8 min ago', status: 'Offline', speed: '0 km/h', onlineTime: '0h 00m', trips: 0, distance: '0 km', zone: 'Teshie', rating: 4.1, phone: '054 111 3456', earnings: 'GHS 0.00' },
  { name: 'Afia Nyarko', id: 'RID124578', location: 'East Legon, Accra', locationTime: '1 min ago', status: 'Online', speed: '27 km/h', onlineTime: '6h 30m', trips: 11, distance: '89.5 km', zone: 'East Legon', rating: 4.6, phone: '020 222 7890', earnings: 'GHS 234.10' },
  { name: 'Kwesi Appiah', id: 'RID124579', location: 'Osu, Accra', locationTime: '4 min ago', status: 'Idle', speed: '0 km/h', onlineTime: '2h 10m', trips: 3, distance: '28.4 km', zone: 'Osu', rating: 3.9, phone: '055 333 5678', earnings: 'GHS 67.80' },
  { name: 'Akosua Mensah', id: 'RID124580', location: 'Lapaz, Accra', locationTime: '2 min ago', status: 'Online', speed: '19 km/h', onlineTime: '4h 20m', trips: 7, distance: '53.1 km', zone: 'Lapaz', rating: 4.4, phone: '024 444 1234', earnings: 'GHS 156.30' },
  { name: 'Kwadwo Sarpong', id: 'RID124581', location: 'Tema, Greater Accra', locationTime: '5 min ago', status: 'Online', speed: '38 km/h', onlineTime: '8h 00m', trips: 20, distance: '156.8 km', zone: 'Tema', rating: 4.8, phone: '027 555 6789', earnings: 'GHS 456.00' },
  { name: 'Ama Dadzie', id: 'RID124582', location: 'Nungua, Accra', locationTime: '1 min ago', status: 'On Trip', speed: '26 km/h', onlineTime: '3h 15m', trips: 5, distance: '41.2 km', zone: 'Nungua', rating: 4.3, phone: '054 666 8901', earnings: 'GHS 112.40' },
];

const recentActivity: ActivityItem[] = [
  { type: 'Trip Completed', desc: 'East Legon to Osu', time: '02:25 PM', color: 'var(--success)', icon: Bike },
  { type: 'Went Online', desc: 'East Legon, Accra', time: '01:45 PM', color: 'var(--info)', icon: Activity },
  { type: 'Location Update', desc: 'Near Accra Mall', time: '01:40 PM', color: 'var(--brand-yellow)', icon: MapPin },
  { type: 'Location Update', desc: 'Boundary Rd, East Legon', time: '01:20 PM', color: 'var(--brand-yellow)', icon: MapPin },
  { type: 'Went Offline', desc: 'Accra Mall', time: '12:10 PM', color: 'var(--danger)', icon: Activity },
];

const tabs = ['Live Map', 'Rider Activity Feed', 'Geofence Zones', 'Heatmap'];
const quickFilters = ['All Riders', 'Online Only', 'On Trip', 'Idle'];
const PAGE_SIZE = 8;

function Star(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill={props.fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={props.style}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

export default function ActivityTracking() {
  const [activeTab, setActiveTab] = useState('Live Map');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('All Riders');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, visible: true }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 2500);
  }, []);

  const filteredRiders = allRiders.filter(rider => {
    const matchesSearch = searchQuery === '' ||
      rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.zone.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (quickFilter === 'Online Only') matchesFilter = rider.status === 'Online';
    else if (quickFilter === 'On Trip') matchesFilter = rider.status === 'On Trip';
    else if (quickFilter === 'Idle') matchesFilter = rider.status === 'Idle' || rider.status === 'Offline';

    if (activeTab === 'Rider Activity Feed') matchesFilter = rider.status !== 'Offline';
    else if (activeTab === 'Geofence Zones') matchesFilter = true;
    else if (activeTab === 'Heatmap') matchesFilter = rider.status === 'Online' || rider.status === 'On Trip';

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredRiders.length / PAGE_SIZE);
  const paginatedRiders = filteredRiders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedRiderData = selectedRider !== null ? allRiders[selectedRider] : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, quickFilter, activeTab]);

  const stats = [
    { label: 'Total Active Riders', value: '1,876', change: '12.6%', up: true, icon: Users, color: 'var(--brand-orange)' },
    { label: 'Total Trips', value: '23,456', change: '8.7%', up: true, icon: Bike, color: 'var(--success)' },
    { label: 'Total Distance', value: '125,340 km', change: '11.3%', up: true, icon: MapPin, color: 'var(--info)' },
    { label: 'Total Online Hours', value: '8,750 h', change: '9.5%', up: true, icon: Clock, color: 'var(--brand-yellow)' },
    { label: 'Avg. Online Time / Rider', value: '4h 40m', change: '6.2%', up: true, icon: Activity, color: 'var(--warning)' },
  ];

  const mapMarkers = [
    { t: '35%', l: '45%', loc: 'Lapaz', size: 20 },
    { t: '28%', l: '55%', loc: 'East Legon', size: 22 },
    { t: '45%', l: '35%', loc: 'Dansoman', size: 16 },
    { t: '50%', l: '55%', loc: 'Osu', size: 18 },
    { t: '22%', l: '60%', loc: 'Madina', size: 16 },
    { t: '55%', l: '65%', loc: 'Teshie', size: 14 },
    { t: '35%', l: '25%', loc: 'Kaneshie', size: 14 },
  ];

  const legendItems = [
    { label: 'High Activity', color: 'var(--success)' },
    { label: 'Medium Activity', color: 'var(--brand-yellow)' },
    { label: 'Low Activity', color: 'var(--danger)' },
    { label: 'Offline', color: 'var(--text-muted)' },
  ];

  const btnBase: React.CSSProperties = { transition: 'all 0.15s ease' };
  const hoverStyle = ':hover { opacity: 0.85; transform: scale(1.01); }';

  return (
    <AdminLayout active="Activity Tracking" title="Rider Activity Tracking" breadcrumbs={['Riders Management', 'Activity Tracking']}>
      <style>{`
        .at-btn:hover { opacity: 0.85; transform: scale(1.02); }
        .at-btn:active { transform: scale(0.98); }
        .at-tab:hover { background: rgba(255,255,255,0.03); }
        .at-marker:hover { transform: scale(1.3); box-shadow: 0 0 20px var(--brand-orange) !important; }
        .at-table-row:hover { background: rgba(255,255,255,0.03); }
        .at-legend-item:hover { opacity: 0.7; cursor: pointer; }
        .at-toast { transition: all 0.3s ease; }
        .at-filter-btn:hover { opacity: 0.85; }
        .at-view-btn:hover { opacity: 0.85; }
        .at-card:hover { border-color: rgba(255,255,255,0.1); }
      `}</style>

      {/* Toast Container */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="at-toast"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--brand-yellow)',
              borderRadius: 8,
              padding: '10px 16px',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              opacity: toast.visible ? 1 : 0,
              transform: toast.visible ? 'translateX(0)' : 'translateX(40px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              pointerEvents: toast.visible ? 'auto' : 'none',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-yellow)', flexShrink: 0 }} />
            {toast.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="at-btn"
              style={{ ...btnBase, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => showToast('Opening filters panel...')}
            >
              <Filter size={14} /> Filters
            </button>
          </div>
          <button
            className="at-btn"
            style={{ ...btnBase, background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => showToast('Exporting activity report...')}
          >
            <ArrowUpRight size={14} /> Export Report
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} className="at-card" style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', transition: 'border-color 0.15s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: stat.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  <ArrowUpRight size={10} />
                  {stat.change}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs Apr 1 – Apr 30</span>
              </div>
            </div>
          ))}
        </div>

        {/* Map Section */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            {tabs.map((tab) => (
              <div
                key={tab}
                className="at-tab"
                style={{ 
                  padding: '14px 16px', fontSize: 12,
                  color: activeTab === tab ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--brand-yellow)' : 'none',
                  cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => { setActiveTab(tab); showToast(`Switching to ${tab} view`); }}
              >
                {tab}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 480 }}>
            {/* Map */}
            <div style={{ background: '#0a0a0a', position: 'relative', borderRight: '1px solid var(--border)' }}>
              {/* Top badges */}
              <div style={{ position: 'absolute', top: 15, left: 15, right: 15, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: 'rgba(28,28,30,0.9)', padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} /> 1,876 Riders Online
                  </div>
                </div>
                <button
                  className="at-btn"
                  style={{ background: 'rgba(28,28,30,0.9)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: '#fff', fontSize: 11, cursor: 'pointer' }}
                  onClick={() => showToast('Refreshing map data...')}
                >⟳</button>
              </div>

              {/* Map markers */}
              {mapMarkers.map((m, i) => (
                <div
                  key={i}
                  className="at-marker"
                  style={{ position: 'absolute', top: m.t, left: m.l, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.15s ease', zIndex: 5 }}
                  onClick={() => showToast(`Showing rider details in ${m.loc}...`)}
                >
                  <div style={{ width: m.size, height: m.size, borderRadius: '50%', background: 'var(--brand-orange)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px var(--brand-orange)' }}>
                    <Bike size={m.size * 0.5} color="#fff" />
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, background: 'rgba(28,28,30,0.9)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {legendItems.map(l => (
                    <div
                      key={l.label}
                      className="at-legend-item"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.15s ease' }}
                      onClick={() => showToast(`Filtering by ${l.label}...`)}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
              {/* Quick Filters */}
              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: '0 0 10px 0' }}>Quick Filters</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {quickFilters.map(f => (
                    <button
                      key={f}
                      className="at-filter-btn"
                      style={{ background: quickFilter === f ? 'var(--brand-yellow)' : '#111', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', fontSize: 10, color: quickFilter === f ? '#111' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onClick={() => { setQuickFilter(f); showToast(`Filtering riders: ${f}`); }}
                    >{f}</button>
                  ))}
                </div>
              </div>

              {/* Selected Rider Detail Panel */}
              {selectedRiderData ? (
                <div style={{ background: '#111', borderRadius: 12, border: '1px solid var(--border)', padding: 15 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>{selectedRiderData.name[0]}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{selectedRiderData.name}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--brand-yellow)', fontSize: 10 }}><Star size={8} fill="currentColor" /> {selectedRiderData.rating}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{selectedRiderData.id}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}><Smartphone size={10} /> {selectedRiderData.phone}</div>
                      </div>
                    </div>
                    <span style={{ padding: '3px 8px', background: selectedRiderData.status === 'Online' ? 'rgba(34,197,94,0.1)' : selectedRiderData.status === 'On Trip' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)', color: selectedRiderData.status === 'Online' ? 'var(--success)' : selectedRiderData.status === 'On Trip' ? 'var(--brand-yellow)' : 'var(--danger)', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{selectedRiderData.status}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 15 }}>
                    {[
                      { label: "Today's Trips", val: String(selectedRiderData.trips) },
                      { label: 'Online Time', val: selectedRiderData.onlineTime },
                      { label: 'Distance', val: selectedRiderData.distance },
                      { label: 'Earnings', val: selectedRiderData.earnings },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>{s.label}</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: 15 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Current Location</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={12} color="var(--brand-orange)" /> {selectedRiderData.location}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 2 }}>Last Updated: {selectedRiderData.locationTime}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="at-btn"
                      style={{ flex: 1, background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => showToast('Opening full rider profile...')}
                    >View Rider Profile</button>
                    <button
                      className="at-btn"
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '10px', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => setSelectedRider(null)}
                    >Close</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#111', borderRadius: 12, border: '1px solid var(--border)', padding: 15, textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Select a rider to view details</div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: 0 }}>Recent Activity</h4>
                  <span
                    style={{ color: 'var(--brand-yellow)', fontSize: 10, cursor: 'pointer' }}
                    onClick={() => showToast('Loading all activity...')}
                  >View All</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recentActivity.map((a, i) => (
                    <div
                      key={i}
                      style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: '4px 0', borderRadius: 4, transition: 'opacity 0.15s ease' }}
                      onClick={() => showToast(`Opening ${a.type.toLowerCase()} details...`)}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{a.type}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{a.desc}</div>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 9, flexShrink: 0 }}>{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'center', marginTop: 5 }}>Showing latest 5 activities</div>
            </div>
          </div>
        </div>

        {/* Active Riders Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Active Riders (Live)</h3>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search rider by name, ID, or zone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px 6px 32px', fontSize: 11, color: '#fff', outline: 'none', width: 240 }}
              />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Rider', 'Location', 'Status', 'Speed', 'Online Time', "Today's Trips", 'Distance Today', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRiders.map((row, i) => {
                const globalIdx = allRiders.indexOf(row);
                const isSelected = selectedRider === globalIdx;
                return (
                  <tr
                    key={row.id}
                    className="at-table-row"
                    style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'rgba(234,179,8,0.05)' : undefined, transition: 'background 0.15s ease', cursor: 'pointer' }}
                    onClick={() => { setSelectedRider(globalIdx); showToast(`Viewing ${row.name} activity`); }}
                  >
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{row.name[0]}</span>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{row.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{row.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{row.location}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{row.locationTime}</div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: row.status === 'Online' ? 'rgba(34,197,94,0.1)' : row.status === 'On Trip' ? 'rgba(234,179,8,0.1)' : row.status === 'Idle' ? 'rgba(148,163,184,0.1)' : 'rgba(239,68,68,0.1)', color: row.status === 'Online' ? 'var(--success)' : row.status === 'On Trip' ? 'var(--brand-yellow)' : row.status === 'Idle' ? 'var(--text-secondary)' : 'var(--danger)', fontSize: 10, fontWeight: 700 }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.speed}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.onlineTime}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.trips}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.distance}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: 10 }} onClick={e => e.stopPropagation()}>
                        <button
                          className="at-view-btn"
                          style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 4, padding: '4px 12px', color: '#111', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                          onClick={() => { setSelectedRider(globalIdx); showToast('Loading activity history...'); }}
                        >View History</button>
                        <button
                          className="at-view-btn"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                          onClick={() => showToast(`Opening ${row.name} profile...`)}
                        ><MoreVertical size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedRiders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No riders match your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              Showing {filteredRiders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredRiders.length)} of {filteredRiders.length} riders
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="at-btn"
                style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); showToast('Loading previous page...'); }}
              >←</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    className="at-btn"
                    style={{ width: 28, height: 28, borderRadius: 4, background: currentPage === page ? 'var(--brand-yellow)' : 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === page ? '#111' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { setCurrentPage(page); showToast(`Loading page ${page}...`); }}
                  >{page}</button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 11 }}>...</span>
              )}
              {totalPages > 5 && (
                <button
                  className="at-btn"
                  style={{ width: 28, height: 28, borderRadius: 4, background: currentPage === totalPages ? 'var(--brand-yellow)' : 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === totalPages ? '#111' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => { setCurrentPage(totalPages); showToast(`Loading page ${totalPages}...`); }}
                >{totalPages}</button>
              )}
              <button
                className="at-btn"
                style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); showToast('Loading next page...'); }}
              >→</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}