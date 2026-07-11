import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  FileText, CheckCircle, Clock, AlertCircle, Download, Search, Filter, Calendar,
  Users, User, ChevronLeft, ChevronRight, Eye, MoreVertical
} from 'lucide-react';
import './_shared/tokens.css';

type TabName = 'All Documents' | 'National ID' | 'Driver License' | 'Insurance' | 'Vehicle Registration' | 'Background Check' | 'Health Certificate' | 'Training Certificate';
type StatusFilter = 'All' | 'Verified' | 'Pending' | 'Expired' | 'Missing';

interface Toast {
  id: number;
  message: string;
  visible: boolean;
}

const ITEMS_PER_PAGE = 8;

const docTabs: TabName[] = [
  'All Documents', 'National ID', 'Driver License', 'Insurance',
  'Vehicle Registration', 'Background Check', 'Health Certificate', 'Training Certificate'
];

const statusFilters: StatusFilter[] = ['All', 'Verified', 'Pending', 'Expired', 'Missing'];

const documents = [
  { rider: 'Kofi Mensah', id: '#RID124567', docType: 'National ID' as const, typeColor: 'var(--success)', docNumber: 'GHA-123456789-0', issueDate: 'Jan 10, 2022', expiryDate: 'Jan 10, 2032', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '2,923 days' },
  { rider: 'Ama Servwaa', id: '#RID124568', docType: 'Driver License' as const, typeColor: 'var(--info)', docNumber: 'DL-GH-789654123', issueDate: 'Feb 15, 2021', expiryDate: 'Feb 15, 2026', status: 'Pending' as const, statusColor: 'var(--warning)', daysLeft: '24 days' },
  { rider: 'Kwame Asare', id: '#RID124569', docType: 'Vehicle Registration' as const, typeColor: 'var(--brand-orange)', docNumber: 'GR-8765-20', issueDate: 'Mar 20, 2022', expiryDate: 'Mar 20, 2025', status: 'Expired' as const, statusColor: 'var(--danger)', daysLeft: '-45 days' },
  { rider: 'Akua Boakye', id: '#RID124570', docType: 'Insurance' as const, typeColor: 'var(--warning)', docNumber: 'INS-987654321', issueDate: 'Apr 05, 2024', expiryDate: 'Apr 05, 2025', status: 'Pending' as const, statusColor: 'var(--warning)', daysLeft: '14 days' },
  { rider: 'Emmanuel Tetteh', id: '#RID124571', docType: 'Vehicle Registration' as const, typeColor: 'var(--brand-yellow)', docNumber: 'RW-7654321', issueDate: 'Jan 18, 2024', expiryDate: 'Jan 18, 2025', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '58 days' },
  { rider: 'Abdulai Mohammed', id: '#RID124572', docType: 'National ID' as const, typeColor: 'var(--success)', docNumber: 'GHA-098765432-1', issueDate: 'Jun 12, 2022', expiryDate: 'Jun 12, 2032', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '2,986 days' },
  { rider: 'Michael Owusu', id: '#RID124573', docType: 'Driver License' as const, typeColor: 'var(--info)', docNumber: 'DL-GH-456789123', issueDate: 'Aug 25, 2021', expiryDate: 'Aug 25, 2024', status: 'Expired' as const, statusColor: 'var(--danger)', daysLeft: '-263 days' },
  { rider: 'Joseph Appiah', id: '#RID124574', docType: 'Insurance' as const, typeColor: 'var(--warning)', docNumber: 'INS-123456789', issueDate: 'May 10, 2024', expiryDate: 'May 10, 2025', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '43 days' },
  { rider: 'Samuel Mensah', id: '#RID124575', docType: 'Vehicle Registration' as const, typeColor: 'var(--brand-orange)', docNumber: 'GR-1122-24', issueDate: 'Jul 01, 2024', expiryDate: 'Jul 01, 2025', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '95 days' },
  { rider: 'Daniel Arthur', id: '#RID124576', docType: 'Vehicle Registration' as const, typeColor: 'var(--brand-yellow)', docNumber: 'RW-99887766', issueDate: 'Dec 12, 2023', expiryDate: 'Dec 12, 2024', status: 'Expired' as const, statusColor: 'var(--danger)', daysLeft: '-78 days' },
  { rider: 'Nana Yaa Adjei', id: '#RID124577', docType: 'Background Check' as const, typeColor: 'var(--info)', docNumber: 'BG-2024-00123', issueDate: 'Jan 05, 2024', expiryDate: 'Jan 05, 2025', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '178 days' },
  { rider: 'Efua Owusua', id: '#RID124578', docType: 'Background Check' as const, typeColor: 'var(--info)', docNumber: 'BG-2024-00456', issueDate: 'Mar 15, 2024', expiryDate: 'Mar 15, 2026', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '613 days' },
  { rider: 'Yaw Boateng', id: '#RID124579', docType: 'Health Certificate' as const, typeColor: 'var(--success)', docNumber: 'HC-GH-78901', issueDate: 'Feb 20, 2024', expiryDate: 'Feb 20, 2025', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '14 days' },
  { rider: 'Adwoa Poku', id: '#RID124580', docType: 'Health Certificate' as const, typeColor: 'var(--success)', docNumber: 'HC-GH-78902', issueDate: 'Sep 10, 2023', expiryDate: 'Sep 10, 2024', status: 'Expired' as const, statusColor: 'var(--danger)', daysLeft: '-303 days' },
  { rider: 'Kojo Frimpong', id: '#RID124581', docType: 'Training Certificate' as const, typeColor: 'var(--brand-orange)', docNumber: 'TC-2024-00321', issueDate: 'Apr 01, 2024', expiryDate: 'Apr 01, 2026', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '690 days' },
  { rider: 'Esi Mensah', id: '#RID124582', docType: 'Training Certificate' as const, typeColor: 'var(--brand-orange)', docNumber: 'TC-2024-00654', issueDate: 'Jun 18, 2024', expiryDate: 'Jun 18, 2024', status: 'Expired' as const, statusColor: 'var(--danger)', daysLeft: '-387 days' },
  { rider: 'Osei Kwame', id: '#RID124583', docType: 'Insurance' as const, typeColor: 'var(--warning)', docNumber: 'INS-555123456', issueDate: 'Jan 01, 2024', expiryDate: 'Jan 01, 2025', status: 'Expired' as const, statusColor: 'var(--danger)', daysLeft: '-190 days' },
  { rider: 'Abena Nyarko', id: '#RID124584', docType: 'National ID' as const, typeColor: 'var(--success)', docNumber: 'GHA-555123789-2', issueDate: 'Nov 08, 2021', expiryDate: 'Nov 08, 2031', status: 'Verified' as const, statusColor: 'var(--success)', daysLeft: '2,309 days' },
];

