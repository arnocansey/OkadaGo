import React, { useState, useEffect } from 'react';
import {
  Plus, Smartphone, CreditCard, BarChart3, MessageSquare, Image,
  Key, Webhook, RefreshCw, ChevronRight, Zap,
  Link2, CheckCircle2, XCircle
} from 'lucide-react';
import { SkeletonCard, SkeletonTable } from './AdminSkeleton';

export type IntegrationsScreenProps = {
  dataLoading?: boolean;
};

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

const tabs = ['Overview', 'Connected Services', 'API Keys', 'Webhooks', 'Data Sync', 'Activity Logs'];

const integrations = [
  { name: 'MTN Mobile Money', icon: Smartphone, color: '#FFCC00', connected: true, description: 'Mobile money payments via MTN MoMo API' },
  { name: 'Vodafone Cash', icon: CreditCard, color: '#E60000', connected: true, description: 'Vodafone Cash wallet integration' },
  { name: 'PayPal', icon: CreditCard, color: '#003087', connected: false, description: 'International online payment processing' },
  { name: 'Stripe', icon: CreditCard, color: '#635BFF', connected: false, description: 'Global payment infrastructure' },
  { name: 'Twilio', icon: MessageSquare, color: '#F22F46', connected: true, description: 'SMS and voice notifications' },
  { name: 'Google Analytics', icon: BarChart3, color: '#E37400', connected: true, description: 'Web analytics and user tracking' },
  { name: 'Mailchimp', icon: MessageSquare, color: '#FFE01B', connected: false, description: 'Email marketing automation' },
  { name: 'Cloudinary', icon: Image, color: '#3448C5', connected: true, description: 'Image and media management' },
];

const recentActivity = [
  { activity: 'Webhook delivered', integration: 'MTN Mobile Money', details: 'Payment callback sent', status: 'success', time: '2 min ago' },
  { activity: 'Sync completed', integration: 'Google Analytics', details: 'Daily data sync', status: 'success', time: '15 min ago' },
  { activity: 'API key rotated', integration: 'Twilio', details: 'Key refreshed', status: 'success', time: '1 hr ago' },
  { activity: 'Connection failed', integration: 'Mailchimp', details: 'Auth token expired', status: 'error', time: '3 hr ago' },
  { activity: 'Image optimized', integration: 'Cloudinary', details: 'Batch processed 120 images', status: 'success', time: '5 hr ago' },
];

const connectedServices = [
  { name: 'MTN Mobile Money', type: 'Payment', color: '#FFCC00' },
  { name: 'Vodafone Cash', type: 'Payment', color: '#E60000' },
  { name: 'Twilio', type: 'Communications', color: '#F22F46' },
  { name: 'Google Analytics', type: 'Analytics', color: '#E37400' },
  { name: 'Cloudinary', type: 'Media', color: '#3448C5' },
];

const badgeStyle = (connected: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 10,
  fontSize: 10, fontWeight: 600,
  background: connected ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
  color: connected ? 'var(--success)' : 'var(--text-muted)',
});

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)', padding: 16,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0,
};

const linkStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--brand-yellow)', cursor: 'pointer', textDecoration: 'none',
};

const sidebarRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)',
};

const statusDot = (ok: boolean): React.CSSProperties => ({
  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
  background: ok ? 'var(--success)' : 'var(--text-muted)',
});

export function IntegrationsScreen({ dataLoading }: IntegrationsScreenProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const { isMobile, isTablet } = useBreakpoint();

  if (dataLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', minHeight: '100vh' }}>
        <div style={{ ...shimmerStyle, width: 180, height: 24, marginBottom: 4 }} />
        <div style={{ ...shimmerStyle, width: 320, height: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  const gridCols = isMobile ? '1fr' : isTablet ? '1fr 280px' : '1fr 340px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Integrations</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Connect OkadaGo with third-party services and tools to extend platform capabilities.
          </p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'var(--brand-yellow)',
          border: 'none', borderRadius: 8, padding: '8px 16px', color: '#111',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <Plus size={14} /> Add Integration
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2, borderBottom: '1px solid var(--border)' }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === tab ? 'var(--brand-yellow)' : 'transparent',
            color: activeTab === tab ? '#111' : 'var(--text-secondary)',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Main + Sidebar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 18 }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Popular Integrations */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={sectionHeadingStyle}>Popular Integrations</h2>
              <span style={linkStyle}>View All</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {integrations.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: `${item.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={18} style={{ color: item.color }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </div>
                        <span style={badgeStyle(item.connected)}>
                          {item.connected ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                          {item.connected ? 'Connected' : 'Not Connected'}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: 4 }}>
                      <span style={{ ...linkStyle, fontSize: 11 }}>
                        {item.connected ? 'Manage' : 'Connect'} <ChevronRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={sectionHeadingStyle}>Recent Integration Activity</h2>
              <span style={linkStyle}>View All</span>
            </div>
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 0.7fr 0.8fr', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {['Activity', 'Integration', 'Details', 'Status', 'Date & Time'].map((h) => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>
              {recentActivity.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 0.7fr 0.8fr', padding: '10px 16px', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{row.activity}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.integration}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.details}</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600,
                    color: row.status === 'success' ? 'var(--success)' : 'var(--danger)',
                  }}>
                    <span style={statusDot(row.status === 'success')} />
                    {row.status === 'success' ? 'Success' : 'Failed'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Connected Services */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={sectionHeadingStyle}>Connected Services</h3>
              <span style={linkStyle}>View All</span>
            </div>
            {connectedServices.map((svc) => (
              <div key={svc.name} style={sidebarRowStyle}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: `${svc.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Link2 size={12} style={{ color: svc.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{svc.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{svc.type}</div>
                </div>
                <span style={statusDot(true)} />
              </div>
            ))}
            <span style={{ ...linkStyle, display: 'block', marginTop: 10, textAlign: 'center' }}>Manage Connected Services</span>
          </div>

          {/* API & Webhooks */}
          <div style={cardStyle}>
            <h3 style={{ ...sectionHeadingStyle, marginBottom: 12 }}>API & Webhooks</h3>
            <div style={sidebarRowStyle}>
              <Key size={14} style={{ color: 'var(--brand-yellow)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>API Keys</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>3 Active</div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ ...sidebarRowStyle, borderBottom: 'none' }}>
              <Webhook size={14} style={{ color: 'var(--info)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Webhooks</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>5 Active</div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
            <span style={{ ...linkStyle, display: 'block', marginTop: 10, textAlign: 'center' }}>Manage API & Webhooks</span>
          </div>

          {/* Automation & Sync */}
          <div style={cardStyle}>
            <h3 style={{ ...sectionHeadingStyle, marginBottom: 12 }}>Automation & Sync</h3>
            <div style={sidebarRowStyle}>
              <RefreshCw size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Data Sync</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Healthy</div>
              </div>
              <span style={{ ...badgeStyle(true), fontSize: 9 }}>Healthy</span>
            </div>
            <div style={{ ...sidebarRowStyle, borderBottom: 'none' }}>
              <Zap size={14} style={{ color: 'var(--brand-yellow)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Automation Rules</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>2 Active</div>
              </div>
              <span style={{ ...badgeStyle(true), fontSize: 9 }}>2 Active</span>
            </div>
            <span style={{ ...linkStyle, display: 'block', marginTop: 10, textAlign: 'center' }}>Manage Automation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const shimmerStyle: React.CSSProperties = {
  borderRadius: 6,
  background: 'linear-gradient(90deg, var(--bg-elevated) 25%, #2a2a2a 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.5s infinite',
};
