import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, CreditCard, ChevronRight, User, Bell, Menu, Star, Activity, Car, Bike, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function BookingDashboard({
  initialBookingState = 'search',
}: {
  initialBookingState?: string;
}) {
  const [bookingState, setBookingState] = useState(initialBookingState);
  const [pickup, setPickup] = useState('Kotoka International Airport');
  const [dropoff, setDropoff] = useState('Osu Oxford Street');

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      {/* Top Navigation */}
      <header className="flex-none h-16 border-b border-border bg-card px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">O</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">OkadaGo</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="text-foreground">Book a Ride</a>
            <a href="#" className="hover:text-foreground transition-colors">My Trips</a>
            <a href="#" className="hover:text-foreground transition-colors">Wallet</a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">Kwame A.</div>
              <div className="text-xs text-muted-foreground">Personal</div>
            </div>
            <Avatar className="w-8 h-8 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary">KA</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Booking Flow */}
        <div className="w-full md:w-[420px] lg:w-[480px] bg-background border-r border-border flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex-none overflow-y-auto">
          
          <div className="p-6">
            <Tabs value={bookingState} onValueChange={setBookingState} className="w-full">
              <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="search" className="text-xs">Search</TabsTrigger>
                  <TabsTrigger value="searching" className="text-xs">Finding...</TabsTrigger>
                  <TabsTrigger value="assigned" className="text-xs">Assigned</TabsTrigger>
                  <TabsTrigger value="progress" className="text-xs">En Route</TabsTrigger>
                </TabsList>
              </div>

              {/* SEARCH STATE */}
              <TabsContent value="search" className="mt-0 space-y-6 outline-none">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight mb-1">Where to?</h1>
                  <p className="text-muted-foreground text-sm">Request a fast, safe ride in seconds.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                    <Input 
                      placeholder="Pickup location" 
                      className="pl-9 bg-card h-12"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-accent" />
                    <Input 
                      placeholder="Destination" 
                      className="pl-9 bg-card h-12"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                    />
                  </div>
                  <div className="absolute left-4 top-[88px] bottom-[30px] w-0.5 bg-border -z-10" />
                </div>

                {/* Ride Options */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-semibold text-foreground">Select Ride</h3>
                  
                  <div className="border-2 border-primary rounded-xl p-4 bg-primary/5 flex items-center justify-between cursor-pointer transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bike className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          OkadaGo Express <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">Fastest</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>3 min away</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>12:45 PM dropoff</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₵ 35</div>
                      <div className="text-xs text-muted-foreground line-through">₵ 42</div>
                    </div>
                  </div>

                  <div className="border border-border rounded-xl p-4 bg-card flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Bike className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold">OkadaGo Standard</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>5 min away</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span>12:48 PM dropoff</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">₵ 28</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between text-sm bg-card p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">Personal Wallet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">₵ 145.00</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    onClick={() => setBookingState('searching')}
                  >
                    Confirm OkadaGo Express
                  </Button>
                </div>
              </TabsContent>

              {/* SEARCHING STATE */}
              <TabsContent value="searching" className="mt-0 h-[600px] flex flex-col items-center justify-center text-center space-y-6 outline-none">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                  <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-pulse" />
                  <div className="absolute inset-8 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                    <Search className="w-8 h-8 text-primary-foreground animate-bounce" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Finding your rider...</h2>
                  <p className="text-muted-foreground">Connecting you with nearby top-rated riders.</p>
                </div>
                <Button variant="outline" className="w-full h-12 mt-8" onClick={() => setBookingState('search')}>
                  Cancel Request
                </Button>
              </TabsContent>

              {/* ASSIGNED STATE */}
              <TabsContent value="assigned" className="mt-0 space-y-6 outline-none">
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-accent-foreground flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Rider arriving in 3 mins</div>
                    <div className="text-sm opacity-90">Please head to the pickup point at Kotoka Airport Arrivals.</div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <Avatar className="w-14 h-14 border-2 border-primary/10">
                        <AvatarFallback className="bg-muted text-lg">JA</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-lg">Joseph A.</h3>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Star className="w-4 h-4 fill-accent text-accent" />
                          <span>4.9</span>
                          <span className="text-muted-foreground font-normal">(1,240 trips)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-primary/10 text-primary font-mono font-bold px-3 py-1 rounded-md text-lg tracking-wider">
                        GH-2847
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-medium">Honda CB150</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-card border-border hover:bg-muted text-foreground" variant="outline">
                      Call
                    </Button>
                    <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                      Message
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-4">
                    <div className="w-6 flex flex-col items-center mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="w-0.5 h-10 bg-border" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
                    </div>
                    <div className="flex-1 space-y-5">
                      <div>
                        <div className="text-sm font-medium">{pickup}</div>
                        <div className="text-xs text-muted-foreground">Pickup</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{dropoff}</div>
                        <div className="text-xs text-muted-foreground">Dropoff</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                  Cancel Ride
                </Button>
              </TabsContent>

              {/* IN PROGRESS STATE */}
              <TabsContent value="progress" className="mt-0 space-y-6 outline-none">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                  <div className="text-sm font-semibold text-primary mb-1">Estimated Arrival Time</div>
                  <div className="text-4xl font-bold text-foreground font-mono tracking-tight">12:45 <span className="text-xl text-muted-foreground">PM</span></div>
                  <div className="text-sm text-muted-foreground mt-2">15 mins remaining</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-muted">JA</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">Joseph A.</div>
                      <div className="text-xs text-muted-foreground">Honda CB150 · GH-2847</div>
                    </div>
                  </div>
                  <Button size="icon" variant="outline" className="rounded-full w-10 h-10">
                    <Navigation className="w-4 h-4 text-primary" />
                  </Button>
                </div>

                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Trip Fare</span>
                    <span className="font-bold">₵ 35.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium flex items-center gap-2"><CreditCard className="w-4 h-4" /> Wallet</span>
                  </div>
                </div>

                <Button variant="secondary" className="w-full h-12">
                  Share Trip Status
                </Button>
              </TabsContent>

            </Tabs>
          </div>

          {/* Quick Actions (Only show in search state) */}
          {bookingState === 'search' && (
            <div className="px-6 pb-6 mt-auto">
              <Separator className="mb-6" />
              <h3 className="text-sm font-semibold mb-3">Saved Places</h3>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 justify-start gap-2 h-12 bg-card">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-primary" />
                  </div>
                  <span className="truncate">Home</span>
                </Button>
                <Button variant="outline" className="flex-1 justify-start gap-2 h-12 bg-card">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="truncate">Work</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Map Area */}
        <div className="flex-1 bg-[#1A1C1E] relative overflow-hidden hidden md:block">
          {/* Faux Map SVG Background */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Map lines representing roads */}
            <path d="M-100 200 Q 300 150 500 400 T 1200 300" fill="none" stroke="white" strokeWidth="6" className="opacity-20" />
            <path d="M200 -100 Q 250 300 400 500 T 800 1000" fill="none" stroke="white" strokeWidth="8" className="opacity-20" />
            <path d="M600 -100 L 500 1000" fill="none" stroke="white" strokeWidth="4" className="opacity-20" />
            <path d="M-100 600 L 1200 500" fill="none" stroke="white" strokeWidth="4" className="opacity-20" />
          </svg>

          {/* Map Overlays based on state */}
          
          {/* Search State - Nearby Riders */}
          {bookingState === 'search' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute top-[30%] left-[40%]">
                <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-black/50 transition-transform hover:scale-110">
                  <Bike className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="absolute top-[45%] left-[60%]">
                <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-black/50 transition-transform hover:scale-110">
                  <Bike className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="absolute top-[60%] left-[35%]">
                <div className="w-8 h-8 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-black/50 transition-transform hover:scale-110">
                  <Bike className="w-4 h-4 text-white" />
                </div>
              </div>
              
              {/* Pickup Pin */}
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="bg-white text-black font-bold text-xs px-3 py-1.5 rounded-full shadow-lg mb-2">
                  Pickup
                </div>
                <div className="w-5 h-5 bg-primary rounded-full border-4 border-white shadow-lg" />
                <div className="w-1 h-8 bg-white/50 -mt-1" />
                <div className="w-10 h-3 bg-black/30 rounded-full blur-sm" />
              </div>
            </div>
          )}

          {/* Progress State - Route */}
          {(bookingState === 'progress' || bookingState === 'assigned') && (
            <div className="absolute inset-0">
              {/* Route Line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path 
                  d="M 400 600 Q 500 400 600 300 T 800 200" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="6" 
                  strokeDasharray="10, 10"
                  className="animate-[dash_20s_linear_infinite]"
                />
              </svg>

              {/* Pickup */}
              <div className="absolute top-[600px] left-[400px] -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 bg-primary rounded-full border-4 border-[#1A1C1E] shadow-[0_0_0_2px_hsl(var(--primary))]" />
              </div>

              {/* Dropoff */}
              <div className="absolute top-[200px] left-[800px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="bg-white text-black font-bold text-xs px-3 py-1.5 rounded-full shadow-lg mb-2">
                  Dropoff
                </div>
                <div className="w-6 h-6 bg-accent rounded-sm border-4 border-[#1A1C1E] shadow-[0_0_0_2px_hsl(var(--accent))]" />
              </div>

              {/* Rider */}
              <div className="absolute top-[400px] left-[580px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-primary">
                  <Bike className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          )}
          
          {/* Map Controls */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-2">
            <Button size="icon" variant="secondary" className="w-12 h-12 rounded-full shadow-lg bg-white text-black hover:bg-gray-100">
              <Navigation className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
