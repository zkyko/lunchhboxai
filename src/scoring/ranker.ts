import { MenuItem, ScoredMenuItem, UserProfile, Recommendation } from '../types/index.js';
import { chatJSON, chat } from '../ai/client.js';
import { buildMealRankingPrompt, buildRecommendationSummaryPrompt } from '../ai/prompts.js';
import { getUserProfile } from '../config/user-profile.js';

interface RankingResult {
  itemIndex: number;
  score: number;
  proteinScore: number;
  calorieScore: number;
  budgetScore: number;
  preferenceScore: number;
  reasoning: string;
  suggestedModifications?: string[];
}

export async function rankMeals(
  items: MenuItem[],
  profile: UserProfile = getUserProfile()
): Promise<ScoredMenuItem[]> {
  if (items.length === 0) {
    return [];
  }

  try {
    const prompt = buildMealRankingPrompt(items, profile);
    const rankings = await chatJSON<RankingResult[]>(prompt, {
      temperature: 0.3,
    });

    const scoredItems: ScoredMenuItem[] = rankings
      .filter((r) => r.itemIndex > 0 && r.itemIndex <= items.length)
      .map((ranking) => {
        const item = items[ranking.itemIndex - 1];
        return {
          ...item,
          score: ranking.score,
          scoreBreakdown: {
            proteinScore: ranking.proteinScore,
            calorieScore: ranking.calorieScore,
            budgetScore: ranking.budgetScore,
            preferenceScore: ranking.preferenceScore,
            cuisineScore: 0,
          },
          reasoning: ranking.reasoning,
          suggestedModifications: ranking.suggestedModifications,
        };
      });

    return scoredItems.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.warn('⚠️ AI ranking failed, using fallback scoring:', error);
    return fallbackRanking(items, profile);
  }
}

function fallbackRanking(items: MenuItem[], profile: UserProfile): ScoredMenuItem[] {
  return items.map((item) => {
    let score = 50;
    const desc = `${item.name} ${item.description}`.toLowerCase();

    let proteinScore = 10;
    if (desc.includes('chicken')) proteinScore += 8;
    if (desc.includes('beef') || desc.includes('steak')) proteinScore += 10;
    if (desc.includes('double') || desc.includes('extra protein')) proteinScore += 7;

    let calorieScore = 15;
    if (item.estimatedNutrition) {
      const cal = item.estimatedNutrition.calories;
      if (cal >= profile.goals.targetCalories.min && cal <= profile.goals.targetCalories.max) {
        calorieScore = 25;
      } else if (cal < profile.goals.targetCalories.min) {
        calorieScore = 10;
      }
    }

    let budgetScore = 15;
    if (item.price <= profile.goals.maxBudget * 0.7) {
      budgetScore = 25;
    } else if (item.price <= profile.goals.maxBudget) {
      budgetScore = 20;
    } else {
      budgetScore = 5;
    }

    let preferenceScore = 10;
    for (const pref of profile.preferences.preferred) {
      if (desc.includes(pref.toLowerCase())) {
        preferenceScore += 3;
      }
    }
    for (const avoid of profile.preferences.avoid) {
      if (desc.includes(avoid.toLowerCase())) {
        preferenceScore -= 5;
      }
    }
    preferenceScore = Math.max(0, Math.min(25, preferenceScore));

    score = proteinScore + calorieScore + budgetScore + preferenceScore;

    return {
      ...item,
      score,
      scoreBreakdown: {
        proteinScore,
        calorieScore,
        budgetScore,
        preferenceScore,
        cuisineScore: 0,
      },
      reasoning: 'Scored using fallback algorithm',
    };
  }).sort((a, b) => b.score - a.score);
}

export async function getRecommendation(
  items: MenuItem[],
  profile: UserProfile = getUserProfile()
): Promise<Recommendation> {
  const rankedItems = await rankMeals(items, profile);

  if (rankedItems.length === 0) {
    throw new Error('No items to recommend');
  }

  const topPick = rankedItems[0];
  const alternatives = rankedItems.slice(1, 4);

  let reasoning: string;
  try {
    reasoning = await chat(buildRecommendationSummaryPrompt(topPick, profile), {
      temperature: 0.7,
      maxTokens: 200,
    });
  } catch {
    reasoning = `${topPick.name} from ${topPick.restaurant} is a solid choice for your muscle-building goals. It offers good protein content within your budget.`;
  }

  const dailySummary = `Today's top pick: ${topPick.name} from ${topPick.restaurant} ($${topPick.price.toFixed(2)}) with a score of ${topPick.score}/100.`;

  return {
    topPick,
    alternatives,
    reasoning,
    dailySummary,
    generatedAt: new Date(),
  };
}
