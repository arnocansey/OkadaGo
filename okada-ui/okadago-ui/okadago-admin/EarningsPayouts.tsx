import React, { useState, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  DollarSign, TrendingUp, Clock, AlertCircle, Download, ArrowUpRight, 
  ArrowDownRight, Filter, Calendar, CheckCircle
} from 'lucide-react';
import './_shared/tokens.css';

interface Toast {
  id: number;
  message: string;
}

export default function EarningsPayouts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [chartPeriod, setChartPeriod] = useState('Daily');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const stats = [
    { label: 'Total Earnings Distributed', value: 'GHS 1,158,250', change: '12.5%', up: true, icon: DollarSign, color: 'var(--brand-orange)' },
    { label: 'This Month', value: 'GHS 146,400', change: '8.3%', up: true, icon: TrendingUp, color: 'var(--info)' },
    { label: 'Pending Payouts', value: 'GHS 7,850', change: '3 pending', up: false, icon: Clock, color: 'var(--warning)' },
    { label: 'Processed Payouts', value: 'GHS 157,500', change: '98.2% success', up: true, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Failure Rate', value: '3.2%', change: '0.5% from last month', up: false, icon: AlertCircle, color: 'var(--danger)' },
  ];

  const pendingPayouts = [
    { rider: 'Kofi Mensah', id: 'RID124567', amount: 'GHS 850.00', method: 'MTN MoMo', date: '2024-05-31', status: 'Pending' },
    { rider: 'Ama Serwaa', id: 'RID124568', amount: 'GHS 1,200.50', method: 'Telecel Cash', date: '2024-05-31', status: 'Pending' },
    { rider: 'Kwame Asare', id: 'RID124569', amount: 'GHS 650.00', method: 'Bank Transfer', date: '2024-05-31', status: 'Processing' },
    { rider: 'Akua Boakye', id: 'RID124570', amount: 'GHS 980.25', method: 'MTN MoMo', date: '2024-05-31', status: 'Pending' },
    { rider: 'Emmanuel Tetteh', id: 'RID124571', amount: 'GHS 1,450.00', method: 'Telecel Cash', date: '2024-05-31', status: 'Pending' },
    { rider: 'Abena Osei', id: 'RID124572', amount: 'GHS 725.00', method: 'MTN MoMo', date: '2024-05-30', status: 'Completed' },
    { rider: 'Yaw Boateng', id: 'RID124573', amount: 'GHS 1,100.00', method: 'Bank Transfer', date: '2024-05-30', status: 'Completed' },
  ];

  const topEarners = [
    { name: 'Kofi Mensah', amount: 'GHS 8,450', trips: 432, rank: 1 },
    { name: 'Ama Serwaa', amount: 'GHS 7,980', trips: 389, rank: 2 },
    { name: 'Kwame Asare', amount: 'GHS 7,120', trips: 354, rank: 3 },
    { name: 'Akua Boakye', amount: 'GHS 6,540', trips: 321, rank: 4 },
    { name: 'Emmanuel Tetteh', amount: 'GHS 5,990', trips: 298, rank: 5 },
  ];

  const payoutHistoryData = [
    { date: 'May 31, 14:20', rider: 'Kofi Mensah', method: 'MTN MoMo', amount: '-GHS 247.50', status: 'Completed' },
    { date: 'May 31, 12:45', rider: 'Ama Serwaa', method: 'Telecel Cash', amount: '-GHS 312.00', status: 'Completed' },
    { date: 'May 31, 10:30', rider: 'Kwame Asare', method: 'Bank Transfer', amount: '-GHS 185.00', status: 'Processing' },
    { date: 'May 30, 18:15', rider: 'Akua Boakye', method: 'MTN MoMo', amount: '-GHS 276.50', status: 'Completed' },
    { date: 'May 30, 09:20', rider: 'Emmanuel Tetteh', method: 'Telecel Cash', amount: '-GHS 425.00', status: 'Completed' },
    { date: 'May 29, 16:40', rider: 'Abena Osei', method: 'MTN MoMo', amount: '-GHS 198.00', status: 'Completed' },
    { date: 'May 29, 11:25', rider: 'Yaw Boateng', method: 'Bank Transfer', amount: '-GHS 310.00', status: 'Failed' },
    { date: 'May 28, 15:30', rider: 'Kofi Mensah', method: 'MTN MoMo', amount: '-GHS 247.50', status: 'Completed' },
    { date: 'May 28, 08:45', rider: 'Ama Serwaa', method: 'Telecel Cash', amount: '-GHS 312.00', status: 'Completed' },
    { date: 'May 27, 14:15', rider: 'Kwame Asare', method: 'Bank Transfer', amount: '-GHS 185.00', status: 'Completed' },
  ];

  const filteredHistory = payoutHistoryData.filter(tx => {
    const q = searchQuery.toLowerCase();
    return tx.rider.toLowerCase().includes(q) || tx.method.toLowerCase().includes(q);
  });

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedHistory = filteredHistory.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
      setAllSelected(false);
    } else {
      const all = new Set(pendingPayouts.map((_, i) => i));
      setSelectedRows(all);
      setAllSelected(true);
      addToast('All riders selected');
    }
  };

  const handleSelectRow = (index: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
    addToast('Rider selected for batch action');
  };

  const btnBase: React.CSSProperties = {
    transition: 'all 0.15s ease',
  };

  return (
    <AdminLayout active="Earnings & Payouts" title="Earnings & Payouts" breadcrumbs={['Dashboard', 'Earnings & Payouts']}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 12,
              color: 'var(--text-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'fadeIn 0.2s ease',
              maxWidth: 300,
            }}>
              {t.message}
            </div>
          ))}
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .ep-btn:hover { opacity: 0.85; transform: translateY(-1px); }
          .ep-btn:active { transform: translateY(0); }
          .ep-btn-ghost:hover { background: var(--bg-primary); }
          .ep-action:hover { text-decoration: underline; }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="ep-btn" style={{ ...btnBase, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => addToast('Date range picker opened')}>
                <Calendar size={14} /> May 1 - May 31, 2024
              </button>
              <button className="ep-btn" style={{ ...btnBase, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => addToast('Filters panel opened')}>
                <Filter size={14} /> Filters
              </button>
            </div>
            <button className="ep-btn" style={{ ...btnBase, background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => addToast('Report exported successfully')}>
              <Download size={14} /> Export Report
            </button>
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Earnings Overview</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-orange)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Net Earnings (GHS)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-yellow)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Gross Earnings (GHS)</span>
                  </div>
                  <select value={chartPeriod} onChange={e => setChartPeriod(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>
              <div style={{ height: 200, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {[0, 50, 100, 150, 200].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--border)" strokeWidth="0.5" />
                  ))}
                  <polyline fill="none" stroke="var(--brand-orange)" strokeWidth="2" points="0,150 50,135 100,140 150,115 200,125 250,95 300,105 350,80 400,90 450,65 500,75 550,55 600,50" />
                  <polyline fill="none" stroke="var(--brand-yellow)" strokeWidth="2" points="0,170 50,160 100,165 150,145 200,150 250,125 300,135 350,110 400,120 450,95 500,105 550,85 600,80" />
                  <g transform="translate(250, 85)">
                    <rect x="-50" y="-40" width="100" height="50" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" />
                    <text x="0" y="-22" fill="var(--text-muted)" fontSize="8" textAnchor="middle">May 17, 2024</text>
                    <circle cx="-30" cy="-8" r="3" fill="var(--brand-orange)" />
                    <text x="-20" y="-5" fill="var(--text-primary)" fontSize="8" textAnchor="start">Net: 4,705</text>
                    <circle cx="-30" cy="5" r="3" fill="var(--brand-yellow)" />
                    <text x="-20" y="8" fill="var(--text-primary)" fontSize="8" textAnchor="start">Gross: 5,120</text>
                  </g>
                </svg>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Earnings by Service Type</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-orange)" strokeWidth="10" strokeDasharray="125 251" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-yellow)" strokeWidth="10" strokeDasharray="67 251" strokeDashoffset="-125" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--info)" strokeWidth="10" strokeDasharray="42 251" strokeDashoffset="-192" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--success)" strokeWidth="10" strokeDasharray="17 251" strokeDashoffset="-234" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>GHS</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700 }}>146,400</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>Total</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {[
                    { label: 'Boda', pct: '49.8%', val: 'GHS 72,900', color: 'var(--brand-orange)' },
                    { label: 'Kiosk', pct: '26.7%', val: 'GHS 39,090', color: 'var(--brand-yellow)' },
                    { label: 'Errands', pct: '16.8%', val: 'GHS 24,595', color: 'var(--info)' },
                    { label: 'Express', pct: '6.7%', val: 'GHS 9,815', color: 'var(--success)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: 'var(--text-secondary)', fontSize: 10, flex: 1 }}>{item.label}</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 9, fontWeight: 600 }}>{item.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Pending Payouts</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="ep-btn" style={{ ...btnBase, background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }} onClick={() => addToast('Processing all pending payouts...')}>Process All</button>
                  <button className="ep-btn" style={{ ...btnBase, background: 'var(--brand-yellow)', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#111', cursor: 'pointer' }} onClick={() => addToast('Downloading payout report...')}>Download</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 20px', width: 40 }}>
                      <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
                    </th>
                    {['Rider', 'ID', 'Method', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingPayouts.map((p, i) => {
                    const sc = statusColor(p.status);
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <input type="checkbox" checked={selectedRows.has(i)} onChange={() => handleSelectRow(i)} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{p.rider}</td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 11 }}>{p.id}</td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 11 }}>{p.method}</td>
                        <td style={{ padding: '12px 20px', color: 'var(--brand-orange)', fontSize: 12, fontWeight: 600 }}>{p.amount}</td>
                        <td style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 11 }}>{p.date}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 4, background: sc.bg, color: sc.fg, fontSize: 10, fontWeight: 600 }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          <span className="ep-action" style={{ color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer' }} onClick={() => addToast('Opening payout action menu...')}>Action</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Payout Schedule</h3>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--info)', marginBottom: 4 }}>
                    <Clock size={16} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Next Auto-Process</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Tomorrow, 6:00 AM</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Daily automated payout processing enabled</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Payout Methods</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                  <div style={{ position: 'relative', width: 90, height: 90 }}>
                    <svg width="90" height="90" viewBox="0 0 90 90">
                      <circle cx="45" cy="45" r="35" fill="none" stroke="var(--brand-orange)" strokeWidth="9" strokeDasharray="110 220" strokeDashoffset="0" />
                      <circle cx="45" cy="45" r="35" fill="none" stroke="var(--brand-yellow)" strokeWidth="9" strokeDasharray="66 220" strokeDashoffset="-110" />
                      <circle cx="45" cy="45" r="35" fill="none" stroke="var(--info)" strokeWidth="9" strokeDasharray="44 220" strokeDashoffset="-176" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    {[
                      { label: 'MTN MoMo', pct: '50%', color: 'var(--brand-orange)' },
                      { label: 'Telecel Cash', pct: '30%', color: 'var(--brand-yellow)' },
                      { label: 'Bank Transfer', pct: '20%', color: 'var(--info)' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                          <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{item.label}</span>
                        </div>
                        <span style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 600 }}>{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Payout History</h3>
                <input
                  type="text"
                  placeholder="Search rider or method..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    width: 180,
                  }}
                />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date & Time', 'Rider', 'Method', 'Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        No matching payout records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((tx, i) => {
                      const sc = statusColor(tx.status);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 11 }}>{tx.date}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{tx.rider}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: 11 }}>{tx.method}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>{tx.amount}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 4, background: sc.bg, color: sc.fg, fontSize: 10, fontWeight: 600 }}>{tx.status}</span>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <span className="ep-action" style={{ color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer' }} onClick={() => addToast('Opening payout details...')}>View</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Page {safePage} of {totalPages} ({filteredHistory.length} results)
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="ep-btn ep-btn-ghost"
                      style={{ ...btnBase, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: safePage <= 1 ? 'default' : 'pointer', opacity: safePage <= 1 ? 0.5 : 1 }}
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Prev
                    </button>
                    <button
                      className="ep-btn ep-btn-ghost"
                      style={{ ...btnBase, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: safePage >= totalPages ? 'default' : 'pointer', opacity: safePage >= totalPages ? 0.5 : 1 }}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Top Earners (This Month)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topEarners.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--brand-orange)' }}>{e.rank}</div>
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

              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Payout Processing Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Completed', value: '89.6%', color: 'var(--success)' },
                    { label: 'Pending', value: '5.0%', color: 'var(--brand-yellow)' },
                    { label: 'Failed', value: '3.2%', color: 'var(--danger)' },
                    { label: 'Cancelled', value: '2.2%', color: 'var(--text-muted)' },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: s.value, height: '100%', background: s.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const statusColor = (s: string) => {
  if (s === 'Completed') return { bg: 'rgba(34,197,94,0.1)', fg: 'var(--success)' };
  if (s === 'Processing') return { bg: 'rgba(250,204,21,0.1)', fg: 'var(--brand-yellow)' };
  if (s === 'Failed') return { bg: 'rgba(239,68,68,0.1)', fg: 'var(--danger)' };
  return { bg: 'rgba(250,204,21,0.1)', fg: 'var(--brand-yellow)' };
};