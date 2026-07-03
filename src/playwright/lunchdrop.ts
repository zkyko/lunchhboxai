import { Page } from 'playwright';
import { getPage, closeBrowser, saveSession, loadSession } from './browser.js';
import { config } from '../config/env.js';
import { Restaurant, MenuItem, ScrapedMenu } from '../types/index.js';
import * as fs from 'fs';

const LUNCHDROP_URL = 'https://www.lunchdrop.com';
const SESSION_PATH = './data/lunchdrop-session.json';

export class LunchDropScraper {
  private page: Page | null = null;

  async init(): Promise<void> {
    if (fs.existsSync(SESSION_PATH)) {
      try {
        await loadSession(SESSION_PATH);
        console.log('📂 Loaded existing session');
      } catch {
        console.log('⚠️ Could not load session, will login fresh');
      }
    }
    this.page = await getPage();
  }

  async login(): Promise<boolean> {
    if (!this.page) await this.init();
    const page = this.page!;

    try {
      await page.goto(`${LUNCHDROP_URL}/login`, { waitUntil: 'networkidle' });

      const email = config.lunchdrop.email;
      const password = config.lunchdrop.password;

      if (!email || !password) {
        console.error('❌ LunchDrop credentials not configured');
        return false;
      }

      await page.fill('input[type="email"], input[name="email"]', email);
      await page.fill('input[type="password"], input[name="password"]', password);
      await page.click('button[type="submit"]');

      await page.waitForNavigation({ waitUntil: 'networkidle' });

      const isLoggedIn = await this.checkLoginStatus();
      if (isLoggedIn) {
        await saveSession(SESSION_PATH);
        console.log('✅ Login successful, session saved');
      }

      return isLoggedIn;
    } catch (error) {
      console.error('❌ Login failed:', error);
      return false;
    }
  }

  async checkLoginStatus(): Promise<boolean> {
    if (!this.page) return false;
    
    try {
      const logoutButton = await this.page.$('[data-testid="logout"], a[href*="logout"], button:has-text("Logout"), button:has-text("Sign Out")');
      const profileIcon = await this.page.$('[data-testid="profile"], [data-testid="user-menu"], .user-avatar, .profile-icon');
      return !!(logoutButton || profileIcon);
    } catch {
      return false;
    }
  }

  async scrapeMenu(): Promise<ScrapedMenu> {
    if (!this.page) await this.init();
    const page = this.page!;

    const restaurants: Restaurant[] = [];
    const today = new Date().toISOString().split('T')[0];

    try {
      await page.goto(`${LUNCHDROP_URL}/menu`, { waitUntil: 'networkidle' });

      await page.waitForSelector('.restaurant-card, .menu-item, [data-testid="restaurant"]', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Using fallback selectors for menu');
      });

      const restaurantElements = await page.$$('.restaurant-card, .restaurant-section, [data-testid="restaurant"]');

      for (const restaurantEl of restaurantElements) {
        const restaurantName = await restaurantEl.$eval(
          '.restaurant-name, h2, h3, [data-testid="restaurant-name"]',
          (el) => el.textContent?.trim() || 'Unknown Restaurant'
        ).catch(() => 'Unknown Restaurant');

        const restaurantId = await restaurantEl.getAttribute('data-id') || 
          restaurantName.toLowerCase().replace(/\s+/g, '-');

        const cuisine = await restaurantEl.$eval(
          '.cuisine-type, .restaurant-cuisine, [data-testid="cuisine"]',
          (el) => el.textContent?.trim()
        ).catch(() => undefined);

        const menuItems: MenuItem[] = [];
        const itemElements = await restaurantEl.$$('.menu-item, .item-card, [data-testid="menu-item"]');

        for (const itemEl of itemElements) {
          try {
            const name = await itemEl.$eval(
              '.item-name, h4, [data-testid="item-name"]',
              (el) => el.textContent?.trim() || 'Unknown Item'
            ).catch(() => 'Unknown Item');

            const description = await itemEl.$eval(
              '.item-description, p, [data-testid="item-description"]',
              (el) => el.textContent?.trim() || ''
            ).catch(() => '');

            const priceText = await itemEl.$eval(
              '.item-price, .price, [data-testid="price"]',
              (el) => el.textContent?.trim() || '$0'
            ).catch(() => '$0');
            const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

            const itemId = await itemEl.getAttribute('data-id') ||
              `${restaurantId}-${name.toLowerCase().replace(/\s+/g, '-')}`;

            const imageUrl = await itemEl.$eval(
              'img',
              (el) => el.getAttribute('src')
            ).catch(() => undefined);

            menuItems.push({
              id: itemId,
              name,
              description,
              price,
              restaurant: restaurantName,
              restaurantId,
              imageUrl: imageUrl || undefined,
              available: true,
            });
          } catch (error) {
            console.warn('⚠️ Could not parse menu item:', error);
          }
        }

        if (menuItems.length > 0 || restaurantElements.length > 0) {
          restaurants.push({
            id: restaurantId,
            name: restaurantName,
            cuisine,
            menuItems,
          });
        }
      }

      console.log(`📋 Scraped ${restaurants.length} restaurants with ${restaurants.reduce((sum, r) => sum + r.menuItems.length, 0)} total items`);

    } catch (error) {
      console.error('❌ Menu scraping failed:', error);
    }

    return {
      date: today,
      restaurants,
      scrapedAt: new Date(),
    };
  }

  async prepareOrder(itemId: string, modifications: string[] = []): Promise<boolean> {
    if (!this.page) await this.init();
    const page = this.page!;

    try {
      const itemSelector = `[data-id="${itemId}"], [data-item-id="${itemId}"]`;
      await page.click(itemSelector);

      await page.waitForSelector('.item-modal, .order-modal, [data-testid="item-modal"]', { timeout: 5000 });

      for (const mod of modifications) {
        const modSelector = `[data-modifier="${mod}"], label:has-text("${mod}"), button:has-text("${mod}")`;
        const modElement = await page.$(modSelector);
        if (modElement) {
          await modElement.click();
        }
      }

      const addToCartButton = await page.$('button:has-text("Add to Cart"), button:has-text("Add to Order"), [data-testid="add-to-cart"]');
      if (addToCartButton) {
        await addToCartButton.click();
        console.log('🛒 Item added to cart');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to prepare order:', error);
      return false;
    }
  }

  async submitOrder(): Promise<boolean> {
    if (!this.page) return false;
    const page = this.page;

    if (!config.order.autoSubmit) {
      console.log('⚠️ Auto-submit is disabled. Order is ready in cart.');
      return false;
    }

    try {
      await page.click('button:has-text("Checkout"), button:has-text("Place Order"), [data-testid="checkout"]');
      
      await page.waitForSelector('.order-confirmation, [data-testid="order-success"]', { timeout: 30000 });
      
      console.log('✅ Order submitted successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to submit order:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await closeBrowser();
    this.page = null;
  }
}

export const scraper = new LunchDropScraper();
