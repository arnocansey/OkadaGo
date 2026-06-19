import React from 'react';
import { Bell, MapPin, Search, Home as HomeIcon, Briefcase, Clock, Navigation } from 'lucide-react';
import { MobileScreenShell } from '../_shared/mobile-screen-shell';
import { MobileStatusBar } from '../_shared/mobile-status-bar';

export default function Home() {
  return (
    <MobileScreenShell className="bg-gray-100 flex flex-col">
      <MobileStatusBar tone="light" className="bg-[#0D6B4A]" />
      
      {/* AppBar */}
      <div className="bg-[#0D6B4A] px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            AO
          </div>
          <div>
            <h1 className="text-white text-[16px] font-medium leading-tight">Good morning, Ama</h1>
            <div className="flex items-center gap-1 text-green-100 text-xs mt-0.5 bg-white/10 w-fit px-2 py-0.5 rounded-full">
              <MapPin size={10} />
              <span>Accra, GH</span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-[0.98] transition-all">
          <Bell size={20} />
        </button>
      </div>

      {/* Map Area */}
      <div className="absolute top-[88px] left-0 right-0 bottom-0 bg-[#e5e7eb] overflow-hidden">
        {/* Fake Map Grid */}
        <div className="w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(#0D6B4A 1px, transparent 1px), linear-gradient(90deg, #0D6B4A 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* User Location Pin */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-md" />
          </div>
        </div>

        {/* Rider Pins */}
        <div className="absolute top-[25%] left-[30%]">
          <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-3 h-3 bg-[#FFB800] rounded-full" />
          </div>
        </div>
        <div className="absolute top-[40%] left-[70%]">
          <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-3 h-3 bg-[#FFB800] rounded-full" />
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="absolute bottom-[calc(15.5rem+env(safe-area-inset-bottom))] right-4 w-14 h-14 bg-[#0D6B4A] rounded-2xl shadow-lg flex items-center justify-center text-white z-20 hover:bg-[#0b5c40] active:scale-[0.98] transition-all">
        <Navigation size={24} className="fill-current" />
      </button>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30 pt-3 pb-[max(2rem,env(safe-area-inset-bottom))] px-5 flex flex-col h-[min(260px,42dvh)]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-5" />
        
        <div className="bg-gray-100 rounded-2xl p-4 flex items-center gap-3 mb-4 shadow-sm">
          <Search className="text-[#0D6B4A]" size={20} />
          <span className="text-gray-500 text-[16px] font-medium flex-1">Where to?</span>
        </div>

        <div className="flex gap-3 mb-5">
          <button className="flex-1 bg-green-50 rounded-full py-2.5 flex items-center justify-center gap-2 text-[#0D6B4A] text-[14px] font-medium border border-green-100 hover:bg-green-100 active:scale-[0.99] transition-all">
            <HomeIcon size={16} /> Home
          </button>
          <button className="flex-1 bg-gray-50 rounded-full py-2.5 flex items-center justify-center gap-2 text-gray-700 text-[14px] font-medium border border-gray-200 hover:bg-gray-100 active:scale-[0.99] transition-all">
            <Briefcase size={16} /> Work
          </button>
        </div>

        <h3 className="text-[14px] font-bold text-gray-900 mb-3 px-1">Recent</h3>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 px-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <Clock size={16} />
            </div>
            <div className="flex-1 border-b border-gray-100 pb-3">
              <div className="text-[16px] font-medium text-gray-900">Accra Mall</div>
              <div className="text-[12px] text-gray-500">Tetteh Quarshie Interchange</div>
            </div>
          </div>
        </div>
      </div>
    </MobileScreenShell>
  );
}
