import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  ShieldCheck, Clock, CheckCircle2, XCircle, 
  Search, Filter, User, Calendar, FileText,
  Eye, Download, MoreHorizontal, Check, X,
  ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight,
  Phone, Mail, ExternalLink, CheckCircle
} from 'lucide-react';
import './_shared/tokens.css';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ITEMS_PER_PAGE = 5;

export default function RiderVerification() {
  const [activeSubTab, setActiveSubTab] = useState<string>('All Applications');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedApplication, setSelectedApplication] = useState<number | null>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const kpis = [
    { label: 'Pending Verification', value: '115', change: '8.7%', up: false, icon: Clock, color: 'var(--brand-orange)' },
    { label: 'Approved', value: '1,352', change: '15.4%', up: true, icon: CheckCircle2, color: 'var(--success)', sub: 'vs last month' },
    { label: 'Rejected', value: '203', change: '12.3%', up: false, icon: XCircle, color: 'var(--danger)', sub: 'vs last month' },
    { label: 'Under Review', value: '87', change: '5.3%', up: true, icon: Eye, color: 'var(--info)', sub: 'vs last month' },
    { label: 'Verification Today', value: '24', change: '9.1%', up: true, icon: CheckCircle, color: 'var(--brand-yellow)', sub: 'vs yesterday' },
  ];

  const applications = [
    { id: '#RID1245789', name: 'James Agyeman', phone: '+233 24 123 4567', email: 'james.agyeman@gmail.com', date: 'May 12, 2024', source: 'Mobile App', status: 'Pending', badge: 'New', docsComplete: 3, docsTotal: 5 },
    { id: '#RID1245788', name: 'Brian Osei', phone: '+233 55 234 5678', email: 'brian.osei@gmail.com', date: 'May 12, 2024', source: 'Mobile App', status: 'Pending', badge: 'New', docsComplete: 2, docsTotal: 5 },
    { id: '#RID1245787', name: 'Daniel Arthur', phone: '+233 20 345 6789', email: 'daniel.arthur@gmail.com', date: 'May 11, 2024', source: 'Mobile App', status: 'Under Review', badge: '', docsComplete: 4, docsTotal: 5 },
    { id: '#RID1245786', name: 'Richard Addo', phone: '+233 27 456 7890', email: 'richard.addo@gmail.com', date: 'May 11, 2024', source: 'Mobile App', status: 'Pending', badge: 'New', docsComplete: 1, docsTotal: 5 },
    { id: '#RID1245785', name: 'Samuel Mensah', phone: '+233 54 567 8901', email: 'samuel.mensah@gmail.com', date: 'May 10, 2024', source: 'Mobile App', status: 'Pending', badge: '', docsComplete: 3, docsTotal: 5 },
    { id: '#RID1245784', name: 'Kwame Gyasi', phone: '+233 24 678 9012', email: 'kwame.gyasi@gmail.com', date: 'May 10, 2024', source: 'Mobile App', status: 'Rejected', badge: '', docsComplete: 2, docsTotal: 5 },
    { id: '#RID1245783', name: 'Emmanuel Owusu', phone: '+233 26 789 0123', email: 'emmanuel.owusu@gmail.com', date: 'May 9, 2024', source: 'Web Portal', status: 'Under Review', badge: '', docsComplete: 5, docsTotal: 5 },
    { id: '#RID1245782', name: 'Kofi Ansah', phone: '+233 50 890 1234', email: 'kofi.ansah@gmail.com', date: 'May 9, 2024', source: 'Mobile App', status: 'Pending', badge: 'New', docsComplete: 0, docsTotal: 5 },
    { id: '#RID1245781', name: 'Yaw Boateng', phone: '+233 23 901 2345', email: 'yaw.boateng@gmail.com', date: 'May 8, 2024', source: 'Mobile App', status: 'Pending', badge: '', docsComplete: 4, docsTotal: 5 },
    { id: '#RID1245780', name: 'Nana Akufo', phone: '+233 57 012 3456', email: 'nana.akufo@gmail.com', date: 'May 8, 2024', source: 'Web Portal', status: 'Approved', badge: '', docsComplete: 5, docsTotal: 5 },
    { id: '#RID1245779', name: 'Kojo Mensah', phone: '+233 24 123 5678', email: 'kojo.mensah@gmail.com', date: 'May 7, 2024', source: 'Mobile App', status: 'Pending', badge: 'New', docsComplete: 1, docsTotal: 5 },
    { id: '#RID1245778', name: 'Ama Darko', phone: '+233 55 234 6789', email: 'ama.darko@gmail.com', date: 'May 7, 2024', source: 'Mobile App', status: 'Under Review', badge: '', docsComplete: 3, docsTotal: 5 },
    { id: '#RID1245777', name: 'Yaw Frimpong', phone: '+233 20 345 7890', email: 'yaw.frimpong@gmail.com', date: 'May 6, 2024', source: 'Web Portal', status: 'Pending', badge: '', docsComplete: 2, docsTotal: 5 },
    { id: '#RID1245776', name: 'Kweku Asante', phone: '+233 27 456 8901', email: 'kweku.asante@gmail.com', date: 'May 6, 2024', source: 'Mobile App', status: 'Rejected', badge: '', docsComplete: 1, docsTotal: 5 },
    { id: '#RID1245775', name: 'Abena Pokua', phone: '+233 54 567 9012', email: 'abena.pokua@gmail.com', date: 'May 5, 2024', source: 'Mobile App', status: 'Pending', badge: 'New', docsComplete: 0, docsTotal: 5 },
  ];

  const subTabs = [
    { label: 'All Applications', count: 115 },
    { label: 'Pending Review', count: 67 },
    { label: 'Document Verification', count: 48 },
    { label: 'Interview Scheduling', count: 23 },
    { label: 'Background Check', count: 15 },
  ];

  const filteredApplications = applications.filter(app => {
    const matchesSubTab = activeSubTab === 'All Applications' ||
      (activeSubTab === 'Pending Review' && app.status === 'Pending') ||
      (activeSubTab === 'Document Verification' && (app.status === 'Under Review' || app.docsComplete < app.docsTotal)) ||
      (activeSubTab === 'Interview Scheduling' && app.status === 'Pending' && app.docsComplete >= 3) ||
      (activeSubTab === 'Background Check' && app.status === 'Under Review' && app.docsComplete === app.docsTotal);
    const matchesSearch = searchQuery === '' ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSubTab && matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, searchQuery, statusFilter]);

  const selectedRider = selectedApplication !== null && paginatedApplications[selectedApplication]
    ? paginatedApplications[selectedApplication]
    : null;

  const verificationSteps = [
    { label: 'Documents', status: selectedRider ? (selectedRider.docsComplete === selectedRider.docsTotal ? 'Complete' : 'Under Review') : 'Pending', step: 1 },
    { label: 'Information', status: selectedRider && selectedRider.docsComplete >= 3 ? 'Complete' : 'Pending', step: 2 },
    { label: 'Background Check', status: 'Pending', step: 3 },
    { label: 'Final Review', status: 'Pending', step: 4 },
    { label: 'Complete', status: 'Pending', step: 5 },
  ];

  const documents = [
    { name: 'Ghana Card', status: 'Verified', statusColor: 'var(--success)', date: 'May 12, 2024', type: 'National ID' },
    { name: "Driver's License", status: 'Verified', statusColor: 'var(--success)', date: 'May 12, 2024', type: 'License' },
    { name: 'Bike Registration', status: 'Verified', statusColor: 'var(--success)', date: 'May 12, 2024', type: 'Registration' },
    { name: 'Insurance', status: 'Verified', statusColor: 'var(--success)', date: 'May 12, 2024', type: 'Insurance' },
    { name: 'Selfie Verification', status: 'Verified', statusColor: 'var(--success)', date: 'May 12, 2024', type: 'Selfie' },
    { name: 'Bike Photo', status: 'Verified', statusColor: 'var(--success)', date: 'May 12, 2024', type: 'Photo' },
    { name: 'Additional Document', status: 'Under Review', statusColor: 'var(--warning)', date: 'May 12, 2024', type: 'Other' },
    { name: 'Reference (Optional)', status: 'Not Uploaded', statusColor: 'var(--text-muted)', date: '', type: 'Reference' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return { background: 'rgba(255, 107, 0, 0.15)', color: 'var(--brand-orange)' };
      case 'Under Review':
        return { background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)' };
      case 'Rejected':
        return { background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' };
      case 'Approved':
        return { background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)' };
      default:
        return { background: 'rgba(107, 114, 128, 0.15)', color: 'var(--text-muted)' };
    }
  };

  return (
    <AdminLayout active="Rider Verification" title="Rider Verification" breadcrumbs={['Riders Management', 'Rider Verification']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Toast Container */}
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                background: toast.type === 'success' ? 'var(--success)' :
                  toast.type === 'error' ? 'var(--danger)' :
                  toast.type === 'warning' ? 'var(--warning)' : 'var(--info)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease-out',
                minWidth: 250,
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={16} style={{ color: kpi.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700 }}>{kpi.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: kpi.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {kpi.change}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{kpi.sub || 'vs last month'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Export */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search rider by name, phone or ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 38px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-yellow)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); addToast(`Filtering by: ${e.target.value}`, 'info'); }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button
              onClick={() => addToast('Exporting verification report...', 'success')}
              onMouseEnter={() => setHoveredButton('export')}
              onMouseLeave={() => setHoveredButton(null)}
              style={{
                background: hoveredButton === 'export' ? 'var(--brand-orange)' : 'var(--brand-yellow)',
                border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 12, fontWeight: 700,
                color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.2s, transform 0.2s',
                transform: hoveredButton === 'export' ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <Download size={14} /> Export Report
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, minHeight: 650 }}>
          {/* Left: Verification Queue */}
          <div style={{ width: 380, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Verification Queue</h3>
              <Filter size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', overflowX: 'auto' }}>
              {subTabs.map((tab) => (
                <div
                  key={tab.label}
                  onClick={() => { setActiveSubTab(tab.label); addToast(`Showing ${tab.label} applications`, 'info'); }}
                  style={{ 
                    padding: '12px 12px', fontSize: 11, whiteSpace: 'nowrap',
                    color: activeSubTab === tab.label ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                    borderBottom: activeSubTab === tab.label ? '2px solid var(--brand-yellow)' : 'none',
                    cursor: 'pointer', fontWeight: activeSubTab === tab.label ? 600 : 400,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { if (activeSubTab !== tab.label) e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { if (activeSubTab !== tab.label) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {tab.label} ({tab.count})
                </div>
              ))}
            </div>

            {/* Search */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search rider..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 32px', fontSize: 12, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-yellow)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>

            {/* Queue List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {paginatedApplications.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No applications found
                </div>
              ) : (
                paginatedApplications.map((app, i) => (
                  <div
                    key={i}
                    onClick={() => { setSelectedApplication(i); addToast(`Viewing ${app.name} application`, 'info'); }}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ 
                      padding: '14px 20px', borderBottom: '1px solid var(--border)', 
                      cursor: 'pointer',
                      background: selectedApplication === i ? 'rgba(255, 107, 0, 0.05)' : hoveredRow === i ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                      borderLeft: selectedApplication === i ? '3px solid var(--brand-yellow)' : '3px solid transparent',
                      transition: 'background 0.2s, border-left 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <User size={18} style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{app.name}</span>
                          {app.badge && (
                            <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', fontSize: 9, fontWeight: 600 }}>{app.badge}</span>
                          )}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{app.id}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>Applied: {app.date}</div>
                      </div>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                        ...getStatusStyle(app.status)
                      }}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredApplications.length)} of {filteredApplications.length}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => { if (currentPage > 1) { setCurrentPage(currentPage - 1); addToast('Previous page', 'info'); } }}
                  disabled={currentPage === 1}
                  style={{
                    width: 28, height: 28, borderRadius: 4,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                ><ChevronLeft size={14} /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setCurrentPage(p); addToast(`Page ${p}`, 'info'); }}
                    style={{
                      width: 28, height: 28, borderRadius: 4,
                      background: p === currentPage ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: p === currentPage ? '#111' : 'var(--text-muted)',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      transition: 'background 0.2s, color 0.2s',
                    }}
                    onMouseEnter={e => { if (p !== currentPage) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={e => { if (p !== currentPage) { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
                  >{p}</button>
                ))}
                <button
                  onClick={() => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); addToast('Next page', 'info'); } }}
                  disabled={currentPage === totalPages}
                  style={{
                    width: 28, height: 28, borderRadius: 4,
                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                ><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* Right: Detail Panel */}
          {selectedRider ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Rider Header */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <User size={28} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{selectedRider.name}</span>
                      {selectedRider.badge && (
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', fontSize: 10, fontWeight: 600 }}>{selectedRider.badge}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                      <span>{selectedRider.id}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {selectedRider.phone}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={12} /> {selectedRider.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginTop: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                      <span>Applied: {selectedRider.date}</span>
                      <span>Source: {selectedRider.source}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addToast('Opening document viewer...', 'info')}
                    onMouseEnter={() => setHoveredButton('viewProfile')}
                    onMouseLeave={() => setHoveredButton(null)}
                    style={{
                      background: hoveredButton === 'viewProfile' ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                      border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600,
                      color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'background 0.2s, transform 0.2s',
                      transform: hoveredButton === 'viewProfile' ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    View Documents <ExternalLink size={12} />
                  </button>
                </div>

                {/* Progress Steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {verificationSteps.map((step, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {i > 0 && <div style={{ flex: 1, height: 2, background: step.step <= 1 ? 'var(--brand-yellow)' : 'var(--border)' }} />}
                        <div style={{ 
                          width: 32, height: 32, borderRadius: '50%', 
                          background: step.step === 1 ? 'var(--brand-yellow)' : 'var(--bg-elevated)',
                          border: `2px solid ${step.step === 1 ? 'var(--brand-yellow)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: step.step === 1 ? '#111' : 'var(--text-muted)',
                          flexShrink: 0
                        }}>
                          {step.step}
                        </div>
                        {i < verificationSteps.length - 1 && <div style={{ flex: 1, height: 2, background: step.step < 1 ? 'var(--brand-yellow)' : 'var(--border)' }} />}
                      </div>
                      <div style={{ marginTop: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: step.step === 1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</div>
                        <div style={{ fontSize: 9, color: step.status === 'Under Review' ? 'var(--brand-yellow)' : step.status === 'Complete' ? 'var(--success)' : 'var(--text-muted)', marginTop: 2 }}>{step.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Verification */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>Document Verification</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Overall Status:</span>
                    <span style={{ padding: '4px 12px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontSize: 11, fontWeight: 600 }}>Under Review</span>
                    <button
                      onClick={() => addToast('Approving all documents...', 'success')}
                      onMouseEnter={() => setHoveredButton('approveAll')}
                      onMouseLeave={() => setHoveredButton(null)}
                      style={{
                        background: hoveredButton === 'approveAll' ? 'var(--success)' : 'rgba(34, 197, 94, 0.15)',
                        border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 11, fontWeight: 600,
                        color: hoveredButton === 'approveAll' ? '#fff' : 'var(--success)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'background 0.2s, color 0.2s, transform 0.2s',
                        transform: hoveredButton === 'approveAll' ? 'scale(1.02)' : 'scale(1)',
                      }}
                    >
                      <CheckCircle2 size={14} /> Approve All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
                  {documents.map((doc, i) => (
                    <div key={i} style={{ background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {/* Document Image Placeholder */}
                      <div style={{ height: 100, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {doc.status === 'Not Uploaded' ? (
                          <div style={{ textAlign: 'center' }}>
                            <User size={24} style={{ color: 'var(--text-muted)' }} />
                            <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 4 }}>Not Uploaded</div>
                          </div>
                        ) : (
                          <FileText size={28} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <MoreHorizontal size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                        </div>
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{doc.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          {doc.status === 'Verified' ? (
                            <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                          ) : doc.status === 'Under Review' ? (
                            <Clock size={12} style={{ color: 'var(--warning)' }} />
                          ) : (
                            <div style={{ width: 12, height: 12 }} />
                          )}
                          <span style={{ fontSize: 10, color: doc.statusColor, fontWeight: 500 }}>{doc.status}</span>
                        </div>
                        {doc.date && <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{doc.date}</div>}
                        {doc.status === 'Not Uploaded' ? (
                          <button
                            onClick={() => addToast(`Requesting ${doc.name} upload...`, 'info')}
                            onMouseEnter={() => setHoveredButton(`upload-${i}`)}
                            onMouseLeave={() => setHoveredButton(null)}
                            style={{
                              width: '100%', marginTop: 8, padding: '6px 0',
                              background: hoveredButton === `upload-${i}` ? 'var(--bg-primary)' : 'var(--bg-elevated)',
                              border: '1px solid var(--border)', borderRadius: 4,
                              color: 'var(--text-primary)', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                          >Upload</button>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                            <button
                              onClick={() => addToast(`Verifying ${doc.name}...`, 'info')}
                              onMouseEnter={() => setHoveredButton(`verify-${i}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              style={{
                                flex: 1, padding: '6px 0',
                                background: hoveredButton === `verify-${i}` ? 'var(--success)' : 'transparent',
                                border: '1px solid var(--border)', borderRadius: 4,
                                color: hoveredButton === `verify-${i}` ? '#fff' : 'var(--brand-yellow)',
                                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                transition: 'background 0.2s, color 0.2s',
                              }}
                            >Verify</button>
                            <button
                              onClick={() => addToast(`Rejecting ${doc.name}...`, 'error')}
                              onMouseEnter={() => setHoveredButton(`reject-${i}`)}
                              onMouseLeave={() => setHoveredButton(null)}
                              style={{
                                flex: 1, padding: '6px 0',
                                background: hoveredButton === `reject-${i}` ? 'var(--danger)' : 'transparent',
                                border: '1px solid var(--border)', borderRadius: 4,
                                color: hoveredButton === `reject-${i}` ? '#fff' : 'var(--danger)',
                                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                                transition: 'background 0.2s, color 0.2s',
                              }}
                            >Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 15 }}>
                <button
                  onClick={() => addToast('Opening info request form...', 'info')}
                  onMouseEnter={() => setHoveredButton('requestInfo')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    background: hoveredButton === 'requestInfo' ? 'var(--bg-elevated)' : 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 8, padding: '14px 0',
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s, transform 0.2s',
                    transform: hoveredButton === 'requestInfo' ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <Download size={16} /> Request Additional Info
                </button>
                <button
                  onClick={() => addToast('Opening interview scheduler...', 'info')}
                  onMouseEnter={() => setHoveredButton('schedule')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    background: hoveredButton === 'schedule' ? 'var(--info)' : 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 8, padding: '14px 0',
                    color: hoveredButton === 'schedule' ? '#fff' : 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s, color 0.2s, transform 0.2s',
                    transform: hoveredButton === 'schedule' ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <Calendar size={16} /> Schedule Interview
                </button>
                <button
                  onClick={() => addToast('Initiating background check...', 'warning')}
                  onMouseEnter={() => setHoveredButton('bgCheck')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    background: hoveredButton === 'bgCheck' ? 'var(--warning)' : 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 8, padding: '14px 0',
                    color: hoveredButton === 'bgCheck' ? '#111' : 'var(--text-primary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s, color 0.2s, transform 0.2s',
                    transform: hoveredButton === 'bgCheck' ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <ShieldCheck size={16} /> Start Background Check
                </button>
                <button
                  onClick={() => addToast(`Rejecting ${selectedRider.name}...`, 'error')}
                  onMouseEnter={() => setHoveredButton('rejectRider')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    background: hoveredButton === 'rejectRider' ? '#dc2626' : 'var(--danger)',
                    border: 'none', borderRadius: 8, padding: '14px 0',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s, transform 0.2s',
                    transform: hoveredButton === 'rejectRider' ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <XCircle size={16} /> Reject Rider
                </button>
                <button
                  onClick={() => addToast(`Approving ${selectedRider.name}...`, 'success')}
                  onMouseEnter={() => setHoveredButton('approveRider')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    flex: 1,
                    background: hoveredButton === 'approveRider' ? '#16a34a' : 'var(--success)',
                    border: 'none', borderRadius: 8, padding: '14px 0',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background 0.2s, transform 0.2s',
                    transform: hoveredButton === 'approveRider' ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <CheckCircle2 size={16} /> Approve Rider
                </button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <User size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Select an application to view details</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Click on a rider in the queue to get started</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
