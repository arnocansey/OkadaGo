import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { 
  Search, Filter, MoreHorizontal, Download, 
  MessageSquare, Clock, CheckCircle, AlertCircle, 
  User, Phone, MapPin, ExternalLink, Paperclip, 
  CornerUpLeft, StickyNote, UserPlus
} from 'lucide-react';
import './_shared/tokens.css';

export default function ComplaintsSupport() {
  const stats = [
    { label: 'Total Tickets', value: '1,248', color: 'var(--text-primary)' },
    { label: 'Open', value: '256', color: 'var(--brand-orange)' },
    { label: 'In Progress', value: '142', color: 'var(--info)' },
    { label: 'Resolved', value: '820', color: 'var(--success)' },
    { label: 'Closed', value: '30', color: 'var(--text-muted)' },
    { label: 'Avg Resolution', value: '2h 45m', color: 'var(--brand-yellow)' },
  ];

  const tickets = [
    { id: '#TKT-240531-1001', name: 'Kofi Mensah', phone: '055 123 4567', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Unfair deactivation', priority: 'High', priorityColor: 'var(--danger)', status: 'Open', statusColor: 'var(--brand-orange)', created: '2024-05-31 10:30' },
    { id: '#TKT-240531-1002', name: 'Ama Serwaa', phone: '024 456 7890', category: 'Rider Dispute', categoryColor: 'var(--brand-orange)', subject: 'Trip payment issue', priority: 'Medium', priorityColor: 'var(--warning)', status: 'In Progress', statusColor: 'var(--info)', created: '2024-05-31 11:15' },
    { id: '#TKT-240531-1003', name: 'Kwame Asare', phone: '020 987 6543', category: 'Support Ticket', categoryColor: 'var(--success)', subject: 'App crash on login', priority: 'Low', priorityColor: 'var(--text-muted)', status: 'Resolved', statusColor: 'var(--success)', created: '2024-05-31 09:45' },
    { id: '#TKT-240531-1004', name: 'Akua Boakye', phone: '054 321 0987', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Customer behavior', priority: 'High', priorityColor: 'var(--danger)', status: 'Open', statusColor: 'var(--brand-orange)', created: '2024-05-31 12:20' },
    { id: '#TKT-240531-1005', name: 'Emmanuel Tetteh', phone: '027 555 1234', category: 'Support Ticket', categoryColor: 'var(--success)', subject: 'Account verification', priority: 'Medium', priorityColor: 'var(--warning)', status: 'Resolved', statusColor: 'var(--success)', created: '2024-05-30 16:40' },
    { id: '#TKT-240531-1006', name: 'Yaw Boateng', phone: '059 888 7777', category: 'Rider Dispute', categoryColor: 'var(--brand-orange)', subject: 'Incorrect commission', priority: 'Medium', priorityColor: 'var(--warning)', status: 'In Progress', statusColor: 'var(--info)', created: '2024-05-31 08:30' },
    { id: '#TKT-240531-1007', name: 'Abena Mansa', phone: '024 111 2222', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'GPS issues', priority: 'Low', priorityColor: 'var(--text-muted)', status: 'Closed', statusColor: 'var(--text-muted)', created: '2024-05-30 14:10' },
    { id: '#TKT-240531-1008', name: 'Kojo Antwi', phone: '020 333 4444', category: 'Support Ticket', categoryColor: 'var(--success)', subject: 'Update phone number', priority: 'Low', priorityColor: 'var(--text-muted)', status: 'Resolved', statusColor: 'var(--success)', created: '2024-05-30 11:55' },
    { id: '#TKT-240531-1009', name: 'Esi Addo', phone: '055 999 0000', category: 'Rider Dispute', categoryColor: 'var(--brand-orange)', subject: 'Missing incentive', priority: 'High', priorityColor: 'var(--danger)', status: 'Open', statusColor: 'var(--brand-orange)', created: '2024-05-31 13:05' },
    { id: '#TKT-240531-1010', name: 'Nana Yaw', phone: '024 777 8888', category: 'Rider Complaint', categoryColor: 'var(--info)', subject: 'Ride cancellation fee', priority: 'Medium', priorityColor: 'var(--warning)', status: 'In Progress', statusColor: 'var(--info)', created: '2024-05-31 14:40' },
  ];

  return (
    <AdminLayout active="Complaints & Support" title="Complaints & Support" breadcrumbs={['Riders Management', 'Complaints & Support']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ color: stat.color, fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, height: 600 }}>
          {/* Main Content Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              {['All Tickets', 'Rider Complaints', 'Rider Disputes', 'Support Tickets'].map((tab, i) => (
                <div key={tab} style={{ 
                  padding: '12px 16px', 
                  fontSize: 12, 
                  color: i === 0 ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                  borderBottom: i === 0 ? '2px solid var(--brand-yellow)' : 'none',
                  cursor: 'pointer',
                  fontWeight: i === 0 ? 600 : 400
                }}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  placeholder="Search by ticket ID, rider name, phone..." 
                  style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px 8px 30px', color: '#fff', fontSize: 12 }} 
                />
              </div>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
                <option>All Categories</option>
              </select>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
                <option>All Status</option>
              </select>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: '#fff', fontSize: 12 }}>
                <option>All Priority</option>
              </select>
              <button style={{ background: 'var(--brand-orange)', border: 'none', borderRadius: 6, padding: '8px 20px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Apply
              </button>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Ticket ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Rider</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Category</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Subject</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Priority</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Created</th>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-secondary)', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(255, 107, 0, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--text-primary)' }}>{t.id}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{t.name[0]}</div>
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.name}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: `${t.categoryColor}15`, color: t.categoryColor, fontSize: 10, fontWeight: 500 }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-secondary)' }}>{t.subject}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.priorityColor }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.priorityColor }}></div>
                          {t.priority}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: `${t.statusColor}15`, color: t.statusColor, fontSize: 10, fontWeight: 500 }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{t.created}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <MoreHorizontal size={14} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Side Panel - Ticket Details */}
          <div style={{ width: 350, display: 'flex', flexDirection: 'column', gap: 15, background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ticket ID: #TKT-240531-1001</div>
              <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255, 107, 0, 0.15)', color: 'var(--brand-orange)', fontSize: 10, fontWeight: 600 }}>Open</span>
            </div>
            
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 5px 0' }}>Unfair deactivation</h2>
            <div style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)', fontSize: 10, fontWeight: 500, alignSelf: 'flex-start' }}>Rider Complaint</div>

            <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>K</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 13 }}>Kofi Mensah</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>055 123 4567 • RID124567</div>
                </div>
                <button style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 4, padding: '4px', cursor: 'pointer', color: 'var(--brand-yellow)' }}>
                  <ExternalLink size={12} />
                </button>
              </div>
              <button style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 0', color: 'var(--text-primary)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
                View Rider Profile
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Priority</div>
                <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>High</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Created</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>May 31, 2024, 10:30</div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Description</div>
              <div style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 8, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, border: '1px solid var(--border)' }}>
                "My account was deactivated without any valid reason. I have always followed the guidelines and maintained a high rating. Please investigate this immediately as this is my primary source of income."
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Attachments (2)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <Paperclip size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ flex: 1, fontSize: 10, color: 'var(--text-secondary)' }}>screenshot_20240531.jpg</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>245kb</span>
                  <Download size={12} style={{ color: 'var(--brand-yellow)', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                  <Paperclip size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ flex: 1, fontSize: 10, color: 'var(--text-secondary)' }}>deactivation_message.png</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>180kb</span>
                  <Download size={12} style={{ color: 'var(--brand-yellow)', cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                  <CornerUpLeft size={12} /> Reply
                </button>
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                  <StickyNote size={12} /> Note
                </button>
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 0', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                  <UserPlus size={12} /> Assign
                </button>
              </div>
              <button style={{ background: 'var(--success)', border: 'none', borderRadius: 6, padding: '10px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Resolve Ticket
              </button>
              <button style={{ background: 'var(--danger)', border: 'none', borderRadius: 6, padding: '10px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
