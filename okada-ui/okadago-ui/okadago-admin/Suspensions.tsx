import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Users, 
  UserX, 
  RotateCcw, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  AlertTriangle,
  FileText,
  User,
  CheckCircle,
  Calendar,
  Shield,
  MessageSquare
} from 'lucide-react';

export default function Suspensions() {
  const stats = [
    { label: 'Total Suspended', value: '48', icon: Users, color: 'var(--brand-orange)' },
    { label: 'Currently Suspended', value: '36', icon: UserX, color: 'var(--danger)' },
    { label: 'Reinstated This Month', value: '12', icon: RotateCcw, color: 'var(--success)' },
    { label: 'Avg Duration', value: '7d 4h', icon: Clock, color: 'var(--brand-yellow)' },
  ];

  const tabs = ['All Suspensions', 'Active Suspensions', 'Expired Suspensions', 'Reinstated'];

  const rows = [
    { rider: { name: 'Kofi Mensah', id: 'RID124567' }, reason: 'Multiple complaints', duration: '7 days', status: 'Active', from: 'May 28, 2024', to: 'Jun 04, 2024' },
    { rider: { name: 'Ama Serwaa', id: 'RID124568' }, reason: 'Safety violation', duration: '14 days', status: 'Active', from: 'May 25, 2024', to: 'Jun 08, 2024', highlight: true },
    { rider: { name: 'Kwame Asare', id: 'RID124569' }, reason: 'Fraudulent activity', duration: '30 days', status: 'Active', from: 'May 15, 2024', to: 'Jun 14, 2024' },
    { rider: { name: 'Akua Boakye', id: 'RID124570' }, reason: 'Low rating', duration: '3 days', status: 'Expired', from: 'May 20, 2024', to: 'May 23, 2024' },
    { rider: { name: 'Emmanuel Tetteh', id: 'RID124571' }, reason: 'Late pickups', duration: '7 days', status: 'Active', from: 'May 30, 2024', to: 'Jun 06, 2024' },
    { rider: { name: 'Derrick Mensah', id: 'RID124572' }, reason: 'Inappropriate behavior', duration: '90 days', status: 'Active', from: 'Apr 10, 2024', to: 'Jul 09, 2024' },
    { rider: { name: 'Sarah Appiah', id: 'RID124573' }, reason: 'No-show for trips', duration: '7 days', status: 'Expired', from: 'May 12, 2024', to: 'May 19, 2024' },
    { rider: { name: 'Prince Boateng', id: 'RID124574' }, reason: 'Multiple complaints', duration: '14 days', status: 'Active', from: 'May 22, 2024', to: 'Jun 05, 2024' },
  ];

  return (
    <AdminLayout active="Suspensions" title="Suspensions & Deactivations" breadcrumbs={['Riders Management', 'Suspensions']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
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

        {/* Search and Filters */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '15px 20px' }}>
          <div style={{ display: 'flex', gap: 25, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {tabs.map((tab, i) => (
              <div key={tab} style={{ 
                paddingBottom: 12, fontSize: 13, color: i === 1 ? 'var(--brand-yellow)' : 'var(--text-muted)', 
                fontWeight: i === 1 ? 600 : 400, cursor: 'pointer', borderBottom: i === 1 ? '2px solid var(--brand-yellow)' : 'none' 
              }}>
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#111', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 15px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Search rider by name or ID..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 12, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['All Reasons', 'All Status', 'All Durations'].map(f => (
                <button key={f} style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {f} <MoreVertical size={12} />
                </button>
              ))}
              <button style={{ background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 600 }}>Apply</button>
            </div>
          </div>
        </div>

        {/* Main Content: Table and Detail Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          {/* Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  {['Rider', 'Reason', 'Duration', 'Status', 'Suspended On', 'Ends On', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: row.highlight ? 'rgba(255,107,0,0.05)' : 'transparent' }}>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{row.rider.name[0]}</div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{row.rider.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{row.rider.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-secondary)', fontSize: 11 }}>{row.reason}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: 12, fontSize: 9, fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text-secondary)'
                      }}>{row.duration}</span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: row.status === 'Active' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                        color: row.status === 'Active' ? 'var(--danger)' : 'var(--text-muted)'
                      }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.from}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.to}</td>
                    <td style={{ padding: '12px 15px' }}><button style={{ color: 'var(--brand-yellow)', background: 'transparent', border: 'none', fontSize: 11, fontWeight: 600 }}>View Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Panel: Suspension Details */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: 0 }}>Suspension Details</h3>
                <span style={{ padding: '3px 8px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 45, height: 45, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' }}>A</div>
                <div>
                   <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>Ama Serwaa</div>
                   <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>RID124568 · Joined May 2023</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Reason for Suspension</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>
                    <Shield size={14} /> Safety violation
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Description / Admin Note</div>
                  <div style={{ background: '#111', padding: 12, borderRadius: 8, color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
                    "My account was deactivated without any valid reason. I have always followed the guidelines and provided safe rides to all my passengers. Please investigate."
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Duration</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>14 Days</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Suspended By</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>Super Admin</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Suspended On</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>May 25, 2024</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Ends On</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>Jun 08, 2024</div>
                  </div>
                </div>

                <div>
                   <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 8 }}>Evidence / Attachments</div>
                   <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color="var(--text-muted)" /></div>
                      <div style={{ width: 40, height: 40, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={18} color="var(--text-muted)" /></div>
                      <span style={{ alignSelf: 'center', color: 'var(--brand-yellow)', fontSize: 11 }}>View All (2)</span>
                   </div>
                </div>
              </div>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '10px', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><AlertTriangle size={14} /> Send Warning</button>
                  <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '10px', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><MessageSquare size={14} /> Add Note</button>
               </div>
               <button style={{ background: 'var(--success)', border: 'none', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><CheckCircle size={16} /> Reinstate Rider</button>
               <button style={{ background: 'var(--danger)', border: 'none', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Clock size={16} /> Extend Suspension</button>
            </div>

            <div style={{ padding: '15px 20px', borderTop: '1px solid var(--border)' }}>
               <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Suspension History</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', marginTop: 4 }} />
                     <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>Safety violation (14 days)</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>May 25, 2024 - Active</div>
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', marginTop: 4 }} />
                     <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>Reinstated by Admin</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Feb 12, 2024</div>
                     </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)', marginTop: 4 }} />
                     <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>Multiple complaints (7 days)</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Feb 05, 2024 - Expired</div>
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
