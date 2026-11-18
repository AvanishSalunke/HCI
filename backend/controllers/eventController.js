const Event = require('../models/Event');
const Feedback = require('../models/Feedback');

const MAX_POSTER_CHARS = 2 * 1024 * 1024; // ~1.5 MB image once base64-encoded

const createEvent = async (req, res) => {
  try {
    const { name, date, endDate, startTime, endTime, description, poster } = req.body;
    if (!name || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Name, date and timings are required' });
    }
    if (endDate && endDate < date) {
      return res.status(400).json({ message: 'End date cannot be before the start date' });
    }
    if (poster) {
      if (!/^data:image\/(png|jpe?g|webp);base64,/.test(poster)) {
        return res.status(400).json({ message: 'Poster must be a PNG, JPG or WebP image' });
      }
      if (poster.length > MAX_POSTER_CHARS) {
        return res.status(400).json({ message: 'Poster is too large' });
      }
    }
    const event = await Event.create({
      committee: req.user.committee,
      name,
      date,
      endDate: endDate && endDate !== date ? endDate : '',
      startTime,
      endTime,
      description,
      poster: poster || '',
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// Public. Posters are left out of lists unless ?withPoster=1 (they are large).
const getEvents = async (req, res) => {
  try {
    const filter = req.query.committee ? { committee: String(req.query.committee) } : {};
    const query = Event.find(filter).sort({ createdAt: -1 }) // newest logged first;
    if (req.query.withPoster !== '1') query.select('-poster');
    const limit = parseInt(req.query.limit, 10);
    if (limit > 0) query.limit(Math.min(limit, 50));
    res.json(await query);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Public.
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(404).json({ message: 'Event not found' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.committee !== req.user.committee) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (await Feedback.exists({ event: event._id })) {
      return res.status(400).json({ message: 'This event already has feedback and cannot be deleted' });
    }
    await event.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createEvent, getEvents, getEvent, deleteEvent };
