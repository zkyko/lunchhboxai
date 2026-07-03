import { UserProfile, MenuItem } from '../types/index.js';

export function buildNutritionEstimationPrompt(item: MenuItem): string {
  return `Estimate the nutritional information for this menu item. Be realistic based on typical restaurant portions.

Menu Item: ${item.name}
Restaurant: ${item.restaurant}
Description: ${item.description}
Price: $${item.price.toFixed(2)}

Provide your estimate in this exact JSON format:
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "confidence": <"low" | "medium" | "high">
}

Consider:
- Restaurant portion sizes tend to be larger than home cooking
- Price often correlates with portion size
- Higher protein items (chicken, beef) typically have more calories
- Mediterranean and Mexican cuisine often includes rice/beans (more carbs)

Only respond with the JSON, no other text.`;
}

export function buildMealRankingPrompt(
  items: MenuItem[],
  userProfile: UserProfile
): string {
  const itemsList = items.map((item, i) => 
    `${i + 1}. ${item.name} (${item.restaurant}) - $${item.price.toFixed(2)}
   Description: ${item.description}
   ${item.estimatedNutrition ? `Est. Nutrition: ${item.estimatedNutrition.calories} cal, ${item.estimatedNutrition.protein}g protein` : ''}`
  ).join('\n\n');

  return `You are a nutrition-focused meal advisor. Analyze today's menu and rank the meals for this user.

USER PROFILE:
Name: ${userProfile.name}
Goals: ${userProfile.goals.gainWeight ? 'Gain weight, ' : ''}${userProfile.goals.buildMuscle ? 'Build muscle' : ''}
Target Calories: ${userProfile.goals.targetCalories.min}-${userProfile.goals.targetCalories.max}
Target Protein: ${userProfile.goals.targetProtein}g minimum
Max Budget: $${userProfile.goals.maxBudget.toFixed(2)}

PREFERRED FOODS:
${userProfile.preferences.preferred.join(', ')}

FOODS TO AVOID:
${userProfile.preferences.avoid.join(', ')}

TODAY'S MENU:
${itemsList}

SCORING CRITERIA (weight each appropriately):
1. Protein content (higher is better for muscle building)
2. Calorie density (should be in target range)
3. Price/value ratio
4. Alignment with preferred cuisines
5. Avoidance of disliked items

Respond with a JSON array of ranked items (best first):
[
  {
    "itemIndex": <1-based index from menu>,
    "score": <0-100>,
    "proteinScore": <0-25>,
    "calorieScore": <0-25>,
    "budgetScore": <0-25>,
    "preferenceScore": <0-25>,
    "reasoning": "<brief explanation>",
    "suggestedModifications": ["<modification 1>", "<modification 2>"]
  }
]

Only include the top 5 items. Only respond with the JSON array, no other text.`;
}

export function buildRecommendationSummaryPrompt(
  topItem: MenuItem,
  userProfile: UserProfile
): string {
  return `Write a brief, friendly recommendation message for this meal choice.

USER: ${userProfile.name}
GOAL: Gain lean weight with high protein

RECOMMENDED MEAL:
${topItem.name} from ${topItem.restaurant}
Price: $${topItem.price.toFixed(2)}
${topItem.estimatedNutrition ? `
Estimated: ${topItem.estimatedNutrition.calories} calories, ${topItem.estimatedNutrition.protein}g protein
` : ''}

Write 2-3 sentences explaining why this is a good choice for the user's goals. Be encouraging but practical.
Keep it under 100 words.`;
}
