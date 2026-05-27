import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Users, User, Bike, ShieldCheck, 
  Search, Filter, MoreHorizontal, Eye, Edit, Ban,
  TrendingUp, MapPin, Mail, Phone, Calendar
} from 'lucide-react';
import './_shared/tokens.css';

export default function UsersManagement() {
  const kpis = [
    { label: 'Total Users', value: '28,450', color: 'var(--text-primary)' },
    { label: 'Active Users', value: '22,180', detail: '78%', color: 'var(--success)' },
    { label: 'New This Month', value: '1,240', color: 'var(--info)' },
    { label: 'Suspended', value: '156', color: 'var(--danger)' },
    { label: 'Verified', value: '26,800', color: 'var(--brand-yellow)' },
  ];

  const users = [
    { id: '#USR-7821', name: 'Kofi Mensah', email: 'kofi.mensah@email.com', phone: '055 123 4567', type: 'Rider', typeColor: 'var(--brand-orange)', status: 'Active', statusColor: 'var(--success)', joined: '2024-01-15', lastActive: '2 mins ago', trips: 1245 },
    { id: '#USR-7822', name: 'Ama Serwaa', email: 'ama.serwaa@email.com', phone: '024 456 7890', type: 'Passenger', typeColor: 'var(--info)', status: 'Active', statusColor: 'var(--success)', joined: '2024-02-20', lastActive: '5 mins ago', trips: 42 },
    { id: '#USR-7823', name: 'Kwame Asare', email: 'kwame.asare@email.com', phone: '020 987 6543', type: 'Rider', typeColor: 'var(--brand-orange)', status: 'Suspended', statusColor: 'var(--danger)', joined: '2023-11-05', lastActive: '3 days ago', trips: 890 },
    { id: '#USR-7824', name: 'Akua Boakye', email: 'akua.boakye@email.com', phone: '054 321 0987', type: 'Passenger', typeColor: 'var(--info)', status: 'Active', statusColor: 'var(--success)', joined: '2024-03-12', lastActive: '1 hour ago', trips: 15 },
    { id: '#USR-7825', name: 'John Doe', email: 'john.doe@email.com', phone: '027 555 1234', type: 'Admin', typeColor: '#A855F7', status: 'Active', statusColor: 'var(--success)', joined: '2023-08-01', lastActive: 'Now', trips: 0 },
    { id: '#USR-7826', name: 'Esi Addo', email: 'esi.addo@email.com', phone: '055 999 0000', type: 'Passenger', typeColor: 'var(--info)', status: 'Active', statusColor: 'var(--success)', joined: '2024-04-05', lastActive: '12 mins ago', trips: 28 },
    { id: '#USR-7827', name: 'Yaw Boateng', email: 'yaw.boateng@email.com', phone: '024 111 2222', type: 'Rider', typeColor: 'var(--brand-orange)', status: 'Active', statusColor: 'var(--success)', joined: '2024-01-30', lastActive: '45 mins ago', trips: 567 },
    { id: '#USR-7828', name: 'Abena Mansa', email: 'abena.mansa@email.com', phone: '020 333 4444', type: 'Passenger', typeColor: 'var(--info)', status: 'Suspended', statusColor: 'var(--danger)', joined: '2024-02-10', lastActive: '1 week ago', trips: 8 },
    { id: '#USR-7829', name: 'Kojo Antwi', email: 'kojo.antwi@email.com', phone: '059 888 7777', type: 'Rider', typeColor: 'var(--brand-orange)', status: 'Active', statusColor: 'var(--success)', joined: '2023-12-20', lastActive: '3 hours ago', trips: 1102 },
    { id: '#USR-7830', name: 'Nana Yaw', email: 'nana.yaw@email.com', phone: '024 777 8888', type: 'Passenger', typeColor: 'var(--info)', status: 'Active', statusColor: 'var(--success)', joined: '2024-05-01', lastActive: '10 mins ago', trips: 5 },
  ];

  return (
    <AdminLayout active="Users Management" title="Users Management">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ color: kpi.color, fontSize: 18, fontWeight: 700 }}>{kpi.value}</div>
                {kpi.detail && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({kpi.detail})</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          {/* Main Table Area */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {['All Users', 'Passengers', 'Riders', 'Admins'].map((tab, i) => (
                <div key={tab} style={{ 
                  padding: '12px 16px', fontSize: 12, 
                  color: i === 0 ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                  borderBottom: i === 0 ? '2px solid var(--brand-yellow)' : 'none',
                  cursor: 'pointer', fontWeight: i === 0 ? 600 : 400
                }}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ padding: '15px 20px', display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  placeholder="Search users by name, email, phone..." 
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 30px', color: '#fff', fontSize: 12 }} 
                />
              </div>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
                <option>Status: All</option>
                <option>Active</option>
                <option>Suspended</option>
              </select>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
                <option>Joined Date</option>
              </select>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                <Filter size={14} /> Filter
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>User ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>User Info</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Joined Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Last Active</th>
                    <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Total Trips</th>
                    <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{user.id}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} style={{ color: 'var(--text-secondary)' }} />
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 4, 
                          background: `${user.typeColor}15`, color: user.typeColor,
                          fontSize: 10, fontWeight: 600
                        }}>
                          {user.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 4, 
                          background: `${user.statusColor}15`, color: user.statusColor,
                          fontSize: 10, fontWeight: 600
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{user.joined}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{user.lastActive}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>{user.trips}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                          <Eye size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                          <Edit size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                          <Ban size={14} style={{ color: 'var(--danger)', cursor: 'pointer' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Stats Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* User Growth */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: 0 }}>User Growth</h3>
                <span style={{ color: 'var(--success)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  <TrendingUp size={10} /> +12%
                </span>
              </div>
              <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                {[20, 35, 25, 45, 30, 55, 40, 65, 50, 80].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--info)', opacity: 0.6, borderRadius: '2px 2px 0 0' }}></div>
                ))}
              </div>
              <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Daily Avg</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>42</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Weekly Avg</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>285</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Retention</div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>86%</div>
                </div>
              </div>
            </div>

            {/* Top Locations */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 15px 0' }}>Top Locations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { city: 'Accra', pct: 45, color: 'var(--brand-orange)' },
                  { city: 'Kumasi', pct: 22, color: 'var(--brand-yellow)' },
                  { city: 'Tema', pct: 15, color: 'var(--info)' },
                  { city: 'Takoradi', pct: 10, color: 'var(--success)' },
                  { city: 'Other', pct: 8, color: 'var(--text-muted)' },
                ].map((loc, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{loc.city}</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>{loc.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${loc.pct}%`, background: loc.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Info */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 15px 0' }}>User Distribution</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, position: 'relative' }}>
                <svg viewBox="0 0 36 36" style={{ width: 100, height: 100 }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--info)" strokeWidth="4" strokeDasharray="70, 100" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand-orange)" strokeWidth="4" strokeDasharray="25, 100" strokeDashoffset="-70" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#A855F7" strokeWidth="4" strokeDasharray="5, 100" strokeDashoffset="-95" />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 800 }}>28.4k</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--info)' }}></div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Pass: 70%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--brand-orange)' }}></div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Riders: 25%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#A855F7' }}></div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Admin: 5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
