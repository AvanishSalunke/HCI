const Event = require('../models/Event');
const Feedback = require('../models/Feedback');

const MAX_IMAGES = 5;
const MAX_IMAGE_CHARS = 1.5 * 1024 * 1024; // ~1.1 MB image once base64-encoded

// Must end in ".vjti.ac.in" (e.g. name@it.vjti.ac.in).
const VJTI_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)+vjti\.ac\.in$/i;

// Public: anyone with a VJTI email can submit, no login.
const submitFeedback = async (req, res) => {
  try {
    const { eventId, name, email, rating, comments, image, images } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Please enter your name' });
    }
    if (!email || !VJTI_EMAIL.test(String(email).trim())) {
      return res.status(400).json({ message: 'Please use your college email ending in .vjti.ac.in' });
    }
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Please give a rating from 1 to 5' });
    }

    // accept `images` (array) and the older single `image`
    const attachments = (Array.isArray(images) ? images : []).concat(image ? [image] : []);
    if (attachments.length > MAX_IMAGES) {
      return res.status(400).json({ message: `You can attach up to ${MAX_IMAGES} photos` });
    }
    for (const img of attachments) {
      if (typeof img !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/.test(img)) {
        return res.status(400).json({ message: 'Attachments must be PNG, JPG or WebP images' });
      }
      if (img.length > MAX_IMAGE_CHARS) {
        return res.status(400).json({ message: 'One of the attachments is too large' });
      }
    }

    const event = await Event.findById(eventId).select('committee');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await Feedback.create({
      event: event._id,
      committee: event.committee,
      name,
      email,
      rating: stars,
      comments,
      images: attachments,
    });
    res.status(201).json({ message: 'Thank you! Your feedback has been submitted.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' });
    }
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

// Student treasurer and faculty: only their own committee's feedback.
const getCommitteeFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ committee: req.user.committee })
      .sort({ createdAt: -1 })
      .populate('event', 'name date');
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { submitFeedback, getCommitteeFeedback };
