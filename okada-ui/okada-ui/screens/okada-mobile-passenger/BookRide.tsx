import React from "react";
import { ArrowLeft, Bike, Car, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileScreenShell } from "../_shared/mobile-screen-shell";
import { MobileStatusBar } from "../_shared/mobile-status-bar";

export default function BookRide() {
  return (
    <MobileScreenShell className="bg-gray-100 flex flex-col">
      <MobileStatusBar tone="light" className="bg-[#0D6B4A]" />

      <div className="bg-[#0D6B4A] px-2 py-3 flex items-center shadow-sm z-10 h-[56px]">
        <button className="w-12 h-12 flex items-center justify-center text-white rounded-xl hover:bg-white/10 active:scale-[0.98] transition-all">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-[20px] font-medium ml-2">Select ride</h1>
      </div>

      <div className="h-[45%] w-full bg-[#e5e7eb] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(#0D6B4A 1px, transparent 1px), linear-gradient(90deg, #0D6B4A 1px, transparent 1px)",
            backgroundSize: "30px 30px"
          }}
        />

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 350">
          <path
            d="M 120 150 C 150 150, 180 200, 250 220"
            fill="none"
            stroke="#0D6B4A"
            strokeWidth="4"
            strokeDasharray="8 4"
            className="opacity-70"
          />
        </svg>

        <div className="absolute top-[135px] left-[105px] flex flex-col items-center">
          <div className="bg-white px-2 py-1 rounded shadow-sm text-[10px] font-bold mb-1 text-gray-800">4 min</div>
          <div className="w-6 h-6 bg-[#0D6B4A] rounded-full border-2 border-white shadow-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>

        <div className="absolute top-[205px] left-[235px]">
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="h-[55%] w-full bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 flex flex-col pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] px-5 absolute bottom-0">
        <div className="flex flex-col gap-4 mb-5 relative">
          <div className="absolute left-2.5 top-6 bottom-6 w-0.5 bg-gray-200" />

          <div className="flex items-center gap-4">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center z-10">
              <div className="w-2.5 h-2.5 bg-[#0D6B4A] rounded-full" />
            </div>
            <div className="flex-1 border-b border-gray-100 pb-3">
              <div className="text-[16px] font-medium text-gray-900">Ring Road Central, Accra</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center z-10">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="text-[16px] font-medium text-gray-900">Kotoka International Airport</div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-100 mb-5" />

        <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
          <button className="min-w-[110px] bg-green-50 border-2 border-[#0D6B4A] rounded-2xl p-3 flex flex-col relative text-left hover:bg-green-100 active:scale-[0.99] transition-all">
            <div className="absolute -top-2 -right-2 bg-[#FFB800] text-xs font-bold px-2 py-0.5 rounded-full text-gray-900">Fast</div>
            <Bike className="text-[#0D6B4A] mb-2" size={28} />
            <div className="text-[14px] font-bold text-gray-900">OkadaGo</div>
            <div className="text-[12px] text-gray-500 mb-1">4 min</div>
            <div className="text-[16px] font-bold text-[#0D6B4A]">₵22</div>
          </button>

          <button className="min-w-[110px] bg-white border border-gray-200 rounded-2xl p-3 flex flex-col text-left hover:bg-gray-50 active:scale-[0.99] transition-all">
            <Car className="text-gray-600 mb-2" size={28} />
            <div className="text-[14px] font-bold text-gray-900">OkadaX</div>
            <div className="text-[12px] text-gray-500 mb-1">3 min</div>
            <div className="text-[16px] font-bold text-gray-900">₵35</div>
          </button>

          <button className="min-w-[110px] bg-white border border-gray-200 rounded-2xl p-3 flex flex-col text-left hover:bg-gray-50 active:scale-[0.99] transition-all">
            <Users className="text-gray-600 mb-2" size={28} />
            <div className="text-[14px] font-bold text-gray-900">OkadaPool</div>
            <div className="text-[12px] text-gray-500 mb-1">7 min</div>
            <div className="text-[16px] font-bold text-gray-900">₵15</div>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">MoMo</div>
              <span className="text-[14px] font-medium text-gray-900">MTN MoMo</span>
            </div>
            <button className="text-[14px] font-medium text-[#0D6B4A] hover:underline">Change</button>
          </div>

          <Button className="w-full bg-[#0D6B4A] text-white hover:bg-[#0a5239] active:scale-[0.99] h-14 rounded-full text-[16px] font-bold shadow-md flex justify-between px-6 transition-all">
            <span>Book OkadaGo</span>
            <span>₵22.00</span>
          </Button>
        </div>
      </div>
    </MobileScreenShell>
  );
}
