import { scraper } from '../playwright/lunchdrop.js';
import { estimateMenuNutrition } from '../ai/nutrition-estimator.js';
import { getRecommendation } from '../scoring/ranker.js';
import { getUserProfile, isOfficeDay } from '../config/user-profile.js';
import { cacheMenu, getCachedMenu, saveRecommendation } from '../db/index.js';
import { sendRecommendationNotification } from '../notifications/index.js';
import { MenuItem, Restaurant } from '../types/index.js';

async function main() {
  const profile = getUserProfile();
  const today = new Date().toISOString().split('T')[0];
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  console.log('🍽️ LunchDrop AI Recommendation\n');
  console.log(`👤 User: ${profile.name}`);
  console.log(`📅 Date: ${dayName}, ${today}`);
  console.log(`🏢 ${isOfficeDay() ? 'Office day - LunchDrop recommended!' : 'Home day - Consider meal prep'}\n`);

  if (!isOfficeDay()) {
    console.log('💡 Tip: Today is a home day. Consider meal prepping with your air fryer!');
    console.log('   Suggested: Chicken breast + rice + veggies\n');
    process.exit(0);
  }

  try {
    let items: MenuItem[] = [];
    const cached = getCachedMenu(today);

    if (cached && cached.length > 0) {
      console.log('📂 Using cached menu data...\n');
      items = cached;
    } else {
      console.log('🔍 Scraping fresh menu data...\n');
      const menu = await scraper.scrapeMenu();
      items = menu.restaurants.flatMap((r: Restaurant) => r.menuItems);

      for (const restaurant of menu.restaurants) {
        cacheMenu(today, restaurant.id, restaurant.name, restaurant.menuItems);
      }
    }

    if (items.length === 0) {
      console.log('❌ No menu items found. Check your LunchDrop credentials.');
      process.exit(1);
    }

    console.log(`📋 Found ${items.length} menu items\n`);
    console.log('🤖 Analyzing with AI...\n');

    const itemsWithNutrition = await estimateMenuNutrition(items.slice(0, 20));
    const recommendation = await getRecommendation(itemsWithNutrition);

    saveRecommendation(today, recommendation);

    const { topPick, alternatives, reasoning } = recommendation;

    console.log('═'.repeat(50));
    console.log('🏆 TOP RECOMMENDATION');
    console.log('═'.repeat(50));
    console.log(`\n${topPick.name}`);
    console.log(`📍 ${topPick.restaurant}`);
    console.log(`💰 $${topPick.price.toFixed(2)}`);
    console.log(`⭐ Score: ${topPick.score}/100`);

    if (topPick.estimatedNutrition) {
      const n = topPick.estimatedNutrition;
      console.log(`\n📊 Estimated Nutrition:`);
      console.log(`   Calories: ${n.calories}`);
      console.log(`   Protein:  ${n.protein}g`);
      console.log(`   Carbs:    ${n.carbs}g`);
      console.log(`   Fat:      ${n.fat}g`);
    }

    console.log(`\n💬 ${reasoning}`);

    if (topPick.suggestedModifications && topPick.suggestedModifications.length > 0) {
      console.log(`\n✨ Suggested modifications:`);
      topPick.suggestedModifications.forEach((mod) => {
        console.log(`   • ${mod}`);
      });
    }

    if (alternatives.length > 0) {
      console.log('\n' + '─'.repeat(50));
      console.log('📋 ALTERNATIVES');
      console.log('─'.repeat(50));

      alternatives.forEach((alt, i) => {
        console.log(`\n${i + 2}. ${alt.name}`);
        console.log(`   ${alt.restaurant} - $${alt.price.toFixed(2)} (Score: ${alt.score})`);
        if (alt.estimatedNutrition) {
          console.log(`   ${alt.estimatedNutrition.calories} cal, ${alt.estimatedNutrition.protein}g protein`);
        }
      });
    }

    console.log('\n' + '═'.repeat(50));

    await sendRecommendationNotification(recommendation);

    console.log('\n✅ Recommendation saved! Visit the dashboard to approve.\n');
  } catch (error) {
    console.error('❌ Error generating recommendation:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
