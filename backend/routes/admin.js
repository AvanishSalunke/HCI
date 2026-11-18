const express = require('express');
const router = express.Router();
const {
  getUsers, createUser, deleteUser,
  getEvents, deleteEvent, getAllFeedback,
  getApprovals, markSeen,
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect, isAdmin);

router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

router.get('/events', getEvents);
router.delete('/events/:id', deleteEvent);
router.get('/feedback', getAllFeedback);

router.get('/approvals', getApprovals);
router.put('/approvals/seen', markSeen);

module.exports = router;
