import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  DollarSign, 
  Bike as Trip, 
  Award, 
  Percent, 
  MoreVertical,
  ChevronRight,
  User
} from 'lucide-react';

export default function Earnings() {
  const stats = [
    { label: 'Total Earnings', value: 'GHS 158,750', change: '+12.5%', isPositive: true, icon: DollarSign },
    { label: 'Trip Earnings', value: 'GHS 127,450', change: '+10.2%', isPositive: true, icon: DollarSign },
    { label: 'Incentives', value: 'GHS 18,300', change: '+15.4%', isPositive: true, icon: Award },
    { label: 'Commissions', value: '-GHS 12,350', change: '+8.1%', isPositive: false, icon: Percent },
    { label: 'Net Earnings', value: 'GHS 146,400', change: '+11.8%', isPositive: true, icon: DollarSign },
  ];

  const topRiders = [
    { name: 'Kofi Mensah', amount: 'GHS 8,450' },
    { name: 'Ama Serwaa', amount: 'GHS 7,980' },
    { name: 'Kwame Asare', amount: 'GHS 7,120' },
    { name: 'Akua Boakye', amount: 'GHS 6,540' },
    { name: 'Emmanuel Tetteh', amount: 'GHS 5,990' },
  ];

  const incentives = [
    { label: 'Peak Hour Bonus', amount: 'GHS 8,450' },
    { label: 'Weekend Bonus', amount: 'GHS 5,320' },
    { label: 'Completed Trips Bonus', amount: 'GHS 3,250' },
    { label: 'Refer a Rider', amount: 'GHS 1,280' },
  ];

  const summaryRows = [
    { date: 'May 31, 2024', trips: 145, tripEarnings: 'GHS 4,250', incentives: 'GHS 580', commissions: '-GHS 410', net: 'GHS 4,420', growth: '+2.4%' },
    { date: 'May 30, 2024', trips: 138, tripEarnings: 'GHS 3,980', incentives: 'GHS 450', commissions: '-GHS 385', net: 'GHS 4,045', growth: '+1.8%' },
    { date: 'May 29, 2024', trips: 152, tripEarnings: 'GHS 4,520', incentives: 'GHS 620', commissions: '-GHS 435', net: 'GHS 4,705', growth: '+3.2%' },
    { date: 'May 28, 2024', trips: 124, tripEarnings: 'GHS 3,650', incentives: 'GHS 380', commissions: '-GHS 340', net: 'GHS 3,690', growth: '-1.5%' },
    { date: 'May 27, 2024', trips: 131, tripEarnings: 'GHS 3,820', incentives: 'GHS 420', commissions: '-GHS 370', net: 'GHS 3,870', growth: '+0.8%' },
  ];

  return (
    <AdminLayout active="Earnings" title="Earnings Overview" breadcrumbs={['Riders Management', 'Earnings']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} color="var(--brand-orange)" />
                </div>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, 
                  background: stat.isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: stat.isPositive ? 'var(--success)' : 'var(--danger)', fontSize: 10, fontWeight: 600
                }}>
                  {stat.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {stat.change}
                </div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Earnings Overview</h3>
              <div style={{ display: 'flex', gap: 15 }}>
                {['Trip', 'Incentives', 'Commissions', 'Net'].map(label => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: label === 'Net' ? 'var(--brand-orange)' : label === 'Trip' ? 'var(--brand-yellow)' : label === 'Incentives' ? '#3B82F6' : '#EF4444' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Line Chart Placeholder */}
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              {[40, 60, 45, 70, 55, 80, 65, 90, 75, 85, 60, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h}%`, background: 'linear-gradient(to top, rgba(255,107,0,0.2), rgba(255,107,0,0.05))', borderTop: '2px solid var(--brand-orange)' }} />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h-10}%`, borderTop: '2px solid var(--brand-yellow)', opacity: 0.5 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              {['May 1', 'May 7', 'May 14', 'May 21', 'May 28', 'May 31'].map(date => (
                <span key={date} style={{ color: 'var(--text-muted)', fontSize: 10 }}>{date}</span>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Earnings Breakdown</h3>
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
               <div style={{ width: 120, height: 120, borderRadius: '50%', border: '15px solid var(--border)', borderTopColor: 'var(--brand-yellow)', borderRightColor: '#3B82F6', borderBottomColor: '#EF4444' }} />
               <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>80.1%</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>Trip Earnings</span>
               </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trip Earnings</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>80.1%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Incentives</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>11.5%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Commissions</span>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-7.3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Earnings by Day of Week</h3>
            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 15 }}>
              {[120, 150, 180, 140, 200, 250, 220].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>GHS {h*10}</span>
                  <div style={{ width: '100%', height: h, background: i === 5 ? 'var(--brand-orange)' : 'var(--brand-yellow)', borderRadius: '4px 4px 0 0' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Top Earning Riders</h3>
              <button style={{ color: 'var(--brand-yellow)', background: 'transparent', border: 'none', fontSize: 11, cursor: 'pointer' }}>View All</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topRiders.map((rider, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={14} color="var(--text-secondary)" />
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{rider.name}</span>
                  </div>
                  <span style={{ color: 'var(--brand-yellow)', fontSize: 12, fontWeight: 600 }}>{rider.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Incentives & Bonuses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {incentives.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Monthly Total</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>{item.amount}</div>
                    <ArrowUpRight size={12} color="var(--success)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Daily', 'Weekly', 'Monthly'].map((tab, i) => (
                <span key={tab} style={{ color: i === 0 ? 'var(--brand-yellow)' : 'var(--text-muted)', fontSize: 12, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', borderBottom: i === 0 ? '2px solid var(--brand-yellow)' : 'none', paddingBottom: 5 }}>{tab}</span>
              ))}
            </div>
            <button style={{ color: 'var(--text-secondary)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <MoreVertical size={12} /> Options
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Date', 'Trips', 'Trip Earnings', 'Incentives', 'Commissions', 'Net Earnings', 'Growth'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.date}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.trips}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.tripEarnings}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--success)', fontSize: 12 }}>{row.incentives}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--danger)', fontSize: 12 }}>{row.commissions}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--brand-yellow)', fontSize: 12, fontWeight: 600 }}>{row.net}</td>
                  <td style={{ padding: '12px 20px', color: row.growth.startsWith('+') ? 'var(--success)' : 'var(--danger)', fontSize: 12 }}>{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'center' }}>
             <button style={{ color: 'var(--brand-yellow)', background: 'transparent', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                View Full History <ChevronRight size={14} />
             </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
