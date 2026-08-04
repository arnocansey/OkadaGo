import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  CheckCircle, Clock, XCircle, Users, Search, Filter, Download, 
  Smartphone, Building2, CreditCard, MoreVertical, ChevronLeft, ChevronRight,
  User, ArrowUpRight, ArrowDownRight, Plus, Calendar
} from 'lucide-react';
import './_shared/tokens.css';

interface PayoutRow {
  rider: string;
  id: string;
  method: string;
  amount: string;
  fees: string;
  net: string;
  ref: string;
  status: string;
  date: string;
}

interface Toast {
  id: number;
  message: string;
}

const allRows: PayoutRow[] = [
  { rider: 'Kofi Mensah', id: 'RID124567', method: 'MTN MoMo', amount: 'GHS 250.00', fees: 'GHS 2.50', net: 'GHS 247.50', ref: 'PAYOUT-240531-1045', status: 'Completed', date: 'May 31, 2024 10:45 AM' },
  { rider: 'Ama Serwaa', id: 'RID124568', method: 'Telecel Cash', amount: 'GHS 180.00', fees: 'GHS 1.80', net: 'GHS 178.20', ref: 'PAYOUT-240531-0930', status: 'Completed', date: 'May 31, 2024 09:30 AM' },
  { rider: 'Kwame Asare', id: 'RID124569', method: 'Bank Transfer', amount: 'GHS 320.00', fees: 'GHS 3.20', net: 'GHS 316.80', ref: 'PAYOUT-240530-0815', status: 'Completed', date: 'May 30, 2024 08:15 PM' },
  { rider: 'Akua Boakye', id: 'RID124570', method: 'MTN MoMo', amount: 'GHS 145.00', fees: 'GHS 1.45', net: 'GHS 143.55', ref: 'PAYOUT-240530-0540', status: 'Pending', date: 'May 30, 2024' },
  { rider: 'Emmanuel Tetteh', id: 'RID124571', method: 'Telecel Cash', amount: 'GHS 210.00', fees: 'GHS 2.10', net: 'GHS 207.90', ref: 'PAYOUT-240530-0325', status: 'Completed', date: 'May 30, 2024 03:25 PM' },
  { rider: 'Abdulai Mohammed', id: 'RID124572', method: 'Bank Transfer', amount: 'GHS 400.00', fees: 'GHS 4.00', net: 'GHS 396.00', ref: 'PAYOUT-240529-1110', status: 'Failed', date: 'May 29, 2024 11:10 AM' },
  { rider: 'Michael Owusu', id: 'RID124573', method: 'MTN MoMo', amount: 'GHS 160.00', fees: 'GHS 1.60', net: 'GHS 158.40', ref: 'PAYOUT-240529-0905', status: 'Completed', date: 'May 29, 2024 09:05 AM' },
  { rider: 'Joseph Appiah', id: 'RID124574', method: 'Telecel Cash', amount: 'GHS 175.00', fees: 'GHS 1.75', net: 'GHS 173.25', ref: 'PAYOUT-240528-0700', status: 'Pending', date: 'May 28, 2024' },
  { rider: 'Samuel Mensah', id: 'RID124575', method: 'Bank Transfer', amount: 'GHS 280.00', fees: 'GHS 2.80', net: 'GHS 277.20', ref: 'PAYOUT-240528-0615', status: 'Completed', date: 'May 28, 2024 06:15 AM' },
  { rider: 'Daniel Arthur', id: 'RID124576', method: 'MTN MoMo', amount: 'GHS 195.00', fees: 'GHS 1.95', net: 'GHS 193.05', ref: 'PAYOUT-240527-2000', status: 'Failed', date: 'May 27, 2024 08:00 PM' },
  { rider: 'Nana Adu', id: 'RID124577', method: 'MTN MoMo', amount: 'GHS 310.00', fees: 'GHS 3.10', net: 'GHS 306.90', ref: 'PAYOUT-240527-1420', status: 'Completed', date: 'May 27, 2024 02:20 PM' },
  { rider: 'Esi Bonsu', id: 'RID124578', method: 'Telecel Cash', amount: 'GHS 95.00', fees: 'GHS 0.95', net: 'GHS 94.05', ref: 'PAYOUT-240526-1130', status: 'Completed', date: 'May 26, 2024 11:30 AM' },
  { rider: 'Yaw Boateng', id: 'RID124579', method: 'Bank Transfer', amount: 'GHS 420.00', fees: 'GHS 4.20', net: 'GHS 415.80', ref: 'PAYOUT-240526-0910', status: 'Completed', date: 'May 26, 2024 09:10 AM' },
  { rider: 'Efua Ansah', id: 'RID124580', method: 'MTN MoMo', amount: 'GHS 175.00', fees: 'GHS 1.75', net: 'GHS 173.25', ref: 'PAYOUT-240525-1645', status: 'Pending', date: 'May 25, 2024' },
  { rider: 'Kojo Frimpong', id: 'RID124581', method: 'Telecel Cash', amount: 'GHS 230.00', fees: 'GHS 2.30', net: 'GHS 227.70', ref: 'PAYOUT-240525-0800', status: 'Completed', date: 'May 25, 2024 08:00 AM' },
  { rider: 'Aba Kyere', id: 'RID124582', method: 'Bank Transfer', amount: 'GHS 510.00', fees: 'GHS 5.10', net: 'GHS 504.90', ref: 'PAYOUT-240524-1320', status: 'Completed', date: 'May 24, 2024 01:20 PM' },
  { rider: 'Kwesi Appiah', id: 'RID124583', method: 'MTN MoMo', amount: 'GHS 88.00', fees: 'GHS 0.88', net: 'GHS 87.12', ref: 'PAYOUT-240524-1005', status: 'Failed', date: 'May 24, 2024 10:05 AM' },
  { rider: 'Adwoa Poku', id: 'RID124584', method: 'Telecel Cash', amount: 'GHS 265.00', fees: 'GHS 2.65', net: 'GHS 262.35', ref: 'PAYOUT-240523-0750', status: 'Completed', date: 'May 23, 2024 07:50 AM' },
  { rider: 'Yaw Mensah', id: 'RID124585', method: 'Bank Transfer', amount: 'GHS 340.00', fees: 'GHS 3.40', net: 'GHS 336.60', ref: 'PAYOUT-240523-1430', status: 'Completed', date: 'May 23, 2024 02:30 PM' },
  { rider: 'Akosua Dufie', id: 'RID124586', method: 'MTN MoMo', amount: 'GHS 195.00', fees: 'GHS 1.95', net: 'GHS 193.05', ref: 'PAYOUT-240522-1115', status: 'Pending', date: 'May 22, 2024' },
  { rider: 'Kofi Amoako', id: 'RID124587', method: 'Telecel Cash', amount: 'GHS 285.00', fees: 'GHS 2.85', net: 'GHS 282.15', ref: 'PAYOUT-240522-0940', status: 'Completed', date: 'May 22, 2024 09:40 AM' },
  { rider: 'Abena Osei', id: 'RID124588', method: 'Bank Transfer', amount: 'GHS 450.00', fees: 'GHS 4.50', net: 'GHS 445.50', ref: 'PAYOUT-240521-1500', status: 'Completed', date: 'May 21, 2024 03:00 PM' },
  { rider: 'Kwaku Takyi', id: 'RID124589', method: 'MTN MoMo', amount: 'GHS 125.00', fees: 'GHS 1.25', net: 'GHS 123.75', ref: 'PAYOUT-240521-0820', status: 'Failed', date: 'May 21, 2024 08:20 AM' },
  { rider: 'Akua Manu', id: 'RID124590', method: 'Telecel Cash', amount: 'GHS 210.00', fees: 'GHS 2.10', net: 'GHS 207.90', ref: 'PAYOUT-240520-1245', status: 'Completed', date: 'May 20, 2024 12:45 PM' },
  { rider: 'Samuel Antwi', id: 'RID124591', method: 'Bank Transfer', amount: 'GHS 380.00', fees: 'GHS 3.80', net: 'GHS 376.20', ref: 'PAYOUT-240520-1010', status: 'Completed', date: 'May 20, 2024 10:10 AM' },
  { rider: 'Ama Badu', id: 'RID124592', method: 'MTN MoMo', amount: 'GHS 155.00', fees: 'GHS 1.55', net: 'GHS 153.45', ref: 'PAYOUT-240519-1420', status: 'Pending', date: 'May 19, 2024' },
  { rider: 'Kwabena Asiedu', id: 'RID124593', method: 'Telecel Cash', amount: 'GHS 295.00', fees: 'GHS 2.95', net: 'GHS 292.05', ref: 'PAYOUT-240519-0850', status: 'Completed', date: 'May 19, 2024 08:50 AM' },
  { rider: 'Abena Mensah', id: 'RID124594', method: 'Bank Transfer', amount: 'GHS 425.00', fees: 'GHS 4.25', net: 'GHS 420.75', ref: 'PAYOUT-240518-1600', status: 'Completed', date: 'May 18, 2024 04:00 PM' },
  { rider: 'Kofi Nkrumah', id: 'RID124595', method: 'MTN MoMo', amount: 'GHS 180.00', fees: 'GHS 1.80', net: 'GHS 178.20', ref: 'PAYOUT-240518-1130', status: 'Failed', date: 'May 18, 2024 11:30 AM' },
  { rider: 'Ama Dufie', id: 'RID124596', method: 'Telecel Cash', amount: 'GHS 240.00', fees: 'GHS 2.40', net: 'GHS 237.60', ref: 'PAYOUT-240517-0900', status: 'Completed', date: 'May 17, 2024 09:00 AM' },
  { rider: 'Yaw Boateng', id: 'RID124597', method: 'Bank Transfer', amount: 'GHS 365.00', fees: 'GHS 3.65', net: 'GHS 361.35', ref: 'PAYOUT-240517-1350', status: 'Completed', date: 'May 17, 2024 01:50 PM' },
  { rider: 'Efua Serwaa', id: 'RID124598', method: 'MTN MoMo', amount: 'GHS 110.00', fees: 'GHS 1.10', net: 'GHS 108.90', ref: 'PAYOUT-240516-1025', status: 'Completed', date: 'May 16, 2024 10:25 AM' },
  { rider: 'Kwesi Appiah', id: 'RID124599', method: 'Telecel Cash', amount: 'GHS 275.00', fees: 'GHS 2.75', net: 'GHS 272.25', ref: 'PAYOUT-240516-0800', status: 'Pending', date: 'May 16, 2024' },
  { rider: 'Adwoa Boakye', id: 'RID124600', method: 'Bank Transfer', amount: 'GHS 490.00', fees: 'GHS 4.90', net: 'GHS 485.10', ref: 'PAYOUT-240515-1530', status: 'Completed', date: 'May 15, 2024 03:30 PM' },
];

