import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { router } from './api/routes.js';
import { getDb, closeDb } from './db/index.js';
import { scraper } from './playwright/lunchdrop.js';

const app = express();

app.use(cors({
  origin: [`http://localhost:${config.server.frontendPort}`, 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.use('/api', router);

app.get('/', (_req, res) => {
  res.json({
    name: 'LunchDrop AI Bot',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      profile: '/api/profile',
      status: '/api/status',
      menu: '/api/menu',
      recommendation: '/api/recommendation',
      orders: '/api/orders',
    },
  });
});

async function shutdown(): Promise<void> {
  console.log('\n🛑 Shutting down...');
  await scraper.close();
  closeDb();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function start(): Promise<void> {
  try {
    getDb();
    console.log('✅ Database connected');

    app.listen(config.server.port, () => {
      console.log(`
🍽️  LunchDrop AI Bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 API Server:     http://localhost:${config.server.port}
🌐 Frontend:       http://localhost:${config.server.frontendPort}
🤖 AI Provider:    ${config.ai.provider}
📊 Environment:    ${config.server.nodeEnv}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
