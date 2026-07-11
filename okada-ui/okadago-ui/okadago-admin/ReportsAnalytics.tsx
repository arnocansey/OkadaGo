import React, { useState, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import {
  BarChart2, PieChart, FileText, Download, Calendar, Filter, Map,
  TrendingUp, Users, Bike, DollarSign, ArrowUpRight, ArrowDownRight,
  Eye, ChevronRight, MapPin, AlertTriangle, Smartphone
} from 'lucide-react';
import './_shared/tokens.css';

type Toast = { id: number; message: string };

export default function ReportsAnalytics() {
  const [reportPeriod, setReportPeriod] = useState<'This Week' | 'This Month' | 'Last Month' | 'Custom'>('This Month');
  const [chartType, setChartType] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handlePeriodChange = (period: 'This Week' | 'This Month' | 'Last Month' | 'Custom') => {
    setReportPeriod(period);
    showToast('Showing ' + period + ' data');
  };

  const topKpis = [
    { label: 'Total Revenue', value: 'GHS 158,750.00', change: '12.6%', up: true, icon: DollarSign, color: 'var(--brand-orange)' },
    { label: 'Total Trips', value: '4,256', change: '8.4%', up: true, icon: Bike, color: 'var(--success)' },
    { label: 'Active Riders', value: '1,985', change: '6.7%', up: true, icon: Users, color: 'var(--brand-yellow)' },
    { label: 'New Riders', value: '320', change: '10.3%', up: true, icon: Users, color: 'var(--info)' },
    { label: 'Total Payouts', value: 'GHS 124,300.50', change: '9.6%', up: true, icon: TrendingUp, color: 'var(--danger)' },
    { label: 'Platform Fees', value: 'GHS 34,449.50', change: '14.1%', up: true, icon: DollarSign, color: 'var(--brand-yellow)' },
  ];

  const topRiders = [
    { rank: 1, name: 'Kofi Mensah', trips: 264, completed: 256, completionRate: '97.0%', rating: 4.8, earnings: 'GHS 1,240.00' },
    { rank: 2, name: 'Kwame Asare', trips: 198, completed: 189, completionRate: '95.5%', rating: 4.7, earnings: 'GHS 980.00' },
    { rank: 3, name: 'Ama Serwaa', trips: 187, completed: 180, completionRate: '96.3%', rating: 4.7, earnings: 'GHS 910.00' },
    { rank: 4, name: 'Akua Boakye', trips: 164, completed: 158, completionRate: '96.3%', rating: 4.6, earnings: 'GHS 820.00' },
    { rank: 5, name: 'Emmanuel Tetteh', trips: 152, completed: 146, completionRate: '96.1%', rating: 4.6, earnings: 'GHS 780.00' },
  ];

  const topVehicles = [
    { rank: 1, vehicle: 'GT 1234-20', trips: 312, completed: 298, utilization: '86.2%', earnings: 'GHS 1,560.00' },
    { rank: 2, vehicle: 'GR 5678-21', trips: 276, completed: 264, utilization: '82.1%', earnings: 'GHS 1,340.00' },
    { rank: 3, vehicle: 'GW 9012-22', trips: 241, completed: 232, utilization: '79.3%', earnings: 'GHS 1,120.00' },
    { rank: 4, vehicle: 'GT 3456-23', trips: 210, completed: 202, utilization: '75.6%', earnings: 'GHS 980.00' },
    { rank: 5, vehicle: 'GN 7890-24', trips: 189, completed: 181, utilization: '73.8%', earnings: 'GHS 890.00' },
  ];

  const cancellationReasons = [
    { reason: 'Customer Cancelled', count: 512, percentage: '35.4%', color: 'var(--danger)' },
    { reason: 'Driver Cancelled', count: 412, percentage: '28.5%', color: 'var(--warning)' },
    { reason: 'No Show', count: 286, percentage: '19.8%', color: 'var(--brand-orange)' },
    { reason: 'Payment Issues', count: 142, percentage: '9.8%', color: 'var(--info)' },
    { reason: 'Other', count: 92, percentage: '6.5%', color: 'var(--text-muted)' },
  ];

  const reports = [
    { title: 'Financial Summary Report', icon: DollarSign, desc: 'Overview of revenue, payouts and platform fees', date: 'Yesterday, 11:59 PM', color: 'var(--brand-orange)' },
    { title: 'Rider Performance Report', icon: Users, desc: 'Detailed performance metrics for all riders', date: 'Today, 6:00 AM', color: 'var(--success)' },
    { title: 'Trip Analysis Report', icon: Bike, desc: 'Trip trends, patterns and analytics', date: 'Today, 6:00 AM', color: 'var(--brand-yellow)' },
    { title: 'Vehicle Utilization Report', icon: BarChart2, desc: 'Vehicle usage and performance analytics', date: 'May 1, 2024', color: 'var(--info)' },
    { title: 'Cancellation Report', icon: FileText, desc: 'Cancellation reasons and trends', date: 'Yesterday, 11:59 PM', color: 'var(--danger)' },
  ];

  const cities = [
    { label: 'Accra', val: '42.5% (1,809)', color: 'var(--brand-orange)' },
    { label: 'Tema', val: '18.7% (796)', color: 'var(--brand-yellow)' },
    { label: 'Kumasi', val: '15.2% (648)', color: 'var(--info)' },
    { label: 'Takoradi', val: '9.1% (387)', color: 'var(--success)' },
    { label: 'Other', val: '14.5% (618)', color: 'var(--text-muted)' },
  ];

  const paymentMethods = [
    { label: 'Mobile Money', val: '82.4%', amount: 'GHS 130,850.00', color: 'var(--brand-yellow)' },
    { label: 'Card Payment', val: '13.6%', amount: 'GHS 21,600.00', color: 'var(--info)' },
    { label: 'Cash', val: '4.0%', amount: 'GHS 6,300.00', color: 'var(--text-muted)' },
  ];

  const insights = [
    { icon: TrendingUp, color: 'var(--success)', title: 'Revenue is up 12.6% compared to the previous period', desc: 'Strong growth across all major metrics' },
    { icon: MapPin, color: 'var(--brand-yellow)', title: 'Accra leads with 42.5% of total trips', desc: 'Consider targeted promotions in other regions' },
    { icon: AlertTriangle, color: 'var(--danger)', title: 'Customer cancellations increased by 8.2%', desc: 'Review pickup experience and communication' },
    { icon: Smartphone, color: 'var(--info)', title: 'Mobile Money is the preferred payment method', desc: '82.4% of all transactions via Mobile Money' },
  ];

  const tripBarData = [
    120, 95, 140, 110, 155, 80, 130, 100, 145, 125,
    160, 90, 135, 105, 150, 85, 140, 115, 165, 75,
    125, 110, 155, 95, 135, 120, 160, 100, 145, 80,
  ];

  const days = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    'Mon', 'Tue',
  ];

  return (
    <AdminLayout
      active="Reports & Analytics"
      title="Reports & Analytics"
      headerRight={
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => showToast('Opening date picker...')}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', fontSize: 12,
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
              gap: 8, cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.borderColor = 'var(--brand-yellow)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Calendar size={14} /> May 1 \u2013 May 31, 2024
          </button>
          <button
            onClick={() => showToast('Exporting dashboard data...')}
            style={{
              background: 'var(--brand-yellow)', border: 'none',
              borderRadius: 8, padding: '8px 16px', fontSize: 12,
              fontWeight: 700, color: '#111', display: 'flex',
              alignItems: 'center', gap: 8, cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>
          Comprehensive insights and reports across all platform operations.
        </p>

        {/* Report Period Selector */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['This Week', 'This Month', 'Last Month', 'Custom'] as const).map(period => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              style={{
                background: reportPeriod === period ? 'var(--brand-yellow)' : 'var(--bg-card)',
                color: reportPeriod === period ? '#111' : 'var(--text-secondary)',
                border: '1px solid ' + (reportPeriod === period ? 'var(--brand-yellow)' : 'var(--border)'),
                borderRadius: 8, padding: '6px 14px', fontSize: 11,
                fontWeight: reportPeriod === period ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (reportPeriod !== period) {
                  e.currentTarget.style.borderColor = 'var(--brand-yellow)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (reportPeriod !== period) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {period}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {topKpis.map((kpi, i) => (
            <div
              key={i}
              onClick={() => showToast('Viewing ' + kpi.label + ' details...')}
              style={{
                background: 'var(--bg-card)', padding: 15, borderRadius: 8,
                border: '1px solid var(--border)', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = kpi.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: kpi.color + '15', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <kpi.icon size={14} style={{ color: kpi.color }} />
                </div>
              </div>
              <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>
                {kpi.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 2, fontSize: 10,
                  color: kpi.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600,
                }}>
                  <ArrowUpRight size={10} />
                  {kpi.change}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs Apr 1 \u2013 Apr 30</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          {/* Revenue Overview */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Revenue Overview
              </h3>
              <select
                onChange={e => {
                  setChartType(e.target.value as any);
                  showToast('Switched to ' + e.target.value + ' view');
                }}
                value={chartType}
                style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 11,
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              {[
                { label: 'Revenue', color: 'var(--brand-orange)' },
                { label: 'Platform Fees', color: 'var(--brand-yellow)' },
                { label: 'Payouts', color: 'var(--danger)' },
              ].map(l => (
                <div
                  key={l.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  onClick={() => showToast('Highlighting ' + l.label + '...')}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 180, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 180" preserveAspectRatio="none">
                {[0, 45, 90, 135, 180].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--border)" strokeWidth="0.5" />
                ))}
                <polyline
                  fill="none" stroke="var(--brand-orange)" strokeWidth="2"
                  points="0,130 50,120 100,110 150,95 200,100 250,80 300,85 350,70 400,75 450,55 500,60 550,45 600,40"
                />
                <polyline
                  fill="none" stroke="var(--brand-yellow)" strokeWidth="2"
                  points="0,150 50,145 100,140 150,135 200,138 250,130 300,132 350,125 400,128 450,120 500,122 550,115 600,110"
                />
                <polyline
                  fill="none" stroke="var(--danger)" strokeWidth="2"
                  points="0,160 50,158 100,155 150,150 200,152 250,148 300,150 350,145 400,147 450,142 500,144 550,140 600,138"
                />
              </svg>
              {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600].map((x, i) => (
                <div
                  key={x}
                  onClick={() => showToast('Showing details for ' + days[i] + '...')}
                  style={{
                    position: 'absolute', left: (x / 600 * 100) + '%', top: 0,
                    width: (50 / 600 * 100) + '%', height: '100%', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Trips Overview */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Trips Overview
              </h3>
              <select style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                <option>Daily</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-orange)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>Total Trips</span>
              </div>
            </div>
            <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {tripBarData.map((h, i) => (
                <div
                  key={i}
                  onClick={() => showToast('Showing details for ' + days[i] + '...')}
                  style={{
                    flex: 1, background: 'var(--brand-orange)', opacity: 0.8,
                    borderRadius: '2px 2px 0 0', height: (h / 180 * 100) + '%',
                    cursor: 'pointer', transition: 'opacity 0.15s ease, transform 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'scaleY(1.05)';
                    e.currentTarget.style.transformOrigin = 'bottom';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = '0.8';
                    e.currentTarget.style.transform = 'scaleY(1)';
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Cities + Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Top Performing Cities */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Top Performing Cities
              </h3>
              <select style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', fontSize: 10,
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                <option>By Trips</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15 }}>
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-orange)"
                    strokeWidth="10" strokeDasharray="108 251" strokeDashoffset="0"
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onClick={() => showToast('Highlighting Accra...')}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-yellow)"
                    strokeWidth="10" strokeDasharray="47 251" strokeDashoffset="-108"
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onClick={() => showToast('Highlighting Tema...')}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--info)"
                    strokeWidth="10" strokeDasharray="38 251" strokeDashoffset="-155"
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onClick={() => showToast('Highlighting Kumasi...')}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--success)"
                    strokeWidth="10" strokeDasharray="23 251" strokeDashoffset="-193"
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onClick={() => showToast('Highlighting Takoradi...')}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--text-muted)"
                    strokeWidth="10" strokeDasharray="35 251" strokeDashoffset="-216"
                    style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                    onClick={() => showToast('Highlighting Other cities...')}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                  />
                </svg>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)', textAlign: 'center',
                }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>Total</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>4,256</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {cities.map(item => (
                  <div
                    key={item.label}
                    onClick={() => showToast('Highlighting ' + item.label + '...')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10, flex: 1 }}>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 600 }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performing Riders */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{
              padding: '15px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Top Performing Riders
              </h3>
              <span
                onClick={() => showToast('Loading all riders...')}
                style={{
                  color: 'var(--brand-yellow)', fontSize: 11, cursor: 'pointer',
                  fontWeight: 600, transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                View All
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Rider', 'Trips', 'Completed', 'Completion Rate', 'Rating', 'Earnings'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 15px', color: 'var(--text-muted)',
                      fontSize: 9, fontWeight: 500, textTransform: 'uppercase' as const,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRiders.map((r, i) => (
                  <tr
                    key={i}
                    onClick={() => showToast('Opening ' + r.name + ' details...')}
                    style={{
                      borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 15px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{r.rank}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11, fontWeight: 500 }}>{r.name}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11 }}>{r.trips}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--success)', fontSize: 11 }}>{r.completed}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11 }}>{r.completionRate}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--brand-yellow)', fontSize: 11 }}>{r.rating}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{r.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top Performing Vehicles */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Top Performing Vehicles
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Vehicle', 'Trips', 'Completed', 'Utilization', 'Earnings'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '10px 15px', color: 'var(--text-muted)',
                      fontSize: 9, fontWeight: 500, textTransform: 'uppercase' as const,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topVehicles.map((v, i) => (
                  <tr
                    key={i}
                    onClick={() => showToast('Opening ' + v.vehicle + ' details...')}
                    style={{
                      borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 15px', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{v.rank}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11, fontWeight: 500 }}>{v.vehicle}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11 }}>{v.trips}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--success)', fontSize: 11 }}>{v.completed}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11 }}>{v.utilization}</td>
                    <td style={{ padding: '10px 15px', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{v.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Row: Cancellation, Reports, Payment Methods, Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {/* Cancellation Analysis */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Cancellation Analysis
              </h3>
              <select style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', fontSize: 10,
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}>
                <option>By Reason</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cancellationReasons.map((item, i) => (
                <div
                  key={i}
                  onClick={() => showToast('Viewing ' + item.reason + ' details...')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', padding: '4px 6px', borderRadius: 4,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, flex: 1 }}>{item.reason}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, width: 30, textAlign: 'right' }}>{item.count}</span>
                  <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                    <div style={{ width: item.percentage, height: '100%', background: item.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 35, textAlign: 'right' }}>{item.percentage}</span>
                </div>
              ))}
            </div>
            <div style={{
              borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>Total</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>1,444 &nbsp; 100%</span>
            </div>
          </div>

          {/* Reports Library */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 15px 0' }}>
              Reports Library
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reports.map((report, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0', borderBottom: i < reports.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                    e.currentTarget.style.paddingLeft = '6px';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.paddingLeft = '0';
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: report.color + '15', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <report.icon size={16} style={{ color: report.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{report.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{report.desc}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast('Generating ' + report.title + '...');
                    }}
                    style={{
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      borderRadius: 4, padding: '4px 10px', color: 'var(--text-primary)',
                      fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--brand-yellow)';
                      e.currentTarget.style.background = 'var(--brand-yellow)';
                      e.currentTarget.style.color = '#111';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-primary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                  >
                    Generate
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => showToast('Loading all reports...')}
              style={{
                width: '100%', marginTop: 12, background: 'transparent',
                border: 'none', color: 'var(--brand-yellow)', fontSize: 11,
                fontWeight: 600, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              View All Reports <ChevronRight size={12} />
            </button>
          </div>

          {/* Revenue by Payment Method + Key Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Revenue by Payment Method
                </h3>
                <select style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '4px 10px', fontSize: 10,
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}>
                  <option>By Amount</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ position: 'relative', width: 90, height: 90 }}>
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="35" fill="none" stroke="var(--brand-yellow)"
                      strokeWidth="10" strokeDasharray="182 220" strokeDashoffset="0"
                      style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                      onClick={() => showToast('Highlighting Mobile Money...')}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    />
                    <circle cx="45" cy="45" r="35" fill="none" stroke="var(--info)"
                      strokeWidth="10" strokeDasharray="30 220" strokeDashoffset="-182"
                      style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                      onClick={() => showToast('Highlighting Card Payment...')}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    />
                    <circle cx="45" cy="45" r="35" fill="none" stroke="var(--text-muted)"
                      strokeWidth="10" strokeDasharray="9 220" strokeDashoffset="-212"
                      style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                      onClick={() => showToast('Highlighting Cash...')}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)', textAlign: 'center',
                  }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>GHS</div>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 700 }}>158,750.00</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>Total</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {paymentMethods.map(item => (
                    <div
                      key={item.label}
                      onClick={() => showToast('Highlighting ' + item.label + '...')}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', padding: '2px 4px', borderRadius: 4,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{item.label}</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 600 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 15px 0' }}>
                Key Insights
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    onClick={() => showToast('Opening insight: ' + insight.title.substring(0, 40) + '...')}
                    style={{
                      display: 'flex', gap: 10, cursor: 'pointer', padding: 6,
                      borderRadius: 6, transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: insight.color + '15', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <insight.icon size={14} style={{ color: insight.color }} />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>
                        {insight.title}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 2 }}>
                        {insight.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toast Container */}
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {toasts.map(toast => (
            <div
              key={toast.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--brand-yellow)',
                borderRadius: 8, padding: '10px 16px',
                fontSize: 12, fontWeight: 500,
                color: 'var(--text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'slideIn 0.2s ease',
                maxWidth: 300,
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </AdminLayout>
  );
}
