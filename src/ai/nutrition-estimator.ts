import { MenuItem, NutritionInfo } from '../types/index.js';
import { chatJSON } from './client.js';
import { buildNutritionEstimationPrompt } from './prompts.js';

interface NutritionEstimate extends NutritionInfo {
  confidence: 'low' | 'medium' | 'high';
}

const nutritionCache = new Map<string, NutritionEstimate>();

export async function estimateNutrition(item: MenuItem): Promise<NutritionInfo> {
  const cacheKey = `${item.restaurant}-${item.name}`;
  
  if (nutritionCache.has(cacheKey)) {
    return nutritionCache.get(cacheKey)!;
  }

  if (item.nutrition) {
    return item.nutrition;
  }

  try {
    const prompt = buildNutritionEstimationPrompt(item);
    const estimate = await chatJSON<NutritionEstimate>(prompt, {
      temperature: 0.3,
    });

    nutritionCache.set(cacheKey, estimate);
    
    return {
      calories: estimate.calories,
      protein: estimate.protein,
      carbs: estimate.carbs,
      fat: estimate.fat,
    };
  } catch (error) {
    console.warn(`⚠️ Could not estimate nutrition for ${item.name}:`, error);
    return estimateFromDescription(item);
  }
}

function estimateFromDescription(item: MenuItem): NutritionInfo {
  const desc = `${item.name} ${item.description}`.toLowerCase();
  
  let calories = 600;
  let protein = 25;
  let carbs = 50;
  let fat = 20;

  if (desc.includes('chicken')) {
    protein += 20;
    calories += 150;
  }
  if (desc.includes('beef') || desc.includes('steak')) {
    protein += 25;
    calories += 200;
    fat += 10;
  }
  if (desc.includes('rice')) {
    carbs += 30;
    calories += 150;
  }
  if (desc.includes('double') || desc.includes('extra')) {
    protein += 15;
    calories += 200;
  }
  if (desc.includes('salad') && !desc.includes('with')) {
    calories -= 300;
    protein -= 10;
    carbs -= 30;
  }
  if (desc.includes('bowl')) {
    calories += 100;
    carbs += 20;
  }
  if (desc.includes('wrap') || desc.includes('burrito')) {
    carbs += 40;
    calories += 150;
  }
  if (desc.includes('greek') || desc.includes('mediterranean')) {
    protein += 10;
    fat += 10;
  }

  if (item.price > 15) {
    calories += 150;
    protein += 10;
  } else if (item.price < 10) {
    calories -= 100;
    protein -= 5;
  }

  return {
    calories: Math.max(200, Math.round(calories)),
    protein: Math.max(10, Math.round(protein)),
    carbs: Math.max(10, Math.round(carbs)),
    fat: Math.max(5, Math.round(fat)),
  };
}

export async function estimateMenuNutrition(items: MenuItem[]): Promise<MenuItem[]> {
  const results: MenuItem[] = [];
  
  for (const item of items) {
    const estimatedNutrition = await estimateNutrition(item);
    results.push({
      ...item,
      estimatedNutrition,
    });
  }
  
  return results;
}
