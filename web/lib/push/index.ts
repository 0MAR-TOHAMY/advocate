/* eslint-disable @typescript-eslint/no-explicit-any */
import webPush from 'web-push';

// VAPID keys should be in env
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

if (publicVapidKey && privateVapidKey) {
  webPush.setVapidDetails(
    'mailto:support@example.com',
    publicVapidKey,
    privateVapidKey
  );
} else {
    console.warn("VAPID keys not set. Push notifications will not work.");
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export async function sendNotification(subscription: webPush.PushSubscription, payload: PushPayload) {
  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    if ((error as any).statusCode === 410) {
        // Subscription expired/gone
        return 'gone';
    }
    return false;
  }
}
