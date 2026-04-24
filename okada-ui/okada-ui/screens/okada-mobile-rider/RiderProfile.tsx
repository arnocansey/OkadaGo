import React from 'react';
import { Home, Navigation, PieChart, User, Edit2, CheckCircle2, Clock, AlertCircle, ChevronRight, Settings, HelpCircle, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RiderProfile() {
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
      <div className="h-14 bg-white flex items-center justify-between px-4 z-10 shadow-sm sticky top-0">
        <h1 className="font-bold text-xl text-gray-900">Profile</h1>
        <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <Edit2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Header Section */}
        <div className="bg-white px-4 py-6 mb-2 border-b border-gray-100 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-[#0D6B4A] flex items-center justify-center text-white text-3xl font-bold shadow-md">
              EO
            </div>
            <div className="absolute -bottom-2 right-0 bg-white p-1 rounded-full shadow-sm">
              <div className="bg-[#0D6B4A] w-6 h-6 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Emmanuel Osei</h2>
          <p className="text-gray-500 font-medium mb-3">+233 20 123 4567</p>
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-[#0D6B4A] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Rider
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 py-4 bg-white mb-2 border-y border-gray-100 flex divide-x divide-gray-100">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xl font-bold text-gray-900">234</span>
            <span className="text-xs text-gray-500 font-medium">Trips</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-gray-900">4.7</span>
              <span className="text-[#FFB800] text-sm">★</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">Rating</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xl font-bold text-gray-900">94%</span>
            <span className="text-xs text-gray-500 font-medium">Completion</span>
          </div>
        </div>

        <div className="px-4 space-y-6 pt-4">
          {/* Vehicle Info */}
          <section>
            <h3 className="font-bold text-gray-900 mb-3 px-1">Vehicle Details</h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-900">Honda CB150</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">GH-2847-22 · 2021 · Black</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🏍️</span>
                </div>
              </div>
              <button className="w-full text-sm font-bold text-[#0D6B4A] py-2 border border-green-100 rounded-xl hover:bg-green-50 transition-colors">
                Edit Details
              </button>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="font-bold text-gray-900 mb-3 px-1">Documents</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "National ID", status: "Verified", icon: CheckCircle2, color: "text-[#0D6B4A]", bg: "bg-green-50" },
                { name: "Driver's License", status: "Verified", icon: CheckCircle2, color: "text-[#0D6B4A]", bg: "bg-green-50" },
                { name: "Vehicle Reg", status: "Pending", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                { name: "Insurance", status: "Expired", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", action: "Renew" },
              ].map((doc, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-3", doc.bg)}>
                    <doc.icon className={cn("w-4 h-4", doc.color)} />
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">{doc.name}</div>
                  {doc.action ? (
                    <div className="flex items-center gap-2 mt-auto pt-2">
                      <span className={cn("text-xs font-bold", doc.color)}>{doc.status}</span>
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">{doc.action}</span>
                    </div>
                  ) : (
                    <div className={cn("text-xs font-bold mt-auto pt-2", doc.color)}>{doc.status}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Settings List */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {[
              { label: "Notification Settings", icon: Settings },
              { label: "Payout Settings", icon: PieChart },
              { label: "Help Center", icon: HelpCircle },
              { label: "Privacy Policy", icon: Shield },
              { label: "Logout", icon: LogOut, danger: true },
            ].map((item, i, arr) => (
              <button key={i} className={cn(
                "w-full flex items-center justify-between p-4 bg-white active:bg-gray-50 transition-colors text-left",
                i !== arr.length - 1 && "border-b border-gray-50"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    item.danger ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    item.danger ? "text-red-600" : "text-gray-900"
                  )}>{item.label}</span>
                </div>
                {!item.danger && <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
            ))}
          </section>
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
        <button className="flex flex-col items-center gap-1 w-16 text-gray-400">
          <PieChart className="w-6 h-6" />
          <span className="text-[10px] font-medium">Earnings</span>
        </button>
        <button className="flex flex-col items-center gap-1 w-16 text-[#0D6B4A]">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
