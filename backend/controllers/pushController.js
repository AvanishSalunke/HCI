const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const { publicKey } = require('../utils/notify');

const getPublicKey = (req, res) => {
  res.json({ publicKey });
};

// Public visitors can subscribe too (they get event and announcement notices).
// If a valid login token is sent, the device is linked to that account.
const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body.subscription || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }

    let user = null;
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer')) {
      try {
        const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        user = await User.findById(decoded.userId).select('role committee');
      } catch {
        user = null; // bad token: treat as a public visitor
      }
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        user: user ? user._id : null,
        role: user ? user.role : '',
        committee: user ? user.committee : '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: 'Subscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const unsubscribe = async (req, res) => {
  try {
    if (req.body.endpoint) await PushSubscription.deleteOne({ endpoint: req.body.endpoint });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getPublicKey, subscribe, unsubscribe };
