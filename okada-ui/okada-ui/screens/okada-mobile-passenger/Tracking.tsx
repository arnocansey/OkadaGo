import React from 'react';
import { Phone, MessageCircle, Share2, Bike, Star, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Tracking() {
  const StatusBar = () => (
    <div className="flex justify-between items-center px-4 py-2 text-xs font-medium w-full text-gray-900 absolute top-0 z-50">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-3 bg-current rounded-sm"></div>
        <div className="w-3 h-3 bg-current rounded-full"></div>
        <div className="w-5 h-2.5 border border-current rounded-sm"></div>
      </div>
    </div>
  );

  return (
    <div className="w-[390px] h-[844px] bg-gray-900 flex flex-col relative overflow-hidden font-sans">
      <StatusBar />

      {/* Map Background (Dark Mode) */}
      <div className="absolute inset-0 bg-[#1e293b]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Animated Route Line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 844">
          <path d="M 200 350 C 220 400, 150 450, 180 500" fill="none" stroke="#0D6B4A" strokeWidth="6" className="opacity-80 drop-shadow-md" />
          <path d="M 200 350 C 220 400, 150 450, 180 500" fill="none" stroke="#22c55e" strokeWidth="2" />
        </svg>

        {/* User Location */}
        <div className="absolute top-[485px] left-[165px]">
          <div className="w-8 h-8 bg-[#0D6B4A]/30 rounded-full flex items-center justify-center animate-ping"></div>
          <div className="w-4 h-4 bg-[#0D6B4A] border-2 border-white rounded-full absolute top-2 left-2 shadow-lg"></div>
        </div>

        {/* Rider Location */}
        <div className="absolute top-[335px] left-[185px] flex flex-col items-center">
          <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center mb-1 border-2 border-[#FFB800]">
            <Bike className="text-[#FFB800]" size={20} />
          </div>
        </div>
      </div>

      {/* Top Floating UI */}
      <div className="absolute top-12 left-4 right-4 z-20 flex items-start justify-between">
        <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-900">
          <Menu size={24} />
        </button>
        <div className="bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-2 bg-[#0D6B4A] rounded-full animate-pulse" />
          <span className="text-[16px] font-bold text-gray-900">Kwame arriving in 4 min</span>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-30 pt-4 pb-8 px-5 flex flex-col h-[350px]">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-[#0D6B4A] text-xl font-bold border border-green-200">
                KA
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <div className="bg-[#FFB800] rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                  <span className="text-[10px] font-bold text-gray-900">4.8</span>
                  <Star size={10} className="fill-gray-900 text-gray-900" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-gray-900 leading-tight">Kwame A.</h2>
              <p className="text-[14px] text-gray-500 flex items-center gap-1 mt-1">
                <Bike size={14} /> Honda CB150 · GH-2847-22
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-3 mb-6 border border-amber-100 flex items-center justify-between">
          <div className="text-[14px] font-bold text-amber-900">Rider is on the way</div>
          <div className="text-[12px] font-medium text-amber-700 bg-amber-200/50 px-2 py-1 rounded-full">OkadaGo</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 text-gray-900 font-medium text-[14px]">
            <Phone size={18} /> Call
          </button>
          <button className="flex-1 h-12 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center gap-2 text-[#0D6B4A] font-medium text-[14px]">
            <MessageCircle size={18} /> Chat
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-900">
            <Share2 size={18} />
          </button>
        </div>

        <div className="mt-auto flex justify-center">
          <button className="text-red-500 font-medium text-[14px] px-4 py-2 rounded-full hover:bg-red-50">
            Cancel ride
          </button>
        </div>
      </div>
    </div>
  );
}
