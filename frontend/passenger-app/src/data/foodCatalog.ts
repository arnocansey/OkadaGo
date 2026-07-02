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

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "fast-food", label: "Fast food", emoji: "🍔", color: "#FEF3C7" },
  { id: "local", label: "Local", emoji: "🍲", color: "#D1FAE5" },
  { id: "groceries", label: "Groceries", emoji: "🛒", color: "#DBEAFE" },
  { id: "healthy", label: "Healthy", emoji: "🥗", color: "#FCE7F3" },
  { id: "drinks", label: "Drinks", emoji: "🥤", color: "#E0E7FF" },
  { id: "desserts", label: "Desserts", emoji: "🍰", color: "#FEE2E2" },
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: "jollof-kitchen",
    name: "Jollof Kitchen",
    cuisine: "Ghanaian · Local",
    rating: 4.8,
    etaMin: 25,
    deliveryFee: 8,
    color: "#FFC107",
    address: "Osu Oxford Street, Accra",
    latitude: 5.556,
    longitude: -0.182,
    categoryIds: ["local", "fast-food"],
    menu: [
      { id: "j1", name: "Party Jollof", description: "Smoky party jollof with chicken", price: 45, popular: true },
      { id: "j2", name: "Waakye Combo", description: "Waakye, stew, gari & egg", price: 35, popular: true },
      { id: "j3", name: "Kelewele", description: "Spiced fried plantain", price: 15 },
      { id: "j4", name: "Grilled Tilapia", description: "Whole tilapia with banku", price: 55 },
    ],
  },
  {
    id: "accra-burger-co",
    name: "Accra Burger Co.",
    cuisine: "Fast food · Burgers",
    rating: 4.6,
    etaMin: 20,
    deliveryFee: 10,
    color: "#F59E0B",
    address: "Airport City, Accra",
    latitude: 5.601,
    longitude: -0.175,
    categoryIds: ["fast-food", "drinks"],
    menu: [
      { id: "b1", name: "Classic Smash Burger", description: "Double patty, cheese, pickles", price: 38, popular: true },
      { id: "b2", name: "Spicy Chicken Wrap", description: "Crispy chicken, pepper sauce", price: 32 },
      { id: "b3", name: "Loaded Fries", description: "Cheese, jalapeños, bacon bits", price: 22, popular: true },
      { id: "b4", name: "Milkshake", description: "Vanilla or chocolate", price: 18 },
    ],
  },
  {
    id: "fresh-mart",
    name: "Fresh Mart",
    cuisine: "Groceries · Essentials",
    rating: 4.5,
    etaMin: 35,
    deliveryFee: 12,
    color: "#3B82F6",
    address: "East Legon, Accra",
    latitude: 5.635,
    longitude: -0.153,
    categoryIds: ["groceries"],
    menu: [
      { id: "g1", name: "Breakfast Bundle", description: "Bread, eggs, milk, butter", price: 65, popular: true },
      { id: "g2", name: "Fruit Pack", description: "Seasonal mixed fruits 2kg", price: 40 },
      { id: "g3", name: "Pantry Essentials", description: "Rice, oil, tomatoes, onions", price: 85 },
      { id: "g4", name: "Snacks Box", description: "Assorted chips & drinks", price: 30 },
    ],
  },
  {
    id: "suya-spot",
    name: "Suya Spot",
    cuisine: "Street food · Grills",
    rating: 4.9,
    etaMin: 18,
    deliveryFee: 7,
    color: "#FF3B30",
    address: "Labadi, Accra",
    latitude: 5.568,
    longitude: -0.145,
    categoryIds: ["local", "fast-food"],
    menu: [
      { id: "s1", name: "Beef Suya Plate", description: "Spiced beef skewers with onions", price: 40, popular: true },
      { id: "s2", name: "Chicken Suya", description: "Tender chicken suya pack", price: 35, popular: true },
      { id: "s3", name: "Goat Chops", description: "Grilled goat with pepper", price: 50 },
      { id: "s4", name: "Ketchup & Pepper", description: "Extra sauce pack", price: 5 },
    ],
  },
];

export function getRestaurant(id: string) {
  return RESTAURANTS.find((r) => r.id === id);
}
