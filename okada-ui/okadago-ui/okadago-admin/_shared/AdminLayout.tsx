import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Bell, ChevronDown, Calendar, Filter, Download, Menu } from 'lucide-react';
import './tokens.css';

interface AdminLayoutProps {
  active: string;
  title: string;
  breadcrumbs?: string[];
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function AdminLayout({ active, title, breadcrumbs = [], children, headerRight }: AdminLayoutProps) {
  return (
    <div style={{
      display: 'flex', width: 1280, height: 800, background: 'var(--bg-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
    }}>
      <AdminSidebar active={active} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-primary)', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, margin: 0 }}>{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Dashboard</span>
              {breadcrumbs.map((b) => (
                <React.Fragment key={b}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>›</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{b}</span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {headerRight || (
              <>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px',
                  color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                }}>
                  <Calendar size={12} />
                  <span>May 1 – May 31, 2024</span>
                  <ChevronDown size={10} />
                </button>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px',
                  color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                }}>
                  <Filter size={12} /> Filters
                </button>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'var(--brand-yellow)',
                  border: 'none', borderRadius: 6, padding: '5px 10px',
                  color: '#111', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>
                  <Download size={12} /> Export Report
                </button>
              </>
            )}

            <div style={{ position: 'relative', marginLeft: 4 }}>
              <div style={{
                width: 30, height: 30, background: 'var(--bg-card)', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                border: '1px solid var(--border)',
              }}>
                <Bell size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
              <div style={{
                position: 'absolute', top: -4, right: -4, width: 14, height: 14,
                background: 'var(--brand-orange)', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700,
              }}>12</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: 'var(--brand-orange)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff',
              }}>A</div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, lineHeight: 1 }}>Admin</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>Super Admin</div>
              </div>
              <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#161616' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
