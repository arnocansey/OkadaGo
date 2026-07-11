import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './_shared/AdminLayout';
import {
  BarChart2, CheckCircle, XCircle, Zap, AlertTriangle, Star,
  MapPin, TrendingUp, ChevronRight, Info, ArrowUpRight, ArrowDownRight,
  Download, Filter, Calendar, Search, ChevronLeft
} from 'lucide-react';
import './_shared/tokens.css';

interface Toast {
  id: number;
  message: string;
}

export default function Performance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'trips' | 'rating'>('trips');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);
  const [highlightedSeries, setHighlightedSeries] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const addToast = useCallback((message: string) => {
    setToastId(prev => {
      const id = prev + 1;
      setToasts(current => [...current, { id, message }]);
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id));
      }, 3000);
      return id;
    });
  }, []);

  const stats = [
    { label: 'Total Trips', value: '18,745', change: '14.6%', up: true, icon: BarChart2, color: 'var(--brand-orange)' },
    { label: 'Completed Trips', value: '17,892', change: '15.3%', up: true, icon: CheckCircle, color: 'var(--success)' },
    { label: 'Cancelled Trips', value: '853', change: '3.8%', up: false, icon: XCircle, color: 'var(--danger)' },
    { label: 'Acceptance Rate', value: '92.6%', change: '4.2%', up: true, icon: Zap, color: 'var(--brand-yellow)' },
    { label: 'Cancellation Rate', value: '3.2%', change: '0.6%', up: false, icon: AlertTriangle, color: 'var(--warning)' },
    { label: 'Average Rating', value: '4.7', change: '0.2', up: true, icon: Star, color: 'var(--brand-orange)' },
  ];

  const leaderboard = [
    { name: 'Kofi Mensah', trips: 432, rating: 4.9, zone: 'Accra' },
    { name: 'Ama Serwaa', trips: 389, rating: 4.8, zone: 'Tema' },
    { name: 'Kwame Asare', trips: 354, rating: 4.8, zone: 'Madina' },
    { name: 'Akua Boakye', trips: 321, rating: 4.7, zone: 'Lapaz' },
    { name: 'Emmanuel Tetteh', trips: 298, rating: 4.7, zone: 'Osu' },
  ];

  const tableRows = [
    { rank: 1, rider: 'Kofi Mensah', total: 432, completed: 418, cancelled: 14, acceptance: '94.6%', cancellation: '3.2%', rating: 4.9, zone: 'Accra' },
    { rank: 2, rider: 'Ama Serwaa', total: 389, completed: 374, cancelled: 15, acceptance: '93.1%', cancellation: '3.6%', rating: 4.8, zone: 'Tema' },
    { rank: 3, rider: 'Kwame Asare', total: 354, completed: 339, cancelled: 15, acceptance: '91.8%', cancellation: '4.0%', rating: 4.8, zone: 'Madina' },
    { rank: 4, rider: 'Akua Boakye', total: 321, completed: 306, cancelled: 15, acceptance: '92.4%', cancellation: '3.8%', rating: 4.7, zone: 'Lapaz' },
    { rank: 5, rider: 'Emmanuel Tetteh', total: 298, completed: 285, cancelled: 13, acceptance: '93.9%', cancellation: '3.1%', rating: 4.7, zone: 'Osu' },
    { rank: 6, rider: 'Abdulai Mohammed', total: 287, completed: 272, cancelled: 15, acceptance: '90.5%', cancellation: '4.4%', rating: 4.6, zone: 'Teshie' },
  ];

  const filteredRows = tableRows.filter(row =>
    row.rider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.zone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.rider.localeCompare(b.rider);
    else if (sortBy === 'trips') cmp = a.total - b.total;
    else if (sortBy === 'rating') cmp = a.rating - b.rating;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sortedRows.length / ITEMS_PER_PAGE);
  const paginatedRows = sortedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (col: 'name' | 'trips' | 'rating') => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  const sortIndicator = (col: string) => sortBy === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  const chartDays = ['May 1', 'May 6', 'May 11', 'May 16', 'May 21', 'May 26', 'May 31'];
  const barHeights = [85, 92, 78, 110, 95, 120, 88, 105, 98, 115, 90, 100, 88, 125, 95, 108, 82, 118, 92, 105, 110, 88, 95, 120, 100, 85, 115, 90, 108, 98, 112];

  const handleBarChartClick = (index: number) => {
    addToast(`Showing details for May ${index + 1}...`);
  };

  const handleSeriesLegend = (label: string) => {
    setHighlightedSeries(prev => prev === label ? null : label);
    addToast(`Highlighting ${label}...`);
  };

  const buttonBaseStyle = (id: string) => ({
    background: hoveredButton === id ? 'var(--bg-elevated)' : 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
    cursor: 'pointer' as const,
    transition: 'background 0.15s, transform 0.1s',
  });

  return (
    <AdminLayout active="Performance" title="Rider Performance" breadcrumbs={['Riders Management', 'Performance']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Toast Container */}
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(toast => (
            <div key={toast.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 12,
              color: 'var(--text-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'slideIn 0.2s ease-out',
              minWidth: 220,
            }}>
              {toast.message}
            </div>
          ))}
        </div>

        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              style={buttonBaseStyle('date')}
              onMouseEnter={() => setHoveredButton('date')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => addToast('Opening date picker...')}
            >
              <Calendar size={14} /> May 1 – May 31, 2024
            </button>
            <button
              style={buttonBaseStyle('filter')}
              onMouseEnter={() => setHoveredButton('filter')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => addToast('Opening filters...')}
            >
              <Filter size={14} /> Filters
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search riders or zones..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 12px 8px 30px',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: 200,
                }}
              />
            </div>
          </div>
          <button
            style={{
              background: hoveredButton === 'export' ? '#e5b800' : 'var(--brand-yellow)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: 700,
              color: '#111',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s, transform 0.1s',
              transform: hoveredButton === 'export' ? 'scale(1.02)' : 'scale(1)',
            }}
            onMouseEnter={() => setHoveredButton('export')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => addToast('Exporting leaderboard data...')}
          >
            <Download size={14} /> Export Report
          </button>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {stats.map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', padding: 15, borderRadius: 8, border: '1px solid var(--border)', transition: 'transform 0.15s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: stat.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {stat.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.change}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 2 }}>{stat.label}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 9, marginTop: 4 }}>vs Apr 1 – Apr 30</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Performance Overview</h3>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)' }}>
                <option>This Month</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
              {[
                { label: 'Completed Trips', color: 'var(--success)' },
                { label: 'Cancelled Trips', color: 'var(--danger)' },
                { label: 'Acceptance Rate (%)', color: 'var(--brand-yellow)' },
                { label: 'Rating', color: 'var(--info)' },
              ].map(l => (
                <div key={l.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', opacity: highlightedSeries && highlightedSeries !== l.label ? 0.4 : 1, transition: 'opacity 0.2s' }}
                  onClick={() => handleSeriesLegend(l.label)}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 200, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                {[0, 50, 100, 150, 200].map(y => (
                  <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="var(--border)" strokeWidth="0.5" />
                ))}
                <polyline fill="none" stroke="var(--success)" strokeWidth="2" strokeOpacity={!highlightedSeries || highlightedSeries === 'Completed Trips' ? 1 : 0.2} points="0,140 50,120 100,130 150,100 200,110 250,80 300,90 350,70 400,85 450,60 500,75 550,55 600,50" />
                <polyline fill="none" stroke="var(--danger)" strokeWidth="2" strokeOpacity={!highlightedSeries || highlightedSeries === 'Cancelled Trips' ? 1 : 0.2} points="0,170 50,175 100,168 150,180 200,172 250,185 300,178 350,182 400,175 450,188 500,180 550,185 600,182" />
                <polyline fill="none" stroke="var(--brand-yellow)" strokeWidth="2" strokeOpacity={!highlightedSeries || highlightedSeries === 'Acceptance Rate (%)' ? 1 : 0.2} points="0,60 50,55 100,65 150,50 200,58 250,45 300,52 350,40 400,48 450,35 500,42 550,30 600,25" />
                <polyline fill="none" stroke="var(--info)" strokeWidth="2" strokeOpacity={!highlightedSeries || highlightedSeries === 'Rating' ? 1 : 0.2} points="0,50 50,48 100,52 150,46 200,50 250,44 300,48 350,42 400,46 450,40 500,44 550,38 600,35" />
              </svg>
              <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                {chartDays.map(d => (
                  <span key={d} style={{ color: 'var(--text-muted)', fontSize: 9 }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ padding: 20, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Performance by Location</h3>
                <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <option>This Month</option>
                </select>
              </div>
            </div>
            <div style={{ width: '100%', height: '100%', background: '#0a0a0a', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '35%', left: '45%', width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,107,0,0.4) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', top: '25%', left: '25%', width: 80, height: 80, background: 'radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', top: '55%', left: '65%', width: 120, height: 120, background: 'radial-gradient(circle, rgba(255,107,0,0.3) 0%, transparent 70%)' }} />
              <div style={{ position: 'absolute', top: '40%', left: '55%', color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>Accra</div>
              <div style={{ position: 'absolute', top: '30%', left: '60%', color: 'var(--text-secondary)', fontSize: 10 }}>Tema</div>
              <div style={{ position: 'absolute', top: '25%', left: '45%', color: 'var(--text-secondary)', fontSize: 10 }}>Madina</div>
              <div style={{ position: 'absolute', top: '30%', left: '30%', color: 'var(--text-secondary)', fontSize: 10 }}>Lapaz</div>
              <div style={{ position: 'absolute', top: '50%', left: '55%', color: 'var(--text-secondary)', fontSize: 10 }}>Osu</div>
              <div style={{ position: 'absolute', top: '55%', left: '70%', color: 'var(--text-secondary)', fontSize: 10 }}>Nungua</div>
              <div style={{ position: 'absolute', top: '60%', left: '50%', color: 'var(--text-secondary)', fontSize: 10 }}>Teshie</div>
              <MapPin size={18} fill="var(--brand-orange)" color="var(--brand-orange)" style={{ position: 'absolute', top: '42%', left: '52%', cursor: 'pointer' }} onClick={() => addToast('Showing Accra details...')} />
              <MapPin size={14} fill="var(--brand-yellow)" color="var(--brand-yellow)" style={{ position: 'absolute', top: '32%', left: '32%', cursor: 'pointer' }} onClick={() => addToast('Showing Madina details...')} />
              <MapPin size={16} fill="var(--brand-orange)" color="var(--brand-orange)" style={{ position: 'absolute', top: '58%', left: '68%', cursor: 'pointer' }} onClick={() => addToast('Showing Nungua details...')} />
              <MapPin size={12} fill="var(--info)" color="var(--info)" style={{ position: 'absolute', top: '28%', left: '48%', cursor: 'pointer' }} onClick={() => addToast('Showing Tema details...')} />
              <div style={{ position: 'absolute', bottom: 20, left: 20, display: 'flex', alignItems: 'center', gap: 15, background: 'rgba(28,28,30,0.9)', padding: '8px 12px', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 9 }}>Low</span>
                </div>
                <div style={{ width: 60, height: 6, borderRadius: 3, background: 'linear-gradient(to right, var(--danger), var(--warning), var(--success))' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 9 }}>High</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Riders, Trips Trend, Ratings Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Top Performing Riders</h3>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: 'var(--text-secondary)' }}>
                <option>This Month</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaderboard.map((rider, i) => (
                <div key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s', background: hoveredRow === 100 + i ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                  onMouseEnter={() => setHoveredRow(100 + i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => addToast(`Viewing ${rider.name} profile...`)}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--brand-yellow)' : i === 1 ? '#E5E7EB' : i === 2 ? '#D97706' : 'var(--bg-elevated)', color: i < 3 ? '#111' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{rider.name[0]}</span>
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{rider.name}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 600 }}>{rider.trips} trips</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--brand-yellow)', fontSize: 10, justifyContent: 'flex-end' }}>
                      <Star size={8} fill="currentColor" /> {rider.rating}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              style={{
                width: '100%', marginTop: 15, background: 'transparent', border: 'none', color: 'var(--brand-yellow)', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'opacity 0.15s',
                opacity: hoveredButton === 'viewAllTop' ? 0.8 : 1,
              }}
              onMouseEnter={() => setHoveredButton('viewAllTop')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => addToast('Loading all riders...')}
            >
              View All Top Riders <ChevronRight size={12} />
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>18,745</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total Trips</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <ArrowUpRight size={10} color="var(--success)" />
                  <span style={{ color: 'var(--success)', fontSize: 10, fontWeight: 600 }}>14.6%</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>vs Apr 1 – Apr 30</span>
                </div>
              </div>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)' }}>
                <option>This Month</option>
              </select>
            </div>
            <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {barHeights.map((h, i) => (
                <div key={i}
                  style={{
                    flex: 1,
                    background: hoveredBar === i ? '#e57400' : 'var(--brand-orange)',
                    opacity: hoveredBar === i ? 1 : 0.8,
                    borderRadius: '2px 2px 0 0',
                    height: `${h / 180 * 100}%`,
                    cursor: 'pointer',
                    transition: 'background 0.15s, opacity 0.15s, transform 0.1s',
                    transform: hoveredBar === i ? 'scaleY(1.03)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                  onClick={() => handleBarChartClick(i)}
                />
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Ratings Distribution</h3>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 10, color: 'var(--text-secondary)' }}>
                <option>This Month</option>
              </select>
            </div>
            <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--success)" strokeWidth="10" strokeDasharray="172 251" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-yellow)" strokeWidth="10" strokeDasharray="57 251" strokeDashoffset="-172" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--brand-orange)" strokeWidth="10" strokeDasharray="15 251" strokeDashoffset="-229" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--text-muted)" strokeWidth="10" strokeDasharray="2 251" strokeDashoffset="-244" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--danger)" strokeWidth="10" strokeDasharray="2 251" strokeDashoffset="-246" />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700 }}>18,745</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 8 }}>Total Ratings</div>
              </div>
            </div>
            <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '5 Stars', count: '12,845', percent: '68.6%', color: 'var(--success)' },
                { label: '4 Stars', count: '4,260', percent: '22.7%', color: 'var(--brand-yellow)' },
                { label: '3 Stars', count: '1,150', percent: '6.1%', color: 'var(--brand-orange)' },
                { label: '2 Stars', count: '320', percent: '1.7%', color: 'var(--text-muted)' },
                { label: '1 Star', count: '170', percent: '0.9%', color: 'var(--danger)' },
              ].map(item => (
                <div key={item.label}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '2px 4px', borderRadius: 4, transition: 'background 0.15s', background: hoveredButton === item.label ? 'rgba(255,255,255,0.04)' : 'transparent' }}
                  onMouseEnter={() => setHoveredButton(item.label)}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => addToast(`Filtering by ${item.label}...`)}
                >
                  <div style={{ width: 40, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{item.label}</span>
                  </div>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                    <div style={{ width: item.percent, height: '100%', background: item.color, borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 9, width: 45 }}>{item.count}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 9, width: 30, textAlign: 'right' }}>{item.percent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: 0 }}>Performance by Metrics</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)' }}>
                <option>This Month</option>
              </select>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                >
                  Rider{sortIndicator('name')}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', cursor: 'pointer' }}
                  onClick={() => handleSort('trips')}
                >
                  Total Trips{sortIndicator('trips')}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>Completed</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>Cancelled</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>Acceptance Rate</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase' }}>Cancellation Rate</th>
                <th style={{ textAlign: 'left', padding: '12px 20px', color: 'var(--text-muted)', fontSize: 10, fontWeight: 500, textTransform: 'uppercase', cursor: 'pointer' }}
                  onClick={() => handleSort('rating')}
                >
                  Average Rating{sortIndicator('rating')}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => (
                <tr key={i}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: hoveredRow === i ? 'rgba(255,255,255,0.04)' : 'transparent',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => addToast(`Opening ${row.rider} performance details...`)}
                >
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: row.rank <= 3 ? 'var(--brand-yellow)' : 'var(--bg-elevated)', color: row.rank <= 3 ? '#111' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{row.rank}</div>
                      <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }}>{row.rider}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-primary)', fontSize: 12 }}>{row.total}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--success)', fontSize: 12 }}>{row.completed}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--danger)', fontSize: 12 }}>{row.cancelled}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--brand-yellow)', fontSize: 12 }}>{row.acceptance}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--warning)', fontSize: 12 }}>{row.cancellation}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-yellow)', fontSize: 12, fontWeight: 600 }}>
                      <Star size={12} fill="currentColor" /> {row.rating}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border)' }}>
            <button
              disabled={currentPage === 1}
              style={{
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--brand-yellow)',
                background: 'transparent',
                border: 'none',
                fontSize: 11,
                cursor: currentPage === 1 ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                opacity: currentPage === 1 ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
              onClick={() => { if (currentPage > 1) { setCurrentPage(p => p - 1); addToast('Loading previous page...'); } }}
            >
              <ChevronLeft size={12} /> Previous
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              style={{
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--brand-yellow)',
                background: 'transparent',
                border: 'none',
                fontSize: 11,
                cursor: currentPage === totalPages ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                opacity: currentPage === totalPages ? 0.4 : 1,
                transition: 'opacity 0.15s',
              }}
              onClick={() => { if (currentPage < totalPages) { setCurrentPage(p => p + 1); addToast('Loading next page...'); } }}
            >
              Next <ChevronRight size={12} />
            </button>
          </div>
          <div style={{ padding: '0 20px 10px', textAlign: 'center' }}>
            <button
              style={{
                color: 'var(--brand-yellow)',
                background: 'transparent',
                border: 'none',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                margin: '0 auto',
                transition: 'opacity 0.15s',
                opacity: hoveredButton === 'viewFull' ? 0.8 : 1,
              }}
              onMouseEnter={() => setHoveredButton('viewFull')}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => addToast('Exporting leaderboard data...')}
            >
              Export Leaderboard <Download size={12} />
            </button>
          </div>
        </div>

        {/* Performance Insight Banner */}
        <div style={{ background: 'linear-gradient(90deg, #FF6B00, #FACC15)', borderRadius: 8, padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 15 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Info size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Performance Insight</div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, marginTop: 2 }}>Great job! Overall performance improved by 14.6% this month. Keep up the excellent service.</div>
          </div>
          <button
            style={{
              background: hoveredButton === 'downloadInsights' ? '#f0f0f0' : '#fff',
              color: '#FF6B00',
              border: 'none',
              borderRadius: 6,
              padding: '8px 15px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              transition: 'background 0.15s, transform 0.1s',
              transform: hoveredButton === 'downloadInsights' ? 'scale(1.03)' : 'scale(1)',
            }}
            onMouseEnter={() => setHoveredButton('downloadInsights')}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => addToast('Opening action panel...')}
          >
            <Download size={12} /> Download Insights
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </AdminLayout>
  );
}
