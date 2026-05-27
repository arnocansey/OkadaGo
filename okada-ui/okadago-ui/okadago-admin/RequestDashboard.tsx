import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  ClipboardList, Bike, ShoppingBag, Package, 
  Search, Filter, MapPin, Clock, MoreHorizontal,
  Navigation, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import './_shared/tokens.css';

export default function RequestDashboard() {
  const kpis = [
    { label: 'Total Requests', value: '4,580', color: 'var(--text-primary)' },
    { label: 'Active', value: '312', color: 'var(--info)' },
    { label: 'Completed', value: '4,127', color: 'var(--success)' },
    { label: 'Cancelled', value: '141', color: 'var(--danger)' },
    { label: 'Failed', value: '0', color: 'var(--text-muted)' },
  ];

  const requests = [
    { id: '#REQ-240531-1001', type: 'Ride', customer: 'Ama Serwaa', from: 'East Legon', to: 'Airport City', rider: 'Kofi Mensah', status: 'Active', time: '14:25', fare: 'GHS 25.50' },
    { id: '#REQ-240531-1002', type: 'Food', customer: 'John Doe', from: 'KFC Osu', to: 'Labone', rider: 'Kwame Asare', status: 'Pending', time: '14:30', fare: 'GHS 12.00' },
    { id: '#REQ-240531-1003', type: 'Package', customer: 'Esi Addo', from: 'Circle', to: 'Dansoman', rider: 'Unassigned', status: 'Pending', time: '14:32', fare: 'GHS 35.00' },
    { id: '#REQ-240531-1004', type: 'Ride', customer: 'Yaw Boateng', from: 'Lapaz', to: 'Madina', rider: 'Akua Boakye', status: 'Completed', time: '14:05', fare: 'GHS 42.00' },
    { id: '#REQ-240531-1005', type: 'Food', customer: 'Abena Mansa', from: 'Burger King', to: 'East Legon', rider: 'Emmanuel Tetteh', status: 'Active', time: '14:15', fare: 'GHS 15.50' },
    { id: '#REQ-240531-1006', type: 'Ride', customer: 'Nana Yaw', from: 'Tema', to: 'Accra', rider: 'Yaw Boateng', status: 'Active', time: '14:20', fare: 'GHS 85.00' },
    { id: '#REQ-240531-1007', type: 'Package', customer: 'Kojo Antwi', from: 'Cantonments', to: 'Osu', rider: 'Kofi Mensah', status: 'Completed', time: '13:45', fare: 'GHS 20.00' },
    { id: '#REQ-240531-1008', type: 'Ride', customer: 'Mansa Musa', from: 'Kasoa', to: 'Circle', rider: 'Ama Serwaa', status: 'Cancelled', time: '14:10', fare: 'GHS 55.00' },
  ];

  return (
    <AdminLayout active="Request Dashboard" title="Request Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header with Live Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700, margin: 0 }}>Incoming Requests</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'pulse 2s infinite' }}></div>
              <span style={{ color: 'var(--danger)', fontSize: 10, fontWeight: 700 }}>LIVE</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 11 }}>
            <RefreshCw size={12} className="animate-spin-slow" /> Auto-refreshing every 30s
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ color: kpi.color, fontSize: 18, fontWeight: 700 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20, height: 500 }}>
          {/* Requests Table Panel */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {['All Requests', 'Ride Requests', 'Food Orders', 'Package Delivery'].map((tab, i) => (
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

            <div style={{ padding: '15px 20px', display: 'flex', gap: 10 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  placeholder="Search by ID, customer, rider..." 
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 30px', color: '#fff', fontSize: 12 }} 
                />
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                <Filter size={14} /> Filter
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Customer</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>From → To</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rider</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fare</th>
                    <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--brand-yellow)', fontWeight: 500 }}>{r.id.split('-').pop()}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {r.type === 'Ride' ? <Bike size={14} style={{ color: 'var(--info)' }} /> : 
                           r.type === 'Food' ? <ShoppingBag size={14} style={{ color: 'var(--brand-orange)' }} /> : 
                           <Package size={14} style={{ color: 'var(--brand-yellow)' }} />}
                          <span style={{ color: 'var(--text-primary)' }}>{r.type}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{r.customer}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 11 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
                          {r.from}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Navigation size={10} style={{ color: 'var(--text-muted)' }} />
                          {r.to}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: r.rider === 'Unassigned' ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {r.rider}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 4, 
                          background: r.status === 'Active' ? 'rgba(59, 130, 246, 0.1)' : r.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' : r.status === 'Completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: r.status === 'Active' ? 'var(--info)' : r.status === 'Pending' ? 'var(--warning)' : r.status === 'Completed' ? 'var(--success)' : 'var(--danger)',
                          fontSize: 10, fontWeight: 600
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>{r.fare}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <MoreHorizontal size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Map & Summary Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Map Placeholder */}
            <div style={{ 
              flex: 1, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', 
              overflow: 'hidden', position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, background: 'rgba(15,15,15,0.8)', padding: '4px 10px', borderRadius: 4, fontSize: 10, color: '#fff', border: '1px solid var(--border)' }}>
                Live Tracking: Accra
              </div>
              <div style={{ width: '100%', height: '100%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: 200, height: 200, borderRadius: '50%', background: '#252525' }}>
                  {/* Fake map points */}
                  <div style={{ position: 'absolute', top: '30%', left: '40%', width: 10, height: 10, background: 'var(--info)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px var(--info)' }}></div>
                  <div style={{ position: 'absolute', top: '50%', left: '70%', width: 10, height: 10, background: 'var(--brand-orange)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px var(--brand-orange)' }}></div>
                  <div style={{ position: 'absolute', top: '70%', left: '30%', width: 10, height: 10, background: 'var(--brand-yellow)', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 10px var(--brand-yellow)' }}></div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ background: 'var(--bg-card)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 15px 0' }}>Request Analytics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Avg Response Time</span>
                  <span style={{ color: 'var(--brand-yellow)', fontSize: 11, fontWeight: 700 }}>2m 15s</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Avg Trip Duration</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>22m</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Peak Hour Today</span>
                  <span style={{ color: 'var(--info)', fontSize: 11, fontWeight: 700 }}>8:00 AM - 9:00 AM</span>
                </div>
                <div style={{ height: 1, background: 'var(--border)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Cancellation Rate</span>
                  <span style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 700 }}>3.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
}
