import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { DollarSign, TrendingUp, CreditCard, Clock, CheckCircle, Download, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Finance() {
  const stats = [
    { label: 'Total Revenue', value: 'GHS 1,245,800', change: '+12.5%', isPositive: true },
    { label: 'This Month', value: 'GHS 158,750', change: '+8.2%', isPositive: true },
    { label: 'Platform Commission', value: 'GHS 87,650', change: '+15.4%', isPositive: true },
    { label: 'Pending Settlements', value: 'GHS 24,300', change: '-2.1%', isPositive: false },
    { label: 'Processed Settlements', value: 'GHS 1,133,850', change: '+10.8%', isPositive: true },
  ];

  const services = [
    { name: 'Ride Hailing', percentage: 65, amount: 'GHS 809,770', color: 'var(--brand-orange)' },
    { name: 'Food Delivery', percentage: 23, amount: 'GHS 286,534', color: 'var(--brand-yellow)' },
    { name: 'Package Delivery', percentage: 12, amount: 'GHS 149,496', color: 'var(--info)' },
  ];

  const transactions = [
    { id: 'SET-98234', amount: 'GHS 12,450', date: '2024-05-31', status: 'Processed', type: 'Weekly Settlement' },
    { id: 'SET-98233', amount: 'GHS 8,920', date: '2024-05-31', status: 'Pending', type: 'Daily Settlement' },
    { id: 'SET-98232', amount: 'GHS 15,300', date: '2024-05-30', status: 'Processed', type: 'Weekly Settlement' },
    { id: 'SET-98231', amount: 'GHS 4,560', date: '2024-05-30', status: 'Processed', type: 'Adjustment' },
    { id: 'SET-98230', amount: 'GHS 22,100', date: '2024-05-29', status: 'Failed', type: 'Weekly Settlement' },
  ];

  return (
    <AdminLayout active="Finance" title="Finance Overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{stat.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {stat.isPositive ? <ArrowUpRight size={12} color="var(--success)" /> : <ArrowDownRight size={12} color="var(--danger)" />}
              <span style={{ fontSize: 10, fontWeight: 600, color: stat.isPositive ? 'var(--success)' : 'var(--danger)' }}>{stat.change}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Revenue Trend (12 Months)</h3>
            <button style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Monthly
            </button>
          </div>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 20 }}>
            {[45, 52, 48, 61, 58, 65, 72, 68, 81, 75, 88, 92].map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', height: `${v}%`, background: 'var(--brand-orange)', borderRadius: '4px 4px 0 0', opacity: i === 11 ? 1 : 0.6 }}></div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>Revenue Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {services.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.percentage}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${s.percentage}%`, height: '100%', background: s.color }}></div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{s.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Transactions</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Settlement ID', 'Type', 'Date', 'Amount', 'Status'].map((h) => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-primary)' }}>{t.id}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{t.type}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>{t.date}</td>
                  <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.amount}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: t.status === 'Processed' ? 'rgba(34,197,94,0.1)' : t.status === 'Failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: t.status === 'Processed' ? 'var(--success)' : t.status === 'Failed' ? 'var(--danger)' : 'var(--warning)'
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button style={{ width: '100%', padding: '10px', background: 'var(--brand-orange)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Process Settlement</button>
              <button style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Download size={14} /> Download Statement
              </button>
              <button style={{ width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FileText size={14} /> Tax Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
