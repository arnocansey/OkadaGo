import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { FileText, CheckCircle, Clock, AlertCircle, Download, Search, Filter, Calendar } from 'lucide-react';

export default function Documents() {
  const stats = [
    { label: 'Total Documents', value: '7,050', icon: <FileText size={18} />, color: 'var(--info)' },
    { label: 'Valid', value: '6,420', icon: <CheckCircle size={18} />, color: 'var(--success)' },
    { label: 'Expiring Soon (30 days)', value: '312', icon: <Clock size={18} />, color: 'var(--warning)' },
    { label: 'Expired', value: '318', icon: <AlertCircle size={18} />, color: 'var(--danger)' },
  ];

  const documents = [
    { rider: 'Kofi Mensah', type: 'Driver\'s License', submitted: '2023-12-15', expiry: '2024-12-15', status: 'Valid' },
    { rider: 'Ama Serwaa', type: 'Insurance', submitted: '2024-01-20', expiry: '2024-06-20', status: 'Expiring' },
    { rider: 'Kwame Asare', type: 'Vehicle Reg', submitted: '2023-11-10', expiry: '2024-05-10', status: 'Expired' },
    { rider: 'Akua Boakye', type: 'National ID', submitted: '2024-03-05', expiry: '2029-03-05', status: 'Valid' },
    { rider: 'Emmanuel Tetteh', type: 'Insurance', submitted: '2024-02-15', expiry: '2025-02-15', status: 'Valid' },
    { rider: 'Abena Mansa', type: 'Driver\'s License', submitted: '2023-08-12', expiry: '2024-08-12', status: 'Valid' },
    { rider: 'Yaw Boateng', type: 'Vehicle Reg', submitted: '2024-04-01', expiry: '2025-04-01', status: 'Valid' },
    { rider: 'Esi Ansah', type: 'National ID', submitted: '2024-01-10', expiry: '2029-01-10', status: 'Valid' },
  ];

  return (
    <AdminLayout active="Documents" title="Documents Management" breadcrumbs={['Riders Management', 'Documents']}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Document List</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search rider..." 
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px 6px 30px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', width: 200 }}
                />
              </div>
              <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <Filter size={14} /> Filter
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Rider', 'Document Type', 'Submitted Date', 'Expiry Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-primary)' }}>{doc.rider}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{doc.type}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{doc.submitted}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{doc.expiry}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: doc.status === 'Valid' ? 'rgba(34,197,94,0.1)' : doc.status === 'Expired' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: doc.status === 'Valid' ? 'var(--success)' : doc.status === 'Expired' ? 'var(--danger)' : 'var(--warning)'
                    }}>
                      {doc.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--brand-yellow)', cursor: 'pointer', fontSize: 12 }}>View</button>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Download</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Expiry Calendar</h3>
              <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { date: 'May 10', rider: 'Kwame Asare', type: 'Vehicle Reg', status: 'Expired' },
                { date: 'Jun 20', rider: 'Ama Serwaa', type: 'Insurance', status: 'Expiring' },
                { date: 'Jul 15', rider: 'John Doe', type: 'Driver\'s License', status: 'Expiring' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: 10, background: 'var(--bg-primary)', borderRadius: 8 }}>
                  <div style={{ textAlign: 'center', minWidth: 40 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.date.split(' ')[0]}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{item.date.split(' ')[1]}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.rider}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{item.type}</div>
                    <div style={{ fontSize: 10, color: item.status === 'Expired' ? 'var(--danger)' : 'var(--warning)', marginTop: 2 }}>{item.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
