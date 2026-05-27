import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Users, 
  Bike, 
  MapPin, 
  Clock, 
  Navigation, 
  Activity, 
  MoreVertical, 
  ChevronRight, 
  Search, 
  Filter,
  ExternalLink,
  Smartphone
} from 'lucide-react';

export default function ActivityTracking() {
  const stats = [
    { label: 'Active Riders', value: '1,876', icon: Bike, color: 'var(--brand-orange)' },
    { label: 'Total Trips', value: '23,456', icon: Navigation, color: 'var(--success)' },
    { label: 'Total Distance', value: '125,340km', icon: MapPin, color: 'var(--info)' },
    { label: 'Total Online Hours', value: '8,750h', icon: Clock, color: 'var(--brand-yellow)' },
    { label: 'Avg Online Time', value: '4h 40m', icon: Activity, color: 'var(--warning)' },
  ];

  const tabs = ['Live Map', 'Rider Activity Feed', 'Geofence Zones', 'Heatmap'];

  const activeRiders = [
    { name: 'Kofi Mensah', location: 'East Legon', status: 'Online', speed: '32km/h', onlineTime: '5h 20m', trips: 12, distance: '98.6km' },
    { name: 'Ama Serwaa', location: 'Osu', status: 'Online', speed: '28km/h', onlineTime: '4h 45m', trips: 9, distance: '65.2km' },
    { name: 'Kwame Asare', location: 'Lapaz', status: 'Online', speed: '25km/h', onlineTime: '6h 10m', trips: 15, distance: '112.4km' },
    { name: 'Akua Boakye', location: 'Tema', status: 'Online', speed: '41km/h', onlineTime: '3h 30m', trips: 7, distance: '82.1km' },
    { name: 'Emmanuel Tetteh', location: 'Nungua', status: 'Online', speed: '23km/h', onlineTime: '5h 50m', trips: 10, distance: '74.8km' },
  ];

  const recentActivity = [
    { type: 'Trip Completed', time: '14:25', desc: 'RID124567 completed trip #902345' },
    { type: 'Went Online', time: '14:20', desc: 'RID124578 is now active in Osu' },
    { type: 'Location Update', time: '14:18', desc: 'RID124567 reached East Legon' },
    { type: 'Location Update', time: '14:15', desc: 'RID124567 left Lapaz' },
    { type: 'Went Offline', time: '14:10', desc: 'RID124582 is now offline' },
  ];

  return (
    <AdminLayout active="Activity Tracking" title="Activity Tracking" breadcrumbs={['Riders Management', 'Activity Tracking']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={14} color={stat.color} />
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{stat.label}</span>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs and Map Section */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 25, padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
            {tabs.map((tab, i) => (
              <div key={tab} style={{ 
                padding: '15px 0', fontSize: 13, color: i === 0 ? 'var(--brand-yellow)' : 'var(--text-muted)', 
                fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', borderBottom: i === 0 ? '2px solid var(--brand-yellow)' : 'none' 
              }}>
                {tab}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', height: 450 }}>
            {/* Map Placeholder */}
            <div style={{ background: '#0a0a0a', position: 'relative', borderRight: '1px solid var(--border)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 15, zIndex: 10, display: 'flex', gap: 10 }}>
                <div style={{ background: 'rgba(28,28,30,0.8)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} /> 1,876 Online
                </div>
                <div style={{ background: 'rgba(28,28,30,0.8)', padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} /> 356 Offline
                </div>
              </div>

              {/* Legend */}
              <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, background: 'rgba(28,28,30,0.8)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'High Activity', color: 'var(--brand-orange)' },
                    { label: 'Medium Activity', color: 'var(--brand-yellow)' },
                    { label: 'Low Activity', color: 'var(--info)' },
                    { label: 'Offline', color: 'var(--text-muted)' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map Icons (scattered) */}
              {[
                { t: '30%', l: '40%', loc: 'Lapaz' },
                { t: '45%', l: '60%', loc: 'East Legon' },
                { t: '60%', l: '35%', loc: 'Dansoman' },
                { t: '55%', l: '50%', loc: 'Osu' },
                { t: '25%', l: '70%', loc: 'Madina' },
                { t: '70%', l: '80%', loc: 'Teshie' },
                { t: '40%', l: '20%', loc: 'Kaneshie' },
              ].map((m, i) => (
                <div key={i} style={{ position: 'absolute', top: m.t, left: m.l, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                   <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-orange)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px var(--brand-orange)' }}>
                      <Bike size={12} color="#fff" />
                   </div>
                   <div style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, color: '#fff', fontSize: 8, marginTop: 4 }}>{m.loc}</div>
                </div>
              ))}
            </div>

            {/* Quick Filters / Context Panel */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: 0 }}>Quick Filters</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['All Riders', 'Online', 'Offline', 'High Activity', 'Low Activity'].map(f => (
                    <button key={f} style={{ background: f === 'All Riders' ? 'var(--brand-yellow)' : '#111', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: f === 'All Riders' ? '#111' : 'var(--text-secondary)', fontWeight: 600 }}>{f}</button>
                  ))}
                </div>
              </div>

              <div style={{ background: '#111', borderRadius: 12, border: '1px solid var(--border)', padding: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff' }}>K</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>Kofi Mensah</span>
                      <span style={{ padding: '2px 6px', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', borderRadius: 4, fontSize: 8, fontWeight: 700 }}>Online</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>RID124567</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Trips Today</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>12</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Online Time</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>5h 20m</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Distance</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>98.6km</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Earnings</div>
                    <div style={{ color: 'var(--brand-yellow)', fontSize: 14, fontWeight: 700 }}>GHS 245.50</div>
                  </div>
                </div>
                <div style={{ marginBottom: 15 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Current Location</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={12} color="var(--brand-orange)" /> East Legon, Accra
                  </div>
                </div>
                <button style={{ width: '100%', background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View Rider Profile</button>
              </div>

              <div>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Recent Activity</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {recentActivity.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.type.includes('Online') ? 'var(--success)' : a.type.includes('Offline') ? 'var(--danger)' : 'var(--info)', marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{a.type} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {a.time}</span></div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Table: Active Riders (Live) */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Active Riders (Live)</h3>
            <div style={{ display: 'flex', gap: 10 }}>
               <div style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input type="text" placeholder="Search live riders..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 11 }} />
               </div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Rider', 'Location', 'Status', 'Speed', 'Online Time', "Today's Trips", 'Distance Today', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRiders.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{row.name[0]}</div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 12 }}>{row.location}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: 'var(--success)', fontSize: 10, fontWeight: 700 }}>{row.status}</span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.speed}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.onlineTime}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.trips}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.distance}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer' }}>Track</button>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreVertical size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 20px', textAlign: 'center' }}>
            <button style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', fontSize: 11, cursor: 'pointer' }}>View All 1,876 Active Riders</button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
