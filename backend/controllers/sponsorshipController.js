const Sponsorship = require('../models/Sponsorship');
const Fund = require('../models/Fund');

// Turns a mongoose validation problem into a readable 400 instead of "Server Error".
const sendError = (res, error) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(e => e.message).join('. ');
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(404).json({ message: 'Sponsorship not found' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server Error' });
};

const createSponsorship = async (req, res) => {
  try {
    const {
      companyName, companyOrigin, description, documentLink,
      amountPledged, contactPerson, contactEmail
    } = req.body;
    const value = parseFloat(amountPledged);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: 'Please enter an amount greater than zero' });
    }
    const sponsorship = new Sponsorship({
      companyName, companyOrigin, description,
      documentLink: typeof documentLink === 'string' ? documentLink.trim() : documentLink,
      amountPledged: value,
      contactPerson, contactEmail,
      user: req.user._id,
      committee: req.user.committee,
    });
    const createdSponsorship = await sponsorship.save();
    res.status(201).json(createdSponsorship);
  } catch (error) { sendError(res, error); }
};
const getStudentSponsorships = async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(sponsorships);
  } catch (error) { sendError(res, error); }
};
const getCommitteeSponsorships = async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({ committee: req.user.committee })
      .sort({ createdAt: -1 })
      .populate('user', 'username');
    res.json(sponsorships);
  } catch (error) { sendError(res, error); }
};
const updateSponsorshipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'confirmed') {
      return res.status(400).json({ message: 'Status must be confirmed' });
    }
    const existing = await Sponsorship.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Sponsorship not found' });
    }
    if (existing.committee !== req.user.committee) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    // The pending check is part of the update, so a double click cannot add the amount twice.
    const updatedSponsorship = await Sponsorship.findOneAndUpdate(
      { _id: existing._id, status: 'pending' },
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedSponsorship) {
      return res.status(400).json({ message: 'This sponsorship is already confirmed' });
    }
    await Fund.findOrCreate(req.user.committee);
    await Fund.updateOne(
      { committee: req.user.committee },
      { $inc: { totalFunds: updatedSponsorship.amountPledged } }
    );
    res.json(updatedSponsorship);
  } catch (error) { sendError(res, error); }
};
module.exports = {
  createSponsorship,
  getStudentSponsorships,
  getCommitteeSponsorships,
  updateSponsorshipStatus,
};
