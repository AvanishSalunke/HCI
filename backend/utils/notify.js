const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
const enabled = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (enabled) {
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('Push notifications are off: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set.');
}

// Sends a notification to every saved device matching `filter`.
// It never throws: a failed notification must not break the request that caused it.
//   filter  - a mongoose filter on PushSubscription, e.g. { role: 'admin' } ({} = everyone)
//   payload - { title, body, url, tag }
const notify = async (filter, payload) => {
  if (!enabled) return;
  try {
    const subs = await PushSubscription.find(filter);
    const message = JSON.stringify(payload);
    await Promise.all(subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, message);
      } catch (err) {
        // 404 / 410 mean the phone removed the permission or uninstalled the app
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error('Push failed:', err.statusCode || err.message);
        }
      }
    }));
  } catch (err) {
    console.error('Push error:', err.message);
  }
};

module.exports = { notify, publicKey: VAPID_PUBLIC_KEY || '', enabled };
