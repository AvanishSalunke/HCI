const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    committee: { type: String, required: true, index: true },
    name: { type: String, required: [true, 'Please enter your name'], trim: true },
    email: { type: String, required: [true, 'Please enter your email'], lowercase: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, trim: true, default: '' },
    image: { type: String, default: '' }, // legacy single attachment
    images: { type: [String], default: [] }, // optional attachments, image data URLs
  },
  { timestamps: true }
);

// One response per person per event
feedbackSchema.index({ event: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
