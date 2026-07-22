"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../ui/button';
import { ChevronRight, Shield, Clock, MapPin, Star, Menu, X } from 'lucide-react';
import { BrandMark } from "@/components/brand/BrandMark";
import heroRider from "../../images/hero-rider.png";
import streetScene from "../../images/street-scene.png";
import { useToastAndLoader } from "@/components/providers/toast-and-loader-provider";

// Motion Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
} as const;

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
} as const;

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#safety", label: "Safety" },
  { href: "#testimonials", label: "Stories" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingPage() {
  const router = useRouter();
  const { showToast, showLoader, hideLoader } = useToastAndLoader();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleConfirmRide = (e: React.MouseEvent) => {
    e.preventDefault();
    showLoader("Searching for nearby riders...");
    setTimeout(() => {
      hideLoader();
      showToast("Rider Assigned: Oluwaseun B. (4.9★) is 2 mins away!", "success");
      setTimeout(() => {
        router.push("/signup");
      }, 1500);
    }, 2000);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
            <BrandMark variant="wordmark" height={28} priority />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block text-sm font-medium">Log in</Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
              <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-[#0a0b0d] hover:bg-primary/90 rounded-full px-6 min-h-10 font-medium transition-colors">
                Ride Now
              </Link>
            </motion.div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen ? (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="md:hidden overflow-hidden border-t bg-white"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="mt-2 flex flex-col gap-2 border-t pt-3">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="inline-flex items-center justify-center bg-primary text-[#0a0b0d] hover:bg-primary/90 rounded-full px-6 min-h-11 font-medium transition-colors"
                  >
                    Ride Now
                  </Link>
                </div>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      {/* Hero — full-bleed brand composition */}
      <section className="relative min-h-[100svh] flex items-end overflow-hidden">
        <motion.img
          initial={{ scale: 1.06, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          src={heroRider.src}
          alt="OkadaGo rider on the road"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/55 to-[#0a0b0d]/25" />
        <div className="relative z-10 w-full px-4 pb-16 pt-32 md:pb-24 md:pt-40">
          <div className="container mx-auto max-w-3xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-white"
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <BrandMark variant="wordmark" onDark height={40} priority />
              </motion.div>
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.08] mb-5 max-w-2xl"
              >
                City rides that keep moving.
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-white/80 mb-8 max-w-xl leading-relaxed"
              >
                Fast, insured motorcycle trips across Accra with vetted riders you can trust.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center bg-primary text-[#0a0b0d] hover:bg-primary/90 rounded-full h-14 px-8 text-base font-semibold transition-colors w-full sm:w-auto"
                  >
                    Book a ride
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/rider/signup"
                    className="inline-flex items-center justify-center rounded-full h-14 px-8 text-base border border-white/35 text-white hover:bg-white/10 transition-colors w-full sm:w-auto"
                  >
                    Drive with OkadaGo
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works teaser */}
      <section className="py-16 bg-primary/5 border-b">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            {[
              { title: "Request", body: "Set pickup and destination in seconds." },
              { title: "Match", body: "A nearby vetted rider accepts your trip." },
              { title: "Arrive", body: "Live tracking and in-app SOS the whole way." }
            ].map((item) => (
              <motion.div key={item.title} variants={fadeInUp}>
                <div className="text-xl font-bold text-[#0a0b0d] mb-2">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.body}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features/Safety */}
      <section id="safety" className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Safety isn't a feature. <br/>It's our foundation.</h2>
            <p className="text-lg text-muted-foreground">
              We've reimagined urban mobility by bringing structure, insurance, and professional training to the streets you know.
            </p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Shield className="w-8 h-8 text-[#8a6c00]" />,
                title: "Vetted Professionals",
                desc: "Every rider passes background checks, rigorous training, and a 50-point vehicle inspection before they can accept a ride."
              },
              {
                icon: <MapPin className="w-8 h-8 text-[#8a6c00]" />,
                title: "Live GPS Tracking",
                desc: "Share your trip status in real-time with loved ones. Our 24/7 control center monitors every ride for anomalies."
              },
              {
                icon: <Clock className="w-8 h-8 text-[#8a6c00]" />,
                title: "Instant Response",
                desc: "In-app SOS button connects you directly to emergency services and our rapid response team anywhere in the city."
              }
            ].map((feature, i) => (
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                key={i} 
                className="p-8 rounded-2xl bg-muted/50 border hover:bg-white transition-all duration-300 group cursor-default"
              >
                <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Image break */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            className="relative rounded-3xl overflow-hidden h-[400px] md:h-[500px]"
          >
            <motion.img 
              initial={{ scale: 1.05 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src={streetScene.src}
              alt="Safe street scene" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="text-center text-white p-6 max-w-2xl"
              >
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-4">A helmet for every ride.</motion.h2>
                <motion.p variants={fadeInUp} className="text-lg text-white/90 mb-8">We provide high-quality DOT-certified helmets for both riders and passengers on every single trip.</motion.p>
                <motion.div variants={fadeInUp} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Link href="/safety-standards" className="inline-flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full h-12 px-8 font-medium transition-colors">
                    Read our safety standards
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-[#0a0b0d] text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInLeft}
            >
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
            </motion.div>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={slideInRight}
              className="relative"
            >
              <div className="aspect-[4/5] bg-primary-foreground/5 rounded-3xl border border-white/10 p-8 flex flex-col justify-between">
                <div className="w-full bg-white text-foreground rounded-2xl p-4 shadow-2xl transform -rotate-2">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold">Ride to Victoria Island</div>
                    <div className="text-[#8a6c00] font-bold">₦1,200</div>
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
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <button
                      onClick={handleConfirmRide}
                      className="flex items-center justify-center w-full mt-4 bg-primary hover:bg-primary/90 rounded-xl min-h-10 text-[#0a0b0d] font-medium transition-colors outline-none border-none cursor-pointer"
                    >
                      Confirm Ride
                    </button>
                  </motion.div>
                </div>
                <div className="text-center text-white/50 text-sm italic">Interactive booking experience right in your browser.</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-center mb-16"
          >
            Stories from the street.
          </motion.h2>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
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
              <motion.div 
                variants={fadeInUp}
                whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
                key={i} 
                className="bg-white p-8 rounded-2xl shadow-sm border transition-all duration-300 cursor-default"
              >
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            className="bg-[#0a0b0d] rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to beat the traffic?</h2>
              <p className="text-xl text-white/80 mb-10">
                Book a ride directly from your browser. No app download required. Just tap and go.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/signup" className="inline-flex items-center justify-center bg-primary text-[#0a0b0d] hover:bg-primary/90 rounded-full h-14 px-8 text-lg font-bold transition-colors">
                    Book on Web
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-[#0a0b0d] font-bold text-xl">
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
