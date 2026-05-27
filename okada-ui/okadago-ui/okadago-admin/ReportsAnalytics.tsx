import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { BarChart2, PieChart, FileText, Download, Calendar, Filter, Map, TrendingUp, Users, Bike, DollarSign } from 'lucide-react';

export default function ReportsAnalytics() {
  const reports = [
    { title: 'Revenue Report', icon: <DollarSign size={20} />, desc: 'Detailed breakdown of income and fees', date: 'Yesterday, 11:59 PM' },
    { title: 'Trips Report', icon: <Bike size={20} />, desc: 'Analysis of completed and cancelled trips', date: 'Today, 6:00 AM' },
    { title: 'Riders Report', icon: <Users size={20} />, desc: 'Growth and performance metrics for riders', date: 'May 1, 2024' },
    { title: 'Users Report', icon: <Users size={20} />, desc: 'Passenger demographics and activity', date: 'May 1, 2024' },
    { title: 'Payouts Report', icon: <FileText size={20} />, desc: 'Settlement history and pending payouts', date: 'Today, 6:00 AM' },
    { title: 'Performance Report', icon: <TrendingUp size={20} />, desc: 'System-wide efficiency and ratings', date: 'Yesterday, 11:59 PM' },
  ];

  return (
    <AdminLayout 
      active="Reports & Analytics" 
      title="Reports & Analytics"
      headerRight={
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Calendar size={14} /> May 1 - May 31, 2024
          </button>
          <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Map size={14} /> Greater Accra
          </button>
          <button style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <Download size={14} /> Export All
          </button>
        </div>
      }
    >
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>System Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {reports.map((report, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-orange)' }}>
                  {report.icon}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--brand-yellow)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Generate</button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Download size={14} /></button>
                </div>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{report.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4 }}>{report.desc}</p>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Last generated: {report.date}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Revenue by Region</h3>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 40, paddingBottom: 20 }}>
            {[
              { label: 'Greater Accra', value: 65, color: 'var(--brand-orange)' },
              { label: 'Ashanti', value: 22, color: 'var(--brand-yellow)' },
              { label: 'Western', value: 8, color: 'var(--info)' },
              { label: 'Other', value: 5, color: 'var(--text-muted)' },
            ].map((r, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: `${r.value}%`, background: r.color, borderRadius: '4px 4px 0 0' }}></div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>{r.label} ({r.value}%)</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Service Mix</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Rides', value: 65, color: 'var(--brand-orange)' },
              { label: 'Food', value: 23, color: 'var(--brand-yellow)' },
              { label: 'Package', value: 12, color: 'var(--info)' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${s.value}%`, height: '100%', background: s.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Scheduled Reports</h3>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { title: 'Daily Summary', schedule: 'Every day at 6:00 AM', recipients: 'Admin, Finance Team' },
            { title: 'Weekly Overview', schedule: 'Every Monday at 6:00 AM', recipients: 'All Managers' },
            { title: 'Monthly Report', schedule: '1st of every month at 12:00 AM', recipients: 'Board of Directors' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{s.title}</h4>
              <div style={{ fontSize: 12, color: 'var(--brand-orange)', marginBottom: 4 }}>{s.schedule}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>To: {s.recipients}</div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
