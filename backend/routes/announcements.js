const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, isTeacherOrAdmin } = require('../middleware/authMiddleware');

router.get('/', getAnnouncements);
router.post('/', protect, isTeacherOrAdmin, createAnnouncement);
router.delete('/:id', protect, isTeacherOrAdmin, deleteAnnouncement);

module.exports = router;
