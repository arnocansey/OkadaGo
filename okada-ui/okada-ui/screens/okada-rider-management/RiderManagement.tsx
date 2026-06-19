import React, { useState } from "react";
import { 
  BarChart3, 
  Settings, 
  Map, 
  Star, 
  FileText, 
  Motorbike, 
  UserCircle, 
  HelpCircle,
  Menu,
  Bell,
  ChevronDown,
  TrendingUp,
  CreditCard,
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  ShieldCheck,
  MoreVertical,
  LogOut
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Switch } from "../../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Progress } from "../../ui/progress";

// Simple mock chart component since recharts might not be fully configured in this sandbox
const EarningsChart = () => {
  const data = [
    { day: 'Mon', amount: 120, height: '40%' },
    { day: 'Tue', amount: 150, height: '50%' },
    { day: 'Wed', amount: 80, height: '25%' },
    { day: 'Thu', amount: 200, height: '70%' },
    { day: 'Fri', amount: 250, height: '85%' },
    { day: 'Sat', amount: 300, height: '100%' },
    { day: 'Sun', amount: 180, height: '60%' },
  ];

  return (
    <div className="h-64 flex items-end justify-between gap-2 pt-4">
      {data.map((item) => (
        <div key={item.day} className="flex flex-col items-center flex-1 gap-2 group">
          <div className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-gray-600 transition-opacity bg-gray-100 px-2 py-1 rounded">
            ₵{item.amount}
          </div>
          <div className="w-full bg-primary/10 rounded-t-sm relative flex items-end" style={{ height: '200px' }}>
            <div 
              className="w-full bg-primary rounded-t-sm transition-all duration-500 group-hover:bg-primary/80" 
              style={{ height: item.height }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 font-medium">{item.day}</span>
        </div>
      ))}
    </div>
  );
};

export function RiderManagement({
  initialTab = "earnings",
}: {
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "earnings", label: "Earnings", icon: BarChart3 },
    { id: "payout", label: "Payout Settings", icon: CreditCard },
    { id: "history", label: "Trip History", icon: History },
    { id: "ratings", label: "Ratings & Feedback", icon: Star },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "bike", label: "Bike Info", icon: Motorbike },
    { id: "profile", label: "Profile Settings", icon: UserCircle },
    { id: "support", label: "Support / Help", icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-gray-100 flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-primary text-primary-foreground h-16 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20 shadow-md">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-accent text-accent-foreground p-1.5 rounded-lg">
              <span className="font-bold text-xl tracking-tighter italic">OkadaGo</span>
            </div>
            <span className="font-medium hidden sm:inline-block">Rider Portal</span>
            <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-100 border-green-500/50 hidden md:inline-flex">Online</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-primary-foreground/20">
            <Avatar className="h-8 w-8 border border-primary-foreground/30">
              <AvatarImage src="https://i.pravatar.cc/150?u=rider1" />
              <AvatarFallback className="bg-primary-foreground/10">KM</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">Kwame Mensah</span>
              <span className="text-xs text-primary-foreground/70 mt-1">4.7 ★ Rating</span>
            </div>
            <ChevronDown className="h-4 w-4 ml-1 opacity-70 hidden sm:block" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
          absolute lg:static top-0 left-0 bottom-0 z-10 w-64 bg-[#0A5238] text-white/80 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full py-4 overflow-y-auto">
            <nav className="flex-1 space-y-1 px-3 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                    ${activeTab === item.id 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-accent' : 'opacity-70'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-6 mt-6 mb-2">
              <Button variant="ghost" className="w-full text-white/70 hover:bg-white/10 hover:text-white justify-start px-2">
                <LogOut className="h-5 w-5 mr-3 opacity-70" />
                Log Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isMobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-0 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 w-full relative z-0">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* EARNINGS TAB */}
            {activeTab === 'earnings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
                    <p className="text-gray-500">Track your income and platform performance.</p>
                  </div>
                  <Select defaultValue="this-week">
                    <SelectTrigger className="w-[180px] bg-white">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white shadow-sm border-gray-200">
                    <CardContent className="p-4 sm:p-6">
                      <p className="text-sm font-medium text-gray-500">Gross Earnings</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">₵890.00</h3>
                      <p className="text-xs text-green-600 flex items-center mt-2 font-medium">
                        <TrendingUp className="h-3 w-3 mr-1" /> +12% from last week
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border-gray-200">
                    <CardContent className="p-4 sm:p-6">
                      <p className="text-sm font-medium text-gray-500">Platform Fee</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">₵89.00</h3>
                      <p className="text-xs text-gray-400 mt-2">10% standard rate</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary text-primary-foreground shadow-md border-none col-span-2 md:col-span-1">
                    <CardContent className="p-4 sm:p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                      <p className="text-sm font-medium text-primary-foreground/80">Net Earnings</p>
                      <h3 className="text-2xl font-bold mt-1">₵801.00</h3>
                      <p className="text-xs text-accent mt-2 font-medium">Available to cash out</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-sm border-gray-200 col-span-2 md:col-span-1">
                    <CardContent className="p-4 sm:p-6">
                      <p className="text-sm font-medium text-gray-500">Total Trips</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">47</h3>
                      <p className="text-xs text-gray-400 mt-2">24h online time</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader className="pb-2 border-b border-gray-100">
                      <CardTitle className="text-lg">Weekly Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <EarningsChart />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm flex flex-col">
                    <CardHeader className="pb-2 border-b border-gray-100">
                      <CardTitle className="text-lg">Cash Out</CardTitle>
                      <CardDescription>Transfer funds to your account</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center py-6">
                      <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 mb-1">Available Balance</p>
                        <h2 className="text-4xl font-bold text-gray-900">₵801.00</h2>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                              <span className="text-yellow-700 font-bold text-xs">MTN</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Mobile Money</p>
                              <p className="text-xs text-gray-500">*** 4567</p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 py-6 text-lg shadow-sm">
                          Cash Out Now
                        </Button>
                        <p className="text-xs text-center text-gray-500">Instantly transfers to your default method.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
                  <p className="text-gray-500">Keep your compliance documents up to date to stay active.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Verified Document */}
                  <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="p-5 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600 h-fit">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">National ID Card</h3>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 py-0 text-[10px] h-4">Verified</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">Ghana Card (GHA-****-1)</p>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Uploaded: Jan 12, 2024
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Verified Document */}
                  <Card className="border-l-4 border-l-green-500 shadow-sm">
                    <CardContent className="p-5 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600 h-fit">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">Driver's License</h3>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-1.5 py-0 text-[10px] h-4">Verified</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">Class A (Motorcycles)</p>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Expires: Aug 2026
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Pending Document */}
                  <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                    <CardContent className="p-5 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600 h-fit">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">Vehicle Registration</h3>
                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none px-1.5 py-0 text-[10px] h-4">Pending Review</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">Document #448922</p>
                          <div className="text-xs text-yellow-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Usually takes 24-48hrs
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Expired Document */}
                  <Card className="border-l-4 border-l-red-500 shadow-sm bg-red-50/50">
                    <CardContent className="p-5 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600 h-fit">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-red-900">Insurance Certificate</h3>
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none px-1.5 py-0 text-[10px] h-4">Expired</Badge>
                          </div>
                          <p className="text-sm text-red-700/80 mb-2">Comprehensive Cover</p>
                          <div className="text-xs text-red-600 flex items-center gap-1 font-medium">
                            Action required to accept rides
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm">
                        Update
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-dashed border-2 border-gray-300 bg-gray-50/50">
                  <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload New Document</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm">
                      Drag and drop your files here, or click to browse. Supported formats: JPG, PNG, PDF (Max 5MB).
                    </p>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Select Files
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* OTHER TABS PLACEHOLDERS */}
            {['payout', 'history', 'ratings', 'bike', 'profile', 'support'].includes(activeTab) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-white shadow-sm border border-gray-100 p-6 rounded-full mb-4">
                  {activeTab === 'payout' && <CreditCard className="h-12 w-12 text-primary/40" />}
                  {activeTab === 'history' && <History className="h-12 w-12 text-primary/40" />}
                  {activeTab === 'ratings' && <Star className="h-12 w-12 text-primary/40" />}
                  {activeTab === 'bike' && <Motorbike className="h-12 w-12 text-primary/40" />}
                  {activeTab === 'profile' && <UserCircle className="h-12 w-12 text-primary/40" />}
                  {activeTab === 'support' && <HelpCircle className="h-12 w-12 text-primary/40" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {activeTab === 'payout' ? 'Payout Settings' : activeTab.replace('-', ' ')}
                </h2>
                <p className="text-gray-500 max-w-md mt-2">
                  This administrative view is currently in development.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => setActiveTab('earnings')}>
                  Back to Earnings
                </Button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
