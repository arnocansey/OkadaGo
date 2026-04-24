"use client";

import type { ComponentType } from "react";

import { AuthPages } from "@/okada-ui/screens/okada-auth/AuthPages";
import { LandingPage } from "@/okada-ui/screens/okada-landing/LandingPage";
import PassengerBookRide from "@/okada-ui/screens/okada-mobile-passenger/BookRide";
import PassengerHome from "@/okada-ui/screens/okada-mobile-passenger/Home";
import PassengerProfile from "@/okada-ui/screens/okada-mobile-passenger/Profile";
import PassengerSplash from "@/okada-ui/screens/okada-mobile-passenger/Splash";
import PassengerTracking from "@/okada-ui/screens/okada-mobile-passenger/Tracking";
import PassengerTripComplete from "@/okada-ui/screens/okada-mobile-passenger/TripComplete";
import { ActiveTrip as RiderActiveTrip } from "@/okada-ui/screens/okada-mobile-rider/ActiveTrip";
import { Dashboard as RiderMobileDashboard } from "@/okada-ui/screens/okada-mobile-rider/Dashboard";
import { Earnings as RiderEarnings } from "@/okada-ui/screens/okada-mobile-rider/Earnings";
import { Navigation as RiderNavigation } from "@/okada-ui/screens/okada-mobile-rider/Navigation";
import { RideRequest as RiderRideRequest } from "@/okada-ui/screens/okada-mobile-rider/RideRequest";
import { RiderProfile as RiderMobileProfile } from "@/okada-ui/screens/okada-mobile-rider/RiderProfile";
import { PassengerAccount } from "@/okada-ui/screens/okada-passenger-account/PassengerAccount";
import { BookingDashboard } from "@/okada-ui/screens/okada-passenger-booking/BookingDashboard";
import { RideTracking as PassengerWebTracking } from "@/okada-ui/screens/okada-ride-tracking/RideTracking";
import { RiderDashboard } from "@/okada-ui/screens/okada-rider-dashboard/RiderDashboard";
import { RiderManagement } from "@/okada-ui/screens/okada-rider-management/RiderManagement";
import { RiderOnboarding } from "@/okada-ui/screens/okada-rider-onboarding/RiderOnboarding";
import { AdminDashboard } from "@/okada-ui/screens/okada-admin-dashboard/AdminDashboard";
import { AdminManagement } from "@/okada-ui/screens/okada-admin-management/AdminManagement";
import { AdminPayments } from "@/okada-ui/screens/okada-admin-payments/AdminPayments";
import { AdminSettings } from "@/okada-ui/screens/okada-admin-settings/AdminSettings";

export interface MockupScreenEntry {
  slug: string[];
  group: string;
  title: string;
  component: ComponentType;
  description: string;
}

const PassengerHomeDesktop = () => <BookingDashboard initialBookingState="search" />;
const PassengerSearchingDesktop = () => <BookingDashboard initialBookingState="searching" />;
const PassengerAssignedDesktop = () => <BookingDashboard initialBookingState="assigned" />;
const PassengerProgressDesktop = () => <BookingDashboard initialBookingState="progress" />;
const PassengerHistoryDesktop = () => <PassengerAccount initialTab="history" />;
const PassengerWalletDesktop = () => <PassengerAccount initialTab="wallet" />;
const PassengerProfileDesktop = () => <PassengerAccount initialTab="profile" />;
const PassengerSafetyDesktop = () => <PassengerAccount initialTab="safety" />;
const PassengerRatingDesktop = () => <PassengerAccount initialTab="ratings" />;

const RiderOfflineDesktop = () => <RiderDashboard initialOnline={false} />;
const RiderOnlineDesktop = () => <RiderDashboard initialOnline />;
const RiderDocumentDesktop = () => <RiderOnboarding initialTab="onboarding" initialStep={1} />;
const RiderNavigationDesktop = () => <RiderOnboarding initialTab="navigate" />;
const RiderActiveTripDesktop = () => <RiderOnboarding initialTab="active" />;
const RiderSummaryDesktop = () => <RiderOnboarding initialTab="summary" />;
const RiderEarningsDesktop = () => <RiderManagement initialTab="earnings" />;
const RiderWalletDesktop = () => <RiderManagement initialTab="payout" />;
const RiderRatingsDesktop = () => <RiderManagement initialTab="ratings" />;
const RiderProfileDesktop = () => <RiderManagement initialTab="profile" />;

