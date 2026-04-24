import React from 'react';
import { ArrowLeft, Home, Navigation, PieChart, User, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Earnings() {
  return (
    <div className="w-[390px] h-[844px] bg-gray-50 flex flex-col relative overflow-hidden font-sans mx-auto shadow-xl">
      {/* Status Bar */}
      <div className="h-11 w-full bg-white flex items-center justify-between px-6 text-sm font-medium z-10">
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-4 h-3 bg-black rounded-sm"></div>
          <div className="w-4 h-3 bg-black rounded-sm"></div>
          <div className="w-6 h-3 border border-black rounded-sm relative">
            <div className="absolute inset-[1px] bg-black rounded-[1px] w-[70%]"></div>
          </div>
        </div>
      </div>

      {/* AppBar */}
      <div className="h-14 bg-white flex items-center px-4 z-10 shadow-sm sticky top-0">
        <button className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="font-bold text-xl text-gray-900">Earnings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4 space-y-6">
        {/* Period Selector */}
        <div className="flex gap-2">
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">Today</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#0D6B4A] text-white shadow-sm">This Week</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">This Month</button>
        </div>

        {/* Big Earnings Card */}
        <div className="bg-gradient-to-br from-[#0D6B4A] to-[#0a5238] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="text-white/80 text-sm font-medium mb-1">Net earnings this week</div>
          <div className="text-5xl font-black mb-6 tracking-tight">₵890<span className="text-2xl text-white/70">.00</span></div>
          
          <div className="flex justify-between items-center pt-4 border-t border-white/20 text-sm">
            <div className="flex flex-col">
              <span className="text-white/70">Gross</span>
              <span className="font-bold">₵989.00</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="flex flex-col text-right">
              <span className="text-white/70">Platform Fee</span>
              <span className="font-bold">₵99.00</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs font-medium mb-1">Trips</div>
            <div className="font-bold text-lg text-gray-900">47</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs font-medium mb-1">Online</div>
            <div className="font-bold text-lg text-gray-900">38h</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="text-gray-500 text-xs font-medium mb-1">Avg/Trip</div>
            <div className="font-bold text-lg text-gray-900">₵21</div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Daily Breakdown</h3>
          <div className="h-40 flex items-end justify-between gap-2">
            {[
              { day: 'M', val: 40, amt: '85' },
              { day: 'T', val: 60, amt: '120' },
              { day: 'W', val: 30, amt: '65' },
              { day: 'T', val: 80, amt: '180' },
              { day: 'F', val: 100, amt: '250', active: true },
              { day: 'S', val: 70, amt: '140' },
              { day: 'S', val: 20, amt: '50' },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">₵{d.amt}</span>
                <div 
                  className={cn(
                    "w-full rounded-t-md transition-all duration-300",
                    d.active ? "bg-[#0D6B4A]" : "bg-[#0D6B4A]/20"
                  )} 
                  style={{ height: `${d.val}%` }}
                ></div>
                <span className={cn(
                  "text-xs font-medium",
                  d.active ? "text-[#0D6B4A] font-bold" : "text-gray-500"
                )}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Out Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Available Balance</div>
              <div className="text-2xl font-bold text-gray-900">₵401.00</div>
            </div>
            <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              MTN MoMo
            </div>
          </div>
          <button className="w-full bg-[#FFB800] hover:bg-amber-500 text-amber-950 font-bold py-3.5 rounded-xl shadow-sm transition-colors">
            Cash Out Now
          </button>
        </div>

        {/* Recent Payouts */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Recent Payouts</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              { date: 'Oct 24, 2023', amt: '₵450.00', status: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
              { date: 'Oct 17, 2023', amt: '₵380.00', status: 'Completed', icon: CheckCircle2, color: 'text-green-500' },
              { date: 'Oct 10, 2023', amt: '₵520.00', status: 'Processing', icon: RefreshCw, color: 'text-amber-500' },
            ].map((p, i) => (
              <div key={i} className={cn(
                "p-4 flex items-center justify-between",
                i !== 2 && "border-b border-gray-100"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <p.icon className={cn("w-5 h-5", p.color)} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{p.date}</div>
                    <div className="text-xs text-gray-500 font-medium">MTN Mobile Money</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{p.amt}</div>
                  <div className={cn("text-[10px] font-bold uppercase", p.color)}>{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-5 pt-2 z-20">
        <button className="flex flex-col items-center gap-1 w-16 text-gray-400">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16 text-gray-400">
          <Navigation className="w-6 h-6" />
          <span className="text-[10px] font-medium">Trips</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16 text-[#0D6B4A]">
          <PieChart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Earnings</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
