import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import {
  Users, UserX, RotateCcw, Clock, Search, Filter, MoreVertical,
  ExternalLink, AlertTriangle, FileText, User, CheckCircle, Calendar,
  Shield, MessageSquare, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, Eye
} from 'lucide-react';
import './_shared/tokens.css';

type SuspensionStatus = 'Active' | 'Expired' | 'Reinstated';
type Tab = 'All Suspensions' | 'Active Suspensions' | 'Expired Suspensions' | 'Reinstated';

interface Suspension {
  rider: string;
  id: string;
  phone: string;
  reason: string;
  duration: string;
  status: SuspensionStatus;
  from: string;
  to: string;
  highlight?: boolean;
  description?: string;
  suspendedBy?: string;
  evidenceCount?: number;
  history?: { action: string; reason: string; date: string; color: string }[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const allSuspensions: Suspension[] = [
  { rider: 'Kofi Mensah', id: 'RID124567', phone: '055 123 4567', reason: 'Multiple complaints', duration: '7 days', status: 'Active', from: 'May 31, 2024 10:45 AM', to: 'Jun 7, 2024 10:45 AM', description: 'Rider received multiple complaints from passengers regarding late arrivals and unprofessional conduct.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 3, history: [{ action: 'Suspended', reason: 'Multiple complaints', date: 'May 31, 2024 · 10:45 AM', color: 'var(--danger)' }] },
  { rider: 'Ama Serwaa', id: 'RID124568', phone: '024 567 8901', reason: 'Safety violation', duration: '14 days', status: 'Active', from: 'May 31, 2024 09:30 AM', to: 'Jun 14, 2024 09:30 AM', highlight: true, description: 'Rider was reported for reckless driving and endangering passenger safety.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 2, history: [{ action: 'Suspended', reason: 'Safety violation', date: 'May 31, 2024 · 09:30 AM', color: 'var(--danger)' }, { action: 'Warning Sent', reason: 'Speeding', date: 'May 25, 2024 · 02:15 PM', color: 'var(--warning)' }] },
  { rider: 'Kwame Asare', id: 'RID124569', phone: '020 345 6789', reason: 'Rude behavior', duration: '3 days', status: 'Active', from: 'May 30, 2024 08:15 PM', to: 'Jun 2, 2024 08:15 PM', description: 'Rider was verbally abusive to a passenger during a trip.', suspendedBy: 'Admin (Moderator)', evidenceCount: 1, history: [{ action: 'Suspended', reason: 'Rude behavior', date: 'May 30, 2024 · 08:15 PM', color: 'var(--danger)' }] },
  { rider: 'Akua Boakye', id: 'RID124570', phone: '055 456 7890', reason: 'Overcharging', duration: '7 days', status: 'Expired', from: 'May 24, 2024 06:40 PM', to: 'May 31, 2024 06:40 PM', description: 'Rider charged passengers above the app-computed fare multiple times.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 4, history: [{ action: 'Suspended', reason: 'Overcharging', date: 'May 24, 2024 · 06:40 PM', color: 'var(--danger)' }, { action: 'Warning Sent', reason: 'Overcharging', date: 'May 20, 2024 · 11:00 AM', color: 'var(--warning)' }] },
  { rider: 'Emmanuel Tetteh', id: 'RID124571', phone: '054 567 8901', reason: 'App misuse', duration: '30 days', status: 'Active', from: 'May 28, 2024 03:25 PM', to: 'Jun 27, 2024 03:25 PM', description: 'Rider manipulated the app to simulate completed rides without carrying passengers.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 5, history: [{ action: 'Suspended', reason: 'App misuse', date: 'May 28, 2024 · 03:25 PM', color: 'var(--danger)' }] },
  { rider: 'Abdulai Mohammed', id: 'RID124572', phone: '027 678 9012', reason: 'Fraudulent activity', duration: '90 days', status: 'Active', from: 'May 29, 2024 11:10 AM', to: 'Aug 27, 2024 11:10 AM', description: 'Rider was linked to a fraudulent account ring using stolen identities.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 6, history: [{ action: 'Suspended', reason: 'Fraudulent activity', date: 'May 29, 2024 · 11:10 AM', color: 'var(--danger)' }] },
  { rider: 'Michael Owusu', id: 'RID124573', phone: '020 789 0123', reason: 'No-show (repeated)', duration: '7 days', status: 'Expired', from: 'May 21, 2024 09:05 AM', to: 'May 28, 2024 09:05 AM', description: 'Rider failed to show up for confirmed rides three times in one week.', suspendedBy: 'Admin (Moderator)', evidenceCount: 3, history: [{ action: 'Suspended', reason: 'No-show (repeated)', date: 'May 21, 2024 · 09:05 AM', color: 'var(--danger)' }] },
  { rider: 'Joseph Appiah', id: 'RID124574', phone: '055 890 1234', reason: 'Dangerous driving', duration: '15 days', status: 'Active', from: 'May 27, 2024 08:00 PM', to: 'Jun 11, 2024 08:00 PM', description: 'Multiple reports of speeding and running red lights.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 2, history: [{ action: 'Suspended', reason: 'Dangerous driving', date: 'May 27, 2024 · 08:00 PM', color: 'var(--danger)' }] },
  { rider: 'Nana Agyeman', id: 'RID124575', phone: '050 111 2222', reason: 'Overcharging', duration: '7 days', status: 'Active', from: 'Jun 1, 2024 07:00 AM', to: 'Jun 8, 2024 07:00 AM', description: 'Consistently overcharging passengers on short routes.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 2, history: [{ action: 'Suspended', reason: 'Overcharging', date: 'Jun 1, 2024 · 07:00 AM', color: 'var(--danger)' }] },
  { rider: 'Adwoa Boahene', id: 'RID124576', phone: '026 333 4444', reason: 'Rude behavior', duration: '3 days', status: 'Expired', from: 'May 18, 2024 01:00 PM', to: 'May 21, 2024 01:00 PM', description: 'Reported for yelling at a passenger.', suspendedBy: 'Admin (Moderator)', evidenceCount: 1, history: [{ action: 'Suspended', reason: 'Rude behavior', date: 'May 18, 2024 · 01:00 PM', color: 'var(--danger)' }] },
  { rider: 'Kwesi Appiatu', id: 'RID124577', phone: '057 555 6666', reason: 'App misuse', duration: '14 days', status: 'Active', from: 'Jun 2, 2024 11:20 AM', to: 'Jun 16, 2024 11:20 AM', description: 'Using fake GPS to simulate trip completions.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 4, history: [{ action: 'Suspended', reason: 'App misuse', date: 'Jun 2, 2024 · 11:20 AM', color: 'var(--danger)' }] },
  { rider: 'Efua Ansah', id: 'RID124578', phone: '024 777 8888', reason: 'Safety violation', duration: '30 days', status: 'Active', from: 'May 25, 2024 05:00 PM', to: 'Jun 24, 2024 05:00 PM', description: 'Driving without valid insurance documentation.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 3, history: [{ action: 'Suspended', reason: 'Safety violation', date: 'May 25, 2024 · 05:00 PM', color: 'var(--danger)' }] },
  { rider: 'Yaw Boateng', id: 'RID124579', phone: '050 999 0000', reason: 'Fraudulent activity', duration: '90 days', status: 'Reinstated', from: 'Mar 1, 2024 08:00 AM', to: 'May 30, 2024 08:00 AM', description: 'Account flagged for fraudulent transactions. Cleared on appeal.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 7, history: [{ action: 'Reinstated', reason: 'Cleared on appeal', date: 'May 30, 2024 · 08:00 AM', color: 'var(--success)' }, { action: 'Suspended', reason: 'Fraudulent activity', date: 'Mar 1, 2024 · 08:00 AM', color: 'var(--danger)' }] },
  { rider: 'Abena Pokua', id: 'RID124580', phone: '055 112 2334', reason: 'No-show (repeated)', duration: '7 days', status: 'Reinstated', from: 'Apr 10, 2024 02:00 PM', to: 'Apr 17, 2024 02:00 PM', description: 'Repeatedly failed to show up for booked rides.', suspendedBy: 'Admin (Moderator)', evidenceCount: 2, history: [{ action: 'Reinstated', reason: 'Warning acknowledged', date: 'Apr 17, 2024 · 02:00 PM', color: 'var(--success)' }, { action: 'Suspended', reason: 'No-show (repeated)', date: 'Apr 10, 2024 · 02:00 PM', color: 'var(--danger)' }] },
  { rider: 'Kojo Mensah', id: 'RID124581', phone: '027 444 5556', reason: 'Multiple complaints', duration: '14 days', status: 'Reinstated', from: 'Feb 15, 2024 09:00 AM', to: 'Mar 1, 2024 09:00 AM', description: 'Multiple passenger complaints about unclean vehicle.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 5, history: [{ action: 'Reinstated', reason: 'Complaints resolved', date: 'Mar 1, 2024 · 09:00 AM', color: 'var(--success)' }, { action: 'Suspended', reason: 'Multiple complaints', date: 'Feb 15, 2024 · 09:00 AM', color: 'var(--danger)' }] },
  { rider: 'Akosua Mensah', id: 'RID124582', phone: '020 666 7778', reason: 'Dangerous driving', duration: '30 days', status: 'Expired', from: 'Apr 20, 2024 10:00 AM', to: 'May 20, 2024 10:00 AM', description: 'Caught on camera running a red light with a passenger.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 2, history: [{ action: 'Suspended', reason: 'Dangerous driving', date: 'Apr 20, 2024 · 10:00 AM', color: 'var(--danger)' }] },
  { rider: 'Kofi Amoako', id: 'RID124583', phone: '054 888 9990', reason: 'Safety violation', duration: '7 days', status: 'Active', from: 'Jun 3, 2024 01:00 PM', to: 'Jun 10, 2024 01:00 PM', description: 'Operating vehicle without proper licensing.', suspendedBy: 'Admin (Super Admin)', evidenceCount: 1, history: [{ action: 'Suspended', reason: 'Safety violation', date: 'Jun 3, 2024 · 01:00 PM', color: 'var(--danger)' }] },
  { rider: 'Esi Foriwaa', id: 'RID124584', phone: '026 123 4567', reason: 'Overcharging', duration: '3 days', status: 'Active', from: 'Jun 4, 2024 08:30 AM', to: 'Jun 7, 2024 08:30 AM', description: 'Charged double fare on multiple trips.', suspendedBy: 'Admin (Moderator)', evidenceCount: 2, history: [{ action: 'Suspended', reason: 'Overcharging', date: 'Jun 4, 2024 · 08:30 AM', color: 'var(--danger)' }] },
];

const PAGE_SIZE = 8;

function filterSuspensions(
  data: Suspension[],
  tab: Tab,
  query: string,
  reason: string,
  status: string,
  duration: string
): Suspension[] {
  let filtered = [...data];

  if (tab === 'Active Suspensions') filtered = filtered.filter(r => r.status === 'Active');
  else if (tab === 'Expired Suspensions') filtered = filtered.filter(r => r.status === 'Expired');
  else if (tab === 'Reinstated') filtered = filtered.filter(r => r.status === 'Reinstated');

  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(r =>
      r.rider.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.phone.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    );
  }

  if (reason && reason !== 'All Reasons') {
    filtered = filtered.filter(r => r.reason === reason);
  }

  if (status && status !== 'All Status') {
    filtered = filtered.filter(r => r.status === status);
  }

  if (duration && duration !== 'All Durations') {
    filtered = filtered.filter(r => r.duration === duration);
  }

  return filtered;
}

export default function Suspensions() {
  const [activeTab, setActiveTab] = useState<Tab>('All Suspensions');
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonFilter, setReasonFilter] = useState('All Reasons');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [durationFilter, setDurationFilter] = useState('All Durations');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSuspension, setSelectedSuspension] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToastId(prev => {
      const id = prev + 1;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
      return id;
    });
  }, []);

  const stats = [
    { label: 'Total Suspended Riders', value: '48', change: '14.3%', up: false, icon: Users, color: 'var(--danger)' },
    { label: 'Currently Suspended', value: '36', change: '12.5%', up: false, icon: UserX, color: 'var(--warning)' },
    { label: 'Reinstated This Month', value: '12', change: '20.0%', up: true, icon: RotateCcw, color: 'var(--success)' },
    { label: 'Avg. Suspension Duration', value: '7d 4h', change: '8.2%', up: false, icon: Clock, color: 'var(--info)' },
  ];

  const filtered = filterSuspensions(allSuspensions, activeTab, searchQuery, reasonFilter, statusFilter, durationFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const paginatedRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const selectedData = selectedSuspension !== null && selectedSuspension < filtered.length ? filtered[selectedSuspension] : null;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, reasonFilter, statusFilter, durationFilter]);

  const reasons = [...new Set(allSuspensions.map(s => s.reason))];
  const statuses = [...new Set(allSuspensions.map(s => s.status))];
  const durations = [...new Set(allSuspensions.map(s => s.duration))];

  const tabKeys: Tab[] = ['All Suspensions', 'Active Suspensions', 'Expired Suspensions', 'Reinstated'];

  const toastStyles: Record<Toast['type'], { bg: string; border: string; color: string }> = {
    success: { bg: 'rgba(16,185,129,0.15)', border: 'var(--success)', color: 'var(--success)' },
    error: { bg: 'rgba(239,68,68,0.15)', border: 'var(--danger)', color: 'var(--danger)' },
    info: { bg: 'rgba(234,179,8,0.15)', border: 'var(--warning)', color: 'var(--warning)' },
  };

  return (
    <AdminLayout active="Suspensions" title="Rider Suspensions" breadcrumbs={['Riders Management', 'Suspensions']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
        {/* Toast Container */}
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ padding: '12px 20px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: toastStyles[t.type].bg, border: `1px solid ${toastStyles[t.type].border}`, color: toastStyles[t.type].color, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: 220, transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.type === 'success' && <CheckCircle size={14} />}
              {t.type === 'error' && <AlertTriangle size={14} />}
              {t.type === 'info' && <Shield size={14} />}
              {t.message}
            </div>
          ))}
        </div>

        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')} onClick={() => addToast('Opening date range picker...', 'info')}>
              <Calendar size={14} /> May 1 – May 31, 2024
            </button>
            <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')} onClick={() => addToast('Opening advanced filters...', 'info')}>
              <Filter size={14} /> Filters
            </button>
          </div>
          <button style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')} onClick={() => addToast('Generating suspension report...', 'success')}>
            Export Report
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: stat.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.change}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs Apr 1 – Apr 30</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedData ? '1fr 380px' : '1fr', gap: 20, transition: 'grid-template-columns 0.3s ease' }}>
          {/* Left: Table Area */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {tabKeys.map((tab) => (
                <div key={tab} onClick={() => { setActiveTab(tab); setSelectedSuspension(null); addToast(`Showing ${tab}`, 'info'); }} style={{ padding: '14px 16px', fontSize: 12, color: activeTab === tab ? 'var(--brand-yellow)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--brand-yellow)' : 'none', cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400, transition: 'color 0.2s' }}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search by rider name, ID or phone number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-yellow)')} onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
              </div>
              <select value={reasonFilter} onChange={e => { setReasonFilter(e.target.value); addToast(`Reason filter: ${e.target.value}`, 'info'); }} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                <option>All Reasons</option>
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); addToast(`Status filter: ${e.target.value}`, 'info'); }} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                <option>All Status</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={durationFilter} onChange={e => { setDurationFilter(e.target.value); addToast(`Duration filter: ${e.target.value}`, 'info'); }} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>
                <option>All Durations</option>
                {durations.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} onClick={() => addToast('Opening more filters...', 'info')}>
                <Filter size={14} /> More Filters
              </button>
              <button style={{ background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')} onClick={() => addToast('Filters applied', 'success')}>Apply</button>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Rider', 'Reason', 'Duration', 'Status', 'Suspended On', 'Ends On', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        No suspensions found matching your criteria.
                      </td>
                    </tr>
                  )}
                  {paginatedRows.map((row, i) => {
                    const globalIdx = startIdx + i;
                    const isSelected = selectedSuspension === globalIdx;
                    return (
                      <tr key={globalIdx} onClick={() => { setSelectedSuspension(isSelected ? null : globalIdx); addToast(isSelected ? 'Detail panel closed' : `Viewing ${row.rider}'s suspension`, 'info'); }} style={{ borderBottom: '1px solid var(--border)', background: isSelected ? 'rgba(234,179,8,0.08)' : row.highlight ? 'rgba(255,107,0,0.05)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => { if (!isSelected && !row.highlight) e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { if (!isSelected && !row.highlight) e.currentTarget.style.background = row.highlight ? 'rgba(255,107,0,0.05)' : 'transparent'; }}>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={14} style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{row.rider}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{row.phone} · {row.id}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 15px', color: 'var(--text-secondary)', fontSize: 12 }}>{row.reason}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{row.duration}</span>
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: row.status === 'Active' ? 'rgba(239,68,68,0.1)' : row.status === 'Reinstated' ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)',
                            color: row.status === 'Active' ? 'var(--danger)' : row.status === 'Reinstated' ? 'var(--success)' : 'var(--text-muted)'
                          }}>{row.status}</span>
                        </td>
                        <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.from}</td>
                        <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{row.to}</td>
                        <td style={{ padding: '12px 15px' }}><MoreVertical size={14} color="var(--text-muted)" style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={e => { e.stopPropagation(); addToast(`Actions menu for ${row.rider}`, 'info'); }} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Showing {filtered.length === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + PAGE_SIZE, filtered.length)} of {filtered.length} suspensions</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button disabled={page <= 1} onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); addToast('Previous page', 'info'); }} style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.5 : 1, transition: 'background 0.2s' }} onMouseEnter={e => { if (page > 1) e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => { setCurrentPage(p); addToast(`Page ${p}`, 'info'); }} style={{ width: 28, height: 28, borderRadius: 4, background: p === page ? 'var(--brand-yellow)' : 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p === page ? '#111' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => { if (p !== page) e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { if (p !== page) e.currentTarget.style.background = 'var(--bg-primary)'; }}>{p}</button>
                ))}
                <button disabled={page >= totalPages} onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); addToast('Next page', 'info'); }} style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.5 : 1, transition: 'background 0.2s' }} onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.background = 'var(--bg-elevated)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          {selectedData && (
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: 0 }}>Suspension Details</h3>
                  <span style={{ padding: '3px 8px', background: selectedData.status === 'Active' ? 'rgba(239,68,68,0.1)' : selectedData.status === 'Reinstated' ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)', color: selectedData.status === 'Active' ? 'var(--danger)' : selectedData.status === 'Reinstated' ? 'var(--success)' : 'var(--text-muted)', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{selectedData.status}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#fff' }}>{selectedData.rider.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700 }}>{selectedData.rider}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{selectedData.phone}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Rider ID: {selectedData.id}</div>
                  </div>
                  <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--brand-yellow)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')} onClick={() => addToast(`Opening ${selectedData.rider}'s profile...`, 'info')}>View Rider Profile</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Status</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: selectedData.status === 'Active' ? 'var(--danger)' : selectedData.status === 'Reinstated' ? 'var(--success)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{selectedData.status}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Reason</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{selectedData.reason}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Description</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.5 }}>
                      {selectedData.description || 'No description provided.'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Duration</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{selectedData.duration}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Suspended By</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{selectedData.suspendedBy || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Suspended On</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{selectedData.from}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>Ends On</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{selectedData.to}</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Evidence</div>
                      <span style={{ color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => addToast('Opening evidence files...', 'info')} onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>View Evidence ({selectedData.evidenceCount || 0})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider Actions */}
              <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Rider Actions</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '10px', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')} onClick={() => addToast('Opening warning dialog...', 'info')}>
                    <MessageSquare size={14} /> Send Warning
                  </button>
                  <button style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', padding: '10px', borderRadius: 8, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-elevated)')} onClick={() => addToast('Opening note form...', 'info')}>
                    <FileText size={14} /> Add Note
                  </button>
                </div>
                <button style={{ width: '100%', marginTop: 10, background: 'var(--success)', border: 'none', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')} onClick={() => addToast('Reinstating rider...', 'success')}>
                  <CheckCircle size={16} /> Reinstate Rider
                </button>
                <button style={{ width: '100%', marginTop: 8, background: 'var(--danger)', border: 'none', color: '#fff', padding: '12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')} onClick={() => addToast('Opening extend form...', 'info')}>
                  <Clock size={16} /> Extend Suspension
                </button>
              </div>

              {/* Suspension History */}
              <div style={{ padding: 20 }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Suspension History</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  {(selectedData.history || []).map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color }} />
                        {i < (selectedData.history?.length || 0) - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', marginTop: 4 }} />}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{h.action}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>Reason: {h.reason}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{h.date}</div>
                      </div>
                    </div>
                  ))}
                  {(!selectedData.history || selectedData.history.length === 0) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>No history available.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
