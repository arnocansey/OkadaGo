import React from 'react';
import { Phone, MessageCircle, MapPin, Navigation2, Menu } from 'lucide-react';
import { MobileScreenShell } from '../_shared/mobile-screen-shell';
import { MobileStatusBar } from '../_shared/mobile-status-bar';

export function Navigation() {
  return (
    <MobileScreenShell className="bg-[#1A231E] shadow-xl">
      <MobileStatusBar tone="light" className="absolute top-0 px-6 text-sm" />

      {/* Map Background Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#1A231E] opacity-90"></div>
        {/* Fake streets */}
        <svg className="w-full h-full opacity-30" viewBox="0 0 390 844" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50 200 L400 350 M100 -50 L150 900 M300 -50 L250 900 M-50 600 L400 500" stroke="#3A4D43" strokeWidth="8" strokeLinecap="round"/>
          <path d="M-50 400 L400 450" stroke="#3A4D43" strokeWidth="12" strokeLinecap="round"/>
        </svg>
        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 390 844" fill="none">
          <path d="M195 600 L195 500 L250 450 L250 350 L150 250" stroke="#0D6B4A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="opacity-80"/>
          <path d="M195 600 L195 500 L250 450 L250 350 L150 250" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {/* Rider Marker */}
        <div className="absolute top-[600px] left-[195px] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#0D6B4A]">
            <Navigation2 className="w-6 h-6 text-[#0D6B4A] fill-[#0D6B4A] transform rotate-45" />
          </div>
        </div>
        {/* Destination Marker */}
        <div className="absolute top-[250px] left-[150px] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-8 h-8 bg-black rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Top Floating UI */}
      <div className="absolute top-12 left-4 right-4 z-30 flex flex-col gap-3">
        {/* Main Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Head to pickup</h1>
              <div className="text-[#0D6B4A] font-bold text-2xl mt-1">4 min</div>
            </div>
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 active:scale-[0.98] transition-all">
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <div className="text-gray-500 font-medium text-sm flex items-center gap-2">
            <span>2.1 km</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>Ama Owusu</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="truncate">Ring Road Central</span>
          </div>
        </div>

        {/* Next Turn Instruction */}
        <div className="bg-[#FFB800] rounded-xl shadow-md p-3 px-4 flex items-center gap-3">
          <Navigation2 className="w-6 h-6 text-amber-900 fill-amber-900 transform rotate-90" />
          <span className="font-bold text-amber-900 text-lg">Turn right onto Liberation Rd</span>
        </div>
      </div>

      {/* Recenter Button */}
      <button className="absolute bottom-[calc(9.5rem+env(safe-area-inset-bottom))] right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-30 hover:bg-gray-100 active:scale-[0.98] transition-all">
        <MapPin className="w-5 h-5 text-gray-700" />
      </button>

      {/* Bottom Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-40 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-5"></div>
        
        <div className="px-6 flex flex-col gap-5">
          {/* Passenger Info */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg relative">
                AO
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <div className="font-bold text-gray-900">Ama Owusu</div>
                <div className="text-sm text-gray-500 font-medium">Pickup point</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all">
                <MessageCircle className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-[#0D6B4A] hover:bg-green-200 active:scale-[0.98] transition-all">
                <Phone className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-[#0D6B4A] hover:bg-[#0b5c40] active:bg-[#0a5238] text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
            Arrived at pickup
          </button>
        </div>
      </div>
    </MobileScreenShell>
  );
}
