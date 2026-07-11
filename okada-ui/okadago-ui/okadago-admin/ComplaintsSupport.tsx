import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Search, Filter, MoreHorizontal, Download, 
  MessageSquare, Clock, CheckCircle, AlertCircle, 
  User, Phone, ExternalLink, Paperclip, 
  CornerUpLeft, StickyNote, UserPlus, Calendar,
  ChevronLeft, ChevronRight, X, Eye, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import './_shared/tokens.css';

interface Complaint {
  id: string;
  name: string;
  phone: string;
  category: string;
  categoryColor: string;
  subject: string;
  description: string;
  priority: string;
  priorityColor: string;
  status: string;
  statusColor: string;
  created: string;
  attachments: { name: string; size: string }[];
}

interface Toast {
  id: number;
  message: string;
}

const ITEMS_PER_PAGE = 6;

const complaintsData: Complaint[] = [
  { id: '#TKT-240531-1001', name: 'Kofi Mensah', phone: '055 123 4567', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Unfair deactivation', description: 'My account was deactivated without any valid reason. I have always followed the guidelines and completed over 500 trips successfully.', priority: 'High', priorityColor: 'var(--danger)', status: 'Open', statusColor: 'var(--brand-orange)', created: 'May 31, 2024 10:45 AM', attachments: [{ name: 'screenshot_20240531_1045.jpg', size: '245 KB' }, { name: 'deactivation_message.png', size: '180 KB' }] },
  { id: '#TKT-240531-1002', name: 'Ama Serwaa', phone: '024 567 8901', category: 'Rider Dispute', categoryColor: 'var(--brand-orange)', subject: 'Payment not received', description: 'I completed a trip but the payment has not been reflected in my wallet. The trip was completed successfully on May 30th.', priority: 'Medium', priorityColor: 'var(--warning)', status: 'In Progress', statusColor: 'var(--info)', created: 'May 31, 2024 09:30 AM', attachments: [{ name: 'trip_screenshot.png', size: '120 KB' }] },
  { id: '#TKT-240530-0987', name: 'Kwame Asare', phone: '020 345 6789', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Rude customer', description: 'A customer was extremely rude and used abusive language during the trip. I have recordings of the incident.', priority: 'Low', priorityColor: 'var(--success)', status: 'Resolved', statusColor: 'var(--success)', created: 'May 30, 2024 08:15 PM', attachments: [{ name: 'audio_recording.mp3', size: '3.2 MB' }] },
  { id: '#TKT-240530-0986', name: 'Akua Boakye', phone: '055 456 7890', category: 'Support Ticket', categoryColor: 'var(--success)', subject: 'App crash issue', description: 'The app keeps crashing whenever I try to accept a ride. I have tried reinstalling but the issue persists.', priority: 'Medium', priorityColor: 'var(--warning)', status: 'Resolved', statusColor: 'var(--success)', created: 'May 30, 2024 06:40 PM', attachments: [{ name: 'crash_log.txt', size: '45 KB' }] },
  { id: '#TKT-240530-0985', name: 'Emmanuel Tetteh', phone: '054 567 8901', category: 'Rider Dispute', categoryColor: 'var(--brand-orange)', subject: 'Commission deduction', description: 'An excessive commission was deducted from my earnings for this week. The amount deducted does not match the agreed rate.', priority: 'High', priorityColor: 'var(--danger)', status: 'In Progress', statusColor: 'var(--info)', created: 'May 30, 2024 03:25 PM', attachments: [{ name: 'earnings_statement.pdf', size: '89 KB' }, { name: 'commission_breakdown.xlsx', size: '34 KB' }] },
  { id: '#TKT-240529-0976', name: 'Abdulai Mohammed', phone: '027 678 9012', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Fraudulent ride report', description: 'Someone reported a ride that I never took. This is affecting my ratings and could lead to deactivation.', priority: 'High', priorityColor: 'var(--danger)', status: 'Open', statusColor: 'var(--brand-orange)', created: 'May 29, 2024 11:10 AM', attachments: [{ name: 'location_data.json', size: '12 KB' }] },
  { id: '#TKT-240529-0975', name: 'Michael Owusu', phone: '020 789 0123', category: 'Support Ticket', categoryColor: 'var(--success)', subject: 'Wallet top up failed', description: 'I tried to top up my wallet using mobile money but the amount was deducted without being credited to my wallet.', priority: 'Low', priorityColor: 'var(--success)', status: 'Resolved', statusColor: 'var(--success)', created: 'May 29, 2024 09:05 AM', attachments: [{ name: 'momo_receipt.jpg', size: '67 KB' }] },
  { id: '#TKT-240528-0954', name: 'Joseph Appiah', phone: '055 890 1234', category: 'Rider Dispute', categoryColor: 'var(--brand-orange)', subject: 'Incorrect rating', description: 'I received a 1-star rating from a passenger who was clearly satisfied with the ride. This seems retaliatory.', priority: 'Medium', priorityColor: 'var(--warning)', status: 'Closed', statusColor: 'var(--text-muted)', created: 'May 28, 2024 07:40 PM', attachments: [] },
  { id: '#TKT-240528-0953', name: 'Samuel Mensah', phone: '024 901 2345', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Passenger no-show', description: 'The passenger did not show up at the pickup location. I waited for 15 minutes but still got charged a cancellation fee.', priority: 'Low', priorityColor: 'var(--success)', status: 'Closed', statusColor: 'var(--text-muted)', created: 'May 28, 2024 05:15 PM', attachments: [{ name: 'trip_details.png', size: '45 KB' }] },
  { id: '#TKT-240527-0932', name: 'Daniel Arthur', phone: '027 012 3456', category: 'Support Ticket', categoryColor: 'var(--success)', subject: 'Account verification', description: 'My account verification has been pending for over a week. I have submitted all required documents.', priority: 'Medium', priorityColor: 'var(--warning)', status: 'Resolved', statusColor: 'var(--success)', created: 'May 27, 2024 02:00 PM', attachments: [{ name: 'id_card.jpg', size: '1.2 MB' }, { name: 'license.jpg', size: '890 KB' }] },
];

export default function ComplaintsSupport() {
  const [activeTab, setActiveTab] = useState('All Complaints');
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const stats = [
    { label: 'Total Tickets', value: '1,248', change: '12.4%', up: true, icon: MessageSquare, color: 'var(--text-primary)' },
    { label: 'Open Tickets', value: '256', change: '8.7%', up: true, icon: AlertCircle, color: 'var(--brand-orange)' },
    { label: 'In Progress', value: '142', change: '5.2%', up: true, icon: Clock, color: 'var(--info)' },
    { label: 'Resolved', value: '820', change: '15.3%', up: true, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Closed', value: '30', change: '2.1%', up: false, icon: X, color: 'var(--text-muted)' },
    { label: 'Avg. Resolution Time', value: '2h 45m', change: '10.6%', up: true, icon: Clock, color: 'var(--brand-yellow)' },
  ];

  const filteredComplaints = complaintsData.filter(c => {
    const matchesTab = activeTab === 'All Complaints' || c.status === activeTab;
    const matchesSearch = searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  const selected = selectedComplaint !== null ? complaintsData[selectedComplaint] : null;

  const tabs = ['All Complaints', 'Open', 'In Progress', 'Resolved', 'Closed'];

  return (
    <AdminLayout active="Complaints & Support" title="Rider Complaints & Support" breadcrumbs={['Riders Management', 'Complaints & Support']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Toast Container */}
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(toast => (
            <div key={toast.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--brand-yellow)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 12,
              color: 'var(--text-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.3s ease',
              minWidth: 250,
            }}>
              {toast.message}
            </div>
          ))}
        </div>

        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => addToast('Opening date range picker...')}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              <Calendar size={14} /> May 1 – May 31, 2024
            </button>
            <button
              onClick={() => addToast('Opening filters panel...')}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              <Filter size={14} /> Filters
            </button>
          </div>
          <button
            onClick={() => addToast('Exporting complaints data...')}
            style={{ background: 'var(--brand-yellow)', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 12, fontWeight: 700, color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>{stat.value}</div>
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

        <div style={{ display: 'flex', gap: 20, height: 650 }}>
          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {tabs.map(tab => (
                <div
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    addToast(`Showing ${tab} complaints`);
                  }}
                  style={{
                    padding: '14px 16px', fontSize: 12,
                    color: activeTab === tab ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab ? '2px solid var(--brand-yellow)' : 'none',
                    cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                    transition: 'all 0.2s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, padding: '12px 20px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  placeholder="Search by ticket ID, rider name, phone or issue..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 30px', color: '#fff', fontSize: 12, outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-yellow)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  addToast(`Filtering by: ${e.target.value}`);
                }}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                <option>All Status</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
              <button
                onClick={() => addToast('Filters applied')}
                style={{ background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >Apply</button>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr>
                    {['Ticket ID', 'Rider', 'Category', 'Subject', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontWeight: 500, borderBottom: '1px solid var(--border)', textTransform: 'uppercase', fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedComplaints.map((t, i) => {
                    const realIndex = complaintsData.indexOf(t);
                    const isSelected = selectedComplaint === realIndex;
                    return (
                      <tr
                        key={i}
                        onClick={() => {
                          setSelectedComplaint(realIndex);
                          addToast('Viewing complaint details');
                        }}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isSelected ? 'rgba(255, 107, 0, 0.08)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 15px', color: 'var(--text-primary)' }}>{t.id}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.name[0]}</div>
                            <div>
                              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: `${t.categoryColor}15`, color: t.categoryColor, fontSize: 10, fontWeight: 500 }}>{t.category}</span>
                        </td>
                        <td style={{ padding: '12px 15px', color: 'var(--text-secondary)' }}>{t.subject}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.priorityColor }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.priorityColor }} />
                            {t.priority}
                          </div>
                        </td>
                        <td style={{ padding: '12px 15px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: `${t.statusColor}15`, color: t.statusColor, fontSize: 10, fontWeight: 500 }}>{t.status}</span>
                        </td>
                        <td style={{ padding: '12px 15px', color: 'var(--text-muted)', fontSize: 11 }}>{t.created}</td>
                        <td style={{ padding: '12px 15px' }}>
                          <MoreHorizontal
                            size={14}
                            style={{ color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }}
                            onClick={e => { e.stopPropagation(); addToast('Opening actions menu...'); }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-yellow)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedComplaints.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '40px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                        No complaints match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Showing {filteredComplaints.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)} of {filteredComplaints.length} tickets
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { if (currentPage > 1) { setCurrentPage(currentPage - 1); addToast('Loading previous page...'); } }}
                  disabled={currentPage === 1}
                  style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (currentPage > 1) e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                ><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => { setCurrentPage(p); addToast(`Loading page ${p}...`); }}
                    style={{ width: 28, height: 28, borderRadius: 4, background: p === currentPage ? 'var(--brand-yellow)' : 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p === currentPage ? '#111' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { if (p !== currentPage) { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={e => { if (p !== currentPage) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                  >{p}</button>
                ))}
                <button
                  onClick={() => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); addToast('Loading next page...'); } }}
                  disabled={currentPage === totalPages}
                  style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, transition: 'all 0.2s' }}
                  onMouseEnter={e => { if (currentPage < totalPages) e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                ><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* Right Detail Panel */}
          {selected ? (
            <div style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ticket Details</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>{selected.id}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: `${selected.statusColor}15`, color: selected.statusColor, fontSize: 10, fontWeight: 600 }}>{selected.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedComplaint(null); addToast('Closing complaint details'); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s', padding: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                ><X size={16} /></button>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selected.subject}</h2>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: `${selected.categoryColor}15`, color: selected.categoryColor, fontSize: 10, fontWeight: 500, alignSelf: 'flex-start' }}>{selected.category}</span>

              <div style={{ height: 1, background: 'var(--border)', margin: '5px 0' }} />

              {/* Rider Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>{selected.name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>{selected.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{selected.phone}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Rider ID: RID{selected.id.replace('#TKT-', '').slice(0, 6)}</div>
                </div>
                <button
                  onClick={() => addToast('Opening external profile link...')}
                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, padding: '4px', cursor: 'pointer', color: 'var(--brand-yellow)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <ExternalLink size={12} />
                </button>
              </div>
              <button
                onClick={() => addToast('Opening rider profile...')}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: 'var(--text-primary)', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
              >View Rider Profile</button>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Priority</div>
                  <div style={{ fontSize: 12, color: selected.priorityColor, fontWeight: 600 }}>{selected.priority}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Created</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selected.created}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Last Updated</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selected.created}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Description</div>
                <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, border: '1px solid var(--border)' }}>
                  {selected.description}
                </div>
              </div>

              {/* Attachments */}
              {selected.attachments.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Attachments ({selected.attachments.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.attachments.map((file, i) => (
                      <div
                        key={i}
                        onClick={() => addToast(`Opening attachment: ${file.name}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                      >
                        <Paperclip size={12} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ flex: 1, fontSize: 10, color: 'var(--text-secondary)' }}>{file.name}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{file.size}</span>
                        <Download size={12} style={{ color: 'var(--brand-yellow)', cursor: 'pointer' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View Full History */}
              <button
                onClick={() => addToast('Loading complaint history...')}
                style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: 'var(--brand-yellow)', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Clock size={12} /> View Full History
              </button>

              {/* Actions */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button
                    onClick={() => addToast('Opening reply form...')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: '#fff', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                  >
                    <CornerUpLeft size={12} /> Reply
                  </button>
                  <button
                    onClick={() => addToast('Opening note form...')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: '#fff', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                  >
                    <StickyNote size={12} /> Note
                  </button>
                  <button
                    onClick={() => addToast('Opening assign dialog...')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: '#fff', fontSize: 11, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.background = 'rgba(255, 193, 7, 0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-primary)'; }}
                  >
                    <UserPlus size={12} /> Assign
                  </button>
                </div>
                <button
                  onClick={() => addToast('Resolving complaint...')}
                  style={{ background: 'var(--success)', border: 'none', borderRadius: 6, padding: '10px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <CheckCircle size={14} /> Resolve Ticket
                </button>
                <button
                  onClick={() => addToast('Closing complaint...')}
                  style={{ background: 'var(--danger)', border: 'none', borderRadius: 6, padding: '10px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <X size={14} /> Close Ticket
                </button>
              </div>
            </div>
          ) : (
            <div style={{ width: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
              <MessageSquare size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
              <div>Select a complaint to view details</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
