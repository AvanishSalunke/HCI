const Announcement = require('../models/Announcement');
const { notify } = require('../utils/notify');

const createAnnouncement = async (req, res) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!title || !body) {
      return res.status(400).json({ message: 'Please add a title and a body' });
    }
    const announcement = new Announcement({
      title,
      body,
      postedBy: req.user._id,
      // the admin does not belong to a committee; their posts are shown as "Admin"
      committee: req.user.role === 'admin' ? 'admin' : req.user.committee,
    });
    const created = await announcement.save();
    await created.populate('postedBy', 'username committee role');
    notify({}, {
      title: req.user.role === 'admin' ? 'New announcement from Admin' : 'New announcement',
      body: created.title,
      url: '/announcements',
      tag: `announcement-${created._id}`,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server Error' });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('postedBy', 'username committee role');
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });
    // the admin can remove any announcement; faculty only their own committee's
    if (req.user.role !== 'admin' && announcement.committee !== req.user.committee) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await announcement.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement };
