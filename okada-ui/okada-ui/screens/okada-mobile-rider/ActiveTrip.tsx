import React from 'react';
import { MessageCircle, Share2, ShieldAlert } from 'lucide-react';
import { MobileScreenShell } from '../_shared/mobile-screen-shell';
import { MobileStatusBar } from '../_shared/mobile-status-bar';

export function ActiveTrip() {
  return (
    <MobileScreenShell className="bg-[#1A231E] shadow-xl">
      <MobileStatusBar tone="light" className="absolute top-0 px-6 text-sm" />

      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#1A231E] opacity-90" />
        <svg className="w-full h-full opacity-30" viewBox="0 0 390 844" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50 300 L200 450 L300 100 L450 150" stroke="#3A4D43" strokeWidth="8" strokeLinecap="round" />
          <path d="M100 800 L200 450" stroke="#3A4D43" strokeWidth="12" strokeLinecap="round" />
        </svg>
        <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 390 844" fill="none">
          <path d="M150 600 L200 450 L300 100" stroke="#FFB800" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" />
          <path d="M150 600 L200 450 L300 100" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="absolute top-[600px] left-[150px] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="absolute inset-0 bg-[#FFB800] rounded-full animate-ping opacity-30 scale-150" />
          <div className="w-8 h-8 bg-[#FFB800] border-2 border-white rounded-full shadow-lg relative z-10" />
        </div>
        <div className="absolute top-[100px] left-[300px] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg" />
        </div>
      </div>

      <div className="absolute top-11 left-0 right-0 z-40 px-4">
        <div className="bg-[#0D6B4A] rounded-full text-white px-5 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            <span className="font-bold text-sm">Trip in progress</span>
          </div>
          <span className="font-mono font-bold text-green-100">08:42</span>
        </div>
      </div>

      <div className="absolute top-28 left-4 right-4 z-30">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Heading to</div>
          <h2 className="text-xl font-bold text-gray-900 truncate">Kotoka International Airport</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-amber-100 text-amber-800 text-sm font-bold px-2 py-0.5 rounded">6 min</span>
            <span className="text-gray-500 text-sm font-medium">3.2 km remaining</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-40 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-5" />

        <div className="px-6 flex flex-col gap-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">AO</div>
              <div>
                <div className="font-bold text-gray-900 text-sm">Ama Owusu</div>
                <div className="text-xs text-gray-500 font-medium">4.9 ★</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium mb-0.5">FIXED FARE</div>
              <div className="font-black text-xl text-gray-900">₵38.00</div>
            </div>
          </div>

          <div className="flex justify-between gap-3">
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all rounded-xl py-3 flex flex-col items-center justify-center gap-1">
              <Share2 className="w-5 h-5 text-gray-700" />
              <span className="text-xs font-semibold text-gray-700">Share</span>
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all rounded-xl py-3 flex flex-col items-center justify-center gap-1">
              <MessageCircle className="w-5 h-5 text-gray-700" />
              <span className="text-xs font-semibold text-gray-700">Chat</span>
            </button>
            <button className="flex-1 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all rounded-xl py-3 flex flex-col items-center justify-center gap-1">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <span className="text-xs font-semibold text-red-600">SOS</span>
            </button>
          </div>

          <button className="w-full bg-[#0D6B4A] hover:bg-[#0a5238] text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
            End Trip
          </button>
        </div>
      </div>
    </MobileScreenShell>
  );
}
