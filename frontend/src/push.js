import axios from 'axios';
import { API_BASE } from './api';

// Helpers for web push notifications.

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// Registers the service worker once when the app starts.
export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker failed', err));
  });
};

// Gets this device's push subscription, creating one if it has none yet.
const getOrCreateSubscription = async () => {
  const { data } = await axios.get(`${API_BASE}/api/push/key`);
  if (!data.publicKey) return null;
  const reg = await navigator.serviceWorker.ready;
  return (await reg.pushManager.getSubscription())
    || (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    }));
};

// Tells the server about this device. Sends the login token if there is one,
// so notifications can be aimed at this person (and stop after logout).
// If permission was already given but the first save failed (for example because
// the server was asleep), this subscribes the device now instead of giving up.
export const syncSubscription = async () => {
  if (!pushSupported() || Notification.permission !== 'granted') return;
  try {
    const sub = await getOrCreateSubscription();
    if (!sub) return;
    await axios.post(`${API_BASE}/api/push/subscribe`, { subscription: sub.toJSON() }, authHeaders());
  } catch (err) {
    console.error('Could not sync notifications', err);
  }
};

// Asks permission, subscribes this device and saves it on the server.
// Returns 'granted', 'denied' or 'unavailable'.
export const enableNotifications = async () => {
  if (!pushSupported()) return 'unavailable';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;
  try {
    const sub = await getOrCreateSubscription();
    if (!sub) return 'unavailable';
    await axios.post(`${API_BASE}/api/push/subscribe`, { subscription: sub.toJSON() }, authHeaders());
    return 'granted';
  } catch (err) {
    console.error('Could not turn on notifications', err);
    return 'unavailable';
  }
};
