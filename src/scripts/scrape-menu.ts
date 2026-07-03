import { scraper } from '../playwright/lunchdrop.js';
import { cacheMenu } from '../db/index.js';

async function main() {
  console.log('🍽️ Scraping LunchDrop menu...\n');

  try {
    const loginSuccess = await scraper.login();
    if (!loginSuccess) {
      console.log('⚠️ Login failed or skipped, attempting to scrape anyway...');
    }

    const menu = await scraper.scrapeMenu();

    console.log(`\n📅 Date: ${menu.date}`);
    console.log(`🏪 Found ${menu.restaurants.length} restaurants\n`);

    for (const restaurant of menu.restaurants) {
      console.log(`\n${restaurant.name} (${restaurant.menuItems.length} items)`);
      console.log('─'.repeat(40));

      for (const item of restaurant.menuItems) {
        console.log(`  • ${item.name} - $${item.price.toFixed(2)}`);
        if (item.description) {
          console.log(`    ${item.description.substring(0, 60)}...`);
        }
      }

      cacheMenu(menu.date, restaurant.id, restaurant.name, restaurant.menuItems);
    }

    console.log('\n✅ Menu scraped and cached successfully!');
  } catch (error) {
    console.error('❌ Error scraping menu:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
