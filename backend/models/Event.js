const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    committee: { type: String, required: true, index: true },
    name: { type: String, required: [true, 'Please add an event name'], trim: true },
    date: { type: String, required: [true, 'Please add the event date'] }, // start date, YYYY-MM-DD
    endDate: { type: String, default: '' }, // last day for multi-day events; empty = single day
    startTime: { type: String, required: [true, 'Please add the start time'] }, // HH:MM
    endTime: { type: String, required: [true, 'Please add the end time'] },
    description: { type: String, trim: true, default: '' },
    poster: { type: String, default: '' }, // image data URL
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
