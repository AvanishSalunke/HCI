const express = require('express');
const router = express.Router();
const { submitFeedback, getCommitteeFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', submitFeedback);
router.get('/', protect, getCommitteeFeedback);

module.exports = router;
