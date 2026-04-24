import React, { useState } from "react";
import { 
  BarChart3, 
  CreditCard, 
  DollarSign, 
  Download, 
  Filter, 
  Gift, 
  LayoutDashboard, 
  MapPin, 
  PieChart as PieChartIcon, 
  Search, 
  Settings, 
  ShieldAlert, 
  Ticket, 
  Users, 
  Wallet,
  Bell,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Edit,
  Trash2,
  Share2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// --- MOCK DATA ---
const revenueData = Array.from({ length: 30 }, (_, i) => ({
  date: `Oct ${i + 1}`,
  revenue: Math.floor(Math.random() * 5000) + 5000,
  commission: Math.floor(Math.random() * 1000) + 1000,
}));

const commissionData = [
  { name: 'Ride Fee', value: 70, color: '#0D6B4A' },
  { name: 'Platform', value: 20, color: '#FFB800' },
  { name: 'Insurance', value: 10, color: '#14b8a6' },
];

const transactions = [
  { id: "TRX-8291", passenger: "Kwame Mensah", rider: "Samuel Osei", fare: "₵ 45.00", commission: "₵ 9.00", net: "₵ 36.00", method: "MTN MoMo", status: "Completed", date: "Today, 14:30" },
  { id: "TRX-8290", passenger: "Abena Ofori", rider: "Kofi Annan", fare: "₵ 32.50", commission: "₵ 6.50", net: "₵ 26.00", method: "Card", status: "Completed", date: "Today, 14:15" },
  { id: "TRX-8289", passenger: "Chidi Eze", rider: "Emeka Okafor", fare: "₦ 2,500", commission: "₦ 500", net: "₦ 2,000", method: "Cash", status: "Pending", date: "Today, 14:00" },
  { id: "TRX-8288", passenger: "Fatima Ali", rider: "Oluwaseun Ade", fare: "₦ 3,200", commission: "₦ 640", net: "₦ 2,560", method: "Card", status: "Completed", date: "Today, 13:45" },
  { id: "TRX-8287", passenger: "Ama Serwaa", rider: "Yaw Boakye", fare: "₵ 28.00", commission: "₵ 5.60", net: "₵ 22.40", method: "MTN MoMo", status: "Failed", date: "Today, 13:30" },
  { id: "TRX-8286", passenger: "Ngozi Obi", rider: "Chinedu Uba", fare: "₦ 1,800", commission: "₦ 360", net: "₦ 1,440", method: "Cash", status: "Completed", date: "Today, 13:10" },
  { id: "TRX-8285", passenger: "Esi Cobbinah", rider: "Kwabena Yeboah", fare: "₵ 55.00", commission: "₵ 11.00", net: "₵ 44.00", method: "Card", status: "Completed", date: "Today, 12:55" },
  { id: "TRX-8284", passenger: "Tunde Bakare", rider: "Ibrahim Musa", fare: "₦ 4,500", commission: "₦ 900", net: "₦ 3,600", method: "Bank Transfer", status: "Completed", date: "Today, 12:40" },
  { id: "TRX-8283", passenger: "Akosua Addo", rider: "Emmanuel Kusi", fare: "₵ 22.00", commission: "₵ 4.40", net: "₵ 17.60", method: "MTN MoMo", status: "Completed", date: "Today, 12:20" },
  { id: "TRX-8282", passenger: "Zainab Bello", rider: "Suleiman Dauda", fare: "₦ 1,500", commission: "₦ 300", net: "₦ 1,200", method: "Cash", status: "Completed", date: "Today, 12:05" },
];

const payouts = [
  { id: "PO-001", rider: "Samuel Osei", amount: "₵ 450.00", method: "MTN MoMo", status: "Pending", date: "Oct 24, 2023" },
  { id: "PO-002", rider: "Emeka Okafor", amount: "₦ 25,000", method: "Bank Transfer", status: "Processing", date: "Oct 24, 2023" },
  { id: "PO-003", rider: "Kofi Annan", amount: "₵ 320.00", method: "MTN MoMo", status: "Completed", date: "Oct 23, 2023" },
  { id: "PO-004", rider: "Yaw Boakye", amount: "₵ 150.00", method: "Vodafone Cash", status: "Failed", date: "Oct 23, 2023" },
];

const withdrawals = [
  { id: "WR-092", rider: "Oluwaseun Ade", amount: "₦ 18,500", account: "GTBank **** 4921", date: "2 hours ago" },
  { id: "WR-093", rider: "Emmanuel Kusi", amount: "₵ 600.00", account: "MTN **** 8829", date: "3 hours ago" },
  { id: "WR-094", rider: "Chinedu Uba", amount: "₦ 42,000", account: "Access **** 1102", date: "5 hours ago" },
];

const promos = [
  { code: "NEWUSER50", type: "% Discount", value: "50%", limit: "1000", used: "842", expiry: "Dec 31, 2023", status: "Active" },
  { code: "LAGOSWEEKEND", type: "Fixed", value: "₦ 500", limit: "5000", used: "1205", expiry: "Oct 29, 2023", status: "Active" },
  { code: "ACCRAXPRESS", type: "% Discount", value: "20%", limit: "2000", used: "2000", expiry: "Oct 15, 2023", status: "Expired" },
  { code: "RAINYDAY", type: "Fixed", value: "₵ 5.00", limit: "Unlimited", used: "450", expiry: "Nov 30, 2023", status: "Active" },
  { code: "STUDENT23", type: "% Discount", value: "15%", limit: "10000", used: "8930", expiry: "Dec 31, 2023", status: "Active" },
  { code: "HOLIDAYRIDE", type: "Fixed", value: "₦ 1000", limit: "1000", used: "0", expiry: "Dec 25, 2023", status: "Scheduled" },
  { code: "FIRST5", type: "Fixed", value: "₵ 10.00", limit: "500", used: "500", expiry: "Sep 30, 2023", status: "Expired" },
  { code: "LOYALTYVIP", type: "% Discount", value: "30%", limit: "100", used: "42", expiry: "Jan 31, 2024", status: "Active" },
];

const campaigns = [
  { name: "Driver Refer a Driver", referrals: 450, conversions: 320, reward: "₵ 16,000", status: "Active" },
  { name: "Rider Invite Friends", referrals: 1247, conversions: 834, reward: "₵ 16,680", status: "Active" },
  { name: "Campus Ambassador", referrals: 890, conversions: 412, reward: "₦ 824,000", status: "Ending Soon" },
];

const campaignData = [
  { week: 'W1', referrals: 120, conversions: 80 },
  { week: 'W2', referrals: 250, conversions: 150 },
  { week: 'W3', referrals: 380, conversions: 290 },
  { week: 'W4', referrals: 497, conversions: 314 },
];

export function AdminPayments({
  initialTab = "overview",
}: {
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-[#0D1A10] text-slate-300 flex flex-col hidden md:flex h-full">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 rounded bg-[#0D6B4A] flex items-center justify-center mr-3">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-wide">OkadaGo<span className="text-[#FFB800]">Admin</span></span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-4">Main</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-colors">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-colors">
              <Users size={18} />
              <span>User Management</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-colors">
              <MapPin size={18} />
              <span>Ride Tracking</span>
            </a>
            
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Finance</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#0D6B4A]/20 text-[#0D6B4A] border-r-2 border-[#0D6B4A] font-medium">
              <Wallet size={18} className="text-[#0D6B4A]" />
              <span className="text-[#0D6B4A]">Payments & Promos</span>
            </a>
            
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">System</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-colors">
              <ShieldAlert size={18} />
              <span>Safety & Settings</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-semibold text-slate-800">Payments & Promotions</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input type="search" placeholder="Search transactions..." className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#0D6B4A]" />
            </div>
            <Button variant="ghost" size="icon" className="relative text-slate-500">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarFallback className="bg-[#0D6B4A] text-white text-xs">AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-700 leading-none">Admin User</p>
                <p className="text-xs text-slate-500 mt-1">Finance Lead</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-white border border-slate-200 p-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-[#0D6B4A] data-[state=active]:text-white">Overview</TabsTrigger>
                <TabsTrigger value="payouts" className="data-[state=active]:bg-[#0D6B4A] data-[state=active]:text-white">Rider Payouts</TabsTrigger>
                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#0D6B4A] data-[state=active]:text-white">Withdrawals</TabsTrigger>
                <TabsTrigger value="promos" className="data-[state=active]:bg-[#0D6B4A] data-[state=active]:text-white">Promo Codes</TabsTrigger>
                <TabsTrigger value="referrals" className="data-[state=active]:bg-[#0D6B4A] data-[state=active]:text-white">Referrals</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Select defaultValue="month">
                  <SelectTrigger className="w-[140px] bg-white border-slate-200">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-slate-200 text-slate-600">
                  <Download size={16} className="mr-2" /> Export
                </Button>
              </div>
            </div>

            {/* TAB: OVERVIEW */}
            <TabsContent value="overview" className="space-y-6 m-0">
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">₵284,600</h3>
                        <p className="text-xs text-slate-400 mt-1">₦22.8M Equivalent</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#0D6B4A]/10 flex items-center justify-center text-[#0D6B4A]">
                        <DollarSign size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <ArrowUpRight size={16} className="text-emerald-500 mr-1" />
                      <span className="text-emerald-500 font-medium">12.5%</span>
                      <span className="text-slate-500 ml-2">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Rider Payouts</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">₵198,000</h3>
                        <p className="text-xs text-slate-400 mt-1">70% of total</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Wallet size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <ArrowUpRight size={16} className="text-emerald-500 mr-1" />
                      <span className="text-emerald-500 font-medium">8.2%</span>
                      <span className="text-slate-500 ml-2">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Platform Commission</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">₵86,600</h3>
                        <p className="text-xs text-slate-400 mt-1">After insurance deduction</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#FFB800]/20 flex items-center justify-center text-amber-600">
                        <PieChartIcon size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <ArrowUpRight size={16} className="text-emerald-500 mr-1" />
                      <span className="text-emerald-500 font-medium">14.3%</span>
                      <span className="text-slate-500 ml-2">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Pending Withdrawals</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">₵12,400</h3>
                        <p className="text-xs text-slate-400 mt-1">142 requests</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                        <Clock size={20} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <span className="text-red-500 font-medium">Requires action</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-slate-200 shadow-sm lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-800 font-semibold">Revenue Trend</CardTitle>
                    <CardDescription>Daily revenue and platform commission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val: number) => `₵${val/1000}k`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`₵${value ?? 0}`, undefined]}
                          />
                          <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke="#0D6B4A" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="commission" name="Commission" stroke="#FFB800" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-800 font-semibold">Commission Breakdown</CardTitle>
                    <CardDescription>Distribution of gross fare</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center">
                    <div className="h-[220px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={commissionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {commissionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`${value ?? 0}%`, undefined]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full space-y-3 mt-4">
                      {commissionData.map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-slate-600">{item.name}</span>
                          </div>
                          <span className="font-semibold text-slate-800">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
                  <CardTitle className="text-lg text-slate-800 font-semibold">Recent Transactions</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600">
                    <Filter size={14} className="mr-2" /> Filter
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-medium text-slate-500">Transaction ID</TableHead>
                        <TableHead className="font-medium text-slate-500">Passenger / Rider</TableHead>
                        <TableHead className="font-medium text-slate-500">Fare</TableHead>
                        <TableHead className="font-medium text-slate-500">Commission</TableHead>
                        <TableHead className="font-medium text-slate-500">Net Payout</TableHead>
                        <TableHead className="font-medium text-slate-500">Method</TableHead>
                        <TableHead className="font-medium text-slate-500">Status</TableHead>
                        <TableHead className="font-medium text-slate-500">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((trx, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <TableCell className="font-medium text-slate-700">{trx.id}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-slate-800">{trx.passenger}</div>
                            <div className="text-xs text-slate-500">to {trx.rider}</div>
                          </TableCell>
                          <TableCell className="text-slate-700">{trx.fare}</TableCell>
                          <TableCell className="text-[#0D6B4A] font-medium">{trx.commission}</TableCell>
                          <TableCell className="text-slate-700">{trx.net}</TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{trx.method}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`
                              ${trx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                              ${trx.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                              ${trx.status === 'Failed' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''}
                            `} variant="secondary">
                              {trx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{trx.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="py-3 px-6 border-t border-slate-100 flex justify-center">
                    <Button variant="ghost" size="sm" className="text-[#0D6B4A]">View All Transactions</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: PAYOUTS */}
            <TabsContent value="payouts" className="space-y-6 m-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
                      <div>
                        <CardTitle className="text-lg text-slate-800 font-semibold">Payout Queue</CardTitle>
                        <CardDescription>Riders waiting for funds disbursement</CardDescription>
                      </div>
                      <Button className="bg-[#0D6B4A] hover:bg-[#0a5239] text-white h-9">
                        Process Batch (12)
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-medium text-slate-500">ID / Rider</TableHead>
                            <TableHead className="font-medium text-slate-500">Amount</TableHead>
                            <TableHead className="font-medium text-slate-500">Method</TableHead>
                            <TableHead className="font-medium text-slate-500">Status</TableHead>
                            <TableHead className="text-right font-medium text-slate-500">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payouts.map((po, idx) => (
                            <TableRow key={idx} className="border-b border-slate-100">
                              <TableCell>
                                <div className="font-medium text-slate-800">{po.rider}</div>
                                <div className="text-xs text-slate-500">{po.id}</div>
                              </TableCell>
                              <TableCell className="font-semibold text-slate-800">{po.amount}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <CreditCard size={14} /> {po.method}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`
                                  ${po.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                                  ${po.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                                  ${po.status === 'Processing' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}
                                  ${po.status === 'Failed' ? 'bg-red-100 text-red-700 hover:bg-red-100' : ''}
                                `} variant="secondary">
                                  {po.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {po.status === 'Pending' && (
                                  <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-slate-200">Hold</Button>
                                    <Button size="sm" className="h-7 text-xs bg-[#0D6B4A] hover:bg-[#0a5239]">Process</Button>
                                  </div>
                                )}
                                {po.status === 'Failed' && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">Retry</Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="border-red-200 shadow-sm bg-red-50/50">
                    <CardHeader className="pb-3 border-b border-red-100">
                      <CardTitle className="text-base text-red-800 font-semibold flex items-center gap-2">
                        <XCircle size={18} /> Failed Payouts (3)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="bg-white p-3 rounded-md border border-red-100 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-800 text-sm">Yaw Boakye</span>
                          <span className="font-semibold text-slate-800 text-sm">₵ 150.00</span>
                        </div>
                        <p className="text-xs text-red-600 mb-2">Error: Invalid MoMo number or network timeout.</p>
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" className="h-6 text-[10px] border-slate-200 px-2">Contact Rider</Button>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-md border border-red-100 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-slate-800 text-sm">Ngozi Obi</span>
                          <span className="font-semibold text-slate-800 text-sm">₦ 8,400</span>
                        </div>
                        <p className="text-xs text-red-600 mb-2">Error: Bank details rejected by payment gateway.</p>
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline" className="h-6 text-[10px] border-slate-200 px-2">Contact Rider</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: WITHDRAWALS */}
            <TabsContent value="withdrawals" className="space-y-6 m-0">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Pending Withdrawal Requests</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {withdrawals.map((wr, idx) => (
                  <Card key={idx} className="border-slate-200 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">{wr.id} • {wr.date}</div>
                          <h4 className="font-semibold text-slate-800">{wr.rider}</h4>
                        </div>
                        <div className="bg-slate-100 px-2 py-1 rounded text-lg font-bold text-slate-800">
                          {wr.amount}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-md p-3 mb-4 border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1">Destination Account</div>
                        <div className="font-medium text-slate-700 flex items-center gap-2">
                          <Wallet size={14} className="text-slate-400" />
                          {wr.account}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">Decline</Button>
                        <Button className="flex-1 bg-[#0D6B4A] hover:bg-[#0a5239] text-white">Approve</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB: PROMOS */}
            <TabsContent value="promos" className="space-y-6 m-0">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
                  <div>
                    <CardTitle className="text-lg text-slate-800 font-semibold">Promo Codes</CardTitle>
                    <CardDescription>Manage rider discounts and promotions</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-[#0D6B4A] hover:bg-[#0a5239] text-white h-9">
                        <Plus size={16} className="mr-2" /> Create Promo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create New Promo Code</DialogTitle>
                        <DialogDescription>Add a new promotional code for riders.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="code" className="text-right text-xs">Code</Label>
                          <Input id="code" defaultValue="NEWPROMO" className="col-span-3 uppercase" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type" className="text-right text-xs">Type</Label>
                          <Select defaultValue="percent">
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">% Discount</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="value" className="text-right text-xs">Value</Label>
                          <Input id="value" defaultValue="15" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="limit" className="text-right text-xs">Usage Limit</Label>
                          <Input id="limit" defaultValue="1000" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="expiry" className="text-right text-xs">Expiry</Label>
                          <Input id="expiry" type="date" className="col-span-3" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="bg-[#0D6B4A] hover:bg-[#0a5239]">Save Promo</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-medium text-slate-500">Code</TableHead>
                        <TableHead className="font-medium text-slate-500">Discount</TableHead>
                        <TableHead className="font-medium text-slate-500">Usage</TableHead>
                        <TableHead className="font-medium text-slate-500">Expiry</TableHead>
                        <TableHead className="font-medium text-slate-500">Status</TableHead>
                        <TableHead className="text-right font-medium text-slate-500">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promos.map((promo, idx) => (
                        <TableRow key={idx} className="border-b border-slate-100">
                          <TableCell>
                            <div className="font-bold text-slate-800 flex items-center gap-2">
                              <Ticket size={14} className="text-[#FFB800]" /> {promo.code}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-slate-700">{promo.value}</span>
                            <span className="text-xs text-slate-500 ml-1">({promo.type})</span>
                          </TableCell>
                          <TableCell>
                            <div className="w-full max-w-[120px]">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">{promo.used} used</span>
                                <span className="text-slate-400">{promo.limit === 'Unlimited' ? '∞' : promo.limit}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#0D6B4A]" 
                                  style={{ width: promo.limit === 'Unlimited' ? '30%' : `${(parseInt(promo.used) / parseInt(promo.limit)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">{promo.expiry}</TableCell>
                          <TableCell>
                            <Badge className={`
                              ${promo.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                              ${promo.status === 'Scheduled' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}
                              ${promo.status === 'Expired' ? 'bg-slate-100 text-slate-500 hover:bg-slate-100' : ''}
                            `} variant="secondary">
                              {promo.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><Edit size={14} /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: REFERRALS */}
            <TabsContent value="referrals" className="space-y-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200 shadow-sm bg-[#0D6B4A] text-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-white/80">Total Referrals</p>
                    <h3 className="text-3xl font-bold mt-1">2,587</h3>
                    <p className="text-xs text-white/70 mt-2">Across all active campaigns</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Total Converted</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">1,566</h3>
                    <p className="text-xs text-slate-400 mt-2">60.5% conversion rate</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Total Rewards Paid</p>
                    <h3 className="text-3xl font-bold text-[#FFB800] mt-1">₵32,680</h3>
                    <p className="text-xs text-slate-400 mt-2">+₦824,000 NGN</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-slate-200 shadow-sm lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-slate-100">
                    <CardTitle className="text-lg text-slate-800 font-semibold">Active Campaigns</CardTitle>
                    <Button size="sm" className="bg-[#0D6B4A] hover:bg-[#0a5239] text-white h-8">
                      <Plus size={14} className="mr-1" /> New Campaign
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-medium text-slate-500">Campaign Name</TableHead>
                          <TableHead className="font-medium text-slate-500">Referrals</TableHead>
                          <TableHead className="font-medium text-slate-500">Conversions</TableHead>
                          <TableHead className="font-medium text-slate-500">Rewards Given</TableHead>
                          <TableHead className="font-medium text-slate-500">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((camp, idx) => (
                          <TableRow key={idx} className="border-b border-slate-100">
                            <TableCell className="font-medium text-slate-800">{camp.name}</TableCell>
                            <TableCell className="text-slate-600">{camp.referrals}</TableCell>
                            <TableCell className="text-slate-600">{camp.conversions}</TableCell>
                            <TableCell className="font-medium text-[#0D6B4A]">{camp.reward}</TableCell>
                            <TableCell>
                              <Badge className={`
                                ${camp.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                                ${camp.status === 'Ending Soon' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                              `} variant="secondary">
                                {camp.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-slate-800 font-semibold">Performance (30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaignData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f8fafc' }}
                          />
                          <Bar dataKey="referrals" name="Total Referrals" fill="#0D6B4A" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="conversions" name="Conversions" fill="#FFB800" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default AdminPayments;
