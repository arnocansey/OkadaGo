import React, { useState } from 'react';
import { Bell, Home, MapPin, Navigation, PieChart, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="w-[390px] h-[844px] bg-gray-50 flex flex-col relative overflow-hidden font-sans mx-auto border border-gray-200 shadow-xl">
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
      <div className="h-14 bg-white flex items-center justify-between px-4 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0D6B4A] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            O
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">OkadaGo</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-gray-700" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* Online Toggle */}
      <div className="px-4 py-4 bg-white z-10">
        <div className="w-full bg-gray-100 p-1 rounded-full flex relative">
          <div
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 shadow-sm",
              isOnline ? "left-1 bg-[#0D6B4A]" : "left-[calc(50%+3px)] bg-gray-400"
            )}
          />
          <button
            onClick={() => setIsOnline(true)}
            className={cn(
              "flex-1 py-3 text-sm font-bold z-10 transition-colors",
              isOnline ? "text-white" : "text-gray-500"
            )}
          >
            ONLINE
          </button>
          <button
            onClick={() => setIsOnline(false)}
            className={cn(
              "flex-1 py-3 text-sm font-bold z-10 transition-colors",
              !isOnline ? "text-white" : "text-gray-500"
            )}
          >
            OFFLINE
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-4 pt-2">
        {/* Earnings Card */}
        <div className="bg-gradient-to-br from-[#0D6B4A] to-[#0a5238] rounded-2xl p-5 text-white shadow-lg mb-6">
          <div className="text-white/80 text-sm font-medium mb-1">Today's Earnings</div>
          <div className="text-4xl font-bold mb-4">₵185.00</div>
          <div className="flex justify-between items-center pt-4 border-t border-white/20">
            <div>
              <div className="text-white/70 text-xs">Trips</div>
              <div className="font-bold text-lg">12</div>
            </div>
            <div>
              <div className="text-white/70 text-xs">Online</div>
              <div className="font-bold text-lg">4h 32m</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <span className="text-gray-500 text-xs font-medium mb-1">This Week</span>
            <span className="font-bold text-[#0D6B4A]">₵890</span>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <span className="text-gray-500 text-xs font-medium mb-1">Rating</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-gray-900">4.7</span>
              <span className="text-[#FFB800] text-xs">★</span>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <span className="text-gray-500 text-xs font-medium mb-1">Completion</span>
            <span className="font-bold text-gray-900">94%</span>
          </div>
        </div>

        {/* Empty State / Map Placeholder */}
        {isOnline && (
          <div className="bg-[#e8f3ef] rounded-2xl p-6 flex flex-col items-center justify-center text-center mb-6 border border-[#0D6B4A]/20 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0D6B4A] via-transparent to-transparent animate-pulse" />
            <div className="w-16 h-16 bg-[#0D6B4A]/10 rounded-full flex items-center justify-center mb-3 relative">
              <div className="absolute inset-0 rounded-full border-2 border-[#0D6B4A] animate-ping opacity-20" />
              <MapPin className="w-8 h-8 text-[#0D6B4A]" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">All clear</h3>
            <p className="text-sm text-gray-600">Waiting for a ride request...</p>
          </div>
        )}

        {/* Recent Trips */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">Recent Trips</h3>
            <button className="text-[#0D6B4A] text-sm font-medium">See All</button>
          </div>
          <div className="space-y-3">
            {[
              { dest: "Osu Oxford Street", fare: "₵24.00", time: "2h ago" },
              { dest: "Accra Mall", fare: "₵45.00", time: "4h ago" },
              { dest: "Legon Campus", fare: "₵32.00", time: "Yesterday" }
            ].map((trip, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{trip.dest}</div>
                    <div className="text-xs text-gray-500">{trip.time}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-bold text-gray-900">{trip.fare}</div>
                  <div className="flex items-center gap-1 text-[#0D6B4A] text-xs font-medium mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-5 pt-2 z-20">
        <button className="flex flex-col items-center gap-1 w-16 text-[#0D6B4A]">
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
        <button className="flex flex-col items-center gap-1 w-16 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
