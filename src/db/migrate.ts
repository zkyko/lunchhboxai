import { getDb, closeDb } from './index.js';

console.log('🗃️ Running database migrations...');

try {
  getDb();
  console.log('✅ Database initialized successfully');
  closeDb();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
