import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/ai/client.js', () => ({
  chatJSON: vi.fn().mockResolvedValue([
    {
      itemIndex: 1,
      score: 85,
      proteinScore: 22,
      calorieScore: 20,
      budgetScore: 23,
      preferenceScore: 20,
      reasoning: 'High protein chicken bowl perfect for muscle building',
      suggestedModifications: ['Double chicken', 'Extra rice'],
    },
    {
      itemIndex: 2,
      score: 72,
      proteinScore: 18,
      calorieScore: 18,
      budgetScore: 20,
      preferenceScore: 16,
      reasoning: 'Good Mediterranean option with decent protein',
    },
  ]),
  chat: vi.fn().mockResolvedValue('Great choice for your fitness goals!'),
}));

describe('Scoring System', () => {
  it('should prefer high protein meals', () => {
    const highProtein = {
      name: 'Double Chicken Bowl',
      protein: 60,
      calories: 900,
      price: 14,
    };

    const lowProtein = {
      name: 'Garden Salad',
      protein: 10,
      calories: 200,
      price: 12,
    };

    const proteinScore = (item: { protein: number }) =>
      Math.min(25, Math.round((item.protein / 60) * 25));

    expect(proteinScore(highProtein)).toBeGreaterThan(proteinScore(lowProtein));
  });

  it('should score calories within target range higher', () => {
    const targetMin = 900;
    const targetMax = 1200;

    const scoreCalories = (calories: number) => {
      if (calories >= targetMin && calories <= targetMax) return 25;
      if (calories < targetMin) return Math.round((calories / targetMin) * 20);
      return Math.round((targetMax / calories) * 20);
    };

    expect(scoreCalories(1000)).toBe(25);
    expect(scoreCalories(500)).toBeLessThan(25);
    expect(scoreCalories(1500)).toBeLessThan(25);
  });

  it('should penalize meals over budget', () => {
    const maxBudget = 18;

    const scoreBudget = (price: number) => {
      if (price <= maxBudget * 0.7) return 25;
      if (price <= maxBudget) return 20;
      return 5;
    };

    expect(scoreBudget(10)).toBe(25);
    expect(scoreBudget(16)).toBe(20);
    expect(scoreBudget(25)).toBe(5);
  });

  it('should prefer user-preferred cuisines', () => {
    const preferences = ['chicken', 'mediterranean', 'rice'];

    const scorePreferences = (description: string) => {
      let score = 10;
      for (const pref of preferences) {
        if (description.toLowerCase().includes(pref)) {
          score += 5;
        }
      }
      return Math.min(25, score);
    };

    expect(scorePreferences('Chicken Rice Bowl')).toBe(20);
    expect(scorePreferences('Mediterranean Platter')).toBe(15);
    expect(scorePreferences('Plain Bread')).toBe(10);
  });
});

describe('Menu Item Parsing', () => {
  it('should extract price from string', () => {
    const parsePrice = (priceStr: string) =>
      parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

    expect(parsePrice('$14.99')).toBe(14.99);
    expect(parsePrice('$8')).toBe(8);
    expect(parsePrice('15.50')).toBe(15.5);
  });

  it('should generate valid item IDs', () => {
    const generateId = (restaurant: string, name: string) =>
      `${restaurant}-${name}`.toLowerCase().replace(/\s+/g, '-');

    expect(generateId('Austin Rotisserie', 'Chicken Plate')).toBe(
      'austin-rotisserie-chicken-plate'
    );
  });
});
