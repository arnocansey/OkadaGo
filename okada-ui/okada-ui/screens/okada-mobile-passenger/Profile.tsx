import React from "react";
import { User, CreditCard, Shield, Settings, History, MapPin, Bell, LogOut, ChevronRight, Home, Map } from "lucide-react";
import { MobileScreenShell } from "../_shared/mobile-screen-shell";
import { MobileStatusBar } from "../_shared/mobile-status-bar";
import { MobileBottomNav } from "../_shared/mobile-bottom-nav";

export default function Profile() {
  const ListItem = ({ icon: Icon, title, isRed = false }: { icon: any; title: string; isRed?: boolean }) => (
    <div className="flex items-center px-5 py-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer">
      <div className={`mr-4 ${isRed ? "text-red-500" : "text-gray-500"}`}>
        <Icon size={24} />
      </div>
      <div className={`flex-1 text-[16px] font-medium ${isRed ? "text-red-500" : "text-gray-900"}`}>{title}</div>
      {!isRed ? <ChevronRight size={20} className="text-gray-400" /> : null}
    </div>
  );

  return (
    <MobileScreenShell className="bg-gray-50 flex flex-col">
      <MobileStatusBar tone="light" className="bg-[#0D6B4A]" />

      <div className="bg-[#0D6B4A] px-5 py-4 shadow-sm z-10 flex items-center">
        <h1 className="text-white text-[22px] font-bold">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <div className="bg-[#0D6B4A] px-5 pb-8 pt-4 flex items-center gap-4 text-white">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#0D6B4A] text-3xl font-bold shadow-md">AO</div>
          <div>
            <h2 className="text-[24px] font-bold leading-tight">Ama Owusu</h2>
            <p className="text-green-100 text-[14px] mb-1">+233 24 456 7890</p>
            <div className="bg-black/20 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[12px] font-medium">
              <span>4.9</span>
              <span className="text-[#FFB800]">★</span>
              <span className="opacity-80 ml-1">rating</span>
            </div>
          </div>
        </div>

        <div className="px-5 -mt-6 mb-6">
          <div className="bg-gradient-to-br from-[#0D6B4A] to-[#0a5239] rounded-2xl p-5 shadow-lg text-white border border-[#14835b]">
            <div className="text-green-100 text-[14px] font-medium mb-1">Wallet Balance</div>
            <div className="text-[32px] font-bold mb-5 leading-none">₵120.50</div>
            <div className="flex gap-3">
              <button className="flex-1 border border-white/30 bg-white/10 hover:bg-white/20 rounded-xl py-2.5 text-[14px] font-bold backdrop-blur-sm">Add Money</button>
              <button className="flex-1 border border-white/30 bg-white/10 hover:bg-white/20 rounded-xl py-2.5 text-[14px] font-bold backdrop-blur-sm">Send</button>
            </div>
          </div>
        </div>

        <div className="bg-white border-y border-gray-100 mb-2">
          <h3 className="px-5 py-3 text-[14px] font-bold text-gray-500 bg-gray-50 border-b border-gray-100">Account</h3>
          <ListItem icon={User} title="Edit Profile" />
          <ListItem icon={MapPin} title="Saved Places" />
          <ListItem icon={History} title="Ride History" />
          <ListItem icon={Bell} title="Notifications" />
        </div>

        <div className="bg-white border-y border-gray-100 mb-2">
          <h3 className="px-5 py-3 text-[14px] font-bold text-gray-500 bg-gray-50 border-b border-gray-100">Payments</h3>
          <ListItem icon={CreditCard} title="Payment Methods" />
          <ListItem icon={History} title="Transaction History" />
        </div>

        <div className="bg-white border-y border-gray-100 mb-2">
          <h3 className="px-5 py-3 text-[14px] font-bold text-gray-500 bg-gray-50 border-b border-gray-100">Safety</h3>
          <ListItem icon={Shield} title="Safety Settings" />
        </div>

        <div className="bg-white border-y border-gray-100 mb-8">
          <h3 className="px-5 py-3 text-[14px] font-bold text-gray-500 bg-gray-50 border-b border-gray-100">App</h3>
          <ListItem icon={Settings} title="Settings" />
          <ListItem icon={LogOut} title="Logout" isRed />
        </div>
      </div>

      <MobileBottomNav
        items={[
          { label: "Home", icon: Home },
          { label: "Trips", icon: Map },
          { label: "Profile", icon: User, active: true, highlightDot: true }
        ]}
      />
    </MobileScreenShell>
  );
}
