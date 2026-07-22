export type FoodCategory = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  popular?: boolean;
};

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  etaMin: number;
  deliveryFee: number;
  color: string;
  address: string;
  latitude: number;
  longitude: number;
  /** Matches ids in FOOD_CATEGORIES for list filtering. */
  categoryIds: string[];
  menu: MenuItem[];
};

/** Brand-aligned chip surfaces (yellow/orange family — works on dark & light). */
export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "fast-food", label: "Fast food", emoji: "🍔", color: "rgba(250, 204, 21, 0.22)" },
  { id: "local", label: "Local", emoji: "🍲", color: "rgba(255, 107, 0, 0.18)" },
  { id: "groceries", label: "Groceries", emoji: "🛒", color: "rgba(250, 204, 21, 0.14)" },
  { id: "healthy", label: "Healthy", emoji: "🥗", color: "rgba(255, 107, 0, 0.12)" },
  { id: "drinks", label: "Drinks", emoji: "🥤", color: "rgba(250, 204, 21, 0.18)" },
  { id: "desserts", label: "Desserts", emoji: "🍰", color: "rgba(255, 107, 0, 0.16)" },
];
