const express = require('express');
const router = express.Router();
const { createEvent, getEvents, getEvent, deleteEvent } = require('../controllers/eventController');
const { protect, isStudent } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', protect, isStudent, createEvent);
router.delete('/:id', protect, isStudent, deleteEvent);

module.exports = router;
