import React, { useState, useCallback } from 'react';
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
  Smartphone,
} from 'lucide-react';

type TxType = 'All' | 'Cash Out' | 'Earnings' | 'Bonus' | 'Top Up';
type TxStatus = 'All' | 'Completed' | 'Pending';

interface Transaction {
  date: string;
  type: string;
  desc: string;
  amount: string;
  balance: string;
  status: string;
  ref: string;
}

interface Toast {
  id: number;
  message: string;
}

export default function Wallet() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TxType>('All');
  const [statusFilter, setStatusFilter] = useState<TxStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const PAGE_SIZE = 7;

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const nextType = (current: TxType): TxType => {
    const types: TxType[] = ['All', 'Cash Out', 'Earnings', 'Bonus', 'Top Up'];
    const idx = types.indexOf(current);
    return types[(idx + 1) % types.length];
  };

  const nextStatus = (current: TxStatus): TxStatus => {
    const statuses: TxStatus[] = ['All', 'Completed', 'Pending'];
    const idx = statuses.indexOf(current);
    return statuses[(idx + 1) % statuses.length];
  };

  const stats = [
    { label: 'Wallet Balance', value: 'GHS 1,250.50', icon: WalletIcon, color: 'var(--brand-yellow)' },
    { label: 'Total Earnings', value: 'GHS 158,750', icon: DollarSign, color: 'var(--brand-orange)' },
    { label: 'Total Payouts', value: 'GHS 157,500', icon: ArrowUpRight, color: 'var(--success)' },
    { label: 'Pending Payouts', value: 'GHS 2,350', icon: History, color: 'var(--warning)' },
    { label: 'Locked Balance', value: 'GHS 120', icon: CreditCard, color: 'var(--danger)' },
  ];

  const actions = [
    { label: 'Cash Out', icon: ArrowUpRight, desc: 'Withdraw to MoMo or Bank', message: 'Cash Out form opened' },
    { label: 'Add Money', icon: Plus, desc: 'Top up wallet balance', message: 'Add Money form opened' },
    { label: 'Transaction History', icon: History, desc: 'View all transactions', message: 'Loading full transaction history...' },
    { label: 'Earnings Summary', icon: BarChart2, desc: 'View detailed earnings', message: 'Opening earnings summary...' },
  ];

  const bonuses = [
    { label: 'Peak Hour Bonus', amount: 'GHS 35' },
    { label: 'Weekend Bonus', amount: 'GHS 25' },
    { label: 'Completed Trips Bonus', amount: 'GHS 15' },
    { label: 'Referral Bonus', amount: 'GHS 20' },
  ];

  const allTransactions: Transaction[] = [
    { date: 'May 31, 14:20', type: 'Cash Out', desc: 'MTN MoMo - 055 123 4567', amount: '-GHS 120', balance: 'GHS 1,250.50', status: 'Completed', ref: 'TXN-90234561' },
    { date: 'May 31, 12:45', type: 'Earnings', desc: 'Trip Earnings - East Legon to Osu', amount: '+GHS 45', balance: 'GHS 1,370.50', status: 'Completed', ref: 'TXN-90234558' },
    { date: 'May 31, 10:30', type: 'Bonus', desc: 'Peak Hour Bonus', amount: '+GHS 35', balance: 'GHS 1,325.50', status: 'Completed', ref: 'TXN-90234552' },
    { date: 'May 30, 18:15', type: 'Earnings', desc: 'Trip Earnings - Ridge to Airport', amount: '+GHS 38', balance: 'GHS 1,290.50', status: 'Completed', ref: 'TXN-90234545' },
    { date: 'May 30, 09:20', type: 'Top Up', desc: 'Wallet Top Up via Visa', amount: '+GHS 100', balance: 'GHS 1,252.50', status: 'Completed', ref: 'TXN-90234538' },
    { date: 'May 29, 16:40', type: 'Cash Out', desc: 'GCB Bank - **** 4567', amount: '-GHS 150', balance: 'GHS 1,152.50', status: 'Completed', ref: 'TXN-90234529' },
    { date: 'May 29, 11:25', type: 'Earnings', desc: 'Trip Earnings - Tema to Spintex', amount: '+GHS 42.50', balance: 'GHS 1,302.50', status: 'Completed', ref: 'TXN-90234522' },
    { date: 'May 28, 17:00', type: 'Bonus', desc: 'Weekend Bonus', amount: '+GHS 25', balance: 'GHS 1,260.00', status: 'Completed', ref: 'TXN-90234510' },
    { date: 'May 28, 08:30', type: 'Earnings', desc: 'Trip Earnings - Cantonments to Labone', amount: '+GHS 32', balance: 'GHS 1,235.00', status: 'Pending', ref: 'TXN-90234505' },
    { date: 'May 27, 15:45', type: 'Cash Out', desc: 'MTN MoMo - 055 123 4567', amount: '-GHS 200', balance: 'GHS 1,203.00', status: 'Completed', ref: 'TXN-90234498' },
    { date: 'May 27, 10:00', type: 'Top Up', desc: 'Wallet Top Up via Bank Transfer', amount: '+GHS 300', balance: 'GHS 1,403.00', status: 'Completed', ref: 'TXN-90234490' },
    { date: 'May 26, 14:20', type: 'Earnings', desc: 'Trip Earnings - Spintex to Tema', amount: '+GHS 38.50', balance: 'GHS 1,103.00', status: 'Completed', ref: 'TXN-90234485' },
    { date: 'May 26, 09:10', type: 'Bonus', desc: 'Completed Trips Bonus', amount: '+GHS 15', balance: 'GHS 1,064.50', status: 'Completed', ref: 'TXN-90234478' },
    { date: 'May 25, 16:50', type: 'Cash Out', desc: 'GCB Bank - **** 4567', amount: '-GHS 175', balance: 'GHS 1,049.50', status: 'Completed', ref: 'TXN-90234470' },
    { date: 'May 25, 11:30', type: 'Earnings', desc: 'Trip Earnings - Osu to Labone', amount: '+GHS 28', balance: 'GHS 1,224.50', status: 'Pending', ref: 'TXN-90234465' },
    { date: 'May 24, 13:00', type: 'Bonus', desc: 'Referral Bonus', amount: '+GHS 20', balance: 'GHS 1,196.50', status: 'Completed', ref: 'TXN-90234458' },
    { date: 'May 24, 08:45', type: 'Earnings', desc: 'Trip Earnings - East Legon to Airport', amount: '+GHS 55', balance: 'GHS 1,176.50', status: 'Completed', ref: 'TXN-90234450' },
    { date: 'May 23, 15:20', type: 'Top Up', desc: 'Wallet Top Up via Visa', amount: '+GHS 500', balance: 'GHS 1,121.50', status: 'Completed', ref: 'TXN-90234442' },
    { date: 'May 23, 10:15', type: 'Cash Out', desc: 'MTN MoMo - 055 123 4567', amount: '-GHS 100', balance: 'GHS 621.50', status: 'Completed', ref: 'TXN-90234435' },
    { date: 'May 22, 14:40', type: 'Earnings', desc: 'Trip Earnings - Tema to East Legon', amount: '+GHS 48', balance: 'GHS 721.50', status: 'Completed', ref: 'TXN-90234428' },
  ];

  const typeOptions: TxType[] = ['All', 'Cash Out', 'Earnings', 'Bonus', 'Top Up'];
  const statusOptions: TxStatus[] = ['All', 'Completed', 'Pending'];

  const filtered = allTransactions.filter((tx) => {
    const matchesSearch =
      searchQuery === '' ||
      tx.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.ref.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || tx.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || tx.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  return (
    <AdminLayout active="Wallet" title="Wallet Management" breadcrumbs={['Riders Management', 'Wallet']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Toast Container */}
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: 'var(--brand-orange)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                animation: 'fadeIn 0.2s ease-in',
              }}
            >
              {t.message}
            </div>
          ))}
        </div>

        {/* Header Search */}
        <div style={{ background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 15 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search rider by name, phone or ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13, flex: 1 }}
          />
          <button
            onClick={() => showToast('Searching riders...')}
            style={{ background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 15px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Search
          </button>
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
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: '#111', cursor: 'pointer', border: '1px solid transparent' }}
                  onClick={() => showToast(action.message)}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--brand-yellow)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                >
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
            <button
              onClick={() => showToast('Loading all bonuses...')}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.color = 'var(--brand-yellow)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              style={{ width: '100%', marginTop: 20, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}
            >
              View All Bonuses
            </button>
          </div>
        </div>

        {/* Transaction History Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Transaction History</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { const next = nextType(typeFilter); setTypeFilter(next); setCurrentPage(1); }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.color = 'var(--brand-yellow)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}
              >
                {typeFilter === 'All' ? 'All Types' : typeFilter}
              </button>
              <button
                onClick={() => { const next = nextStatus(statusFilter); setStatusFilter(next); setCurrentPage(1); }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.color = 'var(--brand-yellow)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}
              >
                Status: {statusFilter}
              </button>
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginated.map((tx, i) => (
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
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: tx.status === 'Completed' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)', color: tx.status === 'Completed' ? 'var(--success)' : 'var(--warning)', fontSize: 10, fontWeight: 600 }}>{tx.status}</span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{tx.ref}</span>
                        <MoreHorizontal
                          size={12}
                          color="var(--text-muted)"
                          style={{ cursor: 'pointer' }}
                          onClick={() => showToast('Transaction details opened')}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              disabled={safeCurrentPage <= 1}
              onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); }}
              style={{
                color: safeCurrentPage <= 1 ? 'var(--text-muted)' : 'var(--brand-yellow)',
                background: 'transparent',
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: safeCurrentPage <= 1 ? 'default' : 'pointer',
                opacity: safeCurrentPage <= 1 ? 0.4 : 1,
              }}
            >
              ← Prev
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Page {safeCurrentPage} of {totalPages} ({filtered.length} results)
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => showToast('Loading all transactions...')}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--brand-yellow)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--brand-yellow)'; }}
                style={{ color: 'var(--brand-yellow)', background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                View All Transactions
              </button>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); }}
                style={{
                  color: safeCurrentPage >= totalPages ? 'var(--text-muted)' : 'var(--brand-yellow)',
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: safeCurrentPage >= totalPages ? 'default' : 'pointer',
                  opacity: safeCurrentPage >= totalPages ? 0.4 : 1,
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
