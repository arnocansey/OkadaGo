import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Search, Bell, LayoutDashboard, Bike, Users, UserCircle, 
  CreditCard, Tag, ShieldAlert, Settings, FileText, ArrowUpRight, 
  ArrowDownRight, Check, X, MapPin, Activity, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const revenueData = [
  { name: 'Mon', revenue: 28000 },
  { name: 'Tue', revenue: 32000 },
  { name: 'Wed', revenue: 30500 },
  { name: 'Thu', revenue: 38000 },
  { name: 'Fri', revenue: 42000 },
  { name: 'Sat', revenue: 48000 },
  { name: 'Sun', revenue: 42600 },
];

const pieData = [
  { name: 'Completed', value: 78, color: '#10b981' },
  { name: 'Cancelled', value: 12, color: '#ef4444' },
  { name: 'In Progress', value: 10, color: '#f59e0b' },
];

const SidebarItem = ({ icon: Icon, label, active = false }: any) => (
  <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${active ? 'bg-primary-foreground/10 text-white font-medium' : 'text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-white'}`}>
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </a>
);

export function AdminDashboard() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-[#0D1A10] text-white">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center font-bold text-white">O</div>
          <span className="text-xl font-bold tracking-tight">OKADAGO<span className="text-accent">.</span></span>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
          <SidebarItem icon={Bike} label="Rides" />
          <SidebarItem icon={UserCircle} label="Riders" />
          <SidebarItem icon={Users} label="Passengers" />
          <SidebarItem icon={CreditCard} label="Payments" />
          <SidebarItem icon={Tag} label="Promotions" />
          <SidebarItem icon={ShieldAlert} label="Safety & Support" />
          <SidebarItem icon={FileText} label="Reports" />
          <SidebarItem icon={Settings} label="Settings" />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
          <div className="w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="w-full pl-9 bg-gray-50 border-gray-200 focus-visible:ring-accent" placeholder="Search rides, riders, or passengers..." />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hidden md:flex border-gray-200 text-gray-700 font-medium">
                Dispatch Ride
              </Button>
            </div>
            <div className="relative cursor-pointer">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                3
              </span>
            </div>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer">
              <div className="text-right hidden md:block">
                <div className="text-sm font-semibold text-gray-900">Sarah M.</div>
                <div className="text-xs text-gray-500">Super Admin</div>
              </div>
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">SM</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Operations Overview</h1>
            <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1.5 border border-gray-200 rounded-md shadow-sm">
              Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Trips</div>
                <div className="text-2xl font-bold text-gray-900">2,847</div>
                <div className="flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 12% vs yest
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Rides</div>
                <div className="text-2xl font-bold text-gray-900">124</div>
                <div className="flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 4% vs yest
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Riders</div>
                <div className="text-2xl font-bold text-gray-900">483</div>
                <div className="flex items-center text-xs font-medium text-gray-400">
                  <span className="mr-1">-</span> No change
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Today</div>
                <div className="text-2xl font-bold text-gray-900">₵42,600</div>
                <div className="flex items-center text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> 8% vs yest
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Approvals</div>
                <div className="text-2xl font-bold text-gray-900">8</div>
                <div className="flex items-center text-xs font-medium text-amber-600">
                  Needs review
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-gray-200 bg-red-50/50 border-red-100">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="text-xs font-medium text-red-600 uppercase tracking-wider">Open Complaints</div>
                <div className="text-2xl font-bold text-red-700">3</div>
                <div className="flex items-center text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Action req
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart */}
            <Card className="lg:col-span-2 shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">Revenue (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(value: number) => `₵${value/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₵${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }} activeDot={{ r: 6, fill: "var(--accent)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">Rides by Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Map Panel */}
            <Card className="lg:col-span-1 shadow-sm border-gray-200 overflow-hidden flex flex-col">
              <CardHeader className="pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900">Live Heatmap (Accra)</CardTitle>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Live</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative bg-[#E8F0EB]">
                {/* Mock Map Background */}
                <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #d1e0d7 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
                
                {/* Simulated Roads */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/60 transform -rotate-12" />
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/60 transform rotate-12" />
                
                {/* Active Dots */}
                <div className="absolute top-1/4 left-1/3 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
                <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-2/3 left-1/4 w-2 h-2 rounded-full bg-accent" />
                <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-accent" />
                
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded shadow-sm text-xs space-y-1">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Active Ride</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent" /> Available Rider</div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="lg:col-span-1 shadow-sm border-gray-200 flex flex-col">
              <CardHeader className="pb-3 border-b border-gray-100">
                <CardTitle className="text-base font-semibold text-gray-900">Top Riders (This Week)</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <div className="divide-y divide-gray-100">
                  {[
                    { rank: 1, name: 'Kwame Asante', trips: 142, rating: 4.9 },
                    { rank: 2, name: 'Emeka Okafor', trips: 138, rating: 4.8 },
                    { rank: 3, name: 'John Mensah', trips: 131, rating: 5.0 },
                    { rank: 4, name: 'Tunde Bakare', trips: 124, rating: 4.7 },
                    { rank: 5, name: 'Kofi Annan', trips: 119, rating: 4.9 },
                  ].map((rider) => (
                    <div key={rider.rank} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rider.rank === 1 ? 'bg-amber-100 text-amber-700' : rider.rank === 2 ? 'bg-gray-200 text-gray-700' : rider.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                          {rider.rank}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{rider.name}</div>
                          <div className="text-xs text-gray-500">★ {rider.rating} rating</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">{rider.trips}</div>
                        <div className="text-xs text-gray-500">trips</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="lg:col-span-1 shadow-sm border-gray-200 flex flex-col">
              <CardHeader className="pb-3 border-b border-gray-100 flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Pending Approvals</CardTitle>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">8 New</Badge>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto">
                <div className="divide-y divide-gray-100">
                  {[
                    { id: 'RD-0892', name: 'Abena Osei', city: 'Accra', time: '2h ago' },
                    { id: 'RD-0893', name: 'Chinedu Eze', city: 'Lagos', time: '3h ago' },
                    { id: 'RD-0894', name: 'Yaw Yeboah', city: 'Kumasi', time: '5h ago' },
                  ].map((pending) => (
                    <div key={pending.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-900">{pending.name}</div>
                          <div className="text-xs text-gray-500">{pending.id} • {pending.city}</div>
                        </div>
                        <div className="text-xs text-gray-400">{pending.time}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-white h-8 text-xs">
                          <Check className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-100 h-8 text-xs">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-100 text-center">
                  <Button variant="link" className="text-primary text-xs h-auto p-0 font-medium">
                    View all 8 pending applications →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
