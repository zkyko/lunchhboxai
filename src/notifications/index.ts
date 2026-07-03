import { config } from '../config/env.js';
import { Recommendation } from '../types/index.js';

interface NotificationPayload {
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  if (!config.notifications.enabled) {
    console.log('📵 Notifications disabled');
    return false;
  }

  const results = await Promise.all([
    sendSlackNotification(payload),
    sendDiscordNotification(payload),
  ]);

  return results.some((r) => r);
}

async function sendSlackNotification(payload: NotificationPayload): Promise<boolean> {
  const webhookUrl = config.notifications.slackWebhook;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: payload.title,
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: payload.message,
            },
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Slack notification failed:', error);
    return false;
  }
}

async function sendDiscordNotification(payload: NotificationPayload): Promise<boolean> {
  const webhookUrl = config.notifications.discordWebhook;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: payload.title,
            description: payload.message,
            color: 0x22c55e,
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Discord notification failed:', error);
    return false;
  }
}

export async function sendRecommendationNotification(recommendation: Recommendation): Promise<boolean> {
  const { topPick } = recommendation;
  const nutrition = topPick.estimatedNutrition;

  const nutritionText = nutrition
    ? `\n📊 Est. ${nutrition.calories} cal | ${nutrition.protein}g protein`
    : '';

  return sendNotification({
    title: `🍽️ Today's Best Lunch`,
    message: `*${topPick.name}*\n${topPick.restaurant}\n💰 $${topPick.price.toFixed(2)}${nutritionText}\n\n${recommendation.reasoning}\n\n_Reply to approve or view alternatives._`,
    data: {
      itemId: topPick.id,
      score: topPick.score,
    },
  });
}

export async function sendOrderConfirmation(itemName: string, restaurant: string): Promise<boolean> {
  return sendNotification({
    title: '✅ Order Submitted',
    message: `Your order for *${itemName}* from ${restaurant} has been submitted!`,
  });
}
