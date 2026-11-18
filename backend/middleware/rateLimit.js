// A small in-memory limiter, enough to slow down password guessing.
// Each key (usually the client address) gets `max` tries per `windowMs`.
const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();

  // forget old entries so the map cannot grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip;
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ message: message || 'Too many attempts. Please try again later.' });
    }
    next();
  };
};

module.exports = rateLimit;
