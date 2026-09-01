import { AppError } from "../../common/errors.js";
import { prisma } from "../../common/prisma.js";
import type { z } from "zod";
import type { createFoodOrderSchema } from "./food.schemas.js";

export interface FoodMerchant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  minOrder: number;
  imageUrl: string;
  address: string;
  latitude: number;
  longitude: number;
  isPopular?: boolean;
  categories: {
    name: string;
    items: {
      id: string;
      name: string;
      description: string;
      price: number;
      imageUrl: string;
      isPopular?: boolean;
    }[];
  }[];
}

const ACCRA_MERCHANTS: FoodMerchant[] = [
  {
    id: "m1",
    name: "Buka Restaurant",
    cuisine: "Authentic Ghanaian & West African",
    rating: 4.8,
    reviewCount: 342,
    deliveryTimeMin: 25,
    deliveryFee: 12,
    minOrder: 30,
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop",
    address: "Osu, 10th Lane, Accra",
    latitude: 5.5568,
    longitude: -0.1782,
    isPopular: true,
    categories: [
      {
        name: "Main Dishes",
        items: [
          {
            id: "i1",
            name: "Ghana Jollof with Grilled Tilapia",
            description: "Smoky party jollof rice served with spicy grilled tilapia and shito.",
            price: 65,
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop",
            isPopular: true,
          },
          {
            id: "i2",
            name: "Fufu with Goat Light Soup",
            description: "Pounded cassava & plantain in rich spicy goat meat broth.",
            price: 75,
            imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop",
            isPopular: true,
          },
          {
            id: "i3",
            name: "Waakye Special Combo",
            description: "Rice and beans with shito, talia, boiled egg, wele, and fried plantain.",
            price: 55,
            imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop",
            isPopular: true,
          },
        ],
      },
      {
        name: "Sides & Drinks",
        items: [
          {
            id: "i4",
            name: "Fried Kelewele",
            description: "Spicy seasoned ripe plantain cubes fried golden brown.",
            price: 25,
            imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop",
          },
          {
            id: "i5",
            name: "Fresh Sobolo (Hibiscus Juice)",
            description: "Chilled homemade spicy ginger hibiscus nectar.",
            price: 15,
            imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop",
          },
        ],
      },
    ],
  },
  {
    id: "m2",
    name: "Papaye Fast Food",
    cuisine: "Burgers, Fried Rice & Chicken",
    rating: 4.7,
    reviewCount: 512,
    deliveryTimeMin: 20,
    deliveryFee: 10,
    minOrder: 25,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop",
    address: "Oxford Street, Osu, Accra",
    latitude: 5.5582,
    longitude: -0.1791,
    isPopular: true,
    categories: [
      {
        name: "Fast Food Favorites",
        items: [
          {
            id: "i6",
            name: "Papaye Full Roasted Chicken & Fried Rice",
            description: "Signature Accra fried rice with spiced roasted chicken quarter.",
            price: 58,
            imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&auto=format&fit=crop",
            isPopular: true,
          },
          {
            id: "i7",
            name: "Crispy Chicken Shawarma",
            description: "Loaded spiced chicken wrap with garlic sauce and french fries.",
            price: 35,
            imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400&auto=format&fit=crop",
            isPopular: true,
          },
        ],
      },
    ],
  },
  {
    id: "m3",
    name: "Capitol Cafe & Restaurant",
    cuisine: "Continental & Grills",
    rating: 4.6,
    reviewCount: 198,
    deliveryTimeMin: 30,
    deliveryFee: 15,
    minOrder: 40,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop",
    address: "Cantonments, Accra",
    latitude: 5.5812,
    longitude: -0.1714,
    categories: [
      {
        name: "Grills",
        items: [
          {
            id: "i8",
            name: "Grilled Beef Suya Platter",
            description: "Tender beef skewers with spicy yaji pepper and sliced onions.",
            price: 70,
            imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop",
          },
        ],
      },
    ],
  },
];

export class FoodService {
  listMerchants(): FoodMerchant[] {
    return ACCRA_MERCHANTS;
  }

  getMerchant(merchantId: string): FoodMerchant {
    const merchant = ACCRA_MERCHANTS.find((m) => m.id === merchantId);
    if (!merchant) {
      throw new AppError("Restaurant was not found", 404, "MERCHANT_NOT_FOUND");
    }
    return merchant;
  }

  async createFoodOrder(input: z.infer<typeof createFoodOrderSchema>) {
    const passenger = await prisma.passengerProfile.findUnique({
      where: { id: input.passengerProfileId },
      include: { user: true },
    });

    if (!passenger) {
      throw new AppError("Passenger profile not found", 404, "PASSENGER_NOT_FOUND");
    }

    const orderId = `food_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const estimatedMinutes = 30;

    return {
      id: orderId,
      status: "preparing",
      merchant: {
        id: input.merchantId,
        name: input.merchantName,
        address: input.merchantAddress,
      },
      dropoffAddress: input.dropoffAddress,
      items: input.items,
      paymentMethod: input.paymentMethod,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      totalAmount: input.totalAmount,
      currency: input.currency,
      estimatedDeliveryMinutes: estimatedMinutes,
      createdAt: new Date().toISOString(),
    };
  }
}
