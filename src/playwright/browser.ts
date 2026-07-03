import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { config } from '../config/env.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: config.server.nodeEnv === 'production',
    });
  }
  return browser;
}

export async function getContext(): Promise<BrowserContext> {
  if (!context) {
    const b = await getBrowser();
    context = await b.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
    });
  }
  return context;
}

export async function getPage(): Promise<Page> {
  const ctx = await getContext();
  return ctx.newPage();
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}

export async function saveSession(path: string): Promise<void> {
  const ctx = await getContext();
  await ctx.storageState({ path });
}

export async function loadSession(path: string): Promise<void> {
  const b = await getBrowser();
  context = await b.newContext({
    storageState: path,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });
}
