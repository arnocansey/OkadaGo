import React from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import { Settings as SettingsIcon, Bell, CreditCard, Shield, Globe, Mail, Phone, Save } from 'lucide-react';

export default function Settings() {
  return (
    <AdminLayout active="Settings" title="System Settings">
      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', minHeight: 600 }}>
        <div style={{ width: 220, borderRight: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
          {[
            { label: 'General', icon: <Globe size={16} />, active: true },
            { label: 'Notifications', icon: <Bell size={16} /> },
            { label: 'Payments', icon: <CreditCard size={16} /> },
            { label: 'Security', icon: <Shield size={16} /> },
            { label: 'Integrations', icon: <SettingsIcon size={16} /> },
          ].map((item, i) => (
            <div key={i} style={{ 
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
              color: item.active ? 'var(--brand-yellow)' : 'var(--text-secondary)',
              background: item.active ? 'rgba(250,204,21,0.05)' : 'transparent',
              borderLeft: item.active ? '3px solid var(--brand-yellow)' : '3px solid transparent',
              cursor: 'pointer', fontSize: 13, fontWeight: item.active ? 600 : 500
            }}>
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: 30, overflowY: 'auto' }}>
          <div style={{ maxWidth: 600 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>General Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>App Name</label>
                  <input type="text" defaultValue="OkadaGo" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Country</label>
                  <select style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }}>
                    <option>Ghana</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Support Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="email" defaultValue="support@okadago.com" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 36px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Support Phone</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" defaultValue="+233 55 123 4567" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px 10px 36px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 10 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Pricing & Commission</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Base Fare (GHS)</label>
                    <input type="text" defaultValue="2.50" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Per KM Rate (GHS)</label>
                    <input type="text" defaultValue="1.20" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Commission (%)</label>
                    <input type="text" defaultValue="8" style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Maintenance Mode</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Disable all user-facing services for maintenance</div>
                  </div>
                  <div style={{ width: 40, height: 20, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', left: 2, top: 2, width: 14, height: 14, background: 'var(--text-muted)', borderRadius: '50%' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Auto-Payouts</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enable daily 6:00 AM automated payout processing</div>
                  </div>
                  <div style={{ width: 40, height: 20, background: 'var(--brand-yellow)', border: '1px solid var(--brand-yellow)', borderRadius: 10, position: 'relative', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', right: 2, top: 2, width: 14, height: 14, background: '#111', borderRadius: '50%' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ 
                  background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: 8, 
                  padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8 
                }}>
                  <Save size={18} /> Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