const ROWS_PER_PAGE = 8;

export default function Payouts() {
  const [activeTab, setActiveTab] = useState('All Payouts');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const stats = [
    { label: 'Total Payouts', value: 'GHS 157,500.00', sub: '128 payouts', icon: ArrowUpRight, color: 'var(--brand-orange)' },
    { label: 'Successful Payouts', value: 'GHS 146,250.00', sub: '115 payouts (89.6%)', icon: CheckCircle, color: 'var(--success)' },
    { label: 'Pending Payouts', value: 'GHS 7,850.00', sub: '8 payouts (5.0%)', icon: Clock, color: 'var(--warning)' },
    { label: 'Failed Payouts', value: 'GHS 3,400.00', sub: '5 payouts (3.2%)', icon: XCircle, color: 'var(--danger)' },
    { label: 'Total Riders Paid', value: '124', sub: 'Out of 2,350 riders', icon: Users, color: 'var(--info)' },
  ];

  const tabs = ['All Payouts', 'Pending', 'Processing', 'Completed', 'Failed'];

  const filteredRows = allRows.filter(row => {
    const matchesTab =
      activeTab === 'All Payouts' ||
      (activeTab === 'Pending' && row.status === 'Pending') ||
      (activeTab === 'Processing' && row.status === 'Processing') ||
      (activeTab === 'Completed' && row.status === 'Completed') ||
      (activeTab === 'Failed' && (row.status === 'Failed' || row.status === 'Cancelled'));
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      row.rider.toLowerCase().includes(q) ||
      row.id.toLowerCase().includes(q) ||
      row.ref.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === 'All' || row.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice(
    (safeCurrentPage - 1) * ROWS_PER_PAGE,
    safeCurrentPage * ROWS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    addToast(`Viewing ${tab} payouts`);
  };

  const handleRowClick = (row: PayoutRow, idx: number) => {
    setSelectedRow(idx);
    addToast(`Viewing payout details for ${row.rider}`);
  };

  const handleRowAction = (row: PayoutRow, e: React.MouseEvent) => {
    e.stopPropagation();
    addToast(`Payout actions menu opened for ${row.rider}`);
  };

  const handleDonutLegend = (method: string) => {
    addToast(`Highlighting ${method}...`);
  };

  const handleExportCSV = () => {
    addToast('Exporting payout data...');
  };

  const handleProcessSelected = () => {
    addToast('Processing selected payouts...');
  };

  const handleExportAll = () => {
    addToast('Exporting all payouts...');
  };

  return (
    <AdminLayout active="Payouts" title="Rider Payouts" breadcrumbs={['Riders Management', 'Payouts']}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--brand-yellow)',
              borderRadius: 8,
              padding: '10px 16px',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'toastSlideIn 0.25s ease',
              maxWidth: 320,
            }}
          >
            {toast.message}
          </div>
        ))}
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => addToast('Date range selector opened')}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-yellow)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <Calendar size={14} /> May 1 - May 31, 2024
            </button>
            <button
              onClick={() => addToast('Filters panel opened')}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-yellow)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <Filter size={14} /> Filters
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease' }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand-yellow)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {tabs.map(tab => (
                <div
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  onMouseEnter={e => {
                    if (activeTab !== tab) {
                      (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== tab) {
                      (e.currentTarget as HTMLDivElement).style.color = 'var(--text-secondary)';
                    }
                  }}
                  style={{
                    padding: '14px 16px',
                    fontSize: 12,
                    color: activeTab === tab ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab ? '2px solid var(--brand-yellow)' : 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? 600 : 400,
                    transition: 'color 0.15s ease',
                    userSelect: 'none',
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search rider by name, phone or ID..."
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--brand-yellow)'; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <select
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              >
                <option>Payout Method</option>
                <option>MTN MoMo</option>
                <option>Telecel Cash</option>
                <option>Bank Transfer</option>
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              >
                <option value="All">Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
              >
                <option>Amount Range</option>
              </select>
              <button
                onClick={() => addToast('Additional filters panel opened')}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-yellow)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                <Filter size={14} /> More Filters
              </button>
              <button
                onClick={() => addToast('Filters applied')}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                style={{ background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                Apply
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr>
                    {['Rider', 'Payout Method', 'Amount', 'Fees', 'Net Amount', 'Reference ID', 'Status', 'Payout Date', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px 15px', color: 'var(--text-muted)', fontSize: 12 }}>
                        No payouts found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, i) => {
                      const globalIdx = (safeCurrentPage - 1) * ROWS_PER_PAGE + i;
                      return (
                        <tr
                          key={globalIdx}
                          onClick={() => handleRowClick(row, globalIdx)}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-elevated)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = selectedRow === globalIdx ? 'rgba(245,197,39,0.04)' : 'transparent'; }}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease',
                            background: selectedRow === globalIdx ? 'rgba(245,197,39,0.04)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '12px 15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <User size={14} style={{ color: 'var(--text-muted)' }} />
                              </div>
                              <div>
                                <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{row.rider}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{row.id}</div>
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
                          <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10 }}>{row.ref}</td>
                          <td style={{ padding: '12px 15px' }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                              background: row.status === 'Completed' ? 'rgba(34,197,94,0.1)' : row.status === 'Pending' ? 'rgba(245,158,11,0.1)' : row.status === 'Failed' ? 'rgba(239,68,68,0.1)' : 'rgba(156,163,175,0.1)',
                              color: row.status === 'Completed' ? 'var(--success)' : row.status === 'Pending' ? 'var(--warning)' : row.status === 'Failed' ? 'var(--danger)' : 'var(--text-muted)'
                            }}>{row.status}</span>
                          </td>
                          <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.date}</td>
                          <td style={{ padding: '12px 15px' }}>
                            <div
                              onClick={(e) => handleRowAction(row, e)}
                              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)'; }}
                              style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.15s ease', display: 'inline-flex' }}
                            >
                              <MoreVertical size={14} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Showing {filteredRows.length === 0 ? 0 : (safeCurrentPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(safeCurrentPage * ROWS_PER_PAGE, filteredRows.length)} of {filteredRows.length} payouts
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  onMouseEnter={e => { if (safeCurrentPage > 1) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-yellow)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                  style={{
                    width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: safeCurrentPage <= 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer', opacity: safeCurrentPage <= 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                {(() => {
                  const pages: (number | string)[] = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (safeCurrentPage > 3) pages.push('...');
                    for (
                      let i = Math.max(2, safeCurrentPage - 1);
                      i <= Math.min(totalPages - 1, safeCurrentPage + 1);
                      i++
                    ) {
                      pages.push(i);
                    }
                    if (safeCurrentPage < totalPages - 2) pages.push('...');
                    pages.push(totalPages);
                  }
                  return pages.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => typeof p === 'number' && setCurrentPage(p)}
                      onMouseEnter={e => {
                        if (typeof p === 'number' && p !== safeCurrentPage) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-yellow)';
                        }
                      }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                      style={{
                        width: 28, height: 28, borderRadius: 4,
                        background: p === safeCurrentPage ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: p === safeCurrentPage ? '#111' : 'var(--text-muted)',
                        fontSize: 11, fontWeight: 600,
                        cursor: typeof p === 'number' ? 'pointer' : 'default',
                      }}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  onMouseEnter={e => { if (safeCurrentPage < totalPages) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-yellow)'; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                  style={{
                    width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: safeCurrentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                    cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: safeCurrentPage >= totalPages ? 0.4 : 1,
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Payout Methods Breakdown</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-yellow)" strokeWidth="12" strokeDasharray="125 251" strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-orange)" strokeWidth="12" strokeDasharray="74 251" strokeDashoffset="-125" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--info)" strokeWidth="12" strokeDasharray="52 251" strokeDashoffset="-199" />
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {[
                    { label: 'MTN MoMo', val: 'GHS 78,450.00', pct: '49.8%', color: 'var(--brand-yellow)' },
                    { label: 'Telecel Cash', val: 'GHS 46,200.00', pct: '29.4%', color: 'var(--brand-orange)' },
                    { label: 'Bank Transfer', val: 'GHS 32,850.00', pct: '20.8%', color: 'var(--info)' },
                  ].map(item => (
                    <div
                      key={item.label}
                      onClick={() => handleDonutLegend(item.label)}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.7'; (e.currentTarget as HTMLDivElement).style.cursor = 'pointer'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'opacity 0.15s ease' }}
                    >
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

            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Payout Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Average Payout', val: 'GHS 1,230.47' },
                  { label: 'Highest Payout', val: 'GHS 5,450.00', color: 'var(--success)' },
                  { label: 'Lowest Payout', val: 'GHS 45.00', color: 'var(--danger)' },
                  { label: 'Success Rate', val: '89.6%', color: 'var(--success)' },
                ].map(stat => (
                  <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{stat.label}</span>
                    <span style={{ color: stat.color || 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  onClick={handleProcessSelected}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s ease', borderRadius: 4, paddingLeft: 4, paddingRight: 4 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={14} color="#fff" />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>Initiate Bulk Payout</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Pay multiple riders at once</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
                <div
                  onClick={() => addToast('Payout settings opened')}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s ease', borderRadius: 4, paddingLeft: 4, paddingRight: 4 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Filter size={14} color="var(--text-muted)" />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>Payout Settings</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Manage payout preferences</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
                <div
                  onClick={handleExportAll}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer', transition: 'background 0.15s ease', borderRadius: 4, paddingLeft: 4, paddingRight: 4 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Download size={14} color="var(--text-muted)" />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>Download Payout Report</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Export payouts in Excel/PDF</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
