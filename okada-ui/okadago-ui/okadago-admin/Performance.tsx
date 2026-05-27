import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  BarChart2, 
  CheckCircle, 
  XCircle, 
  Zap, 
  AlertTriangle, 
  Star,
  MapPin,
  TrendingUp,
  ChevronRight,
  Info
} from 'lucide-react';

export default function Performance() {
  const stats = [
    { label: 'Total Trips', value: '18,745', change: '+8.4%', isPositive: true, icon: BarChart2, color: 'var(--brand-orange)' },
    { label: 'Completed', value: '17,892', change: '+9.2%', isPositive: true, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Cancelled', value: '853', change: '-2.5%', isPositive: true, icon: XCircle, color: 'var(--danger)' },
    { label: 'Acceptance Rate', value: '92.6%', change: '+1.2%', isPositive: true, icon: Zap, color: 'var(--brand-yellow)' },
    { label: 'Cancellation Rate', value: '3.2%', change: '-0.5%', isPositive: true, icon: AlertTriangle, color: 'var(--warning)' },
    { label: 'Avg Rating', value: '4.7', change: '+0.1', isPositive: true, icon: Star, color: 'var(--brand-orange)' },
  ];

  const leaderboard = [
    { name: 'Kofi Mensah', trips: 432, rating: 4.9 },
    { name: 'Ama Serwaa', trips: 389, rating: 4.8 },
    { name: 'Kwame Asare', trips: 354, rating: 4.8 },
    { name: 'Akua Boakye', trips: 321, rating: 4.7 },
    { name: 'Emmanuel Tetteh', trips: 298, rating: 4.7 },
  ];

  const tableRows = [
    { rider: 'Kofi Mensah', total: 432, completed: 410, cancelled: 22, acceptance: '98.2%', cancellation: '1.2%', rating: 4.9 },
    { rider: 'Ama Serwaa', total: 389, completed: 375, cancelled: 14, acceptance: '97.5%', cancellation: '1.5%', rating: 4.8 },
    { rider: 'Kwame Asare', total: 354, completed: 340, cancelled: 14, acceptance: '96.8%', cancellation: '1.8%', rating: 4.8 },
    { rider: 'Akua Boakye', total: 321, completed: 305, cancelled: 16, acceptance: '95.4%', cancellation: '2.1%', rating: 4.7 },
    { rider: 'Emmanuel Tetteh', total: 298, completed: 280, cancelled: 18, acceptance: '94.2%', cancellation: '2.5%', rating: 4.7 },
  ];

  return (
    <AdminLayout active="Performance" title="Performance Overview" breadcrumbs={['Riders Management', 'Performance']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 15 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={14} color={stat.color} />
                </div>
                <div style={{ color: 'var(--success)', fontSize: 9, fontWeight: 600 }}>{stat.change}</div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Second Row: Chart and Map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Performance Overview</h3>
            <div style={{ height: 220, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              {[60, 80, 75, 90, 85, 95, 88, 92, 85, 90, 98, 94].map((h, i) => (
                <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
                   <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h}%`, borderTop: '2px solid var(--brand-orange)', background: 'linear-gradient(to top, rgba(255,107,0,0.1), transparent)' }} />
                   <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h*0.8}%`, borderTop: '2px solid var(--brand-yellow)', opacity: 0.5 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15 }}>
               {['May 1', 'May 7', 'May 14', 'May 21', 'May 28', 'May 31'].map(d => <span key={d} style={{ color: 'var(--text-muted)', fontSize: 10 }}>{d}</span>)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: 20, position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Performance by Location</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4 }}>Activity heatmap in Accra</p>
            </div>
            {/* Map Placeholder */}
            <div style={{ width: '100%', height: '100%', background: '#0a0a0a', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '40%', left: '50%', width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,107,0,0.4) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', top: '30%', left: '30%', width: 80, height: 80, background: 'radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', top: '60%', left: '70%', width: 120, height: 120, background: 'radial-gradient(circle, rgba(255,107,0,0.3) 0%, transparent 70%)' }} />
              <MapPin size={20} color="var(--brand-orange)" style={{ position: 'absolute', top: '45%', left: '55%' }} />
              <MapPin size={16} color="var(--brand-yellow)" style={{ position: 'absolute', top: '35%', left: '35%' }} />
              <MapPin size={18} color="var(--brand-orange)" style={{ position: 'absolute', top: '65%', left: '75%' }} />
            </div>
          </div>
        </div>

        {/* Third Row: Leaderboard, Trend, Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Top Performing Riders</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaderboard.map((rider, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--brand-yellow)' : '#333', color: i === 0 ? '#111' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{i + 1}</div>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{rider.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{rider.trips} trips</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--brand-yellow)', fontSize: 10 }}>
                      <Star size={8} fill="currentColor" /> {rider.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Trips Trend</h3>
            <div style={{ height: 140, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              {[40, 50, 45, 60, 55, 70, 65, 80, 75, 90, 85, 100, 95, 110, 105, 120, 115, 130, 125, 140, 135, 150, 145, 160, 155, 170, 165, 180, 175, 190, 185].map((h, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--brand-orange)', opacity: 0.8, borderRadius: '2px 2px 0 0', height: `${h/2}%` }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
               <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>May 1</span>
               <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>May 15</span>
               <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>May 31</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Ratings Distribution</h3>
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <div style={{ width: 100, height: 100, borderRadius: '50%', border: '12px solid var(--border)', borderTopColor: 'var(--brand-yellow)', borderRightColor: 'var(--brand-orange)' }} />
               <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>4.7</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>Avg Rating</div>
               </div>
            </div>
            <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 6 }}>
               {[
                 { label: '5★', percent: '68.6%', color: 'var(--brand-yellow)' },
                 { label: '4★', percent: '22.7%', color: 'var(--brand-orange)' },
                 { label: '3★', percent: '6.1%', color: 'var(--text-secondary)' },
                 { label: '2★', percent: '0.7%', color: 'var(--text-muted)' },
                 { label: '1★', percent: '0.9%', color: 'var(--danger)' },
               ].map(item => (
                 <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 9, width: 15 }}>{item.label}</span>
                    <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                       <div style={{ width: item.percent, height: '100%', background: item.color, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 9, width: 25 }}>{item.percent}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Performance by Metrics</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Rider', 'Total Trips', 'Completed', 'Cancelled', 'Acceptance', 'Cancellation', 'Avg Rating'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{row.rider}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.total}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--success)', fontSize: 12 }}>{row.completed}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--danger)', fontSize: 12 }}>{row.cancelled}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--brand-yellow)', fontSize: 12 }}>{row.acceptance}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--warning)', fontSize: 12 }}>{row.cancellation}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-yellow)', fontSize: 12, fontWeight: 600 }}>
                      <Star size={12} fill="currentColor" /> {row.rating}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 20px', textAlign: 'center' }}>
             <button style={{ color: 'var(--brand-yellow)', background: 'transparent', border: 'none', fontSize: 11, cursor: 'pointer' }}>View All Riders</button>
          </div>
        </div>

        {/* Insight Banner */}
        <div style={{ background: 'linear-gradient(90deg, #FF6B00, #FACC15)', borderRadius: 12, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 15 }}>
           <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Info size={20} color="#fff" />
           </div>
           <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Performance Insight</div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }}>Riders in East Legon have shown a 15% increase in completed trips this week. Consider deploying more incentives in Osu to balance demand.</div>
           </div>
           <button style={{ marginLeft: 'auto', background: '#fff', color: '#FF6B00', border: 'none', borderRadius: 6, padding: '8px 15px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Generate Detailed Report</button>
        </div>

      </div>
    </AdminLayout>
  );
}
