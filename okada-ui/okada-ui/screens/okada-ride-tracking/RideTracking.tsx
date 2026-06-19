import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageSquare, ShieldAlert, X, Navigation, Share2, Star, Bike, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function RideTracking() {
  const [eta] = useState('6 min');
  
  return (
    <div className="flex h-screen bg-[#111315] font-sans overflow-hidden text-slate-100">
      
      {/* Top Mobile-style header for desktop mapping context */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none flex items-start p-6">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto cursor-pointer hover:bg-black/60 transition-colors">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium tracking-wide">Live Ride Tracking</span>
        </div>
      </div>

      {/* Main Map Area (65%) */}
      <div className="flex-1 relative border-r border-white/10">
        {/* Faux Map Background - Dark Theme */}
        <div className="absolute inset-0 bg-[#0A0B0C]">
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-dark" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2A2F35" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dark)" />
            {/* Dark mode roads */}
            <path d="M-100 300 Q 400 200 600 500 T 1400 400" fill="none" stroke="#2A2F35" strokeWidth="12" />
            <path d="M-100 300 Q 400 200 600 500 T 1400 400" fill="none" stroke="#1A1C1E" strokeWidth="8" />
            
            <path d="M300 -100 Q 350 400 500 600 T 900 1200" fill="none" stroke="#2A2F35" strokeWidth="16" />
            <path d="M300 -100 Q 350 400 500 600 T 900 1200" fill="none" stroke="#1A1C1E" strokeWidth="10" />
            
            <path d="M700 -100 L 600 1200" fill="none" stroke="#2A2F35" strokeWidth="6" />
          </svg>
        </div>

        {/* Route Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Active Route Path */}
          <svg className="absolute inset-0 w-full h-full">
            <path 
              d="M 600 500 T 1100 450" 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="6" 
              className="opacity-80"
            />
            <path 
              d="M 350 400 Q 500 600 600 500" 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="6" 
              strokeDasharray="12, 12"
              className="opacity-50 animate-[dash_30s_linear_infinite]"
            />
          </svg>

          {/* Pickup Point */}
          <div className="absolute top-[400px] left-[350px] -translate-x-1/2 -translate-y-1/2">
            <div className="bg-[#1A1C1E] text-white text-xs px-2 py-1 rounded shadow-lg mb-1 whitespace-nowrap opacity-80 border border-white/10">Pickup</div>
            <div className="w-5 h-5 bg-primary rounded-full border-4 border-[#0A0B0C]" />
          </div>

          {/* Dropoff Point */}
          <div className="absolute top-[450px] left-[1100px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="bg-[#1A1C1E] text-white text-xs px-2 py-1 rounded shadow-lg mb-1 whitespace-nowrap border border-white/10">Dropoff</div>
            <div className="w-5 h-5 bg-accent rounded-sm border-4 border-[#0A0B0C]" />
          </div>

          {/* Live Rider Position */}
          <div className="absolute top-[500px] left-[600px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
            <div className="bg-primary text-primary-foreground font-bold text-sm px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] mb-3 flex items-center gap-2 border border-white/20">
              <span>{eta}</span>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-primary relative z-10">
                <Bike className="w-7 h-7 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel (35%) */}
      <div className="w-[420px] bg-[#16181A] flex flex-col flex-none shadow-[-10px_0_30px_rgba(0,0,0,0.3)] z-10 relative">
        
        {/* Status Header */}
        <div className="bg-primary px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-primary-foreground/80 text-sm font-medium mb-1">Status</div>
            <h2 className="text-xl font-bold text-white tracking-tight">Rider is arriving</h2>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <span className="text-white font-bold">{eta}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Rider Profile Card */}
          <div className="bg-[#1C1F22] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-0" />
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-[#1C1F22] shadow-xl">
                    <AvatarFallback className="bg-slate-800 text-lg">KA</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-black border border-white/10 rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-lg">
                    <Star className="w-3 h-3 fill-accent text-accent" />
                    <span className="text-xs font-bold text-white">4.8</span>
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl font-bold text-white">Kwame A.</h3>
                  <div className="text-sm text-slate-400 mt-0.5">1,402 Trips · 2.5 Years</div>
                </div>
              </div>
            </div>

            <Separator className="my-5 bg-white/10" />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-300">Honda CB150</div>
                <div className="text-xs text-slate-500 mt-1">Deep Blue</div>
              </div>
              <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-lg">
                <span className="font-mono font-bold text-lg text-white tracking-widest">GH-2847</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-[#1C1F22] border-white/10 hover:bg-[#2A2F35] hover:text-white h-14 text-white">
              <Phone className="w-5 h-5 mr-2" />
              Call
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white h-14">
              <MessageSquare className="w-5 h-5 mr-2" />
              Chat
            </Button>
          </div>

          {/* Trip Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Trip Details</h3>
            
            <div className="bg-[#1C1F22] border border-white/10 rounded-2xl p-5 space-y-6">
              
              {/* Timeline */}
              <div className="relative pl-6 space-y-6 border-l-2 border-white/10 ml-3">
                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 bg-primary rounded-full border-4 border-[#1C1F22]" />
                  <div className="text-sm font-medium text-white -mt-1">Pickup Location</div>
                  <div className="text-xs text-slate-400 mt-1">Kotoka International Airport, Terminal 3</div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[31px] w-4 h-4 bg-accent rounded-sm border-4 border-[#1C1F22]" />
                  <div className="text-sm font-medium text-white -mt-1">Destination</div>
                  <div className="text-xs text-slate-400 mt-1">Osu Oxford Street, Accra</div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">Estimated Fare</div>
                  <div className="font-bold text-white text-lg mt-0.5">₵ 35.00</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Payment</div>
                  <div className="font-medium text-white text-sm mt-0.5">Wallet</div>
                </div>
              </div>

            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-3 pt-4">
            <Button variant="outline" className="w-full justify-start h-14 bg-transparent border-white/10 hover:bg-white/5 text-white">
              <Share2 className="w-5 h-5 mr-3 text-slate-400" />
              Share Ride Status
            </Button>
            <Button variant="outline" className="w-full justify-start h-14 bg-transparent border-white/10 hover:bg-white/5 text-white">
              <ShieldAlert className="w-5 h-5 mr-3 text-slate-400" />
              Safety & Support
            </Button>
            <Button variant="ghost" className="w-full h-14 text-destructive hover:text-destructive hover:bg-destructive/10 mt-2">
              Cancel Ride
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
