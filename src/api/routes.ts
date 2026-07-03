import { Router, Request, Response } from 'express';
import { scraper } from '../playwright/lunchdrop.js';
import { estimateMenuNutrition } from '../ai/nutrition-estimator.js';
import { getRecommendation as generateRecommendation } from '../scoring/ranker.js';
import { getUserProfile, isOfficeDay } from '../config/user-profile.js';
import { 
  getOrderHistory, 
  getTodayOrder, 
  saveOrder, 
  updateOrderStatus,
  cacheMenu,
  getCachedMenu,
  saveRecommendation,
  getRecommendation as getStoredRecommendation,
  getNutritionStats,
} from '../db/index.js';
import { sendRecommendationNotification, sendOrderConfirmation } from '../notifications/index.js';
import { MenuItem, Restaurant } from '../types/index.js';

export const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/profile', (_req: Request, res: Response) => {
  const profile = getUserProfile();
  res.json(profile);
});

router.get('/status', (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const isOffice = isOfficeDay();
  const todayOrder = getTodayOrder();
  
  res.json({
    date: today,
    isOfficeDay: isOffice,
    hasOrder: !!todayOrder,
    order: todayOrder,
  });
});

router.get('/menu', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const today = new Date().toISOString().split('T')[0];

    if (!forceRefresh) {
      const cached = getCachedMenu(today);
      if (cached && cached.length > 0) {
        return res.json({ date: today, items: cached, cached: true });
      }
    }

    const menu = await scraper.scrapeMenu();
    const allItems: MenuItem[] = menu.restaurants.flatMap((r: Restaurant) => r.menuItems);
    
    for (const restaurant of menu.restaurants) {
      cacheMenu(today, restaurant.id, restaurant.name, restaurant.menuItems);
    }

    res.json({ date: today, items: allItems, restaurants: menu.restaurants, cached: false });
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.get('/recommendation', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const today = new Date().toISOString().split('T')[0];

    if (!forceRefresh) {
      const stored = getStoredRecommendation(today);
      if (stored) {
        return res.json({ ...stored, cached: true });
      }
    }

    const cached = getCachedMenu(today);
    let items: MenuItem[];

    if (cached && cached.length > 0) {
      items = cached;
    } else {
      const menu = await scraper.scrapeMenu();
      items = menu.restaurants.flatMap((r: Restaurant) => r.menuItems);
      
      for (const restaurant of menu.restaurants) {
        cacheMenu(today, restaurant.id, restaurant.name, restaurant.menuItems);
      }
    }

    const itemsWithNutrition = await estimateMenuNutrition(items);
    const recommendation = await generateRecommendation(itemsWithNutrition);

    saveRecommendation(today, recommendation);

    res.json({ ...recommendation, cached: false });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

router.post('/recommendation/notify', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const recommendation = getStoredRecommendation(today);

    if (!recommendation) {
      return res.status(404).json({ error: 'No recommendation for today' });
    }

    const sent = await sendRecommendationNotification(recommendation);
    res.json({ sent });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.post('/order/prepare', async (req: Request, res: Response) => {
  try {
    const { itemId, modifications = [] } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const success = await scraper.prepareOrder(itemId, modifications);

    if (success) {
      const today = new Date().toISOString().split('T')[0];
      const cached = getCachedMenu(today);
      const item = cached?.find((i: MenuItem) => i.id === itemId);

      if (item) {
        const orderId = saveOrder({
          date: today,
          restaurantName: item.restaurant,
          itemName: item.name,
          itemId: item.id,
          price: item.price,
          calories: item.estimatedNutrition?.calories,
          protein: item.estimatedNutrition?.protein,
          carbs: item.estimatedNutrition?.carbs,
          fat: item.estimatedNutrition?.fat,
          modifications,
          status: 'pending',
        });

        return res.json({ success: true, orderId });
      }
    }

    res.json({ success });
  } catch (error) {
    console.error('Order preparation error:', error);
    res.status(500).json({ error: 'Failed to prepare order' });
  }
});

router.post('/order/:id/approve', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string, 10);
    updateOrderStatus(orderId, 'approved');
    res.json({ success: true, status: 'approved' });
  } catch (error) {
    console.error('Order approval error:', error);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

router.post('/order/:id/submit', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string, 10);
    const success = await scraper.submitOrder();

    if (success) {
      updateOrderStatus(orderId, 'submitted');
      
      const order = getTodayOrder();
      if (order) {
        await sendOrderConfirmation(order.itemName, order.restaurantName);
      }
    }

    res.json({ success, status: success ? 'submitted' : 'failed' });
  } catch (error) {
    console.error('Order submission error:', error);
    res.status(500).json({ error: 'Failed to submit order' });
  }
});

router.post('/order/:id/cancel', async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.id as string, 10);
    updateOrderStatus(orderId, 'cancelled');
    res.json({ success: true, status: 'cancelled' });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

router.get('/orders', (_req: Request, res: Response) => {
  try {
    const limit = 30;
    const orders = getOrderHistory(limit);
    res.json({ orders });
  } catch (error) {
    console.error('Order history error:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

router.get('/nutrition/stats', (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string, 10) || 7;
    const stats = getNutritionStats(days);
    res.json({ stats });
  } catch (error) {
    console.error('Nutrition stats error:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition stats' });
  }
});
