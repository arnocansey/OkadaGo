import React, { useState } from "react";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  Bell, 
  ShieldAlert, 
  HelpCircle, 
  Star, 
  History, 
  LogOut, 
  Menu,
  ChevronRight,
  Download,
  Wallet,
  MessageSquare,
  Camera,
  CheckCircle2,
  XCircle,
  Plus,
  Send
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
import { Textarea } from "../../ui/textarea";

const MOCK_RIDES = [
  { id: "TRP-8472", date: "Today, 10:42 AM", pickup: "Ring Road Central", dropoff: "Kotoka International Airport", amount: "₵45.50", status: "completed", rider: "Kwame Mensah", rating: 5 },
  { id: "TRP-8471", date: "Yesterday, 04:15 PM", pickup: "Osu Oxford Street", dropoff: "Accra Mall", amount: "₵32.00", status: "completed", rider: "Ebenezer Ofori", rating: 4 },
  { id: "TRP-8470", date: "Mon, 14 Aug", pickup: "Labadi Beach", dropoff: "Cantonments", amount: "₵28.50", status: "completed", rider: "Samuel Djan", rating: 5 },
  { id: "TRP-8469", date: "Sun, 13 Aug", pickup: "Achimota Retail Centre", dropoff: "Legon Campus", amount: "₵55.00", status: "cancelled", rider: "Frank Addo", rating: null },
  { id: "TRP-8468", date: "Fri, 11 Aug", pickup: "East Legon", dropoff: "Spintex Road", amount: "₵42.00", status: "completed", rider: "Isaac Tetteh", rating: 5 },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "promo", title: "50% off your next 3 rides!", desc: "Use code WEEKEND50. Valid until Sunday.", time: "2 hours ago", read: false },
  { id: 2, type: "system", title: "Security Alert", desc: "New login detected from a new device.", time: "Yesterday", read: true },
  { id: 3, type: "ride", title: "Ride Receipt", desc: "Your ride with Kwame was ₵45.50.", time: "Yesterday", read: true },
];

