import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { Tag, Users, ShoppingBag, TrendingUp, Plus, Edit2, Pause, Trash2, Calendar, Clock } from 'lucide-react';

export default function Promotions() {
  const stats = [
    { label: 'Active Promotions', value: '3', icon: <Tag size={18} />, color: 'var(--success)' },
    { label: 'Total Redemptions', value: '12,450', icon: <Users size={18} />, color: 'var(--info)' },
    { label: 'Revenue Impact', value: 'GHS 45,200', icon: <TrendingUp size={18} />, color: 'var(--brand-orange)' },
    { label: 'Upcoming', value: '2', icon: <Calendar size={18} />, color: 'var(--warning)' },
  ];

  const promos = [
    { name: 'First Ride Free', type: 'Discount', value: '100%', users: 'New Users', end: 'Jun 30, 2024', usage: '4,250/5,000', status: 'Active', color: 'var(--success)' },
    { name: 'Peak Hour Bonus', type: 'Bonus', value: '20% Extra', users: 'All Riders', end: 'Dec 31, 2024', usage: 'Continuous', status: 'Active', color: 'var(--success)' },
    { name: 'Refer & Earn', type: 'Referral', value: 'GHS 20', users: 'All Users', end: 'Ongoing', usage: '8,200 total', status: 'Active', color: 'var(--success)' },
    { name: 'Weekend Warrior', type: 'Bonus', value: 'GHS 50', users: 'Top Riders', end: 'Starts Jun 1', usage: '0/500', status: 'Scheduled', color: 'var(--warning)' },
  ];

  return (
    <AdminLayout 
      active="Promotions" 
      title="Promotions Management"
      headerRight={
        <button style={{ 
          background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 8, 
          padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8 
        }}>
          <Plus size={16} /> Create New Promotion
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {['Active', 'Scheduled', 'Ended', 'All'].map((tab) => (
            <button key={tab} style={{ 
              background: tab === 'Active' ? 'var(--brand-yellow)' : 'transparent',
              color: tab === 'Active' ? '#111' : 'var(--text-secondary)',
              border: 'none', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {promos.map((promo, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{promo.name}</h4>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{promo.type} • {promo.users}</span>
                  </div>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: promo.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                    color: promo.status === 'Active' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {promo.status}
                  </span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-orange)', marginBottom: 4 }}>{promo.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Expires: {promo.end}</div>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Usage</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{promo.usage}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={12} /></button>
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}><Pause size={12} /></button>
                  <button style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Promotion Analytics</h3>
        <div style={{ display: 'flex', gap: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Top Performing Promo</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-orange)' }}>First Ride Free</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>4,250 redemptions this month</div>
          </div>
          <div style={{ flex: 2 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Usage Trend</div>
            <div style={{ height: 40, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {[20, 35, 25, 45, 60, 55, 75, 65, 85, 80, 95, 100].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--brand-yellow)', borderRadius: 2, opacity: 0.6 + (v/250) }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
