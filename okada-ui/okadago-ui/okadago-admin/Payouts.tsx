import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Users, 
  Search, 
  Filter, 
  Download, 
  Smartphone, 
  Building2, 
  CreditCard,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function Payouts() {
  const stats = [
    { label: 'Total Payouts', value: 'GHS 157,500', color: 'var(--brand-orange)' },
    { label: 'Successful', value: 'GHS 146,250', percent: '89.6%', color: 'var(--success)' },
    { label: 'Pending', value: 'GHS 7,850', percent: '5%', color: 'var(--warning)' },
    { label: 'Failed', value: 'GHS 3,400', percent: '3.2%', color: 'var(--danger)' },
    { label: 'Total Riders Paid', value: '124', color: 'var(--info)' },
  ];

  const tabs = ['All Payouts', 'Pending', 'Completed', 'Failed', 'Cancelled'];

  const rows = [
    { rider: { name: 'Kofi Mensah', id: 'RID124567' }, method: 'MTN MoMo', amount: 'GHS 1,250', fees: 'GHS 12.50', net: 'GHS 1,237.50', ref: 'PAY-902345', status: 'Completed', date: 'May 31, 2024' },
    { rider: { name: 'Ama Serwaa', id: 'RID124568' }, method: 'Telecel Cash', amount: 'GHS 2,100', fees: 'GHS 21.00', net: 'GHS 2,079.00', ref: 'PAY-902346', status: 'Pending', date: 'May 31, 2024' },
    { rider: { name: 'Kwame Asare', id: 'RID124569' }, method: 'Bank Transfer', amount: 'GHS 3,500', fees: 'GHS 35.00', net: 'GHS 3,465.00', ref: 'PAY-902347', status: 'Completed', date: 'May 30, 2024' },
    { rider: { name: 'Akua Boakye', id: 'RID124570' }, method: 'MTN MoMo', amount: 'GHS 850', fees: 'GHS 8.50', net: 'GHS 841.50', ref: 'PAY-902348', status: 'Failed', date: 'May 30, 2024' },
    { rider: { name: 'Emmanuel Tetteh', id: 'RID124571' }, method: 'MTN MoMo', amount: 'GHS 1,120', fees: 'GHS 11.20', net: 'GHS 1,108.80', ref: 'PAY-902349', status: 'Completed', date: 'May 29, 2024' },
    { rider: { name: 'Derrick Mensah', id: 'RID124572' }, method: 'Telecel Cash', amount: 'GHS 1,450', fees: 'GHS 14.50', net: 'GHS 1,435.50', ref: 'PAY-902350', status: 'Completed', date: 'May 29, 2024' },
    { rider: { name: 'Sarah Appiah', id: 'RID124573' }, method: 'Bank Transfer', amount: 'GHS 2,800', fees: 'GHS 28.00', net: 'GHS 2,772.00', ref: 'PAY-902351', status: 'Pending', date: 'May 28, 2024' },
    { rider: { name: 'Prince Boateng', id: 'RID124574' }, method: 'MTN MoMo', amount: 'GHS 920', fees: 'GHS 9.20', net: 'GHS 910.80', ref: 'PAY-902352', status: 'Completed', date: 'May 28, 2024' },
    { rider: { name: 'Linda Osei', id: 'RID124575' }, method: 'MTN MoMo', amount: 'GHS 1,340', fees: 'GHS 13.40', net: 'GHS 1,326.60', ref: 'PAY-902353', status: 'Completed', date: 'May 27, 2024' },
    { rider: { name: 'Isaac Addo', id: 'RID124576' }, method: 'Telecel Cash', amount: 'GHS 1,560', fees: 'GHS 15.60', net: 'GHS 1,544.40', ref: 'PAY-902354', status: 'Failed', date: 'May 27, 2024' },
  ];

  return (
    <AdminLayout active="Payouts" title="Payouts Management" breadcrumbs={['Riders Management', 'Payouts']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 10, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>{stat.value}</div>
                {stat.percent && <div style={{ color: stat.color, fontSize: 10, fontWeight: 600 }}>({stat.percent})</div>}
              </div>
              <div style={{ marginTop: 10, width: '100%', height: 3, background: 'var(--border)', borderRadius: 2 }}>
                <div style={{ width: stat.percent || '100%', height: '100%', background: stat.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Tabs */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: '15px 20px' }}>
          <div style={{ display: 'flex', gap: 25, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {tabs.map((tab, i) => (
              <div key={tab} style={{ 
                paddingBottom: 12, fontSize: 13, color: i === 0 ? 'var(--brand-yellow)' : 'var(--text-muted)', 
                fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', borderBottom: i === 0 ? '2px solid var(--brand-yellow)' : 'none' 
              }}>
                {tab}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 15 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#111', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 15px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Search by rider name or ID..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 12, flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Payout Method', 'Status', 'Amount Range'].map(f => (
                <button key={f} style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {f} <MoreVertical size={12} />
                </button>
              ))}
              <button style={{ background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 600 }}>Apply</button>
            </div>
          </div>
        </div>

        {/* Main Content: Table and Side Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Table */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  {['Rider', 'Payout Method', 'Amount', 'Fees', 'Net Amount', 'Ref ID', 'Status', 'Date', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{row.rider.name[0]}</div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{row.rider.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{row.rider.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 11 }}>
                        {row.method === 'MTN MoMo' ? <Smartphone size={12} /> : row.method === 'Bank Transfer' ? <Building2 size={12} /> : <CreditCard size={12} />}
                        {row.method}
                      </div>
                    </td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-primary)', fontSize: 12 }}>{row.amount}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.fees}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--brand-yellow)', fontSize: 12, fontWeight: 600 }}>{row.net}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.ref}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: row.status === 'Completed' ? 'rgba(34,197,94,0.1)' : row.status === 'Pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: row.status === 'Completed' ? 'var(--success)' : row.status === 'Pending' ? 'var(--warning)' : 'var(--danger)'
                      }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.date}</td>
                    <td style={{ padding: '12px 15px' }}><MoreVertical size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
               <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Showing 1 to 10 of 124 entries</span>
               <div style={{ display: 'flex', gap: 5 }}>
                  <button style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>‹</button>
                  {[1, 2, 3].map(p => <button key={p} style={{ background: p === 1 ? 'var(--brand-yellow)' : '#111', border: '1px solid var(--border)', borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p === 1 ? '#111' : 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{p}</button>)}
                  <button style={{ background: '#111', border: '1px solid var(--border)', borderRadius: 4, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>›</button>
               </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Payout Methods */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 15 }}>Payout Methods Breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  <div style={{ width: 90, height: 90, borderRadius: '50%', border: '8px solid var(--border)', borderTopColor: 'var(--brand-yellow)', borderRightColor: 'var(--brand-orange)', borderBottomColor: 'var(--info)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {[
                    { label: 'MTN MoMo', val: '49.8%', color: 'var(--brand-yellow)' },
                    { label: 'Telecel Cash', val: '29.4%', color: 'var(--brand-orange)' },
                    { label: 'Bank Transfer', val: '20.8%', color: 'var(--info)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{item.label}</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 600 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payout Overview */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 15 }}>Payout Overview Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Average Payout', val: 'GHS 1,230.47' },
                  { label: 'Highest Payout', val: 'GHS 5,450' },
                  { label: 'Lowest Payout', val: 'GHS 45' },
                  { label: 'Success Rate', val: '89.6%', color: 'var(--success)' },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{stat.label}</span>
                    <span style={{ color: stat.color || 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 15 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button style={{ background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus size={14} /> Initiate Bulk Payout
                </button>
                <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Payout Settings
                </button>
                <button style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Download size={14} /> Download Payout Report
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
