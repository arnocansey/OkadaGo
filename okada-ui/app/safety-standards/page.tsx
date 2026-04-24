import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  BadgeCheck,
  HeartPulse,
  ShieldCheck,
  Smartphone,
  UserCheck
} from "lucide-react";
import { ImmersivePage } from "@/components/layout/immersive-page";
import streetScene from "@/okada-ui/images/street-scene.png";

export const metadata = {
  title: "Safety Standards | OkadaGo"
};

const standards = [
  {
    icon: UserCheck,
    title: "Verified riders only",
    description:
      "Every rider goes through identity verification, document review, vehicle inspection, and onboarding before they can accept trips on OkadaGo."
  },
  {
    icon: ShieldCheck,
    title: "Protective gear on every trip",
    description:
      "Helmet compliance, rider safety checks, and trip monitoring are part of the operating standard, not optional extras."
  },
  {
    icon: Smartphone,
    title: "Live trip visibility",
    description:
      "Trips are designed to be trackable, shareable, and reviewable so passengers, riders, and support teams can respond quickly when something feels off."
  },
  {
    icon: BellRing,
    title: "Emergency response flow",
    description:
      "In-app escalation, support review, and incident handling are structured so urgent safety reports move fast and get human attention."
  },
  {
    icon: BadgeCheck,
    title: "Professional conduct standards",
    description:
      "Riders are expected to maintain respectful conduct, clean equipment, honest pricing behavior, and zero tolerance for harassment or intimidation."
  },
  {
    icon: HeartPulse,
    title: "Continuous review",
    description:
      "We use trip feedback, support incidents, and operational audits to improve rider quality, route safety, and platform response policies over time."
  }
];

const commitments = [
  "We do not treat safety as a hidden settings item. It is a public promise.",
  "We investigate serious incidents and can suspend riders, trips, or access when necessary.",
  "We design for Ghana-first urban conditions, including low-bandwidth resilience and fast support escalation.",
  "We keep improving standards as the platform grows across more cities."
];

export default function SafetyStandardsPage() {
  return (
    <ImmersivePage className="safety-standards-page">
      <section className="safety-standards-hero">
        <div className="safety-standards-hero-media">
          <img src={streetScene.src} alt="OkadaGo rider safety journey" />
        </div>

        <div className="exact-landing-container safety-standards-hero-shell">
          <div className="safety-standards-topbar">
            <Link href="/" className="safety-standards-backlink">
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <div className="safety-standards-kicker">OkadaGo Trust & Safety</div>
          </div>

          <div className="safety-standards-hero-grid">
            <div className="safety-standards-hero-copy">
              <span className="safety-standards-pill">Public standards</span>
              <h1>Safety is not a hidden feature. It is the operating standard.</h1>
              <p>
                OkadaGo is designed around rider verification, helmet discipline, live trip visibility,
                support escalation, and professional conduct rules that should be visible before anyone books.
              </p>

              <div className="safety-standards-actions">
                <Link href="/signup" className="safety-standards-primary">
                  Book with confidence <ArrowRight size={16} />
                </Link>
                <Link href="/rider/signup" className="safety-standards-secondary">
                  Become a rider
                </Link>
              </div>
            </div>

            <aside className="safety-standards-baseline-card">
              <p className="safety-standards-section-label">Our baseline</p>
              <div className="safety-standards-baseline-grid">
                <div>
                  <strong>100%</strong>
                  <span>active riders are expected to pass onboarding checks before they go live</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>operations-aware support mindset for active trips and incident review</span>
                </div>
                <div>
                  <strong>Zero tolerance</strong>
                  <span>for harassment, intimidation, or fraudulent ride behavior</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="safety-standards-section">
        <div className="exact-landing-container safety-standards-story">
          <div className="safety-standards-story-copy">
            <p className="safety-standards-section-label">What this covers</p>
            <h2>The practical rules behind a safer ride experience.</h2>
            <p>
              These standards shape who gets onboarded, what riders must maintain, how trips are monitored,
              and how the platform reacts when something feels wrong.
            </p>
          </div>

          <div className="safety-standards-commitments-card">
            {commitments.map((commitment) => (
              <div key={commitment} className="safety-standards-commitment">
                <span className="safety-standards-commitment-dot" />
                <p>{commitment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="safety-standards-section safety-standards-band">
        <div className="exact-landing-container">
          <div className="safety-standards-grid">
            {standards.map((standard) => {
              const Icon = standard.icon;

              return (
                <article key={standard.title} className="safety-standards-card">
                  <div className="safety-standards-card-icon">
                    <Icon size={24} />
                  </div>
                  <h3>{standard.title}</h3>
                  <p>{standard.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="safety-standards-section">
        <div className="exact-landing-container safety-standards-response">
          <div className="safety-standards-response-main">
            <p className="safety-standards-section-label">When something goes wrong</p>
            <h2>Response matters as much as prevention.</h2>
            <p>
              A safety page should not just promise prevention. It should explain what happens when a rider
              or passenger needs help, wants to report an issue, or expects action from the platform.
            </p>
          </div>

          <aside className="safety-standards-response-panel">
            <div className="safety-standards-response-item">
              <h3>1. Report quickly</h3>
              <p>Passengers and riders should be able to raise a concern during or after the trip without friction.</p>
            </div>
            <div className="safety-standards-response-item">
              <h3>2. Review and escalate</h3>
              <p>Support teams should assess urgency, preserve trip context, and escalate serious incidents fast.</p>
            </div>
            <div className="safety-standards-response-item">
              <h3>3. Take action</h3>
              <p>Accounts, trip access, and rider status can be restricted when standards are breached.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="safety-standards-section">
        <div className="exact-landing-container">
          <div className="safety-standards-cta">
            <div>
              <p className="safety-standards-section-label">Built for trust</p>
              <h2>Clear standards help riders and passengers know what OkadaGo stands for.</h2>
            </div>
            <div className="safety-standards-actions">
              <Link href="/signup" className="safety-standards-primary">
                Start riding
              </Link>
              <Link href="/" className="safety-standards-secondary">
                Return home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ImmersivePage>
  );
}
