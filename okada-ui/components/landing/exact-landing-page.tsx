"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  Menu,
  Moon,
  Navigation,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  X,
  Zap
} from "lucide-react";
import authBg from "@/okada-ui/images/auth-bg.png";
import heroRider from "@/okada-ui/images/hero-rider.png";
import streetScene from "@/okada-ui/images/street-scene.png";
import { ImmersivePage } from "@/components/layout/immersive-page";

const features = [
  {
    icon: Zap,
    title: "Cut Through the Noise",
    description:
      "Don't sit in gridlock. Our riders know the city's fastest routes. Get to your meeting, flight, or date on time, every time."
  },
  {
    icon: ShieldCheck,
    title: "Verified & Secure",
    description:
      "Every rider is background-checked, trained, and tracked in real-time. Share your trip status with loved ones instantly."
  },
  {
    icon: CreditCard,
    title: "Transparent Pricing",
    description:
      "No haggling. Know the exact fare before you book. Pay seamlessly with card, transfer, or cash."
  }
];

const cities = [
  { city: "Accra", base: "₵10", perKm: "₵3", active: true },
  { city: "Kumasi", base: "₵8", perKm: "₵2.5", active: true },
  { city: "Tema", base: "₵9", perKm: "₵2.8", active: false },
  { city: "Takoradi", base: "₵8", perKm: "₵2.4", active: false }
];

const testimonials = [
  {
    quote:
      "I used to lose so much time moving from East Legon into Osu each morning. OkadaGo turned that into a fast, reliable ride I can actually plan around.",
    author: "Akosua A.",
    role: "Product Designer"
  },
  {
    quote:
      "The helmets are clean, the riders are professional, and the app feels fast even on a weak connection. This is exactly the bike service Accra needed.",
    author: "Kwame E.",
    role: "Marketing Manager"
  },
  {
    quote:
      "As a rider, the instant mobile money payouts mean I do not have to chase my earnings. The app is easy to use and I stay busy.",
    author: "Kojo O.",
    role: "OkadaGo Partner"
  }
];

