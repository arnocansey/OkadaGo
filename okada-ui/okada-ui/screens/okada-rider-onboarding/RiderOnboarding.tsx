import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageSquare,
  ShieldAlert,
  Star,
  ChevronRight,
  Car
} from "lucide-react";

export function RiderOnboarding({
  initialTab = "onboarding",
  initialStep = 1,
}: {
  initialTab?: string;
  initialStep?: number;
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [onboardingStep, setOnboardingStep] = useState(initialStep);

  return (
    <div className="min-h-screen bg-slate-50 w-full font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">O</span>
          </div>
          <span className="font-bold text-xl text-primary">OkadaGo Partner</span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          {activeTab === "onboarding" ? "Registration" : "Live Operations"}
        </div>
      </header>

      {/* Interactive Dev Tabs - To switch between views easily */}
      <div className="bg-slate-100 p-2 border-b border-slate-200 overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
          <TabsList className="grid grid-cols-5 h-auto bg-transparent gap-2 w-[800px] md:w-full">
            <TabsTrigger value="onboarding" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">1. Onboarding</TabsTrigger>
            <TabsTrigger value="approval" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">2. Approval</TabsTrigger>
            <TabsTrigger value="navigate" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">3. Pickup</TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">4. Active Trip</TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">5. Summary</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* VIEW 1: ONBOARDING */}
        {activeTab === "onboarding" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Become a Rider</h1>
              <p className="text-slate-500">Complete your profile to start earning.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-300" style={{ width: `${((onboardingStep - 1) / 3) * 100}%` }}></div>
              
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="relative z-10 flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                    step < onboardingStep ? "bg-primary border-primary text-white" : 
                    step === onboardingStep ? "bg-white border-primary text-primary" : 
                    "bg-white border-slate-300 text-slate-400"
                  }`}>
                    {step < onboardingStep ? <CheckCircle2 className="h-5 w-5" /> : step}
                  </div>
                  <span className={`text-xs font-medium mt-2 absolute -bottom-6 w-24 text-center ${
                    step <= onboardingStep ? "text-slate-900" : "text-slate-400"
                  }`}>
                    {step === 1 ? "Personal" : step === 2 ? "Documents" : step === 3 ? "Vehicle" : "Review"}
                  </span>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <Card className="mt-12 shadow-sm border-slate-200">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="text-xl">
                  {onboardingStep === 1 && "Personal Information"}
                  {onboardingStep === 2 && "Upload Documents"}
                  {onboardingStep === 3 && "Vehicle Details"}
                  {onboardingStep === 4 && "Review & Submit"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                
                {onboardingStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="Emmanuel" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Osei" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="+233 55 123 4567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City of Operation</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        <option>Accra, Ghana</option>
                        <option>Kumasi, Ghana</option>
                        <option>Lagos, Nigeria</option>
                        <option>Abuja, Nigeria</option>
                      </select>
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label>National ID / Ghana Card</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <UploadCloud className="h-6 w-6 text-primary" />
                        </div>
                        <p className="font-medium text-slate-900">Click to upload or drag and drop</p>
                        <p className="text-sm text-slate-500 mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Driver's License</Label>
                      <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">license_front.jpg</p>
                            <p className="text-xs text-slate-500">1.2 MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Remove</Button>
                      </div>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bikeMake">Motorcycle Make & Model</Label>
                      <Input id="bikeMake" placeholder="e.g. Bajaj Boxer BM 100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input id="year" placeholder="2022" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plate">License Plate</Label>
                        <Input id="plate" placeholder="GT-1234-22" />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Vehicle Registration Document</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
                        <UploadCloud className="h-6 w-6 text-slate-400 mb-2" />
                        <p className="text-sm font-medium text-slate-700">Upload Registration</p>
                      </div>
                    </div>
                  </div>
                )}

                {onboardingStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                      <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800">Pending Approval</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          We will review your documents within 24-48 hours. Please ensure all information is accurate to avoid delays.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-900 border-b pb-2">Application Summary</h4>
                      
                      <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div>
                          <p className="text-slate-500">Full Name</p>
                          <p className="font-medium text-slate-900">Emmanuel Osei</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Phone</p>
                          <p className="font-medium text-slate-900">+233 55 123 4567</p>
                        </div>
                        <div>
                          <p className="text-slate-500">City</p>
                          <p className="font-medium text-slate-900">Accra, Ghana</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Vehicle</p>
                          <p className="font-medium text-slate-900">Bajaj Boxer (GT-1234-22)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </CardContent>
              <CardFooter className="border-t bg-slate-50/50 p-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setOnboardingStep(Math.max(1, onboardingStep - 1))}
                  disabled={onboardingStep === 1}
                >
                  Back
                </Button>
                
                {onboardingStep < 4 ? (
                  <Button onClick={() => setOnboardingStep(onboardingStep + 1)} className="bg-primary hover:bg-primary/90">
                    Continue
                  </Button>
                ) : (
                  <Button onClick={() => setActiveTab("approval")} className="bg-primary hover:bg-primary/90 px-8">
                    Submit Application
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        )}

        {/* VIEW 2: APPROVAL SUCCESS */}
        {activeTab === "approval" && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Congratulations!</h1>
            <p className="text-lg text-slate-600 mb-8 max-w-md">
              Your profile has been approved. You are now an official OkadaGo partner. Let's get you on the road.
            </p>
            
            <Card className="w-full text-left border-primary/20 bg-primary/5 shadow-sm mb-8">
              <CardContent className="p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-accent fill-accent" />
                  Your Welcome Bonus
                </h3>
                <p className="text-sm text-slate-700 mb-4">
                  Complete 10 trips in your first 3 days to unlock a <span className="font-bold">₵100 bonus</span>.
                </p>
                <Progress value={0} className="h-2 bg-slate-200" />
                <p className="text-xs text-slate-500 mt-2 text-right">0/10 trips completed</p>
              </CardContent>
            </Card>

            <Button onClick={() => setActiveTab("navigate")} size="lg" className="w-full sm:w-auto px-12 h-14 text-lg font-bold bg-primary hover:bg-primary/90">
              Go Online Now
            </Button>
          </div>
        )}

        {/* VIEW 3: NAVIGATE TO PICKUP */}
        {activeTab === "navigate" && (
          <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 animate-in fade-in">
            {/* Map Placeholder */}
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Route Line */}
                <path d="M 150 450 Q 200 400 300 350 T 450 200" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeDasharray="10,10" className="animate-[dash_1s_linear_infinite]" />
                
                {/* Rider Marker */}
                <circle cx="150" cy="450" r="10" fill="#047857" stroke="white" strokeWidth="3" />
                
                {/* Pickup Marker */}
                <circle cx="450" cy="200" r="12" fill="#0f172a" stroke="white" strokeWidth="3" />
                <circle cx="450" cy="200" r="4" fill="white" />
              </svg>
            </div>

            {/* Top Navigation Overlay */}
            <div className="absolute top-4 left-4 right-4 bg-slate-900 text-white rounded-xl p-4 shadow-xl flex items-center gap-4">
              <div className="bg-slate-800 p-2 rounded-lg">
                <Navigation className="h-8 w-8 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">2.4 km</p>
                <p className="text-slate-300 font-medium">Continue on Ring Road Central</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-accent">5 min</p>
                <p className="text-sm text-slate-400">14:30 ETA</p>
              </div>
            </div>

            {/* Bottom Panel Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Heading to Pickup</h3>
                  <p className="text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" /> Ring Road, Accra
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-200">
                    <Phone className="h-5 w-5 text-slate-700" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-slate-200">
                    <MessageSquare className="h-5 w-5 text-slate-700" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="h-12 w-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold text-lg">
                  AK
                </div>
                <div>
                  <p className="font-bold text-slate-900">Ama K.</p>
                  <p className="text-sm text-slate-500">Passenger • 4.9 ★</p>
                </div>
              </div>

              <Button onClick={() => setActiveTab("active")} className="w-full h-14 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                I've Arrived
              </Button>
            </div>
          </div>
        )}

        {/* VIEW 4: ACTIVE TRIP */}
        {activeTab === "active" && (
          <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 animate-in fade-in">
            {/* Map Placeholder */}
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                {/* Route Line */}
                <path d="M 150 450 Q 300 300 450 150" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
                <path d="M 150 450 Q 300 300 450 150" fill="none" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" className="animate-[dash_1s_linear_infinite]" strokeDasharray="20,20" />
                
                {/* Rider Marker (Moving) */}
                <circle cx="300" cy="300" r="10" fill="#0f172a" stroke="white" strokeWidth="3" />
                
                {/* Dropoff Marker */}
                <circle cx="450" cy="150" r="12" fill="#ef4444" stroke="white" strokeWidth="3" />
                <rect x="446" y="146" width="8" height="8" fill="white" />
              </svg>
            </div>

            {/* Top Status */}
            <div className="absolute top-4 left-4 right-4 bg-primary text-white rounded-xl p-4 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="font-bold tracking-wide uppercase text-sm">Trip in Progress</span>
              </div>
              <div className="font-bold text-xl">₵42.00</div>
            </div>

            {/* Bottom Panel Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Dropping off</h3>
                  <p className="text-slate-500 font-medium mt-1">Kotoka International Airport</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">12 min</p>
                  <p className="text-sm text-slate-500">8.3 km</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center gap-4 mb-6">
                <Button variant="outline" className="flex-1 h-12 border-slate-200 text-slate-700 font-medium">
                  <ShieldAlert className="h-4 w-4 mr-2 text-red-500" /> SOS
                </Button>
                <Button onClick={() => setActiveTab("summary")} className="flex-[2] h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl">
                  End Trip
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: TRIP SUMMARY */}
        {activeTab === "summary" && (
          <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500">
            <Card className="overflow-hidden border-none shadow-xl">
              <div className="bg-primary p-8 text-center text-white">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mb-4 backdrop-blur-sm">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-1">Trip Completed!</h2>
                <p className="text-primary-foreground/80 font-medium">Great job, Emmanuel</p>
                
                <div className="mt-8 mb-2">
                  <span className="text-sm uppercase tracking-wider font-semibold text-primary-foreground/70">Fare Earned</span>
                  <div className="text-5xl font-bold mt-1">₵38.50</div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Time</span>
                    <span className="font-bold text-slate-900">18 mins</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Distance</span>
                    <span className="font-bold text-slate-900">8.3 km</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Passenger</span>
                    <span className="font-bold text-slate-900">Ama K.</span>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <p className="font-semibold text-slate-900 mb-3">Rate your passenger</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="p-1 hover:scale-110 transition-transform">
                        <Star className="h-8 w-8 text-slate-200 hover:text-accent hover:fill-accent transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 bg-slate-50 flex-col gap-3">
                <Button onClick={() => setActiveTab("onboarding")} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90">
                  Find Next Ride
                </Button>
                <Button variant="ghost" className="w-full text-slate-500 font-medium">
                  Go Offline
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