export function PassengerAccount({
  initialTab = "profile",
}: {
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedRide, setExpandedRide] = useState<string | null>(null);

  const navItems = [
    { id: "profile", label: "Profile Details", icon: User },
    { id: "history", label: "Ride History", icon: History },
    { id: "wallet", label: "Wallet & Payments", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "safety", label: "Safety & SOS", icon: ShieldAlert },
    { id: "support", label: "Help & Support", icon: HelpCircle },
    { id: "ratings", label: "Ratings & Reviews", icon: Star },
  ];

  return (
    <div className="flex h-screen bg-gray-50 flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-primary text-primary-foreground h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-md">
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
            <span className="font-medium hidden sm:inline-block">Passenger Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/90 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
              <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground">AO</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden md:inline-block">Ama Owusu</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          absolute lg:static top-16 left-0 bottom-0 z-20 w-64 bg-white border-r shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex flex-col h-full py-6">
            <div className="px-6 mb-6">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Settings</h2>
            </div>
            <nav className="flex-1 space-y-1 px-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                    ${activeTab === item.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
                  `}
                >
                  <item.icon className={`h-5 w-5 ${activeTab === item.id ? 'text-primary' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-6 mt-auto">
              <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile Details</h1>
                  <p className="text-gray-500">Manage your personal information and account preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-1">
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl">AO</AvatarFallback>
                        </Avatar>
                        <Button size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-sm bg-white text-gray-700 hover:bg-gray-100 border">
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Ama Owusu</h3>
                        <p className="text-sm text-gray-500 flex items-center justify-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" /> Accra, Ghana
                        </p>
                      </div>
                      <div className="w-full border-t pt-4 mt-2">
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-gray-500">Total Rides</span>
                          <span className="font-medium">87</span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-gray-500">Avg Rating</span>
                          <span className="font-medium flex items-center gap-1">4.9 <Star className="h-3 w-3 fill-accent text-accent" /></span>
                        </div>
                        <div className="flex justify-between text-sm py-1">
                          <span className="text-gray-500">Member Since</span>
                          <span className="font-medium">Jan 2024</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your contact details and preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" defaultValue="Ama" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" defaultValue="Owusu" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              +233
                            </span>
                            <Input id="phone" defaultValue="24 456 7890" className="rounded-l-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input id="email" type="email" defaultValue="ama.owusu@example.com" />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t pt-6">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            )}

            {/* RIDE HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
                    <p className="text-gray-500">View your past trips and download receipts.</p>
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rides</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {MOCK_RIDES.map((ride) => (
                    <Card key={ride.id} className="overflow-hidden">
                      <div 
                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between"
                        onClick={() => setExpandedRide(expandedRide === ride.id ? null : ride.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-gray-100 p-2 rounded-full">
                            <History className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{ride.date}</span>
                              <Badge variant={ride.status === 'completed' ? 'default' : 'secondary'} className={
                                ride.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : ''
                              }>
                                {ride.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 flex flex-col gap-1 mt-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span>{ride.pickup}</span>
                              </div>
                              <div className="ml-1 w-px h-3 bg-gray-300" />
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-none bg-accent" />
                                <span>{ride.dropoff}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                          <span className="font-bold text-lg">{ride.amount}</span>
                          <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
                            {expandedRide === ride.id ? 'Less info' : 'More info'}
                          </Button>
                        </div>
                      </div>

                      {expandedRide === ride.id && (
                        <div className="bg-gray-50 border-t p-5 animate-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="h-48 bg-gray-200 rounded-lg border border-gray-300 relative overflow-hidden flex items-center justify-center">
                              {/* Map Placeholder */}
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                              <div className="bg-white/90 px-4 py-2 rounded-md shadow-sm text-sm font-medium z-10 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> Map Route View
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Trip Details</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Trip ID</span>
                                    <span className="font-medium">{ride.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Rider</span>
                                    <span className="font-medium">{ride.rider}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Payment</span>
                                    <span className="font-medium">MTN Mobile Money</span>
                                  </div>
                                  {ride.rating && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">Your Rating</span>
                                      <span className="font-medium flex items-center gap-1">
                                        {ride.rating} <Star className="h-3 w-3 fill-accent text-accent" />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Separator />
                              <div className="flex gap-3">
                                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                                  <Download className="h-4 w-4 mr-2" /> Receipt
                                </Button>
                                <Button variant="outline" className="flex-1">Report Issue</Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* WALLET TAB */}
            {activeTab === 'wallet' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Wallet & Payments</h1>
                  <p className="text-gray-500">Manage your payment methods and wallet balance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-primary text-primary-foreground md:col-span-1 border-none shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <CardContent className="p-6 relative z-10">
                      <p className="text-primary-foreground/80 text-sm font-medium mb-1">Available Balance</p>
                      <h2 className="text-4xl font-bold mb-6">₵120.50</h2>
                      <div className="flex gap-2">
                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1">
                          <Plus className="h-4 w-4 mr-1" /> Add Funds
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <div>
                        <CardTitle className="text-lg">Payment Methods</CardTitle>
                      </div>
                      <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" /> Add New</Button>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                      <div className="divide-y">
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-md flex items-center justify-center">
                              <Phone className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">MTN Mobile Money</p>
                              <p className="text-xs text-gray-500">+233 24 *** 7890</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">Primary</Badge>
                        </div>
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
                              <Phone className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Vodafone Cash</p>
                              <p className="text-xs text-gray-500">+233 20 *** 4567</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Visa Card</p>
                              <p className="text-xs text-gray-500">**** **** **** 4242</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                              {i === 2 ? <Plus className="h-5 w-5" /> : <History className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{i === 2 ? 'Wallet Top-up' : 'Ride Payment'}</p>
                              <p className="text-xs text-gray-500">{i === 2 ? 'Yesterday, 10:00 AM' : 'Today, 10:42 AM'}</p>
                            </div>
                          </div>
                          <div className={`font-medium ${i === 2 ? 'text-green-600' : 'text-gray-900'}`}>
                            {i === 2 ? '+₵50.00' : '-₵45.50'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* SAFETY TAB */}
            {activeTab === 'safety' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Safety & SOS</h1>
                  <p className="text-gray-500">Your safety is our priority. Manage emergency contacts and settings.</p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-full text-red-600">
                      <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 text-lg">Emergency SOS</h3>
                      <p className="text-red-700/80 text-sm">Alert authorities and your emergency contacts instantly.</p>
                    </div>
                  </div>
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold w-full sm:w-auto shadow-md">
                    ACTIVATE SOS
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Safety Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Share My Trip</Label>
                          <p className="text-sm text-gray-500">Automatically share live location during rides.</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base font-medium">Pin Verification</Label>
                          <p className="text-sm text-gray-500">Require PIN to start ride.</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <div>
                        <CardTitle className="text-lg">Trusted Contacts</CardTitle>
                        <CardDescription>Alerted during emergencies.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm"><Plus className="h-4 w-4" /></Button>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>MK</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">Mama (Kwame)</p>
                            <p className="text-xs text-gray-500">+233 20 123 4567</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>DK</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">David K.</p>
                            <p className="text-xs text-gray-500">+233 24 987 6543</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {/* OTHER TABS PLACEHOLDERS - To keep it manageable */}
            {['notifications', 'support', 'ratings'].includes(activeTab) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  {activeTab === 'notifications' && <Bell className="h-12 w-12 text-gray-400" />}
                  {activeTab === 'support' && <HelpCircle className="h-12 w-12 text-gray-400" />}
                  {activeTab === 'ratings' && <Star className="h-12 w-12 text-gray-400" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h2>
                <p className="text-gray-500 max-w-md">This section is currently under development. Check back later for updates.</p>
                <Button variant="outline" onClick={() => setActiveTab('profile')}>Return to Profile</Button>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
