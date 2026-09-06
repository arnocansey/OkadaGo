import React from 'react';
import {
  LayoutDashboard, ClipboardList, Users, Bike, ShieldCheck, FileText,
  TrendingUp, DollarSign, Wallet, CreditCard, MessageSquare, Activity,
  Ban, PiggyBank, BarChart2, Tag, PieChart, Settings, Eye, EyeOff, Plus,
  Map
} from 'lucide-react';
import './tokens.css';

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Request Dashboard', icon: ClipboardList },
  { label: 'Users Management', icon: Users },
  {
    label: 'Riders Management', icon: Bike, active: true,
    children: [
      { label: 'All Riders' },
      { label: 'Rider Verification' },
      { label: 'Documents' },
      { label: 'Performance' },
      { label: 'Earnings' },
      { label: 'Wallet' },
      { label: 'Payouts' },
      { label: 'Complaints & Support' },
      { label: 'Activity Tracking' },
      { label: 'Suspensions' },
    ]
  },
  { label: 'Finance', icon: PiggyBank, hasArrow: true },
  { label: 'Earnings & Payouts', icon: BarChart2, hasArrow: true },
  { label: 'Promotions', icon: Tag },
  { label: 'Reports & Analytics', icon: PieChart },
  { label: 'Fleet Map', icon: Map },
  { label: 'Settings', icon: Settings },
];

export function AdminSidebar({ active }: { active: string }) {
  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        width: 130, minHeight: '100%', background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div style={{ padding: '16px 12px 12px' }}>
        <div style={{ color: 'var(--brand-orange)', fontWeight: 900, fontSize: 16, lineHeight: 1 }}>OkadaGo</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 2 }}>Move · Deliver · Earn</div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {nav.map((item) => {
          const Icon = item.icon;
          const isParentActive = item.active;
          const isActive = item.label === active;
          return (
            <div key={item.label}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px',
                  background: isActive ? 'var(--brand-yellow)' : 'transparent',
                  borderRadius: 6,
                  margin: '1px 6px',
                  cursor: 'pointer',
                }}
              >
                <Icon size={13} style={{ color: isActive ? '#111' : isParentActive ? 'var(--brand-orange)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#111' : isParentActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </span>
              </div>
              {item.children && (
                <div style={{ paddingLeft: 10 }}>
                  {item.children.map((child) => {
                    const isChildActive = child.label === active;
                    return (
                      <div key={child.label}
                        style={{
                          padding: '5px 10px',
                          fontSize: 10,
                          color: isChildActive ? 'var(--brand-yellow)' : 'var(--text-muted)',
                          background: isChildActive ? 'rgba(250,204,21,0.08)' : 'transparent',
                          borderLeft: isChildActive ? '2px solid var(--brand-yellow)' : '2px solid transparent',
                          cursor: 'pointer',
                          fontWeight: isChildActive ? 600 : 400,
                          marginBottom: 1,
                        }}
                      >
                        {child.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--brand-orange)', fontWeight: 700, marginBottom: 4 }}>OkadaGo Wallet</div>
        <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 4 }}>Available Balance</div>
        <div style={{ fontSize: 13, color: 'var(--brand-yellow)', fontWeight: 800 }}>GHS 120,500.50</div>
        <button style={{
          marginTop: 6, width: '100%', background: 'var(--brand-orange)',
          color: '#fff', border: 'none', borderRadius: 6, padding: '5px 0',
          fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
          <Plus size={9} /> Add Funds
        </button>
      </div>
    </div>
  );
}
