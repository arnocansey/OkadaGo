import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import {
  Settings as SettingsIcon, Bell, CreditCard, Shield, Globe, Mail, Phone, Save,
  Building, Users, FileText, Link, ClipboardList, ChevronRight, AlertTriangle,
  HardDrive, ExternalLink, Trash2, Plus, Edit, Eye, EyeOff, Key, UserX, Check,
  X, RefreshCw, Download, Upload, Zap, Webhook, Copy, RotateCcw, Power
} from 'lucide-react';
import './_shared/tokens.css';

type Section = 'General' | 'Company Profile' | 'Account & Security' | 'Notifications' | 'Payment Methods' | 'Taxes & Compliance' | 'Integrations' | 'Audit Logs';

interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

const toastStyles: Record<string, React.CSSProperties> = {
  base: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    padding: '12px 20px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    animation: 'toastIn 0.3s ease',
  },
  success: { background: '#166534', color: '#fff' },
  error: { background: '#991b1b', color: '#fff' },
  info: { background: '#1e3a5f', color: '#fff' },
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('General');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);

  const [formValues, setFormValues] = useState<Record<string, string>>({
    platformName: 'OkadaGo',
    currency: 'GHS - Ghana Cedi (₵)',
    timezone: '(GMT+00:00) Accra, Ghana',
    dateFormat: 'May 31, 2024 (MMM DD, YYYY)',
    timeFormat: '12-Hour (02:30 PM)',
    distanceUnit: 'Kilometers (km)',
    language: 'English',
    companyName: 'OkadaGo Technologies Ltd',
    companyEmail: 'admin@okadago.com',
    companyPhone: '+233 24 000 0000',
    companyAddress: '123 Tech Avenue, Accra, Ghana',
    taxId: 'GH-1234567890',
    registrationNumber: 'BN-0012345',
    supportEmail: 'support@okadago.com',
    supportPhone: '+233 24 111 2222',
    zoneName: '',
    zoneName1: 'Greater Accra',
    zoneName2: 'Ashanti Region',
    zoneName3: 'Western Region',
    roleName: '',
    bankName: 'GCB Bank',
    accountNumber: '****1234',
    routingNumber: '001234567',
    taxRate: '15',
    gstNumber: '',
    panNumber: '',
    newModule: '',
    requestTimeout: '10',
    requestSound: 'ride_request',
  });

  const [toggles, setToggles] = useState<Record<string, boolean>>({
    autoAssign: true,
    surgePricing: true,
    riderOnlineStatus: true,
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    weeklyReports: true,
    lowBalanceAlert: true,
    newRiderAlert: true,
    rideCompletionAlert: true,
    fraudAlert: true,
    autoWithdraw: false,
    instantPayout: true,
    require2FA: false,
    loginAlerts: true,
    sessionTimeout: false,
    ipWhitelist: false,
    smsVerification: true,
    emailVerification: true,
    kycRequired: true,
    dataRetention: true,
    analyticsTracking: false,
    riderRequestSounds: true,
    riderRequestVibration: true,
    riderCriticalNotifications: true,
  });

  const [modules, setModules] = useState<string[]>([
    'Rider Management',
    'Fleet Tracking',
    'Payment Gateway',
    'Analytics Dashboard',
    'Customer Support',
  ]);

  const [roles, setRoles] = useState<{ name: string; permissions: string }[]>([
    { name: 'Super Admin', permissions: 'Full access' },
    { name: 'Fleet Manager', permissions: 'Rider & vehicle management' },
    { name: 'Finance', permissions: 'Payment & reports access' },
  ]);

  const showToast = useCallback((message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    const id = toastId + 1;
    setToastId(id);
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, [toastId]);

  const addToast = (message: string, variant: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const toggleSwitch = (key: string, label: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    addToast(`${label} ${toggles[key] ? 'disabled' : 'enabled'}`, 'info');
  };

  const updateField = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const saveNotificationSettings = async () => {
    try {
      const settings: Record<string, unknown> = {
        rider_request_sounds_enabled: toggles.riderRequestSounds,
        rider_request_vibration_enabled: toggles.riderRequestVibration,
        rider_critical_notifications: toggles.riderCriticalNotifications,
        rider_request_timeout_seconds: parseInt(formValues.requestTimeout || '10', 10),
        rider_request_sound: formValues.requestSound || 'ride_request',
      };

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || '';
      const res = await fetch(`${baseUrl}/v1/admin/console/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' ? {} : {}),
        },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || `Failed to save (${res.status})`);
      }

      addToast('Notification settings saved to server', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to save settings', 'error');
    }
  };

  const sidebarItems: { label: Section; icon: typeof Globe }[] = [
    { label: 'General', icon: Globe },
    { label: 'Company Profile', icon: Building },
    { label: 'Account & Security', icon: Shield },
    { label: 'Notifications', icon: Bell },
    { label: 'Payment Methods', icon: CreditCard },
    { label: 'Taxes & Compliance', icon: FileText },
    { label: 'Integrations', icon: Link },
    { label: 'Audit Logs', icon: ClipboardList },
  ];

  const renderGeneral = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>General Settings</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Configure the basic settings for your OkadaGo platform.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => addToast('Resetting to default settings...', 'info')}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <RotateCcw size={14} /> Reset to Default
          </button>
          <button
            onClick={() => addToast('Settings saved successfully', 'success')}
            style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Platform Name */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Platform Name</label>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>This name will be used across the platform.</p>
          <input type="text" value={formValues.platformName} onChange={(e) => updateField('platformName', e.target.value)}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Platform Currency */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Platform Currency</label>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Select the default currency for transactions.</p>
          <select value={formValues.currency} onChange={(e) => updateField('currency', e.target.value)}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <option>GHS - Ghana Cedi (₵)</option>
            <option>USD - US Dollar ($)</option>
            <option>EUR - Euro (€)</option>
            <option>GBP - British Pound (£)</option>
          </select>
        </div>

        {/* Timezone */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Timezone</label>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Set the default timezone for your platform.</p>
          <select value={formValues.timezone} onChange={(e) => updateField('timezone', e.target.value)}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <option>(GMT+00:00) Accra, Ghana</option>
            <option>(GMT+00:00) London</option>
            <option>(GMT+01:00) West Africa Time</option>
          </select>
        </div>

        {/* Date & Time Format */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Date Format</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Choose how dates are displayed.</p>
            <select value={formValues.dateFormat} onChange={(e) => updateField('dateFormat', e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option>May 31, 2024 (MMM DD, YYYY)</option>
              <option>31/05/2024 (DD/MM/YYYY)</option>
              <option>05/31/2024 (MM/DD/YYYY)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Time Format</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Choose how time is displayed.</p>
            <select value={formValues.timeFormat} onChange={(e) => updateField('timeFormat', e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option>12-Hour (02:30 PM)</option>
              <option>24-Hour (14:30)</option>
            </select>
          </div>
        </div>

        {/* Distance Unit & Language */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Distance Unit</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Select the unit for distance calculation.</p>
            <select value={formValues.distanceUnit} onChange={(e) => updateField('distanceUnit', e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option>Kilometers (km)</option>
              <option>Miles (mi)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Default Language</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Select the default language for the platform.</p>
            <select value={formValues.language} onChange={(e) => updateField('language', e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option>English</option>
              <option>Twi</option>
              <option>Hausa</option>
              <option>French</option>
            </select>
          </div>
        </div>

        {/* System Preferences */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>System Preferences</h4>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Configure system-wide preferences.</p>

          {[
            { key: 'autoAssign', label: 'Auto-assign Riders', desc: 'Automatically assign incoming requests to available riders.' },
            { key: 'surgePricing', label: 'Surge Pricing', desc: 'Allow dynamic pricing based on demand.' },
            { key: 'riderOnlineStatus', label: 'Rider Online Status', desc: 'Show riders online status to users.' },
            { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily disable the platform for maintenance.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCompanyProfile = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Company Profile</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage your company information and branding.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => addToast('Resetting to default settings...', 'info')}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <RotateCcw size={14} /> Reset to Default
          </button>
          <button
            onClick={() => addToast('Settings saved successfully', 'success')}
            style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Company Name */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Company Name</label>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Your registered business name.</p>
          <input type="text" value={formValues.companyName} onChange={(e) => updateField('companyName', e.target.value)}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Company Email & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Company Email</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Primary business email address.</p>
            <input type="email" value={formValues.companyEmail} onChange={(e) => updateField('companyEmail', e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Company Phone</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Primary business phone number.</p>
            <input type="tel" value={formValues.companyPhone} onChange={(e) => updateField('companyPhone', e.target.value)}
              style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>
        </div>

        {/* Company Address */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Company Address</label>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Registered business address.</p>
          <input type="text" value={formValues.companyAddress} onChange={(e) => updateField('companyAddress', e.target.value)}
            style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Support Info */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Support Contact</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Support Email</label>
              <input type="email" value={formValues.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Support Phone</label>
              <input type="tel" value={formValues.supportPhone} onChange={(e) => updateField('supportPhone', e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>
        </div>

        {/* Operating Zones */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Operating Zones</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[formValues.zoneName1, formValues.zoneName2, formValues.zoneName3].map((zone, i) => (
              <div key={i} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {zone}
                <button onClick={() => addToast(`Removing ${zone}...`, 'info')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="New zone name" value={formValues.zoneName} onChange={(e) => updateField('zoneName', e.target.value)}
              style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            <button onClick={() => addToast('Opening zone creation form...', 'info')}
              style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Plus size={14} /> Add Zone
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountSecurity = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Account & Security</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage your account security and access controls.</p>
        </div>
        <button
          onClick={() => addToast('Settings saved successfully', 'success')}
          style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Account Actions */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Account Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Edit size={16} style={{ color: 'var(--brand-yellow)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Edit Profile</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your personal information.</div>
                </div>
              </div>
              <button onClick={() => addToast('Opening profile editor...', 'info')}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >Edit</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Key size={16} style={{ color: 'var(--brand-yellow)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Change Password</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your account password.</div>
                </div>
              </div>
              <button onClick={() => addToast('Opening password change form...', 'info')}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >Change</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={16} style={{ color: 'var(--brand-yellow)' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Enable 2FA</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Add two-factor authentication to your account.</div>
                </div>
              </div>
              <button onClick={() => addToast('Setting up two-factor authentication...', 'info')}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >Enable</button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Security Settings</h4>
          {[
            { key: 'require2FA', label: 'Require 2FA for Admin', desc: 'Enforce two-factor authentication for all admin accounts.' },
            { key: 'loginAlerts', label: 'Login Alerts', desc: 'Receive alerts for new device logins.' },
            { key: 'sessionTimeout', label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity.' },
            { key: 'ipWhitelist', label: 'IP Whitelist', desc: 'Restrict admin access to specific IP addresses.' },
            { key: 'smsVerification', label: 'SMS Verification', desc: 'Require SMS verification for sensitive actions.' },
            { key: 'emailVerification', label: 'Email Verification', desc: 'Require email verification for account changes.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Role Management */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Role Management</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {roles.map((role, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{role.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role.permissions}</div>
                </div>
                <button onClick={() => addToast(`Opening editor for ${role.name}...`, 'info')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-yellow)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Edit size={14} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => addToast('Opening role creation form...', 'info')}
            style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={14} /> Add Role
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Notifications</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Configure how and when you receive notifications.</p>
        </div>
        <button
          onClick={() => saveNotificationSettings()}
          style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Notification Channels */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Notification Channels</h4>
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email.' },
            { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS.' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Alert Types */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Alert Types</h4>
          {[
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance reports.' },
            { key: 'lowBalanceAlert', label: 'Low Balance Alert', desc: 'Get notified when wallet balance is low.' },
            { key: 'newRiderAlert', label: 'New Rider Alert', desc: 'Get notified when a new rider signs up.' },
            { key: 'rideCompletionAlert', label: 'Ride Completion Alert', desc: 'Get notified when rides are completed.' },
            { key: 'fraudAlert', label: 'Fraud Detection Alert', desc: 'Get notified of suspicious activities.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* ─── Rider Request Notifications (Admin Control) ──────── */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={16} style={{ color: '#FF6A00' }} />
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#FF6A00', margin: 0 }}>Rider Request Notifications</h4>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Configure how incoming ride requests are delivered to riders. These settings affect all rider devices.
          </p>

          {[
            { key: 'riderRequestSounds', label: 'Enable Rider Request Sounds', desc: 'Allow riders to hear incoming request notification sounds.' },
            { key: 'riderRequestVibration', label: 'Enable Rider Request Vibration', desc: 'Allow devices to vibrate for incoming requests.' },
            { key: 'riderCriticalNotifications', label: 'Critical Notification Priority', desc: 'Send ride requests as critical notifications (bypasses Do Not Disturb).' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}

          {/* Request Timeout Configuration */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Request Timeout (seconds)
            </label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
              How long a rider has to respond before the request expires and cascades to the next rider.
            </p>
            <select
              value={formValues.requestTimeout || '10'}
              onChange={(e) => updateField('requestTimeout', e.target.value)}
              style={{
                width: '200px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="15">15 seconds</option>
              <option value="20">20 seconds</option>
              <option value="30">30 seconds</option>
            </select>
          </div>

          {/* Default Request Sound */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Default Request Sound
            </label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
              The notification sound played when a rider receives an incoming ride request.
            </p>
            <select
              value={formValues.requestSound || 'ride_request'}
              onChange={(e) => updateField('requestSound', e.target.value)}
              style={{
                width: '200px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <option value="ride_request">OkadaGo Alert (Default)</option>
              <option value="default">System Default</option>
              <option value="bell">Bell</option>
              <option value="chime">Chime</option>
            </select>
          </div>

          {/* Safety Notice */}
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#EF4444' }}>Safety Notice</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Ride request notifications are critical safety features. Disabling sounds or vibration may cause riders to miss trip requests. Only disable if necessary for compliance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentMethods = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Payment Methods</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage payment gateways and withdrawal settings.</p>
        </div>
        <button
          onClick={() => addToast('Settings saved successfully', 'success')}
          style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Bank Account */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Bank Account</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Bank Name</label>
              <input type="text" value={formValues.bankName} onChange={(e) => updateField('bankName', e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Account Number</label>
              <input type="text" value={formValues.accountNumber} onChange={(e) => updateField('accountNumber', e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>
        </div>

        {/* Payment Preferences */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Payment Preferences</h4>
          {[
            { key: 'autoWithdraw', label: 'Auto Withdraw', desc: 'Automatically withdraw funds when balance reaches threshold.' },
            { key: 'instantPayout', label: 'Instant Payout', desc: 'Enable instant payouts to riders.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTaxesCompliance = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Taxes & Compliance</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage tax settings and compliance configurations.</p>
        </div>
        <button
          onClick={() => addToast('Settings saved successfully', 'success')}
          style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Tax Information */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Tax Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Tax ID / TIN</label>
              <input type="text" value={formValues.taxId} onChange={(e) => updateField('taxId', e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Registration Number</label>
              <input type="text" value={formValues.registrationNumber} onChange={(e) => updateField('registrationNumber', e.target.value)}
                style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Tax Settings</h4>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Tax Rate (%)</label>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>Default tax rate applied to transactions.</p>
            <input type="number" value={formValues.taxRate} onChange={(e) => updateField('taxRate', e.target.value)}
              style={{ width: '200px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>
        </div>

        {/* Compliance */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Compliance</h4>
          {[
            { key: 'kycRequired', label: 'KYC Required', desc: 'Require identity verification for all riders.' },
            { key: 'dataRetention', label: 'Data Retention Policy', desc: 'Automatically delete data after 5 years.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Integrations</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Connect third-party services and manage modules.</p>
        </div>
        <button
          onClick={() => addToast('Settings saved successfully', 'success')}
          style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Connected Services */}
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Connected Services</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { name: 'Paystack', desc: 'Payment processing', connected: true },
              { name: 'Twilio', desc: 'SMS & notifications', connected: true },
              { name: 'Google Maps', desc: 'Maps & navigation', connected: true },
              { name: 'Firebase', desc: 'Push notifications', connected: false },
              { name: 'SendGrid', desc: 'Email delivery', connected: false },
              { name: 'Stripe', desc: 'International payments', connected: false },
            ].map((service, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{service.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{service.desc}</div>
                </div>
                {service.connected ? (
                  <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> Connected
                  </span>
                ) : (
                  <button onClick={() => addToast(`Connecting ${service.name}...`, 'info')}
                    style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >Connect</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Modules */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Active Modules</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {modules.map((mod, i) => (
              <div key={i} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {mod}
                <button onClick={() => {
                  addToast(`Removing ${mod}...`, 'info');
                  setModules(prev => prev.filter(m => m !== mod));
                }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" placeholder="New module name" value={formValues.newModule} onChange={(e) => updateField('newModule', e.target.value)}
              style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            <button onClick={() => addToast('Opening module form...', 'info')}
              style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <Plus size={14} /> Add Module
            </button>
          </div>
        </div>

        {/* Analytics & Tracking */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Analytics & Tracking</h4>
          {[
            { key: 'analyticsTracking', label: 'Analytics Tracking', desc: 'Enable detailed analytics tracking for the platform.' },
          ].map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{pref.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{pref.desc}</div>
              </div>
              <div onClick={() => toggleSwitch(pref.key, pref.label)}
                style={{
                  width: 44, height: 24, background: toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--bg-primary)',
                  border: `1px solid ${toggles[pref.key] ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  [toggles[pref.key] ? 'right' : 'left']: 2,
                  width: 18, height: 18, background: toggles[pref.key] ? '#111' : 'var(--text-muted)',
                  borderRadius: '50%', transition: 'all 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Audit Logs</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>View system activity and security logs.</p>
        </div>
        <button onClick={() => addToast('Exporting audit log...', 'info')}
          style={{ background: 'var(--brand-yellow)', color: '#111', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Download size={16} /> Export Audit Log
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Log Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['All Events', 'Logins', 'Settings Changes', 'Payment Activity', 'User Management'].map((filter, i) => (
            <button key={i} onClick={() => addToast(`Filtering by: ${filter}`, 'info')}
              style={{
                background: i === 0 ? 'var(--brand-yellow)' : 'transparent',
                color: i === 0 ? '#111' : 'var(--text-secondary)',
                border: `1px solid ${i === 0 ? 'var(--brand-yellow)' : 'var(--border)'}`,
                borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (i !== 0) { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
              onMouseLeave={(e) => { if (i !== 0) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >{filter}</button>
          ))}
        </div>

        {/* Log Entries */}
        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '160px 120px 1fr 140px', gap: 12, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            <span>Timestamp</span>
            <span>Event</span>
            <span>Description</span>
            <span>User</span>
          </div>
          {[
            { time: '2024-05-31 09:30:12', event: 'Settings', desc: 'Platform name updated', user: 'Admin' },
            { time: '2024-05-31 08:15:45', event: 'Login', desc: 'Successful login from new IP', user: 'Admin' },
            { time: '2024-05-30 17:42:33', event: 'Payment', desc: 'Withdrawal processed - GHS 5,000', user: 'System' },
            { time: '2024-05-30 14:20:11', event: 'User', desc: 'New rider registered: Kwame M.', user: 'System' },
            { time: '2024-05-30 11:05:22', event: 'Settings', desc: 'Surge pricing enabled', user: 'Admin' },
            { time: '2024-05-29 16:30:00', event: 'Payment', desc: 'Batch payment completed - 150 riders', user: 'System' },
            { time: '2024-05-29 09:12:45', event: 'Login', desc: 'Password changed', user: 'Admin' },
          ].map((log, i) => (
            <div key={i} style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '160px 120px 1fr 140px', gap: 12, fontSize: 12, borderBottom: i < 6 ? '1px solid var(--border)' : 'none', color: 'var(--text-secondary)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{log.time}</span>
              <span style={{ color: log.event === 'Login' ? 'var(--brand-yellow)' : log.event === 'Payment' ? 'var(--success)' : 'var(--text-primary)', fontWeight: 600 }}>{log.event}</span>
              <span>{log.desc}</span>
              <span style={{ color: log.user === 'System' ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: log.user !== 'System' ? 600 : 400 }}>{log.user}</span>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Showing 1-7 of 1,234 entries</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, '...', 176].map((page, i) => (
              <button key={i} onClick={() => typeof page === 'number' && addToast(`Navigating to page ${page}...`, 'info')}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: page === 1 ? 'var(--brand-yellow)' : 'transparent',
                  color: page === 1 ? '#111' : 'var(--text-secondary)',
                  border: `1px solid ${page === 1 ? 'var(--brand-yellow)' : 'var(--border)'}`,
                  borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (page !== 1) { e.currentTarget.style.borderColor = 'var(--brand-yellow)'; } }}
                onMouseLeave={(e) => { if (page !== 1) { e.currentTarget.style.borderColor = 'var(--border)'; } }}
              >{page}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'General': return renderGeneral();
      case 'Company Profile': return renderCompanyProfile();
      case 'Account & Security': return renderAccountSecurity();
      case 'Notifications': return renderNotifications();
      case 'Payment Methods': return renderPaymentMethods();
      case 'Taxes & Compliance': return renderTaxesCompliance();
      case 'Integrations': return renderIntegrations();
      case 'Audit Logs': return renderAuditLogs();
      default: return renderGeneral();
    }
  };

  return (
    <AdminLayout active="Settings" title="Settings">
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: '0 0 20px 0' }}>Manage your platform preferences and configurations.</p>

      <div style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', minHeight: 700 }}>
        {/* Left Sidebar */}
        <div style={{ width: 240, borderRight: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', padding: '10px 0' }}>
          {sidebarItems.map((item, i) => (
            <div key={i}
              onClick={() => {
                setActiveSection(item.label);
                addToast(`Opening ${item.label} settings`, 'info');
              }}
              style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
                color: activeSection === item.label ? 'var(--brand-yellow)' : 'var(--text-secondary)',
                background: activeSection === item.label ? 'rgba(250,204,21,0.05)' : 'transparent',
                borderLeft: activeSection === item.label ? '3px solid var(--brand-yellow)' : '3px solid transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: activeSection === item.label ? 600 : 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (activeSection !== item.label) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; } }}
              onMouseLeave={(e) => { if (activeSection !== item.label) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; } }}
            >
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: 30, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: activeSection === 'Audit Logs' ? '1fr' : '2fr 1fr', gap: 30 }}>
            {/* Left: Section Content */}
            <div>
              {renderContent()}
            </div>

            {/* Right Sidebar */}
            {activeSection !== 'Audit Logs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Platform Information */}
                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Platform Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Platform Name', val: formValues.platformName },
                      { label: 'Version', val: 'v2.4.0' },
                      { label: 'Environment', val: 'Production', color: 'var(--success)' },
                      { label: 'Last Updated', val: 'May 31, 2024, 09:30 AM' },
                      { label: 'Updated By', val: 'Admin' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.label}</span>
                        <span style={{ color: item.color || 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storage Usage */}
                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>Storage Usage</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>12.45 GB of 100 GB used</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>12.5%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: '12.5%', height: '100%', background: 'var(--brand-yellow)', borderRadius: 3 }} />
                  </div>
                  <button onClick={() => addToast('Opening storage manager...', 'info')}
                    style={{ width: '100%', marginTop: 12, background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >Manage Storage</button>
                </div>

                {/* API Information */}
                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 15 }}>API Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>API Base URL</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ flex: 1, background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 4, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>https://api.okadago.com/v2</code>
                        <button onClick={() => addToast('Opening API documentation...', 'info')}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, transition: 'color 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-yellow)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                        ><ExternalLink size={12} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>API Status</span>
                      <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} /> Operational
                      </span>
                    </div>
                    <button onClick={() => addToast('Opening API documentation...', 'info')}
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--brand-yellow)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >View API Documentation <ExternalLink size={12} /></button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 15 }}>Danger Zone</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Clear Cache', desc: 'Remove all cached data from the system.', btnLabel: 'Clear Cache', toast: 'Clearing cache...' },
                      { label: 'Reset Settings', desc: 'Reset all settings to default values.', btnLabel: 'Reset', toast: 'Resetting to default settings...' },
                      { label: 'Deactivate Platform', desc: 'Temporarily disable the entire platform.', btnLabel: 'Deactivate', toast: 'Deactivating platform...' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{item.label}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>{item.desc}</div>
                        </div>
                        <button onClick={() => addToast(item.toast, 'info')}
                          style={{ background: 'transparent', border: '1px solid var(--danger)', borderRadius: 6, padding: '6px 14px', color: 'var(--danger)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger)'; }}
                        >{item.btnLabel}</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ ...toastStyles.base, ...toastStyles[toast.variant] }}>
            {toast.variant === 'success' && <Check size={16} />}
            {toast.variant === 'error' && <AlertTriangle size={16} />}
            {toast.variant === 'info' && <Info size={16} />}
            {toast.message}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

function Info(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
