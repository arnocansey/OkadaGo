import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Users, Bike, ClipboardList, DollarSign, 
  AlertCircle, Star, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Clock, MapPin, CheckCircle2, AlertTriangle, Info,
  UserPlus
} from 'lucide-react';
import './_shared/tokens.css';

export default function Dashboard() {
  const kpis = [
    { label: 'Total Riders', value: '2,350', change: '+14.6%', icon: Bike, color: 'var(--brand-orange)', up: true },
    { label: 'Active Today', value: '1,876', change: '+12.6%', icon: CheckCircle2, color: 'var(--success)', up: true },
    { label: 'Total Trips Today', value: '8,450', change: '+18.2%', icon: ClipboardList, color: 'var(--info)', up: true },
    { label: 'Revenue Today', value: 'GHS 45,200', change: '+22.1%', icon: DollarSign, color: 'var(--brand-yellow)', up: true },
    { label: 'Pending Issues', value: '48', change: '-5.2%', icon: AlertCircle, color: 'var(--danger)', up: false },
    { label: 'Avg Rating', value: '4.7', change: '+0.2', icon: Star, color: 'var(--warning)', up: true },
  ];

  const recentRides = [
    { id: '#REQ-240531-881', rider: 'Kofi Mensah', passenger: 'Ama Serwaa', route: 'East Legon → Airport City', status: 'Active', time: '14:25', amount: 'GHS 25.50' },
    { id: '#REQ-240531-880', rider: 'Kwame Asare', passenger: 'John Doe', route: 'Lapaz → Circle', status: 'Completed', time: '14:10', amount: 'GHS 18.00' },
    { id: '#REQ-240531-879', rider: 'Akua Boakye', passenger: 'Esi Addo', route: 'Osu → Labadi', status: 'Completed', time: '13:55', amount: 'GHS 15.00' },
    { id: '#REQ-240531-878', rider: 'Emmanuel Tetteh', passenger: 'Yaw Boateng', route: 'Madina → Adenta', status: 'Active', time: '14:32', amount: 'GHS 22.00' },
    { id: '#REQ-240531-877', rider: 'Nana Yaw', passenger: 'Mansa Musa', route: 'Dansoman → Kaneshie', status: 'Completed', time: '13:40', amount: 'GHS 20.00' },
  ];

  const topRiders = [
    { name: 'Kofi Mensah', trips: 42, earnings: 'GHS 845.50', rank: 1 },
    { name: 'Ama Serwaa', trips: 38, earnings: 'GHS 782.20', rank: 2 },
    { name: 'Kwame Asare', trips: 35, earnings: 'GHS 710.00', rank: 3 },
  ];

  return (
    <AdminLayout active="Dashboard" title="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: '0 0 4px 0' }}>Welcome back, Admin!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>Here's what's happening today.</p>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={16} style={{ color: kpi.color }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: kpi.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {kpi.change}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>{kpi.label}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)', height: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Revenue Overview</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-orange)' }}></div> Revenue (GHS)</div>
              </div>
            </div>
            {/* Simple Line Chart Placeholder */}
            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 40, paddingBottom: 20, position: 'relative' }}>
              {[30, 45, 35, 60, 50, 80, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-orange)', position: 'absolute', bottom: `${h}%`, zIndex: 2 }}></div>
                  <div style={{ position: 'absolute', bottom: 0, fontSize: 10, color: 'var(--text-muted)' }}>{['M','T','W','T','F','S','S'][i]}</div>
                </div>
              ))}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <path d="M 40 126 L 108 99 L 176 117 L 244 72 L 312 90 L 380 36 L 448 54" fill="none" stroke="var(--brand-orange)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)', height: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Trips Overview</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 8, height: 8, background: 'var(--brand-yellow)' }}></div> Trips Count</div>
              </div>
            </div>
            {/* Simple Bar Chart Placeholder */}
            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 20, paddingBottom: 20 }}>
              {[40, 65, 55, 80, 75, 95, 85].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', height: `${h}%`, background: 'var(--brand-yellow)', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{['M','T','W','T','F','S','S'][i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'New Riders Today', value: '24', icon: UserPlus, color: 'var(--info)' },
            { label: 'Verifications Pending', value: '18', icon: Clock, color: 'var(--warning)' },
            { label: 'Active Promotions', value: '3', icon: TrendingUp, color: 'var(--success)' },
            { label: 'Suspended Riders', value: '36', icon: AlertTriangle, color: 'var(--danger)' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: '12px 15px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{stat.label}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Recent Activity Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Recent Activity</h3>
              <button style={{ color: 'var(--brand-yellow)', fontSize: 11, background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rider</th>
                  <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Passenger</th>
                  <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>From → To</th>
                  <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Time</th>
                  <th style={{ textAlign: 'right', padding: '10px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentRides.map((ride, i) => (
                  <tr key={i} style={{ borderBottom: i === recentRides.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>{ride.rider}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{ride.passenger}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 11 }}>{ride.route}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: 4, 
                        background: ride.status === 'Active' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                        color: ride.status === 'Active' ? 'var(--info)' : 'var(--success)',
                        fontSize: 10, fontWeight: 600
                      }}>
                        {ride.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{ride.time}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>{ride.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Top Riders Leaderboard */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 15px 0' }}>Top Riders of the Day</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {topRiders.map((rider, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', 
                      background: i === 0 ? 'var(--brand-yellow)' : i === 1 ? '#E5E7EB' : '#D97706',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#111'
                    }}>
                      {rider.rank}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{rider.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{rider.trips} trips completed</div>
                    </div>
                    <div style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>{rider.earnings}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Alerts */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 15px 0' }}>System Alerts</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, padding: 10, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, borderLeft: '3px solid var(--danger)' }}>
                  <AlertCircle size={14} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>High cancellation rate in Lapaz</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>15% increase in last 2 hours</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: 10, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 6, borderLeft: '3px solid var(--warning)' }}>
                  <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>Server response time elevated</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Avg 450ms (Normal: 120ms)</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: 10, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 6, borderLeft: '3px solid var(--info)' }}>
                  <Info size={14} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>Monthly report available</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>May 2024 performance report is ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