export function ExactLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ImmersivePage className={`exact-landing-page${dark ? " dark" : ""}`}>
      <button
        onClick={() => setDark((current) => !current)}
        className="exact-landing-theme-toggle"
        aria-label="Toggle dark mode"
        type="button"
      >
        {dark ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      <nav className={`exact-landing-nav${isScrolled ? " scrolled" : ""}`}>
        <div className="exact-landing-container exact-landing-nav-inner">
          <Link href="/" className="exact-landing-brand">
            <div className="exact-landing-brandmark">OK</div>
            <span>OKADAGO</span>
          </Link>

          <div className="exact-landing-nav-links">
            <a href="#ride">Ride</a>
            <a href="#drive">Drive</a>
            <a href="#safety">Safety</a>
            <a href="#cities">Cities</a>
          </div>

          <div className="exact-landing-nav-actions">
            <Link href="/login" className="exact-landing-text-button">
              Log in
            </Link>
            <Link href="/signup" className="exact-landing-pill-button">
              Sign up
            </Link>
          </div>

          <button
            className="exact-landing-mobile-toggle"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="exact-landing-mobile-menu">
            <a href="#ride" onClick={() => setMobileMenuOpen(false)}>
              Ride
            </a>
            <a href="#drive" onClick={() => setMobileMenuOpen(false)}>
              Drive
            </a>
            <a href="#safety" onClick={() => setMobileMenuOpen(false)}>
              Safety
            </a>
            <a href="#cities" onClick={() => setMobileMenuOpen(false)}>
              Cities
            </a>
            <Link href="/login" className="exact-landing-outline-button">
              Log in
            </Link>
            <Link href="/signup" className="exact-landing-pill-button block">
              Sign up
            </Link>
          </div>
        ) : null}
      </nav>

      <section className="exact-landing-hero">
        <div className="exact-landing-hero-media">
          <img src={streetScene.src} alt="Accra street at night" />
        </div>
        <div className="exact-landing-container exact-landing-hero-grid">
          <div className="exact-landing-hero-copy">
            <div className="exact-landing-badge">
              <Zap size={14} /> Now active in Accra & Kumasi
            </div>
            <h1>
              Beat The <br />
              <span>Traffic.</span>
            </h1>
            <p>
              The fastest, most reliable motorcycle rides in the city. When time is money, OkadaGo gets you there.
            </p>

            <div className="exact-landing-booking-card">
              <div className="exact-booking-fields">
                <label className="exact-booking-field pickup">
                  <span className="marker" />
                  <input placeholder="Enter pickup location" />
                </label>
                <label className="exact-booking-field destination">
                  <span className="marker square" />
                  <input placeholder="Where to?" />
                </label>
              </div>
              <button className="exact-landing-book-button" type="button">
                See Prices <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="exact-landing-phone-stage">
            <div className="exact-landing-phone-glow" />
            <img className="exact-landing-phone" src={heroRider.src} alt="OkadaGo rider" />

            <div className="exact-floating-card assigned">
              <div className="exact-floating-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <span>Driver assigned</span>
                <strong>Kwame - 2 mins away</strong>
              </div>
            </div>

            <div className="exact-floating-card fare">
              <strong>₵35</strong>
              <div className="divider" />
              <span>Osu to Airport Residential</span>
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="exact-landing-section exact-landing-feature-band">
        <div className="exact-landing-container exact-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article key={feature.title} className="exact-feature-card">
                <div className="exact-feature-icon">
                  <Icon size={28} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="drive" className="exact-landing-section">
        <div className="exact-landing-container">
          <div className="exact-driver-cta">
            <div className="exact-driver-copy">
              <div className="exact-inverse-badge">For Drivers</div>
              <h2>
                Own Your <br />
                <span>Hustle.</span>
              </h2>
              <p>
                Join thousands of OkadaGo riders earning on their own schedule. Keep more of what you make with our industry-low 12% commission.
              </p>

              <ul className="exact-driver-list">
                <li>Daily instant payouts to your bank account</li>
                <li>Free accident and health insurance coverage</li>
                <li>24/7 dedicated rider support line</li>
                <li>Bonus incentives during rush hours</li>
              </ul>

              <Link href="/rider/signup" className="exact-driver-button">
                Sign Up to Drive <ChevronRight size={18} />
              </Link>
            </div>

            <div className="exact-driver-image-wrap">
              <img src={heroRider.src} alt="OkadaGo driver" />
            </div>
          </div>
        </div>
      </section>

      <section id="cities" className="exact-landing-section exact-city-band">
        <div className="exact-landing-container">
          <div className="exact-landing-section-title">
            <h2>Affordable wherever you go</h2>
            <p>
              We're expanding across West Africa to bring reliable transportation to every major city.
            </p>
          </div>

          <div className="exact-city-grid">
            <div className="exact-city-list">
              {cities.map((city) => (
                <article
                  key={city.city}
                  className={`exact-city-card${city.active ? " active" : " inactive"}`}
                >
                  <div className="exact-city-main">
                    <div className="exact-city-icon">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h4>
                        {city.city}
                        {city.active ? <span className="live-dot" /> : <em>Coming Soon</em>}
                      </h4>
                      {city.active ? <p>Available 24/7</p> : null}
                    </div>
                  </div>

                  {city.active ? (
                    <div className="exact-city-pricing">
                      <strong>
                        {city.base} <span>Base</span>
                      </strong>
                      <p>+{city.perKm}/km</p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="exact-city-stage">
              <img src={authBg.src} alt="Accra skyline" />
              <div className="exact-city-overlay">
                <div className="exact-city-overlay-head">
                  <Navigation size={18} />
                  <span>Live Operations</span>
                </div>
                <h3>Accra Central Hub</h3>
                <p>Average wait time in Osu and Airport Residential: less than 3 minutes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="exact-landing-section exact-testimonial-section">
        <div className="exact-landing-container">
          <h2 className="exact-testimonial-title">
            Street <span>Cred.</span>
          </h2>

          <div className="exact-testimonial-grid">
            {testimonials.map((item) => (
              <article key={item.author} className="exact-testimonial-card">
                <div className="exact-stars-row">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} size={18} />
                  ))}
                </div>
                <p>"{item.quote}"</p>
                <div className="exact-testimonial-author">
                  <div className="exact-testimonial-avatar">{item.author.charAt(0)}</div>
                  <div>
                    <strong>{item.author}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="exact-landing-section">
        <div className="exact-landing-container">
          <div className="exact-download-cta">
            <h2>Ready to ride?</h2>
            <p>
              Download the OkadaGo app now. Get 50% off your first 3 rides with code{" "}
              <span>ACCRA50</span>
            </p>
            <div className="exact-download-buttons">
              <button type="button">
                <Smartphone size={20} />
                App Store
              </button>
              <button type="button">
                <Smartphone size={20} />
                Google Play
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="exact-landing-footer">
        <div className="exact-landing-container exact-footer-grid">
          <div className="exact-footer-brandcol">
            <Link href="/" className="exact-landing-brand">
              <div className="exact-landing-brandmark">OK</div>
              <span>OKADAGO</span>
            </Link>
            <p>
              Moving cities forward. Fast, safe, and reliable motorcycle rides across West Africa.
            </p>
          </div>

          <div>
            <h4>Company</h4>
            <ul>
              <li>About Us</li>
              <li>Careers</li>
              <li>Press</li>
              <li>Blog</li>
            </ul>
          </div>

          <div>
            <h4>Products</h4>
            <ul>
              <li>Ride</li>
              <li>Drive</li>
              <li>OkadaGo for Business</li>
              <li>Safety</li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <ul>
              <li>Help Center</li>
              <li>+233 OKADAGO APP</li>
              <li>hello@okada.app</li>
              <li>Airport Residential, Accra</li>
            </ul>
          </div>
        </div>

        <div className="exact-landing-container exact-footer-bottom">
          <p>&copy; 2026 OkadaGo Technologies Ltd. All rights reserved.</p>
          <div>
            <a href="/">Terms</a>
            <a href="/">Privacy</a>
          </div>
        </div>
      </footer>
    </ImmersivePage>
  );
}
