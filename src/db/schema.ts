export const schema = `
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_id TEXT,
  price REAL NOT NULL,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  score INTEGER,
  modifications TEXT,
  status TEXT DEFAULT 'pending',
  reasoning TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  submitted_at TEXT
);

CREATE TABLE IF NOT EXISTS menu_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  menu_data TEXT NOT NULL,
  scraped_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, restaurant_id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  top_pick_id TEXT,
  top_pick_name TEXT,
  top_pick_restaurant TEXT,
  top_pick_score INTEGER,
  alternatives TEXT,
  reasoning TEXT,
  daily_summary TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  meal_type TEXT DEFAULT 'lunch',
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  source TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_menu_cache_date ON menu_cache(date);
CREATE INDEX IF NOT EXISTS idx_recommendations_date ON recommendations(date);
CREATE INDEX IF NOT EXISTS idx_nutrition_log_date ON nutrition_log(date);
`;

export const migrations: string[] = [
  schema,
];
