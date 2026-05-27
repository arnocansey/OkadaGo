import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Bike, Search, Filter, MoreHorizontal, 
  Star, ChevronLeft, ChevronRight, User,
  CheckCircle2, Clock, AlertTriangle, Ban
} from 'lucide-react';
import './_shared/tokens.css';

export default function AllRiders() {
  const kpis = [
    { label: 'Total Riders', value: '2,350', color: 'var(--text-primary)' },
    { label: 'Active', value: '1,876', color: 'var(--success)' },
    { label: 'Inactive', value: '356', color: 'var(--text-muted)' },
    { label: 'Pending Verification', value: '118', color: 'var(--warning)' },
    { label: 'Suspended', value: '36', color: 'var(--danger)' },
  ];

  const riders = [
    { id: '#RID124567', name: 'Kofi Mensah', phone: '055 123 4567', location: 'East Legon, Accra', status: 'Online', statusColor: 'var(--success)', rating: 4.9, totalTrips: 1245, monthTrips: 124, earnings: 'GHS 2,450', joined: '2024-01-15' },
    { id: '#RID124568', name: 'Ama Serwaa', phone: '024 456 7890', location: 'Airport City, Accra', status: 'On Trip', statusColor: 'var(--info)', rating: 4.8, totalTrips: 890, monthTrips: 98, earnings: 'GHS 1,980', joined: '2024-02-10' },
    { id: '#RID124569', name: 'Kwame Asare', phone: '020 987 6543', location: 'Lapaz, Accra', status: 'Offline', statusColor: 'var(--text-muted)', rating: 4.7, totalTrips: 567, monthTrips: 45, earnings: 'GHS 950', joined: '2024-03-05' },
    { id: '#RID124570', name: 'Akua Boakye', phone: '054 321 0987', location: 'Osu, Accra', status: 'Online', statusColor: 'var(--success)', rating: 4.8, totalTrips: 1102, monthTrips: 156, earnings: 'GHS 3,120', joined: '2023-11-20' },
    { id: '#RID124571', name: 'Emmanuel Tetteh', phone: '027 555 1234', location: 'Madina, Accra', status: 'Suspended', statusColor: 'var(--danger)', rating: 4.2, totalTrips: 432, monthTrips: 12, earnings: 'GHS 240', joined: '2023-09-12' },
    { id: '#RID124572', name: 'Yaw Boateng', phone: '059 888 7777', location: 'Tema, Accra', status: 'Online', statusColor: 'var(--success)', rating: 4.9, totalTrips: 2150, monthTrips: 187, earnings: 'GHS 4,560', joined: '2023-08-01' },
    { id: '#RID124573', name: 'Abena Mansa', phone: '024 111 2222', location: 'Dansoman, Accra', status: 'Offline', statusColor: 'var(--text-muted)', rating: 4.6, totalTrips: 780, monthTrips: 64, earnings: 'GHS 1,230', joined: '2024-02-25' },
    { id: '#RID124574', name: 'Kojo Antwi', phone: '020 333 4444', location: 'Cantonments, Accra', status: 'On Trip', statusColor: 'var(--info)', rating: 4.8, totalTrips: 945, monthTrips: 112, earnings: 'GHS 2,100', joined: '2023-12-15' },
    { id: '#RID124575', name: 'Esi Addo', phone: '055 999 0000', location: 'Spintex, Accra', status: 'Pending', statusColor: 'var(--warning)', rating: 0, totalTrips: 0, monthTrips: 0, earnings: 'GHS 0', joined: '2024-05-20' },
    { id: '#RID124576', name: 'Nana Yaw', phone: '024 777 8888', location: 'Kumasi', status: 'Online', statusColor: 'var(--success)', rating: 4.7, totalTrips: 345, monthTrips: 89, earnings: 'GHS 1,560', joined: '2024-04-10' },
  ];

  return (
    <AdminLayout active="All Riders" title="All Riders" breadcrumbs={['Riders Management', 'All Riders']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ color: kpi.color, fontSize: 18, fontWeight: 700 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Content Panel */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            {['All', 'Active', 'Inactive', 'Pending', 'Suspended'].map((tab, i) => (
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
                placeholder="Search riders by name, ID, phone..." 
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 30px', color: '#fff', fontSize: 12 }} 
              />
            </div>
            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
              <option>Status: All</option>
            </select>
            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
              <option>All Locations</option>
            </select>
            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
              <option>Rating: Any</option>
            </select>
            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
              <option>Sort by: Newest</option>
            </select>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
              <Filter size={14} /> Filter
            </button>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Rider ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Rider Info</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Rating</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Total Trips</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Month Trips</th>
                  <th style={{ textAlign: 'right', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Earnings (Month)</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Joined</th>
                  <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((rider, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{rider.id}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={16} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{rider.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{rider.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{rider.location}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: 4, 
                        background: `${rider.statusColor}15`, color: rider.statusColor,
                        fontSize: 10, fontWeight: 600
                      }}>
                        {rider.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-yellow)' }}>
                        <Star size={12} fill="var(--brand-yellow)" />
                        <span style={{ fontWeight: 600 }}>{rider.rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>{rider.totalTrips}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--text-secondary)' }}>{rider.monthTrips}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{rider.earnings}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{rider.joined}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      <MoreHorizontal size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Showing 1 to 10 of 2,350 riders
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <ChevronLeft size={14} />
              </button>
              <button style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 4, padding: '5px 12px', color: '#111', fontSize: 11, fontWeight: 700 }}>1</button>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>2</button>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>3</button>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>...</button>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>235</button>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
