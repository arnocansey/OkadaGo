import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { DollarSign, CheckCircle, Clock, AlertCircle, Users, Download, ArrowRight, TrendingUp } from 'lucide-react';

export default function EarningsPayouts() {
  const stats = [
    { label: 'Total Earnings Distributed', value: 'GHS 1,158,250', color: 'var(--info)' },
    { label: 'This Month', value: 'GHS 146,400', color: 'var(--brand-orange)' },
    { label: 'Pending Payouts', value: 'GHS 7,850', color: 'var(--warning)' },
    { label: 'Processed Payouts', value: 'GHS 157,500', color: 'var(--success)' },
    { label: 'Failure Rate', value: '3.2%', color: 'var(--danger)' },
  ];

  const pendingPayouts = [
    { rider: 'Kofi Mensah', id: 'RID124567', amount: 'GHS 850.00', method: 'MTN MoMo', date: '2024-05-31' },
    { rider: 'Ama Serwaa', id: 'RID124568', amount: 'GHS 1,200.50', method: 'Telecel Cash', date: '2024-05-31' },
    { rider: 'Kwame Asare', id: 'RID124569', amount: 'GHS 650.00', method: 'Bank Transfer', date: '2024-05-31' },
    { rider: 'Akua Boakye', id: 'RID124570', amount: 'GHS 980.25', method: 'MTN MoMo', date: '2024-05-31' },
    { rider: 'Emmanuel Tetteh', id: 'RID124571', amount: 'GHS 1,450.00', method: 'Telecel Cash', date: '2024-05-31' },
  ];

  const topEarners = [
    { name: 'Kofi Mensah', amount: 'GHS 8,450', trips: 432 },
    { name: 'Ama Serwaa', amount: 'GHS 7,980', trips: 389 },
    { name: 'Kwame Asare', amount: 'GHS 7,120', trips: 354 },
    { name: 'Akua Boakye', amount: 'GHS 6,540', trips: 321 },
    { name: 'Emmanuel Tetteh', amount: 'GHS 5,990', trips: 298 },
  ];

  return (
    <AdminLayout active="Earnings & Payouts" title="Earnings & Payouts Overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ width: '100%', height: 2, background: 'var(--bg-primary)', marginTop: 12 }}>
              <div style={{ width: '70%', height: '100%', background: stat.color }}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Pending Payouts</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Process All Pending</button>
              <button style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#111', cursor: 'pointer' }}>Download Report</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 20px', width: 40 }}><input type="checkbox" /></th>
                {['Rider', 'ID', 'Method', 'Amount', 'Date'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingPayouts.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px' }}><input type="checkbox" /></td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-primary)' }}>{p.rider}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{p.id}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{p.method}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--brand-orange)' }}>{p.amount}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Payout Schedule</h3>
            <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--info)', marginBottom: 4 }}>
                <Clock size={16} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Next Auto-Process</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Tomorrow, 6:00 AM</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Daily automated payout processing enabled</div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Top Earners (This Month)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topEarners.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--brand-orange)' }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{e.trips} trips</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{e.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Payout Processing Status</h3>
        <div style={{ display: 'flex', gap: 40 }}>
          {[
            { label: 'Completed', value: '89.6%', color: 'var(--success)' },
            { label: 'Pending', value: '5.0%', color: 'var(--warning)' },
            { label: 'Failed', value: '3.2%', color: 'var(--danger)' },
            { label: 'Cancelled', value: '2.2%', color: 'var(--text-muted)' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: s.value, height: '100%', background: s.color }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
