import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Wallet,
  MapPin,
  Clock,
  ChevronRight,
  Star,
  Car,
  FileText,
  Settings,
  Menu,
  Phone,
  MessageSquare
} from "lucide-react";

export function RiderDashboard({
  initialOnline = true,
}: {
  initialOnline?: boolean;
}) {
  const [isOnline, setIsOnline] = useState(initialOnline);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">O</span>
            </div>
            <span className="font-bold text-xl text-primary hidden sm:inline-block">OkadaGo</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">Emmanuel O.</span>
            <Avatar className="h-9 w-9 border border-slate-200">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">EO</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Status Toggle Area */}
        <section className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isOnline ? "You're Online" : "You're Offline"}
            </h2>
            <p className="text-slate-500">
              {isOnline ? "Waiting for ride requests in Accra..." : "Go online to start receiving requests."}
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className={`text-sm font-bold ${!isOnline ? 'text-slate-900' : 'text-slate-400'}`}>OFFLINE</span>
            <Switch 
              checked={isOnline} 
              onCheckedChange={setIsOnline} 
              className="data-[state=checked]:bg-primary h-8 w-14"
            />
            <span className={`text-sm font-bold ${isOnline ? 'text-primary' : 'text-slate-400'}`}>ONLINE</span>
          </div>
        </section>

        {/* Active Ride Request (Only visible when online) */}
        {isOnline && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative">
              <div className="absolute -inset-1 bg-accent/20 rounded-2xl blur-sm"></div>
              <Card className="relative border-accent/50 shadow-md bg-white overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-pulse"></div>
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent mb-2">NEW REQUEST</Badge>
                    <CardTitle className="text-2xl">Ama K.</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="font-medium text-slate-700">4.9</span>
                      <span>(12 trips)</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">₵42</div>
                    <div className="text-sm font-medium text-slate-500">8.3 km • 15 min</div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="relative pl-6 py-2 space-y-4 before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-slate-200">
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full bg-primary border-2 border-white"></div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pickup</p>
                      <p className="font-medium text-slate-900">Ring Road, Accra</p>
                      <p className="text-sm text-slate-500">2.1 km away</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 h-3 w-3 rounded-sm bg-accent border-2 border-white"></div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dropoff</p>
                      <p className="font-medium text-slate-900">Kotoka International Airport</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3 bg-slate-50 p-4 border-t">
                  <Button variant="outline" className="flex-1 border-slate-300 text-slate-700 font-bold h-12">
                    Decline (14s)
                  </Button>
                  <Button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-12">
                    Accept Ride
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Earnings Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-primary text-primary-foreground border-none">
                <CardHeader className="pb-2">
                  <CardDescription className="text-primary-foreground/80 font-medium">Today's Earnings</CardDescription>
                  <CardTitle className="text-3xl">₵185</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-primary-foreground/80">₦14,800 approx</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-500 font-medium">This Week</CardDescription>
                  <CardTitle className="text-3xl text-slate-900">₵890</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-500">₦71,000 approx</div>
                </CardContent>
              </Card>
              
              <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-500 font-medium">Total Trips Today</CardDescription>
                  <CardTitle className="text-3xl text-slate-900">12</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <span>+3 from yesterday</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Trips */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-lg">Recent Trips</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary font-medium">View All</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {[
                    { id: 1, name: "Kwame B.", route: "Osu → Labadi Beach", time: "10:42 AM", fare: "₵35", status: "completed" },
                    { id: 2, name: "Sarah M.", route: "East Legon → Cantonments", time: "09:15 AM", fare: "₵48", status: "completed" },
                    { id: 3, name: "John D.", route: "Makola → Adabraka", time: "08:30 AM", fare: "₵22", status: "cancelled" },
                    { id: 4, name: "Grace T.", route: "Airport Res → Osu", time: "07:45 AM", fare: "₵40", status: "completed" },
                  ].map((trip) => (
                    <div key={trip.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                          <Car className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{trip.route}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span>{trip.name}</span>
                            <span>•</span>
                            <span>{trip.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{trip.fare}</p>
                        {trip.status === "completed" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] mt-1 uppercase">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] mt-1 uppercase">Cancelled</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Rating Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                    <Star className="h-8 w-8 fill-accent text-accent" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900">4.7</h3>
                  <div className="flex gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`h-4 w-4 ${star <= 4 ? "fill-accent text-accent" : "fill-slate-200 text-slate-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Based on 236 reviews</p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">Profile Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-900">80% Complete</span>
                  <span className="text-primary font-medium">Action needed</span>
                </div>
                <Progress value={80} className="h-2 mb-4 bg-slate-100" />
                <div className="bg-accent/10 border border-accent/20 rounded-md p-3">
                  <p className="text-sm font-medium text-slate-800 flex items-start gap-2">
                    <FileText className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    Upload renewed insurance to reach 100% and unlock bonus tier.
                  </p>
                  <Button variant="link" className="text-accent hover:text-accent/80 p-0 h-auto mt-2 font-bold text-sm">Upload now →</Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {[
                    { icon: Wallet, label: "Earnings & Payouts" },
                    { icon: Clock, label: "Trip History" },
                    { icon: FileText, label: "Documents" },
                    { icon: Settings, label: "Settings" },
                  ].map((action, idx) => (
                    <button key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100">
                      <div className="flex items-center gap-3">
                        <action.icon className="h-5 w-5 text-slate-400" />
                        <span className="font-medium text-slate-700">{action.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
