import React from 'react';
import { Check, Star, Navigation2, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TripComplete() {
  const StatusBar = () => (
    <div className="flex justify-between items-center px-4 py-2 text-xs font-medium w-full text-gray-900 bg-white">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <div className="w-4 h-3 bg-current rounded-sm"></div>
        <div className="w-3 h-3 bg-current rounded-full"></div>
        <div className="w-5 h-2.5 border border-current rounded-sm"></div>
      </div>
    </div>
  );

  return (
    <div className="w-[390px] h-[844px] bg-white flex flex-col relative overflow-hidden font-sans">
      <StatusBar />
      
      {/* AppBar */}
      <div className="bg-white px-4 py-3 flex items-center justify-between h-[56px] border-b border-gray-100">
        <div className="w-10"></div>
        <h1 className="text-gray-900 text-[18px] font-bold">Trip complete</h1>
        <button className="w-10 h-10 flex items-center justify-center text-gray-500">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Success Header */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <div className="w-14 h-14 bg-[#0D6B4A] rounded-full flex items-center justify-center shadow-lg">
              <Check size={32} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <div className="text-[32px] font-bold text-gray-900 mb-1">₵22.00</div>
          <div className="text-[16px] text-gray-500 flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-sm flex items-center justify-center text-[8px] font-bold text-black">MoMo</div>
            <span>Paid via MTN MoMo</span>
          </div>
        </div>

        {/* Trip Summary Card */}
        <div className="px-5 mb-8">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} /> <span className="text-[14px] font-medium">12 min</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Navigation2 size={16} /> <span className="text-[14px] font-medium">8.3 km</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 relative">
              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-300"></div>
              
              <div className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 bg-[#0D6B4A] rounded-full mt-1 border-2 border-white z-10" />
                <div className="flex-1">
                  <div className="text-[14px] text-gray-500 mb-0.5">Pickup</div>
                  <div className="text-[16px] font-medium text-gray-900">Ring Road Central</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-3.5 h-3.5 bg-red-500 rounded-full mt-1 border-2 border-white z-10" />
                <div className="flex-1">
                  <div className="text-[14px] text-gray-500 mb-0.5">Dropoff</div>
                  <div className="text-[16px] font-medium text-gray-900">Kotoka Airport</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="px-5 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-[#0D6B4A] text-2xl font-bold mb-3">
            KA
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-1">Rate Kwame A.</h2>
          <p className="text-[14px] text-gray-500 mb-6">How was your ride?</p>
          
          <div className="flex gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={40} 
                className={star <= 4 ? "fill-[#FFB800] text-[#FFB800]" : "fill-gray-100 text-gray-200"} 
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <span className="bg-[#0D6B4A] text-white px-4 py-2 rounded-full text-[14px] font-medium shadow-sm">Great driver</span>
            <span className="bg-[#0D6B4A] text-white px-4 py-2 rounded-full text-[14px] font-medium shadow-sm">Safe riding</span>
            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-[14px] font-medium border border-gray-200">On time</span>
            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-[14px] font-medium border border-gray-200">Clean bike</span>
          </div>

          <textarea 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-[14px] text-gray-900 focus:outline-none focus:border-[#0D6B4A] focus:ring-1 focus:ring-[#0D6B4A]"
            placeholder="Add a comment (optional)"
            rows={2}
          ></textarea>
        </div>
      </div>

      <div className="p-5 border-t border-gray-100 bg-white mt-auto">
        <Button className="w-full bg-[#0D6B4A] text-white hover:bg-[#0a5239] h-14 rounded-full text-[16px] font-bold shadow-md mb-3">
          Submit Rating
        </Button>
        <Button variant="ghost" className="w-full text-gray-500 font-medium h-12 rounded-full">
          Skip
        </Button>
      </div>
    </div>
  );
}
