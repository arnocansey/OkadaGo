import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  ShieldCheck, Clock, CheckCircle2, XCircle, 
  Search, Filter, User, Calendar, FileText,
  Eye, Download, MoreHorizontal, Check, X
} from 'lucide-react';
import './_shared/tokens.css';

export default function RiderVerification() {
  const kpis = [
    { label: 'Pending Verification', value: '118', color: 'var(--brand-orange)' },
    { label: 'Approved Today', value: '24', color: 'var(--success)' },
    { label: 'Rejected Today', value: '3', color: 'var(--danger)' },
    { label: 'Avg Review Time', value: '4h 20m', color: 'var(--info)' },
  ];

  const applications = [
    { id: '#APP-240531-101', name: 'Kofi Mensah', phone: '055 123 4567', date: '2024-05-31 09:30', docs: { id: true, license: true, insurance: false }, status: 'Pending', statusColor: 'var(--brand-orange)', lastUpdated: '2 hours ago' },
    { id: '#APP-240531-102', name: 'Ama Serwaa', phone: '024 456 7890', date: '2024-05-31 10:15', docs: { id: true, license: true, insurance: true }, status: 'Under Review', statusColor: 'var(--info)', lastUpdated: '1 hour ago' },
    { id: '#APP-240531-103', name: 'Kwame Asare', phone: '020 987 6543', date: '2024-05-30 16:45', docs: { id: true, license: true, insurance: true }, status: 'Pending', statusColor: 'var(--brand-orange)', lastUpdated: '18 hours ago' },
    { id: '#APP-240531-104', name: 'Akua Boakye', phone: '054 321 0987', date: '2024-05-30 14:20', docs: { id: true, license: true, insurance: true }, status: 'Pending', statusColor: 'var(--brand-orange)', lastUpdated: '20 hours ago' },
    { id: '#APP-240531-105', name: 'Emmanuel Tetteh', phone: '027 555 1234', date: '2024-05-30 11:10', docs: { id: true, license: false, insurance: false }, status: 'Pending', statusColor: 'var(--brand-orange)', lastUpdated: '23 hours ago' },
    { id: '#APP-240531-106', name: 'Yaw Boateng', phone: '059 888 7777', date: '2024-05-31 08:05', docs: { id: true, license: true, insurance: true }, status: 'Under Review', statusColor: 'var(--info)', lastUpdated: '3 hours ago' },
  ];

  return (
    <AdminLayout active="Rider Verification" title="Rider Verification" breadcrumbs={['Riders Management', 'Rider Verification']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ color: kpi.color, fontSize: 18, fontWeight: 700 }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, height: 600 }}>
          {/* Main Table Area */}
          <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {['Pending', 'Under Review', 'Approved', 'Rejected'].map((tab, i) => (
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

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Rider Info</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Submitted Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Documents</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Last Updated</th>
                    <th style={{ textAlign: 'center', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(255, 107, 0, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} style={{ color: 'var(--text-secondary)' }} />
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{app.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{app.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{app.date}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div title="National ID" style={{ color: app.docs.id ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <FileText size={14} />
                            {app.docs.id ? <Check size={10} /> : <X size={10} />}
                          </div>
                          <div title="Driver's License" style={{ color: app.docs.license ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShieldCheck size={14} />
                            {app.docs.license ? <Check size={10} /> : <X size={10} />}
                          </div>
                          <div title="Insurance" style={{ color: app.docs.insurance ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ShieldCheck size={14} />
                            {app.docs.insurance ? <Check size={10} /> : <X size={10} />}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: 4, 
                          background: `${app.statusColor}15`, color: app.statusColor,
                          fontSize: 10, fontWeight: 600
                        }}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{app.lastUpdated}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', color: 'var(--brand-yellow)', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Verification Detail Side Panel */}
          <div style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 15, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 5 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-primary)', margin: '0 auto 10px', border: '2px solid var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={40} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Kofi Mensah</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Rider ID: RID124567</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Submitted Documents</h4>
              
              {[
                { name: 'Ghana National ID', status: 'Verified', statusColor: 'var(--success)' },
                { name: "Driver's License", status: 'Verified', statusColor: 'var(--success)' },
                { name: 'Insurance Certificate', status: 'Missing', statusColor: 'var(--danger)' },
                { name: 'Vehicle Photo', status: 'Pending Review', statusColor: 'var(--warning)' },
              ].map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{doc.name}</div>
                    <div style={{ fontSize: 9, color: doc.statusColor }}>{doc.status}</div>
                  </div>
                  <button style={{ background: 'transparent', border: 'none', color: 'var(--brand-yellow)', cursor: 'pointer' }}>
                    <Eye size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{ background: 'var(--success)', border: 'none', borderRadius: 6, padding: '12px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> Approve All
              </button>
              <button style={{ background: 'var(--danger)', border: 'none', borderRadius: 6, padding: '12px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <XCircle size={16} /> Reject Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
