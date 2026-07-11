import React, { useState, useCallback, useRef } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  DollarSign, TrendingUp, CreditCard, Clock, CheckCircle, Download, FileText, 
  ArrowUpRight, ArrowDownRight, Search, Filter, Calendar, Plus, ChevronRight
} from 'lucide-react';
import './_shared/tokens.css';

export default function Finance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const stats = [
    { label: 'Total Revenue', value: 'GHS 157,500.00', change: '12.6%', up: true, icon: DollarSign, color: 'var(--brand-orange)' },
    { label: 'Total Expenses', value: 'GHS 45,230.00', change: '6.4%', up: false, icon: TrendingUp, color: 'var(--info)' },
    { label: 'Net Profit', value: 'GHS 112,270.00', change: '17.8%', up: true, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Profit Margin', value: '71.3%', change: '3.2%', up: true, icon: CreditCard, color: 'var(--brand-yellow)' },
    { label: 'Outstanding Payables', value: 'GHS 12,450.00', change: '8 invoices', up: true, icon: FileText, color: 'var(--danger)' },
  ];

  const allTransactions = [
    { date: 'May 31, 2024', desc: 'Rider Payout - Kofi Mensah', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240531-1045', amount: '-GHS 247.50', status: 'Completed' },
    { date: 'May 31, 2024', desc: 'Customer Payment - Delivery', sub: 'Payment received', type: 'Income', category: 'Delivery Fees', ref: 'TXN-240531-8892', amount: '+GHS 45.00', status: 'Completed' },
    { date: 'May 30, 2024', desc: 'MTN MoMo Fees', sub: 'Transaction fees', type: 'Expense', category: 'Payment Fees', ref: 'FEE-240530-7781', amount: '-GHS 2.25', status: 'Completed' },
    { date: 'May 30, 2024', desc: 'Office Rent', sub: 'Monthly office rent', type: 'Expense', category: 'Rent', ref: 'EXP-240530-6670', amount: '-GHS 5,000.00', status: 'Completed' },
    { date: 'May 29, 2024', desc: 'Subscription - SMS Service', sub: 'SMS gateway subscription', type: 'Expense', category: 'Subscriptions', ref: 'EXP-240529-5580', amount: '-GHS 450.00', status: 'Completed' },
    { date: 'May 28, 2024', desc: 'Customer Payment - Express', sub: 'Payment received', type: 'Income', category: 'Delivery Fees', ref: 'TXN-240528-7721', amount: '+GHS 32.00', status: 'Completed' },
    { date: 'May 27, 2024', desc: 'Rider Payout - Ama Darko', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240527-9901', amount: '-GHS 185.00', status: 'Completed' },
    { date: 'May 26, 2024', desc: 'Fuel Reimbursement', sub: 'Fleet fuel costs', type: 'Expense', category: 'Operations', ref: 'EXP-240526-4412', amount: '-GHS 320.00', status: 'Completed' },
    { date: 'May 25, 2024', desc: 'Customer Payment - Standard', sub: 'Payment received', type: 'Income', category: 'Service Fees', ref: 'TXN-240525-6633', amount: '+GHS 55.00', status: 'Completed' },
    { date: 'May 24, 024', desc: 'Rider Payout - Kojo Asante', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240524-8812', amount: '-GHS 312.00', status: 'Completed' },
    { date: 'May 23, 2024', desc: 'Office Supplies', sub: 'Monthly supplies', type: 'Expense', category: 'Operations', ref: 'EXP-240523-3345', amount: '-GHS 275.00', status: 'Pending' },
    { date: 'May 22, 2024', desc: 'Customer Payment - Priority', sub: 'Payment received', type: 'Income', category: 'Delivery Fees', ref: 'TXN-240522-5521', amount: '+GHS 78.00', status: 'Completed' },
    { date: 'May 21, 2024', desc: 'Rider Payout - Yaa Adjei', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240521-7703', amount: '-GHS 198.00', status: 'Completed' },
    { date: 'May 20, 2024', desc: 'Internet Bill', sub: 'Monthly internet', type: 'Expense', category: 'Technology', ref: 'EXP-240520-2298', amount: '-GHS 350.00', status: 'Completed' },
    { date: 'May 19, 2024', desc: 'Customer Payment - Delivery', sub: 'Payment received', type: 'Income', category: 'Tips', ref: 'TXN-240519-4401', amount: '+GHS 15.00', status: 'Completed' },
    { date: 'May 18, 2024', desc: 'Rider Payout - Nana Boateng', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240518-6620', amount: '-GHS 275.00', status: 'Completed' },
    { date: 'May 17, 2024', desc: 'Marketing Campaign', sub: 'Social media ads', type: 'Expense', category: 'Marketing', ref: 'EXP-240517-1187', amount: '-GHS 1,200.00', status: 'Completed' },
    { date: 'May 16, 2024', desc: 'Customer Payment - Express', sub: 'Payment received', type: 'Income', category: 'Delivery Fees', ref: 'TXN-240516-3399', amount: '+GHS 62.00', status: 'Completed' },
    { date: 'May 15, 2024', desc: 'Rider Payout - Akua Owusu', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240515-5512', amount: '-GHS 234.00', status: 'Completed' },
    { date: 'May 14, 2024', desc: 'Server Hosting', sub: 'Monthly hosting fee', type: 'Expense', category: 'Technology', ref: 'EXP-240514-8876', amount: '-GHS 500.00', status: 'Completed' },
    { date: 'May 13, 2024', desc: 'Customer Payment - Standard', sub: 'Payment received', type: 'Income', category: 'Service Fees', ref: 'TXN-240513-2214', amount: '+GHS 40.00', status: 'Completed' },
    { date: 'May 12, 2024', desc: 'Rider Payout - Kweku Amoako', sub: 'Payout to rider', type: 'Payout', category: 'Rider Payouts', ref: 'PAYOUT-240512-4438', amount: '-GHS 289.00', status: 'Completed' },
    { date: 'May 11, 2024', desc: 'Insurance Payment', sub: 'Fleet insurance', type: 'Expense', category: 'Operations', ref: 'EXP-240511-7765', amount: '-GHS 2,100.00', status: 'Completed' },
    { date: 'May 10, 2024', desc: 'Customer Payment - Priority', sub: 'Payment received', type: 'Income', category: 'Delivery Fees', ref: 'TXN-240510-1187', amount: '+GHS 95.00', status: 'Completed' },
  ];

  const ITEMS_PER_PAGE = 5;

  const filteredTransactions = allTransactions.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.desc.toLowerCase().includes(q) ||
      t.sub.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.ref.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const btnHoverStyle = (base: React.CSSProperties): React.CSSProperties => ({
    ...base,
    transition: 'opacity 0.15s',
  });

  return (
    <AdminLayout active="Finance" title="Finance" breadcrumbs={['Dashboard', 'Finance']}>
      {/* Toast container */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--brand-yellow)',
              borderRadius: 8,
              padding: '10px 18px',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              animation: 'fadeIn 0.2s ease-in',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              style={btnHoverStyle({ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' })}
              onClick={() => addToast('Date range picker opened')}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Calendar size={14} /> May 1 – May 31, 2024
            </button>
            <button
              style={btnHoverStyle({ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' })}
              onClick={() => addToast('Filters panel opened')}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Filter size={14} /> Filters
            </button>
          </div>
          <button
            style={btnHoverStyle({ background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 })}
            onClick={() => addToast('Report exported successfully')}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Download size={14} /> Export Report
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: stat.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.change}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Revenue vs Expenses */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Revenue vs Expenses</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-orange)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Revenue (GHS)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Expenses (GHS)</span>
                </div>
                <select
                  value={chartPeriod}
                  onChange={e => setChartPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)' }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div style={{ height: 200, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                {[0, 50, 100, 150, 200].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--border)" strokeWidth="0.5" />
                ))}
                <polyline fill="none" stroke="var(--brand-orange)" strokeWidth="2" points="0,150 50,130 100,140 150,110 200,120 250,90 300,100 350,80 400,85 450,60 500,70 550,50 600,45" />
                <polyline fill="none" stroke="var(--danger)" strokeWidth="2" points="0,170 50,165 100,168 150,160 200,162 250,155 300,158 350,150 400,152 450,148 500,150 550,145 600,142" />
                <g transform="translate(200, 100)">
                  <rect x="-50" y="-40" width="100" height="50" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
                  <text x="0" y="-22" fill="var(--text-muted)" fontSize="8" textAnchor="middle">May 16, 2024</text>
                  <circle cx="-30" cy="-8" r="3" fill="var(--brand-orange)" />
                  <text x="-20" y="-5" fill="var(--text-primary)" fontSize="8" textAnchor="start">Revenue (GHS): 6,450.00</text>
                  <circle cx="-30" cy="5" r="3" fill="var(--danger)" />
                  <text x="-20" y="8" fill="var(--text-primary)" fontSize="8" textAnchor="start">Expenses (GHS): 1,850.00</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Revenue Breakdown + Cash Flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Revenue Breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-orange)" strokeWidth="10" strokeDasharray="109 251" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-yellow)" strokeWidth="10" strokeDasharray="67 251" strokeDashoffset="-109" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--success)" strokeWidth="10" strokeDasharray="42 251" strokeDashoffset="-176" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--info)" strokeWidth="10" strokeDasharray="25 251" strokeDashoffset="-218" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--text-muted)" strokeWidth="10" strokeDasharray="8 251" strokeDashoffset="-243" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>GHS</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>157,500.00</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>Total</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {[
                    { label: 'Delivery Fees', val: 'GHS 68,450.00 (43.5%)', color: 'var(--brand-orange)' },
                    { label: 'Service Fees', val: 'GHS 42,000.00 (26.7%)', color: 'var(--brand-yellow)' },
                    { label: 'Commission', val: 'GHS 26,500.00 (16.8%)', color: 'var(--success)' },
                    { label: 'Tips', val: 'GHS 15,500.00 (9.8%)', color: 'var(--info)' },
                    { label: 'Other Income', val: 'GHS 5,050.00 (3.2%)', color: 'var(--text-muted)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 10, flex: 1 }}>{item.label}</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 9, fontWeight: 600 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Cash Flow Summary</h3>
                <span
                  style={{ color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer' }}
                  onClick={() => addToast('Opening cash flow details...')}
                >
                  View Details
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Opening Balance', val: 'GHS 105,300.50' },
                  { label: '+ Total Inflows', val: 'GHS 157,500.00', color: 'var(--success)' },
                  { label: '- Total Outflows', val: 'GHS 45,230.00', color: 'var(--danger)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.label}</span>
                    <span style={{ color: item.color || 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{item.val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4 }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>Closing Balance</span>
                  <span style={{ color: 'var(--brand-yellow)', fontSize: 13, fontWeight: 700 }}>GHS 217,570.50</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Recent Transactions */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Recent Transactions</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by description, reference ID..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px 6px 30px', fontSize: 11, color: '#fff', outline: 'none', width: 220 }}
                  />
                </div>
                <span
                  style={{ color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={() => addToast('Loading all transactions...')}
                >
                  View All
                </span>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Description', 'Type', 'Category', 'Reference ID', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{t.date}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{t.desc}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t.sub}</div>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: t.type === 'Income' ? 'rgba(34,197,94,0.1)' : t.type === 'Payout' ? 'rgba(250,204,21,0.1)' : 'rgba(239,68,68,0.1)', color: t.type === 'Income' ? 'var(--success)' : t.type === 'Payout' ? 'var(--brand-yellow)' : 'var(--danger)' }}>{t.type}</span>
                    </td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-secondary)', fontSize: 11 }}>{t.category}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10 }}>{t.ref}</td>
                    <td style={{ padding: '12px 15px', color: t.amount.startsWith('+') ? 'var(--success)' : 'var(--danger)', fontSize: 12, fontWeight: 600 }}>{t.amount}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>{t.status}</span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <MoreHorizontal
                        size={14}
                        color="var(--text-muted)"
                        style={{ cursor: 'pointer' }}
                        onClick={() => addToast('Transaction actions menu opened')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Showing {filteredTransactions.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(safePage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    border: '1px solid var(--border)',
                    background: safePage <= 1 ? 'var(--bg-primary)' : 'var(--bg-card)',
                    color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: safePage <= 1 ? 'default' : 'pointer',
                    opacity: safePage <= 1 ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (safePage > 1) e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={e => { if (safePage > 1) e.currentTarget.style.opacity = '1'; }}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      border: '1px solid',
                      borderColor: page === safePage ? 'var(--brand-yellow)' : 'var(--border)',
                      background: page === safePage ? 'rgba(250,204,21,0.1)' : 'var(--bg-card)',
                      color: page === safePage ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: page === safePage ? 700 : 400,
                    }}
                    onMouseEnter={e => { if (page !== safePage) e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { if (page !== safePage) e.currentTarget.style.opacity = '1'; }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    border: '1px solid var(--border)',
                    background: safePage >= totalPages ? 'var(--bg-primary)' : 'var(--bg-card)',
                    color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: safePage >= totalPages ? 'default' : 'pointer',
                    opacity: safePage >= totalPages ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (safePage < totalPages) e.currentTarget.style.opacity = '0.7'; }}
                  onMouseLeave={e => { if (safePage < totalPages) e.currentTarget.style.opacity = '1'; }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Expense Breakdown + Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Expense Breakdown</h3>
                <span
                  style={{ color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer' }}
                  onClick={() => addToast('Opening expense breakdown...')}
                >
                  View Details
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Rider Payouts', amount: 'GHS 26,500.00', pct: '58.6%', color: 'var(--brand-orange)' },
                  { label: 'Operations', amount: 'GHS 8,450.00', pct: '18.7%', color: 'var(--brand-yellow)' },
                  { label: 'Marketing', amount: 'GHS 5,230.00', pct: '11.6%', color: 'var(--info)' },
                  { label: 'Technology', amount: 'GHS 3,150.00', pct: '7.0%', color: 'var(--success)' },
                  { label: 'Others', amount: 'GHS 1,900.00', pct: '4.1%', color: 'var(--text-muted)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 11, flex: 1 }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{item.amount}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 35, textAlign: 'right' }}>{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Create Invoice', icon: FileText, toastMsg: 'Create Invoice form opened' },
                  { label: 'Record Expense', icon: Plus, toastMsg: 'Record Expense form opened' },
                  { label: 'Add Funds', icon: DollarSign, toastMsg: 'Add Funds form opened' },
                  { label: 'Transfer Funds', icon: ArrowUpRight, toastMsg: 'Transfer Funds form opened' },
                ].map((action, i) => (
                  <button
                    key={i}
                    style={btnHoverStyle({ display: 'flex', alignItems: 'center', gap: 8, padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' })}
                    onClick={() => addToast(action.toastMsg)}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <action.icon size={14} color="var(--brand-yellow)" /> {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function MoreHorizontal(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      style={props.style}
      onClick={props.onClick}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}