export default function Documents() {
  const [activeTab, setActiveTab] = useState<TabName>('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const stats = [
    { label: 'Total Riders', value: '2,350', sub: 'All registered riders', icon: Users, color: 'var(--brand-orange)' },
    { label: 'Compliant', value: '1,842', sub: '78.4% of total riders', icon: CheckCircle, color: 'var(--success)' },
    { label: 'Expiring Soon', value: '312', sub: 'Expire in next 30 days', icon: Clock, color: 'var(--warning)' },
    { label: 'Expired', value: '196', sub: 'Require immediate action', icon: AlertCircle, color: 'var(--danger)' },
    { label: 'Missing Documents', value: '248', sub: 'Incomplete documents', icon: FileText, color: 'var(--info)' },
  ];

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, visible: true }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesTab = activeTab === 'All Documents' || doc.docType === activeTab;
    const query = searchQuery.toLowerCase();
    const matchesSearch = query === '' || doc.rider.toLowerCase().includes(query) || doc.id.toLowerCase().includes(query) || doc.docNumber.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  const handleTabClick = (tab: TabName) => {
    setActiveTab(tab);
    addToast(`Showing ${tab} documents`);
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    addToast(`Filtered by ${status}`);
  };

  const handleViewAll = () => {
    addToast('Loading all documents...');
  };

  const handleViewDoc = (rider: string) => {
    addToast(`Opening document details for ${rider}...`);
  };

  const handleDownloadDoc = (rider: string) => {
    addToast(`Downloading document for ${rider}...`);
  };

  const handleMoreOptions = (rider: string) => {
    addToast(`More options for ${rider}...`);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const generatePageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <AdminLayout active="Documents" title="Rider Documents" breadcrumbs={['Riders Management', 'Documents']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Document Type Tabs */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', overflowX: 'auto' }}>
            {docTabs.map((tab) => (
              <div key={tab}
                onClick={() => handleTabClick(tab)}
                style={{ 
                  padding: '14px 16px', fontSize: 12, whiteSpace: 'nowrap',
                  color: activeTab === tab ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--brand-yellow)' : 'none',
                  cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { if (activeTab !== tab) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search rider by name, phone or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-yellow)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>
            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, minWidth: 130, cursor: 'pointer' }}>
              <option>Document Type</option>
              <option>All Types</option>
            </select>
            <select 
              value={statusFilter}
              onChange={e => handleStatusChange(e.target.value as StatusFilter)}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, minWidth: 130, cursor: 'pointer' }}>
              {statusFilters.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
            </select>
            <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, minWidth: 130, cursor: 'pointer' }}>
              <option>Expiry</option>
              <option>All</option>
            </select>
            <button 
              onClick={() => addToast('Opening more filters...')}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Filter size={14} /> More Filters
            </button>
            <button 
              onClick={handleViewAll}
              style={{ background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s', opacity: 1 }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >Apply</button>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Rider', 'Document Type', 'Document Number', 'Issue Date', 'Expiry Date', 'Status', 'Days Left', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 15px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No documents found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map((doc, i) => (
                  <tr key={`${doc.id}-${i}`}
                    style={{ borderBottom: '1px solid var(--border)', background: hoveredRow === i ? 'var(--bg-primary)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{doc.rider}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{doc.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 4, background: `${doc.typeColor}15`, color: doc.typeColor, fontSize: 10, fontWeight: 600 }}>{doc.docType}</span>
                    </td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-secondary)', fontSize: 12 }}>{doc.docNumber}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-secondary)', fontSize: 12 }}>{doc.issueDate}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-secondary)', fontSize: 12 }}>{doc.expiryDate}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: doc.status === 'Verified' ? 'rgba(34,197,94,0.1)' : doc.status === 'Expired' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: doc.statusColor
                      }}>{doc.status}</span>
                    </td>
                    <td style={{ padding: '12px 15px', color: doc.daysLeft.startsWith('-') ? 'var(--danger)' : doc.status === 'Expired' ? 'var(--danger)' : 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{doc.daysLeft}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleViewDoc(doc.rider)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-yellow)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDownloadDoc(doc.rider)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-yellow)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <Download size={14} />
                        </button>
                        <button onClick={() => handleMoreOptions(doc.rider)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-yellow)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {filteredDocuments.length === 0
                ? 'No documents'
                : `Showing ${startIndex + 1} to ${Math.min(startIndex + ITEMS_PER_PAGE, filteredDocuments.length)} of ${filteredDocuments.length} documents`}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button 
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: safeCurrentPage === 1 ? 'var(--border)' : 'var(--text-muted)', cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}>
                <ChevronLeft size={14} />
              </button>
              {generatePageNumbers().map((p, i) => (
                <button key={i}
                  onClick={() => typeof p === 'number' && handlePageChange(p)}
                  disabled={typeof p !== 'number'}
                  style={{ 
                    width: 28, height: 28, borderRadius: 4,
                    background: p === safeCurrentPage ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: p === safeCurrentPage ? '#111' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 600,
                    cursor: typeof p === 'number' ? 'pointer' : 'default',
                    transition: 'background 0.2s, color 0.2s'
                  }}
                  onMouseEnter={e => { if (typeof p === 'number' && p !== safeCurrentPage) e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                  onMouseLeave={e => { if (typeof p === 'number') e.currentTarget.style.borderColor = 'var(--border)'; }}
                >{p}</button>
              ))}
              <button 
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: safeCurrentPage === totalPages ? 'var(--border)' : 'var(--text-muted)', cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'color 0.2s' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '12px 20px', fontSize: 13, color: 'var(--text-primary)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            animation: 'toastIn 0.3s ease',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AdminLayout>
  );
}
