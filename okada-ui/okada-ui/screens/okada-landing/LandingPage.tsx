import React from 'react';
import Link from 'next/link';
import { Button } from '../../ui/button';
import { ChevronRight, Shield, Clock, MapPin, Star, Menu } from 'lucide-react';
import heroRider from '../../images/hero-rider.png';
import streetScene from '../../images/street-scene.png';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-xl">
              O
            </div>
            <span className="font-bold text-xl tracking-tight text-primary">OkadaGo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#safety" className="text-muted-foreground hover:text-foreground transition-colors">Safety</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Stories</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-medium">Log in</Link>
            <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-white hover:bg-primary/90 rounded-full px-6 min-h-10 font-medium transition-colors">
              Ride Now
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 relative overflow-hidden">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary-foreground font-medium text-sm mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Now in Lagos & Accra
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              The city moves <br/>
              <span className="text-primary">at your pace.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Fast, safe, and reliable motorcycle rides. Skip the traffic and get where you need to be with vetted professional riders you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-white hover:bg-primary/90 rounded-full h-14 px-8 text-base font-medium transition-colors">
                Book a Ride Now
              </Link>
              <Link href="/rider/signup" className="inline-flex items-center justify-center rounded-full h-14 px-8 text-base border-2 border-border hover:bg-muted/50 transition-colors">
                Become a Rider
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <p>Trusted by <strong className="text-foreground">50,000+</strong> daily riders</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl transform rotate-12 scale-110" />
            <img 
              src={heroRider.src}
              alt="OkadaGo Rider in Lagos" 
              className="relative z-10 w-full h-auto rounded-3xl shadow-2xl object-cover aspect-[4/5] md:aspect-square"
            />
          </div>
        </div>
      </section>

      {/* Stats/Logos */}
      <section className="py-12 bg-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-primary/10">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">3M+</div>
              <div className="text-sm font-medium text-muted-foreground">Safe Rides</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">&lt; 3min</div>
              <div className="text-sm font-medium text-muted-foreground">Average Wait</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">24/7</div>
              <div className="text-sm font-medium text-muted-foreground">Support</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-1">100%</div>
              <div className="text-sm font-medium text-muted-foreground">Vetted Riders</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Safety */}
      <section id="safety" className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Safety isn't a feature. <br/>It's our foundation.</h2>
            <p className="text-lg text-muted-foreground">
              We've reimagined urban mobility by bringing structure, insurance, and professional training to the streets you know.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8 text-primary" />,
                title: "Vetted Professionals",
                desc: "Every rider passes background checks, rigorous training, and a 50-point vehicle inspection before they can accept a ride."
              },
              {
                icon: <MapPin className="w-8 h-8 text-primary" />,
                title: "Live GPS Tracking",
                desc: "Share your trip status in real-time with loved ones. Our 24/7 control center monitors every ride for anomalies."
              },
              {
                icon: <Clock className="w-8 h-8 text-primary" />,
                title: "Instant Response",
                desc: "In-app SOS button connects you directly to emergency services and our rapid response team anywhere in the city."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-muted/50 border hover:bg-white hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image break */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-3xl overflow-hidden h-[400px] md:h-[500px]">
            <img 
              src={streetScene.src}
              alt="Safe street scene" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white p-6 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">A helmet for every ride.</h2>
                <p className="text-lg text-white/90 mb-8">We provide high-quality DOT-certified helmets for both riders and passengers on every single trip.</p>
                <Link href="/safety-standards" className="inline-flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full h-12 px-8 font-medium transition-colors">
                  Read our safety standards
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-12">Tap, ride, arrive.</h2>
              <div className="space-y-12">
                {[
                  { num: "01", title: "Set your destination", desc: "Enter where you want to go. See the price upfront. No haggling required." },
                  { num: "02", title: "Meet your rider", desc: "A vetted professional arrives in minutes. Match the license plate and put on your provided helmet." },
                  { num: "03", title: "Enjoy the journey", desc: "Zip through traffic safely. Pay seamlessly via card, mobile money, or cash." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-secondary font-bold text-2xl pt-1">{step.num}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-white/70 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] bg-primary-foreground/5 rounded-3xl border border-white/10 p-8 flex flex-col justify-between">
                <div className="w-full bg-white text-foreground rounded-2xl p-4 shadow-2xl transform -rotate-2">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold">Ride to Victoria Island</div>
                    <div className="text-primary font-bold">₦1,200</div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted p-3 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bisi" alt="rider" className="w-8 h-8 rounded-full" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Oluwaseun B.</div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-secondary fill-secondary mr-1" /> 4.9 • KJA-294QB
                      </div>
                    </div>
                  </div>
                  <Link href="/signup" className="inline-flex items-center justify-center w-full mt-4 bg-primary hover:bg-primary/90 rounded-xl min-h-10 text-white font-medium transition-colors">Confirm Ride</Link>
                </div>
                <div className="text-center text-white/50 text-sm italic">Interactive booking experience right in your browser.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Stories from the street.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Chiamaka Eze",
                role: "Marketing Executive, Lagos",
                text: "I used to spend 2 hours in traffic every morning. With OkadaGo, I get to the office in 25 minutes. It's clean, safe, and I actually have time for breakfast now."
              },
              {
                name: "Kwame Osei",
                role: "Student, Accra",
                text: "The upfront pricing is everything. No more arguing over fares in the hot sun. The riders are so polite and always have a clean helmet ready."
              },
              {
                name: "Aisha Mohammed",
                role: "Small Business Owner, Abuja",
                text: "Safety was my biggest concern with bikes. The tracking feature gives my husband peace of mind. I've never felt this safe on a motorcycle before."
              }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border">
                <div className="flex text-secondary mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-lg mb-6 text-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10" />
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto bg-primary rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to beat the traffic?</h2>
            <p className="text-xl text-white/80 mb-10">
              Book a ride directly from your browser. No app download required. Just tap and go.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/signup" className="inline-flex items-center justify-center bg-white text-primary hover:bg-gray-100 rounded-full h-14 px-8 text-lg font-bold transition-colors">
                Book on Web
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-xl">
                  O
                </div>
                <span className="font-bold text-xl tracking-tight">OkadaGo</span>
              </Link>
              <p className="text-white/60 text-sm">
                Moving Africa forward, one safe ride at a time. Fast, reliable, and built for our cities.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Ride</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Drive</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Deliveries</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Business</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><Link href="/safety-standards" className="hover:text-white transition-colors">Safety Guidelines</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm text-white/40">
            &copy; {new Date().getFullYear()} OkadaGo Mobility Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