const AdminRidersDesktop = () => <AdminManagement initialTab="riders" />;
const AdminTripsDesktop = () => <AdminManagement initialTab="trips" />;
const AdminPaymentsDesktop = () => <AdminPayments initialTab="overview" />;
const AdminPromotionsDesktop = () => <AdminPayments initialTab="promos" />;
const AdminNotificationsDesktop = () => <AdminSettings initialTab="templates" />;
const AdminSafetyDesktop = () => <AdminSettings initialTab="safety" />;
const AdminSettingsDesktop = () => <AdminSettings initialTab="general" />;
const PassengerLoginScreen = () => <AuthPages initialAuthState="login" audience="passenger" />;
const PassengerSignupScreen = () => <AuthPages initialAuthState="signup" audience="passenger" />;
const PassengerForgotScreen = () => <AuthPages initialAuthState="forgot" audience="passenger" />;
const RiderLoginScreen = () => <AuthPages initialAuthState="login" audience="rider" />;
const RiderSignupScreen = () => <AuthPages initialAuthState="signup" audience="rider" />;
const RiderForgotScreen = () => <AuthPages initialAuthState="forgot" audience="rider" />;
const AdminLoginScreen = () => <AuthPages initialAuthState="login" audience="admin" />;

export const mockupScreens: MockupScreenEntry[] = [
  {
    slug: ["landing"],
    group: "Combined",
    title: "Landing Page",
    component: LandingPage,
    description: "Current landing page from the new OkadaGo UI pack."
  },

  {
    slug: ["passenger", "onboarding"],
    group: "Passenger mobile",
    title: "Onboarding",
    component: PassengerSplash,
    description: "Passenger splash and onboarding entry flow."
  },
  {
    slug: ["passenger", "login"],
    group: "Passenger mobile",
    title: "Login",
    component: PassengerLoginScreen,
    description: "Shared auth experience for passenger login."
  },
  {
    slug: ["passenger", "signup"],
    group: "Passenger mobile",
    title: "Signup",
    component: PassengerSignupScreen,
    description: "Shared auth experience for passenger signup."
  },
  {
    slug: ["passenger", "forgot-password"],
    group: "Passenger mobile",
    title: "Forgot Password",
    component: PassengerForgotScreen,
    description: "Shared auth recovery state."
  },
  {
    slug: ["passenger", "home"],
    group: "Passenger mobile",
    title: "Home",
    component: PassengerHome,
    description: "Passenger map home screen."
  },
  {
    slug: ["passenger", "ride-confirmation"],
    group: "Passenger mobile",
    title: "Ride Confirmation",
    component: PassengerBookRide,
    description: "Passenger ride selection screen."
  },
  {
    slug: ["passenger", "searching-rider"],
    group: "Passenger mobile",
    title: "Searching Rider",
    component: PassengerTracking,
    description: "Passenger ride search and assignment state."
  },
  {
    slug: ["passenger", "rider-assigned"],
    group: "Passenger mobile",
    title: "Rider Assigned",
    component: PassengerTracking,
    description: "Passenger assigned rider state."
  },
  {
    slug: ["passenger", "live-tracking"],
    group: "Passenger mobile",
    title: "Live Tracking",
    component: PassengerTracking,
    description: "Passenger live ride tracking screen."
  },
  {
    slug: ["passenger", "payment"],
    group: "Passenger mobile",
    title: "Payment",
    component: PassengerTripComplete,
    description: "Passenger post-ride payment and summary state."
  },
  {
    slug: ["passenger", "rating"],
    group: "Passenger mobile",
    title: "Rating",
    component: PassengerTripComplete,
    description: "Passenger rating and completion screen."
  },
  {
    slug: ["passenger", "ride-history"],
    group: "Passenger mobile",
    title: "Ride History",
    component: PassengerProfile,
    description: "Passenger account-focused mobile screen."
  },
  {
    slug: ["passenger", "wallet"],
    group: "Passenger mobile",
    title: "Wallet",
    component: PassengerProfile,
    description: "Passenger wallet and account state."
  },
  {
    slug: ["passenger", "profile"],
    group: "Passenger mobile",
    title: "Profile",
    component: PassengerProfile,
    description: "Passenger profile screen."
  },
  {
    slug: ["passenger", "safety"],
    group: "Passenger mobile",
    title: "Safety",
    component: PassengerProfile,
    description: "Passenger safety and support state."
  },

  {
    slug: ["rider", "onboarding"],
    group: "Rider mobile",
    title: "Onboarding",
    component: RiderOnboarding,
    description: "Rider onboarding flow."
  },
  {
    slug: ["rider", "login"],
    group: "Rider mobile",
    title: "Login",
    component: RiderLoginScreen,
    description: "Shared auth experience for rider login."
  },
  {
    slug: ["rider", "signup"],
    group: "Rider mobile",
    title: "Signup",
    component: RiderSignupScreen,
    description: "Shared auth experience for rider signup."
  },
  {
    slug: ["rider", "forgot-password"],
    group: "Rider mobile",
    title: "Forgot Password",
    component: RiderForgotScreen,
    description: "Shared auth recovery state."
  },
  {
    slug: ["rider", "document-upload"],
    group: "Rider mobile",
    title: "Document Upload",
    component: RiderOnboarding,
    description: "Rider onboarding and document upload state."
  },
  {
    slug: ["rider", "home-offline"],
    group: "Rider mobile",
    title: "Home Offline",
    component: RiderMobileDashboard,
    description: "Rider dashboard state."
  },
  {
    slug: ["rider", "home-online"],
    group: "Rider mobile",
    title: "Home Online",
    component: RiderMobileDashboard,
    description: "Rider online dashboard state."
  },
  {
    slug: ["rider", "incoming-trip"],
    group: "Rider mobile",
    title: "Incoming Trip",
    component: RiderRideRequest,
    description: "Incoming trip request modal."
  },
  {
    slug: ["rider", "navigation"],
    group: "Rider mobile",
    title: "Navigation",
    component: RiderNavigation,
    description: "Rider navigation to pickup."
  },
  {
    slug: ["rider", "active-trip"],
    group: "Rider mobile",
    title: "Active Trip",
    component: RiderActiveTrip,
    description: "Rider active trip screen."
  },
  {
    slug: ["rider", "earnings-dashboard"],
    group: "Rider mobile",
    title: "Earnings Dashboard",
    component: RiderEarnings,
    description: "Rider earnings screen."
  },
  {
    slug: ["rider", "wallet"],
    group: "Rider mobile",
    title: "Wallet",
    component: RiderEarnings,
    description: "Rider wallet and payout state."
  },
  {
    slug: ["rider", "ratings"],
    group: "Rider mobile",
    title: "Ratings",
    component: RiderMobileProfile,
    description: "Rider profile and ratings state."
  },
  {
    slug: ["rider", "profile"],
    group: "Rider mobile",
    title: "Profile",
    component: RiderMobileProfile,
    description: "Rider profile screen."
  },

  {
    slug: ["admin", "login"],
    group: "Admin",
    title: "Login",
    component: AdminLoginScreen,
    description: "Shared auth experience for admin login."
  },
  {
    slug: ["admin", "overview"],
    group: "Admin",
    title: "Overview",
    component: AdminDashboard,
    description: "Admin overview dashboard."
  },
  {
    slug: ["admin", "riders"],
    group: "Admin",
    title: "Riders",
    component: AdminManagement,
    description: "Admin rider management module."
  },
  {
    slug: ["admin", "passengers"],
    group: "Admin",
    title: "Passengers",
    component: AdminManagement,
    description: "Admin passenger management module."
  },
  {
    slug: ["admin", "payments"],
    group: "Admin",
    title: "Payments",
    component: AdminPayments,
    description: "Admin payments module."
  },
  {
    slug: ["admin", "live-map"],
    group: "Admin",
    title: "Live Map",
    component: AdminDashboard,
    description: "Admin live operations map area."
  },
  {
    slug: ["admin", "promotions"],
    group: "Admin",
    title: "Promotions",
    component: AdminManagement,
    description: "Admin campaign and promotion tools."
  },
  {
    slug: ["admin", "notifications"],
    group: "Admin",
    title: "Notifications",
    component: AdminManagement,
    description: "Admin announcements and notifications state."
  },
  {
    slug: ["admin", "safety"],
    group: "Admin",
    title: "Safety",
    component: AdminManagement,
    description: "Admin incident and safety management."
  },
  {
    slug: ["admin", "settings"],
    group: "Admin",
    title: "Settings",
    component: AdminSettings,
    description: "Admin settings module."
  },

  {
    slug: ["web", "passenger-app-web"],
    group: "Web",
    title: "Passenger App Web",
    component: BookingDashboard,
    description: "Desktop passenger booking dashboard."
  },
  {
    slug: ["web", "rider-app-web"],
    group: "Web",
    title: "Rider App Web",
    component: RiderDashboard,
    description: "Desktop rider dashboard."
  },
  {
    slug: ["web", "passenger-home"],
    group: "Web flow",
    title: "Passenger Home Desktop",
    component: PassengerHomeDesktop,
    description: "Desktop booking home state."
  },
  {
    slug: ["web", "passenger-ride-confirmation"],
    group: "Web flow",
    title: "Passenger Ride Confirmation Desktop",
    component: PassengerHomeDesktop,
    description: "Desktop booking confirmation state."
  },
  {
    slug: ["web", "passenger-searching-rider"],
    group: "Web flow",
    title: "Passenger Searching Desktop",
    component: PassengerSearchingDesktop,
    description: "Desktop ride search state."
  },
  {
    slug: ["web", "passenger-rider-assigned"],
    group: "Web flow",
    title: "Passenger Assigned Desktop",
    component: PassengerAssignedDesktop,
    description: "Desktop assigned-rider state."
  },
  {
    slug: ["web", "passenger-live-tracking"],
    group: "Web flow",
    title: "Passenger Live Tracking Desktop",
    component: PassengerWebTracking,
    description: "Desktop live ride tracking."
  },
  {
    slug: ["web", "passenger-payment"],
    group: "Web flow",
    title: "Passenger Payment Desktop",
    component: PassengerWalletDesktop,
    description: "Desktop wallet and payment state."
  },
  {
    slug: ["web", "passenger-rating"],
    group: "Web flow",
    title: "Passenger Rating Desktop",
    component: PassengerRatingDesktop,
    description: "Desktop ratings and reviews state."
  },
  {
    slug: ["web", "passenger-ride-history"],
    group: "Web flow",
    title: "Passenger Ride History Desktop",
    component: PassengerHistoryDesktop,
    description: "Desktop ride history state."
  },
  {
    slug: ["web", "passenger-wallet"],
    group: "Web flow",
    title: "Passenger Wallet Desktop",
    component: PassengerWalletDesktop,
    description: "Desktop wallet view."
  },
  {
    slug: ["web", "passenger-profile"],
    group: "Web flow",
    title: "Passenger Profile Desktop",
    component: PassengerProfileDesktop,
    description: "Desktop passenger account profile."
  },
  {
    slug: ["web", "passenger-safety"],
    group: "Web flow",
    title: "Passenger Safety Desktop",
    component: PassengerSafetyDesktop,
    description: "Desktop safety and SOS view."
  },
  {
    slug: ["web", "rider-document-upload"],
    group: "Web flow",
    title: "Rider Document Upload Desktop",
    component: RiderDocumentDesktop,
    description: "Desktop rider onboarding and document upload."
  },
  {
    slug: ["web", "rider-home-offline"],
    group: "Web flow",
    title: "Rider Home Offline Desktop",
    component: RiderOfflineDesktop,
    description: "Desktop rider dashboard while offline."
  },
  {
    slug: ["web", "rider-home-online"],
    group: "Web flow",
    title: "Rider Home Online Desktop",
    component: RiderOnlineDesktop,
    description: "Desktop rider dashboard while online."
  },
  {
    slug: ["web", "rider-incoming-trip"],
    group: "Web flow",
    title: "Rider Incoming Trip Desktop",
    component: RiderOnlineDesktop,
    description: "Desktop rider request-ready state."
  },
  {
    slug: ["web", "rider-navigation"],
    group: "Web flow",
    title: "Rider Navigation Desktop",
    component: RiderNavigationDesktop,
    description: "Desktop rider pickup navigation state."
  },
  {
    slug: ["web", "rider-active-trip"],
    group: "Web flow",
    title: "Rider Active Trip Desktop",
    component: RiderActiveTripDesktop,
    description: "Desktop rider active-trip state."
  },
  {
    slug: ["web", "rider-earnings-dashboard"],
    group: "Web flow",
    title: "Rider Earnings Desktop",
    component: RiderEarningsDesktop,
    description: "Desktop earnings dashboard."
  },
  {
    slug: ["web", "rider-wallet"],
    group: "Web flow",
    title: "Rider Wallet Desktop",
    component: RiderWalletDesktop,
    description: "Desktop payout and wallet state."
  },
  {
    slug: ["web", "rider-ratings"],
    group: "Web flow",
    title: "Rider Ratings Desktop",
    component: RiderRatingsDesktop,
    description: "Desktop rider ratings and feedback state."
  },
  {
    slug: ["web", "rider-profile"],
    group: "Web flow",
    title: "Rider Profile Desktop",
    component: RiderProfileDesktop,
    description: "Desktop rider profile settings."
  },
  {
    slug: ["web", "admin-overview"],
    group: "Web flow",
    title: "Admin Overview Desktop",
    component: AdminDashboard,
    description: "Desktop admin overview."
  },
  {
    slug: ["web", "admin-riders"],
    group: "Web flow",
    title: "Admin Riders Desktop",
    component: AdminRidersDesktop,
    description: "Desktop rider management state."
  },
  {
    slug: ["web", "admin-passengers"],
    group: "Web flow",
    title: "Admin Passengers Desktop",
    component: AdminRidersDesktop,
    description: "Desktop account management state."
  },
  {
    slug: ["web", "admin-payments"],
    group: "Web flow",
    title: "Admin Payments Desktop",
    component: AdminPaymentsDesktop,
    description: "Desktop payments overview."
  },
  {
    slug: ["web", "admin-live-map"],
    group: "Web flow",
    title: "Admin Live Map Desktop",
    component: AdminDashboard,
    description: "Desktop live operations dashboard."
  },
  {
    slug: ["web", "admin-promotions"],
    group: "Web flow",
    title: "Admin Promotions Desktop",
    component: AdminPromotionsDesktop,
    description: "Desktop promo-code management."
  },
  {
    slug: ["web", "admin-notifications"],
    group: "Web flow",
    title: "Admin Notifications Desktop",
    component: AdminNotificationsDesktop,
    description: "Desktop notifications template view."
  },
  {
    slug: ["web", "admin-safety"],
    group: "Web flow",
    title: "Admin Safety Desktop",
    component: AdminSafetyDesktop,
    description: "Desktop safety and incident management."
  },
  {
    slug: ["web", "admin-settings"],
    group: "Web flow",
    title: "Admin Settings Desktop",
    component: AdminSettingsDesktop,
    description: "Desktop platform settings view."
  },

  {
    slug: ["combined", "passenger-app"],
    group: "Combined",
    title: "Passenger App Showcase",
    component: PassengerAccount,
    description: "Passenger combined account and wallet experience."
  },
  {
    slug: ["combined", "rider-app"],
    group: "Combined",
    title: "Rider App Showcase",
    component: RiderManagement,
    description: "Rider desktop operations showcase."
  },
  {
    slug: ["combined", "admin-dashboard"],
    group: "Combined",
    title: "Admin Dashboard Showcase",
    component: AdminDashboard,
    description: "Combined admin dashboard showcase."
  },
  {
    slug: ["combined", "ride-tracking"],
    group: "Combined",
    title: "Ride Tracking Showcase",
    component: PassengerWebTracking,
    description: "Desktop ride tracking experience."
  }
];

export function findMockupScreen(slug: string[]) {
  return mockupScreens.find((entry) => entry.slug.join("/") === slug.join("/")) ?? null;
}

export function groupedMockupScreens() {
  return mockupScreens.reduce<Record<string, MockupScreenEntry[]>>((groups, entry) => {
    groups[entry.group] ??= [];
    groups[entry.group].push(entry);
    return groups;
  }, {});
}
