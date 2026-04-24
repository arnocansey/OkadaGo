export type FlowArea = "passenger" | "rider" | "admin";

export type FlowScreen = {
  screen: string;
  title: string;
  protected?: boolean;
};

export const flowConfig: Record<FlowArea, FlowScreen[]> = {
  passenger: [
    { screen: "onboarding", title: "Onboarding" },
    { screen: "login", title: "Login" },
    { screen: "signup", title: "Signup" },
    { screen: "forgot-password", title: "Forgot Password" },
    { screen: "home", title: "Home", protected: true },
    { screen: "ride-confirmation", title: "Ride Confirmation", protected: true },
    { screen: "searching-rider", title: "Searching Rider", protected: true },
    { screen: "rider-assigned", title: "Rider Assigned", protected: true },
    { screen: "live-tracking", title: "Live Tracking", protected: true },
    { screen: "payment", title: "Payment", protected: true },
    { screen: "rating", title: "Rating", protected: true },
    { screen: "ride-history", title: "Ride History", protected: true },
    { screen: "wallet", title: "Wallet", protected: true },
    { screen: "profile", title: "Profile", protected: true },
    { screen: "safety", title: "Safety", protected: true }
  ],
  rider: [
    { screen: "onboarding", title: "Onboarding" },
    { screen: "login", title: "Login" },
    { screen: "signup", title: "Signup" },
    { screen: "forgot-password", title: "Forgot Password" },
    { screen: "document-upload", title: "Document Upload", protected: true },
    { screen: "home-offline", title: "Home Offline", protected: true },
    { screen: "home-online", title: "Home Online", protected: true },
    { screen: "incoming-trip", title: "Incoming Trip", protected: true },
    { screen: "navigation", title: "Navigation", protected: true },
    { screen: "active-trip", title: "Active Trip", protected: true },
    { screen: "earnings-dashboard", title: "Earnings Dashboard", protected: true },
    { screen: "wallet", title: "Wallet", protected: true },
    { screen: "ratings", title: "Ratings", protected: true },
    { screen: "profile", title: "Profile", protected: true }
  ],
  admin: [
    { screen: "login", title: "Login" },
    { screen: "overview", title: "Overview", protected: true },
    { screen: "riders", title: "Riders", protected: true },
    { screen: "passengers", title: "Passengers", protected: true },
    { screen: "payments", title: "Payments", protected: true },
    { screen: "live-map", title: "Live Map", protected: true },
    { screen: "promotions", title: "Promotions", protected: true },
    { screen: "notifications", title: "Notifications", protected: true },
    { screen: "safety", title: "Safety", protected: true },
    { screen: "settings", title: "Settings", protected: true }
  ]
};

export function getFlowScreen(area: FlowArea, screen: string) {
  return flowConfig[area].find((entry) => entry.screen === screen) ?? null;
}

export function getFlowNeighbors(area: FlowArea, screen: string) {
  const items = flowConfig[area];
  const currentIndex = items.findIndex((entry) => entry.screen === screen);

  return {
    previous: currentIndex > 0 ? items[currentIndex - 1] : null,
    next: currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null
  };
}

