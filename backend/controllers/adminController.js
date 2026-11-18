const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const Transaction = require('../models/Transaction');
const Sponsorship = require('../models/Sponsorship');
const committees = require('../committees');

const committeeIds = committees.map(c => c.id);

// ---------- Accounts ----------

// Every faculty advisor and student treasurer, for all committees.
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['student', 'teacher'] } })
      .select('-password')
      .sort({ committee: 1, role: 1, username: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const createUser = async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const { password, role, committee } = req.body;
    if (!username || typeof password !== 'string' || password.length < 3) {
      return res.status(400).json({ message: 'Enter a username and a password of at least 3 characters' });
    }
    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or teacher' });
    }
    if (!committeeIds.includes(committee)) {
      return res.status(400).json({ message: 'Choose a valid committee' });
    }
    if (await User.exists({ username })) {
      return res.status(400).json({ message: 'That username is already taken' });
    }
    const salt = await bcrypt.genSalt(10);
    const user = await User.create({
      username,
      password: await bcrypt.hash(password, salt),
      role,
      committee,
    });
    res.status(201).json({ _id: user._id, username: user.username, role: user.role, committee: user.committee });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That username is already taken' });
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be removed here' });
    }
    await user.deleteOne();
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(404).json({ message: 'User not found' });
  }
};

// ---------- Events and feedback ----------

const getEvents = async (req, res) => {
  try {
    const events = await Event.find().select('-poster').sort({ createdAt: -1 }).lean();
    const stats = await Feedback.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 }, average: { $avg: '$rating' } } },
    ]);
    const byEvent = new Map(stats.map(s => [String(s._id), s]));
    res.json(events.map(ev => ({
      ...ev,
      feedbackCount: byEvent.get(String(ev._id))?.count || 0,
      averageRating: byEvent.get(String(ev._id))?.average || null,
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// The admin can delete any event; its feedback goes with it.
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await Feedback.deleteMany({ event: event._id });
    await event.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(404).json({ message: 'Event not found' });
  }
};

const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('event', 'name date');
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// ---------- Approved expenses and confirmed sponsorships ----------

const getApprovals = async (req, res) => {
  try {
    const [expenses, sponsorships] = await Promise.all([
      Transaction.find({ status: 'approved' }).sort({ updatedAt: -1 }).populate('user', 'username').lean(),
      Sponsorship.find({ status: 'confirmed' }).sort({ updatedAt: -1 }).populate('user', 'username').lean(),
    ]);
    res.json({
      expenses,
      sponsorships,
      unread: {
        expenses: expenses.filter(e => !e.adminSeen).length,
        sponsorships: sponsorships.filter(s => !s.adminSeen).length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// body: { type: 'expense' | 'sponsorship', id }  or  { all: true }
const markSeen = async (req, res) => {
  try {
    const { type, id, all } = req.body;
    if (all) {
      await Promise.all([
        Transaction.updateMany({ status: 'approved', adminSeen: { $ne: true } }, { adminSeen: true }),
        Sponsorship.updateMany({ status: 'confirmed', adminSeen: { $ne: true } }, { adminSeen: true }),
      ]);
      return res.json({ message: 'All marked as seen' });
    }
    const Model = type === 'expense' ? Transaction : type === 'sponsorship' ? Sponsorship : null;
    if (!Model) return res.status(400).json({ message: 'Type must be expense or sponsorship' });
    // keep the decision time: only the seen flag changes
    await Model.updateOne({ _id: id }, { adminSeen: true }, { timestamps: false });
    res.json({ message: 'Marked as seen' });
  } catch (err) {
    res.status(400).json({ message: 'Could not update' });
  }
};

module.exports = {
  getUsers, createUser, deleteUser,
  getEvents, deleteEvent, getAllFeedback,
  getApprovals, markSeen,
};
