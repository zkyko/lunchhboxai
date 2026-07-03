import Database from 'better-sqlite3';
import { config } from '../config/env.js';
import { schema } from './schema.js';
import * as fs from 'fs';
import * as path from 'path';
import { OrderHistoryEntry, MenuItem, Recommendation } from '../types/index.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = config.database.path;
    const dir = path.dirname(dbPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.exec(schema);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function saveOrder(order: {
  date: string;
  restaurantName: string;
  itemName: string;
  itemId?: string;
  price: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  score?: number;
  modifications?: string[];
  status?: string;
  reasoning?: string;
}): number {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO orders (date, restaurant_name, item_name, item_id, price, calories, protein, carbs, fat, score, modifications, status, reasoning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    order.date,
    order.restaurantName,
    order.itemName,
    order.itemId || null,
    order.price,
    order.calories || null,
    order.protein || null,
    order.carbs || null,
    order.fat || null,
    order.score || null,
    order.modifications ? JSON.stringify(order.modifications) : null,
    order.status || 'pending',
    order.reasoning || null
  );
  
  return result.lastInsertRowid as number;
}

export function updateOrderStatus(id: number, status: string): void {
  const database = getDb();
  const now = new Date().toISOString();
  
  let updateField = '';
  if (status === 'approved') {
    updateField = ', approved_at = ?';
  } else if (status === 'submitted') {
    updateField = ', submitted_at = ?';
  }
  
  const stmt = database.prepare(`
    UPDATE orders SET status = ?${updateField} WHERE id = ?
  `);
  
  if (updateField) {
    stmt.run(status, now, id);
  } else {
    stmt.run(status, id);
  }
}

export function getOrderHistory(limit = 30): OrderHistoryEntry[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT id, date, restaurant_name as restaurantName, item_name as itemName, 
           price, calories, protein, carbs, fat, score, status, created_at as createdAt
    FROM orders
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  return stmt.all(limit) as OrderHistoryEntry[];
}

export function getTodayOrder(): OrderHistoryEntry | null {
  const database = getDb();
  const today = new Date().toISOString().split('T')[0];
  const stmt = database.prepare(`
    SELECT id, date, restaurant_name as restaurantName, item_name as itemName,
           price, calories, protein, carbs, fat, score, status, created_at as createdAt
    FROM orders
    WHERE date = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  
  return stmt.get(today) as OrderHistoryEntry | null;
}

export function cacheMenu(date: string, restaurantId: string, restaurantName: string, menuData: MenuItem[]): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO menu_cache (date, restaurant_id, restaurant_name, menu_data, scraped_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  stmt.run(date, restaurantId, restaurantName, JSON.stringify(menuData));
}

export function getCachedMenu(date: string): MenuItem[] | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT menu_data FROM menu_cache WHERE date = ?
  `);
  
  const rows = stmt.all(date) as { menu_data: string }[];
  if (rows.length === 0) return null;
  
  const items: MenuItem[] = [];
  for (const row of rows) {
    items.push(...JSON.parse(row.menu_data));
  }
  
  return items;
}

export function saveRecommendation(date: string, recommendation: Recommendation): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO recommendations 
    (date, top_pick_id, top_pick_name, top_pick_restaurant, top_pick_score, alternatives, reasoning, daily_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    date,
    recommendation.topPick.id,
    recommendation.topPick.name,
    recommendation.topPick.restaurant,
    recommendation.topPick.score,
    JSON.stringify(recommendation.alternatives),
    recommendation.reasoning,
    recommendation.dailySummary
  );
}

export function getRecommendation(date: string): Recommendation | null {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT * FROM recommendations WHERE date = ?
  `);
  
  const row = stmt.get(date) as Record<string, unknown> | undefined;
  if (!row) return null;
  
  return {
    topPick: {
      id: row.top_pick_id as string,
      name: row.top_pick_name as string,
      restaurant: row.top_pick_restaurant as string,
      restaurantId: '',
      description: '',
      price: 0,
      score: row.top_pick_score as number,
      scoreBreakdown: {
        proteinScore: 0,
        calorieScore: 0,
        budgetScore: 0,
        preferenceScore: 0,
        cuisineScore: 0,
      },
      reasoning: row.reasoning as string,
    },
    alternatives: JSON.parse(row.alternatives as string || '[]'),
    reasoning: row.reasoning as string,
    dailySummary: row.daily_summary as string,
    generatedAt: new Date(row.created_at as string),
  };
}

export function logNutrition(entry: {
  date: string;
  mealType?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: string;
  notes?: string;
}): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO nutrition_log (date, meal_type, calories, protein, carbs, fat, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    entry.date,
    entry.mealType || 'lunch',
    entry.calories,
    entry.protein,
    entry.carbs,
    entry.fat,
    entry.source || null,
    entry.notes || null
  );
}

export function getNutritionStats(days = 7): { date: string; totalCalories: number; totalProtein: number }[] {
  const database = getDb();
  const stmt = database.prepare(`
    SELECT date, SUM(calories) as totalCalories, SUM(protein) as totalProtein
    FROM nutrition_log
    WHERE date >= date('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date DESC
  `);
  
  return stmt.all(days) as { date: string; totalCalories: number; totalProtein: number }[];
}
