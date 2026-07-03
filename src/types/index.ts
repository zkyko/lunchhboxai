import { z } from 'zod';

export const UserProfileSchema = z.object({
  name: z.string(),
  goals: z.object({
    gainWeight: z.boolean(),
    buildMuscle: z.boolean(),
    targetCalories: z.object({
      min: z.number(),
      max: z.number(),
    }),
    targetProtein: z.number(),
    maxBudget: z.number(),
  }),
  schedule: z.object({
    officeDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    homeDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  }),
  preferences: z.object({
    preferred: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const NutritionInfoSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number().optional(),
  sodium: z.number().optional(),
});

export type NutritionInfo = z.infer<typeof NutritionInfoSchema>;

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  restaurant: z.string(),
  restaurantId: z.string(),
  category: z.string().optional(),
  nutrition: NutritionInfoSchema.optional(),
  estimatedNutrition: NutritionInfoSchema.optional(),
  modifiers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    type: z.enum(['add', 'remove', 'substitute']),
  })).optional(),
  imageUrl: z.string().optional(),
  available: z.boolean().default(true),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

export const RestaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisine: z.string().optional(),
  rating: z.number().optional(),
  deliveryTime: z.string().optional(),
  menuItems: z.array(MenuItemSchema),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;

export const ScoredMenuItemSchema = MenuItemSchema.extend({
  score: z.number(),
  scoreBreakdown: z.object({
    proteinScore: z.number(),
    calorieScore: z.number(),
    budgetScore: z.number(),
    preferenceScore: z.number(),
    cuisineScore: z.number(),
  }),
  reasoning: z.string(),
  suggestedModifications: z.array(z.string()).optional(),
});

export type ScoredMenuItem = z.infer<typeof ScoredMenuItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  menuItem: MenuItemSchema,
  modifications: z.array(z.string()),
  totalPrice: z.number(),
  estimatedNutrition: NutritionInfoSchema,
  status: z.enum(['pending', 'approved', 'submitted', 'delivered', 'cancelled']),
  createdAt: z.date(),
  approvedAt: z.date().optional(),
  submittedAt: z.date().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const RecommendationSchema = z.object({
  topPick: ScoredMenuItemSchema,
  alternatives: z.array(ScoredMenuItemSchema),
  reasoning: z.string(),
  dailySummary: z.string(),
  generatedAt: z.date(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

export const AIProviderSchema = z.enum(['openai', 'anthropic']);
export type AIProvider = z.infer<typeof AIProviderSchema>;

export interface ScrapedMenu {
  date: string;
  restaurants: Restaurant[];
  scrapedAt: Date;
}

export interface OrderHistoryEntry {
  id: number;
  date: string;
  restaurantName: string;
  itemName: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  score: number;
  status: string;
  createdAt: string;
}
