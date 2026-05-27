import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Search, 
  Wallet as WalletIcon, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  BarChart2, 
  ChevronRight,
  MoreHorizontal,
  Plus,
  CreditCard,
  Building2,
  Smartphone
} from 'lucide-react';

export default function Wallet() {
  const stats = [
    { label: 'Wallet Balance', value: 'GHS 1,250.50', icon: WalletIcon, color: 'var(--brand-yellow)' },
    { label: 'Total Earnings', value: 'GHS 158,750', icon: DollarSign, color: 'var(--brand-orange)' },
    { label: 'Total Payouts', value: 'GHS 157,500', icon: ArrowUpRight, color: 'var(--success)' },
    { label: 'Pending Payouts', value: 'GHS 2,350', icon: History, color: 'var(--warning)' },
    { label: 'Locked Balance', value: 'GHS 120', icon: CreditCard, color: 'var(--danger)' },
  ];

  const actions = [
    { label: 'Cash Out', icon: ArrowUpRight, desc: 'Withdraw to MoMo or Bank' },
    { label: 'Add Money', icon: Plus, desc: 'Top up wallet balance' },
    { label: 'Transaction History', icon: History, desc: 'View all transactions' },
    { label: 'Earnings Summary', icon: BarChart2, desc: 'View detailed earnings' },
  ];

  const bonuses = [
    { label: 'Peak Hour Bonus', amount: 'GHS 35' },
    { label: 'Weekend Bonus', amount: 'GHS 25' },
    { label: 'Completed Trips Bonus', amount: 'GHS 15' },
    { label: 'Referral Bonus', amount: 'GHS 20' },
  ];

  const transactions = [
    { date: 'May 31, 14:20', type: 'Cash Out', desc: 'MTN MoMo - 055 123 4567', amount: '-GHS 120', balance: 'GHS 1,250.50', status: 'Completed', ref: 'TXN-90234561' },
    { date: 'May 31, 12:45', type: 'Earnings', desc: 'Trip Earnings - East Legon to Osu', amount: '+GHS 45', balance: 'GHS 1,370.50', status: 'Completed', ref: 'TXN-90234558' },
    { date: 'May 31, 10:30', type: 'Bonus', desc: 'Peak Hour Bonus', amount: '+GHS 35', balance: 'GHS 1,325.50', status: 'Completed', ref: 'TXN-90234552' },
    { date: 'May 30, 18:15', type: 'Earnings', desc: 'Trip Earnings - Ridge to Airport', amount: '+GHS 38', balance: 'GHS 1,290.50', status: 'Completed', ref: 'TXN-90234545' },
    { date: 'May 30, 09:20', type: 'Top Up', desc: 'Wallet Top Up via Visa', amount: '+GHS 100', balance: 'GHS 1,252.50', status: 'Completed', ref: 'TXN-90234538' },
    { date: 'May 29, 16:40', type: 'Cash Out', desc: 'GCB Bank - **** 4567', amount: '-GHS 150', balance: 'GHS 1,152.50', status: 'Completed', ref: 'TXN-90234529' },
    { date: 'May 29, 11:25', type: 'Earnings', desc: 'Trip Earnings - Tema to Spintex', amount: '+GHS 42.50', balance: 'GHS 1,302.50', status: 'Completed', ref: 'TXN-90234522' },
  ];

  return (
    <AdminLayout active="Wallet" title="Wallet Management" breadcrumbs={['Riders Management', 'Wallet']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Header Search */}
        <div style={{ background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 15 }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search rider by name, phone or ID..." 
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, flex: 1 }}
          />
          <button style={{ background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 15px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Search</button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 15 }}>
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

        {/* Action Panel & Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Wallet Actions */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Wallet Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actions.map((action, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: '#111', cursor: 'pointer', border: '1px solid transparent' }} 
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-yellow)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <action.icon size={16} color="var(--brand-orange)" />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{action.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{action.desc}</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>

          {/* Balance Breakdown */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Balance Breakdown</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', border: '12px solid var(--border)', borderTopColor: 'var(--brand-yellow)', borderRightColor: 'var(--brand-orange)', borderBottomColor: 'var(--danger)' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>86.6%</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 8 }}>Available</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {[
                  { label: 'Available', percent: '86.6%', color: 'var(--brand-yellow)' },
                  { label: 'Pending', percent: '5.5%', color: 'var(--brand-orange)' },
                  { label: 'Locked', percent: '8.3%', color: 'var(--danger)' },
                  { label: 'Bonus', percent: '0%', color: 'var(--info)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{item.label}</span>
                    </div>
                    <span style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 600 }}>{item.percent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bonus & Incentives */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Bonus & Incentives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {bonuses.map((bonus, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={12} color="var(--success)" />
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{bonus.label}</span>
                  </div>
                  <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>{bonus.amount}</span>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', marginTop: 20, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>View All Bonuses</button>
          </div>
        </div>

        {/* Transaction History Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Transaction History</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>All Types</button>
              <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11 }}>Status: All</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Date & Time', 'Type', 'Description', 'Amount', 'Balance', 'Status', 'Reference ID'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{tx.date}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {tx.type === 'Cash Out' ? <ArrowUpRight size={12} color="var(--danger)" /> : 
                       tx.type === 'Earnings' ? <DollarSign size={12} color="var(--success)" /> :
                       tx.type === 'Bonus' ? <Plus size={12} color="var(--info)" /> : <ArrowDownLeft size={12} color="var(--success)" />}
                      <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{tx.type}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 11 }}>{tx.desc}</td>
                  <td style={{ padding: '12px 20px', color: tx.amount.startsWith('-') ? 'var(--danger)' : 'var(--success)', fontSize: 12, fontWeight: 600 }}>{tx.amount}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{tx.balance}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.1)', color: 'var(--success)', fontSize: 10, fontWeight: 600 }}>{tx.status}</span>
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tx.ref}</span>
                      <MoreHorizontal size={12} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'center' }}>
            <button style={{ color: 'var(--brand-yellow)', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View All Transactions</button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
