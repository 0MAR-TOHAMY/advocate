# Web Push Notifications

## Setup
Uses VAPID keys for security.
Env vars:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (mailto:...)

## Components
1. **Service Worker**: `public/sw.js`. Handles `push` event and shows notification.
2. **Backend**: `lib/push/index.ts`. Uses `web-push` library.
3. **Database**: `push_subscriptions` table stores user subscriptions.

## Usage
1. Frontend registers SW.
2. Frontend calls `subscription.toJSON()` and POSTs to `/api/push/subscribe`.
3. Backend saves subscription.
4. Scheduled job (or event) calls `sendNotification(sub, payload)`.
