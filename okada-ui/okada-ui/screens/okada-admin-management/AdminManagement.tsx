import React, { useState } from 'react';
import { 
  Search, Bell, LayoutDashboard, Bike, Users, UserCircle, 
  CreditCard, Tag, ShieldAlert, Settings, FileText, Filter, 
  ChevronDown, CheckCircle2, XCircle, Clock, MapPin, Eye,
  Check, X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

const SidebarItem = ({ icon: Icon, label, active = false }: any) => (
  <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${active ? 'bg-primary-foreground/10 text-white font-medium' : 'text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-white'}`}>
    <Icon className="h-5 w-5" />
    <span>{label}</span>
  </a>
);

// Mock Data
const ridersData = [
  { id: 'RD-101', name: 'Kwame Asante', phone: '+233 24 123 4567', city: 'Accra', status: 'Active', rating: 4.9, trips: 1420, joined: '12 Jan 2023' },
  { id: 'RD-102', name: 'Emeka Okafor', phone: '+234 80 123 4567', city: 'Lagos', status: 'Pending', rating: 0, trips: 0, joined: '02 Nov 2023' },
  { id: 'RD-103', name: 'Abena Mensah', phone: '+233 20 987 6543', city: 'Kumasi', status: 'Active', rating: 4.8, trips: 890, joined: '15 Mar 2023' },
  { id: 'RD-104', name: 'Tunde Bakare', phone: '+234 81 234 5678', city: 'Lagos', status: 'Suspended', rating: 3.2, trips: 145, joined: '05 Jun 2023' },
  { id: 'RD-105', name: 'Kofi Annan', phone: '+233 54 321 0987', city: 'Accra', status: 'Active', rating: 5.0, trips: 2100, joined: '10 Feb 2022' },
  { id: 'RD-106', name: 'Chinedu Eze', phone: '+234 70 876 5432', city: 'Abuja', status: 'Active', rating: 4.7, trips: 670, joined: '22 Aug 2023' },
  { id: 'RD-107', name: 'Yaw Yeboah', phone: '+233 27 555 4444', city: 'Accra', status: 'Pending', rating: 0, trips: 0, joined: '04 Nov 2023' },
  { id: 'RD-108', name: 'Ngozi Okonjo', phone: '+234 90 111 2222', city: 'Lagos', status: 'Active', rating: 4.9, trips: 1120, joined: '18 Apr 2023' },
];

const tripsData = [
  { id: 'TR-8901', passenger: 'David O.', rider: 'Kwame Asante', pickup: 'Osu Oxford St', dest: 'Kotoka Airport', fare: '₵45.00', status: 'Completed', date: 'Today, 14:30' },
  { id: 'TR-8902', passenger: 'Sarah K.', rider: 'Kofi Annan', pickup: 'East Legon', dest: 'Accra Mall', fare: '₵25.00', status: 'In Progress', date: 'Today, 15:10' },
  { id: 'TR-8903', passenger: 'Michael T.', rider: 'Unassigned', pickup: 'Ikeja City Mall', dest: 'Victoria Island', fare: '₦3,500', status: 'Pending', date: 'Today, 15:15' },
  { id: 'TR-8904', passenger: 'Grace B.', rider: 'Ngozi Okonjo', pickup: 'Lekki Phase 1', dest: 'Ikoyi', fare: '₦2,800', status: 'Completed', date: 'Today, 13:45' },
  { id: 'TR-8905', passenger: 'Daniel F.', rider: 'Abena Mensah', pickup: 'KNUST Campus', dest: 'Adum', fare: '₵30.00', status: 'Cancelled', date: 'Today, 12:20' },
  { id: 'TR-8906', passenger: 'Joy E.', rider: 'Chinedu Eze', pickup: 'Wuse 2', dest: 'Garki', fare: '₦1,500', status: 'Completed', date: 'Today, 11:10' },
  { id: 'TR-8907', passenger: 'Samuel A.', rider: 'Kwame Asante', pickup: 'Labadi Beach', dest: 'Osu', fare: '₵35.00', status: 'Completed', date: 'Today, 09:30' },
  { id: 'TR-8908', passenger: 'Esther M.', rider: 'Ngozi Okonjo', pickup: 'Surulere', dest: 'Yaba', fare: '₦1,800', status: 'Completed', date: 'Today, 08:45' },
];

const transactionsData = [
  { id: 'TX-5501', rider: 'Kwame Asante', type: 'Payout', amount: '₵450.00', status: 'Completed', date: '04 Nov 2023' },
  { id: 'TX-5502', rider: 'Emeka Okafor', type: 'Platform Fee', amount: '₦15,000', status: 'Completed', date: '04 Nov 2023' },
  { id: 'TX-5503', rider: 'Abena Mensah', type: 'Payout', amount: '₵320.00', status: 'Processing', date: '04 Nov 2023' },
  { id: 'TX-5504', rider: 'Kofi Annan', type: 'Payout', amount: '₵850.00', status: 'Completed', date: '03 Nov 2023' },
];

export function AdminManagement({
  initialTab = "riders",
}: {
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedRider, setSelectedRider] = useState<any | null>(null);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Active':
      case 'Completed':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Active</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">Pending</Badge>;
      case 'Suspended':
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">Suspended</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">In Progress</Badge>;
      case 'Processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-sm">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-[#0D1A10] text-white">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center font-bold text-white">O</div>
          <span className="text-xl font-bold tracking-tight">OKADAGO<span className="text-accent">.</span></span>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem icon={Bike} label="Rides" active />
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
            <Input className="w-full pl-9 bg-gray-50 border-gray-200 focus-visible:ring-accent" placeholder="Search across platform..." />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">3</span>
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

        {/* Tabs Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white border border-gray-200 p-1 h-12 rounded-lg">
                <TabsTrigger value="riders" className="px-6 py-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-primary font-medium">Riders Management</TabsTrigger>
                <TabsTrigger value="trips" className="px-6 py-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-primary font-medium">Trips & Dispatch</TabsTrigger>
                <TabsTrigger value="payments" className="px-6 py-2 rounded-md data-[state=active]:bg-gray-100 data-[state=active]:text-primary font-medium">Payments</TabsTrigger>
              </TabsList>
              
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
                <Filter className="h-4 w-4" /> Export Report
              </Button>
            </div>

            {/* RIDERS TAB */}
            <TabsContent value="riders" className="space-y-4 outline-none">
              <Card className="shadow-sm border-gray-200">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input className="w-full pl-9 bg-white" placeholder="Search riders by name, ID or phone..." />
                    </div>
                    <Button variant="outline" className="bg-white gap-2 text-gray-600">
                      Status: All <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="bg-white gap-2 text-gray-600">
                      City: All <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Name & ID</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Trips</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ridersData.map((rider) => (
                        <TableRow key={rider.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                {rider.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-gray-900">{rider.name}</div>
                            <div className="text-xs text-gray-500">{rider.id}</div>
                          </TableCell>
                          <TableCell className="text-gray-600">{rider.phone}</TableCell>
                          <TableCell className="text-gray-600">{rider.city}</TableCell>
                          <TableCell>
                            <StatusBadge status={rider.status} />
                          </TableCell>
                          <TableCell>
                            {rider.rating > 0 ? (
                              <div className="flex items-center text-gray-700">
                                <span className="text-amber-500 mr-1">★</span> {rider.rating}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-gray-700 font-medium">{rider.trips.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRider(rider)} className="text-primary hover:text-primary hover:bg-primary/5">
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* TRIPS TAB */}
            <TabsContent value="trips" className="space-y-4 outline-none">
              <Card className="shadow-sm border-gray-200">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-3 flex-1 w-full">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input className="w-full pl-9 bg-white" placeholder="Search trips by ID..." />
                    </div>
                    <Button variant="outline" className="bg-white gap-2 text-gray-600">
                      Today <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="bg-white gap-2 text-gray-600">
                      Status: All <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Trip ID</TableHead>
                        <TableHead>Passenger</TableHead>
                        <TableHead>Rider</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Fare</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tripsData.map((trip) => (
                        <TableRow key={trip.id} className="hover:bg-gray-50/50 cursor-pointer">
                          <TableCell className="font-medium text-primary">{trip.id}</TableCell>
                          <TableCell className="text-gray-900">{trip.passenger}</TableCell>
                          <TableCell>
                            <span className={trip.rider === 'Unassigned' ? 'text-amber-600 font-medium' : 'text-gray-900'}>
                              {trip.rider}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-xs max-w-[200px]">
                              <div className="flex items-center text-gray-600 truncate">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0" />
                                {trip.pickup}
                              </div>
                              <div className="flex items-center text-gray-900 font-medium truncate">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent mr-2 flex-shrink-0" />
                                {trip.dest}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{trip.fare}</TableCell>
                          <TableCell>
                            <StatusBadge status={trip.status} />
                          </TableCell>
                          <TableCell className="text-right text-gray-500">{trip.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-5 flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                    <div className="text-3xl font-bold text-gray-900">₵284,000</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-5 flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-500">Rider Payouts</div>
                    <div className="text-3xl font-bold text-gray-900">₵198,000</div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-5 flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-500">Platform Commission</div>
                    <div className="text-3xl font-bold text-primary">₵86,000</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3 border-b border-gray-100">
                  <CardTitle className="text-base font-semibold text-gray-900">Recent Transactions</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Rider / Party</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium text-gray-500">{tx.id}</TableCell>
                        <TableCell className="text-gray-900 font-medium">{tx.rider}</TableCell>
                        <TableCell className="text-gray-600">{tx.type}</TableCell>
                        <TableCell className="font-semibold">{tx.amount}</TableCell>
                        <TableCell><StatusBadge status={tx.status} /></TableCell>
                        <TableCell className="text-right text-gray-500">{tx.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Rider Detail Slide-over */}
      <Sheet open={!!selectedRider} onOpenChange={(open: boolean) => !open && setSelectedRider(null)}>
        <SheetContent className="sm:max-w-md w-[400px] bg-white overflow-y-auto p-0 border-l border-gray-200">
          {selectedRider && (
            <div className="flex flex-col h-full">
              <div className="p-6 bg-gray-50 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {selectedRider.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <StatusBadge status={selectedRider.status} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedRider.name}</h2>
                <div className="text-sm text-gray-500 mt-1">{selectedRider.id} • Joined {selectedRider.joined}</div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Contact Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-900">{selectedRider.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">City</span>
                      <span className="font-medium text-gray-900">{selectedRider.city}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">Total Trips</div>
                      <div className="text-lg font-bold text-gray-900">{selectedRider.trips}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">Rating</div>
                      <div className="text-lg font-bold text-gray-900 flex items-center">
                        {selectedRider.rating > 0 ? (
                          <><span className="text-amber-500 mr-1 text-sm">★</span> {selectedRider.rating}</>
                        ) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Documents</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 border border-emerald-100 bg-emerald-50 rounded text-sm">
                      <div className="flex items-center text-emerald-900 font-medium">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> National ID
                      </div>
                      <span className="text-emerald-600 text-xs font-semibold">Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border border-emerald-100 bg-emerald-50 rounded text-sm">
                      <div className="flex items-center text-emerald-900 font-medium">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Driver's License
                      </div>
                      <span className="text-emerald-600 text-xs font-semibold">Verified</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border border-emerald-100 bg-emerald-50 rounded text-sm">
                      <div className="flex items-center text-emerald-900 font-medium">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Bike Registration
                      </div>
                      <span className="text-emerald-600 text-xs font-semibold">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-3">
                {selectedRider.status === 'Pending' ? (
                  <>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">Approve Rider</Button>
                    <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Reject Application</Button>
                  </>
                ) : selectedRider.status === 'Active' ? (
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">Suspend Rider</Button>
                ) : (
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Reactivate Rider</Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
