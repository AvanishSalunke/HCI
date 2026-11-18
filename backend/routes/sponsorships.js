const express = require('express');
const router = express.Router();
const {
  createSponsorship,
  getStudentSponsorships,
  getCommitteeSponsorships,
  updateSponsorshipStatus,
} = require('../controllers/sponsorshipController');
const { protect, isTeacher, isStudent } = require('../middleware/authMiddleware');
router.post('/', protect, isStudent, createSponsorship);
router.get('/my-sponsorships', protect, getStudentSponsorships);
router.get('/committee', protect, isTeacher, getCommitteeSponsorships);
router.put('/:id/status', protect, isTeacher, updateSponsorshipStatus);
module.exports = router;
