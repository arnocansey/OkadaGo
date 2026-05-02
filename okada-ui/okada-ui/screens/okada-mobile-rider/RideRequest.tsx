import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { MobileScreenShell } from '../_shared/mobile-screen-shell';
import { MobileStatusBar } from '../_shared/mobile-status-bar';

export function RideRequest() {
  return (
    <MobileScreenShell className="bg-[#0D1A10]/80 flex flex-col items-center justify-center shadow-xl">
      <MobileStatusBar tone="light" className="absolute top-0 px-6 text-sm" />

      <div className="w-[85%] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        <div className="pt-6 pb-4 px-6 flex flex-col items-center">
          <h2 className="text-[#0D6B4A] font-extrabold text-xl mb-4 tracking-tight">New Ride Request</h2>

          <div className="relative w-20 h-20 flex items-center justify-center mb-2">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#f3f4f6" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#FFB800"
                strokeWidth="6"
                strokeDasharray="226"
                strokeDashoffset="60"
                strokeLinecap="round"
                className="transition-all duration-1000 linear"
              />
            </svg>
            <span className="text-2xl font-bold text-gray-900">11</span>
          </div>
        </div>

        <div className="h-px w-full bg-gray-100" />

        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">AO</div>
            <div>
              <div className="font-bold text-gray-900">Ama Owusu</div>
              <div className="flex items-center text-gray-500 text-sm font-medium mt-0.5">
                <Star className="w-3.5 h-3.5 fill-[#FFB800] text-[#FFB800] mr-1" />
                4.9 Rating
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50/50">
          <div className="flex gap-4 relative">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-[#0D6B4A]" />
              <div className="w-0.5 h-10 bg-gray-300 border-l border-dashed border-gray-400" />
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>

            <div className="flex-1 flex flex-col gap-5">
              <div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">PICKUP</div>
                <div className="font-semibold text-gray-900 text-sm">Ring Road Central, Accra</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">DROP-OFF</div>
                <div className="font-semibold text-gray-900 text-sm">Kotoka International Airport</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 shadow-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              8.3 km • ~14 min
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-center">
          <div className="bg-amber-50 rounded-xl px-6 py-3 border border-amber-100 flex flex-col items-center w-full">
            <span className="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">Estimated Fare</span>
            <span className="text-3xl font-black text-amber-600 tracking-tight">₵38.00</span>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
          <button className="w-full bg-[#0D6B4A] hover:bg-[#0a5238] active:scale-[0.98] transition-all text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-[#0D6B4A]/30">
            Accept Ride
          </button>
          <button className="w-full bg-white border-2 border-red-100 text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 active:scale-[0.98] transition-all">
            Decline
          </button>
        </div>
      </div>
    </MobileScreenShell>
  );
}
