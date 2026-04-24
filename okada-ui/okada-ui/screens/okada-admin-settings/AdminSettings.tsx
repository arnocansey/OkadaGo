import React, { useState } from "react";
import { 
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit,
  Globe,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Mail,
  Map,
  MapPin,
  MessageSquare,
  MoreVertical,
  Paintbrush,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Tags,
  Users,
  XCircle,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// MOCK DATA
const emergencies = [
  { id: "SOS-092", user: "Kwame Mensah (Passenger)", location: "Ring Road Central, Accra", time: "2 mins ago", status: "Active" },
  { id: "SOS-091", user: "Emeka Okafor (Rider)", location: "Third Mainland Bridge, Lagos", time: "15 mins ago", status: "Resolved" },
];

const incidents = [
  { id: "INC-829", type: "Accident", reporter: "Yaw Boakye", against: "Self", severity: "High", status: "In Review", date: "Today, 14:30" },
  { id: "INC-828", type: "Harassment", reporter: "Ama Serwaa", against: "Rider (Kofi A.)", severity: "High", status: "Open", date: "Today, 11:15" },
  { id: "INC-827", type: "Fraud", reporter: "Chidi Eze", against: "Passenger", severity: "Medium", status: "Resolved", date: "Yesterday" },
  { id: "INC-826", type: "Safety Concern", reporter: "Fatima Ali", against: "Rider (Oluwaseun)", severity: "Medium", status: "Open", date: "Yesterday" },
  { id: "INC-825", type: "Accident", reporter: "Ngozi Obi", against: "Self", severity: "Low", status: "Resolved", date: "Oct 23" },
];

const tickets = [
  { id: "TK-1042", user: "Tunde Bakare", role: "Passenger", subject: "Wrong fare charged on trip to Ikeja", category: "Billing", priority: "High", status: "Open", assignee: "Unassigned", date: "1 hr ago" },
  { id: "TK-1041", user: "Emmanuel Kusi", role: "Rider", subject: "App freezing during ride acceptance", category: "Technical", priority: "Medium", status: "In Review", assignee: "Sarah J.", date: "3 hrs ago" },
  { id: "TK-1040", user: "Zainab Bello", role: "Passenger", subject: "Rider didn't show up but trip started", category: "Ride Issue", priority: "High", status: "Open", assignee: "Mike T.", date: "4 hrs ago" },
  { id: "TK-1039", user: "Samuel Osei", role: "Rider", subject: "Payment withdrawal delayed", category: "Payout", priority: "Medium", status: "Resolved", assignee: "Sarah J.", date: "Yesterday" },
];

const pricingBase = [
  { city: "Accra", base: "₵ 3.50", perKm: "₵ 1.20", perMin: "₵ 0.30", minFare: "₵ 5.00" },
  { city: "Kumasi", base: "₵ 3.00", perKm: "₵ 1.00", perMin: "₵ 0.25", minFare: "₵ 4.00" },
  { city: "Lagos Island", base: "₦ 400", perKm: "₦ 150", perMin: "₦ 20", minFare: "₦ 600" },
  { city: "Lagos Mainland", base: "₦ 350", perKm: "₦ 120", perMin: "₦ 15", minFare: "₦ 500" },
];

const templates = [
  { name: "Ride Confirmed", type: "Transactional", channels: ["Push", "SMS"] },
  { name: "Rider Arriving", type: "Transactional", channels: ["Push"] },
  { name: "Trip Completed", type: "Receipt", channels: ["Push", "Email"] },
  { name: "Promo Offer", type: "Marketing", channels: ["Push", "Email", "SMS"] },
  { name: "Account Warning", type: "Safety", channels: ["Email", "SMS"] },
];

const adminUsers = [
  { name: "Admin User", email: "admin@okada.com", role: "Super Admin", lastLogin: "2 mins ago", status: "Active" },
  { name: "Sarah Jenkins", email: "sarah@okada.com", role: "Support Agent", lastLogin: "1 hr ago", status: "Active" },
  { name: "Mike Thompson", email: "mike@okada.com", role: "Support Lead", lastLogin: "Yesterday", status: "Active" },
  { name: "David Osei", email: "david@okada.com", role: "Finance", lastLogin: "3 days ago", status: "Active" },
];

export function AdminSettings({
  initialTab = "safety",
}: {
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const sidebarLinks = [
    { id: "safety", icon: ShieldAlert, label: "Safety & Incidents" },
    { id: "tickets", icon: LifeBuoy, label: "Support Tickets" },
    { id: "complaints", icon: MessageSquare, label: "Complaints" },
    { id: "pricing", icon: Tags, label: "Pricing Settings" },
    { id: "zones", icon: Map, label: "Service Zones" },
    { id: "templates", icon: BellRing, label: "Notifications" },
    { id: "roles", icon: Users, label: "Roles & Permissions" },
    { id: "branding", icon: Paintbrush, label: "Branding" },
    { id: "general", icon: Settings, label: "General Settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* MAIN SIDEBAR (Dark) */}
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
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/5 hover:text-white transition-colors">
              <Settings size={18} />
              <span>Payments & Promos</span>
            </a>
            
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">System</div>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-[#0D6B4A]/20 text-[#0D6B4A] border-r-2 border-[#0D6B4A] font-medium">
              <ShieldAlert size={18} className="text-[#0D6B4A]" />
              <span className="text-[#0D6B4A]">Safety & Settings</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-semibold text-slate-800">System Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500">
              <BellRing size={20} />
            </Button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarFallback className="bg-[#0D6B4A] text-white text-xs">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* SETTINGS LAYOUT (Sidebar + Content) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Settings Nav */}
          <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto hidden lg:block py-6">
            <nav className="space-y-1 px-4">
              {sidebarLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                    activeTab === link.id 
                      ? "bg-slate-100 text-[#0D6B4A]" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <link.icon size={16} className={activeTab === link.id ? "text-[#0D6B4A]" : "text-slate-400"} />
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
              
              {/* TAB: SAFETY & INCIDENTS */}
              {activeTab === "safety" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">Safety & Incidents</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage SOS alerts and review incident reports.</p>
                  </div>

                  {/* SOS Alerts */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Active Emergencies</h3>
                    {emergencies.map((em, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-lg border ${em.status === 'Active' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-full ${em.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                            <AlertTriangle size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold ${em.status === 'Active' ? 'text-red-900' : 'text-slate-700'}`}>{em.user}</h4>
                              <Badge variant="outline" className={em.status === 'Active' ? 'border-red-300 text-red-700' : 'text-slate-500'}>{em.status}</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                              <span className="flex items-center gap-1"><MapPin size={14} /> {em.location}</span>
                              <span className="flex items-center gap-1"><Clock size={14} /> {em.time}</span>
                            </div>
                          </div>
                        </div>
                        {em.status === 'Active' && (
                          <Button className="bg-red-600 hover:bg-red-700 text-white shadow-sm">Respond Now</Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Incident Reports Table */}
                  <Card className="border-slate-200 shadow-sm mt-8">
                    <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg text-slate-800">Incident Reports</CardTitle>
                      <Button variant="outline" size="sm" className="h-8">Export Log</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-medium text-slate-500">ID</TableHead>
                            <TableHead className="font-medium text-slate-500">Type</TableHead>
                            <TableHead className="font-medium text-slate-500">Reporter</TableHead>
                            <TableHead className="font-medium text-slate-500">Against</TableHead>
                            <TableHead className="font-medium text-slate-500">Severity</TableHead>
                            <TableHead className="font-medium text-slate-500">Status</TableHead>
                            <TableHead className="text-right font-medium text-slate-500">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {incidents.map((inc, idx) => (
                            <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer">
                              <TableCell className="font-medium text-slate-600">{inc.id}</TableCell>
                              <TableCell className="text-slate-800">{inc.type}</TableCell>
                              <TableCell className="text-slate-700">{inc.reporter}</TableCell>
                              <TableCell className="text-slate-700">{inc.against}</TableCell>
                              <TableCell>
                                <Badge className={`
                                  ${inc.severity === 'High' ? 'bg-red-100 text-red-700' : ''}
                                  ${inc.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : ''}
                                  ${inc.severity === 'Low' ? 'bg-slate-100 text-slate-600' : ''}
                                `} variant="secondary">
                                  {inc.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`
                                  ${inc.status === 'Open' ? 'border-amber-300 text-amber-700' : ''}
                                  ${inc.status === 'In Review' ? 'border-blue-300 text-blue-700' : ''}
                                  ${inc.status === 'Resolved' ? 'border-emerald-300 text-emerald-700' : ''}
                                `}>
                                  {inc.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 text-[#0D6B4A]">Review</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: SUPPORT TICKETS */}
              {activeTab === "tickets" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">Support Tickets</h2>
                      <p className="text-sm text-slate-500 mt-1">Manage passenger and rider inquiries.</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input type="search" placeholder="Search tickets..." className="pl-9 h-9" />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[130px] h-9">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="review">In Review</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-medium text-slate-500 w-[100px]">Ticket ID</TableHead>
                            <TableHead className="font-medium text-slate-500">Subject & User</TableHead>
                            <TableHead className="font-medium text-slate-500">Category</TableHead>
                            <TableHead className="font-medium text-slate-500">Status</TableHead>
                            <TableHead className="font-medium text-slate-500">Assignee</TableHead>
                            <TableHead className="font-medium text-slate-500 text-right">Age</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets.map((tk, idx) => (
                            <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer">
                              <TableCell className="font-medium text-slate-500 text-xs">{tk.id}</TableCell>
                              <TableCell>
                                <div className="font-medium text-slate-800 mb-1">{tk.subject}</div>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${tk.role === 'Rider' ? 'border-[#0D6B4A] text-[#0D6B4A]' : 'border-slate-300 text-slate-600'}`}>
                                    {tk.role}
                                  </Badge>
                                  <span className="text-slate-500">{tk.user}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-600 text-sm">{tk.category}</TableCell>
                              <TableCell>
                                <Badge className={`
                                  ${tk.status === 'Open' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''}
                                  ${tk.status === 'In Review' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}
                                  ${tk.status === 'Resolved' ? 'bg-slate-100 text-slate-600 hover:bg-slate-100' : ''}
                                `} variant="secondary">
                                  {tk.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">{tk.assignee}</TableCell>
                              <TableCell className="text-right text-sm text-slate-500">{tk.date}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB: PRICING SETTINGS */}
              {activeTab === "pricing" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">Pricing Settings</h2>
                      <p className="text-sm text-slate-500 mt-1">Configure base fares, surge rules, and ride types.</p>
                    </div>
                    <Button className="bg-[#0D6B4A] hover:bg-[#0a5239] text-white">
                      <Save size={16} className="mr-2" /> Save Changes
                    </Button>
                  </div>

                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="py-4 border-b border-slate-100">
                      <CardTitle className="text-lg text-slate-800">Regional Base Fares</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="font-medium text-slate-500">City / Region</TableHead>
                            <TableHead className="font-medium text-slate-500">Base Fare</TableHead>
                            <TableHead className="font-medium text-slate-500">Per Km</TableHead>
                            <TableHead className="font-medium text-slate-500">Per Min</TableHead>
                            <TableHead className="font-medium text-slate-500">Min Fare</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pricingBase.map((pb, idx) => (
                            <TableRow key={idx} className="border-b border-slate-100">
                              <TableCell className="font-medium text-slate-800">{pb.city}</TableCell>
                              <TableCell><Input defaultValue={pb.base} className="h-8 w-24 text-sm" /></TableCell>
                              <TableCell><Input defaultValue={pb.perKm} className="h-8 w-24 text-sm" /></TableCell>
                              <TableCell><Input defaultValue={pb.perMin} className="h-8 w-24 text-sm" /></TableCell>
                              <TableCell><Input defaultValue={pb.minFare} className="h-8 w-24 text-sm" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                          <Zap size={18} className="text-[#FFB800]" /> Dynamic Pricing (Surge)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-slate-800 font-semibold">Enable Surge Pricing</Label>
                            <p className="text-xs text-slate-500 mt-1">Automatically adjust prices based on demand</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-slate-500">Maximum Surge Multiplier</Label>
                            <div className="flex items-center gap-3 mt-1">
                              <Input defaultValue="2.5x" className="w-24" />
                              <span className="text-sm text-slate-500">caps fare increase during peak</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-slate-500">Demand Threshold</Label>
                            <div className="flex items-center gap-3 mt-1">
                              <Select defaultValue="high">
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="med">Medium (1.5x rider ratio)</SelectItem>
                                  <SelectItem value="high">High (2.0x rider ratio)</SelectItem>
                                  <SelectItem value="extreme">Extreme (3.0x rider ratio)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-base text-slate-800">Platform Commission</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <Label className="text-slate-700">Standard Ride Commission</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Input defaultValue="20" className="w-20" />
                            <span className="text-slate-500">%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-slate-700">Express Delivery Commission</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Input defaultValue="15" className="w-20" />
                            <span className="text-slate-500">%</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <Label className="text-slate-700">Deduct Insurance Fee automatically</Label>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* TAB: NOTIFICATION TEMPLATES */}
              {activeTab === "templates" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">Notification Templates</h2>
                      <p className="text-sm text-slate-500 mt-1">Manage automated messages sent to users.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 font-medium text-sm text-slate-700">
                        Template Library
                      </div>
                      <div className="divide-y divide-slate-100">
                        {templates.map((tpl, i) => (
                          <div key={i} className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-[#0D6B4A]/5 border-l-2 border-l-[#0D6B4A]' : ''}`}>
                            <div className="font-medium text-slate-800 text-sm">{tpl.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{tpl.type}</span>
                              <div className="flex gap-1">
                                {tpl.channels.map(c => (
                                  <span key={c} className="text-[10px] text-[#0D6B4A]">{c}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-slate-100">
                        <Button variant="outline" className="w-full text-sm border-dashed text-slate-600">
                          <Plus size={14} className="mr-2" /> Add Template
                        </Button>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <Card className="border-slate-200 shadow-sm h-full">
                        <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                          <CardTitle className="text-base text-slate-800">Edit: Ride Confirmed</CardTitle>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Switch defaultChecked id="push" /> <Label htmlFor="push" className="mr-2">Push</Label>
                              <Switch defaultChecked id="sms" /> <Label htmlFor="sms">SMS</Label>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                          <div>
                            <Label className="text-slate-700">Title (Push Notification)</Label>
                            <Input defaultValue="Your ride is confirmed! 🏍️" className="mt-1" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <Label className="text-slate-700">Message Body</Label>
                              <span className="text-xs text-[#0D6B4A] cursor-pointer hover:underline">Insert Variable</span>
                            </div>
                            <Textarea 
                              defaultValue="Hi {{passenger_name}}, your rider {{rider_name}} is on the way. Estimated arrival in {{eta_mins}} mins. Vehicle plate: {{plate_number}}." 
                              className="h-24 resize-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs font-normal text-slate-500 cursor-pointer hover:bg-slate-50">{'{{passenger_name}}'}</Badge>
                              <Badge variant="outline" className="text-xs font-normal text-slate-500 cursor-pointer hover:bg-slate-50">{'{{rider_name}}'}</Badge>
                              <Badge variant="outline" className="text-xs font-normal text-slate-500 cursor-pointer hover:bg-slate-50">{'{{eta_mins}}'}</Badge>
                              <Badge variant="outline" className="text-xs font-normal text-slate-500 cursor-pointer hover:bg-slate-50">{'{{plate_number}}'}</Badge>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                            <Button variant="outline" className="border-slate-200">Send Test</Button>
                            <Button className="bg-[#0D6B4A] hover:bg-[#0a5239]">Save Template</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BRANDING SETTINGS */}
              {activeTab === "branding" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">Branding Settings</h2>
                      <p className="text-sm text-slate-500 mt-1">Customize the app appearance and platform details.</p>
                    </div>
                    <Button className="bg-[#0D6B4A] hover:bg-[#0a5239] text-white">
                      <Save size={16} className="mr-2" /> Save Brand
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-base text-slate-800">Visual Identity</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-6">
                        <div>
                          <Label className="text-slate-700 block mb-2">Platform Logo</Label>
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-[#0D1A10] rounded-lg flex items-center justify-center">
                               <div className="w-8 h-8 rounded bg-[#0D6B4A] flex items-center justify-center">
                                  <span className="text-white font-bold text-xl">O</span>
                                </div>
                            </div>
                            <Button variant="outline" className="h-9 border-slate-200">Upload New</Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="text-slate-700 block mb-2">Color Palette</Label>
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-[#0D6B4A] border border-slate-200 shadow-sm"></div>
                              <div>
                                <div className="text-sm font-medium text-slate-800">Primary Color</div>
                                <div className="text-xs text-slate-500">Main brand elements</div>
                              </div>
                            </div>
                            <span className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">#0D6B4A</span>
                          </div>
                          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-[#FFB800] border border-slate-200 shadow-sm"></div>
                              <div>
                                <div className="text-sm font-medium text-slate-800">Accent Color</div>
                                <div className="text-xs text-slate-500">Buttons & Highlights</div>
                              </div>
                            </div>
                            <span className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">#FFB800</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader className="py-4 border-b border-slate-100">
                        <CardTitle className="text-base text-slate-800">Platform Details</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <Label className="text-slate-700">App Name</Label>
                          <Input defaultValue="OkadaGo" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-slate-700">Tagline</Label>
                          <Input defaultValue="Fast, safe, and reliable motorcycle rides." className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-slate-700">Support Email</Label>
                          <Input defaultValue="support@okada.com" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-slate-700">Support Phone</Label>
                          <Input defaultValue="+233 55 123 4567" className="mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Placeholder for other tabs just to show structure */}
              {["complaints", "zones", "roles", "general"].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <Settings size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 capitalize">{activeTab} Settings</h3>
                  <p className="text-slate-500 max-w-md mt-2">
                    This module is currently being constructed. Configuration options for {activeTab} will appear here.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSettings;
