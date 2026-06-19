import React from "react";
import { ArrowLeft, Home, Navigation, PieChart, User, CheckCircle2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileScreenShell } from "../_shared/mobile-screen-shell";
import { MobileStatusBar } from "../_shared/mobile-status-bar";
import { MobileBottomNav } from "../_shared/mobile-bottom-nav";

export function Earnings() {
  return (
    <MobileScreenShell className="bg-gray-50 flex flex-col shadow-xl">
      <MobileStatusBar className="bg-white px-6 text-sm" />

      <div className="h-14 bg-white flex items-center px-4 z-10 shadow-sm sticky top-0">
        <button className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="font-bold text-xl text-gray-900">Earnings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))] px-4 pt-4 space-y-6">
        <div className="flex gap-2">
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">Today</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#0D6B4A] text-white shadow-sm">This Week</button>
          <button className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-600">This Month</button>
        </div>

        <div className="bg-gradient-to-br from-[#0D6B4A] to-[#0a5238] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="text-white/80 text-sm font-medium mb-1">Net earnings this week</div>
          <div className="text-5xl font-black mb-6 tracking-tight">₵890<span className="text-2xl text-white/70">.00</span></div>
          <div className="flex justify-between items-center pt-4 border-t border-white/20 text-sm">
            <div className="flex flex-col"><span className="text-white/70">Gross</span><span className="font-bold">₵989.00</span></div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col text-right"><span className="text-white/70">Platform Fee</span><span className="font-bold">₵99.00</span></div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-medium mb-1">Trips</div><div className="font-bold text-lg text-gray-900">47</div></div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-medium mb-1">Online</div><div className="font-bold text-lg text-gray-900">38h</div></div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100"><div className="text-gray-500 text-xs font-medium mb-1">Avg/Trip</div><div className="font-bold text-lg text-gray-900">₵21</div></div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6">Daily Breakdown</h3>
          <div className="h-40 flex items-end justify-between gap-2">
            {[
              { day: "M", val: 40, amt: "85" },
              { day: "T", val: 60, amt: "120" },
              { day: "W", val: 30, amt: "65" },
              { day: "T", val: 80, amt: "180" },
              { day: "F", val: 100, amt: "250", active: true },
              { day: "S", val: 70, amt: "140" },
              { day: "S", val: 20, amt: "50" }
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-[10px] font-medium text-gray-400 group-hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">₵{d.amt}</span>
                <div className={cn("w-full rounded-t-md transition-all duration-300", d.active ? "bg-[#0D6B4A]" : "bg-[#0D6B4A]/20")} style={{ height: `${d.val}%` }} />
                <span className={cn("text-xs font-medium", d.active ? "text-[#0D6B4A] font-bold" : "text-gray-500")}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div><div className="text-sm font-medium text-gray-500 mb-1">Available Balance</div><div className="text-2xl font-bold text-gray-900">₵401.00</div></div>
            <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full">MTN MoMo</div>
          </div>
          <button className="w-full bg-[#FFB800] hover:bg-amber-500 text-amber-950 font-bold py-3.5 rounded-xl shadow-sm transition-colors">Cash Out Now</button>
        </div>

        <div>
          <h3 className="font-bold text-gray-900 mb-3">Recent Payouts</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[
              { date: "Oct 24, 2023", amt: "₵450.00", status: "Completed", icon: CheckCircle2, color: "text-green-500" },
              { date: "Oct 17, 2023", amt: "₵380.00", status: "Completed", icon: CheckCircle2, color: "text-green-500" },
              { date: "Oct 10, 2023", amt: "₵520.00", status: "Processing", icon: RefreshCw, color: "text-amber-500" }
            ].map((p, i) => (
              <div key={i} className={cn("p-4 flex items-center justify-between", i !== 2 && "border-b border-gray-100")}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"><p.icon className={cn("w-5 h-5", p.color)} /></div>
                  <div><div className="font-semibold text-sm text-gray-900">{p.date}</div><div className="text-xs text-gray-500 font-medium">MTN Mobile Money</div></div>
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

      <MobileBottomNav
        items={[
          { label: "Home", icon: Home },
          { label: "Trips", icon: Navigation },
          { label: "Earnings", icon: PieChart, active: true },
          { label: "Profile", icon: User }
        ]}
      />
    </MobileScreenShell>
  );
}
