import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileScreenShell } from '../_shared/mobile-screen-shell';
import { MobileStatusBar } from '../_shared/mobile-status-bar';

export default function Splash() {
  const [page, setPage] = useState(0);

  const nextPage = () => {
    if (page < 2) setPage(page + 1);
  };

  if (page === 0) {
    return (
      <MobileScreenShell className="bg-[#0D6B4A] text-white flex flex-col">
        <MobileStatusBar tone="light" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-lg">
            <span className="text-[#0D6B4A] text-4xl font-bold italic">O</span>
          </div>
          <h1 className="text-[32px] font-bold mb-2">OkadaGo</h1>
          <p className="text-[16px] text-green-100">Your city, your speed</p>
        </div>
        <div className="p-6 pb-10">
          <Button 
            className="w-full bg-white text-[#0D6B4A] hover:bg-gray-100 active:scale-[0.99] transition-all h-14 rounded-full text-[16px] font-bold shadow-md"
            onClick={nextPage}
          >
            Get Started
          </Button>
        </div>
      </MobileScreenShell>
    );
  }

  return (
    <MobileScreenShell className="bg-white text-gray-900 flex flex-col">
      <div className="text-gray-900">
        <MobileStatusBar />
      </div>
      
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {page === 1 ? (
            <>
              <div className="w-64 h-64 bg-green-50 rounded-full flex items-center justify-center mb-10 text-[#0D6B4A]">
                <Zap size={80} strokeWidth={1.5} />
              </div>
              <h2 className="text-[28px] font-bold mb-4 text-[#0D6B4A]">Book in seconds</h2>
              <p className="text-[16px] text-gray-600 px-4">
                Get a ride whenever you need it. Our drivers are always nearby.
              </p>
            </>
          ) : (
            <>
              <div className="w-64 h-64 bg-amber-50 rounded-full flex items-center justify-center mb-10 text-[#FFB800]">
                <ShieldCheck size={80} strokeWidth={1.5} />
              </div>
              <h2 className="text-[28px] font-bold mb-4 text-[#0D6B4A]">Ride with confidence</h2>
              <p className="text-[16px] text-gray-600 px-4">
                Verified drivers and real-time tracking for your peace of mind.
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-8 pb-4">
          <div className="flex gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${page === 1 ? 'bg-[#0D6B4A]' : 'bg-gray-200'}`} />
            <div className={`w-2.5 h-2.5 rounded-full ${page === 2 ? 'bg-[#0D6B4A]' : 'bg-gray-200'}`} />
          </div>
          <Button 
            className="w-full bg-[#0D6B4A] text-white hover:bg-[#0a5239] active:scale-[0.99] transition-all h-14 rounded-full text-[16px] font-bold shadow-md"
            onClick={nextPage}
          >
            {page === 2 ? 'Continue' : 'Next'}
          </Button>
        </div>
      </div>
    </MobileScreenShell>
  );
}
